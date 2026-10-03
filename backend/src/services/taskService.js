import { pool } from '../config/db.js';
import { ApiError } from '../utils/apiError.js';
import { sortByDistance } from '../utils/geo.js';
import { notifyUser } from './notificationService.js';
import { broadcast } from '../realtime/hub.js';

const VALID_TRANSITIONS = {
  open: ['accepted', 'cancelled'],
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['arrived', 'cancelled'],
  arrived: ['completed'],
  completed: [],
  cancelled: [],
};

export async function createTask(payload, createdBy) {
  const { rows } = await pool.query(
    `insert into volunteer_tasks (type, title, description, latitude, longitude, address, related_shelter_id, created_by)
     values ($1,$2,$3,$4,$5,$6,$7,$8) returning *`,
    [payload.type, payload.title, payload.description || null, payload.latitude || null, payload.longitude || null,
      payload.address || null, payload.related_shelter_id || null, createdBy]
  );
  broadcast('NEW_TASK', rows[0], { roles: ['volunteer', 'admin'] });
  return rows[0];
}

export async function listTasks({ lat, lng, status } = {}) {
  const clauses = [];
  const params = [];
  if (status) {
    clauses.push(`status = $${params.length + 1}`);
    params.push(status);
  }
  const where = clauses.length ? `where ${clauses.join(' and ')}` : '';
  const { rows } = await pool.query(
    `select t.*, u.name as volunteer_name from volunteer_tasks t left join users u on u.id = t.assigned_volunteer_id ${where} order by t.created_at desc`,
    params
  );
  if (lat != null && lng != null) {
    return sortByDistance(rows.filter((r) => r.latitude != null), lat, lng).concat(rows.filter((r) => r.latitude == null));
  }
  return rows;
}

export async function acceptTask(taskId, volunteerId) {
  const { rows: existing } = await pool.query('select * from volunteer_tasks where id = $1', [taskId]);
  const task = existing[0];
  if (!task) throw new ApiError(404, 'Task not found');
  if (task.status !== 'open') throw new ApiError(400, 'Task is no longer open');

  const { rows } = await pool.query(
    `update volunteer_tasks set status = 'accepted', assigned_volunteer_id = $1, updated_at = now() where id = $2 returning *`,
    [volunteerId, taskId]
  );
  broadcast('TASK_UPDATED', rows[0], {});
  return rows[0];
}

export async function updateTaskStatus(taskId, status, actorId) {
  const { rows: existing } = await pool.query('select * from volunteer_tasks where id = $1', [taskId]);
  const task = existing[0];
  if (!task) throw new ApiError(404, 'Task not found');
  const allowed = VALID_TRANSITIONS[task.status] || [];
  if (!allowed.includes(status)) throw new ApiError(400, `Cannot move task from ${task.status} to ${status}`);

  const { rows } = await pool.query(
    `update volunteer_tasks set status = $1, updated_at = now() where id = $2 returning *`,
    [status, taskId]
  );
  if (task.created_by) {
    await notifyUser(task.created_by, {
      type: 'volunteer_assignment',
      title: `Task "${task.title}" is now ${status.replace('_', ' ')}`,
      relatedId: taskId,
    });
  }
  broadcast('TASK_UPDATED', rows[0], {});
  return rows[0];
}
