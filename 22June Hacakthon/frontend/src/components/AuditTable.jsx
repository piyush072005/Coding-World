import React from "react";
import {
  Search,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTs(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function StatusBadge({ status }) {
  const cfg = {
    SUCCESS: {
      icon: <CheckCircle2 className="w-3 h-3" />,
      className: "status-success",
      label: "Success",
    },
    POLICY_VIOLATION: {
      icon: <XCircle className="w-3 h-3" />,
      className: "status-violation",
      label: "Violation",
    },
    PARSE_ERROR: {
      icon: <AlertTriangle className="w-3 h-3" />,
      className: "status-error",
      label: "Parse Error",
    },
  };
  const c = cfg[status] || cfg.PARSE_ERROR;
  return (
    <span className={`status-badge ${c.className} text-xs`}>
      {c.icon}
      {c.label}
    </span>
  );
}

function HashCell({ hash }) {
  const [copied, setCopied] = React.useState(false);
  if (!hash) return <span className="text-armor-muted text-xs">—</span>;
  const copy = () => {
    navigator.clipboard.writeText(hash).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="flex items-center gap-1.5 group">
      <span
        className="hash-text truncate max-w-[120px] cursor-help"
        title={hash}
      >
        {hash.slice(0, 12)}…
      </span>
      <button
        onClick={copy}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-armor-border/40 text-armor-muted hover:text-armor-text transition-all"
        title="Copy full hash"
      >
        {copied ? (
          <CheckCircle2 className="w-3 h-3 text-armor-green" />
        ) : (
          <Copy className="w-3 h-3" />
        )}
      </button>
    </div>
  );
}

function ExpandedRow({ log }) {
  return (
    <tr className="animate-fade-in">
      <td colSpan={6} className="px-4 pb-4 pt-0">
        <div className="rounded-xl border border-armor-border/40 bg-armor-surface/80 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Original input */}
          <div>
            <p className="text-xs text-armor-muted font-semibold uppercase tracking-wider mb-1.5">
              Original Input
            </p>
            <p className="text-sm text-armor-text font-mono bg-armor-card rounded-lg px-3 py-2 border border-armor-border/40 leading-relaxed">
              {log.original_input}
            </p>
          </div>

          {/* Parsed command */}
          <div>
            <p className="text-xs text-armor-muted font-semibold uppercase tracking-wider mb-1.5">
              Parsed Command (JSON)
            </p>
            <pre className="text-xs font-mono text-armor-accent bg-armor-card rounded-lg px-3 py-2 border border-armor-border/40 overflow-x-auto leading-relaxed whitespace-pre-wrap">
              {JSON.stringify(
                typeof log.parsed_command === "string"
                  ? JSON.parse(log.parsed_command)
                  : log.parsed_command,
                null,
                2
              )}
            </pre>
          </div>

          {/* Enforcement */}
          <div>
            <p className="text-xs text-armor-muted font-semibold uppercase tracking-wider mb-1.5">
              Enforcement Mechanism
            </p>
            <div className="flex items-center gap-2 text-sm text-armor-text">
              <Shield className="w-4 h-4 text-armor-accent shrink-0" />
              {log.enforcement}
            </div>
          </div>

          {/* Full hash */}
          <div>
            <p className="text-xs text-armor-muted font-semibold uppercase tracking-wider mb-1.5">
              SHA-256 Tamper-proof Hash
            </p>
            <p className="hash-text text-armor-accent break-all leading-relaxed">
              {log.sha256_hash}
            </p>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main AuditTable
// ---------------------------------------------------------------------------

const STATUS_FILTERS = ["ALL", "SUCCESS", "POLICY_VIOLATION", "PARSE_ERROR"];

export default function AuditTable({ logs, loading }) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [expandedId, setExpandedId] = React.useState(null);
  const [sortDir, setSortDir] = React.useState("desc");

  const filtered = React.useMemo(() => {
    let data = [...logs];

    if (statusFilter !== "ALL") {
      data = data.filter((l) => l.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter(
        (l) =>
          l.original_input?.toLowerCase().includes(q) ||
          l.status?.toLowerCase().includes(q) ||
          l.enforcement?.toLowerCase().includes(q) ||
          l.sha256_hash?.toLowerCase().includes(q) ||
          l.id?.toLowerCase().includes(q)
      );
    }

    data.sort((a, b) => {
      const ta = new Date(a.timestamp).getTime();
      const tb = new Date(b.timestamp).getTime();
      return sortDir === "desc" ? tb - ta : ta - tb;
    });

    return data;
  }, [logs, search, statusFilter, sortDir]);

  function downloadCSV() {
    const header = ["ID", "Timestamp", "Input", "Action", "Status", "Enforcement", "Hash"];
    const rows = filtered.map((l) => {
      const cmd = typeof l.parsed_command === "object" ? l.parsed_command : {};
      return [
        l.id,
        l.timestamp,
        `"${l.original_input?.replace(/"/g, '""')}"`,
        cmd.action || "",
        l.status,
        `"${l.enforcement?.replace(/"/g, '""')}"`,
        l.sha256_hash,
      ].join(",");
    });
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `armoriq-audit-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const counts = React.useMemo(() => ({
    SUCCESS: logs.filter((l) => l.status === "SUCCESS").length,
    POLICY_VIOLATION: logs.filter((l) => l.status === "POLICY_VIOLATION").length,
    PARSE_ERROR: logs.filter((l) => l.status === "PARSE_ERROR").length,
  }), [logs]);

  return (
    <div className="armor-card armor-card-glow flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-armor-border/40">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-armor-accent/10 border border-armor-accent/20">
            <Shield className="w-4 h-4 text-armor-accent" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-armor-text">Immutable Audit Trail</h2>
            <p className="text-xs text-armor-muted">
              {filtered.length} records · SHA-256 tamper-proof
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-armor-surface border border-armor-border/60">
            <Filter className="w-3.5 h-3.5 text-armor-muted ml-1" />
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                id={`filter-${f.toLowerCase()}`}
                onClick={() => setStatusFilter(f)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all duration-150 ${
                  statusFilter === f
                    ? "bg-armor-accent/20 text-armor-accent border border-armor-accent/30"
                    : "text-armor-muted hover:text-armor-text"
                }`}
              >
                {f === "ALL" ? `All (${logs.length})` : f === "SUCCESS" ? `✓ ${counts.SUCCESS}` : f === "POLICY_VIOLATION" ? `✕ ${counts.POLICY_VIOLATION}` : `! ${counts.PARSE_ERROR}`}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-armor-muted" />
            <input
              id="audit-search"
              type="text"
              placeholder="Search logs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="armor-input pl-8 pr-3 py-2 text-xs w-44"
            />
          </div>

          {/* Download */}
          <button
            id="download-audit-btn"
            onClick={downloadCSV}
            title="Export to CSV"
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-armor-border/60 text-armor-muted hover:text-armor-text hover:border-armor-accent/30 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto flex-1" style={{ maxHeight: "420px" }}>
        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 rounded-lg shimmer" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-armor-muted gap-2">
            <Shield className="w-8 h-8 opacity-30" />
            <p className="text-sm">No audit records found</p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-xs text-armor-accent hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <table className="armor-table">
            <thead>
              <tr>
                <th className="w-40">
                  <button
                    onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
                    className="flex items-center gap-1 hover:text-armor-text transition-colors"
                    id="sort-timestamp-btn"
                  >
                    Timestamp
                    {sortDir === "desc" ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronUp className="w-3 h-3" />
                    )}
                  </button>
                </th>
                <th>Input</th>
                <th className="w-28">Action</th>
                <th className="w-32">Status</th>
                <th>Enforcement</th>
                <th className="w-36">SHA-256 Hash</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => {
                const cmd =
                  typeof log.parsed_command === "object"
                    ? log.parsed_command
                    : {};
                const isExpanded = expandedId === log.id;

                return (
                  <React.Fragment key={log.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      className="cursor-pointer select-none"
                      id={`audit-row-${log.id}`}
                    >
                      <td className="font-mono text-xs text-armor-muted whitespace-nowrap">
                        {formatTs(log.timestamp)}
                      </td>
                      <td className="max-w-xs">
                        <p className="text-xs text-armor-text truncate font-mono" title={log.original_input}>
                          {log.original_input}
                        </p>
                      </td>
                      <td>
                        <span className="text-xs font-mono font-semibold text-armor-accent">
                          {cmd.action || "—"}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="text-xs text-armor-muted max-w-xs truncate" title={log.enforcement}>
                        {log.enforcement}
                      </td>
                      <td>
                        <HashCell hash={log.sha256_hash} />
                      </td>
                    </tr>
                    {isExpanded && <ExpandedRow log={log} />}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-armor-border/40 px-4 py-2.5 flex items-center justify-between">
        <span className="text-xs text-armor-muted">
          Click any row to expand full audit details
        </span>
        <span className="text-xs font-mono text-armor-accent">
          {filtered.length}/{logs.length} records
        </span>
      </div>
    </div>
  );
}
