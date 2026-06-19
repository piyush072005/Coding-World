import React from "react";
import { ShieldCheck, ShieldAlert, Clock, Network, Lock, CheckCircle } from "lucide-react";

const POLICY_ICONS = {
  "POL-001": <Lock className="w-4 h-4" />,
  "POL-002": <Clock className="w-4 h-4" />,
  "POL-003": <Network className="w-4 h-4" />,
  "POL-004": <ShieldAlert className="w-4 h-4" />,
  "POL-005": <ShieldCheck className="w-4 h-4" />,
};

const POLICY_COLORS = {
  "POL-001": { border: "border-armor-accent/25", dot: "bg-armor-accent", icon: "text-armor-accent", bg: "bg-armor-accent/5" },
  "POL-002": { border: "border-armor-yellow/25", dot: "bg-armor-yellow", icon: "text-armor-yellow", bg: "bg-armor-yellow/5" },
  "POL-003": { border: "border-armor-purple/25", dot: "bg-armor-purple", icon: "text-armor-purple", bg: "bg-armor-purple/5" },
  "POL-004": { border: "border-armor-red/25",    dot: "bg-armor-red",    icon: "text-armor-red",    bg: "bg-armor-red/5"    },
  "POL-005": { border: "border-armor-green/25",  dot: "bg-armor-green",  icon: "text-armor-green",  bg: "bg-armor-green/5"  },
};

function PolicyItem({ policy }) {
  const [expanded, setExpanded] = React.useState(false);
  const c = POLICY_COLORS[policy.code] || POLICY_COLORS["POL-001"];

  return (
    <button
      onClick={() => setExpanded((v) => !v)}
      className={`w-full text-left rounded-xl border ${c.border} ${c.bg} p-3 transition-all duration-200 hover:brightness-110 focus:outline-none focus:ring-1 focus:ring-armor-accent/30`}
      aria-expanded={expanded}
      id={`policy-item-${policy.code.toLowerCase()}`}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-armor-surface border ${c.border} ${c.icon} shrink-0`}>
          {POLICY_ICONS[policy.code] || <ShieldCheck className="w-4 h-4" />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono font-bold ${c.icon}`}>{policy.code}</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${c.dot}`}
              style={{ boxShadow: `0 0 6px currentColor` }}
            />
            {policy.enabled && (
              <span className="text-xs text-armor-green font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Active
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-armor-text mt-0.5 leading-tight truncate pr-2">
            {policy.name}
          </p>
        </div>

        {/* Chevron */}
        <svg
          className={`w-3.5 h-3.5 text-armor-muted shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded description */}
      {expanded && (
        <p className="mt-2.5 text-xs text-armor-muted leading-relaxed pl-11 animate-fade-in">
          {policy.description}
        </p>
      )}
    </button>
  );
}

export default function PolicyPanel({ policies }) {
  return (
    <div className="armor-card armor-card-glow p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-armor-green" />
          <h2 className="text-sm font-bold text-armor-text">Active Security Policies</h2>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-armor-green/10 border border-armor-green/20">
          <span className="glow-dot glow-dot-green w-1.5 h-1.5" />
          <span className="text-xs text-armor-green font-medium">{policies.length} Active</span>
        </div>
      </div>

      {/* Policy list */}
      <div className="flex flex-col gap-2">
        {policies.length === 0 ? (
          <div className="text-center py-8 text-armor-muted text-sm">
            No policies configured
          </div>
        ) : (
          policies.map((policy) => (
            <PolicyItem key={policy.code} policy={policy} />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-armor-border/40 flex items-center justify-between">
        <span className="text-xs text-armor-muted">Enforced by ArmorClaw v2.1</span>
        <span className="text-xs text-armor-accent font-mono">Zero-Trust</span>
      </div>
    </div>
  );
}
