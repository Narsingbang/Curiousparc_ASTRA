import React, { useState } from 'react';
import { UserProfile, VaultProfileInput, BLOOD_GROUPS } from '@medisync/shared';
import { apiFetch } from '../../lib/api';
import { useUiStore } from '../../store/uiStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import {
  User,
  Droplet,
  AlertCircle,
  Activity,
  Phone,
  Edit2,
  ShieldCheck,
} from 'lucide-react';

interface ProfileCardProps {
  profile: UserProfile;
  onProfileUpdated: () => void;
}

export function ProfileCard({ profile, onProfileUpdated }: ProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useUiStore();

  const [formData, setFormData] = useState({
    full_name: profile.full_name || '',
    phone: profile.phone || '',
    blood_group: profile.blood_group || '',
    allergies: (profile.allergies || []).join(', '),
    chronic_conditions: (profile.chronic_conditions || []).join(', '),
    emergency_name: profile.emergency_contact?.name || '',
    emergency_phone: profile.emergency_contact?.phone || '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload: VaultProfileInput = {
        full_name: formData.full_name,
        phone: formData.phone || null,
        blood_group: (formData.blood_group as any) || null,
        allergies: formData.allergies
          ? formData.allergies.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        chronic_conditions: formData.chronic_conditions
          ? formData.chronic_conditions.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        emergency_contact: formData.emergency_name
          ? {
              name: formData.emergency_name,
              phone: formData.emergency_phone,
            }
          : null,
      };

      await apiFetch('/vault/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      addToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your health vault profile has been saved.',
      });

      setIsEditing(false);
      onProfileUpdated();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Could not save profile',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-navy-900/90 backdrop-blur-md p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-medical-blue to-cyan-400 flex items-center justify-center text-white font-bold text-lg shadow-glow-blue">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white">
                {profile.full_name}
              </h3>
              <p className="text-xs text-slate-400">
                Encrypted Universal Health Profile · {profile.phone || 'No phone set'}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-xs"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1.5" />
            Edit Profile
          </Button>
        </div>

        {/* Profile Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 text-xs">
          {/* Blood Group */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Droplet className="w-3.5 h-3.5 text-rose-500" />
              Blood Group
            </span>
            <span className="text-lg font-black text-rose-600 dark:text-rose-400 mt-1 block">
              {profile.blood_group || 'Not recorded'}
            </span>
          </div>

          {/* Allergies */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              Allergies
            </span>
            <div className="mt-1 flex flex-wrap gap-1">
              {profile.allergies && profile.allergies.length > 0 ? (
                profile.allergies.map((a, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                  >
                    {a}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 italic">None reported</span>
              )}
            </div>
          </div>

          {/* Chronic Conditions */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-medical-blue" />
              Chronic Conditions
            </span>
            <div className="mt-1 flex flex-wrap gap-1">
              {profile.chronic_conditions && profile.chronic_conditions.length > 0 ? (
                profile.chronic_conditions.map((c, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-cyan-300"
                  >
                    {c}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 italic">None reported</span>
              )}
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-emerald-500" />
              Emergency Contact
            </span>
            {profile.emergency_contact?.name ? (
              <div className="mt-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  {profile.emergency_contact.name}
                </span>
                <a
                  href={`tel:${profile.emergency_contact.phone}`}
                  className="text-medical-blue hover:underline text-[11px]"
                >
                  {profile.emergency_contact.phone}
                </a>
              </div>
            ) : (
              <span className="text-slate-400 italic mt-1 block">Not set</span>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title="Edit Health Vault Profile"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Full Name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
          />

          <Input
            label="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Blood Group
            </label>
            <select
              value={formData.blood_group}
              onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-800 px-4 py-2.5 text-sm"
            >
              <option value="">Select Blood Group</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Allergies (comma-separated)"
            placeholder="e.g. Penicillin, Peanuts, Sulfa"
            value={formData.allergies}
            onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
          />

          <Input
            label="Chronic Conditions (comma-separated)"
            placeholder="e.g. Hypertension, Asthma, Type 2 Diabetes"
            value={formData.chronic_conditions}
            onChange={(e) =>
              setFormData({ ...formData, chronic_conditions: e.target.value })
            }
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Contact Person Name"
              placeholder="e.g. Parent or Spouse"
              value={formData.emergency_name}
              onChange={(e) =>
                setFormData({ ...formData, emergency_name: e.target.value })
              }
            />
            <Input
              label="Contact Phone"
              placeholder="+91..."
              value={formData.emergency_phone}
              onChange={(e) =>
                setFormData({ ...formData, emergency_phone: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              Save Profile
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
