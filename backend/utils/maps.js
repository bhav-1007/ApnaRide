const axios = require('axios');
const { HttpError } = require('./httpError');

// Geocoding and routing services:
// 1. OpenStreetMap Nominatim (primary - fast, accurate address breakdown)
// 2. Komoot Photon (secondary fallback)
// 3. Local landmark dictionary (offline/high-latency resilience fallback)
// 4. OSRM public server for driving routes (with haversine route fallback)

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const PHOTON_SEARCH_URL = 'https://photon.komoot.io/api/';
const PHOTON_REVERSE_URL = 'https://photon.komoot.io/reverse';
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';

const INDIA_BBOX = '68.1,6.7,97.4,35.7'; // minLon,minLat,maxLon,maxLat
const HTTP_TIMEOUT = 5000;
const USER_AGENT = 'ApnaRideUrbanMobilityApp/1.0 (apnaride.project.dev@gmail.com)';

// In-memory LRU cache to serve repeated place searches instantaneously
const cache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_CACHE_SIZE = 250;

function getCached(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.time > CACHE_TTL_MS) {
        cache.delete(key);
        return null;
    }
    return entry.val;
}

function setCache(key, val) {
    if (cache.size >= MAX_CACHE_SIZE) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
    }
    cache.set(key, { val, time: Date.now() });
}

// Popular landmarks for instant offline fallback
const POPULAR_LANDMARKS = [
    { label: 'Koramangala 5th Block, Bengaluru, Karnataka', lat: 12.9352, lng: 77.6245 },
    { label: 'Indiranagar 100ft Road, Bengaluru, Karnataka', lat: 12.9784, lng: 77.6408 },
    { label: 'MG Road Metro Station, Bengaluru, Karnataka', lat: 12.9756, lng: 77.6066 },
    { label: 'HSR Layout Sector 1, Bengaluru, Karnataka', lat: 12.9116, lng: 77.6389 },
    { label: 'Whitefield ITPL Main Road, Bengaluru, Karnataka', lat: 12.9856, lng: 77.7314 },
    { label: 'Electronic City Phase 1, Bengaluru, Karnataka', lat: 12.8452, lng: 77.6602 },
    { label: 'Kempegowda International Airport (BLR), Bengaluru, Karnataka', lat: 13.1986, lng: 77.7066 },
    { label: 'KSR Bengaluru City Railway Station (Majestic), Bengaluru', lat: 12.9781, lng: 77.5695 },
    { label: 'Jayanagar 4th Block, Bengaluru, Karnataka', lat: 12.9299, lng: 77.5838 },
    { label: 'Church Street, Shanthala Nagar, Bengaluru, Karnataka', lat: 12.9749, lng: 77.6045 },
    { label: 'Bellandur EcoSpace, Outer Ring Road, Bengaluru', lat: 12.9260, lng: 77.6762 },
    { label: 'Marathahalli Bridge, Bengaluru, Karnataka', lat: 12.9569, lng: 77.7011 },
    { label: 'Hebbal Flyover, Bengaluru, Karnataka', lat: 13.0358, lng: 77.5970 },
    { label: 'BTM Layout 2nd Stage, Bengaluru, Karnataka', lat: 12.9166, lng: 77.6101 },
    { label: 'Malleshwaram 8th Cross, Bengaluru, Karnataka', lat: 13.0031, lng: 77.5701 },
    { label: 'Connaught Place, New Delhi, Delhi', lat: 28.6315, lng: 77.2167 },
    { label: 'Indira Gandhi International Airport (DEL), New Delhi', lat: 28.5562, lng: 77.1000 },
    { label: 'Bandra Kurla Complex (BKC), Mumbai, Maharashtra', lat: 19.0662, lng: 72.8687 },
    { label: 'Chhatrapati Shivaji Maharaj Terminus (CSMT), Mumbai', lat: 18.9401, lng: 72.8354 },
    { label: 'Marine Drive, Nariman Point, Mumbai, Maharashtra', lat: 18.9220, lng: 72.8223 },
    { label: 'Hitech City Cyber Towers, Hyderabad, Telangana', lat: 17.4504, lng: 78.3808 },
    { label: 'T. Nagar Panagal Park, Chennai, Tamil Nadu', lat: 13.0418, lng: 80.2341 },
];

const buildPhotonLabel = (p) => {
    const parts = [ p.name, p.street, p.district || p.locality, p.city, p.state ].filter(Boolean);
    return [ ...new Set(parts) ].join(', ');
};

const buildNominatimLabel = (item) => {
    const a = item.address || {};
    const primary = item.name || a.road || a.amenity || a.building || a.suburb;
    const locality = a.suburb || a.neighbourhood || a.city_district;
    const city = a.city || a.town || a.village || a.county;
    const state = a.state;

    const parts = [
        primary,
        locality && locality !== primary ? locality : null,
        city && city !== primary && city !== locality ? city : null,
        state,
    ].filter(Boolean);

    const unique = [ ...new Set(parts) ];
    if (unique.length > 0) return unique.join(', ');
    return (item.display_name || '').split(',').slice(0, 3).map((s) => s.trim()).join(', ');
};

const dedupeByLabel = (list) => {
    const seen = new Set();
    return list.filter((item) => {
        const key = item.label.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

function searchLandmarks(query) {
    const q = query.toLowerCase().trim();
    const words = q.split(/\s+/).filter(Boolean);
    return POPULAR_LANDMARKS.filter((lm) => {
        const labelLower = lm.label.toLowerCase();
        return words.every((w) => labelLower.includes(w));
    });
}

function findNearestLandmark(lat, lng) {
    let nearest = null;
    let minDist = Infinity;
    for (const lm of POPULAR_LANDMARKS) {
        const dist = Math.hypot(lm.lat - lat, lm.lng - lng);
        if (dist < minDist) {
            minDist = dist;
            nearest = lm;
        }
    }
    return nearest;
}

async function searchPlaces(input) {
    if (!input || input.trim().length < 3) return [];
    const query = input.trim();
    const cacheKey = `search:${query.toLowerCase()}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    // 1. Try Nominatim (fastest & rich address metadata)
    try {
        const { data } = await axios.get(NOMINATIM_SEARCH_URL, {
            params: {
                q: query,
                format: 'json',
                addressdetails: 1,
                limit: 8,
                countrycodes: 'in',
            },
            timeout: HTTP_TIMEOUT,
            headers: { 'User-Agent': USER_AGENT },
        });

        if (Array.isArray(data) && data.length > 0) {
            const results = dedupeByLabel(
                data.map((item) => ({
                    label: buildNominatimLabel(item),
                    lat: parseFloat(item.lat),
                    lng: parseFloat(item.lon),
                })).filter((p) => p.label && !Number.isNaN(p.lat) && !Number.isNaN(p.lng)),
            ).slice(0, 6);

            if (results.length > 0) {
                setCache(cacheKey, results);
                return results;
            }
        }
    } catch {
        // Fall through to Photon
    }

    // 2. Try Photon fallback
    try {
        const { data } = await axios.get(PHOTON_SEARCH_URL, {
            params: { q: query, limit: 6, lang: 'en', bbox: INDIA_BBOX },
            timeout: HTTP_TIMEOUT,
            headers: { 'User-Agent': USER_AGENT },
        });

        const results = (data.features || []).map((f) => ({
            label: buildPhotonLabel(f.properties),
            lat: f.geometry.coordinates[ 1 ],
            lng: f.geometry.coordinates[ 0 ],
        })).filter((p) => p.label && !Number.isNaN(p.lat) && !Number.isNaN(p.lng));

        if (results.length > 0) {
            const deduped = dedupeByLabel(results).slice(0, 6);
            setCache(cacheKey, deduped);
            return deduped;
        }
    } catch {
        // Fall through to landmark search
    }

    // 3. Fallback to curated landmarks
    const landmarkResults = searchLandmarks(query);
    if (landmarkResults.length > 0) {
        return landmarkResults.slice(0, 6);
    }

    // Return empty list so UI displays helpful "No places found" instead of an error
    return [];
}

async function reversePlace(lat, lng) {
    const numLat = Number(lat);
    const numLng = Number(lng);
    if (Number.isNaN(numLat) || Number.isNaN(numLng)) {
        throw new HttpError(400, 'Valid lat and lng are required');
    }

    const cacheKey = `rev:${numLat.toFixed(4)},${numLng.toFixed(4)}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    // 1. Try Nominatim reverse
    try {
        const { data } = await axios.get(NOMINATIM_REVERSE_URL, {
            params: { lat: numLat, lon: numLng, format: 'json', addressdetails: 1 },
            timeout: HTTP_TIMEOUT,
            headers: { 'User-Agent': USER_AGENT },
        });
        if (data && (data.address || data.display_name)) {
            const label = buildNominatimLabel(data) || 'Pinned location';
            const result = { label, lat: numLat, lng: numLng };
            setCache(cacheKey, result);
            return result;
        }
    } catch {
        // Fall through to Photon
    }

    // 2. Try Photon reverse
    try {
        const { data } = await axios.get(PHOTON_REVERSE_URL, {
            params: { lat: numLat, lon: numLng, lang: 'en' },
            timeout: HTTP_TIMEOUT,
            headers: { 'User-Agent': USER_AGENT },
        });
        const feature = data.features?.[ 0 ];
        const label = feature ? buildPhotonLabel(feature.properties) : '';
        if (label) {
            const result = { label, lat: numLat, lng: numLng };
            setCache(cacheKey, result);
            return result;
        }
    } catch {
        // Fall through to nearest landmark or coordinates
    }

    // 3. Resilient fallback: nearest landmark or clean coordinate label
    const nearest = findNearestLandmark(numLat, numLng);
    const label = nearest
        ? `Near ${nearest.label}`
        : `Location (${numLat.toFixed(4)}, ${numLng.toFixed(4)})`;

    const result = { label, lat: numLat, lng: numLng };
    setCache(cacheKey, result);
    return result;
}

// Fallback straight-line / city-routed estimation if OSRM is unreachable
function calculateFallbackRoute(from, to) {
    const dLat = ((to.lat - from.lat) * Math.PI) / 180;
    const dLng = ((to.lng - from.lng) * Math.PI) / 180;
    const lat1 = (from.lat * Math.PI) / 180;
    const lat2 = (to.lat * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightKm = 6371 * c;

    // Road factor ~1.3x for city driving
    const roadMeters = Math.max(500, Math.round(straightKm * 1300));
    // Avg speed ~25 km/h in city traffic
    const durationSeconds = Math.max(120, Math.round((roadMeters / (25 * 1000)) * 3600));

    return {
        distance: roadMeters,
        duration: durationSeconds,
        geometry: {
            type: 'LineString',
            coordinates: [
                [ from.lng, from.lat ],
                [ to.lng, to.lat ],
            ],
        },
    };
}

// Returns { distance (meters), duration (seconds), geometry (GeoJSON LineString) }
async function getRoute(from, to) {
    const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
    let data;
    try {
        ({ data } = await axios.get(`${OSRM_URL}/${coords}`, {
            params: { overview: 'simplified', geometries: 'geojson' },
            timeout: HTTP_TIMEOUT,
        }));
    } catch (err) {
        if (err.response?.data?.code === 'NoRoute') {
            throw new HttpError(422, 'No drivable route between these places');
        }
        return calculateFallbackRoute(from, to);
    }

    const route = data.routes?.[ 0 ];
    if (!route) {
        return calculateFallbackRoute(from, to);
    }

    return {
        distance: Math.round(route.distance),
        duration: Math.round(route.duration),
        geometry: route.geometry,
    };
}

module.exports = {
    searchPlaces,
    reversePlace,
    getRoute,
};
