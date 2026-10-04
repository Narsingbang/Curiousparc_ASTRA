import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { DoctorListItem } from '../components/dashboard/DoctorList';
import { StaffDoctorControl } from '../components/staff/StaffDoctorControl';
import { StaffInventoryStepper, InventoryItem } from '../components/staff/StaffInventoryStepper';
import { AddDoctorModal } from '../components/staff/AddDoctorModal';
import { AuditFeed } from '../components/staff/AuditFeed';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Stethoscope,
  Bed,
  Plus,
  ShieldCheck,
  Building2,
  Lock,
  RefreshCw,
} from 'lucide-react';

export default function Staff() {
  const { role, profile, token, quickDemoLogin } = useAuthStore();
  const { addToast } = useUiStore();
  const [activeTab, setActiveTab] = useState<'doctors' | 'inventory' | 'audit'>('doctors');
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);
  const [staffCodeInput, setStaffCodeInput] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);

  // Fetch current user and authoritative hospital_id
  const { data: meData, isLoading: isLoadingMe } = useQuery<{
    user: { hospital_id?: string; profile?: { hospital_id?: string; full_name?: string } };
  }>({
    queryKey: ['staff-auth-me'],
    queryFn: () => apiFetch('/auth/me'),
    enabled: role === 'staff' && !!token,
  });

  const staffHospitalId =
    meData?.user?.hospital_id ||
    meData?.user?.profile?.hospital_id ||
    profile?.hospital_id ||
    null;

  // Fetch doctors for own hospital only
  const {
    data: doctorsData,
    refetch: refetchDoctors,
    isFetching: isFetchingDoctors,
  } = useQuery<{ doctors: DoctorListItem[] }>({
    queryKey: ['staff-doctors', staffHospitalId],
    queryFn: () => apiFetch(`/doctors?hospital_id=${staffHospitalId}`),
    enabled: role === 'staff' && !!staffHospitalId,
  });

  // Fetch inventory for own hospital only
  const {
    data: inventoryData,
    refetch: refetchInventory,
    isFetching: isFetchingInventory,
  } = useQuery<{ inventory: InventoryItem[] }>({
    queryKey: ['staff-inventory', staffHospitalId],
    queryFn: () => apiFetch(`/inventory?hospital_id=${staffHospitalId}`),
    enabled: role === 'staff' && !!staffHospitalId,
  });

  // Fetch audit logs
  const {
    data: auditData,
    refetch: refetchAudit,
  } = useQuery<{ logs: any[] }>({
    queryKey: ['staff-audit'],
    queryFn: () => apiFetch('/staff/audit'),
    enabled: role === 'staff',
  });

  const handleClaimStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsClaiming(true);
    try {
      await apiFetch('/auth/claim-staff', {
        method: 'POST',
        body: JSON.stringify({
          code: staffCodeInput.trim(),
          hospital_id: 'a0000000-0000-0000-0000-000000000001',
        }),
      });

      addToast({
        type: 'success',
        title: 'Staff Access Granted',
        message: 'Promoted to hospital staff role successfully.',
      });

      // Reload auth session
      window.location.reload();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Staff Verification Failed',
        message: err.message || 'Invalid staff access code',
      });
    } finally {
      setIsClaiming(false);
    }
  };

  if (role !== 'staff') {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-center shadow-xl space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center">
          <Lock className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
            Staff Access Required
          </h2>
          <p className="text-xs text-slate-500">
            This console is restricted to authorized hospital personnel. Enter the official staff access code or use the quick demo staff profile.
          </p>
        </div>

        <Button
          variant="primary"
          className="w-full font-bold"
          onClick={() => quickDemoLogin('staff')}
        >
          Quick Demo Staff Login
        </Button>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
          <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400">
            OR VERIFY CODE
          </span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
        </div>

        <form onSubmit={handleClaimStaff} className="space-y-3">
          <Input
            placeholder="Enter STAFF_SIGNUP_CODE"
            value={staffCodeInput}
            onChange={(e) => setStaffCodeInput(e.target.value)}
            required
          />
          <Button
            type="submit"
            variant="outline"
            className="w-full"
            isLoading={isClaiming}
          >
            Verify Staff Credentials
          </Button>
        </form>
      </div>
    );
  }

  if (role === 'staff' && !staffHospitalId && !isLoadingMe) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-white dark:bg-navy-900 border border-amber-200 dark:border-amber-800 text-center shadow-xl space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center">
          <Building2 className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">
            No Hospital Assigned
          </h2>
          <p className="text-xs text-slate-500">
            Your staff account is not currently assigned to a hospital facility. Please enter your hospital staff access code below to claim assignment to MediSync Central Hospital.
          </p>
        </div>

        <form onSubmit={handleClaimStaff} className="space-y-3">
          <Input
            placeholder="Enter STAFF_SIGNUP_CODE"
            value={staffCodeInput}
            onChange={(e) => setStaffCodeInput(e.target.value)}
            required
          />
          <Button
            type="submit"
            variant="primary"
            className="w-full font-bold"
            isLoading={isClaiming}
          >
            Claim Hospital Facility
          </Button>
        </form>
      </div>
    );
  }

  const handleRefresh = () => {
    refetchDoctors();
    refetchInventory();
    refetchAudit();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-xs font-bold text-medical-blue mb-2">
            <Building2 className="w-4 h-4" />
            <span>MediSync Central Hospital · Staff Operations Console</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-slate-900 dark:text-white">
            Staff Management Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tap-to-update on-duty doctors, adjust real-time bed inventories, and view operational audit logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={isFetchingDoctors || isFetchingInventory}
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh
          </Button>

          {activeTab === 'doctors' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddDoctorOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Doctor
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('doctors')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'doctors'
              ? 'bg-medical-blue text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          Doctors on Duty ({doctorsData?.doctors?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'inventory'
              ? 'bg-medical-blue text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
          }`}
        >
          <Bed className="w-4 h-4" />
          Beds & Equipment Steppers
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-medical-blue text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Audit Trail ({auditData?.logs?.length || 0})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'doctors' && (
        <StaffDoctorControl
          doctors={doctorsData?.doctors || []}
          onDoctorsUpdated={refetchDoctors}
        />
      )}

      {activeTab === 'inventory' && (
        <StaffInventoryStepper
          inventory={inventoryData?.inventory || []}
          onInventoryUpdated={refetchInventory}
        />
      )}

      {activeTab === 'audit' && (
        <AuditFeed logs={auditData?.logs || []} />
      )}

      {/* Add Doctor Modal */}
      <AddDoctorModal
        isOpen={isAddDoctorOpen}
        onClose={() => setIsAddDoctorOpen(false)}
        onDoctorAdded={refetchDoctors}
        hospitalId={staffHospitalId || 'a0000000-0000-0000-0000-000000000001'}
      />
    </div>
  );
}
