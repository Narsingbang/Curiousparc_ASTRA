import { useState } from 'react';
import { apiFetch } from '../../lib/api';
import { useUiStore } from '../../store/uiStore';
import { broadcastLiveEvent } from '../../hooks/useRealtime';
import { getResourceStatus } from '../../lib/format';
import { Button } from '../ui/Button';
import { Plus, Minus, Bed, Activity, Truck } from 'lucide-react';

export interface InventoryItem {
  id: string;
  hospital_id: string;
  type: 'AMBULANCE' | 'EMERGENCY_BED' | 'ICU_BED' | 'VENTILATOR';
  total: number;
  available: number;
  location_label?: string;
}

interface StaffInventoryStepperProps {
  inventory: InventoryItem[];
  onInventoryUpdated: () => void;
}

export function StaffInventoryStepper({
  inventory,
  onInventoryUpdated,
}: StaffInventoryStepperProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { addToast } = useUiStore();

  const handleStep = async (item: InventoryItem, delta: number) => {
    const nextAvailable = item.available + delta;
    if (nextAvailable < 0) return;
    if (nextAvailable > item.total) {
      addToast({
        type: 'error',
        title: 'Threshold Limit Exceeded',
        message: 'Available count cannot exceed total capacity.',
      });
      return;
    }

    setUpdatingId(item.id);
    try {
      await apiFetch(`/staff/inventory/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ available: nextAvailable }),
      });

      broadcastLiveEvent('inventory');
      onInventoryUpdated();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Inventory Update Failed',
        message: err.message,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'AMBULANCE':
        return <Truck className="w-5 h-5 text-amber-500" />;
      case 'EMERGENCY_BED':
        return <Bed className="w-5 h-5 text-medical-blue" />;
      case 'ICU_BED':
        return <Bed className="w-5 h-5 text-cyan-500" />;
      case 'VENTILATOR':
        return <Activity className="w-5 h-5 text-emerald-500" />;
      default:
        return <Bed className="w-5 h-5" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {inventory.map((item) => {
        const ratio = item.total > 0 ? item.available / item.total : 0;
        const status = getResourceStatus(ratio);

        return (
          <div
            key={item.id}
            className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-navy-800">
                  {getIcon(item.type)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white font-display">
                    {item.type.replace('_', ' ')}
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Location: {item.location_label || 'Main Hospital Wing'}
                  </span>
                </div>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${status.bgClass} ${status.textClass} ${status.borderClass}`}
              >
                {status.label}
              </span>
            </div>

            {/* Stepper Controls */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Available Units
                </span>
                <div className="text-xl font-black font-display text-slate-900 dark:text-white">
                  {item.available} <span className="text-xs text-slate-400 font-normal">/ {item.total} total</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-xl"
                  disabled={updatingId === item.id || item.available === 0}
                  onClick={() => handleStep(item, -1)}
                >
                  <Minus className="w-4 h-4" />
                </Button>

                <Button
                  variant="primary"
                  size="icon"
                  className="h-9 w-9 rounded-xl"
                  disabled={updatingId === item.id || item.available >= item.total}
                  onClick={() => handleStep(item, 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
