import { pool } from '../config/db.js';
import { ApiError } from '../utils/apiError.js';
import { broadcast } from '../realtime/hub.js';
import { recordAudit } from './auditService.js';
import { notifyRoles } from './notificationService.js';

export async function createAlert(payload, issuedBy) {
  const { rows } = await pool.query(
    `insert into alerts (type, title, description, severity, area, latitude, longitude, radius_km, issued_by, expires_at, recommended_action)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning *`,
    [payload.type, payload.title, payload.description || null, payload.severity, payload.area || null,
      payload.latitude || null, payload.longitude || null, payload.radius_km || null, issuedBy, payload.expires_at || null,
      payload.recommended_action || null]
  );
  broadcast('NEW_ALERT', rows[0], {});
  await recordAudit({ actorId: issuedBy, action: 'alert.created', entityType: 'alerts', entityId: rows[0].id });
  return rows[0];
}

export async function listActiveAlerts() {
  const { rows } = await pool.query(
    `select a.*, u.name as issued_by_name from alerts a left join users u on u.id = a.issued_by
     where a.expires_at is null or a.expires_at > now()
     order by a.issued_at desc`
  );
  return rows;
}

export async function expireAlert(id, actorId) {
  const { rows } = await pool.query(`update alerts set expires_at = now(), status = 'resolved' where id = $1 returning *`, [id]);
  broadcast('ALERT_EXPIRED', rows[0], {});
  await recordAudit({ actorId, action: 'alert.expired', entityType: 'alerts', entityId: id });
  return rows[0];
}

async function getAlert(id) {
  const { rows } = await pool.query('select * from alerts where id = $1', [id]);
  if (!rows[0]) throw new ApiError(404, 'Alert not found');
  return rows[0];
}

export async function acknowledgeAlert(id, actorId) {
  await getAlert(id);
  const { rows } = await pool.query(
    `update alerts set status = 'acknowledged', acknowledged_by = $1, acknowledged_at = now() where id = $2 returning *`,
    [actorId, id]
  );
  broadcast('ALERT_UPDATED', rows[0], {});
  await recordAudit({ actorId, action: 'alert.acknowledged', entityType: 'alerts', entityId: id });
  return rows[0];
}

export async function escalateAlert(id, actorId) {
  const alert = await getAlert(id);
  const { rows } = await pool.query(
    `update alerts set status = 'escalated', escalated_by = $1, escalated_at = now() where id = $2 returning *`,
    [actorId, id]
  );
  await notifyRoles(['admin', 'coordinator'], {
    type: 'system',
    title: `Alert escalated: ${alert.title}`,
    body: 'Requires immediate attention.',
    relatedId: id,
  });
  broadcast('ALERT_UPDATED', rows[0], {});
  await recordAudit({ actorId, action: 'alert.escalated', entityType: 'alerts', entityId: id });
  return rows[0];
}

export async function resolveAlert(id, actorId) {
  await getAlert(id);
  const { rows } = await pool.query(
    `update alerts set status = 'resolved', resolved_by = $1, resolved_at = now() where id = $2 returning *`,
    [actorId, id]
  );
  broadcast('ALERT_UPDATED', rows[0], {});
  await recordAudit({ actorId, action: 'alert.resolved', entityType: 'alerts', entityId: id });
  return rows[0];
}
