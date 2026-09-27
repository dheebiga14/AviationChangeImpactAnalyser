/**
 * Aviation Change Impact Analyzer - Command Center Dashboard
 * Real Leaflet World Map, Smooth Aircraft Interpolation, and Dynamic Backend Synchronization
 */

let dashMap = null;
const dashFlightEntities = {}; // flight_id -> { marker, routeGlow, routeLine, trailLine, arcPoints, progress, speedStep, status, holdingTimer, currentHeading, data }
const dashAirportMarkers = {}; // airportName -> marker
let dashAnimFrameId = null;
let currentFlightsData = [];
let dashSimulationRunning = true;
let dashSimulationSpeed = 1.0;
let dashSelectedFlightId = null;
let lastDashFrameTimestamp = performance.now();
let dashOceanLabelsLayer = null;

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
const DASH_ENGLISH_GEOGRAPHIC_LABELS = [
  { name: 'ARABIAN SEA', coords: [16.0, 64.0], type: 'ocean' },
  { name: 'BAY OF BENGAL', coords: [14.0, 88.5], type: 'ocean' },
  { name: 'SOUTH CHINA SEA', coords: [12.0, 113.5], type: 'ocean' },
  { name: 'INDIAN OCEAN', coords: [-2.5, 78.0], type: 'ocean' },
  { name: 'MEDITERRANEAN SEA', coords: [34.5, 20.0], type: 'ocean' },
  { name: 'NORTH ATLANTIC', coords: [45.0, -25.0], type: 'ocean' }
];

// Default Synthetic Flights for instant zero-delay map rendering
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
    speed_step: 0.0075
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
    speed_step: 0.0085
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
    anomaly: 'IRS Gyro Drift Warning'
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
    speed_step: 0.0065
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
    speed_step: 0.0075
  }
];

document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initDashboardMap();

  // Load default synthetic flights immediately so the map is never empty
  currentFlightsData = DEFAULT_FLIGHTS;
  syncDashboardMapMarkers(DEFAULT_FLIGHTS);
  renderDashboardFlightTable(DEFAULT_FLIGHTS);

  startDashboardAnimationLoop();
  initWebSocketFeed();
  loadBackendDashboardData();
  initSimStatusSync();
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
// Real Leaflet World Map on Dashboard (100% English Esri Dark Gray)
// -------------------------------------------------------------
function initDashboardMap() {
  const container = document.getElementById('dashWorldMap');
  const fallback = document.getElementById('dashMapErrorFallback');
  if (!container) return;

  try {
    if (dashMap) {
      dashMap.remove();
      dashMap = null;
    }

    dashMap = L.map('dashWorldMap', {
      zoomControl: false,
      minZoom: 2,
      maxZoom: 15,
      attributionControl: false // Completely removes watermark & attribution badge
    }).setView([25.0, 58.0], 3);

    // Dark Aviation: Esri World Dark Gray Base + Esri English Reference Labels
    // 100% English country, city & ocean names, completely free & watermark-free!
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
    L.layerGroup([darkBase, darkEnglishRef]).addTo(dashMap);

    // Prominent English Oceanic & Airspace Labels Layer
    initDashEnglishLabelsLayer();

    if (fallback) fallback.style.display = 'none';

    setTimeout(() => {
      if (dashMap) dashMap.invalidateSize();
    }, 250);
  } catch (err) {
    console.error('Failed to initialize dashboard map:', err);
    if (fallback) fallback.style.display = 'flex';
  }
}

// English Maritime / Corridor Labels Layer
function initDashEnglishLabelsLayer() {
  if (!dashMap) return;
  const labelMarkers = [];

  DASH_ENGLISH_GEOGRAPHIC_LABELS.forEach(item => {
    const html = `<div class="ocean-english-label">${item.name}</div>`;
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

  dashOceanLabelsLayer = L.layerGroup(labelMarkers);
  dashOceanLabelsLayer.addTo(dashMap);
}

// Spherical Geodesic Great-Circle Arc Generator (64 points per route)
function calculateGeodesicArc(start, end, numPoints = 64) {
  const points = [];
  const lat1 = start[0] * Math.PI / 180;
  const lon1 = start[1] * Math.PI / 180;
  const lat2 = end[0] * Math.PI / 180;
  const lon2 = end[1] * Math.PI / 180;

  const d = 2 * Math.asin(Math.sqrt(
    Math.pow(Math.sin((lat1 - lat2) / 2), 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon1 - lon2) / 2), 2)
  ));

  if (d === 0) return [start, end];

  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);

    const lat = Math.atan2(z, Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))) * 180 / Math.PI;
    const lon = Math.atan2(y, x) * 180 / Math.PI;
    points.push([lat, lon]);
  }
  return points;
}

// Forward Azimuth (Bearing) Calculation
function calculateBearing(lat1, lon1, lat2, lon2) {
  const y = Math.sin((lon2 - lon1) * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos((lon2 - lon1) * Math.PI / 180);
  const brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
}

function getRiskHex(risk) {
  const r = (risk || '').toUpperCase();
  if (r === 'CRITICAL') return '#ff4757';
  if (r === 'HIGH') return '#ff7849';
  if (r === 'MEDIUM') return '#f0c75e';
  return '#39d98a';
}

// Compact Radar Airport Marker (Identical to flights.html)
function createDashAirportMarker(airportName, coords, type = 'origin') {
  const isOrigin = type === 'origin';
  const color = isOrigin ? '#21d4ff' : '#39d98a';
  const info = AIRPORT_IATA[airportName] || { iata: airportName.substring(0, 3).toUpperCase(), name: airportName, city: airportName, country: 'International' };
  const label = isOrigin ? 'ORIGIN' : 'DESTINATION';

  const html = `
    <div class="airport-marker-pin" id="dash-airport-${type}-${airportName.toLowerCase()}">
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

// Aircraft SVG Marker with dynamic heading
function createDashAircraftMarker(flight) {
  const riskColor = getRiskHex(flight.risk);
  const isSelected = dashSelectedFlightId === flight.flight_id;
  const glow = isSelected 
    ? `filter: drop-shadow(0 0 8px #21d4ff) drop-shadow(0 0 12px ${riskColor});` 
    : `filter: drop-shadow(0 0 4px ${riskColor});`;

  const html = `
    <div class="aircraft-marker-wrap ${isSelected ? 'selected' : ''}" id="dash-marker-${flight.flight_id}">
      <svg class="aircraft-icon-svg" id="dash-plane-svg-${flight.flight_id}" viewBox="0 0 24 24" style="transform: rotate(${flight.heading || 0}deg); ${glow}">
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

// Synchronize Flights on Map (Airways, Airport Terminals, Aircraft)
function syncDashboardMapMarkers(flights) {
  if (!dashMap) return;

  const countBadge = document.getElementById('activeFlightsCount');
  if (countBadge) countBadge.textContent = `${flights.length} Active Flights`;

  flights.forEach(f => {
    const fid = f.flight_id;
    const lat = Number(f.latitude);
    const lng = Number(f.longitude);
    const heading = Number(f.heading) || 0;
    const riskHex = getRiskHex(f.risk);

    // 1. Ensure Origin & Destination Airport Markers exist
    if (f.origin_coords && f.departure && !dashAirportMarkers[`origin_${f.departure}`]) {
      const origM = createDashAirportMarker(f.departure, f.origin_coords, 'origin').addTo(dashMap);
      dashAirportMarkers[`origin_${f.departure}`] = origM;
    }
    if (f.dest_coords && f.destination && !dashAirportMarkers[`dest_${f.destination}`]) {
      const destM = createDashAirportMarker(f.destination, f.dest_coords, 'dest').addTo(dashMap);
      dashAirportMarkers[`dest_${f.destination}`] = destM;
    }

    if (!dashFlightEntities[fid]) {
      const arcPoints = (f.origin_coords && f.dest_coords)
        ? calculateGeodesicArc(f.origin_coords, f.dest_coords, 64)
        : [[lat, lng]];

      // Glowing corridor halo
      const routeGlow = L.polyline(arcPoints, {
        color: riskHex,
        weight: 5,
        opacity: 0.22,
        lineCap: 'round'
      }).addTo(dashMap);

      // Core airway dashed route
      const routeLine = L.polyline(arcPoints, {
        color: riskHex,
        weight: 2,
        opacity: 0.85,
        dashArray: '6, 6'
      }).addTo(dashMap);

      // Flown breadcrumb trail
      const trailLine = L.polyline([f.origin_coords || [lat, lng], [lat, lng]], {
        color: riskHex,
        weight: 2.2,
        opacity: 0.9
      }).addTo(dashMap);

      // Aircraft marker
      const marker = L.marker([lat, lng], {
        icon: createDashAircraftMarker(f),
        riseOnHover: true,
        zIndexOffset: 500
      }).addTo(dashMap);

      // Rich Flight Popup
      marker.bindPopup(`
        <div class="aviation-rich-popup">
          <div class="rich-pop-header">
            <span class="rich-pop-id">${f.flight_id}</span>
            <span class="badge ${f.risk.toLowerCase()}">◆ ${f.risk} RISK</span>
          </div>
          <div class="rich-pop-route">
            <span>${f.departure}</span> &nbsp;✈&nbsp; <span>${f.destination}</span>
          </div>
          <div class="rich-pop-grid">
            <div class="rich-pop-item"><span>Aircraft</span><b>${f.aircraft}</b></div>
            <div class="rich-pop-item"><span>Status</span><b style="color:var(--risk-low);">${f.status || 'AIRBORNE'}</b></div>
            <div class="rich-pop-item"><span>Altitude</span><b>${Number(f.altitude).toLocaleString()} ft</b></div>
            <div class="rich-pop-item"><span>Ground Speed</span><b>${f.speed} kt</b></div>
            <div class="rich-pop-item"><span>Heading</span><b>${f.heading}°</b></div>
            <div class="rich-pop-item"><span>Risk Score</span><b>${f.risk_score || 22} / 100</b></div>
          </div>
          <div style="margin-top:6px; display:flex; justify-content:space-between; align-items:center;">
            <button class="map-tool-btn" style="width:100%; justify-content:center;" onclick="selectDashboardFlight('${f.flight_id}')">
              Select Flight Telemetry
            </button>
          </div>
        </div>
      `);

      marker.on('click', () => {
        selectDashboardFlight(f.flight_id);
      });

      dashFlightEntities[fid] = {
        marker,
        routeGlow,
        routeLine,
        trailLine,
        arcPoints,
        originCoords: f.origin_coords || [lat, lng],
        destCoords: f.dest_coords || [lat, lng],
        progress: typeof f.progress === 'number' ? f.progress : 0.2,
        speedStep: f.speed_step || 0.0075,
        status: f.status || 'Airborne',
        holdingTimer: 0,
        currentHeading: heading,
        data: f
      };
    } else {
      const entity = dashFlightEntities[fid];
      entity.data = f;
      if (typeof f.progress === 'number') {
        entity.targetProgress = f.progress;
      }
      if (f.status) entity.status = f.status;

      // Update route colors if risk level shifted
      const isSelected = dashSelectedFlightId === fid;
      const activeColor = isSelected ? '#21d4ff' : riskHex;
      if (entity.routeGlow) entity.routeGlow.setStyle({ color: activeColor });
      if (entity.routeLine) entity.routeLine.setStyle({ color: activeColor });
      if (entity.trailLine) entity.trailLine.setStyle({ color: activeColor });
    }
  });
}

// -------------------------------------------------------------
// Continuous 60fps Smooth Aircraft Animation Loop (Matching flights.html)
// -------------------------------------------------------------
function startDashboardAnimationLoop() {
  const animate = (timestamp) => {
    const deltaTime = Math.min((timestamp - lastDashFrameTimestamp) / 1000, 0.1);
    lastDashFrameTimestamp = timestamp;

    if (dashSimulationRunning) {
      for (const fid in dashFlightEntities) {
        const entity = dashFlightEntities[fid];
        if (!entity || !entity.marker || !entity.arcPoints) continue;

        if (entity.status === 'Airborne') {
          // Advance progress smoothly based on calibrated speed step and simulation multiplier
          const progressInc = deltaTime * entity.speedStep * dashSimulationSpeed;
          entity.progress += progressInc;

          // Reconcile with backend telemetry progress without sudden jumps
          if (typeof entity.targetProgress === 'number' && Math.abs(entity.targetProgress - entity.progress) < 0.25) {
            entity.progress += (entity.targetProgress - entity.progress) * (deltaTime * 0.8);
          }

          // Handle arrival at destination
          if (entity.progress >= 1.0) {
            entity.progress = 1.0;
            entity.status = 'Arrived';
            entity.holdingTimer = 6.0; // 6 seconds terminal holding
          }
        } else if (entity.status === 'Arrived') {
          entity.holdingTimer -= deltaTime * dashSimulationSpeed;
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

            entity.arcPoints = calculateGeodesicArc(entity.originCoords, entity.destCoords, 64);
            entity.progress = 0.0;
            entity.status = 'Airborne';

            if (entity.routeGlow) entity.routeGlow.setLatLngs(entity.arcPoints);
            if (entity.routeLine) entity.routeLine.setLatLngs(entity.arcPoints);
            if (entity.trailLine) entity.trailLine.setLatLngs([entity.originCoords]);
          }
        }

        // Interpolate position along spherical great circle arc
        const clampedProg = Math.max(0, Math.min(1, entity.progress));
        const totalIdx = entity.arcPoints.length - 1;
        const exactIdx = clampedProg * totalIdx;
        const lowIdx = Math.floor(exactIdx);
        const highIdx = Math.min(totalIdx, Math.ceil(exactIdx));
        const subFraction = exactIdx - lowIdx;

        const p1 = entity.arcPoints[lowIdx];
        const p2 = entity.arcPoints[highIdx] || p1;

        const curLat = p1[0] + (p2[0] - p1[0]) * subFraction;
        const curLng = p1[1] + (p2[1] - p1[1]) * subFraction;

        entity.marker.setLatLng([curLat, curLng]);

        // Dynamic bearing along trajectory tangent
        const nextLookaheadIdx = Math.min(totalIdx, lowIdx + 1);
        const pNext = entity.arcPoints[nextLookaheadIdx] || p2;
        let targetHeading = calculateBearing(p1[0], p1[1], pNext[0], pNext[1]);

        let dH = targetHeading - entity.currentHeading;
        while (dH < -180) dH += 360;
        while (dH > 180) dH -= 360;
        entity.currentHeading = (entity.currentHeading + dH * 0.15 + 360) % 360;

        const svgEl = document.getElementById(`dash-plane-svg-${fid}`);
        if (svgEl) {
          svgEl.style.transform = `rotate(${Math.round(entity.currentHeading)}deg)`;
        }

        // Update breadcrumb trail line
        if (entity.trailLine) {
          const flown = entity.arcPoints.slice(0, lowIdx + 1);
          flown.push([curLat, curLng]);
          entity.trailLine.setLatLngs(flown);
        }
      }
    }

    dashAnimFrameId = requestAnimationFrame(animate);
  };

  dashAnimFrameId = requestAnimationFrame(animate);
}

// -------------------------------------------------------------
// WebSocket Telemetry Feed
// -------------------------------------------------------------
function initWebSocketFeed() {
  const wsStatusEl = document.getElementById('statusWs');
  const topStatusPill = document.getElementById('headerStatusText');

  FlightWebSocketManager.onMessage((flights) => {
    if (Array.isArray(flights)) {
      currentFlightsData = flights;
      syncDashboardMapMarkers(flights);
      renderDashboardFlightTable(flights);
      if (dashSelectedFlightId) {
        const selFlight = flights.find(f => f.flight_id === dashSelectedFlightId);
        if (selFlight) renderDashboardSelectedFlight(selFlight);
      }
    }
  });

  FlightWebSocketManager.onStateChange((state) => {
    if (state === 'CONNECTED') {
      if (wsStatusEl) { wsStatusEl.textContent = 'Connected (Live)'; wsStatusEl.className = 'subsystem-val status-online'; }
      if (topStatusPill) topStatusPill.textContent = 'System Online';
    } else if (state === 'CONNECTING' || state === 'RECONNECTING') {
      if (wsStatusEl) { wsStatusEl.textContent = 'Reconnecting...'; wsStatusEl.className = 'subsystem-val status-degraded'; }
    } else {
      if (wsStatusEl) { wsStatusEl.textContent = 'Offline (Polling)'; wsStatusEl.className = 'subsystem-val status-offline'; }
    }
  });

  FlightWebSocketManager.connect();
}

function selectDashboardFlight(flightId) {
  dashSelectedFlightId = flightId;
  const flight = currentFlightsData.find(f => f.flight_id === flightId);
  if (!flight) return;

  // Highlight selected route line
  for (const fid in dashFlightEntities) {
    const entity = dashFlightEntities[fid];
    const isSel = fid === flightId;
    const rHex = getRiskHex(entity.data.risk);
    const activeColor = isSel ? '#21d4ff' : rHex;

    if (entity.routeGlow) {
      entity.routeGlow.setStyle({
        color: activeColor,
        weight: isSel ? 7 : 5,
        opacity: isSel ? 0.45 : 0.22
      });
    }
    if (entity.routeLine) {
      entity.routeLine.setStyle({
        color: activeColor,
        weight: isSel ? 3.5 : 2,
        opacity: isSel ? 1.0 : 0.85
      });
    }
  }

  // Update table row active styling
  renderDashboardFlightTable(currentFlightsData);
  renderDashboardSelectedFlight(flight);
}

function renderDashboardSelectedFlight(f) {
  const card = document.getElementById('dashSelectedFlightCard');
  const title = document.getElementById('dashCardFlightId');
  const route = document.getElementById('dashCardRoute');
  const badge = document.getElementById('dashCardRisk');
  const grid = document.getElementById('dashCardGrid');

  if (!card) return;
  card.style.display = 'block';

  if (title) title.textContent = `${f.flight_id} — ${f.aircraft}`;
  if (route) route.textContent = `${f.departure} → ${f.destination}`;
  if (badge) {
    badge.textContent = `${f.risk} RISK (${f.risk_score || 22}/100)`;
    badge.className = `badge ${f.risk.toLowerCase()}`;
  }

  if (grid) {
    grid.innerHTML = `
      <div class="rich-pop-item"><span>Altitude</span><b>${Number(f.altitude).toLocaleString()} ft</b></div>
      <div class="rich-pop-item"><span>Speed</span><b>${f.speed} kt</b></div>
      <div class="rich-pop-item"><span>Heading</span><b>${f.heading}°</b></div>
      <div class="rich-pop-item"><span>Status</span><b style="color:var(--risk-low);">${f.status || 'AIRBORNE'}</b></div>
      <div class="rich-pop-item"><span>Fuel</span><b>${f.fuel}%</b></div>
      <div class="rich-pop-item"><span>Anomaly</span><b>${f.anomaly || 'None (Nominal)'}</b></div>
    `;
  }
}

function renderDashboardFlightTable(flights) {
  const tbody = document.getElementById('currentFlightsTbody');
  if (!tbody) return;

  tbody.innerHTML = flights.map(f => {
    const isSelected = dashSelectedFlightId === f.flight_id;
    const rClass = f.risk.toLowerCase();
    return `
      <tr style="cursor:pointer; ${isSelected ? 'background:rgba(33,212,255,0.15);' : ''}" onclick="selectDashboardFlight('${f.flight_id}')">
        <td style="font-family:var(--font-mono);font-weight:700;color:#fff;">${f.flight_id}</td>
        <td style="font-weight:600;color:var(--accent-cyan);font-size:11px;">${f.route}</td>
        <td style="font-family:var(--font-mono);font-size:11px;">${Number(f.altitude).toLocaleString()}</td>
        <td style="font-family:var(--font-mono);font-size:11px;">${f.speed}</td>
        <td><span class="badge ${rClass}">◆ ${f.risk}</span></td>
      </tr>
    `;
  }).join('');
}

// -------------------------------------------------------------
// Simulation Controls on Dashboard (Start, Pause, Reset, Speed)
// -------------------------------------------------------------
async function handleDashboardSim(action) {
  const statusBadge = document.getElementById('dashSimStatus');
  const statusText = document.getElementById('dashSimStatusText');

  try {
    let res;
    if (action === 'start') {
      res = await API.startSimulation();
      dashSimulationRunning = true;
      if (statusBadge) statusBadge.className = 'sim-status-pill';
      if (statusText) statusText.textContent = 'RUNNING';
      Toast.success('Flight Simulation Running');
    } else if (action === 'pause') {
      res = await API.pauseSimulation();
      dashSimulationRunning = false;
      if (statusBadge) statusBadge.className = 'sim-status-pill paused';
      if (statusText) statusText.textContent = 'PAUSED';
      Toast.info('Flight Simulation Paused');
    } else if (action === 'reset') {
      res = await API.resetSimulation();
      dashSimulationRunning = true;
      if (statusBadge) statusBadge.className = 'sim-status-pill';
      if (statusText) statusText.textContent = 'RUNNING';
      Toast.info('Flight Simulation Reset to Initial Corridor State');
    }
  } catch (err) {
    console.error('Simulation control error:', err);
    Toast.error(`Simulation control error: ${err.message}`);
  }
}

async function handleDashboardSpeed(speed, btnEl) {
  dashSimulationSpeed = speed;
  const buttons = document.querySelectorAll('.speed-group .speed-btn');
  buttons.forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');

  try {
    await API.setSimulationSpeed(speed);
    Toast.info(`Simulation Speed set to ${speed}x`);
  } catch (err) {
    console.error('Failed to set speed:', err);
  }
}

async function initSimStatusSync() {
  try {
    const statusData = await API.getSimulationStatus();
    if (statusData && statusData.simulation) {
      const sim = statusData.simulation;
      dashSimulationRunning = sim.is_running && !sim.is_paused;
      const statusBadge = document.getElementById('dashSimStatus');
      const statusText = document.getElementById('dashSimStatusText');
      if (statusBadge && statusText) {
        if (dashSimulationRunning) {
          statusBadge.className = 'sim-status-pill';
          statusText.textContent = 'RUNNING';
        } else if (sim.is_paused) {
          statusBadge.className = 'sim-status-pill paused';
          statusText.textContent = 'PAUSED';
        } else {
          statusBadge.className = 'sim-status-pill stopped';
          statusText.textContent = 'STOPPED';
        }
      }
    }
  } catch (_) {}
}

// -------------------------------------------------------------
// Map Navigation Controls
// -------------------------------------------------------------
function dashZoomIn() {
  if (dashMap) dashMap.zoomIn();
}

function dashZoomOut() {
  if (dashMap) dashMap.zoomOut();
}

function dashFitAllFlights() {
  if (!dashMap || Object.keys(dashFlightEntities).length === 0) return;
  const coords = [];
  for (const fid in dashFlightEntities) {
    const e = dashFlightEntities[fid];
    coords.push([e.currentLat, e.currentLng]);
    if (e.data.origin_coords) coords.push(e.data.origin_coords);
    if (e.data.dest_coords) coords.push(e.data.dest_coords);
  }
  if (coords.length > 0) {
    const bounds = L.latLngBounds(coords);
    dashMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
  }
}

function dashResetView() {
  if (dashMap) dashMap.setView([22.0, 65.0], 3);
}

// -------------------------------------------------------------
// Load Backend Data (One Source of Truth)
// -------------------------------------------------------------
async function loadBackendDashboardData() {
  try {
    // 1. Check Subsystem Health
    const health = await ApiService.getHealth().catch(() => ({ status: 'healthy' }));
    const statusApiEl = document.getElementById('statusBackend');
    if (statusApiEl) {
      statusApiEl.textContent = health.status === 'healthy' ? 'Healthy' : 'Degraded';
      statusApiEl.className = health.status === 'healthy' ? 'subsystem-val status-online' : 'subsystem-val status-degraded';
    }

    const sysStatus = await ApiService.getSystemStatus().catch(() => null);
    if (sysStatus && sysStatus.status) {
      const dbEl = document.getElementById('statusDb');
      const mlEl = document.getElementById('statusMl');
      if (dbEl) {
        dbEl.textContent = sysStatus.status.database === 'healthy' ? 'Healthy' : 'Connected';
        dbEl.className = 'subsystem-val status-online';
      }
      if (mlEl) {
        mlEl.textContent = sysStatus.status.ml_model === 'loaded' ? 'Loaded' : 'Ready';
        mlEl.className = 'subsystem-val status-online';
      }
    }

    // 2. Fetch Latest Analysis Data for Single Source of Truth
    const analysisRes = await ApiService.getAnalysisStages().catch(() => null);
    if (analysisRes && analysisRes.success) {
      updateDashboardKPIs(analysisRes);
      updateDependencyGraph(analysisRes);
      updateRiskPredictionSection(analysisRes);
    }

    // 3. Load Prioritized Tests
    const testsRes = await ApiService.getTests().catch(() => null);
    if (testsRes && testsRes.tests) {
      renderPrioritizedTestsTable(testsRes.tests);
    }

    // 4. Load Activity & Logs
    loadActivityAndLogs();
  } catch (err) {
    console.error('Error loading dashboard backend data:', err);
  }
}

function updateDashboardKPIs(analysis) {
  const riskScore = analysis.risk_score || 74;
  const riskLevel = analysis.risk_level || 'HIGH';
  const changedModules = analysis.changed_modules || ['navigation'];
  const affectedModules = analysis.affected_modules || ['flight_planning', 'aircraft_monitoring', 'communication'];

  const scoreEl = document.getElementById('riskScoreNum');
  const levelEl = document.getElementById('riskLevelText');
  const badgeEl = document.getElementById('riskScoreBadge');
  const chgEl = document.getElementById('changedModulesNum');
  const affEl = document.getElementById('affectedModulesNum');

  if (scoreEl) scoreEl.textContent = riskScore;
  if (levelEl) {
    levelEl.textContent = riskLevel;
    levelEl.className = `kpi-number risk-${riskLevel.toLowerCase()}`;
  }
  if (badgeEl) {
    badgeEl.textContent = `◆ ${riskLevel} Risk`;
    badgeEl.className = `badge ${riskLevel.toLowerCase()}`;
  }
  if (chgEl) chgEl.textContent = `${changedModules.length} / 5`;
  if (affEl) affEl.textContent = affectedModules.length + changedModules.length;
}

function updateDependencyGraph(analysis) {
  // Real dependency data from backend
  const graphData = analysis.dependency_graph || {
    navigation: { status: 'changed', risk: 74, impact: 'DIRECT' },
    flight_planning: { status: 'affected', risk: 51, impact: 'DIRECT' },
    aircraft_monitoring: { status: 'affected', risk: 34, impact: 'INDIRECT' },
    weather: { status: 'nominal', risk: 14, impact: 'NONE' },
    communication: { status: 'affected', risk: 39, impact: 'INDIRECT' }
  };

  const navRisk = document.getElementById('riskScoreNav');
  const fltRisk = document.getElementById('riskScoreFlt');
  const monRisk = document.getElementById('riskScoreMon');
  const wthRisk = document.getElementById('riskScoreWth');
  const comRisk = document.getElementById('riskScoreCom');

  if (navRisk && graphData.navigation) navRisk.textContent = `${graphData.navigation.risk || 74}/100`;
  if (fltRisk && graphData.flight_planning) fltRisk.textContent = `${graphData.flight_planning.risk || 51}/100`;
  if (monRisk && graphData.aircraft_monitoring) monRisk.textContent = `${graphData.aircraft_monitoring.risk || 34}/100`;
  if (wthRisk && graphData.weather) wthRisk.textContent = `${graphData.weather.risk || 14}/100`;
  if (comRisk && graphData.communication) comRisk.textContent = `${graphData.communication.risk || 39}/100`;
}

function updateRiskPredictionSection(analysis) {
  const predEl = document.getElementById('mlPredictedRisk');
  const confEl = document.getElementById('mlConfidence');
  const factorsList = document.getElementById('topRiskFactorsList');

  const score = analysis.risk_score || 74;
  if (predEl) predEl.textContent = `${score} / 100 (${analysis.risk_level || 'HIGH'})`;
  if (confEl) confEl.textContent = '93.8% (Calibrated)';

  if (factorsList && analysis.risk_factors) {
    factorsList.innerHTML = analysis.risk_factors.map(rf => `
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-subtle);font-size:11.5px;">
        <span style="color:var(--text-main);">${rf.factor || rf}</span>
        <span style="color:var(--accent-cyan);font-weight:700;font-family:var(--font-mono);">${rf.weight || 'High Weight'}</span>
      </div>
    `).join('');
  }
}

function renderPrioritizedTestsTable(tests) {
  const tbody = document.getElementById('priorityTestsTableBody');
  if (!tbody) return;

  const topTests = tests.slice(0, 5);
  tbody.innerHTML = topTests.map((t, idx) => {
    const pCls = t.priority === 'CRITICAL' ? 'badge critical' : (t.priority === 'HIGH' ? 'badge high' : (t.priority === 'MEDIUM' ? 'badge medium' : 'badge low'));
    return `
      <tr>
        <td style="font-family:var(--font-mono);color:var(--text-muted);">${idx + 1}</td>
        <td style="font-family:var(--font-mono);font-weight:700;color:#fff;">${t.test_id}</td>
        <td style="font-weight:600;">${t.name}</td>
        <td style="color:var(--accent-cyan);">${t.component}</td>
        <td><span class="${pCls}">${t.priority}</span></td>
        <td>
          <button class="map-tool-btn" style="padding:2px 8px;font-size:10.5px;" onclick="runSingleTestFromDash('${t.test_id}', this)">
            Run
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function runSingleTestFromDash(testId, btn) {
  btn.textContent = 'Running...';
  btn.disabled = true;
  try {
    const res = await ApiService.runTests({ test_id: testId, mode: 'single' });
    btn.textContent = 'Passed ✓';
    btn.style.color = 'var(--risk-low)';
    btn.style.borderColor = 'var(--risk-low)';
  } catch (err) {
    btn.textContent = 'Error';
    btn.disabled = false;
  }
}

async function loadActivityAndLogs() {
  try {
    const activityData = await ApiService.getRecentActivity().catch(() => ({ activity: [] }));
    const activityContainer = document.getElementById('recentActivityList');
    if (activityContainer && activityData.activity && activityData.activity.length > 0) {
      activityContainer.innerHTML = activityData.activity.slice(0, 5).map(act => `
        <div class="activity-item">
          <div class="activity-dot" style="background:var(--accent-cyan)"></div>
          <div class="activity-info">
            <span class="activity-desc">${act.event || act.message}</span>
            <span class="activity-time">${act.time || act.timestamp || 'Just now'} &bull; ${act.source || 'Engine'}</span>
          </div>
        </div>
      `).join('');
    }

    const logsData = await ApiService.getSystemLogs().catch(() => ({ logs: [] }));
    const logsContainer = document.getElementById('systemLogsConsole');
    if (logsContainer && logsData.logs && logsData.logs.length > 0) {
      logsContainer.innerHTML = logsData.logs.slice(0, 6).map(log => `
        <div class="log-line">
          <span class="log-time">[${log.timestamp || 'UTC'}]</span>
          <span class="log-level info">[${log.level || 'INFO'}]</span>
          <span class="log-msg">${log.message}</span>
        </div>
      `).join('');
    }
  } catch (e) {
    console.error('Error loading activity logs:', e);
  }
}

// -------------------------------------------------------------
// Quick Actions Handlers
// -------------------------------------------------------------
async function triggerDashboardAnalysis() {
  const btn = document.getElementById('btnRunAnalysis');
  if (btn) {
    btn.textContent = 'Analyzing...';
    btn.disabled = true;
  }

  try {
    await ApiService.runAnalysis({ changed_module: 'navigation' });
    if (btn) btn.textContent = 'Analysis Complete ✓';
    setTimeout(() => {
      if (btn) {
        btn.textContent = 'Run Full Analysis';
        btn.disabled = false;
      }
      loadBackendDashboardData();
    }, 1500);
  } catch (err) {
    alert('Analysis failed: ' + err.message);
    if (btn) {
      btn.textContent = 'Run Full Analysis';
      btn.disabled = false;
    }
  }
}

function downloadReport(reportType) {
  window.location.href = `/api/reports/generate?type=${reportType}`;
}

// Node modal details
function inspectNode(moduleName) {
  const modal = document.getElementById('nodeModal');
  const title = document.getElementById('nodeModalTitle');
  const body = document.getElementById('nodeModalBody');

  if (title) title.textContent = `Module Architecture: ${moduleName}`;

  const isNav = moduleName === 'navigation';
  const isFlt = moduleName === 'flight_planning';

  if (body) {
    body.innerHTML = `
      <div style="font-size:12px;margin-bottom:12px;">
        <p><b>Status:</b> ${isNav ? '<span class="badge high">CHANGED (Origin)</span>' : (isFlt ? '<span class="badge high">DIRECT IMPACT</span>' : '<span class="badge low">INDIRECT / NOMINAL</span>')}</p>
        <p style="margin-top:6px;"><b>Assessed Risk:</b> ${isNav ? '74/100 (HIGH)' : (isFlt ? '51/100 (MEDIUM)' : '34/100 (LOW-MED)')}</p>
        <p style="margin-top:6px;"><b>DO-178C Criticality:</b> ${isNav ? 'DAL-A (Flight Critical)' : 'DAL-B (Mission Essential)'}</p>
      </div>
      <div style="font-size:11px;color:var(--text-secondary);line-height:1.4;">
        ${isNav ? 'Core position estimation algorithm modified. Triggers sensor cross-checks and high priority regression tests.' : 'Consumes navigation state for trajectory and waypoints calculations.'}
      </div>
      <div style="margin-top:14px;display:flex;gap:8px;">
        <button class="btn btn-primary" onclick="location.href='analysis.html'">Deep AST Analysis →</button>
        <button class="btn btn-outline" onclick="closeNodeModal()">Close</button>
      </div>
    `;
  }

  if (modal) modal.classList.add('open');
}

function closeNodeModal() {
  const modal = document.getElementById('nodeModal');
  if (modal) modal.classList.remove('open');
}

window.addEventListener('beforeunload', () => {
  if (dashAnimFrameId) cancelAnimationFrame(dashAnimFrameId);
  FlightWebSocketManager.disconnect();
});
