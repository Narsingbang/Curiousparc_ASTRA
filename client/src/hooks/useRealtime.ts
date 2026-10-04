import { useEffect, useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase, isClientMock } from '../lib/supabase';

const CHANNEL_NAME = 'medisync_live_broadcast';

export function broadcastLiveEvent(entity: string) {
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel(CHANNEL_NAME);
      bc.postMessage({ type: 'MEDISYNC_LIVE_UPDATE', entity, timestamp: Date.now() });
      bc.close();
    }
  } catch {
    // fallback if BroadcastChannel unavailable
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('medisync:live_update', { detail: { entity } }));
  }
}

export function useRealtimeSubscription(tables: string[]) {
  const queryClient = useQueryClient();
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Stable key so array recreation on each render doesn't remount channels
  const tableKey = useMemo(() => tables.slice().sort().join(','), [tables]);

  useEffect(() => {
    const tableList = tableKey ? tableKey.split(',') : [];
    if (tableList.length === 0) return;

    const invalidateForTable = (tbl: string) => {
      queryClient.invalidateQueries({ queryKey: [tbl] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });

      if (tbl === 'doctors') {
        queryClient.invalidateQueries({ queryKey: ['doctors'] });
        queryClient.invalidateQueries({ queryKey: ['staff-doctors'] });
      } else if (tbl === 'inventory') {
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        queryClient.invalidateQueries({ queryKey: ['staff-inventory'] });
      } else if (tbl === 'emergency_requests' || tbl === 'emergency-requests') {
        queryClient.invalidateQueries({ queryKey: ['emergency-requests'] });
        queryClient.invalidateQueries({ queryKey: ['emergency_requests'] });
      } else if (tbl === 'patient_records') {
        queryClient.invalidateQueries({ queryKey: ['vault-data'] });
        queryClient.invalidateQueries({ queryKey: ['patient_records'] });
      }
    };

    // 1. Cross-tab BroadcastChannel listener for instant 0ms tab synchronization
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel(CHANNEL_NAME);
        bc.onmessage = (event) => {
          if (event.data?.type === 'MEDISYNC_LIVE_UPDATE') {
            invalidateForTable(event.data.entity);
          }
        };
      } catch {
        // fallback
      }
    }

    const handleCustomEvent = (e: Event) => {
      const entity = (e as CustomEvent)?.detail?.entity;
      if (entity) invalidateForTable(entity);
    };
    window.addEventListener('medisync:live_update', handleCustomEvent);

    // 2. Mock mode polling interval (3s for snappy live demo)
    let pollInterval: any = null;
    if (isClientMock) {
      pollInterval = setInterval(() => {
        tableList.forEach((table) => invalidateForTable(table));
      }, 3000);
    }

    // 3. Supabase Realtime Channels
    const channels = isClientMock
      ? []
      : tableList.map((tableName) => {
          const channel = supabase
            .channel(`public:${tableName}`)
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: tableName },
              () => {
                invalidateForTable(tableName);
              }
            )
            .subscribe((status) => {
              if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                setIsReconnecting(true);
              } else if (status === 'SUBSCRIBED') {
                setIsReconnecting(false);
              }
            });

          return channel;
        });

    return () => {
      if (bc) bc.close();
      window.removeEventListener('medisync:live_update', handleCustomEvent);
      if (pollInterval) clearInterval(pollInterval);
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [tableKey, queryClient]);

  return { isReconnecting };
}
