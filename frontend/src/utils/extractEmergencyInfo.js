const TYPE_KEYWORDS = {
  flood: ['flood', 'बाढ़', 'water rising', 'पानी'],
  fire: ['fire', 'आग', 'smoke', 'धुआं'],
  medical: ['medical', 'injured', 'unconscious', 'बीमार', 'घायल', 'चिकित्सा', 'बेहोश'],
  trapped: ['trapped', 'stuck', 'फंस', 'फँस'],
  accident: ['accident', 'crash', 'दुर्घटना', 'collision'],
  road_blockage: ['road block', 'blocked road', 'सड़क बंद', 'सड़क अवरोध'],
  infrastructure_damage: ['collapsed', 'building damage', 'क्षतिग्रस्त', 'ढह'],
  missing_person: ['missing', 'लापता'],
};

const CRITICAL_WORDS = ['unconscious', 'बेहोश', 'dying', 'not breathing', 'सांस नहीं', 'critical', 'गंभीर'];
const HIGH_WORDS = ['trapped', 'फंस', 'injured', 'घायल', 'bleeding', 'खून'];

/**
 * Lightweight, transparent extraction from a voice transcript — keyword and
 * number matching, not a language model. Always shown to the citizen for
 * confirmation before anything is submitted (never applied silently).
 */
export function extractEmergencyInfo(text) {
  const lower = text.toLowerCase();

  let emergency_type = 'other';
  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k.toLowerCase()))) {
      emergency_type = type;
      break;
    }
  }

  const numMatch = text.match(/(\d+)/);
  const affected = numMatch ? parseInt(numMatch[1], 10) : null;

  let severity = 'medium';
  if (CRITICAL_WORDS.some((w) => lower.includes(w))) severity = 'critical';
  else if (HIGH_WORDS.some((w) => lower.includes(w))) severity = 'high';

  return { emergency_type, affected_count: affected, severity, description: text };
}
