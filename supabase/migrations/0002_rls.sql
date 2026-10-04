alter table public.hospitals          enable row level security;
alter table public.profiles           enable row level security;
alter table public.doctors            enable row level security;
alter table public.inventory          enable row level security;
alter table public.triage_sessions    enable row level security;
alter table public.patient_records    enable row level security;
alter table public.emergency_requests enable row level security;
alter table public.audit_logs         enable row level security;

-- HOSPITALS / DOCTORS / INVENTORY: public read (live dashboard), staff-only write for own hospital
create policy "hospitals_public_read" on public.hospitals for select to anon, authenticated using (true);

create policy "doctors_public_read" on public.doctors for select to anon, authenticated using (true);
create policy "doctors_staff_write" on public.doctors for all to authenticated
  using (public.current_user_role() = 'staff' and hospital_id = public.current_user_hospital())
  with check (public.current_user_role() = 'staff' and hospital_id = public.current_user_hospital());

create policy "inventory_public_read" on public.inventory for select to anon, authenticated using (true);
create policy "inventory_staff_write" on public.inventory for all to authenticated
  using (public.current_user_role() = 'staff' and hospital_id = public.current_user_hospital())
  with check (public.current_user_role() = 'staff' and hospital_id = public.current_user_hospital());

-- PROFILES: own row only (role/hospital changes blocked by trigger)
create policy "profiles_select_own" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- TRIAGE SESSIONS: owner only (anonymous sessions are server-managed via service role and not client-readable)
create policy "triage_owner_all" on public.triage_sessions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- PATIENT RECORDS (HEALTH VAULT): strictly owner only
create policy "records_owner_all" on public.patient_records for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- EMERGENCY REQUESTS: inserts happen via the server (service role). Clients may only read.
create policy "emergency_requester_read" on public.emergency_requests for select to authenticated
  using (requester_id = auth.uid());
create policy "emergency_responder_read" on public.emergency_requests for select to authenticated
  using (public.current_user_role() in ('ambulance','staff'));
-- no client insert/update/delete policies: status changes go through the Express API

-- AUDIT LOGS: staff can read logs for actions in their own hospital's scope; writes via service role only
create policy "audit_staff_read" on public.audit_logs for select to authenticated
  using (public.current_user_role() = 'staff');
