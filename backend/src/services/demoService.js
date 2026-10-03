import { pool } from '../config/db.js';
import { ApiError } from '../utils/apiError.js';
import { broadcast } from '../realtime/hub.js';
import * as sosService from './sosService.js';
import * as incidentService from './incidentService.js';
import * as teamService from './teamService.js';
import * as shelterService from './shelterService.js';
import * as resourceService from './resourceService.js';
import * as alertService from './alertService.js';

const DEMO_LOCATION = { lat: 28.6875, lng: 77.2645, address: 'Yamuna Vihar, East Delhi' };
const STEP_DELAY_MS = 1800;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function findDemoCitizen() {
  const { rows } = await pool.query(
    `select id, name from users where role = 'citizen' order by (email = 'citizen@sahayta.org') desc, created_at asc limit 1`
  );
  if (!rows[0]) throw new ApiError(400, 'No citizen account exists to run the demo scenario as. Run the seed script first.');
  return rows[0];
}

async function ensureFloodTeam() {
  const { rows } = await pool.query(`select * from rescue_teams where type = 'flood_rescue' order by status asc limit 1`);
  if (rows[0]) return rows[0];
  return teamService.createTeam({
    team_code: 'R-DEMO',
    name: 'Demo Flood Rescue Unit',
    type: 'flood_rescue',
    capabilities: ['Water rescue', 'First aid'],
    equipment: ['Rescue boat', 'Life jackets'],
    base_latitude: DEMO_LOCATION.lat + 0.02,
    base_longitude: DEMO_LOCATION.lng + 0.02,
  });
}

async function findNearbyOpenShelter() {
  const { rows } = await pool.query(`select * from shelters where status = 'open' and occupied < capacity order by name ilike '%Yamuna%' desc limit 1`);
  return rows[0] || null;
}

async function findWaterResource() {
  const { rows } = await pool.query(`select * from resources where category = 'water' and quantity > 0 order by quantity asc limit 1`);
  return rows[0] || null;
}

function emitStep(scenarioId, step, label, data) {
  broadcast('DEMO_STEP', { scenario_id: scenarioId, step, label, data }, {});
}

/**
 * Runs a realistic flood-response scenario end-to-end through the ACTUAL
 * service layer and database — the same functions the public API uses. Every
 * record created here (SOS, incident, team assignment, shelter/resource
 * updates, alert) is real and persists; nothing here is a frontend animation.
 */
export async function launchScenario(actorId) {
  const scenarioId = `DEMO-${Date.now()}`;
  const citizen = await findDemoCitizen();

  // Fire-and-continue: caller gets an immediate ack; steps broadcast live over the websocket hub.
  (async () => {
    try {
      emitStep(scenarioId, 1, 'Citizen raises SOS for flooding', null);
      const { sos, triage } = await sosService.createSos(citizen.id, {
        emergency_type: 'flood',
        severity: 'critical',
        description: 'Water rising rapidly near the riverbank, two elderly residents and a child trapped on a rooftop.',
        latitude: DEMO_LOCATION.lat,
        longitude: DEMO_LOCATION.lng,
        address: DEMO_LOCATION.address,
      });
      emitStep(scenarioId, 2, 'AI-assisted triage generated', { priority: triage.priority, reasoning: triage.reasoning });
      await sleep(STEP_DELAY_MS);

      emitStep(scenarioId, 3, 'Nearby citizens submit matching incident reports', null);
      let incident;
      for (let i = 0; i < 3; i++) {
        incident = await incidentService.createIncident(citizen.id, {
          emergency_type: 'flood',
          severity: 'critical',
          title: 'Severe flooding near Yamuna Vihar riverbank',
          description: 'Water level rising, rooftop rescue needed for trapped residents.',
          latitude: DEMO_LOCATION.lat + i * 0.001,
          longitude: DEMO_LOCATION.lng + i * 0.001,
        });
        await sleep(400);
      }
      emitStep(scenarioId, 4, `Incident reached community verification (${incident.independent_report_count} reports)`, { incident_id: incident.id, status: incident.status });
      await sleep(STEP_DELAY_MS);

      emitStep(scenarioId, 5, 'Coordinator authority-verifies the incident', null);
      await incidentService.reviewIncident(incident.id, { action: 'verify' }, actorId);
      await sleep(STEP_DELAY_MS);

      emitStep(scenarioId, 6, 'System recommends and dispatches a rescue team', null);
      const team = await ensureFloodTeam();
      const assignment = await teamService.assignTeam({ teamId: team.id, sosId: sos.id, notes: 'Demo scenario dispatch' }, actorId);
      await teamService.updateAssignmentStatus(assignment.id, 'dispatched', actorId);
      await sleep(STEP_DELAY_MS);

      emitStep(scenarioId, 7, 'Responder assigned to SOS and en route', null);
      const { rows: responderRows } = await pool.query(`select id from users where role = 'responder' order by created_at asc limit 1`);
      if (responderRows[0]) {
        await sosService.assignResponder(sos.id, responderRows[0].id, actorId);
        await sosService.updateStatus(sos.id, 'dispatched', 'Demo scenario dispatch', actorId);
        await sosService.updateStatus(sos.id, 'en_route', 'Responder en route to site', actorId);
      }
      await teamService.updateAssignmentStatus(assignment.id, 'en_route', actorId);
      await sleep(STEP_DELAY_MS);

      emitStep(scenarioId, 8, 'Nearby shelter recommended for evacuees', null);
      const shelter = await findNearbyOpenShelter();
      if (shelter) {
        await shelterService.updateOccupancy(shelter.id, Math.min(shelter.capacity, shelter.occupied + 12), actorId);
      }
      await sleep(STEP_DELAY_MS);

      emitStep(scenarioId, 9, 'Water resource stock drops to critical', null);
      const resource = await findWaterResource();
      if (resource) {
        await resourceService.updateResource(resource.id, { quantity: Math.max(0, Math.min(resource.quantity, 15)) });
      }
      await alertService.createAlert(
        {
          type: 'flood_warning',
          title: 'Flood Warning: Yamuna Vihar',
          description: 'Rapidly rising water levels reported near the riverbank. Rescue operations underway.',
          severity: 'critical',
          area: DEMO_LOCATION.address,
          latitude: DEMO_LOCATION.lat,
          longitude: DEMO_LOCATION.lng,
          radius_km: 3,
          recommended_action: 'Avoid the area. Evacuate to the nearest shelter if in a low-lying zone.',
        },
        actorId
      );
      await sleep(STEP_DELAY_MS);

      emitStep(scenarioId, 10, 'Rescue team arrives and completes evacuation', null);
      if (responderRows[0]) {
        await sosService.updateStatus(sos.id, 'arrived', 'Rescue team on-site', actorId);
      }
      await teamService.updateAssignmentStatus(assignment.id, 'arrived', actorId);
      await sleep(STEP_DELAY_MS);

      if (responderRows[0]) {
        await sosService.updateStatus(sos.id, 'resolved', 'All residents evacuated safely', actorId);
      }
      await teamService.updateAssignmentStatus(assignment.id, 'completed', actorId);
      emitStep(scenarioId, 11, 'Incident resolved — analytics updated', { sos_id: sos.id, incident_id: incident.id });
    } catch (err) {
      console.error('[demo scenario] failed:', err);
      emitStep(scenarioId, -1, `Scenario stopped: ${err.message}`, null);
    }
  })();

  return { scenario_id: scenarioId, status: 'started', message: 'Watch the Command Center and Crisis Map — this scenario runs through real API calls against the live database.' };
}
