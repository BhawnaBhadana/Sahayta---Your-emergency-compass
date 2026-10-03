import { pool } from '../config/db.js';
import { ApiError } from '../utils/apiError.js';
import { notifyUser, notifyRoles } from './notificationService.js';
import { recordAudit } from './auditService.js';
import { broadcast } from '../realtime/hub.js';
import { distanceKm } from '../utils/geo.js';

const DUPLICATE_REPORT_RADIUS_KM = 0.3;
const COMMUNITY_VERIFICATION_THRESHOLD = 3;

async function computeSignals(incident) {
  const signals = [];
  if (incident.latitude && incident.longitude) signals.push({ signal_type: 'location_available', detail: 'GPS coordinates captured' });
  if (incident.photo_url) signals.push({ signal_type: 'photo_evidence', detail: incident.photo_url });
  if (incident.video_url) signals.push({ signal_type: 'video_evidence', detail: incident.video_url });
  if (incident.independent_report_count > 1) {
    signals.push({ signal_type: 'independent_reports', detail: `${incident.independent_report_count} independent reports` });
  }
  return signals;
}

export async function createIncident(reporterId, payload) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Merge with any existing unverified/under_review report within ~300m reporting the same emergency_type
    // (plain-JS distance check keeps this independent of Postgres geo extensions)
    const { rows: candidates } = await client.query(
      `select * from incident_reports where status in ('unverified','under_review') and emergency_type = $1`,
      [payload.emergency_type]
    );
    const nearby = candidates.filter(
      (c) => distanceKm(c.latitude, c.longitude, payload.latitude, payload.longitude) < DUPLICATE_REPORT_RADIUS_KM
    );

    let incident;
    let justCommunityVerified = false;
    if (nearby.length) {
      const existing = nearby[0];
      const nextCount = existing.independent_report_count + 1;
      const shouldCommunityVerify = existing.status === 'unverified' && nextCount >= COMMUNITY_VERIFICATION_THRESHOLD;
      justCommunityVerified = shouldCommunityVerify;
      const { rows } = await client.query(
        `update incident_reports set independent_report_count = $1, updated_at = now(),
           status = case when $2 then 'community_verified'::report_status else status end
         where id = $3 returning *`,
        [nextCount, shouldCommunityVerify, existing.id]
      );
      incident = rows[0];
    } else {
      const { rows } = await client.query(
        `insert into incident_reports (reporter_id, emergency_type, severity, title, description, latitude, longitude, address, photo_url, video_url)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`,
        [reporterId, payload.emergency_type, payload.severity, payload.title, payload.description || null, payload.latitude, payload.longitude, payload.address || null, payload.photo_url || null, payload.video_url || null]
      );
      incident = rows[0];
    }

    const signals = await computeSignals(incident);
    for (const s of signals) {
      await client.query(
        `insert into incident_verification_signals (incident_id, signal_type, detail) values ($1,$2,$3)`,
        [incident.id, s.signal_type, s.detail]
      );
    }
    if (justCommunityVerified) {
      await client.query(
        `insert into incident_verification_signals (incident_id, signal_type, detail)
         values ($1,'community_consensus',$2)`,
        [incident.id, `Reached ${incident.independent_report_count} independent reports — community-verified`]
      );
    }

    await client.query('COMMIT');

    await notifyRoles(['responder', 'admin', 'coordinator'], {
      type: 'incident_verification',
      title: justCommunityVerified ? `Community-verified: ${incident.title}` : `New incident report: ${incident.title}`,
      body: `${justCommunityVerified ? 'Reached community consensus' : 'Awaiting verification'} (${incident.independent_report_count} report${incident.independent_report_count > 1 ? 's' : ''})`,
      relatedId: incident.id,
    });
    broadcast('NEW_INCIDENT', incident, { roles: ['responder', 'admin', 'coordinator'] });
    await recordAudit({ actorId: reporterId, action: justCommunityVerified ? 'incident.community_verified' : 'incident.created', entityType: 'incident_reports', entityId: incident.id });

    return incident;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function listIncidents({ status } = {}) {
  const clauses = [];
  const params = [];
  if (status) {
    clauses.push(`status = $1`);
    params.push(status);
  }
  const where = clauses.length ? `where ${clauses.join(' and ')}` : '';
  const { rows } = await pool.query(
    `select ir.*, u.name as reporter_name
     from incident_reports ir
     left join users u on u.id = ir.reporter_id
     ${where}
     order by ir.created_at desc limit 200`,
    params
  );
  return rows;
}

export async function getIncidentDetail(id) {
  const { rows } = await pool.query('select * from incident_reports where id = $1', [id]);
  const incident = rows[0];
  if (!incident) throw new ApiError(404, 'Incident report not found');
  const { rows: signals } = await pool.query('select * from incident_verification_signals where incident_id = $1', [id]);
  return { incident, signals };
}

export async function reviewIncident(id, { action, rejection_reason }, actorId) {
  const { rows: existing } = await pool.query('select * from incident_reports where id = $1', [id]);
  const incident = existing[0];
  if (!incident) throw new ApiError(404, 'Incident report not found');
  if (['authority_verified', 'verified', 'resolved', 'rejected'].includes(incident.status) && action !== 'under_review') {
    throw new ApiError(400, `Incident already ${incident.status.replace('_', ' ')}`);
  }

  // "verify" here means AUTHORITY verification — an authorized human sign-off,
  // distinct from the automatic COMMUNITY verification that happens when
  // enough independent citizen reports converge on the same incident.
  const statusMap = { verify: 'authority_verified', reject: 'rejected', under_review: 'under_review' };
  const nextStatus = statusMap[action];

  const { rows } = await pool.query(
    `update incident_reports
     set status = $1::report_status,
         verified_by = case when $1 = 'authority_verified' then $2::uuid else verified_by end,
         verified_at = case when $1 = 'authority_verified' then now() else verified_at end,
         rejection_reason = case when $1 = 'rejected' then $3 else rejection_reason end,
         updated_at = now()
     where id = $4 returning *`,
    [nextStatus, actorId, rejection_reason || null, id]
  );

  if (nextStatus === 'authority_verified') {
    await pool.query(
      `insert into incident_verification_signals (incident_id, signal_type, detail) values ($1,'responder_confirmation','Authority-verified by authorized responder/coordinator/admin')`,
      [id]
    );
  }

  if (incident.reporter_id) {
    await notifyUser(incident.reporter_id, {
      type: 'incident_verification',
      title: `Your report was ${nextStatus.replace('_', ' ')}`,
      body: incident.title,
      relatedId: id,
    });
  }
  broadcast('INCIDENT_UPDATED', rows[0], {});
  await recordAudit({ actorId, action: `incident.${nextStatus}`, entityType: 'incident_reports', entityId: id });
  return rows[0];
}
