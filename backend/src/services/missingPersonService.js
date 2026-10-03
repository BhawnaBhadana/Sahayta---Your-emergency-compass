import { pool } from '../config/db.js';
import { ApiError } from '../utils/apiError.js';
import { broadcast } from '../realtime/hub.js';
import { notifyRoles } from './notificationService.js';

export async function reportMissingPerson(payload, reportedBy) {
  const { rows } = await pool.query(
    `insert into missing_persons (reported_by, name, age, description, last_seen_location, last_seen_at, photo_url, contact_phone)
     values ($1,$2,$3,$4,$5,$6,$7,$8) returning *`,
    [reportedBy, payload.name, payload.age || null, payload.description || null, payload.last_seen_location || null,
      payload.last_seen_at || null, payload.photo_url || null, payload.contact_phone || null]
  );
  broadcast('NEW_MISSING_PERSON', rows[0], { roles: ['responder', 'admin'] });
  await notifyRoles(['responder', 'admin'], {
    type: 'incident_verification',
    title: `Missing person reported: ${rows[0].name}`,
    body: payload.last_seen_location,
    relatedId: rows[0].id,
  });
  return rows[0];
}

export async function listMissingPersons({ status } = {}) {
  const clauses = [];
  const params = [];
  if (status) {
    clauses.push('status = $1');
    params.push(status);
  }
  const where = clauses.length ? `where ${clauses.join(' and ')}` : '';
  const { rows } = await pool.query(`select * from missing_persons ${where} order by created_at desc`, params);
  return rows;
}

export async function updateMissingPersonStatus(id, status, actorId) {
  const { rows } = await pool.query(
    `update missing_persons set status = $1, updated_by = $2, updated_at = now() where id = $3 returning *`,
    [status, actorId, id]
  );
  if (!rows[0]) throw new ApiError(404, 'Missing person record not found');
  broadcast('MISSING_PERSON_UPDATED', rows[0], {});
  return rows[0];
}
