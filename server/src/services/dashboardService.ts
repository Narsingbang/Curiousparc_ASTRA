import { DashboardSummary } from '@medisync/shared';
import { supabaseAdmin, isMockSupabase } from '../lib/supabase';
import { appCache } from '../lib/cache';
import { dbStore } from './dataStore';

const CACHE_KEY = 'dashboard_summary';
const CACHE_TTL_SECONDS = 5;

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const cached = appCache.get<DashboardSummary>(CACHE_KEY);
  if (cached) return cached;

  if (isMockSupabase) {
    const summary = calculateSummaryFromMemory();
    appCache.set(CACHE_KEY, summary, CACHE_TTL_SECONDS);
    return summary;
  }

  try {
    const [doctorsRes, inventoryRes, emergencyRes, triageRes, hospitalsRes] =
      await Promise.all([
        supabaseAdmin.from('doctors').select('status, waiting_count'),
        supabaseAdmin.from('inventory').select('type, total, available'),
        supabaseAdmin
          .from('emergency_requests')
          .select('status, ai_brief')
          .not('status', 'in', '("COMPLETED","CANCELLED")'),
        supabaseAdmin
          .from('triage_sessions')
          .select('severity, status, updated_at')
          .eq('status', 'COMPLETE')
          .gte('updated_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()),
        supabaseAdmin.from('hospitals').select('id', { count: 'exact' }),
      ]);

    if (doctorsRes.error || inventoryRes.error) {
      const summary = calculateSummaryFromMemory();
      appCache.set(CACHE_KEY, summary, CACHE_TTL_SECONDS);
      return summary;
    }

    const doctors = doctorsRes.data || [];
    const inventory = inventoryRes.data || [];
    const emergencies = emergencyRes.data || [];
    const recentTriage = triageRes.data || [];

    const totalDoctors = doctors.length;
    const availableDoctors = doctors.filter((d) => d.status === 'AVAILABLE').length;
    const totalWaiting = doctors.reduce((sum, d) => sum + (d.waiting_count || 0), 0);

    let totalBeds = 0;
    let openBeds = 0;

    const resourceTotals = {
      AMBULANCE: { total: 0, available: 0 },
      EMERGENCY_BED: { total: 0, available: 0 },
      ICU_BED: { total: 0, available: 0 },
      VENTILATOR: { total: 0, available: 0 },
    };

    for (const inv of inventory) {
      const type = inv.type as keyof typeof resourceTotals;
      if (resourceTotals[type]) {
        resourceTotals[type].total += inv.total || 0;
        resourceTotals[type].available += inv.available || 0;
      }
      if (inv.type === 'EMERGENCY_BED' || inv.type === 'ICU_BED') {
        totalBeds += inv.total || 0;
        openBeds += inv.available || 0;
      }
    }

    const emergencyDoctorsCount = doctors.filter((d) => d.status === 'EMERGENCY').length;
    const criticalEmergenciesCount = emergencies.filter(
      (e) => e.ai_brief && (e.ai_brief as any).urgency === 'CRITICAL'
    ).length;
    const severeTriageCount = recentTriage.filter((t) => t.severity === 'SEVERE').length;

    const severeActive = emergencyDoctorsCount + criticalEmergenciesCount + severeTriageCount;

    const summary: DashboardSummary = {
      doctors: {
        available: availableDoctors,
        total: totalDoctors,
        ratio: totalDoctors > 0 ? Math.round((availableDoctors / totalDoctors) * 100) / 100 : 0,
      },
      beds: {
        open: openBeds,
        total: totalBeds,
        ratio: totalBeds > 0 ? Math.round((openBeds / totalBeds) * 100) / 100 : 0,
      },
      waiting: totalWaiting,
      severeActive,
      resources: {
        ambulances: {
          available: resourceTotals.AMBULANCE.available,
          total: resourceTotals.AMBULANCE.total,
          ratio:
            resourceTotals.AMBULANCE.total > 0
              ? Math.round(
                  (resourceTotals.AMBULANCE.available / resourceTotals.AMBULANCE.total) * 100
                ) / 100
              : 0,
        },
        emergencyBeds: {
          available: resourceTotals.EMERGENCY_BED.available,
          total: resourceTotals.EMERGENCY_BED.total,
          ratio:
            resourceTotals.EMERGENCY_BED.total > 0
              ? Math.round(
                  (resourceTotals.EMERGENCY_BED.available /
                    resourceTotals.EMERGENCY_BED.total) *
                    100
                ) / 100
              : 0,
        },
        icuBeds: {
          available: resourceTotals.ICU_BED.available,
          total: resourceTotals.ICU_BED.total,
          ratio:
            resourceTotals.ICU_BED.total > 0
              ? Math.round(
                  (resourceTotals.ICU_BED.available / resourceTotals.ICU_BED.total) * 100
                ) / 100
              : 0,
        },
        ventilators: {
          available: resourceTotals.VENTILATOR.available,
          total: resourceTotals.VENTILATOR.total,
          ratio:
            resourceTotals.VENTILATOR.total > 0
              ? Math.round(
                  (resourceTotals.VENTILATOR.available / resourceTotals.VENTILATOR.total) *
                    100
                ) / 100
              : 0,
        },
      },
      hospitalsCount: hospitalsRes.count || dbStore.hospitals.length,
      lastUpdated: new Date().toISOString(),
    };

    appCache.set(CACHE_KEY, summary, CACHE_TTL_SECONDS);
    return summary;
  } catch {
    const summary = calculateSummaryFromMemory();
    appCache.set(CACHE_KEY, summary, CACHE_TTL_SECONDS);
    return summary;
  }
}

function calculateSummaryFromMemory(): DashboardSummary {
  const doctors = dbStore.doctors;
  const inventory = dbStore.inventory;
  const emergencies = dbStore.emergencyRequests;

  const totalDoctors = doctors.length;
  const availableDoctors = doctors.filter((d) => d.status === 'AVAILABLE').length;
  const totalWaiting = doctors.reduce((sum, d) => sum + d.waiting_count, 0);

  let totalBeds = 0;
  let openBeds = 0;

  const resourceTotals = {
    AMBULANCE: { total: 0, available: 0 },
    EMERGENCY_BED: { total: 0, available: 0 },
    ICU_BED: { total: 0, available: 0 },
    VENTILATOR: { total: 0, available: 0 },
  };

  for (const inv of inventory) {
    if (resourceTotals[inv.type]) {
      resourceTotals[inv.type].total += inv.total;
      resourceTotals[inv.type].available += inv.available;
    }
    if (inv.type === 'EMERGENCY_BED' || inv.type === 'ICU_BED') {
      totalBeds += inv.total;
      openBeds += inv.available;
    }
  }

  const emergencyDoctors = doctors.filter((d) => d.status === 'EMERGENCY').length;
  const criticalRequests = emergencies.filter(
    (e) => e.status !== 'COMPLETED' && e.status !== 'CANCELLED' && e.ai_brief?.urgency === 'CRITICAL'
  ).length;

  const severeActive = emergencyDoctors + criticalRequests;

  return {
    doctors: {
      available: availableDoctors,
      total: totalDoctors,
      ratio: totalDoctors > 0 ? Math.round((availableDoctors / totalDoctors) * 100) / 100 : 0,
    },
    beds: {
      open: openBeds,
      total: totalBeds,
      ratio: totalBeds > 0 ? Math.round((openBeds / totalBeds) * 100) / 100 : 0,
    },
    waiting: totalWaiting,
    severeActive,
    resources: {
      ambulances: {
        available: resourceTotals.AMBULANCE.available,
        total: resourceTotals.AMBULANCE.total,
        ratio:
          resourceTotals.AMBULANCE.total > 0
            ? Math.round(
                (resourceTotals.AMBULANCE.available / resourceTotals.AMBULANCE.total) * 100
              ) / 100
            : 0,
      },
      emergencyBeds: {
        available: resourceTotals.EMERGENCY_BED.available,
        total: resourceTotals.EMERGENCY_BED.total,
        ratio:
          resourceTotals.EMERGENCY_BED.total > 0
            ? Math.round(
                (resourceTotals.EMERGENCY_BED.available / resourceTotals.EMERGENCY_BED.total) *
                  100
              ) / 100
            : 0,
      },
      icuBeds: {
        available: resourceTotals.ICU_BED.available,
        total: resourceTotals.ICU_BED.total,
        ratio:
          resourceTotals.ICU_BED.total > 0
            ? Math.round((resourceTotals.ICU_BED.available / resourceTotals.ICU_BED.total) * 100) /
              100
            : 0,
      },
      ventilators: {
        available: resourceTotals.VENTILATOR.available,
        total: resourceTotals.VENTILATOR.total,
        ratio:
          resourceTotals.VENTILATOR.total > 0
            ? Math.round(
                (resourceTotals.VENTILATOR.available / resourceTotals.VENTILATOR.total) * 100
              ) / 100
            : 0,
      },
    },
    hospitalsCount: dbStore.hospitals.length,
    lastUpdated: new Date().toISOString(),
  };
}
