import { pool } from '../config/db.js';
import { ApiError } from '../utils/apiError.js';
import { generateSosCode } from '../utils/codes.js';
import { sortByDistance } from '../utils/geo.js';
import { recommendResponders } from './responderService.js';
import { notifyUser, notifyRoles } from './notificationService.js';
import { recordAudit } from './auditService.js';
import { broadcast } from '../realtime/hub.js';
import { computeTriage } from './triageService.js';

const VALID_TRANSITIONS = {
  received: ['triaged', 'cancelled'],
  triaged: ['responder_assigned', 'cancelled'],
  responder_assigned: ['dispatched', 'cancelled'],
  dispatched: ['en_route', 'cancelled'],
  en_route: ['arrived', 'cancelled'],
  arrived: ['resolved'],
  resolved: [],
  cancelled: [],
};

async function addStatusEvent(client, sosId, status, note, actorId) {
  await client.query(
    `insert into sos_status_events (sos_id, status, note, actor_id) values ($1,$2,$3,$4)`,
    [sosId, status, note || null, actorId || null]
  );
}

export async function createSos(citizenId, payload) {
  const code = generateSosCode();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `insert into sos_requests (code, citizen_id, emergency_type, severity, description, latitude, longitude, address)
       values ($1,$2,$3,$4,$5,$6,$7,$8) returning *`,
      [code, citizenId, payload.emergency_type, payload.severity, payload.description || '', payload.latitude, payload.longitude, payload.address || null]
    );
    const sos = rows[0];
    await addStatusEvent(client, sos.id, 'received', 'SOS received by Sahayta', citizenId);

    // AI-assisted triage: a rule-based reasoning pass over the reported data.
    // This never changes anything by itself — a human still confirms it (see confirmTriage).
    const triage = computeTriage(payload);
    const { rows: triageRows } = await client.query(
      `update sos_requests set
         status = 'triaged',
         triage_priority = $1,
         triage_reasoning = $2,
         triage_recommended_response = $3,
         triage_required_resources = $4,
         triage_generated_at = now(),
         affected_count = $5
       where id = $6 returning *`,
      [triage.priority, triage.reasoning, triage.recommended_response, triage.required_resources, triage.affected_count, sos.id]
    );
    await addStatusEvent(client, sos.id, 'triaged', 'Auto-triaged from reported severity/type', null);

    await client.query('COMMIT');
    Object.assign(sos, triageRows[0]);

    // Fan out: nearby hospital (medical), nearest shelter suggestion (flood), recommended responders
    const [hospital, shelter, responders] = await Promise.all([
      findNearestHospital(sos.latitude, sos.longitude),
      payload.emergency_type === 'flood' ? findNearestShelter(sos.latitude, sos.longitude) : null,
      recommendResponders({ latitude: sos.latitude, longitude: sos.longitude, emergencyType: sos.emergency_type }),
    ]);

    await notifyRoles(['responder', 'admin', 'coordinator'], {
      type: 'sos_update',
      title: `New ${triage.priority.toUpperCase()} ${sos.emergency_type} SOS`,
      body: `${code} reported near ${sos.address || `${sos.latitude.toFixed(3)}, ${sos.longitude.toFixed(3)}`}`,
      relatedId: sos.id,
    });

    broadcast('NEW_SOS', sos, { roles: ['responder', 'admin', 'coordinator'] });
    await recordAudit({ actorId: citizenId, action: 'sos.created', entityType: 'sos_requests', entityId: sos.id, metadata: { triage_priority: triage.priority } });

    return {
      sos,
      triage,
      recommended_hospital: hospital,
      recommended_shelter: shelter,
      recommended_responders: responders,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function findNearestHospital(lat, lng) {
  const { rows } = await pool.query(`select * from hospitals where available_beds > 0`);
  if (!rows.length) return null;
  return sortByDistance(rows, lat, lng)[0];
}

export async function findNearestShelter(lat, lng) {
  const { rows } = await pool.query(`select * from shelters where status = 'open' and occupied < capacity`);
  if (!rows.length) return null;
  return sortByDistance(rows, lat, lng)[0];
}

export async function listSos({ role, userId, status }) {
  const clauses = [];
  const params = [];
  let i = 1;

  if (role === 'citizen') {
    clauses.push(`citizen_id = $${i++}`);
    params.push(userId);
  } else if (role === 'responder') {
    // responders see all triaged+ SOS so they can pick up work, plus ones assigned to them
  }

  if (status) {
    clauses.push(`status = $${i++}`);
    params.push(status);
  }

  const where = clauses.length ? `where ${clauses.join(' and ')}` : '';
  const { rows } = await pool.query(
    `select s.*, u.name as citizen_name, r.name as responder_name
     from sos_requests s
     left join users u on u.id = s.citizen_id
     left join users r on r.id = s.assigned_responder_id
     ${where}
     order by s.created_at desc limit 200`,
    params
  );
  return rows;
}

const RESTRICTED_INFO_ROLES = ['responder', 'coordinator', 'admin'];

export async function getSosDetail(id, requester) {
  const { rows } = await pool.query(
    `select s.*, u.name as citizen_name, u.phone as citizen_phone, r.name as responder_name, r.phone as responder_phone
     from sos_requests s
     left join users u on u.id = s.citizen_id
     left join users r on r.id = s.assigned_responder_id
     where s.id = $1`,
    [id]
  );
  const sos = rows[0];
  if (!sos) throw new ApiError(404, 'SOS request not found');

  // Phone numbers are restricted information: visible only to the citizen who
  // owns the SOS, or to responders/coordinators/admins actually handling it.
  const isOwner = requester?.id && requester.id === sos.citizen_id;
  const isAuthority = requester?.role && RESTRICTED_INFO_ROLES.includes(requester.role);
  if (!isOwner && !isAuthority) {
    sos.citizen_phone = null;
    sos.responder_phone = null;
  }

  const { rows: history } = await pool.query(
    `select * from sos_status_events where sos_id = $1 order by created_at asc`,
    [id]
  );
  return { sos, history };
}

export async function assignResponder(sosId, responderId, actorId) {
  const { rows: sosRows } = await pool.query('select * from sos_requests where id = $1', [sosId]);
  const sos = sosRows[0];
  if (!sos) throw new ApiError(404, 'SOS request not found');
  if (!['triaged', 'responder_assigned'].includes(sos.status)) {
    throw new ApiError(400, `Cannot assign a responder while status is ${sos.status}`);
  }

  const { rows: responderRows } = await pool.query(
    `select u.id, u.name from users u where u.id = $1 and u.role = 'responder' and u.is_active = true`,
    [responderId]
  );
  if (!responderRows[0]) throw new ApiError(404, 'Responder not found or inactive');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `update sos_requests set assigned_responder_id = $1, status = 'responder_assigned', updated_at = now()
       where id = $2 returning *`,
      [responderId, sosId]
    );
    await addStatusEvent(client, sosId, 'responder_assigned', `${responderRows[0].name} assigned`, actorId);
    await client.query('COMMIT');

    if (sos.citizen_id) {
      await notifyUser(sos.citizen_id, {
        type: 'responder_assignment',
        title: 'Responder assigned to your SOS',
        body: `${responderRows[0].name} has been assigned to ${sos.code}.`,
        relatedId: sosId,
      });
    }
    await notifyUser(responderId, {
      type: 'sos_update',
      title: `You were assigned to ${sos.code}`,
      body: sos.description || `${sos.emergency_type} emergency`,
      relatedId: sosId,
    });
    broadcast('SOS_UPDATED', rows[0], {});
    await recordAudit({ actorId, action: 'sos.responder_assigned', entityType: 'sos_requests', entityId: sosId, metadata: { responderId } });
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateStatus(sosId, nextStatus, note, actorId) {
  const { rows: sosRows } = await pool.query('select * from sos_requests where id = $1', [sosId]);
  const sos = sosRows[0];
  if (!sos) throw new ApiError(404, 'SOS request not found');

  const allowed = VALID_TRANSITIONS[sos.status] || [];
  if (!allowed.includes(nextStatus)) {
    throw new ApiError(400, `Cannot move SOS from ${sos.status} to ${nextStatus}`);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `update sos_requests set status = $1, updated_at = now() where id = $2 returning *`,
      [nextStatus, sosId]
    );
    await addStatusEvent(client, sosId, nextStatus, note, actorId);
    await client.query('COMMIT');

    if (sos.citizen_id) {
      await notifyUser(sos.citizen_id, {
        type: 'sos_update',
        title: `SOS ${sos.code}: ${nextStatus.replace('_', ' ')}`,
        body: note || undefined,
        relatedId: sosId,
      });
    }
    broadcast('SOS_UPDATED', rows[0], {});
    await recordAudit({ actorId, action: `sos.status.${nextStatus}`, entityType: 'sos_requests', entityId: sosId });
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * A human responder/coordinator/admin explicitly confirms (or overrides) the
 * AI-assisted triage priority before it's treated as authoritative. The
 * rule-based recommendation never applies itself automatically.
 */
export async function confirmTriage(sosId, actorId, overridePriority) {
  const { rows: existing } = await pool.query('select * from sos_requests where id = $1', [sosId]);
  const sos = existing[0];
  if (!sos) throw new ApiError(404, 'SOS request not found');

  const finalPriority = overridePriority || sos.triage_priority || sos.severity;
  const { rows } = await pool.query(
    `update sos_requests set triage_priority = $1, triage_confirmed_by = $2, triage_confirmed_at = now() where id = $3 returning *`,
    [finalPriority, actorId, sosId]
  );
  await recordAudit({
    actorId,
    action: 'sos.triage_confirmed',
    entityType: 'sos_requests',
    entityId: sosId,
    metadata: { priority: finalPriority, overridden: !!overridePriority && overridePriority !== sos.triage_priority },
  });
  broadcast('SOS_UPDATED', rows[0], {});
  return rows[0];
}
