import React from "react";
import { Shield, Wifi, Activity, Lock } from "lucide-react";

export default function Header() {
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });

  return (
    <header className="relative z-20 border-b border-armor-border/60 bg-armor-surface/90 backdrop-blur-xl">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-armor-accent/60 to-transparent" />

      <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        {/* ---- Brand ---- */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-armor-accent/20 to-armor-purple/20 border border-armor-accent/20 animate-glow">
            <Shield className="w-5 h-5 text-armor-accent" />
            <div className="absolute inset-0 rounded-xl bg-armor-accent/5 animate-pulse-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">
                Armor
                <span className="text-armor-accent">IQ</span>
              </span>
              <span className="text-xs font-mono text-armor-muted bg-armor-subtle px-2 py-0.5 rounded border border-armor-border/60">
                v0.1
              </span>
            </div>
            <p className="text-xs text-armor-muted leading-none mt-0.5">
              AI-Powered Security Automation
            </p>
          </div>
        </div>

        {/* ---- Center nav indicators ---- */}
        <div className="hidden md:flex items-center gap-6">
          <NavIndicator icon={<Activity className="w-3.5 h-3.5" />} label="Live Monitoring" color="green" />
          <NavIndicator icon={<Wifi className="w-3.5 h-3.5" />} label="Network Active" color="cyan" />
          <NavIndicator icon={<Lock className="w-3.5 h-3.5" />} label="Zero-Trust Enforced" color="purple" />
        </div>

        {/* ---- Right side ---- */}
        <div className="flex items-center gap-4">
          {/* Team badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-armor-border/60 bg-armor-card/50">
            <span className="text-xs text-armor-muted">Team</span>
            <span className="text-xs font-semibold text-armor-text">TechyBotsXO</span>
          </div>

          {/* UTC Clock */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-armor-border/60 bg-armor-card/50">
            <span className="text-xs text-armor-muted font-mono">UTC</span>
            <span className="text-xs font-mono font-semibold text-armor-accent tabular-nums">
              {timeStr}
            </span>
          </div>

          {/* System status badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-armor-green/10 border border-armor-green/30">
            <span className="glow-dot glow-dot-green" />
            <span className="text-xs font-semibold text-armor-green whitespace-nowrap">
              System Status: Secure
            </span>
            <span className="hidden sm:inline text-xs text-armor-green/70">(Zero-Trust Enabled)</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function NavIndicator({ icon, label, color }) {
  const colors = {
    green: "text-armor-green",
    cyan: "text-armor-accent",
    purple: "text-armor-purple",
  };
  return (
    <div className={`flex items-center gap-1.5 text-xs ${colors[color]} opacity-70`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}
