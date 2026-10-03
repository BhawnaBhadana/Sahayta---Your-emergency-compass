import { pool } from '../config/db.js';
import { ApiError } from '../utils/apiError.js';
import { broadcast } from '../realtime/hub.js';

async function getOrCreateGroup(ownerId) {
  const { rows } = await pool.query('select * from family_groups where owner_id = $1', [ownerId]);
  if (rows[0]) return rows[0];
  const { rows: created } = await pool.query(
    'insert into family_groups (owner_id) values ($1) returning *',
    [ownerId]
  );
  return created[0];
}

export async function getMyFamily(ownerId) {
  const group = await getOrCreateGroup(ownerId);
  const { rows: members } = await pool.query(
    'select * from family_members where family_group_id = $1 order by created_at asc',
    [group.id]
  );
  return { group, members };
}

export async function addMember(ownerId, payload) {
  const group = await getOrCreateGroup(ownerId);
  const { rows } = await pool.query(
    `insert into family_members (family_group_id, display_name, phone) values ($1,$2,$3) returning *`,
    [group.id, payload.display_name, payload.phone || null]
  );
  return rows[0];
}

export async function updateMemberStatus(ownerId, memberId, status) {
  const group = await getOrCreateGroup(ownerId);
  const { rows } = await pool.query(
    `update family_members set status = $1, status_updated_at = now()
     where id = $2 and family_group_id = $3 returning *`,
    [status, memberId, group.id]
  );
  if (!rows[0]) throw new ApiError(404, 'Family member not found in your group');
  broadcast('FAMILY_STATUS_UPDATED', rows[0], { userId: ownerId });
  return rows[0];
}

export async function removeMember(ownerId, memberId) {
  const group = await getOrCreateGroup(ownerId);
  await pool.query('delete from family_members where id = $1 and family_group_id = $2', [memberId, group.id]);
}
