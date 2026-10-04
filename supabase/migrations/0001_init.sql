-- ============ EXTENSIONS ============
create extension if not exists "pgcrypto";

-- ============ ENUMS ============
create type public.user_role as enum ('patient', 'ambulance', 'staff');
create type public.doctor_level as enum ('SPECIALIST', 'JUNIOR_INTERN');
create type public.doctor_status as enum ('AVAILABLE', 'BUSY', 'IN_SURGERY', 'EMERGENCY', 'OFF_DUTY');
create type public.resource_type as enum ('AMBULANCE', 'EMERGENCY_BED', 'ICU_BED', 'VENTILATOR');
create type public.severity_level as enum ('MILD', 'SEVERE');
create type public.dispatch_status as enum ('PENDING', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'COMPLETED', 'CANCELLED');
create type public.record_source as enum ('TRIAGE', 'MANUAL', 'AMBULANCE');

-- ============ UTILITY: updated_at ============
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ============ TABLES ============
create table public.hospitals (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  city        text not null,
  address     text not null,
  lat         double precision not null check (lat between -90 and 90),
  lng         double precision not null check (lng between -180 and 180),
  phone       text,
  created_at  timestamptz not null default now()
);

create table public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  full_name           text not null check (char_length(full_name) between 2 and 80),
  role                public.user_role not null default 'patient',
  hospital_id         uuid references public.hospitals(id) on delete set null,
  phone               text,
  blood_group         text check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  allergies           text[] not null default '{}',
  chronic_conditions  text[] not null default '{}',
  emergency_contact   jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table public.doctors (
  id               uuid primary key default gen_random_uuid(),
  hospital_id      uuid not null references public.hospitals(id) on delete cascade,
  full_name        text not null,
  specialty        text not null,
  level            public.doctor_level not null,
  status           public.doctor_status not null default 'AVAILABLE',
  wing             text,
  floor            int,
  waiting_count    int not null default 0 check (waiting_count >= 0),
  avg_wait_minutes int not null default 0 check (avg_wait_minutes >= 0),
  updated_at       timestamptz not null default now()
);

create table public.inventory (
  id             uuid primary key default gen_random_uuid(),
  hospital_id    uuid not null references public.hospitals(id) on delete cascade,
  type           public.resource_type not null,
  total          int not null check (total >= 0),
  available      int not null check (available >= 0),
  location_label text,
  updated_at     timestamptz not null default now(),
  constraint inventory_available_lte_total check (available <= total),
  constraint inventory_unique_type unique (hospital_id, type)
);

create table public.triage_sessions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade,
  messages            jsonb not null default '[]'::jsonb,
  severity            public.severity_level,
  is_emergency        boolean not null default false,
  specialty           text,
  red_flags           text[] not null default '{}',
  summary             text,
  recommended_level   public.doctor_level,
  assigned_doctor_id  uuid references public.doctors(id) on delete set null,
  hospital_id         uuid references public.hospitals(id) on delete set null,
  status              text not null default 'OPEN' check (status in ('OPEN','COMPLETE','EXPIRED')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table public.patient_records (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  source              public.record_source not null,
  title               text not null check (char_length(title) between 2 and 160),
  symptoms            text,
  severity            public.severity_level,
  ai_summary          jsonb,
  doctor_id           uuid references public.doctors(id) on delete set null,
  triage_session_id   uuid references public.triage_sessions(id) on delete set null,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table public.emergency_requests (
  id                    uuid primary key default gen_random_uuid(),
  requester_id          uuid references auth.users(id) on delete set null,
  patient_name          text not null,
  phone                 text not null,
  location_text         text not null,
  lat                   double precision check (lat between -90 and 90),
  lng                   double precision check (lng between -180 and 180),
  notes                 text,
  ai_brief              jsonb,
  needs                 text[] not null default '{}',
  status                public.dispatch_status not null default 'PENDING',
  assigned_hospital_id  uuid references public.hospitals(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table public.audit_logs (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references auth.users(id) on delete set null,
  action     text not null,
  entity     text not null,
  entity_id  uuid,
  meta       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============ INDEXES ============
create index idx_doctors_hospital      on public.doctors(hospital_id);
create index idx_doctors_status        on public.doctors(status);
create index idx_inventory_hospital    on public.inventory(hospital_id);
create index idx_triage_user           on public.triage_sessions(user_id, created_at desc);
create index idx_records_user          on public.patient_records(user_id, created_at desc);
create index idx_emergency_status      on public.emergency_requests(status, created_at desc);
create index idx_emergency_requester   on public.emergency_requests(requester_id);
create index idx_audit_created         on public.audit_logs(created_at desc);

-- ============ updated_at TRIGGERS ============
create trigger trg_profiles_touch   before update on public.profiles           for each row execute function public.touch_updated_at();
create trigger trg_doctors_touch    before update on public.doctors            for each row execute function public.touch_updated_at();
create trigger trg_inventory_touch  before update on public.inventory          for each row execute function public.touch_updated_at();
create trigger trg_triage_touch     before update on public.triage_sessions    for each row execute function public.touch_updated_at();
create trigger trg_records_touch    before update on public.patient_records    for each row execute function public.touch_updated_at();
create trigger trg_emergency_touch  before update on public.emergency_requests for each row execute function public.touch_updated_at();

-- ============ NEW USER -> PROFILE ============
-- Only 'patient' and 'ambulance' may be self-selected. 'staff' is granted server-side only.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  requested text := coalesce(new.raw_user_meta_data->>'role', 'patient');
  final_role public.user_role;
begin
  final_role := case when requested = 'ambulance' then 'ambulance'::public.user_role
                     else 'patient'::public.user_role end;
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'full_name',''), 'New User'), final_role);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ PREVENT ROLE / HOSPITAL SELF-ESCALATION ============
create or replace function public.protect_profile_privileged_fields()
returns trigger language plpgsql as $$
begin
  if (new.role is distinct from old.role or new.hospital_id is distinct from old.hospital_id)
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'role and hospital_id can only be changed by the server';
  end if;
  return new;
end $$;

create trigger trg_profiles_protect
  before update on public.profiles
  for each row execute function public.protect_profile_privileged_fields();

-- ============ RLS HELPERS ============
create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.current_user_hospital()
returns uuid language sql stable security definer set search_path = public as $$
  select hospital_id from public.profiles where id = auth.uid()
$$;

-- ============ REALTIME ============
alter publication supabase_realtime add table public.doctors;
alter publication supabase_realtime add table public.inventory;
alter publication supabase_realtime add table public.emergency_requests;

-- ============ SEED DATA ============
insert into public.hospitals (name, city, address, lat, lng, phone) values
  ('MediSync Central Hospital', 'Pune',   'Shivajinagar, Pune',        18.5308, 73.8475, '+912012345678'),
  ('Riverside Care Hospital',   'Pune',   'Kothrud, Pune',             18.5074, 73.8077, '+912098765432'),
  ('Northside Clinic',          'Mumbai', 'Andheri East, Mumbai',      19.1197, 72.8697, '+912211223344');

insert into public.inventory (hospital_id, type, total, available, location_label)
select h.id, v.type::public.resource_type, v.total, v.available, v.label
from public.hospitals h
join (values
  ('MediSync Central Hospital','AMBULANCE',     8, 3, 'Bay'),
  ('MediSync Central Hospital','EMERGENCY_BED',20, 6, 'ER Wing'),
  ('MediSync Central Hospital','ICU_BED',      15, 2, 'ICU'),
  ('MediSync Central Hospital','VENTILATOR',   12, 4, 'ICU'),
  ('Riverside Care Hospital',  'AMBULANCE',     6, 4, 'Bay'),
  ('Riverside Care Hospital',  'EMERGENCY_BED',18, 9, 'ER Wing'),
  ('Riverside Care Hospital',  'ICU_BED',      10, 1, 'ICU'),
  ('Riverside Care Hospital',  'VENTILATOR',    8, 5, 'ICU'),
  ('Northside Clinic',         'AMBULANCE',     4, 2, 'Bay'),
  ('Northside Clinic',         'EMERGENCY_BED',16,11, 'ER Wing'),
  ('Northside Clinic',         'ICU_BED',       8, 0, 'ICU'),
  ('Northside Clinic',         'VENTILATOR',    6, 2, 'ICU')
) as v(hname, type, total, available, label) on v.hname = h.name;

insert into public.doctors (hospital_id, full_name, specialty, level, status, wing, floor, waiting_count, avg_wait_minutes)
select h.id, v.n, v.s, v.l::public.doctor_level, v.st::public.doctor_status, v.w, v.f, v.wc, v.aw
from public.hospitals h
join (values
  ('MediSync Central Hospital','Dr. Aarav Mehta','Cardiology','SPECIALIST','AVAILABLE','Wing A',3,3,15),
  ('MediSync Central Hospital','Dr. Arjun Das','Pulmonology','SPECIALIST','OFF_DUTY','Wing B',3,0,0),
  ('MediSync Central Hospital','Dr. Maya Joshi','General Medicine','JUNIOR_INTERN','AVAILABLE','Wing C',1,4,20),
  ('MediSync Central Hospital','Dr. Neha Patel','Pediatrics','JUNIOR_INTERN','AVAILABLE','Wing C',2,1,8),
  ('MediSync Central Hospital','Dr. Rohan Iyer','Emergency Medicine','SPECIALIST','EMERGENCY','ER Bay 1',0,2,5),
  ('MediSync Central Hospital','Dr. Sara Khan','General Medicine','JUNIOR_INTERN','AVAILABLE','Wing C',1,2,10),
  ('MediSync Central Hospital','Dr. Vikram Rao','Orthopedics','SPECIALIST','AVAILABLE','Wing A',2,5,30),
  ('Riverside Care Hospital','Dr. Mei Tanaka','Pulmonology','SPECIALIST','AVAILABLE','Wing A',1,4,40),
  ('Riverside Care Hospital','Dr. Omar Haddad','Orthopedics','JUNIOR_INTERN','AVAILABLE','Wing B',2,3,25),
  ('Riverside Care Hospital','Dr. Isha Kulkarni','Neurology','SPECIALIST','BUSY','Wing A',3,5,60),
  ('Northside Clinic','Dr. Ethan Brooks','General Medicine','JUNIOR_INTERN','AVAILABLE','Wing A',1,0,5),
  ('Northside Clinic','Dr. Leena Fernandes','Neurology','SPECIALIST','EMERGENCY','Wing B',2,5,60),
  ('Northside Clinic','Dr. Narsing Bang','Psychiatry','SPECIALIST','AVAILABLE','Wing B',1,0,0)
) as v(hname, n, s, l, st, w, f, wc, aw) on v.hname = h.name;
