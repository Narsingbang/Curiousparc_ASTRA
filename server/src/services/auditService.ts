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
      await supabaseAdmin.from('audit_logs').insert({
        actor_id: opts.actorId ?? null,
        action: opts.action,
        entity: opts.entity,
        entity_id: opts.entityId ?? null,
        meta: opts.meta || {},
      });
    } catch (err: any) {
      logger.error({ err: err.message }, 'Failed to write audit log to Supabase');
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
