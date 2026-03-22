# Deployment Guide — Vercel (Frontend) + Railway (Backend)

## Overview

```
Browser → Vercel (React + Password Gate)
               ↕ HTTPS/WSS
         Railway (Express API + WebSocket)
               ↕
         Railway PostgreSQL + PostGIS
```

---

## Step 1 — Deploy Backend to Railway

### 1.1 Create Railway project

1. Go to [railway.app](https://railway.app) → **New Project**
2. Choose **Deploy from GitHub repo** → select `Bells-Dashboard`
3. Set **Root Directory** to `backend`
4. Railway auto-detects Node.js via `package.json`

### 1.2 Add PostgreSQL + PostGIS

1. In your Railway project → **+ New** → **Database** → **PostgreSQL**
2. Railway automatically sets `DATABASE_URL` in your backend service

> **Important:** Railway's default PostgreSQL does NOT include PostGIS.
> After the DB is created, open the **Query** tab and run:
> ```sql
> CREATE EXTENSION IF NOT EXISTS postgis;
> CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
> ```

### 1.3 Set environment variables

In Railway → your backend service → **Variables**, add:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `CORS_ORIGIN` | `https://your-app.vercel.app` ← fill in after Vercel deploy |

`DATABASE_URL` is set automatically by the Railway PostgreSQL plugin.

### 1.4 Seed the database

After first deploy, in Railway → backend service → **Shell**:
```bash
npm run db:seed
```

### 1.5 Note your Railway URL

It will look like: `https://smart-road-backend-production.up.railway.app`

---

## Step 2 — Deploy Frontend to Vercel

### 2.1 Import project

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import `Bells-Dashboard` from GitHub
3. Set **Root Directory** to `frontend`
4. Framework: **Create React App** (auto-detected)

### 2.2 Set environment variables

In Vercel → Project → **Settings** → **Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `REACT_APP_API_URL` | `https://your-backend.up.railway.app` |
| `REACT_APP_WS_URL` | `wss://your-backend.up.railway.app/ws` |
| `REACT_APP_PREVIEW_PASSWORD` | `your-secret-password` |

### 2.3 Deploy

Click **Deploy** — Vercel builds the React app and serves it globally.

---

## Step 3 — Update CORS on Railway

Once you have your Vercel URL (e.g. `https://smart-road-gis.vercel.app`),
go back to Railway → backend → Variables and update:

```
CORS_ORIGIN=https://smart-road-gis.vercel.app
```

Then redeploy the backend.

---

## Password Gate

The dashboard is protected by a password screen before the app loads.

- Password is set via `REACT_APP_PREVIEW_PASSWORD` in Vercel env vars
- Stored in `sessionStorage` — expires when the browser tab closes
- Default fallback (dev only): `waterberg2024`
- **Change this before deploying!**

---

## Architecture Notes

- **WebSocket** works over `wss://` on Railway (TLS termination handled automatically)
- **PostGIS** must be manually enabled on the Railway PostgreSQL instance
- **Migrations** run automatically on every `npm start` (idempotent)
- **Seeds** run once manually via Railway Shell
