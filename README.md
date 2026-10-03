# SAHAYTA
### Standing With You In Crisis

A full-stack disaster-response and emergency-coordination platform that converts a citizen's distress signal into a verified, coordinated response.

---

## Problem

When disaster strikes, information is scattered across phone calls, social media rumors, and word of mouth. Citizens don't know what's verified, responders don't know where to go first, shelters and hospitals can't broadcast real capacity, and surplus resources in one place don't reach a shortage two kilometers away. Every one of these gaps costs time — and in a crisis, time is the one resource nobody can create more of.

## Solution

Sahayta is a single coordination layer connecting **citizens, responders, volunteers, NGOs, hospitals, and administrators** around one shared, verified picture of what's happening on the ground. A citizen's SOS doesn't just get logged — it triggers a full pipeline: triage, nearby-responder recommendation, nearest-hospital lookup, responder assignment, safe-route guidance, live status tracking, and resolution, all timestamped for response-time analytics.

```
REPORT / SOS → VERIFICATION → PRIORITY → RESPONDER ASSIGNMENT →
SAFE ROUTE → RESPONSE → RESOLUTION → ANALYTICS
```

## Key Features

- **Smart SOS system** — hold-to-activate emergency button, automatic geolocation, emergency type + severity capture, instant SOS ID (`SH-SOS-xxxxx`), and a live 7-stage response pipeline (received → triaged → responder assigned → dispatched → en route → arrived → resolved).
- **Verified incident reporting** — citizen reports start `unverified`, accumulate independent-report counts automatically when duplicates come in nearby, and require a responder/admin to verify or reject before anything is treated as actionable ground truth.
- **Smart responder assignment** — ranks available responders by distance and skill-match against the emergency type.
- **Resource matching engine** — detects a shelter's shortage and finds the nearest providers with surplus stock, computing exactly how much of the shortfall each can cover.
- **Safe route intelligence** — a simulated routing layer that detours around reported blocked roads and active high-severity incidents, and surfaces the nearest hospital/shelter along the way.
- **Shelter & hospital capacity tracking** — hard database constraints prevent occupancy from ever exceeding capacity or available beds from exceeding total beds.
- **Family safety check-in, missing-person network, volunteer task board, emergency alerts, notification center, disaster-preparedness guides.**
- **Role-based dashboards** for Citizen, Volunteer, Responder, NGO, Hospital, and Admin, each showing only what that role needs.
- **Live command center** for admins: active emergencies/SOS/responders/shelters/hospital capacity/critical resources at a glance, a live map, critical incidents, resource shortages, and response-time analytics computed from real timestamps.
- **Real-time updates** over WebSocket — new SOS, status changes, new alerts, and notifications push to connected clients instantly.

## USP (Hackathon Pitch)

1. **Verified information** — not every citizen report becomes trusted data; a verification pipeline stands between a report and it being "actionable."
2. **Smart coordination** — every actor (citizen, responder, volunteer, hospital, shelter, NGO) works off the same live picture.
3. **Location intelligence** — the platform always knows where help, danger, and resources actually are.
4. **Resource matching** — shortages are automatically matched against surplus.
5. **Response tracking** — the full SOS lifecycle is tracked with timestamps, powering real analytics.
6. **Low-connectivity design** — the UI degrades gracefully and shows cached data with a visible "last synchronized" indicator when offline.
7. **Human-controlled** — nothing auto-resolves or auto-verifies; humans (responders/admins) make every consequential call.

---

## Architecture

```
SAHAYTA/
├── frontend/               React 19 + Vite SPA (Tailwind v4, React Router, Leaflet)
│   └── src/
│       ├── pages/          One file per route/screen
│       ├── components/     Shared UI (CrisisMap, StatCard, DataState, NotificationBell...)
│       ├── layouts/        AppLayout (nav, SOS button, connectivity banner, footer)
│       ├── context/        AuthContext, RealtimeContext (WebSocket)
│       ├── services/       One fetch-wrapper module per backend resource
│       ├── utils/          constants, formatting, nav config
│       └── data/           Static preparedness content
│
├── backend/                Node.js + Express REST API
│   └── src/
│       ├── controllers/    Thin HTTP handlers
│       ├── services/       Business logic + SQL (the "matching engine", SOS pipeline, etc.)
│       ├── routes/         Express routers per resource
│       ├── middleware/     auth (JWT), role guard, rate limiting, validation, upload, errors
│       ├── validators/     Zod schemas per resource
│       ├── realtime/       WebSocket broadcast hub
│       └── utils/          migrate.js / seed.js scripts, geo math, JWT, SOS codes
│
├── database/
│   └── schema/001_init.sql Full Postgres schema (21 tables, enums, constraints, indexes)
│
├── legacy-static-prototype/  The original static HTML/Tailwind prototype (preserved, superseded)
├── .env.example
└── README.md
```

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 19 (Vite), React Router 7, Tailwind CSS v4 | Fast dev loop, no framework lock-in, matches the color system of the original prototype |
| Maps | React-Leaflet + OpenStreetMap tiles | Free, no API key required, works out of the box |
| Backend | Node.js + Express | Simple, well understood, easy to extend |
| Database | PostgreSQL (hosted on Supabase) | Relational integrity for a domain full of real relationships (shelters↔resources↔requests, SOS↔responders↔status history) |
| Auth | JWT (bcrypt-hashed passwords) | Self-contained, no external auth provider dependency |
| Realtime | Raw `ws` WebSocket server | Push SOS/alert/notification updates without polling |
| Validation | Zod | Type-safe request validation on every mutating endpoint |

## Database

21 tables including: `users`, `organizations`, `responder_profiles`, `volunteer_profiles`, `sos_requests`, `sos_status_events`, `incident_reports`, `incident_verification_signals`, `shelters`, `hospitals`, `resources`, `resource_requests`, `volunteer_tasks`, `alerts`, `notifications`, `missing_persons`, `family_groups`, `family_members`, `blocked_roads`, `audit_logs`.

Enforced at the database level (not just the UI):
- `shelters.occupied <= shelters.capacity`
- `hospitals.available_beds <= hospitals.total_beds`, `icu_available <= icu_beds`
- `resources.quantity >= 0`, `resources.reserved <= resources.quantity`

## User Roles

| Role | Can |
|---|---|
| Citizen | Send SOS, report incidents, view alerts/map, find shelter/hospital/safe route, family safety check-in, report missing persons |
| Volunteer | Set availability/skills, view & accept nearby tasks, update task status |
| Responder | View/accept SOS requests, advance response status, verify/reject incident reports |
| NGO | Manage shelters & resource inventory, run the resource-matching engine, fulfill resource requests |
| Hospital | Publish bed/ICU/ambulance capacity |
| Admin | Command center, issue alerts, verify incidents, manage missing persons, view audit logs & analytics |

## API Overview

```
/api/auth            register, login, me
/api/sos             create, list, get, assign, status
/api/reports         incident reports + verification pipeline
/api/shelters        list/create + occupancy updates (capacity-guarded)
/api/hospitals       list/create + capacity updates (bed-guarded)
/api/resources       inventory + /match (matching engine)
/api/resource-requests   requested → approved → dispatched → delivered
/api/tasks           volunteer task board
/api/responders      profiles, availability, /recommend
/api/alerts          issue/list/expire
/api/notifications   per-user notification feed
/api/missing-persons missing-person network
/api/family          family safety check-in
/api/routes          /safe-route (simulated), blocked-roads
/api/analytics       command-center, response-times, incident-breakdown, audit-logs
/api/uploads         photo/audio evidence upload
ws://.../ws          live push: NEW_SOS, SOS_UPDATED, NEW_ALERT, NOTIFICATION, ...
```

---

## Installation & Setup

### Prerequisites
- Node.js 18+
- A PostgreSQL database (a free [Supabase](https://supabase.com) project works well)

### 1. Clone & configure environment

```bash
cp .env.example .env
```

Fill in `.env` at the project root:

```
DATABASE_URL=postgresql://postgres:<password>@<host>:5432/postgres
JWT_SECRET=<a long random string>
PORT=5000
CORS_ORIGIN=http://localhost:5173
```

> If your DB password contains special characters (`@`, `#`, ...), percent-encode them in the connection string.

### 2. Backend

```bash
cd backend
npm install
npm run migrate   # creates all tables in your database
npm run seed      # loads realistic demo data (shelters, hospitals, responders, SOS, incidents...)
npm run dev       # starts the API on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # defaults already point at localhost:5000
npm run dev             # starts the app on http://localhost:5173
```

Open `http://localhost:5173`.

## Demo Accounts

Password for every account: **`Sahayta@123`**

| Role | Email |
|---|---|
| Admin | admin@sahayta.org |
| Citizen | citizen@sahayta.org, priya@sahayta.org |
| Responder | responder1@sahayta.org … responder5@sahayta.org |
| Volunteer | volunteer1@sahayta.org … volunteer3@sahayta.org |
| NGO | ngo@sahayta.org |
| Hospital | hospital@sahayta.org |

(The Login page has one-click quick-fill buttons for all of these.)

## Demo Flow

1. **Login as Citizen** → dashboard shows active alerts, quick actions, family safety.
2. **Open the Crisis Map** → toggle layers for emergencies, shelters, hospitals, blocked roads.
3. **Trigger an SOS** → hold the button, pick emergency type + severity, submit → get an SOS ID and see location/hospital/responder recommendations instantly.
4. **Login as Responder** (new tab/session) → the SOS appears immediately in "New SOS Requests" → Accept it.
5. **Advance the pipeline**: Dispatched → En Route → Arrived → Resolved — the citizen's `/sos/:id` tracking page updates live via WebSocket.
6. **Report an incident** as a citizen → login as Responder/Admin → open **Community Verification Center** → Verify or Reject it.
7. **Open the NGO dashboard** → use the **Resource Matching Engine**: pick a shelter with a shortage → find providers who can cover it → create the request → advance it to Delivered.
8. **Login as Admin** → **Command Center** shows live metrics, the map, critical incidents, resource shortages, and response-time analytics computed from the SOS you just resolved.

## Security

- Passwords hashed with bcrypt; JWTs signed server-side, never expose secrets to the client.
- Role-based authorization middleware on every mutating/privileged route (`requireRole(...)`) — a citizen cannot call admin/responder-only endpoints.
- Zod validation on every request body/query before it reaches business logic.
- Rate limiting: stricter limits on `/api/auth/*` and `/api/sos` to blunt brute-force/spam.
- `helmet` + configurable CORS origin.
- Database-level CHECK constraints as a second line of defense for capacity/quantity invariants (never just a UI-level check).
- `.env` is git-ignored; `.env.example` ships with placeholders only, never real credentials.
- Admin accounts are seeded, not self-registerable, from the public `/register` form.

## Limitations

- **Simulated routing**: `/api/routes/safe-route` uses an internal simulation (straight-line + detour-around-known-blockages), not a live traffic/routing provider. The service is structured so a real provider (OSRM/Mapbox/Google Directions) can be swapped in without changing its contract.
- **Simulated/demo data**: all shelters, hospitals, responders, incidents, and alerts are fictional seed data for demonstration — this is explicitly not connected to live government or emergency-dispatch systems.
- **No push notifications to native devices**: the notification center works in-app via WebSocket; a service-worker/Web-Push layer would be needed for background push.
- **Single-region demo dataset**: seed data is centered on Delhi NCR; the platform itself is location-agnostic.
- **`qs`/Express transitive advisory**: a moderate-severity advisory exists in a transitive dependency of Express 4 (`qs`); no fix is available without an Express major-version upgrade. Not exploitable through any endpoint in this app's current usage.

## Future Scope

- Real routing-provider integration behind the existing `routeService` contract.
- AI-assisted incident categorization/summarization/translation (kept human-in-the-loop, never autonomous) for the report pipeline.
- Hindi (and additional regional language) UI translation layer.
- Native push notifications via a service worker + Web Push.
- Organization-linked accounts (so an NGO/hospital user manages only their own listed shelters/hospitals, rather than picking from all of them).
- Automated tests (Jest/Supertest) for the API layer described above; the endpoints were manually verified end-to-end during development.
