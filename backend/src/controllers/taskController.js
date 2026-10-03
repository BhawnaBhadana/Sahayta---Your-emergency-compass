import * as taskService from '../services/taskService.js';
import { asyncHandler } from '../utils/apiError.js';

export const createTaskHandler = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.body, req.user.id);
  res.status(201).json({ success: true, task });
});

export const listTasksHandler = asyncHandler(async (req, res) => {
  const { lat, lng, status } = req.query;
  const tasks = await taskService.listTasks({ lat: lat ? Number(lat) : null, lng: lng ? Number(lng) : null, status });
  res.json({ success: true, count: tasks.length, tasks });
});

export const acceptTaskHandler = asyncHandler(async (req, res) => {
  const task = await taskService.acceptTask(req.params.id, req.user.id);
  res.json({ success: true, task });
});

export const updateTaskStatusHandler = asyncHandler(async (req, res) => {
  const task = await taskService.updateTaskStatus(req.params.id, req.body.status, req.user.id);
  res.json({ success: true, task });
});
