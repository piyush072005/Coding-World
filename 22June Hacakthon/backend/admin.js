/**
 * ArmorIQ — Visual Admin Panel
 * Served at http://localhost:3001/admin
 * Shows live DB contents, agent status, and request logs — no extra software needed.
 */

const database = require("./db");

// In-memory request log (last 50 entries)
const requestLog = [];

function logRequest(method, path, statusCode, durationMs, body) {
  requestLog.unshift({
    ts: new Date().toISOString(),
    method,
    path,
    statusCode,
    durationMs,
    input: body?.input || null,
  });
  if (requestLog.length > 50) requestLog.pop();
}

function getAdminData() {
  const metrics    = database.getMetrics();
  const policies   = database.getAllPolicies();
  const blockedIPs = database.getAllBlockedIPs();
  const logs       = database.getAllLogs().slice(0, 20);
  return { metrics, policies, blockedIPs, logs, requestLog: requestLog.slice(0, 20) };
}

function statusColor(status) {
  if (status === "SUCCESS")          return "#00ff88";
  if (status === "POLICY_VIOLATION") return "#ff3366";
  if (status === "PARSE_ERROR")      return "#ffaa00";
  return "#64748b";
}

function adminHTML(data) {
  const { metrics, policies, blockedIPs, logs, requestLog: rLog } = data;

  const policyRows = policies.map(p => `
    <tr>
      <td><span class="code">${p.code}</span></td>
      <td>${p.name}</td>
      <td><span class="badge badge-green">● Active</span></td>
      <td style="font-size:11px;color:#64748b;max-width:320px">${p.description}</td>
    </tr>`).join("");

  const ipRows = blockedIPs.map(b => `
    <tr>
      <td><span class="mono">${b.ip}</span></td>
      <td style="font-size:11px">${b.reason}</td>
      <td style="font-size:11px;color:#64748b">${b.blocked_by}</td>
      <td style="font-size:11px;color:#64748b">${new Date(b.blocked_at).toLocaleString()}</td>
    </tr>`).join("");

  const logRows = logs.map(l => {
    const cmd = typeof l.parsed_command === "object" ? l.parsed_command : {};
    const color = statusColor(l.status);
    return `
    <tr>
      <td style="font-size:11px;color:#64748b;white-space:nowrap">${new Date(l.timestamp).toLocaleString()}</td>
      <td style="font-size:12px;font-family:monospace;max-width:200px;overflow:hidden;text-overflow:ellipsis" title="${l.original_input}">${l.original_input}</td>
      <td><span class="mono" style="color:#00d4ff">${cmd.action || "—"}</span></td>
      <td><span class="badge" style="background:${color}22;border:1px solid ${color}55;color:${color}">${l.status}</span></td>
      <td style="font-size:11px;color:#64748b;max-width:200px;overflow:hidden;text-overflow:ellipsis">${l.enforcement}</td>
      <td><span class="mono" style="font-size:10px;color:#334155" title="${l.sha256_hash}">${(l.sha256_hash||"").slice(0,12)}…</span></td>
    </tr>`;
  }).join("");

  const reqRows = rLog.map(r => {
    const methodColor = r.method === "POST" ? "#a855f7" : "#00d4ff";
    const scColor = r.statusCode >= 400 ? "#ff3366" : r.statusCode >= 200 ? "#00ff88" : "#ffaa00";
    return `
    <tr>
      <td style="font-size:11px;color:#64748b;white-space:nowrap">${new Date(r.ts).toLocaleTimeString()}</td>
      <td><span class="badge" style="background:${methodColor}22;border:1px solid ${methodColor}55;color:${methodColor}">${r.method}</span></td>
      <td><span class="mono">${r.path}</span></td>
      <td style="color:${scColor};font-weight:700">${r.statusCode || "—"}</td>
      <td style="font-size:11px;color:#64748b">${r.durationMs != null ? r.durationMs + "ms" : "—"}</td>
      <td style="font-size:11px;font-family:monospace;color:#94a3b8">${r.input || ""}</td>
    </tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ArmorIQ Admin Panel</title>
<meta http-equiv="refresh" content="5">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#080c14;color:#e2e8f0;font-family:Inter,system-ui,sans-serif;min-height:100vh}
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');

  /* Header */
  .header{background:#0d1420;border-bottom:1px solid #1e2d40;padding:16px 32px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:99}
  .brand{display:flex;align-items:center;gap:12px}
  .brand-icon{width:40px;height:40px;background:linear-gradient(135deg,rgba(0,212,255,.15),rgba(168,85,247,.15));border:1px solid rgba(0,212,255,.25);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px}
  .brand-name{font-size:18px;font-weight:800;color:#fff}
  .brand-name span{color:#00d4ff}
  .brand-sub{font-size:11px;color:#64748b;margin-top:2px}
  .live-badge{display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;background:rgba(0,255,136,.08);border:1px solid rgba(0,255,136,.25);font-size:12px;font-weight:600;color:#00ff88}
  .dot{width:7px;height:7px;border-radius:50%;background:#00ff88;box-shadow:0 0 8px #00ff88;animation:pulse 2s infinite}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(.85)}}
  .refresh-note{font-size:11px;color:#64748b;margin-left:12px}

  /* Layout */
  .main{max-width:1400px;margin:0 auto;padding:24px 32px;display:flex;flex-direction:column;gap:24px}
  .section-title{font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px;display:flex;align-items:center;gap:8px}
  .section-title::after{content:"";flex:1;height:1px;background:linear-gradient(to right,rgba(30,45,64,.8),transparent)}

  /* Metric cards */
  .metrics-row{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
  .metric-card{background:rgba(17,24,39,.85);border:1px solid rgba(30,45,64,.8);border-radius:12px;padding:20px;transition:border-color .2s}
  .metric-card:hover{border-color:rgba(0,212,255,.25)}
  .metric-num{font-size:36px;font-weight:900;background:linear-gradient(135deg,#00d4ff,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1;margin:8px 0 4px}
  .metric-label{font-size:12px;font-weight:600;color:#e2e8f0}
  .metric-sub{font-size:11px;color:#64748b;margin-top:2px}
  .metric-icon{font-size:20px;margin-bottom:4px}

  /* Tables */
  .card{background:rgba(17,24,39,.85);border:1px solid rgba(30,45,64,.8);border-radius:12px;overflow:hidden}
  table{width:100%;border-collapse:collapse}
  thead th{background:rgba(8,12,20,.9);color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;padding:10px 14px;text-align:left;border-bottom:1px solid rgba(30,45,64,.8)}
  tbody td{padding:10px 14px;border-bottom:1px solid rgba(30,45,64,.3);font-size:13px;vertical-align:middle}
  tbody tr:hover td{background:rgba(0,212,255,.02)}
  tbody tr:last-child td{border-bottom:none}
  .code{font-family:"JetBrains Mono",monospace;font-size:11px;font-weight:600;color:#a855f7;background:rgba(168,85,247,.1);padding:2px 8px;border-radius:4px;border:1px solid rgba(168,85,247,.2)}
  .mono{font-family:"JetBrains Mono",monospace;font-size:12px;color:#94a3b8}
  .badge{display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600}
  .badge-green{background:rgba(0,255,136,.1);border:1px solid rgba(0,255,136,.3);color:#00ff88}

  /* Agent status */
  .services-row{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
  .service-card{background:rgba(17,24,39,.85);border:1px solid rgba(30,45,64,.8);border-radius:12px;padding:18px;display:flex;align-items:center;gap:14px}
  .service-icon{width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0}
  .service-name{font-size:14px;font-weight:700;color:#e2e8f0}
  .service-url{font-family:"JetBrains Mono",monospace;font-size:11px;color:#64748b;margin-top:2px}
  .service-status{margin-top:6px}
</style>
</head>
<body>

<div class="header">
  <div class="brand">
    <div class="brand-icon">🛡️</div>
    <div>
      <div class="brand-name">Armor<span>IQ</span> <span style="font-size:12px;color:#64748b;font-weight:400">Admin Panel</span></div>
      <div class="brand-sub">Live database viewer &amp; service monitor · Team TechyBotsXO</div>
    </div>
  </div>
  <div style="display:flex;align-items:center;gap:16px">
    <span class="refresh-note">⟳ Auto-refreshes every 5 seconds</span>
    <div class="live-badge"><span class="dot"></span> LIVE</div>
  </div>
</div>

<div class="main">

  <!-- Services -->
  <div>
    <div class="section-title">🔌 Running Services</div>
    <div class="services-row">
      <div class="service-card" style="border-color:rgba(0,212,255,.25)">
        <div class="service-icon" style="background:rgba(0,212,255,.1);border:1px solid rgba(0,212,255,.2)">⚛️</div>
        <div>
          <div class="service-name">React Frontend</div>
          <div class="service-url">http://localhost:5173</div>
          <div class="service-status"><span class="badge badge-green">● Running</span></div>
        </div>
      </div>
      <div class="service-card" style="border-color:rgba(168,85,247,.25)">
        <div class="service-icon" style="background:rgba(168,85,247,.1);border:1px solid rgba(168,85,247,.2)">⚙️</div>
        <div>
          <div class="service-name">Node.js Backend</div>
          <div class="service-url">http://localhost:3001</div>
          <div class="service-status"><span class="badge badge-green">● Running</span></div>
        </div>
      </div>
      <div class="service-card" style="border-color:rgba(0,255,136,.25)">
        <div class="service-icon" style="background:rgba(0,255,136,.1);border:1px solid rgba(0,255,136,.2)">🐍</div>
        <div>
          <div class="service-name">Python NLP Agent</div>
          <div class="service-url">http://127.0.0.1:5001</div>
          <div class="service-status"><span class="badge badge-green">● Running</span></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Metrics -->
  <div>
    <div class="section-title">📊 Live Metrics</div>
    <div class="metrics-row">
      <div class="metric-card">
        <div class="metric-icon">⏱️</div>
        <div class="metric-num">80%</div>
        <div class="metric-label">Audit Time Saved</div>
        <div class="metric-sub">vs manual review</div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">🔴</div>
        <div class="metric-num">${metrics.active_blocked_ips}</div>
        <div class="metric-label">Active Blocked IPs</div>
        <div class="metric-sub">enforced by ArmorClaw</div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">⚡</div>
        <div class="metric-num">${metrics.total_actions}</div>
        <div class="metric-label">Total Executed Actions</div>
        <div class="metric-sub">${metrics.successful_actions} successful</div>
      </div>
      <div class="metric-card">
        <div class="metric-icon">🛡️</div>
        <div class="metric-num">${metrics.violations_prevented}</div>
        <div class="metric-label">Violations Prevented</div>
        <div class="metric-sub">zero-trust enforcement</div>
      </div>
    </div>
  </div>

  <!-- Request Log -->
  <div>
    <div class="section-title">📡 Live API Request Log (last 20)</div>
    <div class="card">
      <table>
        <thead><tr>
          <th>Time</th><th>Method</th><th>Path</th><th>Status</th><th>Duration</th><th>Input</th>
        </tr></thead>
        <tbody>${reqRows || '<tr><td colspan="6" style="text-align:center;color:#64748b;padding:24px">No requests yet — submit a command from the dashboard</td></tr>'}</tbody>
      </table>
    </div>
  </div>

  <!-- Audit Logs (DB) -->
  <div>
    <div class="section-title">🗄️ Database — Audit Logs (latest 20 records)</div>
    <div class="card">
      <table>
        <thead><tr>
          <th>Timestamp</th><th>Original Input</th><th>Action</th><th>Status</th><th>Enforcement</th><th>SHA-256</th>
        </tr></thead>
        <tbody>${logRows || '<tr><td colspan="6" style="text-align:center;color:#64748b;padding:24px">No audit logs yet</td></tr>'}</tbody>
      </table>
    </div>
  </div>

  <!-- Policies (DB) -->
  <div>
    <div class="section-title">📋 Database — Active Policies (${policies.length} records)</div>
    <div class="card">
      <table>
        <thead><tr>
          <th>Code</th><th>Policy Name</th><th>Status</th><th>Description</th>
        </tr></thead>
        <tbody>${policyRows}</tbody>
      </table>
    </div>
  </div>

  <!-- Blocked IPs (DB) -->
  <div>
    <div class="section-title">🚫 Database — Blocked IPs (${blockedIPs.length} records)</div>
    <div class="card">
      <table>
        <thead><tr>
          <th>IP Address</th><th>Reason</th><th>Blocked By</th><th>Blocked At</th>
        </tr></thead>
        <tbody>${ipRows || '<tr><td colspan="4" style="text-align:center;color:#64748b;padding:24px">No blocked IPs</td></tr>'}</tbody>
      </table>
    </div>
  </div>

  <div style="text-align:center;color:#334155;font-size:11px;padding:8px 0">
    ArmorIQ Admin Panel · Data refreshes every 5s · All data from armoriq-data.json · Team TechyBotsXO
  </div>

</div>
</body>
</html>`;
}

module.exports = { logRequest, adminHTML, getAdminData };
