import { pool } from '../config/db.js';
import { ApiError } from '../utils/apiError.js';
import { sortByDistance } from '../utils/geo.js';
import { notifyRoles, notifyUser } from './notificationService.js';
import { recordAudit } from './auditService.js';
import { broadcast } from '../realtime/hub.js';

const PREFERRED_TEAM_TYPE = {
  medical: 'medical',
  fire: 'fire_rescue',
  flood: 'flood_rescue',
  trapped: 'search_rescue',
  accident: 'medical',
  road_blockage: 'general',
  infrastructure_damage: 'search_rescue',
  missing_person: 'search_rescue',
  other: 'general',
};

const ASSIGNMENT_TRANSITIONS = {
  assigned: ['dispatched', 'cancelled'],
  dispatched: ['en_route', 'cancelled'],
  en_route: ['arrived', 'cancelled'],
  arrived: ['completed'],
  completed: [],
  cancelled: [],
};

export async function createTeam(payload) {
  const { rows } = await pool.query(
    `insert into rescue_teams (team_code, name, type, capabilities, equipment, base_latitude, base_longitude, current_latitude, current_longitude, contact_phone)
     values ($1,$2,$3,$4,$5,$6,$7,$6,$7,$8) returning *`,
    [payload.team_code, payload.name, payload.type, payload.capabilities || [], payload.equipment || [],
      payload.base_latitude ?? null, payload.base_longitude ?? null, payload.contact_phone || null]
  );
  return rows[0];
}

export async function listTeams({ status } = {}) {
  const clauses = [];
  const params = [];
  if (status) {
    clauses.push('status = $1');
    params.push(status);
  }
  const where = clauses.length ? `where ${clauses.join(' and ')}` : '';
  const { rows } = await pool.query(
    `select t.*, u.name as leader_name from rescue_teams t left join users u on u.id = t.leader_user_id ${where} order by t.status asc, t.name asc`,
    params
  );
  return rows;
}

export async function getTeam(id) {
  const { rows } = await pool.query('select * from rescue_teams where id = $1', [id]);
  if (!rows[0]) throw new ApiError(404, 'Rescue team not found');
  return rows[0];
}

export async function recommendTeams({ latitude, longitude, emergencyType, limit = 5 }) {
  const { rows } = await pool.query(
    `select * from rescue_teams where current_latitude is not null and status != 'maintenance'`
  );
  const preferredType = PREFERRED_TEAM_TYPE[emergencyType] || 'general';
  const withDistance = sortByDistance(rows, latitude, longitude, 'current_latitude', 'current_longitude');

  const ranked = withDistance
    .map((t) => ({
      ...t,
      capability_match: t.type === preferredType,
      eta_minutes: Math.max(4, Math.round((t.distance_km / 30) * 60)),
    }))
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'available' ? -1 : 1;
      if (a.capability_match !== b.capability_match) return b.capability_match - a.capability_match;
      return a.distance_km - b.distance_km;
    });

  return ranked.slice(0, limit);
}

export async function updateTeam(id, updates) {
  const fields = [];
  const params = [];
  let i = 1;
  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = $${i}`);
    params.push(value);
    i += 1;
  }
  if (!fields.length) return getTeam(id);
  fields.push('updated_at = now()');
  params.push(id);
  const { rows } = await pool.query(`update rescue_teams set ${fields.join(', ')} where id = $${i} returning *`, params);
  if (!rows[0]) throw new ApiError(404, 'Rescue team not found');
  broadcast('TEAM_UPDATED', rows[0], {});
  return rows[0];
}

export async function assignTeam({ teamId, sosId, incidentId, notes }, actorId) {
  const team = await getTeam(teamId);
  if (team.status === 'maintenance') throw new ApiError(400, 'Team is under maintenance and cannot be assigned.');
  if (!sosId && !incidentId) throw new ApiError(400, 'Either sos_id or incident_id is required.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `insert into team_assignments (team_id, sos_id, incident_id, assigned_by, notes)
       values ($1,$2,$3,$4,$5) returning *`,
      [teamId, sosId || null, incidentId || null, actorId, notes || null]
    );
    await client.query(`update rescue_teams set status = 'busy', updated_at = now() where id = $1`, [teamId]);
    await client.query('COMMIT');

    const assignment = rows[0];
    if (team.leader_user_id) {
      await notifyUser(team.leader_user_id, {
        type: 'team_assignment',
        title: `Team ${team.team_code} assigned to a new incident`,
        relatedId: assignment.id,
      });
    }
    await notifyRoles(['coordinator', 'admin'], {
      type: 'team_assignment',
      title: `Team ${team.team_code} (${team.name}) dispatched`,
      relatedId: assignment.id,
    });
    broadcast('TEAM_ASSIGNED', { assignment, team_code: team.team_code }, {});
    await recordAudit({ actorId, action: 'team.assigned', entityType: 'rescue_teams', entityId: teamId, metadata: { sosId, incidentId } });
    return assignment;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateAssignmentStatus(assignmentId, nextStatus, actorId) {
  const { rows: existing } = await pool.query('select * from team_assignments where id = $1', [assignmentId]);
  const assignment = existing[0];
  if (!assignment) throw new ApiError(404, 'Assignment not found');

  const allowed = ASSIGNMENT_TRANSITIONS[assignment.status] || [];
  if (!allowed.includes(nextStatus)) {
    throw new ApiError(400, `Cannot move assignment from ${assignment.status} to ${nextStatus}`);
  }

  const timestampColumn = { dispatched: 'dispatched_at', arrived: 'arrived_at', completed: 'completed_at' }[nextStatus];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const setTimestamp = timestampColumn ? `, ${timestampColumn} = now()` : '';
    const { rows } = await client.query(
      `update team_assignments set status = $1, updated_at = now() ${setTimestamp} where id = $2 returning *`,
      [nextStatus, assignmentId]
    );
    if (['completed', 'cancelled'].includes(nextStatus)) {
      await client.query(`update rescue_teams set status = 'available', updated_at = now() where id = $1`, [assignment.team_id]);
    }
    await client.query('COMMIT');

    broadcast(nextStatus === 'arrived' ? 'TEAM_ARRIVED' : 'TEAM_UPDATED', rows[0], {});
    await recordAudit({ actorId, action: `team_assignment.${nextStatus}`, entityType: 'team_assignments', entityId: assignmentId });
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function listAssignments({ teamId, sosId } = {}) {
  const clauses = [];
  const params = [];
  if (teamId) { clauses.push(`ta.team_id = $${params.length + 1}`); params.push(teamId); }
  if (sosId) { clauses.push(`ta.sos_id = $${params.length + 1}`); params.push(sosId); }
  const where = clauses.length ? `where ${clauses.join(' and ')}` : '';
  const { rows } = await pool.query(
    `select ta.*, rt.team_code, rt.name as team_name, rt.type as team_type
     from team_assignments ta join rescue_teams rt on rt.id = ta.team_id
     ${where} order by ta.assigned_at desc`,
    params
  );
  return rows;
}
