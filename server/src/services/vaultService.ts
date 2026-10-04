import {
  PatientRecord,
  RecordCreateInput,
  RecordUpdateInput,
  UserProfile,
  VaultProfileInput,
} from '@medisync/shared';
import { supabaseAdmin, isMockSupabase } from '../lib/supabase';
import { dbStore, PatientRecordDbRecord } from './dataStore';
import { ApiError } from '../lib/errors';

export async function getVaultData(
  userId: string,
  opts?: {
    severity?: string;
    from?: string;
    to?: string;
  }
): Promise<{
  records: PatientRecord[];
  stats: { total: number; mild: number; severe: number };
}> {
  let records: PatientRecordDbRecord[] = [];

  if (isMockSupabase) {
    records = dbStore.patientRecords.filter((r) => r.user_id === userId);
  } else {
    let query = supabaseAdmin
      .from('patient_records')
      .select('*, doctors(full_name, specialty, hospitals(name))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (opts?.severity) {
      query = query.eq('severity', opts.severity);
    }
    if (opts?.from) {
      query = query.gte('created_at', opts.from);
    }
    if (opts?.to) {
      query = query.lte('created_at', opts.to);
    }

    const { data, error } = await query;
    if (error || !data) {
      records = dbStore.patientRecords.filter((r) => r.user_id === userId);
    } else {
      records = data as any;
    }
  }

  // Filter in-memory if needed
  if (opts?.severity) {
    records = records.filter((r) => r.severity === opts.severity);
  }

  const mapped: PatientRecord[] = records.map((r: any) => ({
    id: r.id,
    user_id: r.user_id,
    source: r.source,
    title: r.title,
    symptoms: r.symptoms,
    severity: r.severity,
    ai_summary: r.ai_summary,
    doctor_id: r.doctor_id,
    doctor_name: r.doctors?.full_name || (r.doctor_id ? 'Dr. Assigned' : null),
    doctor_specialty: r.doctors?.specialty,
    hospital_name: r.doctors?.hospitals?.name,
    triage_session_id: r.triage_session_id,
    notes: r.notes,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));

  const mild = mapped.filter((r) => r.severity === 'MILD').length;
  const severe = mapped.filter((r) => r.severity === 'SEVERE').length;

  return {
    records: mapped,
    stats: {
      total: mapped.length,
      mild,
      severe,
    },
  };
}

export async function createPatientRecord(
  userId: string,
  input: RecordCreateInput
): Promise<PatientRecord> {
  const newRecord: PatientRecordDbRecord = {
    id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    user_id: userId,
    source: input.source || 'MANUAL',
    title: input.title,
    symptoms: input.symptoms || null,
    severity: input.severity || null,
    ai_summary: input.ai_summary || null,
    doctor_id: input.doctor_id || null,
    triage_session_id: input.triage_session_id || null,
    notes: input.notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isMockSupabase) {
    dbStore.patientRecords.unshift(newRecord);
  } else {
    const { data, error } = await supabaseAdmin
      .from('patient_records')
      .insert({
        user_id: userId,
        source: newRecord.source,
        title: newRecord.title,
        symptoms: newRecord.symptoms,
        severity: newRecord.severity,
        ai_summary: newRecord.ai_summary,
        doctor_id: newRecord.doctor_id,
        triage_session_id: newRecord.triage_session_id,
        notes: newRecord.notes,
      })
      .select()
      .single();

    if (error || !data) {
      dbStore.patientRecords.unshift(newRecord);
    } else {
      newRecord.id = data.id;
    }
  }

  return {
    ...newRecord,
    doctor_name: null,
  };
}

export async function updatePatientRecord(
  userId: string,
  recordId: string,
  input: RecordUpdateInput
): Promise<PatientRecord> {
  if (isMockSupabase) {
    const record = dbStore.patientRecords.find(
      (r) => r.id === recordId && r.user_id === userId
    );
    if (!record) {
      throw ApiError.notFound('Record not found or access denied');
    }
    if (input.title !== undefined) record.title = input.title;
    if (input.symptoms !== undefined) record.symptoms = input.symptoms;
    if (input.severity !== undefined) record.severity = input.severity;
    if (input.notes !== undefined) record.notes = input.notes;
    record.updated_at = new Date().toISOString();
    return record;
  }

  const { data, error } = await supabaseAdmin
    .from('patient_records')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', recordId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) {
    throw ApiError.notFound('Record not found or access denied');
  }

  return data as PatientRecord;
}

export async function deletePatientRecord(
  userId: string,
  recordId: string
): Promise<void> {
  if (isMockSupabase) {
    const idx = dbStore.patientRecords.findIndex(
      (r) => r.id === recordId && r.user_id === userId
    );
    if (idx === -1) {
      throw ApiError.notFound('Record not found or access denied');
    }
    dbStore.patientRecords.splice(idx, 1);
    return;
  }

  const { error } = await supabaseAdmin
    .from('patient_records')
    .delete()
    .eq('id', recordId)
    .eq('user_id', userId);

  if (error) {
    throw ApiError.internal('Failed to delete record');
  }
}

export async function updateVaultProfile(
  userId: string,
  input: VaultProfileInput
): Promise<UserProfile> {
  if (isMockSupabase) {
    return {
      id: userId,
      full_name: input.full_name || 'Demo Patient',
      role: 'patient',
      phone: input.phone || null,
      blood_group: input.blood_group || null,
      allergies: input.allergies || [],
      chronic_conditions: input.chronic_conditions || [],
      emergency_contact: input.emergency_contact || null,
    };
  }

  const updateFields: any = {
    updated_at: new Date().toISOString(),
  };
  if (input.full_name) updateFields.full_name = input.full_name;
  if (input.phone !== undefined) updateFields.phone = input.phone;
  if (input.blood_group !== undefined) updateFields.blood_group = input.blood_group;
  if (input.allergies !== undefined) updateFields.allergies = input.allergies;
  if (input.chronic_conditions !== undefined)
    updateFields.chronic_conditions = input.chronic_conditions;
  if (input.emergency_contact !== undefined)
    updateFields.emergency_contact = input.emergency_contact;

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(updateFields)
    .eq('id', userId)
    .select()
    .single();

  if (error || !data) {
    throw ApiError.badRequest('Failed to update profile');
  }

  return data as UserProfile;
}
