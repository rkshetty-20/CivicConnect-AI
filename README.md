# CivicConnect AI

CivicConnect AI is a full-stack civic issue reporting platform that connects citizens with
local government bodies. Citizens report geotagged issues with photos; an AI microservice
auto-classifies each complaint and produces a prioritization payload (severity, a 0–100
priority score, a neutral summary, a recommended department, a suggested action and a safety
risk assessment). Officers and administrators then triage reports through a full complaint
lifecycle backed by an immutable status audit trail, while the community can upvote and
discuss the most urgent problems in real time.

> The project intentionally keeps its existing stack: **React**, **Node/Express**, a
> **Python FastAPI AI microservice**, **MongoDB**, **OpenRouter**, **Leaflet**, **Socket.IO**
> and **Cloudinary**. External services are optional and always guarded by safe offline
> fallbacks, so the whole application runs end-to-end with **zero API keys and no local
> MongoDB**.

---

## Architecture

```
┌────────────────┐   REST/WS    ┌────────────────┐   HTTP     ┌──────────────────────┐
│  client/ (5173)│ ───────────► │  server/ (5001) │ ─────────► │ ai-service/ (8000)   │
│ React + Vite   │ ◄───Socket.IO─│ Express + Mongo │            │ FastAPI + OpenRouter │
└────────────────┘              └────────────────┘            └──────────────────────┘
        │                              │  │
        │                         Leaflet│  └── Cloudinary (or local uploads/ fallback)
   OpenStreetMap /                     MongoDB (or in-memory fallback)
   CartoDB tiles
```

| Layer | Directory | Tech |
| --- | --- | --- |
| Frontend (PWA) | `client/` | React 18, Vite, Tailwind CSS, React Query, Zustand, Framer Motion, Recharts, Leaflet, Socket.IO client |
| Backend API | `server/` | Node.js (ESM), Express, Mongoose/MongoDB, Socket.IO, JWT, bcryptjs, Cloudinary, `prom-client` |
| AI microservice | `ai-service/` | Python FastAPI, OpenRouter (optional), Pillow image hashing, offline keyword classifier |

## Built-in offline fallbacks (no credentials required)

| Integration | When configured | When NOT configured (default) |
| --- | --- | --- |
| MongoDB | Connects to `MONGO_URI` | Starts an in-memory MongoDB (`mongodb-memory-server`) automatically |
| Cloudinary images | Uploads to Cloudinary CDN | Saves to `server/uploads/` and serves from `http://localhost:5001/uploads/...` |
| OpenRouter LLM | FastAPI uses `gpt-3.5-turbo` for classification | FastAPI uses a deterministic offline keyword engine (same response payload) |
| Node AI client | Calls the FastAPI service | Returns a fully-formed local fallback classification |
| Geocoding | Nominatim (keyless) resolves a real address | Falls back to a `lat, lng` coordinate label |

`GET /api/config/status` reports the active image-storage mode (`cloudinary` or `local`).

---

## Prerequisites

- **Node.js** v18+ (v22 recommended)
- **Python** 3.10+ (for the AI microservice)
- _Optional_: a local MongoDB or MongoDB Atlas URI
- _Optional_: Cloudinary and OpenRouter credentials

---

## Quick Start (three terminals)

### 1. Backend API — `http://localhost:5001`
```bash
cd server
npm install
cp .env.example .env        # works as-is; every external service has a fallback
npm run dev
```
On first boot it auto-seeds demo accounts and 14 realistic complaints (see credentials below).

### 2. AI microservice — `http://localhost:8000`
```bash
cd ai-service
python -m venv .venv
# Windows PowerShell:  .venv\Scripts\Activate.ps1    |  macOS/Linux:  source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env      # Windows;  cp on macOS/Linux  (OPENROUTER_API_KEY optional)
uvicorn app.main:app --reload --port 8000
```
If the AI service is not running, the backend transparently falls back to local classification.

### 3. Frontend — `http://localhost:5173`
```bash
cd client
npm install
copy .env.example .env      # VITE_API_URL=http://localhost:5001/api
npm run dev
```

Open http://localhost:5173 and log in with any demo account below.

---

## Demo Credentials

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@civicconnect.gov.in` | `Admin@123` |
| Officer (Roads) | `roads.officer@citygov.in` | `Officer@123` |
| Officer (Sanitation) | `sanitation.officer@citygov.in` | `Officer@123` |
| Officer (Water) | `water.officer@citygov.in` | `Officer@123` |
| Citizen | `test@example.com` | `Password123` |
| Citizen | `citizen1@example.com` | `Citizen@123` |
| Citizen | `citizen2@example.com` | `Citizen@123` |
| Citizen | `citizen3@example.com` | `Citizen@123` |

The seed runs only when no admin account exists, so it is safe to restart the server.

---

## Complaint Lifecycle

`pending → acknowledged → assigned → in_progress → resolved`, with `rejected` as a terminal
branch. Every transition is validated (e.g. rejection requires a reason, assignment requires
a department, priority changes require a justification) and recorded in an append-only
`statusHistory` audit trail with actor and remarks, surfaced on the issue detail timeline.

## API Overview

Full endpoint reference lives in [`docs/API.md`](docs/API.md). Highlights:

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` · `/verify-otp` · `/login` | Public | Auth + simulated OTP |
| GET | `/api/issues` · `/api/issues/:id` · `/api/issues/map` | Public* | Feed, detail, map points |
| POST | `/api/issues` | Public*/Citizen | Create complaint (multipart images, AI classification) |
| PATCH | `/api/issues/:id/status` | Officer/Admin | Lifecycle transitions + priority |
| POST/DELETE | `/api/issues/:id/vote` | Authenticated | Upvote / remove vote |
| GET | `/api/officer/assigned` | Officer | Department queue |
| GET | `/api/analytics/summary` | Admin/Officer | Dashboards + distributions |
| POST/GET | `/api/admin/departments` · `/officers` · `/fake-reports` | Admin | Administration |
| GET | `/api/geo/reverse` · `/api/geo/search` | Public | Reverse / forward geocoding |

## Docker (optional)

```bash
docker compose up --build     # starts mongo, server, ai-service, client
```
See `docker-compose.yml`. For metrics/monitoring use `docker-compose.monitor.yml`.

## Testing

```bash
cd client && npm run build     # production build check
cd server && npm run dev        # then exercise the API (see docs/API.md)
```

## Environment Reference

Each service reads a `.env` copied from its `.env.example`:

- `server/.env` — `PORT`, `MONGO_URI`, `JWT_SECRET`, `SERVER_URL`, `AI_SERVICE_URL`,
  `CLIENT_URL`, `NODE_ENV`, optional `OPENROUTER_API_KEY` and `CLOUDINARY_*`
- `ai-service/.env` — `PORT`, `HOST`, optional `OPENROUTER_API_KEY`
- `client/.env` — `VITE_API_URL`

Never commit real secrets — all `.env` files are git-ignored.
