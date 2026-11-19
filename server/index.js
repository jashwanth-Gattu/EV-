// server/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { getChargers } from './chargersService.js';
import { getNearbyRestaurants } from './restaurantsService.js';
import { searchHyderabadLocations } from './geocodeService.js';
import { globalCache } from './cache.js';
import { HYDERABAD_BOUNDS, isWithinHyderabad } from './geoUtils.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.path.startsWith('/api/')) {
      console.log(`[API] ${req.method} ${req.originalUrl} - ${res.statusCode} (${Date.now() - start}ms)`);
    }
  });
  next();
});

/**
 * Health & Status check
 */
app.get('/api/health', (req, res) => {
  const ocmConfigured = Boolean(process.env.OPEN_CHARGE_MAP_KEY?.trim());
  res.json({
    status: 'ok',
    app: 'ChargeNEat Hyderabad',
    ocmConfigured,
    cacheStats: globalCache.getStats(),
    hyderabadBounds: HYDERABAD_BOUNDS
  });
});

/**
 * GET /api/chargers
 * Query params: lat, lng, distance (km, default 5, max 30)
 */
app.get('/api/chargers', async (req, res) => {
  try {
    let lat = parseFloat(req.query.lat);
    let lng = parseFloat(req.query.lng);
    let distance = parseFloat(req.query.distance) || 5;

    // Validate coordinates or default to Hyderabad center
    if (isNaN(lat) || isNaN(lng) || !isWithinHyderabad(lat, lng)) {
      lat = HYDERABAD_BOUNDS.defaultCenter.lat;
      lng = HYDERABAD_BOUNDS.defaultCenter.lng;
    }

    // Restrict distance between 1km and 30km
    distance = Math.max(1, Math.min(30, distance));

    const data = await getChargers(lat, lng, distance);
    res.json(data);
  } catch (err) {
    console.error('Error in /api/chargers:', err);
    res.status(500).json({
      error: 'Failed to retrieve charging stations',
      message: err.message,
      chargers: []
    });
  }
});

/**
 * GET /api/restaurants
 * Query params: lat, lng, radius (meters, default 500, max 1500)
 */
app.get('/api/restaurants', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = Math.min(1500, Math.max(100, parseInt(req.query.radius, 10) || 500));

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Valid lat and lng query parameters required' });
    }

    const data = await getNearbyRestaurants(lat, lng, radius);
    res.json(data);
  } catch (err) {
    console.error('Error in /api/restaurants:', err);
    res.status(500).json({
      error: 'Failed to retrieve restaurants',
      message: err.message,
      restaurants: []
    });
  }
});

/**
 * GET /api/geocode
 * Query params: q (location query in Hyderabad)
 */
app.get('/api/geocode', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) {
      return res.json([]);
    }

    const results = await searchHyderabadLocations(q);
    res.json(results);
  } catch (err) {
    console.error('Error in /api/geocode:', err);
    res.status(500).json({ error: 'Geocoding failed', results: [] });
  }
});

// Serve static assets in production if dist directory exists
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

app.listen(PORT, () => {
  console.log(`⚡ ChargeNEat Hyderabad server running on port ${PORT}`);
  console.log(`⚡ Open Charge Map key configured: ${Boolean(process.env.OPEN_CHARGE_MAP_KEY?.trim())}`);
  console.log(`⚡ Ready for free API requests with in-memory caching.`);
});
