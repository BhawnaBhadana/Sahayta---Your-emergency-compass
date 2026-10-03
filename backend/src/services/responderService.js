import { pool } from '../config/db.js';
import { sortByDistance } from '../utils/geo.js';

const SKILL_HINTS = {
  medical: ['medical', 'first aid', 'paramedic', 'nurse', 'doctor'],
  fire: ['fire', 'rescue'],
  flood: ['rescue', 'swimming', 'boat', 'driver'],
  accident: ['first aid', 'driver', 'rescue'],
  trapped: ['rescue', 'structural', 'search'],
  missing_person: ['search', 'rescue'],
  other: [],
};

function skillScore(skills = [], emergencyType) {
  const hints = SKILL_HINTS[emergencyType] || [];
  if (!hints.length) return 0;
  const lower = skills.map((s) => s.toLowerCase());
  return hints.some((hint) => lower.some((s) => s.includes(hint))) ? 1 : 0;
}

export async function recommendResponders({ latitude, longitude, emergencyType, limit = 5 }) {
  const { rows } = await pool.query(
    `select u.id, u.name, u.phone, rp.skills, rp.is_available,
            coalesce(rp.current_latitude, rp.base_latitude) as latitude,
            coalesce(rp.current_longitude, rp.base_longitude) as longitude
     from responder_profiles rp
     join users u on u.id = rp.user_id
     where u.is_active = true
       and coalesce(rp.current_latitude, rp.base_latitude) is not null`
  );

  const withDistance = sortByDistance(rows, latitude, longitude);
  const ranked = withDistance
    .map((r) => ({ ...r, skill_match: skillScore(r.skills, emergencyType) }))
    .sort((a, b) => {
      if (a.is_available !== b.is_available) return a.is_available ? -1 : 1;
      if (a.skill_match !== b.skill_match) return b.skill_match - a.skill_match;
      return a.distance_km - b.distance_km;
    });

  return ranked.slice(0, limit);
}

export async function recommendVolunteers({ latitude, longitude, limit = 5 }) {
  const { rows } = await pool.query(
    `select u.id, u.name, u.phone, vp.skills, vp.is_available, vp.latitude, vp.longitude
     from volunteer_profiles vp
     join users u on u.id = vp.user_id
     where u.is_active = true and vp.latitude is not null`
  );
  return sortByDistance(rows, latitude, longitude)
    .sort((a, b) => (a.is_available === b.is_available ? a.distance_km - b.distance_km : a.is_available ? -1 : 1))
    .slice(0, limit);
}

export async function updateOwnResponderProfile(userId, updates) {
  const fields = [];
  const params = [];
  let i = 1;
  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = $${i}`);
    params.push(value);
    i += 1;
  }
  if (!fields.length) return null;
  fields.push(`updated_at = now()`);
  if (updates.current_latitude !== undefined || updates.current_longitude !== undefined) {
    fields.push(`last_location_at = now()`);
  }
  params.push(userId);
  const { rows } = await pool.query(
    `update responder_profiles set ${fields.join(', ')} where user_id = $${i} returning *`,
    params
  );
  return rows[0];
}

export async function updateOwnVolunteerProfile(userId, updates) {
  const fields = [];
  const params = [];
  let i = 1;
  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = $${i}`);
    params.push(value);
    i += 1;
  }
  if (!fields.length) return null;
  fields.push(`updated_at = now()`);
  params.push(userId);
  const { rows } = await pool.query(
    `update volunteer_profiles set ${fields.join(', ')} where user_id = $${i} returning *`,
    params
  );
  return rows[0];
}

export async function listResponders() {
  const { rows } = await pool.query(
    `select u.id, u.name, u.phone, rp.* from responder_profiles rp join users u on u.id = rp.user_id order by rp.is_available desc`
  );
  return rows;
}

export async function listVolunteers() {
  const { rows } = await pool.query(
    `select u.id, u.name, u.phone, vp.* from volunteer_profiles vp join users u on u.id = vp.user_id order by vp.is_available desc`
  );
  return rows;
}
