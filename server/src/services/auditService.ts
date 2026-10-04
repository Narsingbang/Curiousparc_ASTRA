import { supabaseAdmin, isMockSupabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { AuditLogEntry } from '@medisync/shared';

// In-memory fallback logs for testing / mock mode
const inMemoryAuditLogs: AuditLogEntry[] = [
  {
    id: 'mock-audit-1',
    actor_id: 'demo-staff-id',
    actor_name: 'Dr. Ananya Sharma',
    action: 'DOCTOR_STATUS_UPDATE',
    entity: 'doctors',
    entity_id: 'd0000000-0000-0000-0000-000000000001',
    meta: { status: 'AVAILABLE', previous: 'BUSY' },
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'mock-audit-2',
    actor_id: 'demo-staff-id',
    actor_name: 'Dr. Ananya Sharma',
    action: 'INVENTORY_UPDATE',
    entity: 'inventory',
    entity_id: 'i0000000-0000-0000-0000-000000000002',
    meta: { type: 'EMERGENCY_BED', available: 6, total: 20 },
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUuid(id?: string | null): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

export async function logAudit(opts: {
  actorId?: string | null;
  actorName?: string;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: Record<string, any>;
}): Promise<void> {
  const entry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    actor_id: opts.actorId ?? null,
    actor_name: opts.actorName,
    action: opts.action,
    entity: opts.entity,
    entity_id: opts.entityId ?? null,
    meta: opts.meta || {},
    created_at: new Date().toISOString(),
  };

  inMemoryAuditLogs.unshift(entry);
  if (inMemoryAuditLogs.length > 100) inMemoryAuditLogs.pop();

  if (!isMockSupabase) {
    try {
      // In Supabase schema, audit_logs.actor_id and audit_logs.entity_id are UUID columns.
      // If an ID is not a valid UUID (e.g., demo string 'demo-staff-id', 'i00000...'),
      // pass null to avoid Postgres 22P02 syntax errors, while preserving the raw ID in meta.
      const safeActorId = isValidUuid(opts.actorId) ? opts.actorId : null;
      const safeEntityId = isValidUuid(opts.entityId) ? opts.entityId : null;

      const { error } = await supabaseAdmin.from('audit_logs').insert({
        actor_id: safeActorId,
        action: opts.action,
        entity: opts.entity,
        entity_id: safeEntityId,
        meta: {
          ...opts.meta,
          ...(opts.actorId && !safeActorId ? { raw_actor_id: opts.actorId } : {}),
          ...(opts.entityId && !safeEntityId ? { raw_entity_id: opts.entityId } : {}),
          ...(opts.actorName ? { actor_name: opts.actorName } : {}),
        },
      });

      if (error) {
        // An audit log failure must NOT block the main update (log it and continue)
        logger.warn(
          { error: error.message, code: error.code },
          'Supabase audit log insert returned error, ignoring so main operation succeeds'
        );
      }
    } catch (err: any) {
      // An audit log failure must NOT block the main update (log it and continue)
      logger.warn(
        { err: err.message },
        'Audit logging encountered an exception, ignoring so main operation succeeds'
      );
    }
  }
}

export async function getRecentAuditLogs(limit = 20): Promise<AuditLogEntry[]> {
  if (isMockSupabase) {
    return inMemoryAuditLogs.slice(0, limit);
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return inMemoryAuditLogs.slice(0, limit);
    }

    return data as AuditLogEntry[];
  } catch {
    return inMemoryAuditLogs.slice(0, limit);
  }
}
