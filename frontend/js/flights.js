/**
 * Aviation Change Impact Analyzer - Live Flight Surveillance Center
 * Clear Geographical Leaflet World Map (No API Key Required / No Watermark)
 * 100% English Country, City & Maritime Names
 * Visible Great-Circle Flight Routes & Airport Terminals
 * Continuous 60fps Smooth Aircraft Animation from Origin to Destination
 */

let map = null;
let tileLayers = {};
let currentLayerKey = 'dark';
const layerOrder = ['dark', 'topo', 'street', 'satellite'];
const layerLabels = {
  dark: 'Dark Aviation (English)',
  topo: 'Clear World Map (English)',
  street: 'Clear Airspace (English)',
  satellite: 'Satellite (English)'
};

// IATA Codes & English Airport Details
const AIRPORT_IATA = {
  'Chennai': { iata: 'MAA', name: "Chennai Int'l Airport", city: 'Chennai', country: 'India' },
  'Delhi': { iata: 'DEL', name: "Indira Gandhi Int'l Airport", city: 'New Delhi', country: 'India' },
  'Mumbai': { iata: 'BOM', name: "Chhatrapati Shivaji Maharaj Int'l", city: 'Mumbai', country: 'India' },
  'Bengaluru': { iata: 'BLR', name: "Kempegowda Int'l Airport", city: 'Bengaluru', country: 'India' },
  'Singapore': { iata: 'SIN', name: "Singapore Changi Airport", city: 'Singapore', country: 'Singapore' },
  'Dubai': { iata: 'DXB', name: "Dubai Int'l Airport", city: 'Dubai', country: 'United Arab Emirates' },
  'London': { iata: 'LHR', name: "London Heathrow Airport", city: 'London', country: 'United Kingdom' },
  'Tokyo': { iata: 'HND', name: "Tokyo Haneda Airport", city: 'Tokyo', country: 'Japan' },
  'Kochi': { iata: 'COK', name: "Cochin Int'l Airport", city: 'Kochi', country: 'India' },
  'Coimbatore': { iata: 'CJB', name: "Coimbatore Int'l Airport", city: 'Coimbatore', country: 'India' }
};

// Strategic English Maritime & Airspace Corridor Labels (Non-colliding with airport badges)
const ENGLISH_GEOGRAPHIC_LABELS = [
  { name: 'ARABIAN SEA', coords: [16.0, 64.0], type: 'ocean' },
  { name: 'BAY OF BENGAL', coords: [14.0, 88.5], type: 'ocean' },
  { name: 'SOUTH CHINA SEA', coords: [12.0, 113.5], type: 'ocean' },
  { name: 'INDIAN OCEAN', coords: [-2.5, 78.0], type: 'ocean' },
  { name: 'MEDITERRANEAN SEA', coords: [34.5, 20.0], type: 'ocean' },
  { name: 'NORTH ATLANTIC', coords: [45.0, -25.0], type: 'ocean' }
];

// Default Synthetic Flights (Loaded immediately so map renders instantly offline & online)
const DEFAULT_FLIGHTS = [
  {
    flight_id: 'AI101',
    aircraft: 'Boeing 737',
    departure: 'Chennai',
    destination: 'Delhi',
    route: 'Chennai → Delhi',
    origin_coords: [13.0827, 80.2707],
    dest_coords: [28.6139, 77.2090],
    latitude: 13.0827,
    longitude: 80.2707,
    altitude: 12000,
    base_altitude: 35200,
    speed: 482,
    base_speed: 482,
    heading: 350,
    status: 'Airborne',
    mode: 'SIMULATION',
    fuel: 82.5,
    risk: 'LOW',
    risk_score: 22,
    progress: 0.15,
    speed_step: 0.0075,
    events: [
      { time: '10:32 UTC', text: 'Takeoff clearance confirmed at Chennai (MAA)' },
      { time: '10:48 UTC', text: 'Climb through FL280 to cruise' },
      { time: '11:05 UTC', text: 'En route airway corridor tracking nominal' }
    ]
  },
  {
    flight_id: 'AI202',
    aircraft: 'Airbus A320',
    departure: 'Mumbai',
    destination: 'Bengaluru',
    route: 'Mumbai → Bengaluru',
    origin_coords: [19.0760, 72.8777],
    dest_coords: [12.9716, 77.5946],
    latitude: 19.0760,
    longitude: 72.8777,
    altitude: 18000,
    base_altitude: 31800,
    speed: 455,
    base_speed: 455,
    heading: 143,
    status: 'Airborne',
    mode: 'SIMULATION',
    fuel: 79.0,
    risk: 'MEDIUM',
    risk_score: 48,
    progress: 0.35,
    speed_step: 0.0085,
    events: [
      { time: '10:15 UTC', text: 'Departed Mumbai (BOM) runway 27' },
      { time: '10:30 UTC', text: 'Cruising flight level established' },
      { time: '10:55 UTC', text: 'CPDLC data link verified' }
    ]
  },
  {
    flight_id: 'AI303',
    aircraft: 'Boeing 777',
    departure: 'Delhi',
    destination: 'Singapore',
    route: 'Delhi → Singapore',
    origin_coords: [28.6139, 77.2090],
    dest_coords: [1.3521, 103.8198],
    latitude: 28.6139,
    longitude: 77.2090,
    altitude: 38000,
    base_altitude: 38100,
    speed: 510,
    base_speed: 510,
    heading: 132,
    status: 'Airborne',
    mode: 'SIMULATION',
    fuel: 74.0,
    risk: 'HIGH',
    risk_score: 74,
    progress: 0.45,
    speed_step: 0.007,
    anomaly: 'IRS Gyro Drift Warning',
    events: [
      { time: '09:40 UTC', text: 'Departed Delhi (DEL) runway 29L' },
      { time: '10:15 UTC', text: 'Established trans-oceanic airway' },
      { time: '11:02 UTC', text: 'IRS Gyro drift warning flagged by FMS' }
    ]
  },
  {
    flight_id: 'AI404',
    aircraft: 'Airbus A350',
    departure: 'Dubai',
    destination: 'London',
    route: 'Dubai → London',
    origin_coords: [25.2048, 55.2708],
    dest_coords: [51.5074, -0.1278],
    latitude: 25.2048,
    longitude: 55.2708,
    altitude: 39000,
    base_altitude: 39000,
    speed: 495,
    base_speed: 495,
    heading: 317,
    status: 'Airborne',
    mode: 'SIMULATION',
    fuel: 85.0,
    risk: 'LOW',
    risk_score: 19,
    progress: 0.28,
    speed_step: 0.0065,
    events: [
      { time: '08:20 UTC', text: 'Departed Dubai (DXB) runway 30R' },
      { time: '09:05 UTC', text: 'Entering European airspace corridor' },
      { time: '10:30 UTC', text: 'Flight envelope optimal' }
    ]
  },
  {
    flight_id: 'AI505',
    aircraft: 'Boeing 787',
    departure: 'Singapore',
    destination: 'Tokyo',
    route: 'Singapore → Tokyo',
    origin_coords: [1.3521, 103.8198],
    dest_coords: [35.6762, 139.6503],
    latitude: 1.3521,
    longitude: 103.8198,
    altitude: 36000,
    base_altitude: 36500,
    speed: 488,
    base_speed: 488,
    heading: 40,
    status: 'Airborne',
    mode: 'SIMULATION',
    fuel: 80.5,
    risk: 'MEDIUM',
    risk_score: 42,
    progress: 0.52,
    speed_step: 0.0075,
    events: [
      { time: '07:50 UTC', text: 'Departed Singapore Changi (SIN) runway 02L' },
      { time: '08:45 UTC', text: 'Cruising over South China Sea' },
      { time: '10:20 UTC', text: 'Weather avoidance heading offset active' }
    ]
  }
];

// flight_id -> entity
const flightEntities = {};
let currentFilter = 'all';
let showRoutes = true;
let showTrails = true;
let followingFlightId = null;
let selectedFlightId = null;
let animationFrameId = null;
let currentFlightsList = [];
let isSimulationRunning = true;
let flightSimulationSpeed = 1.0;
let lastFrameTimestamp = performance.now();
let englishLabelsLayerGroup = null;

// -------------------------------------------------------------
// Initialization
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initLeafletMap();

  // Load initial default flights immediately so the map renders and animates with zero delay
  currentFlightsList = DEFAULT_FLIGHTS;
  processFlightsTelemetry(DEFAULT_FLIGHTS, false);
  updateFlightTable(DEFAULT_FLIGHTS);
  updateTopKPIs(DEFAULT_FLIGHTS);

  startAnimationLoop();
  initWebSocketTelemetry();
  initFlightSimStatusSync();
});

// Dynamic Header Clock
function initClock() {
  const clockEl = document.getElementById('topDate');
  const update = () => {
    const now = new Date();
    if (clockEl) {
      clockEl.textContent = now.toUTCString().replace('GMT', 'UTC');
    }
  };
  update();
  setInterval(update, 1000);
}

// -------------------------------------------------------------
// Leaflet Real World Map Initialization (No API Key, No Watermark, 100% English)
// -------------------------------------------------------------
function initLeafletMap() {
  const mapContainer = document.getElementById('flightWorldMap');
  if (!mapContainer) return;

  if (map) {
    map.remove();
    map = null;
  }

  // Centered to showcase international corridors (London, Dubai, India, Singapore, Tokyo)
  map = L.map('flightWorldMap', {
    zoomControl: false,
    minZoom: 2,
    maxZoom: 15,
    attributionControl: false // Completely removes watermark & attribution badge
  }).setView([25.0, 58.0], 3);

  // Zoom controls (Top Right)
  L.control.zoom({ position: 'topright' }).addTo(map);

  // 1. Dark Aviation (Esri World Dark Gray Base + Esri English Reference Labels)
  // Perfectly matches dark aviation dashboard theme (#020914, #071827) with 100% English country & city names
  // Zero API key required, Zero watermarks!
  const darkBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 16,
    attribution: '',
    className: 'aviation-dark-tile'
  });
  const darkEnglishRef = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 16,
    attribution: '',
    opacity: 0.95
  });
  tileLayers.dark = L.layerGroup([darkBase, darkEnglishRef]);

  // 2. Clear World Topographic Map (Esri World Topographic - 100% English Labels, Clear Coastlines & Terrain)
  tileLayers.topo = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 18,
    attribution: ''
  });

  // 3. Clear Airspace & Cities Map (Esri World Street Map - 100% English Labels Globally)
  tileLayers.street = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 18,
    attribution: ''
  });

  // 4. Satellite Surveillance (Esri World Imagery + English Reference Labels & Borders)
  const satBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 18,
    attribution: ''
  });
  const satRef = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 16,
    attribution: '',
    opacity: 0.95
  });
  tileLayers.satellite = L.layerGroup([satBase, satRef]);

  // Add default layer (Dark Aviation with English labels)
  tileLayers[currentLayerKey].addTo(map);

  // Add prominent English Geographic & Country Labels layer
  initEnglishCountryLabelsLayer();

  const layerBtnText = document.getElementById('layerBtnText');
  if (layerBtnText) layerBtnText.textContent = layerLabels[currentLayerKey];

  // Invalidate size once DOM layout completes
  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 250);
}

// -------------------------------------------------------------
// English Country & Ocean Labels Layer
// -------------------------------------------------------------
function initEnglishCountryLabelsLayer() {
  if (!map) return;
  const labelMarkers = [];

  ENGLISH_GEOGRAPHIC_LABELS.forEach(item => {
    const isOcean = item.type === 'ocean';
    const className = isOcean ? 'ocean-english-label' : 'country-english-label';

    const html = `<div class="${className}">${item.name}</div>`;
    const icon = L.divIcon({
      className: 'country-label-leaflet-icon',
      html: html,
      iconSize: [120, 20],
      iconAnchor: [60, 10]
    });

    const marker = L.marker(item.coords, {
      icon: icon,
      interactive: false,
      zIndexOffset: 100
    });
    labelMarkers.push(marker);
  });

  englishLabelsLayerGroup = L.layerGroup(labelMarkers);
  englishLabelsLayerGroup.addTo(map);
}

// Map Base Tile Layer Switcher
function cycleMapTileLayer() {
  if (!map) return;
  const currentIndex = layerOrder.indexOf(currentLayerKey);
  const nextIndex = (currentIndex + 1) % layerOrder.length;
  const nextKey = layerOrder[nextIndex];

  if (tileLayers[currentLayerKey]) {
    map.removeLayer(tileLayers[currentLayerKey]);
  }
  if (tileLayers[nextKey]) {
    tileLayers[nextKey].addTo(map);
  }
  currentLayerKey = nextKey;

  // Ensure country labels and entities stay on top
  if (englishLabelsLayerGroup && !map.hasLayer(englishLabelsLayerGroup)) {
    englishLabelsLayerGroup.addTo(map);
  }

  const btnText = document.getElementById('layerBtnText');
  if (btnText) btnText.textContent = layerLabels[currentLayerKey];
}

function toggleMapTileLayer() {
  cycleMapTileLayer();
}

// -------------------------------------------------------------
// Geodesic Great-Circle Math & Route Calculations
// -------------------------------------------------------------
function calculateGreatCircleArc(start, end, numPoints = 64) {
  const points = [];
  const lat1 = (start[0] * Math.PI) / 180;
  const lon1 = (start[1] * Math.PI) / 180;
  const lat2 = (end[0] * Math.PI) / 180;
  const lon2 = (end[1] * Math.PI) / 180;

  const d = 2 * Math.asin(
    Math.sqrt(
      Math.pow(Math.sin((lat1 - lat2) / 2), 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon1 - lon2) / 2), 2)
    )
  );

  if (d < 1e-6) {
    return [[start[0], start[1]], [end[0], end[1]]];
  }

  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);

    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);

    const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * (180 / Math.PI);
    const lon = Math.atan2(y, x) * (180 / Math.PI);

    points.push([roundCoord(lat), roundCoord(lon)]);
  }

  return points;
}

function getPointAlongArc(arcPoints, fraction) {
  if (!arcPoints || arcPoints.length === 0) return [0, 0];
  const clamped = Math.max(0, Math.min(1, fraction));
  const totalSegments = arcPoints.length - 1;
  const exactIndex = clamped * totalSegments;
  const lowerIndex = Math.floor(exactIndex);
  const upperIndex = Math.min(totalSegments, Math.ceil(exactIndex));
  const segFraction = exactIndex - lowerIndex;

  if (lowerIndex === upperIndex) {
    return arcPoints[lowerIndex];
  }

  const p1 = arcPoints[lowerIndex];
  const p2 = arcPoints[upperIndex];
  const lat = p1[0] + (p2[0] - p1[0]) * segFraction;
  const lon = p1[1] + (p2[1] - p1[1]) * segFraction;

  return [roundCoord(lat), roundCoord(lon)];
}

function calculateBearing(lat1, lon1, lat2, lon2) {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const theta = Math.atan2(y, x);
  return (Math.round((theta * 180) / Math.PI) + 360) % 360;
}

function calculateDistanceKm(start, end) {
  const R = 6371; // Earth radius in km
  const lat1 = (start[0] * Math.PI) / 180;
  const lat2 = (end[0] * Math.PI) / 180;
  const dLat = ((end[0] - start[0]) * Math.PI) / 180;
  const dLon = ((end[1] - start[1]) * Math.PI) / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function roundCoord(num) {
  return Math.round(num * 10000) / 10000;
}

function getRiskHex(risk) {
  const r = (risk || '').toUpperCase();
  if (r === 'CRITICAL') return '#ff4757';
  if (r === 'HIGH') return '#ff7849';
  if (r === 'MEDIUM') return '#f0c75e';
  return '#39d98a';
}

// -------------------------------------------------------------
// Airport Markers Creation (Origin & Destination)
// -------------------------------------------------------------
function createAirportMarker(airportName, coords, type = 'origin') {
  const isOrigin = type === 'origin';
  const color = isOrigin ? '#21d4ff' : '#39d98a';
  const info = AIRPORT_IATA[airportName] || { iata: airportName.substring(0, 3).toUpperCase(), name: airportName, city: airportName, country: 'International' };
  const label = isOrigin ? 'ORIGIN' : 'DESTINATION';

  const html = `
    <div class="airport-marker-pin" id="airport-${type}-${airportName.toLowerCase()}">
      <div class="airport-pulse-ring" style="border: 2px solid ${color};"></div>
      <div class="airport-core-dot" style="background: ${color};"></div>
      <div class="airport-iata-badge" style="border-left: 2px solid ${color};">
        ${info.iata}
      </div>
    </div>
  `;

  const icon = L.divIcon({
    className: 'airport-leaflet-icon',
    html: html,
    iconSize: [44, 28],
    iconAnchor: [22, 8],
    popupAnchor: [0, -14]
  });

  const marker = L.marker(coords, { icon, zIndexOffset: 250 });
  const tooltipText = `<b>${info.name} (${info.iata})</b><br><span style="color:${color};font-weight:700;">${label} · ${info.city}, ${info.country}</span>`;
  marker.bindTooltip(tooltipText, { className: 'airport-tooltip', direction: 'top', offset: [0, -10] });

  return marker;
}

// -------------------------------------------------------------
// Aircraft SVG Marker Generator
// -------------------------------------------------------------
function createAircraftMarker(flight) {
  const riskColor = getRiskHex(flight.risk);
  const glow = (flight.risk === 'CRITICAL' || flight.risk === 'HIGH')
    ? `filter: drop-shadow(0 0 8px ${riskColor});`
    : `filter: drop-shadow(0 0 4px ${riskColor});`;

  const html = `
    <div class="aircraft-marker-wrap" id="marker-wrap-${flight.flight_id}">
      <svg class="aircraft-icon-svg" id="plane-svg-${flight.flight_id}" viewBox="0 0 24 24" style="transform: rotate(${flight.heading || 0}deg); ${glow}">
        <!-- High-fidelity airliner silhouette with nose at 0 deg North -->
        <path fill="${riskColor}" d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
      </svg>
      <div class="aircraft-callsign-tag" style="border-left: 2px solid ${riskColor};">
        ${flight.flight_id}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'aircraft-leaflet-icon',
    html: html,
    iconSize: [38, 46],
    iconAnchor: [19, 15],
    popupAnchor: [0, -18]
  });
}

// -------------------------------------------------------------
// Continuous 60fps Smooth Aircraft Animation Loop
// -------------------------------------------------------------
function startAnimationLoop() {
  const animate = (timestamp) => {
    const deltaTime = Math.min((timestamp - lastFrameTimestamp) / 1000, 0.1);
    lastFrameTimestamp = timestamp;

    for (const fid in flightEntities) {
      const entity = flightEntities[fid];
      if (!entity || !entity.marker || !entity.arcPoints) continue;

      if (isSimulationRunning) {
        if (entity.status === 'Airborne') {
          // Advance progress smoothly based on calibrated speed step and simulation multiplier
          const progressInc = deltaTime * entity.speedStep * flightSimulationSpeed;
          entity.progress += progressInc;

          // Gently reconcile with backend telemetry progress without jumping
          if (typeof entity.targetProgress === 'number' && Math.abs(entity.targetProgress - entity.progress) < 0.25) {
            entity.progress += (entity.targetProgress - entity.progress) * (deltaTime * 0.8);
          }

          // Handle arrival at destination
          if (entity.progress >= 1.0) {
            entity.progress = 1.0;
            entity.status = 'Arrived';
            entity.holdingTimer = 6.0; // 6 seconds holding at terminal
            entity.speed = 0;
            entity.altitude = 0;
          }
        } else if (entity.status === 'Arrived') {
          // Terminal holding & turnaround logic
          entity.holdingTimer -= deltaTime * flightSimulationSpeed;
          if (entity.holdingTimer <= 0) {
            // Turnaround: swap departure & destination for continuous live surveillance
            const prevDep = entity.data.departure;
            const prevDest = entity.data.destination;
            entity.data.departure = prevDest;
            entity.data.destination = prevDep;
            entity.data.route = `${prevDest} → ${prevDep}`;

            const tempCoords = entity.originCoords;
            entity.originCoords = entity.destCoords;
            entity.destCoords = tempCoords;

            // Recalculate return great circle arc
            entity.arcPoints = calculateGreatCircleArc(entity.originCoords, entity.destCoords, 64);
            entity.progress = 0.0;
            entity.status = 'Airborne';
            entity.speed = entity.data.base_speed || 480;
            entity.altitude = 10000;

            // Update route polylines
            if (entity.routeGlow) entity.routeGlow.setLatLngs(entity.arcPoints);
            if (entity.routeLine) entity.routeLine.setLatLngs(entity.arcPoints);
            if (entity.trailLine) entity.trailLine.setLatLngs([entity.originCoords]);

            // Update airport node tooltips
            if (entity.originMarker) {
              const origInfo = AIRPORT_IATA[prevDest] || { iata: prevDest.substring(0, 3).toUpperCase(), name: prevDest, country: 'International' };
              entity.originMarker.setLatLng(entity.originCoords).setTooltipContent(`<b>${origInfo.name} (${origInfo.iata})</b><br><span style="color:#21d4ff;font-weight:700;">ORIGIN AIRPORT · ${origInfo.country}</span>`);
            }
            if (entity.destMarker) {
              const destInfo = AIRPORT_IATA[prevDep] || { iata: prevDep.substring(0, 3).toUpperCase(), name: prevDep, country: 'International' };
              entity.destMarker.setLatLng(entity.destCoords).setTooltipContent(`<b>${destInfo.name} (${destInfo.iata})</b><br><span style="color:#39d98a;font-weight:700;">DESTINATION AIRPORT · ${destInfo.country}</span>`);
            }
          }
        }
      }

      // Compute exact position along the Great Circle curve at current progress
      const currentPos = getPointAlongArc(entity.arcPoints, entity.progress);
      entity.currentLat = currentPos[0];
      entity.currentLng = currentPos[1];

      // Calculate instantaneous tangent bearing along flight path
      const forwardProgress = Math.min(1.0, entity.progress + 0.003);
      const forwardPos = getPointAlongArc(entity.arcPoints, forwardProgress);
      const targetHeading = calculateBearing(currentPos[0], currentPos[1], forwardPos[0], forwardPos[1]);

      // Smooth heading angle wrapping (shortest turn)
      let dH = targetHeading - entity.currentHeading;
      if (dH > 180) dH -= 360;
      if (dH < -180) dH += 360;
      entity.currentHeading = (entity.currentHeading + dH * 0.12 + 360) % 360;

      // Realistic altitude profile during flight
      if (entity.status === 'Airborne') {
        const p = entity.progress;
        const baseAlt = entity.data.base_altitude || 36000;
        if (p < 0.12) {
          entity.altitude = Math.round(10000 + (baseAlt - 10000) * (p / 0.12));
        } else if (p > 0.88) {
          entity.altitude = Math.round(2000 + (baseAlt - 2000) * ((1.0 - p) / 0.12));
        } else {
          entity.altitude = baseAlt;
        }
      }

      // Update Leaflet marker position smoothly
      entity.marker.setLatLng([entity.currentLat, entity.currentLng]);

      // Rotate airplane SVG
      const svgEl = document.getElementById(`plane-svg-${fid}`);
      if (svgEl) {
        svgEl.style.transform = `rotate(${Math.round(entity.currentHeading)}deg)`;
      }

      // Update travelled trail polyline up to current position
      if (entity.trailLine && showTrails) {
        const totalPoints = entity.arcPoints.length;
        const currentIdx = Math.floor(entity.progress * (totalPoints - 1));
        const flownSegment = entity.arcPoints.slice(0, currentIdx + 1);
        flownSegment.push([entity.currentLat, entity.currentLng]);
        entity.trailLine.setLatLngs(flownSegment);
      }

      // Update active popup if open
      if (entity.marker.getPopup() && entity.marker.getPopup().isOpen()) {
        entity.marker.setPopupContent(buildPopupHtml(entity.data, entity));
      }

      // Camera auto-follow
      if (followingFlightId === fid && map) {
        map.panTo([entity.currentLat, entity.currentLng], { animate: false });
      }
    }

    animationFrameId = requestAnimationFrame(animate);
  };

  lastFrameTimestamp = performance.now();
  animationFrameId = requestAnimationFrame(animate);
}

// -------------------------------------------------------------
// WebSocket Telemetry Ingestion & Connection Monitoring
// -------------------------------------------------------------
function initWebSocketTelemetry() {
  const wsStateText = document.getElementById('wsStateText');
  const streamBadge = document.getElementById('streamBadge');
  const kpiStreamStatus = document.getElementById('kpiStreamStatus');
  const kpiStreamDelta = document.getElementById('kpiStreamDelta');

  FlightWebSocketManager.onMessage((flights, simStatus) => {
    if (Array.isArray(flights)) {
      currentFlightsList = flights;
      processFlightsTelemetry(flights, false);
      updateFlightTable(flights);
      updateTopKPIs(flights);

      if (simStatus) {
        updateSimControlsUI(simStatus.status, simStatus);
      }

      if (selectedFlightId) {
        const sel = flights.find(f => f.flight_id === selectedFlightId);
        if (sel) renderDrawerContent(sel);
      }
    }
  });

  FlightWebSocketManager.onStateChange((state) => {
    if (state === 'CONNECTED') {
      if (wsStateText) wsStateText.textContent = 'WEBSOCKET LIVE';
      if (streamBadge) streamBadge.className = 'live-system-badge';
      if (kpiStreamStatus) {
        kpiStreamStatus.textContent = '● Live Stream';
        kpiStreamStatus.style.color = 'var(--risk-low)';
      }
      if (kpiStreamDelta) kpiStreamDelta.textContent = '1.0s broadcast interval';
      const headerText = document.getElementById('headerStatusText');
      if (headerText) headerText.textContent = 'System Online';
    } else if (state === 'CONNECTING' || state === 'RECONNECTING') {
      if (wsStateText) wsStateText.textContent = 'RECONNECTING...';
      if (streamBadge) streamBadge.className = 'live-system-badge warning';
      if (kpiStreamStatus) {
        kpiStreamStatus.textContent = 'Reconnecting';
        kpiStreamStatus.style.color = 'var(--risk-medium)';
      }
      if (kpiStreamDelta) kpiStreamDelta.textContent = 'Attempting broadcast link...';
    } else {
      if (wsStateText) wsStateText.textContent = 'Autonomous Simulation';
      if (streamBadge) streamBadge.className = 'live-system-badge';
      if (kpiStreamStatus) {
        kpiStreamStatus.textContent = 'Autonomous Simulation';
        kpiStreamStatus.style.color = 'var(--accent-cyan)';
      }
      if (kpiStreamDelta) kpiStreamDelta.textContent = 'Real-time internal navigation engine';
    }
  });

  FlightWebSocketManager.connect();
}

// Initial Simulator Status Synchronization
async function initFlightSimStatusSync() {
  try {
    const res = await fetch('/api/flights/simulation/status');
    const data = await res.json();
    if (data.success && data.simulation) {
      updateSimControlsUI(data.simulation.status, data.simulation);
      if (data.flights && data.flights.length > 0) {
        currentFlightsList = data.flights;
        processFlightsTelemetry(data.flights, false);
        updateFlightTable(data.flights);
        updateTopKPIs(data.flights);
      }
    }
  } catch (err) {
    // Running in offline / standalone mode - already populated from DEFAULT_FLIGHTS
    updateSimControlsUI('RUNNING', { status: 'RUNNING', speed: 1.0 });
  }
}

// -------------------------------------------------------------
// Telemetry Processing & Map Marker Synchronization
// -------------------------------------------------------------
function processFlightsTelemetry(flights, isReset = false) {
  if (!map) return;

  flights.forEach(f => {
    const fid = f.flight_id;
    const lat = Number(f.latitude);
    const lng = Number(f.longitude);
    const heading = Number(f.heading) || 0;
    const progress = typeof f.progress === 'number' ? f.progress : 0.0;
    const originCoords = f.origin_coords || [lat, lng];
    const destCoords = f.dest_coords || [lat, lng];

    if (!flightEntities[fid]) {
      // First sighting: compute great-circle route & build all visible map entities
      const arcPoints = calculateGreatCircleArc(originCoords, destCoords, 64);
      const distanceKm = calculateDistanceKm(originCoords, destCoords);
      const distanceNm = Math.round(distanceKm * 0.539957);

      // 1. Route Corridor Ambient Glow Line
      const routeGlow = L.polyline(arcPoints, {
        color: '#00d2ff',
        weight: 6,
        opacity: showRoutes ? 0.3 : 0.0,
        lineCap: 'round',
        interactive: false
      }).addTo(map);

      // 2. Clear Visible Flight Airway Polyline (Origin -> Destination)
      const routeLine = L.polyline(arcPoints, {
        color: '#21d4ff',
        weight: 2.2,
        opacity: showRoutes ? 0.85 : 0.0,
        dashArray: '6, 8',
        interactive: true
      }).addTo(map);

      routeLine.bindTooltip(`
        <div style="font-size:11px;font-weight:700;">
          ✈ <b>${f.flight_id} Airway Corridor</b><br>
          <span style="color:#21d4ff;">${f.departure} → ${f.destination}</span><br>
          <span style="color:var(--text-secondary);font-size:10px;">Great-Circle: ${distanceKm.toLocaleString()} km (${distanceNm.toLocaleString()} NM)</span>
        </div>
      `, { className: 'airport-tooltip', sticky: true });

      // 3. Origin Airport Node
      const originMarker = createAirportMarker(f.departure, originCoords, 'origin').addTo(map);

      // 4. Destination Airport Node
      const destMarker = createAirportMarker(f.destination, destCoords, 'dest').addTo(map);

      // 5. Flown Segment Breadcrumb Trail
      const flownIndex = Math.floor(progress * (arcPoints.length - 1));
      const initialFlown = arcPoints.slice(0, flownIndex + 1);
      if (initialFlown.length === 0) initialFlown.push([lat, lng]);

      const trailLine = L.polyline(initialFlown, {
        color: getRiskHex(f.risk),
        weight: 3.5,
        opacity: showTrails ? 0.95 : 0.0,
        lineCap: 'round'
      }).addTo(map);

      // 6. Aircraft SVG Marker
      const initialPos = getPointAlongArc(arcPoints, progress);
      const marker = L.marker(initialPos, {
        icon: createAircraftMarker(f),
        riseOnHover: true,
        zIndexOffset: 500
      }).addTo(map);

      marker.bindPopup(buildPopupHtml(f, { currentLat: initialPos[0], currentLng: initialPos[1], currentHeading: heading, altitude: f.altitude, speed: f.speed }));
      marker.on('click', () => {
        openFlightDrawer(f.flight_id);
      });

      // Calibrated speed step for fluid 60fps movement
      const speedStep = f.speed_step ? Math.max(0.005, f.speed_step * 3.5) : 0.008;

      flightEntities[fid] = {
        flight_id: fid,
        data: f,
        marker,
        originMarker,
        destMarker,
        routeGlow,
        routeLine,
        trailLine,
        originCoords,
        destCoords,
        arcPoints,
        distanceKm,
        distanceNm,
        progress: progress,
        targetProgress: progress,
        speedStep: speedStep,
        currentLat: initialPos[0],
        currentLng: initialPos[1],
        currentHeading: heading,
        targetHeading: heading,
        altitude: Number(f.altitude) || 35000,
        speed: Number(f.speed) || 480,
        status: f.status || 'Airborne',
        holdingTimer: 0
      };
    } else {
      // Existing entity update
      const entity = flightEntities[fid];
      entity.data = f;

      if (isReset) {
        entity.progress = 0.0;
        entity.targetProgress = 0.0;
        entity.status = 'Airborne';
        entity.holdingTimer = 0;
        entity.originCoords = f.origin_coords;
        entity.destCoords = f.dest_coords;
        entity.arcPoints = calculateGreatCircleArc(entity.originCoords, entity.destCoords, 64);
        entity.currentLat = entity.originCoords[0];
        entity.currentLng = entity.originCoords[1];
        entity.currentHeading = heading;
        entity.marker.setLatLng(entity.originCoords);

        if (entity.trailLine) entity.trailLine.setLatLngs([entity.originCoords]);
        if (entity.routeGlow) entity.routeGlow.setLatLngs(entity.arcPoints);
        if (entity.routeLine) entity.routeLine.setLatLngs(entity.arcPoints);
      } else {
        entity.targetProgress = progress;
        if (f.status && f.status !== entity.status && f.status === 'Arrived') {
          entity.status = 'Arrived';
        }
      }

      // Check if turnaround occurred from backend
      if (f.origin_coords && (f.origin_coords[0] !== entity.originCoords[0] || f.origin_coords[1] !== entity.originCoords[1])) {
        entity.originCoords = f.origin_coords;
        entity.destCoords = f.dest_coords;
        entity.arcPoints = calculateGreatCircleArc(entity.originCoords, entity.destCoords, 64);
        if (entity.routeGlow) entity.routeGlow.setLatLngs(entity.arcPoints);
        if (entity.routeLine) entity.routeLine.setLatLngs(entity.arcPoints);
      }

      // Update trail style
      if (entity.trailLine) {
        entity.trailLine.setStyle({
          color: getRiskHex(f.risk),
          opacity: showTrails ? 0.95 : 0.0
        });
      }

      applyEntityVisibility(fid, f);
    }
  });
}

function applyEntityVisibility(fid, flight) {
  const entity = flightEntities[fid];
  if (!entity || !map) return;

  const matches = (currentFilter === 'all' || flight.risk.toUpperCase() === currentFilter.toUpperCase());
  if (matches) {
    if (!map.hasLayer(entity.marker)) map.addLayer(entity.marker);
    if (showRoutes) {
      if (entity.routeGlow && !map.hasLayer(entity.routeGlow)) map.addLayer(entity.routeGlow);
      if (entity.routeLine && !map.hasLayer(entity.routeLine)) map.addLayer(entity.routeLine);
    }
    if (entity.originMarker && !map.hasLayer(entity.originMarker)) map.addLayer(entity.originMarker);
    if (entity.destMarker && !map.hasLayer(entity.destMarker)) map.addLayer(entity.destMarker);
    if (showTrails && entity.trailLine && !map.hasLayer(entity.trailLine)) map.addLayer(entity.trailLine);
  } else {
    if (map.hasLayer(entity.marker)) map.removeLayer(entity.marker);
    if (entity.routeGlow && map.hasLayer(entity.routeGlow)) map.removeLayer(entity.routeGlow);
    if (entity.routeLine && map.hasLayer(entity.routeLine)) map.removeLayer(entity.routeLine);
    if (entity.originMarker && map.hasLayer(entity.originMarker)) map.removeLayer(entity.originMarker);
    if (entity.destMarker && map.hasLayer(entity.destMarker)) map.removeLayer(entity.destMarker);
    if (entity.trailLine && map.hasLayer(entity.trailLine)) map.removeLayer(entity.trailLine);
  }
}

// -------------------------------------------------------------
// Aviation Popup HTML
// -------------------------------------------------------------
function buildPopupHtml(f, entityState) {
  const riskColor = getRiskHex(f.risk);
  const score = f.risk_score || (f.risk === 'CRITICAL' ? 86 : (f.risk === 'HIGH' ? 74 : (f.risk === 'MEDIUM' ? 48 : 22)));
  const lat = entityState ? entityState.currentLat : f.latitude;
  const lng = entityState ? entityState.currentLng : f.longitude;
  const alt = entityState ? entityState.altitude : f.altitude;
  const spd = entityState ? entityState.speed : f.speed;
  const hdg = entityState ? Math.round(entityState.currentHeading) : f.heading;
  const status = (entityState && entityState.status) || f.status || 'Airborne';

  return `
    <div class="aviation-popup-card">
      <div class="popup-header">
        <div>
          <span class="popup-title">${f.flight_id}</span> &nbsp;
          <span style="font-size:10px;color:var(--text-secondary);">${f.aircraft}</span>
        </div>
        <span class="popup-sim-badge">LIVE SURVEILLANCE</span>
      </div>

      <div style="font-size:11px;font-weight:700;color:var(--accent-cyan);margin-bottom:8px;">
        ${f.departure} &nbsp;✈&nbsp; ${f.destination}
      </div>

      <div class="popup-grid">
        <div class="popup-grid-item">
          <span class="popup-label">Altitude</span>
          <span class="popup-val">${Number(alt).toLocaleString()} ft</span>
        </div>
        <div class="popup-grid-item">
          <span class="popup-label">Airspeed</span>
          <span class="popup-val">${spd} kt</span>
        </div>
        <div class="popup-grid-item">
          <span class="popup-label">Heading</span>
          <span class="popup-val">${hdg}°</span>
        </div>
        <div class="popup-grid-item">
          <span class="popup-label">Status</span>
          <span class="popup-val" style="color:${status === 'Arrived' ? 'var(--accent-cyan)' : 'var(--risk-low)'};">${status}</span>
        </div>
        <div class="popup-grid-item">
          <span class="popup-label">Risk Level</span>
          <span class="popup-val" style="color:${riskColor};">${f.risk} (${score}/100)</span>
        </div>
        <div class="popup-grid-item">
          <span class="popup-label">Position</span>
          <span class="popup-val" style="font-size:9.5px;">${lat}, ${lng}</span>
        </div>
      </div>

      <div style="margin-top:10px;display:flex;gap:6px;">
        <button class="map-tool-btn" style="flex:1;justify-content:center;" onclick="startFollowingFlight('${f.flight_id}')">
          Follow Camera
        </button>
        <button class="map-tool-btn" style="flex:1;justify-content:center;" onclick="openFlightDrawer('${f.flight_id}')">
          Full Telemetry
        </button>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// Interactive Map Toolbar Functions (Fit All, Routes, Trails, Follow)
// -------------------------------------------------------------
function fitAllFlights() {
  if (!map) return;
  const allCoords = [];

  for (const fid in flightEntities) {
    const entity = flightEntities[fid];
    if (entity) {
      allCoords.push([entity.currentLat, entity.currentLng]);
      if (entity.originCoords) allCoords.push(entity.originCoords);
      if (entity.destCoords) allCoords.push(entity.destCoords);
    }
  }

  if (allCoords.length > 0) {
    const bounds = L.latLngBounds(allCoords);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
  } else {
    map.setView([25.0, 58.0], 3);
  }
}

function toggleFlightRoutes() {
  showRoutes = !showRoutes;
  const btnText = document.getElementById('routeBtnText');
  if (btnText) btnText.textContent = showRoutes ? 'Hide Routes' : 'Show Routes';

  for (const fid in flightEntities) {
    const entity = flightEntities[fid];
    if (!entity) continue;
    if (entity.routeGlow) {
      if (showRoutes && !map.hasLayer(entity.routeGlow)) map.addLayer(entity.routeGlow);
      else if (!showRoutes && map.hasLayer(entity.routeGlow)) map.removeLayer(entity.routeGlow);
    }
    if (entity.routeLine) {
      if (showRoutes && !map.hasLayer(entity.routeLine)) map.addLayer(entity.routeLine);
      else if (!showRoutes && map.hasLayer(entity.routeLine)) map.removeLayer(entity.routeLine);
    }
  }
}

function toggleFlightTrails() {
  showTrails = !showTrails;
  const btnText = document.getElementById('trailBtnText');
  if (btnText) btnText.textContent = showTrails ? 'Hide Trails' : 'Show Trails';

  for (const fid in flightEntities) {
    const entity = flightEntities[fid];
    if (!entity || !entity.trailLine) continue;
    if (showTrails) {
      if (!map.hasLayer(entity.trailLine)) map.addLayer(entity.trailLine);
      entity.trailLine.setStyle({ opacity: 0.95 });
    } else {
      if (map.hasLayer(entity.trailLine)) map.removeLayer(entity.trailLine);
    }
  }
}

function startFollowingFlight(flightId) {
  followingFlightId = flightId;
  const stopBtn = document.getElementById('btnStopFollow');
  const targetSpan = document.getElementById('followTargetId');
  if (stopBtn) stopBtn.style.display = 'inline-flex';
  if (targetSpan) targetSpan.textContent = flightId;

  const entity = flightEntities[flightId];
  if (entity && map) {
    map.setView([entity.currentLat, entity.currentLng], 6, { animate: true });
  }
}

function stopFollowingFlight() {
  followingFlightId = null;
  const stopBtn = document.getElementById('btnStopFollow');
  if (stopBtn) stopBtn.style.display = 'none';
}

// -------------------------------------------------------------
// Flight Risk Filter (All / Low / Medium / High / Critical)
// -------------------------------------------------------------
function setFlightRiskFilter(filterLevel, btnElement) {
  currentFilter = filterLevel;

  const pills = document.querySelectorAll('.filter-pill');
  pills.forEach(p => p.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');

  for (const fid in flightEntities) {
    applyEntityVisibility(fid, flightEntities[fid].data);
  }

  renderFlightTableRows();
}

// -------------------------------------------------------------
// Top KPI Counters & Filter Counts
// -------------------------------------------------------------
function updateTopKPIs(flights) {
  const activeCountEl = document.getElementById('kpiActiveFlights');
  const airborneEl = document.getElementById('kpiAirborneCount');
  const highRiskCountEl = document.getElementById('kpiHighRiskCount');
  const riskBadge = document.getElementById('kpiRiskBadge');

  if (activeCountEl) activeCountEl.textContent = flights.length;
  if (airborneEl) airborneEl.textContent = flights.filter(f => f.status !== 'Arrived').length;

  let lowCount = 0, medCount = 0, highCount = 0, critCount = 0;
  flights.forEach(f => {
    const r = (f.risk || '').toUpperCase();
    if (r === 'LOW') lowCount++;
    else if (r === 'MEDIUM') medCount++;
    else if (r === 'HIGH') highCount++;
    else if (r === 'CRITICAL') critCount++;
  });

  const totalHighOrCrit = highCount + critCount;
  if (highRiskCountEl) highRiskCountEl.textContent = totalHighOrCrit;
  if (riskBadge) {
    riskBadge.textContent = totalHighOrCrit > 0 ? `${totalHighOrCrit} MONITORED` : 'ALL NOMINAL';
    riskBadge.className = totalHighOrCrit > 0 ? 'badge high' : 'badge low';
  }

  const cAll = document.getElementById('countAll');
  const cLow = document.getElementById('countLow');
  const cMed = document.getElementById('countMed');
  const cHigh = document.getElementById('countHigh');
  const cCrit = document.getElementById('countCrit');

  if (cAll) cAll.textContent = flights.length;
  if (cLow) cLow.textContent = lowCount;
  if (cMed) cMed.textContent = medCount;
  if (cHigh) cHigh.textContent = highCount;
  if (cCrit) cCrit.textContent = critCount;
}

// -------------------------------------------------------------
// Full Flight Telemetry Table
// -------------------------------------------------------------
function updateFlightTable(flights) {
  renderFlightTableRows();
}

function renderFlightTableRows() {
  const tbody = document.getElementById('fullFlightTableBody');
  if (!tbody) return;

  const filtered = currentFlightsList.filter(f => {
    if (currentFilter === 'all') return true;
    return f.risk.toUpperCase() === currentFilter.toUpperCase();
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="12" style="text-align:center;padding:24px;color:var(--text-muted)">No aircraft found matching filter "${currentFilter}".</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(f => {
    const entity = flightEntities[f.flight_id];
    const liveLat = entity ? entity.currentLat : f.latitude;
    const liveLng = entity ? entity.currentLng : f.longitude;
    const liveHdg = entity ? Math.round(entity.currentHeading) : f.heading;
    const liveAlt = entity ? entity.altitude : f.altitude;
    const liveSpd = entity ? entity.speed : f.speed;
    const liveStatus = (entity && entity.status) || f.status || 'Airborne';

    const riskBadgeClass = f.risk === 'CRITICAL' ? 'badge critical' : (f.risk === 'HIGH' ? 'badge high' : (f.risk === 'MEDIUM' ? 'badge medium' : 'badge low'));
    const isSelected = selectedFlightId === f.flight_id ? 'background:#0a2942;' : '';
    const statusColor = liveStatus === 'Arrived' ? 'var(--accent-cyan)' : 'var(--risk-low)';

    return `
      <tr style="${isSelected} cursor:pointer;" onclick="openFlightDrawer('${f.flight_id}')">
        <td style="font-family:var(--font-mono);font-weight:700;color:#fff;">${f.flight_id}</td>
        <td>${f.aircraft}</td>
        <td style="font-weight:600;color:var(--accent-cyan);">${f.departure} → ${f.destination}</td>
        <td style="font-family:var(--font-mono);">${liveLat}</td>
        <td style="font-family:var(--font-mono);">${liveLng}</td>
        <td style="font-family:var(--font-mono);">${Number(liveAlt).toLocaleString()} ft</td>
        <td style="font-family:var(--font-mono);">${liveSpd} kt</td>
        <td style="font-family:var(--font-mono);">${liveHdg}°</td>
        <td style="font-family:var(--font-mono);">${f.fuel}%</td>
        <td><span class="${riskBadgeClass}">${f.risk}</span></td>
        <td><span style="color:${statusColor};font-weight:600;">${liveStatus}</span></td>
        <td>
          <div style="display:flex;gap:4px;">
            <button class="map-tool-btn" style="padding:2px 6px;font-size:10px;" onclick="event.stopPropagation(); startFollowingFlight('${f.flight_id}')" title="Track camera on aircraft">
              Track
            </button>
            <button class="map-tool-btn" style="padding:2px 6px;font-size:10px;" onclick="event.stopPropagation(); openFlightDrawer('${f.flight_id}')" title="View details">
              Inspect
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// -------------------------------------------------------------
// Side Detail Drawer
// -------------------------------------------------------------
function openFlightDrawer(flightId) {
  selectedFlightId = flightId;
  const drawer = document.getElementById('flightSideDrawer');
  if (drawer) drawer.classList.add('open');

  const flight = currentFlightsList.find(f => f.flight_id === flightId);
  if (flight) {
    renderDrawerContent(flight);
  }
}

function closeFlightDrawer() {
  selectedFlightId = null;
  const drawer = document.getElementById('flightSideDrawer');
  if (drawer) drawer.classList.remove('open');
}

function renderDrawerContent(f) {
  const drawerFlightId = document.getElementById('drawerFlightId');
  const drawerRiskBadge = document.getElementById('drawerRiskBadge');
  const drawerBody = document.getElementById('drawerBody');
  const entity = flightEntities[f.flight_id];

  const liveLat = entity ? entity.currentLat : f.latitude;
  const liveLng = entity ? entity.currentLng : f.longitude;
  const liveHdg = entity ? Math.round(entity.currentHeading) : f.heading;
  const liveAlt = entity ? entity.altitude : f.altitude;
  const liveSpd = entity ? entity.speed : f.speed;
  const liveStatus = (entity && entity.status) || f.status || 'Active Airborne';

  if (drawerFlightId) drawerFlightId.textContent = `${f.flight_id} — ${f.aircraft}`;
  if (drawerRiskBadge) {
    drawerRiskBadge.textContent = `${f.risk} RISK (${f.risk_score || 22}/100)`;
    drawerRiskBadge.className = f.risk === 'CRITICAL' ? 'badge critical' : (f.risk === 'HIGH' ? 'badge high' : (f.risk === 'MEDIUM' ? 'badge medium' : 'badge low'));
  }

  const eventsHtml = (f.events || [
    { time: '10:32 UTC', text: 'Takeoff clearance confirmed' },
    { time: '10:47 UTC', text: 'Cruising flight level established' }
  ]).map(e => `
    <div style="display:flex;gap:8px;font-size:11px;margin-bottom:6px;border-left:2px solid var(--border-light);padding-left:8px;">
      <span style="font-family:var(--font-mono);color:var(--text-muted);">${e.time}</span>
      <span style="color:var(--text-main);">${e.text}</span>
    </div>
  `).join('');

  if (drawerBody) {
    drawerBody.innerHTML = `
      <div class="drawer-section">
        <div class="drawer-section-title">
          <span>Flight Airway Corridor</span>
          <span style="font-size:9px;color:var(--accent-cyan);">ACTIVE RADAR</span>
        </div>
        <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:4px;">
          ${f.departure} &nbsp;✈&nbsp; ${f.destination}
        </div>
        <div style="font-size:11px;color:var(--text-secondary);">
          Status: <b style="color:${liveStatus === 'Arrived' ? 'var(--accent-cyan)' : 'var(--risk-low)'};">${liveStatus}</b> &nbsp;|&nbsp; Route: ${f.departure} → ${f.destination}
        </div>
      </div>

      <div class="drawer-section">
        <div class="drawer-section-title">
          <span>Real-Time Telemetry</span>
          <span style="font-size:9px;color:var(--text-muted);">60Hz Smooth Feed</span>
        </div>
        <div class="drawer-telemetry-grid">
          <div class="drawer-telem-box">
            <div class="drawer-telem-label">Altitude (MSL)</div>
            <div class="drawer-telem-val">${Number(liveAlt).toLocaleString()} ft</div>
          </div>
          <div class="drawer-telem-box">
            <div class="drawer-telem-label">Ground Speed</div>
            <div class="drawer-telem-val">${liveSpd} kt</div>
          </div>
          <div class="drawer-telem-box">
            <div class="drawer-telem-label">Heading Track</div>
            <div class="drawer-telem-val">${liveHdg}°</div>
          </div>
          <div class="drawer-telem-box">
            <div class="drawer-telem-label">Fuel Remaining</div>
            <div class="drawer-telem-val">${f.fuel}%</div>
          </div>
        </div>

        <div style="margin-top:10px;font-size:11px;display:flex;justify-content:space-between;background:#04111e;padding:6px 8px;border-radius:4px;border:1px solid var(--border-panel);">
          <span style="color:var(--text-muted);">Coordinates:</span>
          <span style="font-family:var(--font-mono);font-weight:600;color:var(--accent-cyan);">${liveLat}, ${liveLng}</span>
        </div>
      </div>

      <div class="drawer-section">
        <div class="drawer-section-title">
          <span>Software Safety Risk</span>
          <span class="badge ${f.risk === 'HIGH' ? 'high' : 'low'}">${f.risk}</span>
        </div>
        <div style="font-size:11px;color:var(--text-secondary);margin-bottom:8px;">
          Risk Score: <b style="color:#fff;font-family:var(--font-mono);">${f.risk_score || 22}/100</b>
        </div>
        <div style="font-size:11px;color:var(--text-muted);line-height:1.4;">
          ${f.anomaly ? `<b style="color:var(--risk-high);">Active Anomaly:</b> ${f.anomaly}. Software change impact surveillance monitoring telemetry deviations.` : 'Operating within nominal parameters. Navigation sensors verified by Kalman filter.'}
        </div>
      </div>

      <div class="drawer-section">
        <div class="drawer-section-title">
          <span>Flight Events Timeline</span>
          <span style="font-size:9px;color:var(--text-muted);">Chronological</span>
        </div>
        ${eventsHtml}
      </div>

      <div style="display:flex;gap:8px;margin-top:10px;">
        <button class="btn btn-primary" style="flex:1;" onclick="startFollowingFlight('${f.flight_id}')">
          Track Camera On Aircraft
        </button>
      </div>
    `;
  }
}

// -------------------------------------------------------------
// Simulation Control Actions (Start, Pause, Reset, Speed, Events)
// -------------------------------------------------------------
function updateSimControlsUI(status, simObj) {
  const pill = document.getElementById('simStatusPill');
  const txt = document.getElementById('simStatusText');
  const btnStart = document.getElementById('btnSimStart');
  const btnPause = document.getElementById('btnSimPause');

  const isRunning = (status === 'RUNNING');
  isSimulationRunning = isRunning;

  if (txt) txt.textContent = status;
  if (pill) {
    pill.className = `sim-status-pill ${isRunning ? 'running' : 'paused'}`;
  }

  if (btnStart) {
    btnStart.classList.toggle('active', isRunning);
  }
  if (btnPause) {
    btnPause.classList.toggle('active', !isRunning);
  }

  if (simObj && simObj.speed) {
    flightSimulationSpeed = simObj.speed;
    updateSpeedButtonsUI(simObj.speed);
  }
}

function updateSpeedButtonsUI(speed) {
  const speeds = [1, 2, 5];
  speeds.forEach(s => {
    const el = document.getElementById(`fltSpd${s}`);
    if (el) {
      el.classList.toggle('active', Math.round(speed) === s);
    }
  });
}

async function handleSimControl(action) {
  try {
    if (action === 'start') {
      isSimulationRunning = true;
      updateSimControlsUI('RUNNING');
    } else if (action === 'pause' || action === 'stop') {
      isSimulationRunning = false;
      updateSimControlsUI('PAUSED');
    } else if (action === 'reset') {
      isSimulationRunning = true;
      updateSimControlsUI('RUNNING');
      for (const fid in flightEntities) {
        const entity = flightEntities[fid];
        entity.progress = 0.0;
        entity.targetProgress = 0.0;
        entity.status = 'Airborne';
        entity.holdingTimer = 0;
        entity.currentLat = entity.originCoords[0];
        entity.currentLng = entity.originCoords[1];
        entity.marker.setLatLng(entity.originCoords);
        if (entity.trailLine) entity.trailLine.setLatLngs([entity.originCoords]);
      }
    }

    const res = await fetch('/api/flights/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    const data = await res.json();

    if (data.success) {
      if (data.simulation) {
        updateSimControlsUI(data.simulation.status, data.simulation);
      }

      if (action === 'reset') {
        const sel = document.getElementById('eventSelect');
        if (sel) sel.value = 'normal';

        if (data.flights) {
          currentFlightsList = data.flights;
          processFlightsTelemetry(data.flights, true);
          updateFlightTable(data.flights);
          updateTopKPIs(data.flights);
        }
      }
    }
  } catch (err) {
    console.warn('Simulation control local fallback:', err);
  }
}

async function handleFlightsSpeed(speed, btnElement) {
  try {
    flightSimulationSpeed = Number(speed);
    updateSpeedButtonsUI(speed);

    const res = await fetch('/api/flights/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'speed', speed: Number(speed) })
    });
    await res.json();
  } catch (err) {
    console.warn('Speed setting local fallback:', err);
  }
}

async function handleInjectEvent(eventType) {
  try {
    const res = await fetch('/api/flights/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'inject_event', event: eventType })
    });
    await res.json();
  } catch (err) {
    console.warn('Event injection local fallback:', err);
  }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  FlightWebSocketManager.disconnect();
});
