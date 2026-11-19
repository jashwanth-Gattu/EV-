# ChargeNEat Hyderabad ⚡🍽️

A mobile-first web application that helps EV owners in Hyderabad, India discover nearby charging stations and find restaurants, cafes, and eateries within walking distance (500m) while their vehicle charges.

> **Zero Paid APIs Guarantee**: Built exclusively with 100% free community and open-source APIs. No Google Maps, no Google Places, no billing accounts, and no credit card required.

---

## ✨ Features

1. **Location & Hyderabad Geocoding**
   - Centered on the user's browser geolocation.
   - If location access is denied or user is outside Hyderabad, defaults cleanly to Hyderabad center (`17.3850, 78.4867`).
   - Nominatim search box strictly bounded to Greater Hyderabad.
   - One-tap quick hotspot shortcuts: **HITEC City**, **Gachibowli**, **Banjara Hills**, **Secunderabad**, **Kukatpally**, and **Uppal**.

2. **EV Charger Map & Proximity**
   - Leaflet interactive map with custom color-coded EV pins (Emerald: DC Fast $\ge$ 50 kW, Sky: Fast AC $\ge$ 22 kW, Amber: Standard $\ge$ 7 kW).
   - Adjustable radius slider from **1 km up to 30 km** (default 5 km).
   - Marker popups and synchronized cards showing station name, operator, connectors, power rating (kW), and distance.

3. **Restaurant Connection (500m Walkshed)**
   - When any charger is tapped, a detail panel opens with restaurants, cafes, and fast-food places within **500 m** (via Overpass API).
   - Displays eatery name, amenity type, cuisine, walking distance in meters, estimated walking time, and dietary tags (e.g., Pure Veg).
   - Displays a 500m radius circle and pins on the map around the selected charger.
   - Graceful fallback: Shows *"No restaurants mapped nearby."* if no food places are mapped within 500m.

4. **100% Free Navigation**
   - One-tap navigation links that open **OpenStreetMap directions** (via FOSSGIS OSRM routing) and native device `geo:` URIs.

5. **Synced List & Map**
   - Bottom-sheet list of chargers sorted by distance.
   - Selecting a card highlights the charger on the map and loads nearby food.
   - Mobile-first responsive layout with instant Map/List tab toggles.

6. **Basic Filters**
   - **Minimum Power**: Any / 7 kW+ / 22 kW+ / 50 kW+.
   - **Food Availability Toggle**: "Only chargers with a restaurant nearby".

7. **Caching & Fair Use**
   - Tiny Express proxy with built-in in-memory TTL caching (15 minutes) to respect free community API rate limits.
   - Out-of-the-box automatic fallback to Overpass API if no Open Charge Map key is provided.

---

## 🔑 Free API Keys & Service Policy

| Service | Purpose | Free Key Needed? | Sign-up Link / Policy |
| :--- | :--- | :---: | :--- |
| **Open Charge Map** | Primary EV charger registry | **Yes (Free)** | [Register for Free API Key](https://openchargemap.org/site/develop/api) |
| **Overpass API** | Fallback chargers & nearby restaurants | No | [Overpass API Usage Policy](https://wiki.openstreetmap.org/wiki/Overpass_API#Usage_Policy) (Cached) |
| **Nominatim (OSM)** | Hyderabad location search | No | [Nominatim Fair Use Policy](https://operations.osmfoundation.org/policies/nominatim/) (Cached + User-Agent) |
| **Leaflet & OSM Tiles**| Interactive map rendering | No | [OpenStreetMap Copyright & ODbL](https://www.openstreetmap.org/copyright) |

> ℹ️ **Automatic Fallback**: If you do not have an Open Charge Map key yet, the application **automatically falls back to OpenStreetMap Overpass API** for charging stations, so the app is 100% functional right out of the box!

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- Node.js (v18+ recommended)
- npm

### 1. Clone & Install
```bash
git clone <repo-url>
cd project
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` (optional free key):
```env
PORT=5001
# Optional: Add your free Open Charge Map key here
# If left blank, Overpass API is used automatically
OPEN_CHARGE_MAP_KEY=
```

### 3. Run Locally
```bash
npm run dev
```
- Express proxy runs on `http://localhost:5001`
- Vite frontend runs on `http://localhost:5173` (proxies `/api` to Express)
- Open `http://localhost:5173` in your browser.

---

## 🌐 Free Deployment Guide

### Option A: Render.com (Full-stack on Free Tier - Recommended)
Deploy both the React frontend and Express backend together in a single free service:
1. Push your repository to GitHub.
2. Sign in to [Render.com](https://render.com) and click **New + > Web Service**.
3. Select your GitHub repository.
4. Set the following settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `OPEN_CHARGE_MAP_KEY` = *(your free key from Open Charge Map, optional)*
6. Click **Deploy Web Service**. Render serves the Express API and the static React SPA together on your free `.onrender.com` URL!

---

### Option B: Vercel / Netlify (Frontend) + Render (Backend)
If you prefer hosting the frontend on Vercel/Netlify:

#### Backend (Render Free Web Service):
1. Create a Web Service on Render with Build Command `npm install` and Start Command `npm run dev:server`.
2. Note your backend URL (e.g. `https://chargeneat-api.onrender.com`).

#### Frontend (Vercel):
1. In `vite.config.js`, update the proxy target or set a `VITE_API_BASE_URL` environment variable pointing to your Render backend.
2. Push to GitHub and import the project into [Vercel](https://vercel.com).
3. Build Command: `npm run build`, Output Directory: `dist`.
4. Deploy!

---

## 📱 Mobile-First Design & Screenshots
- Large touch targets ($\ge 44\text{px}$) designed for one-handed mobile navigation.
- Dark theme optimized for night-time charging sessions and OLED screens.
- Leaflet map with CartoDB Dark Matter / Standard OSM toggle.
- Clear community disclaimer: *"Charger data is community-sourced and may be outdated."*

---

## 📜 License & Attribution
- Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) (ODbL).
- Charger data © [Open Charge Map](https://openchargemap.org) and OpenStreetMap contributors.
- Geocoding powered by [Nominatim](https://nominatim.openstreetmap.org).
