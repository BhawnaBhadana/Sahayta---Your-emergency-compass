/**
 * AI-assisted triage — a transparent, rule-based reasoning engine (not an
 * external LLM call, since no model API key is configured for this project).
 * It scores real submitted data (type, severity, free-text description) and
 * returns a recommendation with reasoning. It NEVER auto-resolves or
 * auto-dispatches anything — every recommendation requires a human
 * responder/coordinator to confirm via `confirmTriage`.
 */

const SEVERITY_RANK = { low: 0, medium: 1, high: 2, critical: 3 };
const SEVERITY_BY_RANK = ['low', 'medium', 'high', 'critical'];

const MEDICAL_KEYWORDS = ['bleeding', 'unconscious', 'not breathing', 'chest pain', 'cardiac', 'pregnant', 'labor', 'seizure', 'collapsed', 'severe injury', 'blood loss'];
const STRUCTURAL_KEYWORDS = ['trapped', 'stuck', 'collapsed building', 'rubble', 'buried', 'roof caved'];
const FIRE_SPREAD_KEYWORDS = ['spreading', 'explosion', 'gas leak', 'smoke everywhere'];
const WATER_RISING_KEYWORDS = ['rising', 'water level increasing', 'submerged', 'drowning'];

const RESPONSE_PLAYBOOK = {
  medical: { response: ['Dispatch medical response team', 'Alert nearest hospital emergency department'], resources: ['Ambulance', 'First aid kit', 'Medical personnel'] },
  fire: { response: ['Dispatch fire & rescue team', 'Evacuate surrounding structures'], resources: ['Fire tender', 'Breathing apparatus', 'Water tanker'] },
  flood: { response: ['Dispatch flood rescue team', 'Check capacity at nearest shelter'], resources: ['Rescue boat', 'Life jackets', 'Water purification tablets'] },
  accident: { response: ['Dispatch responder with first-aid kit', 'Request traffic control at site'], resources: ['First aid kit', 'Traffic cones', 'Tow support'] },
  trapped: { response: ['Dispatch search & rescue team', 'Assess structural stability before entry'], resources: ['Rescue/cutting equipment', 'Structural support tools'] },
  missing_person: { response: ['Circulate description to nearby responders and volunteers', 'Check nearby shelters and hospitals'], resources: ['Search team', 'Public alert'] },
  road_blockage: { response: ['Dispatch road-clearance crew', 'Issue road-closure alert to citizens'], resources: ['Clearance equipment', 'Signage/barricades'] },
  infrastructure_damage: { response: ['Dispatch structural inspection team', 'Cordon off the affected area'], resources: ['Inspection team', 'Barricades'] },
  other: { response: ['Dispatch nearest available responder to assess'], resources: ['General response kit'] },
};

function extractAffectedCount(description = '') {
  const match = description.match(/(\d+)\s*(people|person|persons|families|family|members|villagers|residents)/i);
  return match ? parseInt(match[1], 10) : null;
}

function findKeywords(description = '', list) {
  const lower = description.toLowerCase();
  return list.filter((kw) => lower.includes(kw));
}

export function computeTriage({ emergency_type, severity, description = '' }) {
  let rank = SEVERITY_RANK[severity] ?? 1;
  const reasons = [`Reported as ${severity} severity ${emergency_type.replace('_', ' ')} emergency.`];

  const affected = extractAffectedCount(description);
  if (affected != null) {
    reasons.push(`Description indicates approximately ${affected} people affected.`);
    if (affected >= 10) rank = Math.min(rank + 2, 3);
    else if (affected >= 5) rank = Math.min(rank + 1, 3);
  }

  const medicalHits = findKeywords(description, MEDICAL_KEYWORDS);
  if (medicalHits.length) {
    reasons.push(`Medical risk indicators detected in description: "${medicalHits.join('", "')}".`);
    rank = Math.min(rank + 1, 3);
  }

  const structuralHits = findKeywords(description, STRUCTURAL_KEYWORDS);
  if (structuralHits.length) {
    reasons.push(`Structural entrapment indicators detected: "${structuralHits.join('", "')}".`);
    rank = Math.min(rank + 1, 3);
  }

  const fireHits = findKeywords(description, FIRE_SPREAD_KEYWORDS);
  if (fireHits.length) {
    reasons.push(`Escalation indicators detected: "${fireHits.join('", "')}".`);
    rank = Math.min(rank + 1, 3);
  }

  const waterHits = findKeywords(description, WATER_RISING_KEYWORDS);
  if (waterHits.length) {
    reasons.push(`Worsening-conditions indicators detected: "${waterHits.join('", "')}".`);
    rank = Math.min(rank + 1, 3);
  }

  const priority = SEVERITY_BY_RANK[rank];
  const playbook = RESPONSE_PLAYBOOK[emergency_type] || RESPONSE_PLAYBOOK.other;

  reasons.push(`Recommended priority: ${priority.toUpperCase()}.`);

  return {
    priority,
    reasoning: reasons.join(' '),
    recommended_response: playbook.response,
    required_resources: playbook.resources,
    affected_count: affected,
  };
}
