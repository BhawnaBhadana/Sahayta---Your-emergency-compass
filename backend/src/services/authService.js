import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { signToken } from '../utils/jwt.js';
import { ApiError } from '../utils/apiError.js';

const PUBLIC_FIELDS = 'id, name, email, role, phone, is_active, is_org_verified, created_at';

export async function register({ name, email, password, role, phone }) {
  const existing = await pool.query('select id from users where email = $1', [email]);
  if (existing.rows.length) throw new ApiError(409, 'An account with this email already exists.');

  const password_hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `insert into users (name, email, password_hash, role, phone)
     values ($1,$2,$3,$4,$5) returning ${PUBLIC_FIELDS}`,
    [name, email, password_hash, role, phone || null]
  );
  const user = rows[0];

  if (role === 'responder') {
    await pool.query('insert into responder_profiles (user_id) values ($1)', [user.id]);
  } else if (role === 'volunteer') {
    await pool.query('insert into volunteer_profiles (user_id) values ($1)', [user.id]);
  }

  const token = signToken({ id: user.id, role: user.role, name: user.name, email: user.email });
  return { user, token };
}

export async function login({ email, password }) {
  const { rows } = await pool.query('select * from users where email = $1', [email]);
  const record = rows[0];
  if (!record || !record.is_active) throw new ApiError(401, 'Invalid email or password.');

  const valid = await bcrypt.compare(password, record.password_hash);
  if (!valid) throw new ApiError(401, 'Invalid email or password.');

  const { password_hash, ...user } = record;
  const token = signToken({ id: user.id, role: user.role, name: user.name, email: user.email });
  return { user, token };
}

export async function getMe(userId) {
  const { rows } = await pool.query(`select ${PUBLIC_FIELDS} from users where id = $1`, [userId]);
  if (!rows[0]) throw new ApiError(404, 'User not found');
  return rows[0];
}
