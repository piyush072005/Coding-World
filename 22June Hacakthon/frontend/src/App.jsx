import React from "react";
import axios from "axios";
import Header from "./components/Header";
import CommandConsole from "./components/CommandConsole";
import MetricCards from "./components/MetricCards";
import PolicyPanel from "./components/PolicyPanel";
import AuditTable from "./components/AuditTable";

const POLL_INTERVAL = 5000; // ms

export default function App() {
  const [metrics, setMetrics] = React.useState({
    total_actions: 0,
    successful_actions: 0,
    violations_prevented: 0,
    parse_errors: 0,
    active_blocked_ips: 0,
    audit_time_saved_pct: 80,
  });
  const [policies, setPolicies] = React.useState([]);
  const [logs, setLogs] = React.useState([]);
  const [logsLoading, setLogsLoading] = React.useState(true);
  const [backendOnline, setBackendOnline] = React.useState(null); // null = checking

  // Initial data load
  React.useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, POLL_INTERVAL);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAll() {
    try {
      const [metricsRes, policiesRes, auditRes] = await Promise.all([
        axios.get("/api/metrics"),
        axios.get("/api/policies"),
        axios.get("/api/audit"),
      ]);
      setMetrics(metricsRes.data);
      setPolicies(policiesRes.data.policies || []);
      setLogs(auditRes.data.logs || []);
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
    } finally {
      setLogsLoading(false);
    }
  }

  // Called by CommandConsole after a command is executed
  function handleCommandExecuted() {
    // Refresh with a short delay to let the DB commit
    setTimeout(fetchAll, 300);
  }

  return (
    <div className="min-h-screen armor-hero-bg armor-grid-bg font-sans">
      <Header />

      {/* Backend offline banner */}
      {backendOnline === false && (
        <div className="sticky top-0 z-30 bg-armor-yellow/10 border-b border-armor-yellow/30 px-6 py-2.5 flex items-center gap-3">
          <span className="glow-dot glow-dot-red w-1.5 h-1.5 shrink-0" />
          <p className="text-sm text-armor-yellow font-medium">
            Backend server offline — Start{" "}
            <code className="font-mono text-xs bg-armor-yellow/10 px-1.5 py-0.5 rounded">
              node backend/server.js
            </code>{" "}
            and{" "}
            <code className="font-mono text-xs bg-armor-yellow/10 px-1.5 py-0.5 rounded">
              python agent/agent.py
            </code>{" "}
            to enable live functionality.
          </p>
        </div>
      )}

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* ============================================================
            TOP SECTION: Command Console (left 2/3) + Policy Panel (right 1/3)
            ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-5">
            <CommandConsole onCommandExecuted={handleCommandExecuted} />
            <ThreatTicker blockedCount={metrics.active_blocked_ips} />
          </div>
          <div className="flex flex-col gap-5">
            <PolicyPanel policies={policies} />
          </div>
        </div>

        {/* ============================================================
            MIDDLE SECTION: 4 Metric Cards — full-width horizontal row
            ============================================================ */}
        <MetricCards metrics={metrics} />

        {/* ============================================================
            BOTTOM SECTION: Audit Trail Table
            ============================================================ */}
        <AuditTable logs={logs} loading={logsLoading} />
      </main>

      {/* Decorative bottom gradient */}
      <div className="fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-armor-accent/20 to-transparent pointer-events-none" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Threat feed ticker (decorative / informational)
// ---------------------------------------------------------------------------

const THREAT_EVENTS = [
  "🔴 Brute force detected from 185.220.101.47 — blocked automatically",
  "🟡 Port scan activity on subnet 10.0.0.0/24 — logged for review",
  "🔴 SQLi attempt from 203.0.113.99 — firewall rule applied",
  "🟢 Quarantine of web-server-03 confirmed — ArmorClaw executed",
  "🟡 Off-hours access attempt by admin_user — challenge issued",
  "🔴 Lateral movement detected from 10.10.5.200 — session terminated",
  "🟢 Threat intel lookup on malicious-payload.ru — flagged HIGH risk",
  "🟡 Policy POL-001 triggered — privilege escalation denied",
];

function ThreatTicker({ blockedCount }) {
  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => {
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % THREAT_EVENTS.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-armor-border/40 bg-armor-surface/60 overflow-hidden">
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="glow-dot glow-dot-red" />
        <span className="text-xs font-bold text-armor-red uppercase tracking-widest whitespace-nowrap">
          Live Feed
        </span>
      </div>
      <div className="w-px h-4 bg-armor-border/60 shrink-0" />
      <p
        key={idx}
        className="text-xs text-armor-muted font-mono truncate animate-fade-in"
      >
        {THREAT_EVENTS[idx]}
      </p>
      <div className="ml-auto shrink-0 flex items-center gap-1.5 text-xs text-armor-muted whitespace-nowrap">
        <span className="text-armor-red font-semibold">{blockedCount}</span> IPs blocked
      </div>
    </div>
  );
}
