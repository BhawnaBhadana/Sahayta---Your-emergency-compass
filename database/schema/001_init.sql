-- Sahayta core schema
-- Postgres (Supabase-compatible). Run once against a fresh database.

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ============================================================
-- ENUM TYPES
-- ============================================================
create type user_role as enum ('citizen','volunteer','responder','ngo','hospital','admin');
create type emergency_type as enum ('medical','fire','flood','accident','trapped','missing_person','other');
create type severity_level as enum ('low','medium','high','critical');
create type sos_status as enum ('received','triaged','responder_assigned','dispatched','en_route','arrived','resolved','cancelled');
create type report_status as enum ('unverified','under_review','verified','rejected','resolved');
create type shelter_status as enum ('open','full','closed');
create type resource_category as enum ('food','water','medicine','blankets','first_aid','baby_supplies','clothing','other');
create type resource_status as enum ('available','low','critical','out_of_stock');
create type resource_request_status as enum ('requested','approved','dispatched','delivered','rejected');
create type task_type as enum ('food_distribution','medical_assistance','supply_delivery','shelter_support','transportation','search_assistance','road_reporting');
create type task_status as enum ('open','accepted','in_progress','arrived','completed','cancelled');
create type alert_type as enum ('flood_warning','fire','earthquake','cyclone','road_closure','shelter_full','hospital_shortage','resource_shortage','public_safety');
create type missing_person_status as enum ('missing','potential_match','verified','found','closed');
create type notification_type as enum ('sos_update','incident_verification','responder_assignment','shelter_update','emergency_alert','volunteer_assignment','resource_request','route_warning');
create type family_status as enum ('safe','needs_help','not_responded');

-- ============================================================
-- USERS & ROLE PROFILES
-- ============================================================
create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email citext not null unique,
  password_hash text not null,
  role user_role not null default 'citizen',
  phone text,
  is_active boolean not null default true,
  is_org_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table organizations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('ngo','hospital')),
  description text,
  contact_phone text,
  contact_email text,
  address text,
  latitude double precision,
  longitude double precision,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table responder_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  skills text[] not null default '{}',
  is_available boolean not null default true,
  base_latitude double precision,
  base_longitude double precision,
  current_latitude double precision,
  current_longitude double precision,
  last_location_at timestamptz,
  vehicle text,
  updated_at timestamptz not null default now()
);

create table volunteer_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  skills text[] not null default '{}',
  is_available boolean not null default true,
  latitude double precision,
  longitude double precision,
  bio text,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- SOS + INCIDENT PIPELINE (the core loop)
-- ============================================================
create table sos_requests (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, -- e.g. SH-SOS-10482
  citizen_id uuid references users(id) on delete set null,
  emergency_type emergency_type not null,
  severity severity_level not null,
  description text,
  latitude double precision not null,
  longitude double precision not null,
  address text,
  status sos_status not null default 'received',
  assigned_responder_id uuid references users(id),
  assigned_hospital_id uuid references organizations(id),
  assigned_shelter_id uuid,
  audio_url text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table sos_status_events (
  id uuid primary key default gen_random_uuid(),
  sos_id uuid not null references sos_requests(id) on delete cascade,
  status sos_status not null,
  note text,
  actor_id uuid references users(id),
  created_at timestamptz not null default now()
);

create table incident_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references users(id) on delete set null,
  emergency_type emergency_type not null,
  severity severity_level not null default 'medium',
  title text not null,
  description text,
  latitude double precision not null,
  longitude double precision not null,
  address text,
  status report_status not null default 'unverified',
  photo_url text,
  video_url text,
  independent_report_count int not null default 1,
  verified_by uuid references users(id),
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table incident_verification_signals (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references incident_reports(id) on delete cascade,
  signal_type text not null, -- location_available | photo_evidence | independent_reports | responder_confirmation
  detail text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- SHELTERS / HOSPITALS
-- ============================================================
create table shelters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete set null,
  name text not null,
  address text,
  latitude double precision not null,
  longitude double precision not null,
  capacity int not null check (capacity >= 0),
  occupied int not null default 0 check (occupied >= 0),
  status shelter_status not null default 'open',
  has_food boolean not null default false,
  has_water boolean not null default false,
  has_medical boolean not null default false,
  is_women_safe boolean not null default false,
  has_children_area boolean not null default false,
  is_accessible boolean not null default false,
  contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint occupied_lte_capacity check (occupied <= capacity)
);

create table hospitals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete set null,
  name text not null,
  address text,
  latitude double precision not null,
  longitude double precision not null,
  total_beds int not null default 0,
  available_beds int not null default 0 check (available_beds >= 0),
  icu_beds int not null default 0,
  icu_available int not null default 0 check (icu_available >= 0),
  ambulances_available int not null default 0,
  emergency_capacity_status text not null default 'available' check (emergency_capacity_status in ('available','limited','full')),
  contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint beds_available_lte_total check (available_beds <= total_beds),
  constraint icu_available_lte_total check (icu_available <= icu_beds)
);

-- ============================================================
-- RESOURCES + MATCHING
-- ============================================================
create table resources (
  id uuid primary key default gen_random_uuid(),
  provider_org_id uuid references organizations(id) on delete set null,
  shelter_id uuid references shelters(id) on delete set null,
  category resource_category not null,
  name text not null,
  quantity int not null default 0 check (quantity >= 0),
  unit text not null default 'units',
  reserved int not null default 0 check (reserved >= 0),
  status resource_status not null default 'available',
  latitude double precision,
  longitude double precision,
  location_label text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint reserved_lte_quantity check (reserved <= quantity)
);

create table resource_requests (
  id uuid primary key default gen_random_uuid(),
  requesting_shelter_id uuid references shelters(id) on delete cascade,
  fulfilling_resource_id uuid references resources(id),
  category resource_category not null,
  quantity_needed int not null check (quantity_needed > 0),
  status resource_request_status not null default 'requested',
  requested_by uuid references users(id),
  approved_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- VOLUNTEER TASKS
-- ============================================================
create table volunteer_tasks (
  id uuid primary key default gen_random_uuid(),
  type task_type not null,
  title text not null,
  description text,
  latitude double precision,
  longitude double precision,
  address text,
  status task_status not null default 'open',
  assigned_volunteer_id uuid references users(id),
  related_shelter_id uuid references shelters(id),
  related_sos_id uuid references sos_requests(id),
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- ALERTS + NOTIFICATIONS
-- ============================================================
create table alerts (
  id uuid primary key default gen_random_uuid(),
  type alert_type not null,
  title text not null,
  description text,
  severity severity_level not null default 'medium',
  area text,
  latitude double precision,
  longitude double precision,
  radius_km double precision,
  is_verified boolean not null default true,
  issued_by uuid references users(id),
  issued_at timestamptz not null default now(),
  expires_at timestamptz
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  related_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- MISSING PERSONS
-- ============================================================
create table missing_persons (
  id uuid primary key default gen_random_uuid(),
  reported_by uuid references users(id),
  name text not null,
  age int,
  description text,
  last_seen_location text,
  last_seen_at timestamptz,
  photo_url text,
  contact_phone text,
  status missing_person_status not null default 'missing',
  updated_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- FAMILY SAFETY CHECK-IN
-- ============================================================
create table family_groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  name text not null default 'My Family',
  created_at timestamptz not null default now()
);

create table family_members (
  id uuid primary key default gen_random_uuid(),
  family_group_id uuid not null references family_groups(id) on delete cascade,
  member_user_id uuid references users(id),
  display_name text not null,
  phone text,
  status family_status not null default 'not_responded',
  status_updated_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- BLOCKED ROADS (safe route intelligence)
-- ============================================================
create table blocked_roads (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  reason text,
  severity severity_level not null default 'medium',
  is_verified boolean not null default false,
  lat_start double precision not null,
  lng_start double precision not null,
  lat_end double precision not null,
  lng_end double precision not null,
  reported_by uuid references users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_sos_status on sos_requests(status);
create index idx_sos_created on sos_requests(created_at desc);
create index idx_incident_status on incident_reports(status);
create index idx_resources_category on resources(category);
create index idx_notifications_user on notifications(user_id, is_read);
create index idx_alerts_active on alerts(expires_at);
create index idx_tasks_status on volunteer_tasks(status);
create index idx_missing_status on missing_persons(status);
