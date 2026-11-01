# CivicConnect AI — API Reference

Base URL (local dev): `http://localhost:5001/api`
All timestamps are ISO-8601. Coordinates are WGS84 decimal degrees.

## Authentication

Protected endpoints require a JWT bearer token:

```
Authorization: Bearer <token>
```

Obtain a token via `/auth/login`. Roles are `citizen`, `officer`, `admin`. Some endpoints use
`optionalProtect` (public feed/map) and accept an anonymous `x-device-id` header for
device-based voting.

| Level | Meaning |
| --- | --- |
| Public | No token required |
| Authenticated | Any logged-in user |
| Officer | `officer` or `admin` |
| Admin | `admin` only |

---

## Health & Config

### `GET /health`
Liveness probe. → `{ status: "OK", message: "..." }`

### `GET /config/status`
Reports active integration modes. → `{ imageStorage: "cloudinary" | "local" }`

---

## Auth

### `POST /auth/register`
```json
{ "name": "Priya N", "email": "priya@example.com", "phone": "9111111111", "password": "Citizen@123" }
```
→ OTP challenge (OTP is simulated and returned in dev). Officer/admin accounts are created by
an admin via `/admin/officers`, not public registration.

### `POST /auth/verify-otp`
`{ "email": "...", "otp": "..." }` → activates the account.

### `POST /auth/login`
`{ "email": "...", "password": "..." }` → `{ token, user }`.

### `GET /auth/me` — Authenticated. → current user profile.

---

## Issues

### `GET /issues` — Public
Query: `page`, `limit`, `category`, `status`, `severity`, `search`.
→ `{ issues: [...], total, page, pages }`. Sorted by `priorityScore` desc, then `createdAt`.

### `GET /issues/:id` — Public
Full issue including `statusHistory` (with populated actor names), AI intelligence fields,
`department`, and populated `duplicateCandidates`.

### `GET /issues/map` — Public
Lightweight `{ _id, title, category, severity, status, location }` list for the Leaflet map.

### `POST /issues` — Authenticated (citizen) / public with device id
`multipart/form-data`:
| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | required |
| `description` | string | required |
| `address` | string | optional — auto reverse-geocoded if omitted |
| `lat`, `lng` | number | **required** |
| `images` | file[] | up to 4, ≤5 MB each (jpeg/png/webp) |

The AI service classifies the complaint and returns the full intelligence payload. Response
`201` includes `category`, `severity`, `aiConfidence`, `priorityScore` (0–100), `summary`,
`suggestedAction`, `safetyRisk`, `recommendedDepartment`, `duplicateCandidates[]`, and an
initial `statusHistory` entry.

### `PATCH /issues/:id/status` — Officer/Admin
Body (all optional except when a rule requires it):
```json
{
  "status": "acknowledged | assigned | in_progress | resolved | rejected",
  "remarks": "audit note",
  "resolutionNotes": "required context for resolved",
  "resolutionPhoto": "url",
  "departmentId": "required when assigning and none is set",
  "assignedOfficerId": "ObjectId",
  "priorityScore": 0-100,
  "priorityReason": "required when changing priority"
}
```
Business rules enforced server-side:
- `rejected` **requires** `remarks` (reason) → otherwise `400`.
- `assigned` **requires** a department (existing or `departmentId`) → otherwise `400`.
- Changing `priorityScore` **requires** `priorityReason` → otherwise `400`.

Each accepted transition appends to `statusHistory`, notifies the reporter, and broadcasts
`issue:statusUpdated` over Socket.IO. Resolving sets `resolvedAt` and awards the reporter
+10 reputation.

### `DELETE /issues/:id` — Admin.

---

## Voting & Comments

### `POST /issues/:id/vote` — Authenticated (or device). Upvote.
### `DELETE /issues/:id/vote` — Authenticated (or device). Remove vote.
### `GET /issues/:id/vote/status` — Current user's/device's vote state.

Unique-per-voter is enforced by partial indexes on `(issue, user)` and `(issue, deviceId)`.

### `POST /issues/:id/comments` / `GET /issues/:id/comments` — Authenticated.

---

## Officer

### `GET /officer/assigned` — Officer/Admin
Complaints in the officer's department, sorted by priority.

---

## Admin

### `GET /api/analytics/summary` — Officer/Admin
```json
{
  "summary": { "totalIssues, pendingIssues, acknowledgedIssues, assignedIssues,
               progressIssues, resolvedIssues, rejectedIssues, criticalIssues,
               totalOfficers, totalCitizens, totalDepartments, overallResolutionRate": 0 },
  "categories": [ { "_id": "Roads", "count": 4 } ],
  "severityDistribution": [ { "severity, count } ],
  "statusDistribution": [ { "status, count } ],
  "monthlyTrend": [ { "label, total, resolved } ],
  "topVoted": [ { "_id, title, category, severity, votesCount, status } ],
  "departments": [ { "departmentName, total, resolved, resolutionRate } ]
}
```
All values are computed live from the database — no synthetic figures.

### `POST /admin/departments` · `GET /admin/departments` — Admin.
### `POST /admin/officers` · `GET /admin/officers` — Admin.
### `GET /admin/fake-reports` — Admin. AI-flagged suspicious complaints.
### `PATCH /admin/fake-reports/:id/resolve` — Admin. `{ "action": "dismiss" | "delete" }`.

---

## Notifications

### `GET /notifications` · `GET /notifications/unread-count` — Authenticated.
### `PATCH /notifications/read` — Authenticated. Mark read.

---

## Geocoding (Leaflet-friendly, keyless)

### `GET /geo/reverse?lat=&lng=` — Public
→ `{ address, source: "nominatim" | "coordinate" }`. Falls back to a `lat, lng` label when the
Nominatim service is unreachable, so it never blocks submission and never fabricates a street.

### `GET /geo/search?q=` — Public
→ `[{ label, lat, lng }]` for the location picker's place search (empty array when offline).

---

## Users

### `GET /users/leaderboard` — Public. Top contributors by reputation.

---

## Real-time (Socket.IO)

Connect to `ws://localhost:5001`. Rooms: `user:{id}` and `city:all`.

| Event | Payload | When |
| --- | --- | --- |
| `issue:created` | `{ _id, title, category, severity, status, location }` | New complaint |
| `issue:statusUpdated` | `{ _id, status }` | Lifecycle transition |
| `notification:new` | notification object | Reporter is notified |

---

## AI Microservice (FastAPI, `http://localhost:8000`)

Internal service consumed by the backend; not usually called directly by the client.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | Service liveness (root) |
| `POST` | `/classify` | Category, severity, confidence + priority_score, summary, recommended_department, suggested_action, safety_risk |
| `POST` | `/check-duplicate` | Perceptual image-similarity duplicate check |
| `POST` | `/fake-report-check` | GPS plausibility + image-forgery heuristics |

Metrics are exposed at `GET /metrics` (Prometheus).

When `OPENROUTER_API_KEY` is unset, `/classify` uses a deterministic offline keyword engine and
returns the same payload shape.
