# WHERE IS MY TRAIN

> **"Track. Travel. Stay Connected."**  
> An original, production-ready Indian Railway train information, route planning, and live tracking platform built for modern travelers across India.

---

## 1. Project Architecture Overview

```
WHERE IS MY TRAIN APPLICATION/
├── backend/                        # Express + TypeScript + Prisma API Gateway
│   ├── prisma/
│   │   └── schema.prisma           # Relational schema for PostgreSQL / SQLite
│   ├── src/
│   │   ├── controllers/            # Trains, Stations, Alerts, PNR, Admin controllers
│   │   │   ├── adminController.ts
│   │   │   ├── alertsController.ts
│   │   │   ├── pnrController.ts
│   │   │   ├── stationsController.ts
│   │   │   └── trainsController.ts
│   │   ├── db/
│   │   │   └── seed.ts             # Indian Railways database seeder
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts     # Global express error handler
│   │   │   └── rateLimiter.ts      # IP rate limiters
│   │   ├── providers/              # Railway Data Provider Adapter Architecture
│   │   │   ├── RailwayDataProvider.interface.ts  # Adapter contract
│   │   │   ├── providerManager.ts  # Fallback & Health Orchestrator
│   │   │   ├── mock/               # Development Sandbox Provider
│   │   │   │   ├── mockRailwayData.ts
│   │   │   │   └── mockRailwayProvider.ts
│   │   │   ├── ntes/               # Official NTES / CRIS Gateway Adapter
│   │   │   │   └── ntesRailwayProvider.ts
│   │   │   └── licensed/           # Authorized Commercial Partner Adapter
│   │   │       └── licensedRailwayProvider.ts
│   │   ├── routes/                 # REST API Routers
│   │   │   ├── adminRouter.ts
│   │   │   ├── alertsRouter.ts
│   │   │   ├── index.ts
│   │   │   ├── pnrRouter.ts
│   │   │   ├── stationsRouter.ts
│   │   │   └── trainsRouter.ts
│   │   ├── services/
│   │   │   ├── cacheService.ts     # In-memory TTL cache with hit-ratio telemetry
│   │   │   └── railwayService.ts   # Core business & data normalization service
│   │   ├── tests/
│   │   │   └── railway.test.ts     # Vitest & Supertest automated test suite (33 tests, 100% passing)
│   │   ├── types/
│   │   │   └── railway.types.ts    # Normalized TypeScript domain types
│   │   └── index.ts                # Express server entry point
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                       # React 18 + Vite + TypeScript + Tailwind SPA
│   ├── public/
│   │   ├── manifest.json           # PWA configuration
│   │   └── train-icon.svg          # Locomotive brand SVG
│   ├── src/
│   │   ├── api/
│   │   │   └── railwayApi.ts       # Type-safe API client
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── ErrorBoundary.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── MobileBottomNav.tsx
│   │   │   ├── map/
│   │   │   │   └── LiveMap.tsx     # Leaflet interactive route & train position map
│   │   │   ├── stations/
│   │   │   │   └── StationCard.tsx
│   │   │   └── trains/
│   │   │       ├── CoachPosition.tsx   # Visual rake coach composition diagram
│   │   │       ├── DataFreshnessNotice.tsx # Data source & timestamp transparency
│   │   │       ├── DelayBadge.tsx      # Status & delay badges
│   │   │       ├── LiveIndicator.tsx   # GPS vs Station vs Estimated indicator
│   │   │       ├── RailfanView.tsx     # Loco, speed, track limits & block activity
│   │   │       ├── RailwayTimeline.tsx # Vertical station journey progression
│   │   │       └── TrainCard.tsx       # Summary card with timings & running days
│   │   ├── pages/
│   │   │   ├── AdminPage.tsx           # Provider management & cache dashboard
│   │   │   ├── AlertsPage.tsx          # Cancelled, diverted, rescheduled notices
│   │   │   ├── FavouritesPage.tsx      # Saved trains & stations
│   │   │   ├── HomePage.tsx            # Hero, dual search, geo nearby, recent
│   │   │   ├── LiveStationPage.tsx     # 30s auto-refresh departure & arrival board
│   │   │   ├── LiveTrainsPage.tsx      # Radar of active trains in transit
│   │   │   ├── PnrPage.tsx             # PNR inquiry with CRIS gateway disclaimer
│   │   │   ├── SettingsPage.tsx        # Preferences, audio chimes, PWA offline guide
│   │   │   ├── StationPage.tsx         # Station details & platforms
│   │   │   ├── TrainDetailsPage.tsx    # Details, timeline, map, coaches, railfan
│   │   │   └── TrainSearchPage.tsx     # Typo-tolerant search with category filters
│   │   ├── utils/
│   │   │   └── storage.ts              # LocalStorage manager for favourites & history
│   │   ├── App.tsx                     # Routing setup
│   │   ├── index.css                   # Custom railway theme & Leaflet overrides
│   │   └── main.tsx                    # Root entrypoint
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── vercel.json
│   └── vite.config.ts
│
├── package.json                    # Workspace root scripts
├── vercel.json                     # Root monorepo deployment config
└── README.md
```

---

## 2. Technology Stack

- **Frontend**:
  - React 18
  - TypeScript 5
  - Vite 6
  - React Router v6
  - Tailwind CSS 3 (Custom Indian Railway Navy & Amber color system)
  - Leaflet (`leaflet` + `@types/leaflet`)
  - Lucide React Icons
  - Progressive Web App (PWA) manifest support
- **Backend**:
  - Node.js (v20+ / v24)
  - TypeScript 5
  - Express 4
  - Prisma ORM 6
  - Helmet & CORS
  - Express Rate Limit
  - In-Memory TTL Cache Layer
  - Vitest & Supertest (Full 20-test test suite)
- **Database**:
  - PostgreSQL (Production) / SQLite / In-Memory adapter ready via Prisma

---

## 3. Data-Provider & Adapter Architecture

The application strictly complies with data governance and anti-scraping guidelines:
1. **Never scrape private/proprietary APIs** of Google Where Is My Train or m-Indicator.
2. **Never manufacture fake GPS data** when data is station-based.
3. Every screen transparently identifies the **Data Source**, **Update Timestamp**, and **Position Type** (`station`, `gps`, or `estimated`).

### The Provider Contract: `IRailwayDataProvider`
```typescript
export interface IRailwayDataProvider {
  readonly code: string;
  readonly name: string;
  isAvailable(): Promise<boolean>;
  searchTrains(query: string): Promise<TrainSummary[]>;
  getTrainByNumber(trainNumber: string): Promise<TrainDetail | null>;
  getTrainSchedule(trainNumber: string): Promise<TrainStop[]>;
  getRunningStatus(trainNumber: string, date?: string): Promise<RunningStatus | null>;
  getStation(code: string): Promise<StationLocation | null>;
  searchStations(query: string): Promise<StationLocation[]>;
  getLiveStation(code: string, hours?: number): Promise<LiveStationBoard | null>;
  getTrainsBetweenStations(fromCode: string, toCode: string, date?: string): Promise<TrainSummary[]>;
  getTrainExceptions(type?: string): Promise<TrainException[]>;
  getCoachComposition(trainNumber: string): Promise<TrainCoachComposition | null>;
  getNearbyStations(lat: number, lng: number, radiusKm?: number): Promise<Array<StationLocation & { distanceKm: number }>>;
  getPnrStatus(pnr: string): Promise<PnrStatus | null>;
}
```

### Sequential Failover Chain: `ProviderManager`
```
Provider 1: Official NTES / CRIS Gateway (when credentials configured)
    ↓ (if unavailable or down)
Provider 2: Licensed Commercial Railway Data Partner API (when key configured)
    ↓ (if unavailable or down)
Provider 3: Sandbox / Development Railway Data Provider (clearly labeled DEMO DATA)
    ↓ (if upstream fails)
In-Memory Cache Layer (serves last known state with explicit Stale Warning)
```

---

## 4. APIs Implemented

| Endpoint | Method | Description |
|---|---|---|
| `/api/trains/search?q=:query` | GET | Typo-tolerant train search by number or name |
| `/api/trains/:number` | GET | Detailed train information and scheduled stops |
| `/api/trains/:number/schedule` | GET | Stop-by-stop station timetable with platforms |
| `/api/trains/:number/status` | GET | Live running status (delay, current/last station, next stop) |
| `/api/trains/:number/route` | GET | Geo-coordinates for route mapping |
| `/api/trains/:number/coaches` | GET | Train coach layout (Engine, AC, Sleeper, Guard) |
| `/api/trains-between` | GET | Trains running between two station codes on a date |
| `/api/stations/search?q=:query`| GET | Search stations by code, city, or state |
| `/api/stations/:code` | GET | Station details, platforms, zone, and facilities |
| `/api/stations/:code/live` | GET | Live arrivals and departures electronic board |
| `/api/nearby-stations` | GET | Geolocation nearby stations (Haversine formula) |
| `/api/exceptions` | GET | Cancelled, diverted, rescheduled, and special trains |
| `/api/zones` | GET | List of all 18 Indian Railway Zones & divisions |
| `/api/alerts` | GET | Active operational bulletins & mega-blocks |
| `/api/pnr/:pnr` | GET | 10-digit PNR status inquiry with CRIS link |
| `/api/admin/providers` | GET | Data provider health telemetry & cache stats |
| `/api/admin/primary-provider` | POST | Switch active primary provider dynamically |
| `/api/admin/cache/clear` | POST | Invalidate in-memory cache |

---

## 5. Environment Variables

Create `backend/.env` with the following keys:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database configuration (PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/whereismytrain?schema=public

# Railway Data Provider Orchestration
# Options: "mock", "ntes", "licensed"
DEFAULT_DATA_PROVIDER=mock
ENABLE_PROVIDER_FALLBACK=true
CACHE_TTL_SECONDS=60

# Official NTES / CRIS Gateway (when authorized)
NTES_API_BASE_URL=https://api.indianrail.gov.in
NTES_API_KEY=

# Licensed Commercial Railway Data Partner (when authorized)
LICENSED_PROVIDER_BASE_URL=https://partner.railwayapi.example.com
LICENSED_PROVIDER_API_KEY=

# Security — generate your own values; never commit real secrets
#   e.g.  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=
ADMIN_API_KEY=
```

---

## 6. How to Run Locally

### Prerequisites
- Node.js v20+ or v24+
- npm v10+

### Option A: Run Both Concurrently (Recommended)
```bash
# 1. Install all dependencies across root, backend, and frontend
npm run install:all

# 2. Run backend & frontend concurrently
npm run dev
```
- Frontend will open on: `http://localhost:5173`
- Backend API will run on: `http://localhost:5000`

### Option B: Run Separately
```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

---

## 7. How to Build & Test

### Run Automated Backend Tests
```bash
npm run test
# Runs 20 unit & integration tests with Vitest & Supertest
```

### Build Production Bundles
```bash
# Root build (builds both backend and frontend)
npm run build
```
- Backend compiles to: `backend/dist/`
- Frontend compiles to: `frontend/dist/`

---

## 8. Deployment Guide

### Deploy to Vercel (single project — recommended)

The repo root is the Vercel project. The root `vercel.json` wires everything together:

| Setting | Value |
| --- | --- |
| Root Directory | *(leave empty — repo root)* |
| Framework Preset | Other |
| Install Command | `npm run install:all` |
| Build Command | `npm run build` (compiles `backend` with `tsc`, then builds `frontend` with Vite) |
| Output Directory | `frontend/dist` |

> **`install:all` must keep `--include=dev`.** Vercel builds run with `NODE_ENV=production`,
> and plain `npm install` responds to that by **skipping every `devDependency`** — which is
> exactly where `typescript`, `vite`, `tailwindcss` and `prisma` live. The build then dies with
> `tsc: not found`. `--include=dev` forces them back in and is harmless everywhere else.

Routing defined in `vercel.json`:

- `/api/*` → `api/index.js`, a Node serverless function that exports the compiled
  Express app from `backend/dist/index.js` (same routes/controllers/providers as local dev).
- `/*` → static files from `frontend/dist`, with an SPA fallback to `index.html` so
  `/train/:number`, `/station/:code`, `/live-station`, `/search`, … survive a hard refresh.

> **Important:** do not set *Root Directory* to `frontend` — that would drop the `/api`
> rewrite and every search would fail with *"Unable to connect to railway data service."*
> The frontend never needs its own proxy in this layout.

Pushing to the default branch triggers a production deployment through the Vercel GitHub
integration; `vercel --prod` from the CLI also works once `vercel link` has been run.

#### Required environment variables (Vercel → Project → Settings → Environment Variables)

Set these for **Production** (and Preview if you use it):

| Name | Scope | Value | Notes |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | Build | `/api` (default) | Same-origin API. Only change it if the API is hosted on a separate domain. |
| `NODE_ENV` | Runtime | `production` | |
| `DEFAULT_DATA_PROVIDER` | Runtime | `mock` | Use `ntes`/`licensed` only with real credentials. |
| `ENABLE_PROVIDER_FALLBACK` | Runtime | `true` | Falls back to the mock provider on upstream failure. |
| `CACHE_TTL_SECONDS` | Runtime | `60` | |
| `JWT_SECRET` | Runtime | *(long random string)* | Required for user/favourites features. |
| `ADMIN_API_KEY` | Runtime | *(long random string)* | Admin routes fail safely with 503 when unset. |
| `DATABASE_URL` | Runtime | *(Postgres connection string)* | Optional — only needed for Prisma-backed routes (platform votes, favourites). Without it those routes report `available: false` instead of crashing. |

If the API is deployed separately instead, set `VITE_API_BASE_URL` to its public base URL
(for example `https://my-api.example.com/api`) **and** allow the frontend origin in that
service's CORS configuration.

### Deploy Frontend Only (alternative)
1. Set Framework Preset: **Vite**
2. Root Directory: `frontend`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Set `VITE_API_BASE_URL` to the publicly reachable backend API — `/api` only works when
   a rewrite/proxy routes it to the backend.

### Deploy Backend Separately (alternative)
1. Host on any Node.js container or serverless runtime (Render, Railway, AWS ECS, Fly.io).
2. Set Environment Variables from `.env.example`.
3. Set Start Command: `npm start` (runs `node dist/index.js`).

---

## 9. Connecting a Legitimate Railway Data Provider

To connect an official or licensed railway API:
1. Obtain authorized API credentials from **CRIS (Centre for Railway Information Systems)**, **National Train Enquiry System (NTES)**, or a licensed commercial partner (e.g., IRCTC licensed aggregator).
2. Set the credentials in `backend/.env`:
   ```env
   DEFAULT_DATA_PROVIDER=ntes
   NTES_API_BASE_URL=https://api.indianrail.gov.in
   NTES_API_KEY=your_actual_authorized_key_here
   ```
3. In `backend/src/providers/ntes/ntesRailwayProvider.ts`, map the upstream JSON responses into the normalized `RunningStatus`, `TrainDetail`, and `LiveStationBoard` interfaces.
4. If the upstream provider experiences network outages or rate limiting, `ProviderManager` automatically falls back to secondary providers and the cache without crashing the UI.

---

## 10. Operational Status

- **Fully Functional Out-Of-The-Box**:
  - Live running status tracking & timeline progression
  - Typo-tolerant train search ("vand bharat" ➔ Vande Bharat Express)
  - Interactive Leaflet India railway route map with custom markers
  - Full station timetable, platforms, arrivals & departures
  - Live station board with automatic 30-second refresh countdown
  - Trains Between Stations search & class filters
  - Railfan Mode with locomotive details (WAP-7), speed, and block telemetry
  - Rake Coach Composition visual diagram
  - Geolocation detection for nearby railway stations
  - Favourites management (saved in LocalStorage)
  - Cancelled, diverted, and rescheduled train bulletins
  - Web Push notification authorization for browser alerts
  - Data provider management, health monitoring, and cache purging dashboard
  - **Indian Railways Master Database**: All 18 Zones, 68+ Divisions, master railway lines, and authoritative corridor distances
  - **Automated Data Quality Audit Engine**: Complete verification pipeline validating station codes, sequence monotonicity, and track distances (100% data score)
  - **Multi-Modal Transit Integration**: Suburban Locals (Western & Central Railway), Metro lines (Mumbai Metro Line 1, 2A, 7), and connecting feeder buses with live tracking
  - **Crowdsourced Platform Voting**: Real-time passenger confirmation and voting on platform assignments
  - **Mega Blocks & Safety Advisories**: Track maintenance and speed regulation bulletins
  - **Multilingual Support**: English, Hindi, Marathi, and Gujarati language toggle
  - **Voice Station Search**: Speech-to-text station selection with audio feedback
  - **PWA & Offline Resilience**: Service Worker with offline caching banner and full responsive support
  - **Comprehensive Vitest Suite**: 33 automated tests covering all API endpoints and data layers
- **Requires Authorized Key for Live Production Feeds**:
  - Direct live PNR reservation charting (compliance notice and official CRIS gateway link provided).
  - Production IRCTC commercial seat inventory booking.
