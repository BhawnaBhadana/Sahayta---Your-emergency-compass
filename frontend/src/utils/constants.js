export const EMERGENCY_TYPES = [
  { value: 'medical', label: 'Medical', labelKey: 'emergencyType.medical', icon: '🚑' },
  { value: 'fire', label: 'Fire', labelKey: 'emergencyType.fire', icon: '🔥' },
  { value: 'flood', label: 'Flood', labelKey: 'emergencyType.flood', icon: '🌊' },
  { value: 'accident', label: 'Accident', labelKey: 'emergencyType.accident', icon: '🚗' },
  { value: 'trapped', label: 'Trapped', labelKey: 'emergencyType.trapped', icon: '🆘' },
  { value: 'missing_person', label: 'Missing Person', labelKey: 'emergencyType.missing_person', icon: '🔍' },
  { value: 'road_blockage', label: 'Road Blockage', labelKey: 'emergencyType.road_blockage', icon: '🚧' },
  { value: 'infrastructure_damage', label: 'Infrastructure Damage', labelKey: 'emergencyType.infrastructure_damage', icon: '🏚️' },
  { value: 'other', label: 'Other', labelKey: 'emergencyType.other', icon: '⚠️' },
];

export const SEVERITY_LEVELS = [
  { value: 'low', label: 'Low', labelKey: 'severity.low', color: 'bg-secondary-100 text-secondary-800 border-secondary-200' },
  { value: 'medium', label: 'Medium', labelKey: 'severity.medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'high', label: 'High', labelKey: 'severity.high', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'critical', label: 'Critical', labelKey: 'severity.critical', color: 'bg-accent-100 text-accent-800 border-accent-200' },
];

export const SOS_STAGES = [
  { value: 'received', label: 'Request received' },
  { value: 'triaged', label: 'Triaged' },
  { value: 'responder_assigned', label: 'Responder assigned' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'en_route', label: 'Responder en route' },
  { value: 'arrived', label: 'Arrived' },
  { value: 'resolved', label: 'Resolved' },
];

export const ROLE_LABELS = {
  citizen: 'Citizen',
  volunteer: 'Volunteer',
  responder: 'Responder',
  coordinator: 'Coordinator',
  ngo: 'NGO',
  hospital: 'Hospital',
  admin: 'Admin',
};

export const ROLE_HOME = {
  citizen: '/dashboard',
  volunteer: '/volunteer',
  responder: '/responder',
  coordinator: '/coordinator',
  ngo: '/ngo',
  hospital: '/hospital',
  admin: '/admin',
};

export function severityMeta(value) {
  return SEVERITY_LEVELS.find((s) => s.value === value) || SEVERITY_LEVELS[1];
}

export function emergencyMeta(value) {
  return EMERGENCY_TYPES.find((e) => e.value === value) || EMERGENCY_TYPES[EMERGENCY_TYPES.length - 1];
}

export const TASK_TYPES = [
  { value: 'food_distribution', label: 'Food Distribution' },
  { value: 'medical_assistance', label: 'Medical Assistance' },
  { value: 'supply_delivery', label: 'Supply Delivery' },
  { value: 'shelter_support', label: 'Shelter Support' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'search_assistance', label: 'Search Assistance' },
  { value: 'road_reporting', label: 'Road Reporting' },
];

export const RESOURCE_CATEGORIES = ['food', 'water', 'medicine', 'blankets', 'first_aid', 'baby_supplies', 'clothing', 'other'];

export const ALERT_TYPES = [
  'flood_warning', 'fire', 'earthquake', 'cyclone', 'road_closure',
  'shelter_full', 'hospital_shortage', 'resource_shortage', 'public_safety',
];

export const TEAM_TYPES = ['medical', 'fire_rescue', 'flood_rescue', 'search_rescue', 'general'];

export const VERIFICATION_STATUS_STYLE = {
  authority_verified: { label: '✓ Authority Verified', cls: 'bg-secondary-100 text-secondary-800 border border-secondary-200' },
  community_verified: { label: '✓ Community Verified', cls: 'bg-primary-100 text-primary-800 border border-primary-200' },
  verified: { label: '✓ Verified', cls: 'bg-secondary-100 text-secondary-800 border border-secondary-200' },
  under_review: { label: 'Under Review', cls: 'bg-yellow-100 text-yellow-800 border border-yellow-200' },
  unverified: { label: 'Unverified', cls: 'bg-surface text-text-secondary border border-surface-100' },
  rejected: { label: 'Rejected', cls: 'bg-accent-100 text-accent-700 border border-accent-200' },
  resolved: { label: 'Resolved', cls: 'bg-primary-100 text-primary-800 border border-primary-200' },
};
