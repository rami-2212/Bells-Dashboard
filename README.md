# Smart Road GIS Dashboard
## Waterberg District, South Africa

Full-stack Web GIS platform for managing Smart Road infrastructure:
- **~2,500 km** of road segments (RS-01→RS-32 rural, UIR-01→UIR-06 urban)
- **90,000** smart solar street light poles with LoRaWAN IoT telemetry
- **3,300** AI-enabled CCTV cameras with Edge-AI alert processing

---

## Architecture

```
smart-road-gis/
├── backend/          # Node.js/Express REST API + WebSocket server
│   └── src/
│       ├── routes/   # wfs.js, poles.js, iot.js, alerts.js
│       ├── services/ # DPMBM state machine
│       ├── websocket/# Real-time WS broadcast
│       └── db/       # PostgreSQL/PostGIS pool
├── frontend/         # React + Leaflet dashboard
│   └── src/
│       ├── components/ # MapView, PolesSidebar, IncidentModal, AlertsPanel
│       ├── hooks/      # useWebSocket
│       └── services/   # API client
├── database/
│   ├── migrations/   # 001_create_tables.sql
│   └── seeds/        # 001_seed_data.sql
└── docker-compose.yml
```

## Quick Start

### With Docker Compose
```bash
docker-compose up -d
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001
# DB:       localhost:5432
```

### Manual Development
```bash
# 1. Start PostgreSQL + PostGIS (requires local install)
createdb smart_road_gis
psql smart_road_gis < database/migrations/001_create_tables.sql
psql smart_road_gis < database/seeds/001_seed_data.sql

# 2. Backend
cd backend && cp .env.example .env
npm install && npm run dev

# 3. Frontend
cd frontend && npm install && npm start
```

---

## API Endpoints

### OGC Web Feature Services (WFS)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wfs/capabilities` | WFS GetCapabilities |
| GET | `/api/wfs/road-segments` | Road segments as GeoJSON FeatureCollection |
| GET | `/api/wfs/poles-assets`  | Poles as GeoJSON FeatureCollection |

**Query params:** `bbox=minLon,minLat,maxLon,maxLat`, `segment_id`, `dpmbm_status`, `road_class`

### Poles Assets (CRUD)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/poles` | List all poles (paginated) |
| GET    | `/api/poles/:asset_id` | Single pole + telemetry history |
| POST   | `/api/poles` | Create new pole |
| PUT    | `/api/poles/:asset_id` | Update pole |
| PATCH  | `/api/poles/:asset_id/status` | **DPMBM state transition** |
| DELETE | `/api/poles/:asset_id` | Delete pole |

### DPMBM State Machine
Valid transitions: `Design → Plan → Manage → Build → Maintain → Manage`

```json
PATCH /api/poles/PA-RS01-0001/status
{ "status": "Plan", "transitioned_by": "engineer-1", "notes": "Site survey complete" }
```

### IoT LoRaWAN
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/iot/telemetry` | Receive LoRaWAN gateway payload |
| POST | `/api/iot/control`   | Remote control (dim/on/off/group) |
| GET  | `/api/iot/telemetry/:asset_id` | Historical telemetry |

### AI Alerts (Edge-AI CCTV)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST  | `/api/ai/alerts` | **Webhook** for Edge-AI triggers |
| GET   | `/api/ai/alerts` | Fetch alerts with filters |
| PATCH | `/api/ai/alerts/:alert_id/acknowledge` | Acknowledge alert |
| PATCH | `/api/ai/alerts/:alert_id/dispatch`    | Dispatch SAPS/Fire/Ambulance |

**Valid alert types:** `Vehicle`, `Pedestrian`, `Animal`, `Stopped Vehicle Detection`, `Debris on Roadway`, `Illegal Off-ramping`

**Real-time:** New alerts broadcast via WebSocket (`ws://localhost:3001/ws`)

---

## Database Schema

### road_segments
Segment IDs: `RS-01`–`RS-32` (rural), `UIR-01`–`UIR-06` (urban)
Geometry: `LINESTRING` (PostGIS, SRID 4326)

### poles_assets
- **Pole heights:** 6m, 8m, 10m, 11.5m
- **Foundation codes:** FC6–FC11 (concrete), FH150–FH250 (helical)
- **Luminaire types:** EDEN 80W/90W/100W, AURA 40W/50W/60W
- **Scenario codes:** SL2, SL4, SX2, ST4, P-URB, SS8, SS5, SL4S, PED-X, SS4, SS7, SS3
- **DPMBM status:** Design, Plan, Manage, Build, Maintain

### iot_telemetry
Voltage, current, energy consumption, operational status, battery level, solar irradiance

### ai_alerts
Alert type, PostGIS Point coordinates, severity, dispatch log (JSONB)

---

## Frontend Features

- **Map:** Leaflet centered on Waterberg District (−24.18, 28.91)
- **Road Segments:** Color-coded polylines (blue=rural, orange=urban)
- **Pole Markers:** Color-coded by DPMBM status (Gray/Blue/Yellow/Orange/Green)
- **Pole Sidebar:** Scenario, Foundation, Luminaire, IoT charts (Energy + Voltage)
- **Live Alerts:** WebSocket-driven flashing markers + AlertsPanel overlay
- **Incident Modal (SOP):** Auto-opens on alert click → dispatch SAPS/Fire/Ambulance
