import { pool } from '../config/db.js';
import { ApiError } from '../utils/apiError.js';
import { sortByDistance } from '../utils/geo.js';
import { notifyRoles } from './notificationService.js';
import { broadcast } from '../realtime/hub.js';

export async function createShelter(payload, organizationId) {
  const { rows } = await pool.query(
    `insert into shelters (organization_id, name, address, latitude, longitude, capacity, has_food, has_water, has_medical, is_women_safe, has_children_area, is_accessible, contact_phone)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) returning *`,
    [organizationId || null, payload.name, payload.address || null, payload.latitude, payload.longitude, payload.capacity,
      payload.has_food, payload.has_water, payload.has_medical, payload.is_women_safe, payload.has_children_area, payload.is_accessible, payload.contact_phone || null]
  );
  return rows[0];
}

export async function listShelters({ lat, lng } = {}) {
  const { rows } = await pool.query('select * from shelters order by created_at desc');
  const withAvailability = rows.map((s) => ({ ...s, available: s.capacity - s.occupied }));
  if (lat != null && lng != null) return sortByDistance(withAvailability, lat, lng);
  return withAvailability;
}

/** Ranks open shelters for a citizen at (lat,lng) and explains the ranking in plain language. */
export async function recommendShelters({ lat, lng, needsMedical, limit = 5 }) {
  const { rows } = await pool.query(`select * from shelters where status = 'open' and occupied < capacity`);
  const withAvailability = rows.map((s) => ({ ...s, available: s.capacity - s.occupied }));
  const ranked = sortByDistance(withAvailability, lat, lng)
    .sort((a, b) => {
      if (needsMedical && a.has_medical !== b.has_medical) return a.has_medical ? -1 : 1;
      return a.distance_km - b.distance_km;
    })
    .slice(0, limit)
    .map((s) => {
      const reasons = [`${s.distance_km.toFixed(1)} km away`, `${s.available} space${s.available === 1 ? '' : 's'} available`];
      if (s.has_medical) reasons.push('has medical support');
      if (s.has_food) reasons.push('has food');
      if (s.has_water) reasons.push('has water');
      return { ...s, recommendation_reason: `Recommended because it is ${reasons.join(', ')}.` };
    });
  return ranked;
}

export async function getShelter(id) {
  const { rows } = await pool.query('select * from shelters where id = $1', [id]);
  if (!rows[0]) throw new ApiError(404, 'Shelter not found');
  return { ...rows[0], available: rows[0].capacity - rows[0].occupied };
}

export async function updateOccupancy(id, occupied, actorId) {
  const shelter = await getShelter(id);
  if (occupied > shelter.capacity) {
    throw new ApiError(400, `Occupancy (${occupied}) cannot exceed capacity (${shelter.capacity}).`);
  }
  const status = occupied >= shelter.capacity ? 'full' : 'open';
  const { rows } = await pool.query(
    `update shelters set occupied = $1, status = $2, updated_at = now() where id = $3 returning *`,
    [occupied, status, id]
  );
  const updated = rows[0];

  if (status === 'full' && shelter.status !== 'full') {
    await notifyRoles(['admin', 'volunteer'], {
      type: 'shelter_update',
      title: `Shelter full: ${updated.name}`,
      body: 'Consider directing new arrivals to an alternative shelter.',
      relatedId: id,
    });
  }
  broadcast('SHELTER_UPDATED', updated, {});
  return { ...updated, available: updated.capacity - updated.occupied };
}
