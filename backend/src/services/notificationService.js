import { pool } from '../config/db.js';
import { broadcast } from '../realtime/hub.js';

export async function notifyUser(userId, { type, title, body, relatedId }) {
  const { rows } = await pool.query(
    `insert into notifications (user_id, type, title, body, related_id)
     values ($1,$2,$3,$4,$5) returning *`,
    [userId, type, title, body || null, relatedId || null]
  );
  broadcast('NOTIFICATION', rows[0], { userId });
  return rows[0];
}

export async function notifyRoles(roles, { type, title, body, relatedId }) {
  const { rows } = await pool.query(`select id from users where role = any($1) and is_active = true`, [roles]);
  const notifications = [];
  for (const row of rows) {
    notifications.push(await notifyUser(row.id, { type, title, body, relatedId }));
  }
  return notifications;
}

export async function listNotifications(userId, { unreadOnly } = {}) {
  const clauses = ['user_id = $1'];
  const params = [userId];
  if (unreadOnly) clauses.push('is_read = false');
  const { rows } = await pool.query(
    `select * from notifications where ${clauses.join(' and ')} order by created_at desc limit 100`,
    params
  );
  return rows;
}

export async function markNotificationRead(userId, notificationId) {
  const { rows } = await pool.query(
    `update notifications set is_read = true where id = $1 and user_id = $2 returning *`,
    [notificationId, userId]
  );
  return rows[0];
}

export async function markAllRead(userId) {
  await pool.query(`update notifications set is_read = true where user_id = $1 and is_read = false`, [userId]);
}
