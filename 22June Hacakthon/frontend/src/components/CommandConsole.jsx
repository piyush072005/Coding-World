import React from "react";
import axios from "axios";
import {
  Terminal,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Shield,
  ChevronRight,
  Copy,
  RotateCcw,
  Lightbulb,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Example commands cycling in the placeholder
// ---------------------------------------------------------------------------
const EXAMPLE_COMMANDS = [
  "Block suspicious IP 192.168.1.50",
  "Scan subnet 10.0.0.0/24",
  "Quarantine host web-server-03",
  "Close port 22 on the perimeter firewall",
  "Investigate domain malicious-payload.ru",
  "Revoke access john.doe@company.com",
  "Block IP 45.33.32.156 — brute force source",
];

// ---------------------------------------------------------------------------
// Stage definitions for the animated pipeline display
// ---------------------------------------------------------------------------
const STAGES = [
  { id: "parse",    label: "NLP Agent Parsing",        icon: Terminal },
  { id: "scan",     label: "ArmorClaw Pre-flight Scan", icon: Shield },
  { id: "policy",   label: "Zero-Trust Policy Check",  icon: CheckCircle2 },
  { id: "execute",  label: "Action Execution",          icon: ChevronRight },
];

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------
const STATUS_CONFIG = {
  SUCCESS: {
    icon: <CheckCircle2 className="w-5 h-5" />,
    className: "status-success",
    label: "Validated & Executed",
    cardBorder: "border-armor-green/30",
    cardBg: "bg-armor-green/5",
  },
  POLICY_VIOLATION: {
    icon: <XCircle className="w-5 h-5" />,
    className: "status-violation",
    label: "Policy Violation",
    cardBorder: "border-armor-red/30",
    cardBg: "bg-armor-red/5",
  },
  PARSE_ERROR: {
    icon: <AlertTriangle className="w-5 h-5" />,
    className: "status-error",
    label: "Parse Error",
    cardBorder: "border-armor-yellow/30",
    cardBg: "bg-armor-yellow/5",
  },
};

// ---------------------------------------------------------------------------
// CopyButton helper
// ---------------------------------------------------------------------------
function CopyButton({ text }) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      title="Copy to clipboard"
      className="p-1 rounded hover:bg-armor-border/40 text-armor-muted hover:text-armor-text transition-colors"
    >
      {copied ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-armor-green" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// StagePipeline component
// ---------------------------------------------------------------------------
function StagePipeline({ activeStageIndex, finalStatus }) {
  return (
    <div className="flex flex-col gap-2 my-4">
      {STAGES.map((stage, idx) => {
        const Icon = stage.icon;
        let state = "pending";
        if (idx < activeStageIndex) state = "done";
        else if (idx === activeStageIndex) state = "active";

        // If the active stage is the last and we have a result
        if (finalStatus && idx === STAGES.length - 1 && activeStageIndex >= STAGES.length - 1) {
          state = finalStatus === "SUCCESS" ? "done" : "failed";
        }

        const stateStyles = {
          pending: "border-armor-border/40 text-armor-muted",
          active:  "border-armor-accent/60 text-armor-accent bg-armor-accent/5",
          done:    "border-armor-green/40 text-armor-green bg-armor-green/5",
          failed:  "border-armor-red/40 text-armor-red bg-armor-red/5",
        };

        return (
          <div
            key={stage.id}
            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-300 step-appear ${stateStyles[state]}`}
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            {/* Icon */}
            <div className="shrink-0 w-6 flex items-center justify-center">
              {state === "active" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : state === "done" ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : state === "failed" ? (
                <XCircle className="w-4 h-4" />
              ) : (
                <Icon className="w-4 h-4 opacity-40" />
              )}
            </div>
            <span className="text-xs font-medium">{stage.label}</span>
            {state === "active" && (
              <span className="ml-auto text-xs font-mono opacity-70 animate-pulse">
                scanning...
              </span>
            )}
            {state === "done" && (
              <span className="ml-auto text-xs font-mono opacity-70">passed</span>
            )}
            {state === "failed" && (
              <span className="ml-auto text-xs font-mono opacity-70">blocked</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main CommandConsole
// ---------------------------------------------------------------------------
export default function CommandConsole({ onCommandExecuted }) {
  const [input, setInput] = React.useState("");
  const [placeholderIdx, setPlaceholderIdx] = React.useState(0);
  const [phase, setPhase] = React.useState("idle"); // idle | loading | done
  const [stageIndex, setStageIndex] = React.useState(-1);
  const [result, setResult] = React.useState(null);
  const inputRef = React.useRef(null);

  // Cycle placeholder
  React.useEffect(() => {
    const t = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % EXAMPLE_COMMANDS.length);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  // Animated stage progression
  async function runStages() {
    const delays = [600, 700, 600]; // ms per stage
    for (let i = 0; i < STAGES.length - 1; i++) {
      setStageIndex(i);
      await new Promise((r) => setTimeout(r, delays[i]));
    }
    setStageIndex(STAGES.length - 1); // execution stage
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || phase === "loading") return;

    setPhase("loading");
    setResult(null);
    setStageIndex(0);

    // Run animated stages in parallel with API call
    const stagePromise = runStages();

    try {
      const res = await axios.post("/api/command", { input: trimmed });
      await stagePromise;
      // Small delay so user sees the last stage briefly
      await new Promise((r) => setTimeout(r, 400));
      setResult(res.data);
      onCommandExecuted?.();
    } catch (err) {
      await stagePromise;
      await new Promise((r) => setTimeout(r, 200));
      setResult({
        status: "PARSE_ERROR",
        message: err.response?.data?.error || "Unable to reach backend server.",
        parsed_command: null,
        sha256_hash: null,
      });
    }

    setPhase("done");
  }

  function handleReset() {
    setInput("");
    setPhase("idle");
    setResult(null);
    setStageIndex(-1);
    inputRef.current?.focus();
  }

  function useExample(cmd) {
    setInput(cmd);
    inputRef.current?.focus();
  }

  const statusCfg = result ? STATUS_CONFIG[result.status] || STATUS_CONFIG.PARSE_ERROR : null;

  return (
    <div className="armor-card armor-card-glow p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-armor-accent/10 border border-armor-accent/20">
            <Terminal className="w-4 h-4 text-armor-accent" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-armor-text">AI Agent Command Console</h1>
            <p className="text-xs text-armor-muted">
              Natural language → Zero-trust enforced actions
            </p>
          </div>
        </div>
        {phase === "done" && (
          <button
            id="reset-command-btn"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-armor-muted hover:text-armor-text transition-colors px-3 py-1.5 rounded-lg hover:bg-armor-subtle border border-transparent hover:border-armor-border/40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New Command
          </button>
        )}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            id="command-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={EXAMPLE_COMMANDS[placeholderIdx]}
            disabled={phase === "loading"}
            className="armor-input px-4 py-3 text-sm pr-12 font-mono disabled:opacity-60"
            maxLength={400}
            autoComplete="off"
            spellCheck={false}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-armor-muted font-mono">
            {input.length}/400
          </div>
        </div>
        <button
          id="submit-command-btn"
          type="submit"
          disabled={!input.trim() || phase === "loading"}
          className="armor-btn armor-btn-primary px-4 py-3 shrink-0"
        >
          {phase === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Execute</span>
            </>
          )}
        </button>
      </form>

      {/* Example commands */}
      {phase === "idle" && (
        <div className="flex flex-wrap gap-1.5">
          <span className="flex items-center gap-1 text-xs text-armor-muted">
            <Lightbulb className="w-3 h-3" /> Try:
          </span>
          {EXAMPLE_COMMANDS.slice(0, 4).map((cmd, i) => (
            <button
              key={i}
              onClick={() => useExample(cmd)}
              className="text-xs px-2.5 py-1 rounded-full border border-armor-border/60 text-armor-muted hover:text-armor-accent hover:border-armor-accent/30 transition-all duration-150 font-mono truncate max-w-48"
            >
              {cmd}
            </button>
          ))}
        </div>
      )}

      {/* Pipeline stages (shown during and after loading) */}
      {(phase === "loading" || phase === "done") && (
        <div className="scan-container rounded-xl border border-armor-border/40 bg-armor-surface/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-3.5 h-3.5 text-armor-accent" />
            <span className="text-xs font-bold text-armor-accent tracking-wider uppercase">
              ArmorClaw Pre-flight Scanning
            </span>
          </div>
          <StagePipeline
            activeStageIndex={stageIndex}
            finalStatus={result?.status}
          />
        </div>
      )}

      {/* Result card */}
      {phase === "done" && result && statusCfg && (
        <div
          className={`rounded-xl border ${statusCfg.cardBorder} ${statusCfg.cardBg} p-4 animate-slide-up`}
        >
          {/* Status row */}
          <div className="flex items-center justify-between mb-3">
            <div className={`status-badge ${statusCfg.className}`}>
              {statusCfg.icon}
              {statusCfg.label}
            </div>
            {result.sha256_hash && (
              <div className="flex items-center gap-1.5">
                <span className="hash-text truncate max-w-32" title={result.sha256_hash}>
                  #{result.sha256_hash.slice(0, 16)}…
                </span>
                <CopyButton text={result.sha256_hash} />
              </div>
            )}
          </div>

          {/* Message */}
          <p className="text-sm text-armor-text leading-relaxed mb-3">
            {result.message}
          </p>

          {/* Parsed command JSON */}
          {result.parsed_command && result.parsed_command.action !== "UNKNOWN" && (
            <div className="rounded-lg bg-armor-surface border border-armor-border/40 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-armor-border/40">
                <span className="text-xs font-mono text-armor-muted">
                  Parsed JSON Command
                </span>
                <CopyButton text={JSON.stringify(result.parsed_command, null, 2)} />
              </div>
              <pre className="p-3 text-xs font-mono text-armor-accent overflow-x-auto leading-relaxed">
                {JSON.stringify(result.parsed_command, null, 2)}
              </pre>
            </div>
          )}

          {/* Enforcement footer */}
          {result.enforcement && (
            <div className="mt-3 flex items-center gap-2 text-xs text-armor-muted">
              <Shield className="w-3 h-3 text-armor-accent shrink-0" />
              <span>
                Enforcement: <span className="text-armor-accent">{result.enforcement}</span>
              </span>
            </div>
          )}

          {/* Audit ID */}
          {result.audit_id && (
            <div className="mt-1.5 flex items-center gap-2 text-xs text-armor-muted">
              <CheckCircle2 className="w-3 h-3 text-armor-muted shrink-0" />
              <span>
                Audit ID: <span className="font-mono">{result.audit_id}</span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
