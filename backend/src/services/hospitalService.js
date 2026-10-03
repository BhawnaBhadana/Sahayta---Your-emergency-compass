import { pool } from '../config/db.js';
import { ApiError } from '../utils/apiError.js';
import { sortByDistance } from '../utils/geo.js';
import { notifyRoles } from './notificationService.js';
import { broadcast } from '../realtime/hub.js';

export async function createHospital(payload, organizationId) {
  const { rows } = await pool.query(
    `insert into hospitals (organization_id, name, address, latitude, longitude, total_beds, available_beds, icu_beds, icu_available, ambulances_available, contact_phone)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning *`,
    [organizationId || null, payload.name, payload.address || null, payload.latitude, payload.longitude,
      payload.total_beds, payload.available_beds, payload.icu_beds, payload.icu_available, payload.ambulances_available, payload.contact_phone || null]
  );
  return rows[0];
}

export async function listHospitals({ lat, lng } = {}) {
  const { rows } = await pool.query('select * from hospitals order by created_at desc');
  if (lat != null && lng != null) return sortByDistance(rows, lat, lng);
  return rows;
}

export async function getHospital(id) {
  const { rows } = await pool.query('select * from hospitals where id = $1', [id]);
  if (!rows[0]) throw new ApiError(404, 'Hospital not found');
  return rows[0];
}

export async function updateCapacity(id, updates) {
  const hospital = await getHospital(id);
  const available_beds = updates.available_beds ?? hospital.available_beds;
  const icu_available = updates.icu_available ?? hospital.icu_available;
  if (available_beds > hospital.total_beds) throw new ApiError(400, 'Available beds cannot exceed total beds.');
  if (icu_available > hospital.icu_beds) throw new ApiError(400, 'Available ICU beds cannot exceed total ICU beds.');

  const { rows } = await pool.query(
    `update hospitals set available_beds = $1, icu_available = $2, ambulances_available = coalesce($3, ambulances_available),
       emergency_capacity_status = coalesce($4, emergency_capacity_status), updated_at = now()
     where id = $5 returning *`,
    [available_beds, icu_available, updates.ambulances_available ?? null, updates.emergency_capacity_status ?? null, id]
  );
  const updated = rows[0];

  if (updated.available_beds === 0 && hospital.available_beds > 0) {
    await notifyRoles(['admin', 'responder'], {
      type: 'shelter_update',
      title: `Hospital at capacity: ${updated.name}`,
      body: 'No emergency beds currently available.',
      relatedId: id,
    });
  }
  broadcast('HOSPITAL_UPDATED', updated, {});
  return updated;
}
