import { pool } from '../config/db.js';

export async function recordAudit({ actorId, action, entityType, entityId, metadata }) {
  await pool.query(
    `insert into audit_logs (actor_id, action, entity_type, entity_id, metadata)
     values ($1,$2,$3,$4,$5)`,
    [actorId || null, action, entityType, entityId || null, metadata ? JSON.stringify(metadata) : null]
  );
}

export async function listAuditLogs({ limit = 100 } = {}) {
  const { rows } = await pool.query(
    `select al.*, u.name as actor_name, u.role as actor_role
     from audit_logs al
     left join users u on u.id = al.actor_id
     order by al.created_at desc
     limit $1`,
    [limit]
  );
  return rows;
}
