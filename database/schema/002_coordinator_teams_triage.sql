-- Adds: coordinator role, rescue team dispatch, AI-triage fields, richer alert
-- lifecycle, expanded verification/emergency/missing-person/notification enums.

-- ============================================================
-- ENUM EXTENSIONS
-- ============================================================
alter type user_role add value if not exists 'coordinator';

alter type emergency_type add value if not exists 'road_blockage';
alter type emergency_type add value if not exists 'infrastructure_damage';

-- Verification pipeline: distinguish community consensus from authority sign-off.
alter type report_status add value if not exists 'community_verified';
alter type report_status add value if not exists 'authority_verified';

alter type missing_person_status add value if not exists 'located';
alter type missing_person_status add value if not exists 'identity_verified';
alter type missing_person_status add value if not exists 'reunited';

alter type notification_type add value if not exists 'system';
alter type notification_type add value if not exists 'team_assignment';

-- ============================================================
-- RESCUE TEAMS
-- ============================================================
create type team_type as enum ('medical', 'fire_rescue', 'flood_rescue', 'search_rescue', 'general');
create type team_status as enum ('available', 'busy', 'off_duty', 'maintenance');
create type assignment_status as enum ('assigned', 'dispatched', 'en_route', 'arrived', 'completed', 'cancelled');

create table if not exists rescue_teams (
  id uuid primary key default gen_random_uuid(),
  team_code text not null unique,
  name text not null,
  type team_type not null default 'general',
  capabilities text[] not null default '{}',
  equipment text[] not null default '{}',
  status team_status not null default 'available',
  current_latitude double precision,
  current_longitude double precision,
  base_latitude double precision,
  base_longitude double precision,
  leader_user_id uuid references users(id),
  contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists team_assignments (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references rescue_teams(id) on delete cascade,
  sos_id uuid references sos_requests(id) on delete cascade,
  incident_id uuid references incident_reports(id) on delete cascade,
  status assignment_status not null default 'assigned',
  assigned_by uuid references users(id),
  notes text,
  assigned_at timestamptz not null default now(),
  dispatched_at timestamptz,
  arrived_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint team_assignment_target check (sos_id is not null or incident_id is not null)
);

create index if not exists idx_team_assignments_team on team_assignments(team_id);
create index if not exists idx_rescue_teams_status on rescue_teams(status);

-- ============================================================
-- AI-ASSISTED TRIAGE (rule-based reasoning engine, human-confirmed)
-- ============================================================
alter table sos_requests add column if not exists triage_priority severity_level;
alter table sos_requests add column if not exists triage_reasoning text;
alter table sos_requests add column if not exists triage_recommended_response text[];
alter table sos_requests add column if not exists triage_required_resources text[];
alter table sos_requests add column if not exists triage_generated_at timestamptz;
alter table sos_requests add column if not exists triage_confirmed_by uuid references users(id);
alter table sos_requests add column if not exists triage_confirmed_at timestamptz;

-- ============================================================
-- ALERT LIFECYCLE
-- ============================================================
create type alert_status as enum ('active', 'acknowledged', 'escalated', 'resolved');

alter table alerts add column if not exists recommended_action text;
alter table alerts add column if not exists evidence_url text;
alter table alerts add column if not exists status alert_status not null default 'active';
alter table alerts add column if not exists acknowledged_by uuid references users(id);
alter table alerts add column if not exists acknowledged_at timestamptz;
alter table alerts add column if not exists escalated_by uuid references users(id);
alter table alerts add column if not exists escalated_at timestamptz;
alter table alerts add column if not exists resolved_by uuid references users(id);
alter table alerts add column if not exists resolved_at timestamptz;
