import { pool } from '../config/db.js';
import { ApiError } from '../utils/apiError.js';
import { recordAudit } from './auditService.js';

const PUBLIC_FIELDS = 'id, name, email, role, phone, is_active, is_org_verified, created_at';

export async function listUsers({ role } = {}) {
  const clauses = [];
  const params = [];
  if (role) {
    clauses.push('role = $1');
    params.push(role);
  }
  const where = clauses.length ? `where ${clauses.join(' and ')}` : '';
  const { rows } = await pool.query(`select ${PUBLIC_FIELDS} from users ${where} order by created_at desc limit 500`, params);
  return rows;
}

export async function updateUserRole(id, role, actorId) {
  const { rows } = await pool.query(`update users set role = $1, updated_at = now() where id = $2 returning ${PUBLIC_FIELDS}`, [role, id]);
  if (!rows[0]) throw new ApiError(404, 'User not found');
  await recordAudit({ actorId, action: 'user.role_changed', entityType: 'users', entityId: id, metadata: { new_role: role } });
  return rows[0];
}

export async function setUserActive(id, isActive, actorId) {
  const { rows } = await pool.query(`update users set is_active = $1, updated_at = now() where id = $2 returning ${PUBLIC_FIELDS}`, [isActive, id]);
  if (!rows[0]) throw new ApiError(404, 'User not found');
  await recordAudit({ actorId, action: isActive ? 'user.activated' : 'user.deactivated', entityType: 'users', entityId: id });
  return rows[0];
}

export async function verifyOrganization(id, actorId) {
  const { rows } = await pool.query(`update users set is_org_verified = true, updated_at = now() where id = $1 returning ${PUBLIC_FIELDS}`, [id]);
  if (!rows[0]) throw new ApiError(404, 'User not found');
  await recordAudit({ actorId, action: 'user.org_verified', entityType: 'users', entityId: id });
  return rows[0];
}
