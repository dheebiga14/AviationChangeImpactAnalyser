/**
 * Aviation Change Impact Analyzer - Centralized API & WebSocket Client
 */

const API_BASE = window.location.origin;

// Toast Notification Manager
const Toast = {
  show(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span>${message}</span>
      <button style="color:inherit;opacity:0.7;" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.25s ease';
        setTimeout(() => toast.remove(), 250);
      }
    }, duration);
  },
  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error'); },
  info(msg) { this.show(msg, 'info'); }
};

// Centralized API Service
const API = {
  async request(path, options = {}) {
    const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
    const timeout = options.timeout || 12000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errDetail = `Server responded with ${response.status}`;
        try {
          const errData = await response.json();
          if (errData && errData.detail) errDetail = errData.detail;
        } catch (_) {}
        throw new Error(errDetail);
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return await response.json();
      }
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeout / 1000}s`);
      }
      throw err;
    }
  },

  async get(path) {
    return this.request(path, { method: 'GET' });
  },

  async post(path, body) {
    return this.request(path, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  // Analysis endpoints
  async runAnalysis(moduleName = 'navigation') {
    return this.get(`/api/analysis/run?changed_module=${encodeURIComponent(moduleName)}`);
  },

  async getAnalysisStages() {
    return this.get('/api/analysis/stages');
  },

  async getRiskHistory() {
    return this.get('/api/analysis/risk-history');
  },

  async getAnalysisHistory() {
    return this.get('/api/analysis/history');
  },

  // Flights & Simulation endpoints
  async getFlights() {
    return this.get('/api/flights/');
  },

  async getFlight(id) {
    return this.get(`/api/flights/${id}`);
  },

  async startSimulation() {
    return this.post('/api/flights/simulation/start', {});
  },

  async pauseSimulation() {
    return this.post('/api/flights/simulation/pause', {});
  },

  async resetSimulation() {
    return this.post('/api/flights/simulation/reset', {});
  },

  async getSimulationStatus() {
    return this.get('/api/flights/simulation/status');
  },

  async setSimulationSpeed(speed) {
    return this.post('/api/flights/simulation/speed', { speed });
  },

  // Tests endpoints
  async getTests() {
    return this.get('/api/tests/');
  },

  async runTests(options = {}) {
    return this.post('/api/tests/run', options);
  },

  // Reports endpoints
  async getReportsList() {
    return this.get('/api/reports/list');
  },

  async downloadReport(type = 'impact') {
    const url = `${API_BASE}/api/reports/generate?type=${encodeURIComponent(type)}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `aviation_${type}_report.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  // System endpoints
  async getSystemStatus() {
    return this.get('/api/status');
  },

  async getRecentActivity() {
    return this.get('/api/activity');
  },

  async getSystemLogs() {
    return this.get('/api/logs');
  }
};

// WebSocket Manager with Reconnect & Polling Fallback
class FlightWebSocketManager {
  constructor() {
    this.ws = null;
    this.state = 'DISCONNECTED';
    this.listeners = new Set();
    this.stateListeners = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 6;
    this.reconnectTimer = null;
    this.pollFallbackTimer = null;
    this.isManualClosed = false;
  }

  connect() {
    this.isManualClosed = false;
    this.setState('CONNECTING');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/flights`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setState('CONNECTED');
        this.stopPollingFallback();
      };

      this.ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          let flights = raw;
          let simStatus = null;
          if (raw && !Array.isArray(raw) && Array.isArray(raw.flights)) {
            flights = raw.flights;
            simStatus = raw.simulation || null;
          }
          this.notifyListeners(flights, simStatus);
        } catch (err) {
          console.error('Failed to parse flight telemetry:', err);
        }
      };

      this.ws.onerror = () => {
        // Will trigger onclose
      };

      this.ws.onclose = () => {
        if (!this.isManualClosed) {
          this.setState('DISCONNECTED');
          this.scheduleReconnect();
          this.startPollingFallback();
        }
      };
    } catch (e) {
      this.setState('DISCONNECTED');
      this.scheduleReconnect();
      this.startPollingFallback();
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      // Continue polling silently instead of looping endlessly
      return;
    }

    this.reconnectAttempts++;
    this.setState('RECONNECTING');
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 8000);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  startPollingFallback() {
    if (this.pollFallbackTimer) return;
    // Initial fetch
    this.fetchFallbackData();
    this.pollFallbackTimer = setInterval(() => {
      this.fetchFallbackData();
    }, 2000);
  }

  stopPollingFallback() {
    if (this.pollFallbackTimer) {
      clearInterval(this.pollFallbackTimer);
      this.pollFallbackTimer = null;
    }
  }

  async fetchFallbackData() {
    try {
      const res = await API.getFlights();
      if (res && res.flights) {
        this.notifyListeners(res.flights, res.simulation || null);
      }
    } catch (_) {}
  }

  setState(newState) {
    this.state = newState;
    this.stateListeners.forEach((fn) => fn(newState));
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  onStateChange(callback) {
    this.stateListeners.add(callback);
    callback(this.state);
    return () => this.stateListeners.delete(callback);
  }

  notifyListeners(data, simStatus) {
    this.listeners.forEach((fn) => fn(data, simStatus));
  }

  disconnect() {
    this.isManualClosed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.stopPollingFallback();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

const flightSocket = new FlightWebSocketManager();

// Compatibility Layer
const ApiService = {
  ...API,
  getHealth: () => API.get('/api/health'),
  runAnalysis: (payload) => API.post('/api/analysis/run', payload || { changed_module: 'navigation' }),
  getAnalysisStages: () => API.get('/api/analysis/stages'),
  getSystemStatus: () => API.get('/api/status'),
  getRecentActivity: () => API.get('/api/activity'),
  getSystemLogs: () => API.get('/api/logs'),
  getFlights: () => API.get('/api/flights/'),
  getTests: () => API.get('/api/tests/'),
  runTests: (opts) => API.post('/api/tests/run', opts || {}),
  getReportsList: () => API.get('/api/reports/list'),
  downloadReport: (type) => API.downloadReport(type)
};

FlightWebSocketManager.onMessage = function(cb) {
  return flightSocket.subscribe(cb);
};

FlightWebSocketManager.onStateChange = function(cb) {
  return flightSocket.onStateChange(cb);
};

FlightWebSocketManager.connect = function() {
  flightSocket.connect();
};

FlightWebSocketManager.disconnect = function() {
  flightSocket.disconnect();
};


// Clock initializer for live header time
function initLiveClock() {
  const clockEl = document.getElementById('topDate');
  if (!clockEl) return;

  function update() {
    const now = new Date();
    // Format: Apr 29, 2025 14:32:17 (using current local dynamic date)
    const options = {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    clockEl.textContent = now.toLocaleString('en-US', options);
  }

  update();
  setInterval(update, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
  initLiveClock();
});
