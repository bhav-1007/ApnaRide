# ApnaRide

A ride-hailing app (riders book, nearby captains accept, live tracking, earnings dashboard) built on the MERN stack with native Socket.IO realtime communication.

> **Credit:** this project started from an open-source "Uber clone" tutorial codebase. The backend has since been
> re-engineered (geospatial matching, atomic ride state transitions, role-based auth, Socket.IO realtime, aggregation
> analytics, tests) and the frontend was rebuilt on top of the new API.

## Architecture

```
                 ApnaRide Local Architecture
 ┌──────────────────────────────────────────────┐
 │ React (Vite) on http://localhost:5173        │──▶ MongoDB (Local / Atlas)
 │ Express API on http://localhost:4000         │
 └───────────▲────────────────────┬─────────────┘
             └───── Socket.IO ────┘  (server-client bidirectional WebSocket)
```

```
apnaride/
  .env              single env file for everything (pre-configured)
  backend/          Express app, MVC architecture (controllers, models, routes, utils, config)
  frontend/         React + Vite site (components, pages, layouts, services, utils, hooks, context)
```

- **Realtime with Socket.IO:** Authenticated WebSocket connection using JWT handshake (`user:<id>`, `captain:<id>`, `ride:<id>` rooms).
- **Dispatch:** a ride is stored with GeoJSON pickup coordinates; the nearest active captains of the requested vehicle
  type (`$near` on a `2dsphere` index) get notified. Captains can also fetch `GET /rides/nearby`.
- **Accept is atomic:** `findOneAndUpdate({ _id, status: 'pending' }, …)`. Concurrent accepts → one `200`, rest `409`.
- **DB-enforced invariants:** partial unique indexes allow one live ride per rider and one busy ride per captain.
- **Auth:** JWT with a `role` claim; logout blacklists the token (TTL index); password-reset OTPs are hashed,
  expire in 15 min, and lock after 5 wrong attempts.
- **Analytics:** captain earnings come from a single `$facet` aggregation, bucketed in the app timezone.

## API summary

| Method | Path | Who | Purpose |
|---|---|---|---|
| POST | `/users/register` `/users/login` | public | rider auth |
| POST | `/captains/register` `/captains/login` | public | captain auth (with vehicle) |
| GET | `/maps/suggestions?input=` | rider | place search (Photon/OSM) |
| POST | `/rides/quote` | rider | route + fare per vehicle (OSRM) |
| POST | `/rides` | rider | book a ride, notify nearby captains |
| POST | `/rides/:id/cancel` · `/pay` | rider | cancel / confirm cash payment |
| GET | `/rides/nearby` | captain | pending rides near me |
| POST | `/rides/:id/accept` · `/start` (otp) · `/end` | captain | ride lifecycle |
| PUT | `/captains/status` · POST `/captains/location` | captain | go online/offline, stream position |
| GET | `/captains/stats` | captain | earnings dashboard (aggregation) |
| GET | `/rides/active` · `/rides/history?page&limit&status` | both | current ride, paginated history |

## Frontend (`frontend/`)

React 18 + Vite + Tailwind, React Router, Leaflet (OpenStreetMap tiles), Socket.IO Client.

- The rider screen derives live state from `GET /rides/active`; Socket.IO events keep it updated in real-time.
- Captains stream their GPS position every 8 s while online; the rider sees it live on the ride room.
- `src/services` holds the API client; `src/hooks/useSocket.js` manages room join/leave and event listeners.

## How to run locally

### 1. Install dependencies (First time only)
```bash
npm run install:all
```

### 2. Start both Backend & Frontend together
```bash
npm run dev
```
- **Backend API:** `http://localhost:4000`
- **Frontend App:** `http://localhost:5173`

> **Testing a full ride locally:** Open two browser windows (one in normal mode as a Rider, and one in an Incognito window as a Captain). Go online as captain, book a ride as rider, and see instant live dispatch, acceptance, and OTP start.

