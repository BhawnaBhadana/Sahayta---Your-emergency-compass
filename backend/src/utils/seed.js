import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';

const PASSWORD = 'Sahayta@123';

async function hash(pw) {
  return bcrypt.hash(pw, 10);
}

async function upsertUser({ name, email, role, phone }) {
  const password_hash = await hash(PASSWORD);
  const { rows } = await pool.query(
    `insert into users (name, email, password_hash, role, phone, is_org_verified)
     values ($1,$2,$3,$4,$5,true)
     on conflict (email) do update set name = excluded.name
     returning *`,
    [name, email, password_hash, role, phone]
  );
  return rows[0];
}

async function run() {
  console.log('Seeding Sahayta demo data...');

  // Idempotent: wipe prior demo rows so re-running never duplicates (users are upserted separately).
  await pool.query(`
    truncate table
      sos_status_events, sos_requests,
      incident_verification_signals, incident_reports,
      resource_requests, resources,
      volunteer_tasks, missing_persons,
      family_members, family_groups,
      blocked_roads, alerts,
      shelters, hospitals, organizations,
      team_assignments, rescue_teams,
      audit_logs, notifications
    restart identity cascade
  `);

  // ---------- USERS ----------
  const admin = await upsertUser({ name: 'Admin Ops', email: 'admin@sahayta.org', role: 'admin', phone: '+919810000001' });
  const coordinator = await upsertUser({ name: 'Kavita Nair', email: 'coordinator@sahayta.org', role: 'coordinator', phone: '+919810000098' });
  const citizen1 = await upsertUser({ name: 'Rajesh Kumar', email: 'citizen@sahayta.org', role: 'citizen', phone: '+919810000002' });
  const citizen2 = await upsertUser({ name: 'Priya Sharma', email: 'priya@sahayta.org', role: 'citizen', phone: '+919810000003' });

  const responderDefs = [
    { name: 'Arjun Verma', email: 'responder1@sahayta.org', skills: ['Medical', 'First Aid'], lat: 28.6139, lng: 77.2090 },
    { name: 'Sanjay Rathi', email: 'responder2@sahayta.org', skills: ['Fire', 'Rescue'], lat: 28.6200, lng: 77.2150 },
    { name: 'Meena Iyer', email: 'responder3@sahayta.org', skills: ['Rescue', 'Search'], lat: 28.6050, lng: 77.1950 },
    { name: 'Karan Malhotra', email: 'responder4@sahayta.org', skills: ['Driver', 'First Aid'], lat: 28.6300, lng: 77.2200 },
    { name: 'Farah Sheikh', email: 'responder5@sahayta.org', skills: ['Medical', 'Nurse'], lat: 28.5900, lng: 77.2000 },
  ];
  const responders = [];
  for (const r of responderDefs) {
    const user = await upsertUser({ name: r.name, email: r.email, role: 'responder', phone: '+9198100000' + (10 + responders.length) });
    await pool.query(
      `insert into responder_profiles (user_id, skills, is_available, base_latitude, base_longitude, current_latitude, current_longitude, last_location_at)
       values ($1,$2,true,$3,$4,$3,$4, now())
       on conflict (user_id) do update set skills = excluded.skills, base_latitude = excluded.base_latitude, base_longitude = excluded.base_longitude`,
      [user.id, r.skills, r.lat, r.lng]
    );
    responders.push(user);
  }

  const volunteerDefs = [
    { name: 'Aditi Rao', email: 'volunteer1@sahayta.org', skills: ['Food Distribution', 'Logistics'], lat: 28.6150, lng: 77.2050 },
    { name: 'Rohit Desai', email: 'volunteer2@sahayta.org', skills: ['Transportation'], lat: 28.6000, lng: 77.2100 },
    { name: 'Sneha Kapoor', email: 'volunteer3@sahayta.org', skills: ['Shelter Support', 'Medical Assistance'], lat: 28.6250, lng: 77.1900 },
  ];
  for (const v of volunteerDefs) {
    const user = await upsertUser({ name: v.name, email: v.email, role: 'volunteer', phone: '+9198100000' + (20 + volunteerDefs.indexOf(v)) });
    await pool.query(
      `insert into volunteer_profiles (user_id, skills, is_available, latitude, longitude)
       values ($1,$2,true,$3,$4)
       on conflict (user_id) do update set skills = excluded.skills, latitude = excluded.latitude, longitude = excluded.longitude`,
      [user.id, v.skills, v.lat, v.lng]
    );
  }

  const ngoUser = await upsertUser({ name: 'Delhi Relief NGO', email: 'ngo@sahayta.org', role: 'ngo', phone: '+919810000030' });
  const hospitalUser = await upsertUser({ name: 'City Care Hospital Admin', email: 'hospital@sahayta.org', role: 'hospital', phone: '+919810000031' });

  const { rows: [ngoOrg] } = await pool.query(
    `insert into organizations (owner_user_id, name, type, description, contact_phone, address, latitude, longitude, is_verified)
     values ($1,'Delhi Relief NGO','ngo','Community relief and resource distribution','+919810000030','Connaught Place, Delhi',28.6304,77.2177,true)
     on conflict do nothing returning *`,
    [ngoUser.id]
  );
  const { rows: [hospitalOrg] } = await pool.query(
    `insert into organizations (owner_user_id, name, type, description, contact_phone, address, latitude, longitude, is_verified)
     values ($1,'City Care Hospital','hospital','Multi-specialty emergency hospital','+919810000031','Karol Bagh, Delhi',28.6519,77.1909,true)
     on conflict do nothing returning *`,
    [hospitalUser.id]
  );

  // ---------- SHELTERS (10+) ----------
  const shelterDefs = [
    { name: 'Community Hall Shelter - Karol Bagh', lat: 28.6519, lng: 77.1909, capacity: 500, occupied: 437, food: true, water: true, medical: true, women: true, children: true, accessible: true },
    { name: 'Govt School Relief Camp - Yamuna Vihar', lat: 28.6875, lng: 77.2645, capacity: 300, occupied: 300, food: true, water: true, medical: false, women: true, children: true, accessible: false },
    { name: 'Community Center - Rohini', lat: 28.7196, lng: 77.1069, capacity: 250, occupied: 90, food: true, water: true, medical: true, women: false, children: true, accessible: true },
    { name: 'Sports Complex Shelter - Dwarka', lat: 28.5921, lng: 77.0460, capacity: 400, occupied: 150, food: true, water: true, medical: true, women: true, children: false, accessible: true },
    { name: 'Municipal Shelter - Lajpat Nagar', lat: 28.5677, lng: 77.2432, capacity: 200, occupied: 60, food: false, water: true, medical: false, women: true, children: true, accessible: false },
    { name: 'Temple Grounds Camp - Chandni Chowk', lat: 28.6506, lng: 77.2303, capacity: 150, occupied: 140, food: true, water: true, medical: false, women: false, children: false, accessible: false },
    { name: 'College Campus Shelter - Vasant Kunj', lat: 28.5244, lng: 77.1588, capacity: 350, occupied: 80, food: true, water: true, medical: true, women: true, children: true, accessible: true },
    { name: 'Stadium Relief Camp - Pitampura', lat: 28.7041, lng: 77.1315, capacity: 600, occupied: 220, food: true, water: true, medical: true, women: true, children: true, accessible: true },
    { name: 'Community Hall - Saket', lat: 28.5245, lng: 77.2066, capacity: 180, occupied: 30, food: false, water: false, medical: false, women: false, children: false, accessible: false },
    { name: 'Government Guest House - Mayur Vihar', lat: 28.6096, lng: 77.2953, capacity: 220, occupied: 100, food: true, water: true, medical: false, women: true, children: false, accessible: false },
    { name: 'Marriage Hall Shelter - Janakpuri', lat: 28.6219, lng: 77.0878, capacity: 300, occupied: 300, food: true, water: true, medical: true, women: true, children: true, accessible: true },
  ];
  const shelters = [];
  for (const s of shelterDefs) {
    const { rows } = await pool.query(
      `insert into shelters (organization_id, name, address, latitude, longitude, capacity, occupied, status, has_food, has_water, has_medical, is_women_safe, has_children_area, is_accessible, contact_phone)
       values ($1,$2,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'+911123456789') returning *`,
      [ngoOrg?.id || null, s.name, s.lat, s.lng, s.capacity, s.occupied, s.occupied >= s.capacity ? 'full' : 'open',
        s.food, s.water, s.medical, s.women, s.children, s.accessible]
    );
    shelters.push(rows[0]);
  }

  // ---------- HOSPITALS (5+) ----------
  const hospitalDefs = [
    { name: 'City Care Hospital', lat: 28.6519, lng: 77.1909, total: 200, avail: 34, icu: 30, icuAvail: 4, amb: 6 },
    { name: 'AIIMS Emergency Wing', lat: 28.5672, lng: 77.2100, total: 500, avail: 80, icu: 60, icuAvail: 10, amb: 15 },
    { name: 'Safdarjung Trauma Center', lat: 28.5688, lng: 77.2064, total: 350, avail: 12, icu: 40, icuAvail: 2, amb: 10 },
    { name: 'Max Super Speciality - Saket', lat: 28.5283, lng: 77.2114, total: 250, avail: 55, icu: 25, icuAvail: 8, amb: 8 },
    { name: 'Ram Manohar Lohia Hospital', lat: 28.6259, lng: 77.2010, total: 300, avail: 0, icu: 35, icuAvail: 0, amb: 5 },
    { name: 'Fortis Escorts Heart Institute', lat: 28.5657, lng: 77.2853, total: 180, avail: 28, icu: 20, icuAvail: 5, amb: 4 },
  ];
  const hospitals = [];
  for (const h of hospitalDefs) {
    const status = h.avail === 0 ? 'full' : h.avail < 15 ? 'limited' : 'available';
    const { rows } = await pool.query(
      `insert into hospitals (organization_id, name, address, latitude, longitude, total_beds, available_beds, icu_beds, icu_available, ambulances_available, emergency_capacity_status, contact_phone)
       values ($1,$2,$2,$3,$4,$5,$6,$7,$8,$9,$10,'+911145678900') returning *`,
      [hospitalOrg?.id || null, h.name, h.lat, h.lng, h.total, h.avail, h.icu, h.icuAvail, h.amb, status]
    );
    hospitals.push(rows[0]);
  }

  // ---------- RESCUE TEAMS ----------
  const teamDefs = [
    { code: 'R-01', name: 'Delhi Flood Rescue Alpha', type: 'flood_rescue', capabilities: ['Water rescue', 'Swimming', 'First aid'], equipment: ['Rescue boat', 'Life jackets'], lat: 28.6875, lng: 77.2645, status: 'busy' },
    { code: 'R-02', name: 'Central Fire & Rescue Unit', type: 'fire_rescue', capabilities: ['Firefighting', 'Structural rescue'], equipment: ['Fire tender', 'Breathing apparatus'], lat: 28.6550, lng: 77.2280, status: 'available' },
    { code: 'R-03', name: 'Mobile Medical Response Team', type: 'medical', capabilities: ['Paramedic', 'Trauma care'], equipment: ['Ambulance', 'Defibrillator'], lat: 28.6519, lng: 77.1909, status: 'available' },
    { code: 'R-04', name: 'Search & Rescue Squad South', type: 'search_rescue', capabilities: ['Structural search', 'Rope rescue'], equipment: ['Cutting tools', 'Search cameras'], lat: 28.5244, lng: 77.1588, status: 'available' },
    { code: 'R-05', name: 'General Response Unit East', type: 'general', capabilities: ['First aid', 'Logistics'], equipment: ['Response van'], lat: 28.6096, lng: 77.2953, status: 'off_duty' },
  ];
  const teams = [];
  for (const t of teamDefs) {
    const { rows } = await pool.query(
      `insert into rescue_teams (team_code, name, type, capabilities, equipment, status, base_latitude, base_longitude, current_latitude, current_longitude, leader_user_id, contact_phone)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$7,$8,$9,'+911198765432') returning *`,
      [t.code, t.name, t.type, t.capabilities, t.equipment, t.status, t.lat, t.lng, responders[0]?.id || null]
    );
    teams.push(rows[0]);
  }

  // ---------- RESOURCES (20+) ----------
  const resourceDefs = [
    { category: 'water', name: 'Bottled Water (1L)', qty: 1200, unit: 'bottles', lat: 28.6304, lng: 77.2177 },
    { category: 'water', name: 'Water Tanker Supply', qty: 45, unit: 'tankers', lat: 28.6875, lng: 77.2645 },
    { category: 'food', name: 'Dry Ration Kits', qty: 800, unit: 'kits', lat: 28.6304, lng: 77.2177 },
    { category: 'food', name: 'Cooked Meal Packets', qty: 15, unit: 'packets', lat: 28.6519, lng: 77.1909 },
    { category: 'medicine', name: 'First Aid Kits', qty: 300, unit: 'kits', lat: 28.6304, lng: 77.2177 },
    { category: 'medicine', name: 'ORS Sachets', qty: 8, unit: 'boxes', lat: 28.7196, lng: 77.1069 },
    { category: 'medicine', name: 'Antibiotics Stock', qty: 150, unit: 'strips', lat: 28.6519, lng: 77.1909 },
    { category: 'blankets', name: 'Wool Blankets', qty: 600, unit: 'pieces', lat: 28.6875, lng: 77.2645 },
    { category: 'blankets', name: 'Emergency Thermal Sheets', qty: 0, unit: 'pieces', lat: 28.5921, lng: 77.0460 },
    { category: 'first_aid', name: 'Trauma Kits', qty: 90, unit: 'kits', lat: 28.6304, lng: 77.2177 },
    { category: 'baby_supplies', name: 'Infant Formula', qty: 12, unit: 'tins', lat: 28.5677, lng: 77.2432 },
    { category: 'baby_supplies', name: 'Diapers', qty: 400, unit: 'packs', lat: 28.6304, lng: 77.2177 },
    { category: 'clothing', name: 'Assorted Clothing', qty: 700, unit: 'pieces', lat: 28.6506, lng: 77.2303 },
    { category: 'other', name: 'Torches & Batteries', qty: 250, unit: 'sets', lat: 28.6304, lng: 77.2177 },
    { category: 'water', name: 'Purification Tablets', qty: 5000, unit: 'tablets', lat: 28.5244, lng: 77.1588 },
    { category: 'food', name: 'Baby Food Packets', qty: 60, unit: 'packets', lat: 28.7041, lng: 77.1315 },
    { category: 'medicine', name: 'Paracetamol Strips', qty: 500, unit: 'strips', lat: 28.6304, lng: 77.2177 },
    { category: 'blankets', name: 'Tarpaulin Sheets', qty: 200, unit: 'sheets', lat: 28.6096, lng: 77.2953 },
    { category: 'first_aid', name: 'Bandage Rolls', qty: 3, unit: 'boxes', lat: 28.6219, lng: 77.0878 },
    { category: 'other', name: 'Portable Generators', qty: 8, unit: 'units', lat: 28.6304, lng: 77.2177 },
    { category: 'water', name: 'Jerry Cans (20L)', qty: 350, unit: 'cans', lat: 28.6875, lng: 77.2645 },
  ];
  const resources = [];
  for (const r of resourceDefs) {
    const status = r.qty <= 0 ? 'out_of_stock' : r.qty < 20 ? 'critical' : r.qty < 100 ? 'low' : 'available';
    const { rows } = await pool.query(
      `insert into resources (provider_org_id, category, name, quantity, unit, status, latitude, longitude, location_label)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *`,
      [ngoOrg?.id || null, r.category, r.name, r.qty, r.unit, status, r.lat, r.lng, 'Delhi NCR']
    );
    resources.push(rows[0]);
  }

  // ---------- RESOURCE REQUEST (shortage + match demo) ----------
  const waterProvider = resources.find((r) => r.category === 'water' && r.quantity > 300);
  const shortageShelter = shelters.find((s) => s.name.includes('Yamuna Vihar'));
  if (waterProvider && shortageShelter) {
    await pool.query(
      `insert into resource_requests (requesting_shelter_id, fulfilling_resource_id, category, quantity_needed, status, requested_by)
       values ($1,$2,'water',380,'requested',$3)`,
      [shortageShelter.id, waterProvider.id, ngoUser.id]
    );
  }

  // ---------- ALERTS ----------
  const alertDefs = [
    { type: 'flood_warning', title: 'Yamuna River Flood Warning', description: 'Water levels rising above danger mark. Low-lying areas near Yamuna Vihar advised to evacuate.', severity: 'critical', area: 'Yamuna Vihar, East Delhi', lat: 28.6875, lng: 77.2645, radius: 5 },
    { type: 'road_closure', title: 'ITO Bridge Closed', description: 'Bridge closed due to waterlogging. Use alternate routes.', severity: 'medium', area: 'ITO, Central Delhi', lat: 28.6289, lng: 77.2410, radius: 2 },
    { type: 'shelter_full', title: 'Marriage Hall Shelter Full', description: 'Janakpuri shelter has reached full capacity. Redirecting new arrivals.', severity: 'medium', area: 'Janakpuri', lat: 28.6219, lng: 77.0878, radius: 3 },
    { type: 'hospital_shortage', title: 'RML Hospital at Capacity', description: 'No emergency beds currently available at Ram Manohar Lohia Hospital.', severity: 'high', area: 'Central Delhi', lat: 28.6259, lng: 77.2010, radius: 3 },
    { type: 'public_safety', title: 'Heavy Rain Advisory', description: 'IMD forecasts heavy rainfall over next 24 hours. Avoid unnecessary travel.', severity: 'low', area: 'Delhi NCR', lat: 28.6139, lng: 77.2090, radius: 25 },
  ];
  for (const a of alertDefs) {
    await pool.query(
      `insert into alerts (type, title, description, severity, area, latitude, longitude, radius_km, issued_by, expires_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9, now() + interval '2 days')`,
      [a.type, a.title, a.description, a.severity, a.area, a.lat, a.lng, a.radius, admin.id]
    );
  }

  // ---------- BLOCKED ROADS ----------
  const roadDefs = [
    { label: 'ITO Bridge', reason: 'Waterlogging', severity: 'high', s: [28.6289, 77.2410], e: [28.6350, 77.2460] },
    { label: 'Ring Road near Yamuna Vihar', reason: 'Flooded', severity: 'critical', s: [28.6850, 77.2600], e: [28.6920, 77.2680] },
    { label: 'NH-9 near Mayur Vihar', reason: 'Landslide debris', severity: 'medium', s: [28.6050, 77.2900], e: [28.6150, 77.3000] },
  ];
  for (const r of roadDefs) {
    await pool.query(
      `insert into blocked_roads (label, reason, severity, lat_start, lng_start, lat_end, lng_end, reported_by, expires_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8, now() + interval '2 days')`,
      [r.label, r.reason, r.severity, r.s[0], r.s[1], r.e[0], r.e[1], admin.id]
    );
  }

  // ---------- MISSING PERSONS ----------
  const missingDefs = [
    { name: 'Ramesh Chand', age: 67, description: 'Last seen wearing a grey kurta, walks with a cane', location: 'Near Yamuna Vihar relief camp', status: 'missing' },
    { name: 'Anjali Devi', age: 34, description: 'Separated from family during evacuation', location: 'ITO flood zone', status: 'potential_match' },
    { name: 'Vikram Singh', age: 9, description: 'Wearing blue school uniform', location: 'Community Hall Shelter, Karol Bagh', status: 'found' },
  ];
  for (const m of missingDefs) {
    await pool.query(
      `insert into missing_persons (reported_by, name, age, description, last_seen_location, last_seen_at, contact_phone, status)
       values ($1,$2,$3,$4,$5, now() - interval '1 day', '+919810000099', $6)`,
      [citizen1.id, m.name, m.age, m.description, m.location, m.status]
    );
  }

  // ---------- FAMILY SAFETY ----------
  const { rows: [group] } = await pool.query(
    `insert into family_groups (owner_id, name) values ($1,'Kumar Family') returning *`,
    [citizen1.id]
  );
  const familyMembers = [
    { name: 'Mother', status: 'safe' },
    { name: 'Father', status: 'safe' },
    { name: 'Sister', status: 'not_responded' },
    { name: 'Brother', status: 'needs_help' },
  ];
  for (const m of familyMembers) {
    await pool.query(
      `insert into family_members (family_group_id, display_name, phone, status, status_updated_at)
       values ($1,$2,'+919810000000',$3, now())`,
      [group.id, m.name, m.status]
    );
  }

  // ---------- VOLUNTEER TASKS ----------
  const taskDefs = [
    { type: 'food_distribution', title: 'Distribute meals at Rohini community center', lat: 28.7196, lng: 77.1069, status: 'open' },
    { type: 'medical_assistance', title: 'Assist medics at Vasant Kunj shelter', lat: 28.5244, lng: 77.1588, status: 'open' },
    { type: 'supply_delivery', title: 'Deliver water cans to Janakpuri shelter', lat: 28.6219, lng: 77.0878, status: 'accepted' },
    { type: 'shelter_support', title: 'Set up additional tents at Pitampura camp', lat: 28.7041, lng: 77.1315, status: 'in_progress' },
    { type: 'road_reporting', title: 'Verify road conditions near ITO bridge', lat: 28.6289, lng: 77.2410, status: 'completed' },
  ];
  for (const t of taskDefs) {
    await pool.query(
      `insert into volunteer_tasks (type, title, latitude, longitude, status, created_by)
       values ($1,$2,$3,$4,$5,$6)`,
      [t.type, t.title, t.lat, t.lng, t.status, admin.id]
    );
  }

  // ---------- SAMPLE SOS (with full history to power analytics) ----------
  const { rows: [sos1] } = await pool.query(
    `insert into sos_requests (code, citizen_id, emergency_type, severity, description, latitude, longitude, address, status, assigned_responder_id)
     values ('SH-SOS-10482',$1,'medical','critical','Elderly person collapsed, needs immediate medical attention',28.6180,77.2100,'Near Connaught Place','resolved',$2)
     returning *`,
    [citizen2.id, responders[0].id]
  );
  const now = new Date();
  const stages = [
    ['received', -40], ['triaged', -38], ['responder_assigned', -33], ['dispatched', -30],
    ['en_route', -22], ['arrived', -10], ['resolved', -2],
  ];
  for (const [status, minsAgo] of stages) {
    await pool.query(
      `insert into sos_status_events (sos_id, status, actor_id, created_at) values ($1,$2,$3, $4::timestamptz)`,
      [sos1.id, status, admin.id, new Date(now.getTime() + minsAgo * 60000).toISOString()]
    );
  }

  const { rows: [sos2] } = await pool.query(
    `insert into sos_requests (code, citizen_id, emergency_type, severity, description, latitude, longitude, address, status)
     values ('SH-SOS-10493',$1,'flood','high','Water entering ground floor, family of 4 trapped',28.6875,77.2645,'Yamuna Vihar','triaged')
     returning *`,
    [citizen1.id]
  );
  await pool.query(
    `insert into sos_status_events (sos_id, status) values ($1,'received'), ($1,'triaged')`,
    [sos2.id]
  );

  // ---------- TEAM ASSIGNMENT (demo: flood team dispatched to sos2) ----------
  const floodTeam = teams.find((t) => t.team_code === 'R-01');
  if (floodTeam) {
    await pool.query(
      `insert into team_assignments (team_id, sos_id, status, assigned_by, notes, dispatched_at)
       values ($1,$2,'dispatched',$3,'Dispatched to assess flood conditions and begin evacuation',now())`,
      [floodTeam.id, sos2.id, coordinator.id]
    );
  }

  // ---------- INCIDENT REPORTS (with verification pipeline states) ----------
  const incidentDefs = [
    { type: 'flood', severity: 'critical', title: 'Severe flooding on Ring Road', desc: 'Water level knee-deep, vehicles stalled', lat: 28.6900, lng: 77.2650, status: 'community_verified', reports: 3 },
    { type: 'fire', severity: 'high', title: 'Fire reported near market complex', desc: 'Smoke visible from a distance', lat: 28.6550, lng: 77.2280, status: 'under_review', reports: 1 },
    { type: 'accident', severity: 'medium', title: 'Multi-vehicle collision on NH-9', desc: 'Traffic backed up, minor injuries reported', lat: 28.6100, lng: 77.2950, status: 'unverified', reports: 1 },
    { type: 'trapped', severity: 'critical', title: 'Family trapped on rooftop', desc: 'Rising water levels, rooftop rescue needed', lat: 28.6920, lng: 77.2700, status: 'authority_verified', reports: 4 },
    { type: 'other', severity: 'low', title: 'Fallen tree blocking pathway', desc: 'Pedestrian path partially blocked', lat: 28.5900, lng: 77.2200, status: 'rejected', reports: 1 },
    { type: 'medical', severity: 'high', title: 'Multiple heat-stroke cases at relief camp', desc: 'Several elderly residents affected', lat: 28.6519, lng: 77.1909, status: 'authority_verified', reports: 2 },
    { type: 'road_blockage', severity: 'medium', title: 'Landslide debris blocking NH-9', desc: 'Single-lane traffic only, clearance crew needed', lat: 28.6150, lng: 77.2980, status: 'unverified', reports: 1 },
    { type: 'infrastructure_damage', severity: 'high', title: 'Power line down near Rohini sector 12', desc: 'Live wire on the ground, area needs cordoning', lat: 28.7180, lng: 77.1050, status: 'community_verified', reports: 3 },
  ];
  for (const inc of incidentDefs) {
    const isAuthorityVerified = inc.status === 'authority_verified';
    const { rows } = await pool.query(
      `insert into incident_reports (reporter_id, emergency_type, severity, title, description, latitude, longitude, status, independent_report_count, verified_by, verified_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8::report_status,$9, case when $10 then $11::uuid else null end, case when $10 then now() else null end)
       returning *`,
      [citizen1.id, inc.type, inc.severity, inc.title, inc.desc, inc.lat, inc.lng, inc.status, inc.reports, isAuthorityVerified, admin.id]
    );
    const incident = rows[0];
    await pool.query(`insert into incident_verification_signals (incident_id, signal_type, detail) values ($1,'location_available','GPS coordinates captured')`, [incident.id]);
    if (inc.reports > 1) {
      await pool.query(`insert into incident_verification_signals (incident_id, signal_type, detail) values ($1,'independent_reports',$2)`, [incident.id, `${inc.reports} independent reports`]);
    }
    if (inc.status === 'community_verified') {
      await pool.query(`insert into incident_verification_signals (incident_id, signal_type, detail) values ($1,'community_consensus','Reached community verification threshold')`, [incident.id]);
    }
    if (inc.status === 'authority_verified') {
      await pool.query(`insert into incident_verification_signals (incident_id, signal_type, detail) values ($1,'responder_confirmation','Authority-verified by admin/coordinator')`, [incident.id]);
    }
  }

  console.log('Seed complete.');
  console.log('---');
  console.log('Demo accounts (password for all: ' + PASSWORD + '):');
  console.log('  Admin:       admin@sahayta.org');
  console.log('  Coordinator: coordinator@sahayta.org');
  console.log('  Citizen:    citizen@sahayta.org / priya@sahayta.org');
  console.log('  Responder:  responder1@sahayta.org ... responder5@sahayta.org');
  console.log('  Volunteer:  volunteer1@sahayta.org ... volunteer3@sahayta.org');
  console.log('  NGO:        ngo@sahayta.org');
  console.log('  Hospital:   hospital@sahayta.org');

  await pool.end();
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
