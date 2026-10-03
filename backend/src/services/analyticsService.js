import { pool } from '../config/db.js';

export async function getCommandCenterMetrics() {
  const [emergencies, sos, responders, shelters, hospitals, resources, unverified, missing, teams, peopleAffected] = await Promise.all([
    pool.query(`select count(*)::int as count from incident_reports where status not in ('resolved','rejected')`),
    pool.query(`select count(*)::int as count from sos_requests where status not in ('resolved','cancelled')`),
    pool.query(`select count(*)::int as count from responder_profiles where is_available = true`),
    pool.query(`select count(*)::int as count from shelters where status = 'open'`),
    pool.query(`select coalesce(sum(available_beds),0)::int as available, coalesce(sum(total_beds),0)::int as total from hospitals`),
    pool.query(`select count(*)::int as count from resources where status in ('critical','out_of_stock')`),
    pool.query(`select count(*)::int as count from incident_reports where status = 'unverified'`),
    pool.query(`select count(*)::int as count from missing_persons where status in ('missing','potential_match')`),
    pool.query(`select
       count(*) filter (where status = 'busy')::int as deployed,
       count(*)::int as total
       from rescue_teams`),
    pool.query(`select coalesce(sum(affected_count),0)::int as total from sos_requests where status not in ('resolved','cancelled')`),
  ]);

  return {
    active_emergencies: emergencies.rows[0].count,
    active_sos: sos.rows[0].count,
    available_responders: responders.rows[0].count,
    active_shelters: shelters.rows[0].count,
    hospital_capacity: {
      available_beds: hospitals.rows[0].available,
      total_beds: hospitals.rows[0].total,
      percent_available: hospitals.rows[0].total > 0
        ? Math.round((hospitals.rows[0].available / hospitals.rows[0].total) * 100)
        : 0,
    },
    critical_resources: resources.rows[0].count,
    unverified_reports: unverified.rows[0].count,
    missing_persons_active: missing.rows[0].count,
    teams_deployed: teams.rows[0].deployed,
    teams_total: teams.rows[0].total,
    people_affected_estimate: peopleAffected.rows[0].total,
  };
}

function avgSeconds(rows) {
  if (!rows.length) return null;
  const total = rows.reduce((sum, r) => sum + Number(r.seconds), 0);
  return Math.round(total / rows.length);
}

function formatDuration(seconds) {
  if (seconds == null) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

export async function getResponseTimeAnalytics() {
  const { rows: assignTimes } = await pool.query(`
    select sos_id, extract(epoch from (min(case when status = 'responder_assigned' then created_at end) -
                                        min(case when status = 'received' then created_at end))) as seconds
    from sos_status_events
    group by sos_id
    having min(case when status = 'responder_assigned' then created_at end) is not null
  `);

  const { rows: resolutionTimes } = await pool.query(`
    select sos_id, extract(epoch from (min(case when status = 'resolved' then created_at end) -
                                        min(case when status = 'received' then created_at end))) as seconds
    from sos_status_events
    group by sos_id
    having min(case when status = 'resolved' then created_at end) is not null
  `);

  const [{ rows: activeCount }, { rows: resolvedCount }] = await Promise.all([
    pool.query(`select count(*)::int as count from sos_requests where status not in ('resolved','cancelled')`),
    pool.query(`select count(*)::int as count from sos_requests where status = 'resolved'`),
  ]);

  const avgResponseSeconds = avgSeconds(assignTimes);
  const avgResolutionSeconds = avgSeconds(resolutionTimes);

  return {
    average_response_time_seconds: avgResponseSeconds,
    average_response_time: formatDuration(avgResponseSeconds),
    average_resolution_time_seconds: avgResolutionSeconds,
    average_resolution_time: formatDuration(avgResolutionSeconds),
    active_cases: activeCount[0].count,
    resolved_cases: resolvedCount[0].count,
    sample_size: assignTimes.length,
  };
}

export async function getIncidentBreakdown() {
  const { rows } = await pool.query(`
    select emergency_type, severity, count(*)::int as count
    from incident_reports
    group by emergency_type, severity
    order by emergency_type
  `);
  return rows;
}

/** Incidents created per day over the last N days — real DB aggregation, not mock series. */
export async function getIncidentsOverTime(days = 14) {
  const { rows } = await pool.query(
    `select date_trunc('day', created_at)::date as day, count(*)::int as count
     from incident_reports
     where created_at > now() - ($1 || ' days')::interval
     group by day order by day asc`,
    [days]
  );
  return rows;
}

export async function getVerificationAndResolutionRates() {
  const { rows } = await pool.query(`
    select
      count(*)::int as total,
      count(*) filter (where status in ('community_verified','authority_verified','verified','resolved'))::int as verified,
      count(*) filter (where status = 'resolved')::int as resolved
    from incident_reports
  `);
  const { total, verified, resolved } = rows[0];
  return {
    total_reports: total,
    verification_rate: total > 0 ? Math.round((verified / total) * 100) : 0,
    resolution_rate: total > 0 ? Math.round((resolved / total) * 100) : 0,
  };
}

export async function getTeamUtilization() {
  const { rows } = await pool.query(`
    select type,
      count(*)::int as total,
      count(*) filter (where status = 'busy')::int as busy
    from rescue_teams
    group by type
  `);
  return rows.map((r) => ({ ...r, utilization_percent: r.total > 0 ? Math.round((r.busy / r.total) * 100) : 0 }));
}

/**
 * Analytical hotspot detection — groups recent verified incidents into a coarse
 * geographic grid (~5km cells) and flags cells whose count exceeds a threshold
 * within the lookback window. This is descriptive clustering over real data,
 * not a predictive model — labeled as such wherever it's shown.
 */
export async function getIncidentHotspots({ hours = 24, threshold = 2, gridSizeDeg = 0.05 } = {}) {
  const { rows } = await pool.query(
    `select latitude, longitude, emergency_type, severity, created_at
     from incident_reports
     where created_at > now() - ($1 || ' hours')::interval
       and status not in ('rejected')`,
    [hours]
  );

  const buckets = new Map();
  for (const r of rows) {
    const cellLat = Math.round(r.latitude / gridSizeDeg) * gridSizeDeg;
    const cellLng = Math.round(r.longitude / gridSizeDeg) * gridSizeDeg;
    const key = `${cellLat.toFixed(3)},${cellLng.toFixed(3)}`;
    if (!buckets.has(key)) buckets.set(key, { latitude: cellLat, longitude: cellLng, count: 0, types: {} });
    const bucket = buckets.get(key);
    bucket.count += 1;
    bucket.types[r.emergency_type] = (bucket.types[r.emergency_type] || 0) + 1;
  }

  return [...buckets.values()]
    .filter((b) => b.count >= threshold)
    .sort((a, b) => b.count - a.count)
    .map((b) => ({
      ...b,
      dominant_type: Object.entries(b.types).sort((a, z) => z[1] - a[1])[0]?.[0],
      note: `Incident activity increased in this area during the last ${hours} hour${hours === 1 ? '' : 's'} (${b.count} reports). Analytical detection, not a guaranteed prediction.`,
    }));
}
