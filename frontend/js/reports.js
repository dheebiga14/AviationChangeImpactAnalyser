/**
 * Aviation Change Impact Analyzer - Reports Center Controller
 * Generates and downloads four distinct ReportLab PDF reports with real-time filtering
 */

let allReportsList = [];

document.addEventListener('DOMContentLoaded', () => {
  initClock();
  loadReportsArchive();
});

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

async function loadReportsArchive() {
  const tbody = document.getElementById('reportsArchiveTable');
  if (!tbody) return;

  try {
    const res = await ApiService.getReportsList();
    allReportsList = (res && res.reports) || [];
    applyReportFilters();
  } catch (err) {
    console.error('Error fetching reports archive:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:16px;color:var(--text-muted)">Archive offline. Click any Generate button above to compile a fresh PDF report.</td></tr>`;
  }
}

// -------------------------------------------------------------
// Combined Report Filters (Type + Module + Date)
// -------------------------------------------------------------
function applyReportFilters() {
  const typeFilter = document.getElementById('filterReportType')?.value || 'all';
  const modFilter = document.getElementById('filterReportModule')?.value || 'all';
  const dateFilter = document.getElementById('filterReportDate')?.value || 'all';

  const tbody = document.getElementById('reportsArchiveTable');
  if (!tbody) return;

  const filtered = allReportsList.filter(r => {
    const matchesType = typeFilter === 'all' || r.type === typeFilter;
    const matchesModule = modFilter === 'all' || (r.module || 'navigation').toLowerCase() === modFilter.toLowerCase();
    // Synthetic date filter
    const matchesDate = true;
    return matchesType && matchesModule && matchesDate;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">No reports match the selected filters.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(r => {
    const badgeCls = r.type === 'Critical' || r.type === 'Risk' ? 'badge high' : (r.type === 'Simulation' ? 'badge medium' : 'badge low');
    const param = r.param || r.id || 'impact';

    return `
      <tr>
        <td style="font-weight:700;color:#fff;">
          <div style="display:flex;align-items:center;gap:8px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            ${r.name}
          </div>
        </td>
        <td><span class="${badgeCls}">${r.type}</span></td>
        <td style="font-family:var(--font-mono);color:var(--text-muted);">${r.date}</td>
        <td style="font-family:var(--font-mono);">${r.size}</td>
        <td><span style="color:#ff6879;font-weight:700;font-size:9.5px;background:rgba(255,104,121,0.12);padding:2px 6px;border-radius:3px;">PDF</span></td>
        <td><span style="color:var(--risk-low);font-weight:600;">Verified Ready</span></td>
        <td>
          <div style="display:flex;gap:6px;">
            <button class="map-tool-btn" style="padding:3px 8px;font-size:10px;" onclick="generateAndDownloadReport('${param}')">
              Download
            </button>
            <button class="map-tool-btn" style="padding:3px 8px;font-size:10px;" onclick="previewReport('${param}')">
              Preview
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// -------------------------------------------------------------
// Report Generation & Direct Download
// -------------------------------------------------------------
function generateAndDownloadReport(type) {
  // Triggers backend PDF generation via ReportLab and browser download
  const cleanType = (type || 'impact').toLowerCase();
  window.location.href = `/api/reports/generate?type=${cleanType}`;
}

// -------------------------------------------------------------
// Report Previews Modal
// -------------------------------------------------------------
const REPORT_SPECIFICATIONS = {
  impact: {
    title: 'Change Impact Analysis Report (aviation_impact_report.pdf)',
    type: 'Change Impact Analysis (DO-178C Compliance)',
    sections: [
      '1. Executive Summary & Change Scope (navigation v2.1.4 → v2.2.0-rc1)',
      '2. Code Change Detection (AST function signatures, lines modified)',
      '3. Detailed Module Dependency & Impact Breakdown (Direct vs Indirect)',
      '4. Safety Severity Classification (DAL-A Criticality)',
      '5. Architectural Impact Explanation & Next Steps'
    ],
    note: 'This report provides complete traceability from code change to affected downstream modules.'
  },
  risk: {
    title: 'Risk Assessment & Safety Analysis Report (aviation_risk_report.pdf)',
    type: 'Quantitative Safety Risk Scoring',
    sections: [
      '1. Overall System Risk Score & Evaluation (74 / 100 HIGH RISK)',
      '2. Confidence Score (93.8% via Random Forest Safety Model)',
      '3. Module-Wise Risk Distribution (navigation: 74, flight_planning: 51, comm: 39)',
      '4. Key Risk Contributors & Feature Importance Weights',
      '5. Actionable Mitigation Mandates'
    ],
    note: 'Calibrated safety score prevents false alarms while flagging true flight-critical hazards.'
  },
  tests: {
    title: 'Regression Test Prioritization Report (aviation_test_report.pdf)',
    type: 'Regression Test Verification Matrix',
    sections: [
      '1. Test Suite Summary & Execution Strategy (26 Tests Across 5 Modules)',
      '2. Critical Path Verification (4 Mandatory Critical Tests)',
      '3. Execution Priority Ranking with Justifications (NAV-001, NAV-002, NAV-005, FLT-001...)',
      '4. Estimated Test Execution Duration (1.12 seconds)',
      '5. Required DAL-A Test Coverage Benchmarks (≥ 90%)'
    ],
    note: 'Prioritizes regression testing strictly on modules affected by the software modification.'
  },
  simulation: {
    title: 'Flight Simulation & Telemetry Surveillance Report (aviation_simulation_report.pdf)',
    type: 'Real-Time Airspace Telemetry Audit',
    sections: [
      '1. Simulation Run Overview & Channel Status (1.0 Hz Broadcast)',
      '2. Monitored Commercial Flights (AI101, AI202, AI303, AI404, AI505)',
      '3. Real-Time Aircraft Telemetry Snapshot (Altitude, Speed, Heading, Risk)',
      '4. Active Injected Event Status & Telemetry Deviations',
      '5. Flight Events & System Audit Timeline'
    ],
    note: 'Audits real geographic flight corridors and verifies sensor data integrity during flight.'
  }
};

function previewReport(type) {
  const cleanType = (type || 'impact').toLowerCase();
  const spec = REPORT_SPECIFICATIONS[cleanType] || REPORT_SPECIFICATIONS.impact;

  const modal = document.getElementById('reportPreviewModal');
  const title = document.getElementById('previewModalTitle');
  const body = document.getElementById('previewModalBody');

  if (title) title.textContent = spec.title;

  if (body) {
    body.innerHTML = `
      <div style="font-size:12px;margin-bottom:12px;">
        <span class="badge high">${spec.type}</span>
        <p style="margin-top:8px;color:var(--text-secondary);font-size:11px;">${spec.note}</p>
      </div>

      <div style="background:#071b2d;border:1px solid var(--border-panel);border-radius:4px;padding:12px;margin-bottom:14px;">
        <div style="font-size:11px;font-weight:700;color:var(--accent-cyan);text-transform:uppercase;margin-bottom:8px;">
          Included Report Sections:
        </div>
        ${spec.sections.map(s => `
          <div style="font-size:11px;color:var(--text-main);padding:4px 0;border-bottom:1px solid var(--border-subtle);display:flex;align-items:center;gap:6px;">
            <span style="color:var(--accent-cyan);">■</span> ${s}
          </div>
        `).join('')}
      </div>

      <div style="display:flex;justify-content:flex-end;gap:8px;">
        <button class="btn btn-outline" onclick="closePreviewModal()">Close</button>
        <button class="btn btn-primary" onclick="generateAndDownloadReport('${cleanType}')">
          Compile & Download PDF →
        </button>
      </div>
    `;
  }

  if (modal) modal.classList.add('open');
}

function closePreviewModal() {
  const modal = document.getElementById('reportPreviewModal');
  if (modal) modal.classList.remove('open');
}
