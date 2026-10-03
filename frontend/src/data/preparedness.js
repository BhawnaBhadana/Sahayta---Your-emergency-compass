export const DISASTER_CATEGORIES = {
  flood: {
    label: 'Flood',
    icon: '🌊',
    before: ['Keep an emergency kit and important documents in a waterproof bag', 'Know your area\'s flood risk and evacuation routes', 'Store drinking water and non-perishable food'],
    during: ['Move to higher ground immediately', 'Avoid walking or driving through flood water', 'Disconnect electrical appliances if safe to do so'],
    after: ['Avoid flood water — it may be contaminated', 'Report damaged buildings and downed power lines', 'Seek medical help for any injuries before cleanup'],
  },
  earthquake: {
    label: 'Earthquake',
    icon: '🏚️',
    before: ['Secure heavy furniture and appliances to walls', 'Identify safe spots in each room (under sturdy tables)', 'Keep a flashlight and shoes near your bed'],
    during: ['Drop, Cover, and Hold On', 'Stay away from windows and heavy furniture', 'If outdoors, move to an open area away from buildings'],
    after: ['Check yourself and others for injuries', 'Expect aftershocks', 'Inspect your home for structural damage before re-entering'],
  },
  fire: {
    label: 'Fire',
    icon: '🔥',
    before: ['Install and test smoke alarms regularly', 'Plan two escape routes from every room', 'Keep a fire extinguisher accessible'],
    during: ['Stay low to avoid smoke inhalation', 'Feel doors before opening — do not open if hot', 'Never use elevators during a fire'],
    after: ['Do not re-enter until authorities confirm it is safe', 'Contact your insurance and document damage', 'Watch for structural weaknesses'],
  },
  cyclone: {
    label: 'Cyclone',
    icon: '🌀',
    before: ['Secure loose outdoor items', 'Stock up on food, water, and medicines', 'Charge all communication devices'],
    during: ['Stay indoors, away from windows', 'Monitor official weather updates', 'Avoid using the phone except for emergencies'],
    after: ['Watch for downed power lines and flooding', 'Avoid unnecessary travel until roads are cleared', 'Boil drinking water until confirmed safe'],
  },
  landslide: {
    label: 'Landslide',
    icon: '⛰️',
    before: ['Learn if your area is landslide-prone', 'Watch for signs: cracks in ground, tilting trees', 'Plan an evacuation route to stable ground'],
    during: ['Move away from the path of the slide quickly', 'Avoid river valleys and low-lying areas', 'Listen for unusual sounds that may signal moving debris'],
    after: ['Stay away from the slide area — further slides can occur', 'Report broken utility lines', 'Check for injured or trapped persons nearby if it is safe'],
  },
};

export const EMERGENCY_KIT_ITEMS = [
  'Water (3-day supply, 4L per person per day)', 'Non-perishable food', 'Flashlight and batteries',
  'First aid kit', 'Whistle for signaling', 'Local maps', 'Cash in small denominations',
  'Copies of ID and important documents', 'Prescription medicines', 'Phone charger / power bank',
];
