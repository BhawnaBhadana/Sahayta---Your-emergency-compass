-- Tracks the AI-triage-extracted "people affected" estimate for command-center metrics.
alter table sos_requests add column if not exists affected_count int;
