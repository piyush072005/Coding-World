import React from "react";
import {
  Clock,
  BarChart3,
  Shield,
  AlertTriangle,
  TrendingUp,
  Zap,
} from "lucide-react";

function AnimatedNumber({ value, suffix = "" }) {
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    let start = 0;
    const end = typeof value === "number" ? value : parseInt(value, 10);
    if (isNaN(end)) { setDisplay(value); return; }
    const duration = 800;
    const stepTime = 16;
    const steps = Math.floor(duration / stepTime);
    const increment = end / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setDisplay(end);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}

export default function MetricCards({ metrics }) {
  const cards = [
    {
      id: "audit-time",
      label: "Manual Audit Time Saved",
      value: metrics.audit_time_saved_pct ?? 80,
      suffix: "%",
      icon: <Clock className="w-5 h-5" />,
      color: "cyan",
      trend: "+12% vs last month",
      trendUp: true,
      description: "Automated audit generation vs manual review",
    },
    {
      id: "blocked-ips",
      label: "Active Blocked IPs",
      value: metrics.active_blocked_ips ?? 0,
      suffix: "",
      icon: <Shield className="w-5 h-5" />,
      color: "red",
      trend: "Real-time enforcement",
      trendUp: null,
      description: "IPs currently blocked by ArmorClaw",
    },
    {
      id: "total-actions",
      label: "Total Executed Actions",
      value: metrics.total_actions ?? 0,
      suffix: "",
      icon: <Zap className="w-5 h-5" />,
      color: "purple",
      trend: `${metrics.successful_actions ?? 0} successful`,
      trendUp: true,
      description: "All commands processed by the AI engine",
    },
    {
      id: "violations",
      label: "Policy Violations Prevented",
      value: metrics.violations_prevented ?? 0,
      suffix: "",
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "yellow",
      trend: "Zero-trust enforcement",
      trendUp: null,
      description: "Unauthorized actions blocked by ArmorClaw",
    },
  ];

  const colorMap = {
    cyan: {
      icon: "text-armor-accent",
      iconBg: "bg-armor-accent/10 border-armor-accent/20",
      glow: "hover:shadow-armor-accent",
      number: "from-armor-accent to-blue-400",
      bar: "bg-armor-accent",
    },
    red: {
      icon: "text-armor-red",
      iconBg: "bg-armor-red/10 border-armor-red/20",
      glow: "hover:shadow-armor-error",
      number: "from-armor-red to-rose-400",
      bar: "bg-armor-red",
    },
    purple: {
      icon: "text-armor-purple",
      iconBg: "bg-armor-purple/10 border-armor-purple/20",
      glow: "hover:border-armor-purple/30",
      number: "from-armor-purple to-violet-400",
      bar: "bg-armor-purple",
    },
    yellow: {
      icon: "text-armor-yellow",
      iconBg: "bg-armor-yellow/10 border-armor-yellow/20",
      glow: "hover:border-armor-yellow/30",
      number: "from-armor-yellow to-orange-400",
      bar: "bg-armor-yellow",
    },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const c = colorMap[card.color];
        return (
          <div
            key={card.id}
            id={`metric-card-${card.id}`}
            className={`armor-card armor-card-glow p-4 xl:p-5 transition-all duration-300 cursor-default ${c.glow} group`}
          >
            {/* Header row */}
            <div className="flex items-start justify-between mb-3">
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-lg border ${c.iconBg} ${c.icon} transition-transform duration-200 group-hover:scale-110`}
              >
                {card.icon}
              </div>
              <div className="flex items-center gap-1 text-xs text-armor-muted">
                {card.trendUp !== null ? (
                  <>
                    <TrendingUp className={`w-3 h-3 ${card.trendUp ? "text-armor-green" : "text-armor-red"}`} />
                    <span className={card.trendUp ? "text-armor-green" : "text-armor-red"}>
                      {card.trend}
                    </span>
                  </>
                ) : (
                  <span>{card.trend}</span>
                )}
              </div>
            </div>

            {/* Number */}
            <div
              className={`text-4xl font-extrabold mb-1 bg-gradient-to-r ${c.number} bg-clip-text text-transparent`}
            >
              <AnimatedNumber value={card.value} suffix={card.suffix} />
            </div>

            {/* Label */}
            <p className="text-xs font-bold text-armor-text mb-0.5 leading-tight">
              {card.label}
            </p>
            <p className="text-xs text-armor-muted leading-tight">{card.description}</p>

            {/* Bottom accent bar */}
            <div className="mt-3 h-0.5 w-full bg-armor-subtle rounded-full overflow-hidden">
              <div
                className={`h-full ${c.bar} rounded-full transition-all duration-1000`}
                style={{ width: card.suffix === "%" ? `${card.value}%` : "60%" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
