import { pool } from '../config/db.js';
import { ApiError } from '../utils/apiError.js';
import { sortByDistance } from '../utils/geo.js';
import { notifyRoles } from './notificationService.js';
import { broadcast } from '../realtime/hub.js';

function deriveStatus(quantity) {
  if (quantity <= 0) return 'out_of_stock';
  if (quantity < 20) return 'critical';
  if (quantity < 100) return 'low';
  return 'available';
}

export async function createResource(payload, providerOrgId) {
  const status = deriveStatus(payload.quantity);
  const { rows } = await pool.query(
    `insert into resources (provider_org_id, shelter_id, category, name, quantity, unit, status, latitude, longitude, location_label)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`,
    [providerOrgId || null, payload.shelter_id || null, payload.category, payload.name, payload.quantity, payload.unit,
      status, payload.latitude || null, payload.longitude || null, payload.location_label || null]
  );
  return rows[0];
}

export async function listResources({ category } = {}) {
  const clauses = [];
  const params = [];
  if (category) {
    clauses.push('category = $1');
    params.push(category);
  }
  const where = clauses.length ? `where ${clauses.join(' and ')}` : '';
  const { rows } = await pool.query(`select * from resources ${where} order by updated_at desc`, params);
  return rows.map((r) => ({ ...r, available_quantity: r.quantity - r.reserved }));
}

export async function updateResource(id, updates) {
  const { rows: existing } = await pool.query('select * from resources where id = $1', [id]);
  if (!existing[0]) throw new ApiError(404, 'Resource not found');
  const quantity = updates.quantity ?? existing[0].quantity;
  const status = updates.status || deriveStatus(quantity);

  const { rows } = await pool.query(
    `update resources set quantity = $1, status = $2, updated_at = now() where id = $3 returning *`,
    [quantity, status, id]
  );
  const resource = rows[0];

  if (status === 'critical' || status === 'out_of_stock') {
    await notifyRoles(['admin', 'ngo'], {
      type: 'resource_request',
      title: `${resource.category} running ${status.replace('_', ' ')}: ${resource.name}`,
      body: `Only ${resource.quantity} ${resource.unit} left.`,
      relatedId: id,
    });
  }
  broadcast('RESOURCE_UPDATED', resource, {});
  return resource;
}

/** Resource matching engine: find providers who can cover a shortage. */
export async function findMatches(category, quantityNeeded, lat, lng) {
  const { rows } = await pool.query(
    `select * from resources where category = $1 and (quantity - reserved) > 0`,
    [category]
  );
  const withAvailability = rows.map((r) => ({ ...r, available_quantity: r.quantity - r.reserved }));
  const withDistance = lat != null && lng != null ? sortByDistance(withAvailability, lat, lng) : withAvailability;
  const sorted = [...withDistance].sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));

  let remaining = quantityNeeded;
  const matches = [];
  for (const r of sorted) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, r.available_quantity);
    matches.push({ ...r, suggested_quantity: take });
    remaining -= take;
  }
  return { matches, fully_covered: remaining <= 0, shortage_remaining: Math.max(remaining, 0) };
}

export async function createResourceRequest(payload, requestedBy) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `insert into resource_requests (requesting_shelter_id, fulfilling_resource_id, category, quantity_needed, requested_by)
       values ($1,$2,$3,$4,$5) returning *`,
      [payload.requesting_shelter_id, payload.fulfilling_resource_id || null, payload.category, payload.quantity_needed, requestedBy]
    );
    const request = rows[0];

    if (payload.fulfilling_resource_id) {
      const { rows: resRows } = await client.query('select * from resources where id = $1 for update', [payload.fulfilling_resource_id]);
      const resource = resRows[0];
      if (!resource) throw new ApiError(404, 'Fulfilling resource not found');
      const available = resource.quantity - resource.reserved;
      if (payload.quantity_needed > available) {
        throw new ApiError(400, `Only ${available} ${resource.unit} available from this provider.`);
      }
      await client.query('update resources set reserved = reserved + $1 where id = $2', [payload.quantity_needed, resource.id]);
    }

    await client.query('COMMIT');
    broadcast('RESOURCE_REQUEST_CREATED', request, {});
    await notifyRoles(['admin', 'ngo'], {
      type: 'resource_request',
      title: `Resource request: ${payload.quantity_needed} ${payload.category}`,
      body: 'A shelter needs resources matched from available providers.',
      relatedId: request.id,
    });
    return request;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function listResourceRequests() {
  const { rows } = await pool.query(
    `select rr.*, s.name as shelter_name, r.name as resource_name, r.provider_org_id
     from resource_requests rr
     left join shelters s on s.id = rr.requesting_shelter_id
     left join resources r on r.id = rr.fulfilling_resource_id
     order by rr.created_at desc`
  );
  return rows;
}

export async function updateResourceRequestStatus(id, status, actorId) {
  const { rows: existing } = await pool.query('select * from resource_requests where id = $1', [id]);
  const request = existing[0];
  if (!request) throw new ApiError(404, 'Resource request not found');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `update resource_requests set status = $1, approved_by = case when $1 = 'approved' then $2 else approved_by end, updated_at = now()
       where id = $3 returning *`,
      [status, actorId, id]
    );

    if (status === 'delivered' && request.fulfilling_resource_id) {
      await client.query(
        `update resources set quantity = quantity - $1, reserved = reserved - $1, updated_at = now() where id = $2`,
        [request.quantity_needed, request.fulfilling_resource_id]
      );
    }
    if (status === 'rejected' && request.fulfilling_resource_id) {
      await client.query(
        `update resources set reserved = greatest(reserved - $1, 0) where id = $2`,
        [request.quantity_needed, request.fulfilling_resource_id]
      );
    }

    await client.query('COMMIT');
    broadcast('RESOURCE_REQUEST_UPDATED', rows[0], {});
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
