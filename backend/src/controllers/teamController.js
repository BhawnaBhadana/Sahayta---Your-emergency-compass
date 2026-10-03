import * as teamService from '../services/teamService.js';
import { asyncHandler } from '../utils/apiError.js';

export const createTeamHandler = asyncHandler(async (req, res) => {
  const team = await teamService.createTeam(req.body);
  res.status(201).json({ success: true, team });
});

export const listTeamsHandler = asyncHandler(async (req, res) => {
  const teams = await teamService.listTeams({ status: req.query.status });
  res.json({ success: true, count: teams.length, teams });
});

export const recommendTeamsHandler = asyncHandler(async (req, res) => {
  const { lat, lng, emergency_type } = req.query;
  const teams = await teamService.recommendTeams({ latitude: Number(lat), longitude: Number(lng), emergencyType: emergency_type });
  res.json({ success: true, teams });
});

export const updateTeamHandler = asyncHandler(async (req, res) => {
  const team = await teamService.updateTeam(req.params.id, req.body);
  res.json({ success: true, team });
});

export const assignTeamHandler = asyncHandler(async (req, res) => {
  const assignment = await teamService.assignTeam(
    { teamId: req.params.id, sosId: req.body.sos_id, incidentId: req.body.incident_id, notes: req.body.notes },
    req.user.id
  );
  res.status(201).json({ success: true, assignment });
});

export const updateAssignmentHandler = asyncHandler(async (req, res) => {
  const assignment = await teamService.updateAssignmentStatus(req.params.assignmentId, req.body.status, req.user.id);
  res.json({ success: true, assignment });
});

export const listAssignmentsHandler = asyncHandler(async (req, res) => {
  const assignments = await teamService.listAssignments({ teamId: req.query.team_id, sosId: req.query.sos_id });
  res.json({ success: true, count: assignments.length, assignments });
});
