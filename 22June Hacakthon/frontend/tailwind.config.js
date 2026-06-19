/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      colors: {
        armor: {
          bg: "#080c14",
          surface: "#0d1420",
          card: "#111827",
          border: "#1e2d40",
          accent: "#00d4ff",
          "accent-dim": "#0099bb",
          green: "#00ff88",
          "green-dim": "#00cc6a",
          red: "#ff3366",
          "red-dim": "#cc2952",
          yellow: "#ffaa00",
          "yellow-dim": "#cc8800",
          purple: "#a855f7",
          "purple-dim": "#8b3dcf",
          text: "#e2e8f0",
          muted: "#64748b",
          subtle: "#1e293b",
        },
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
        "hero-gradient":
          "radial-gradient(ellipse at top left, rgba(0,212,255,0.08) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(168,85,247,0.06) 0%, transparent 50%)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scan-line": "scanLine 2s linear infinite",
        glow: "glow 2s ease-in-out infinite alternate",
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "count-up": "countUp 0.6s ease-out",
      },
      keyframes: {
        scanLine: {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "50%": { opacity: "1" },
          "100%": { transform: "translateY(100%)", opacity: "0" },
        },
        glow: {
          from: { boxShadow: "0 0 5px rgba(0,212,255,0.3), 0 0 10px rgba(0,212,255,0.1)" },
          to: { boxShadow: "0 0 20px rgba(0,212,255,0.6), 0 0 40px rgba(0,212,255,0.2)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        "armor-card": "0 0 0 1px rgba(0,212,255,0.1), 0 4px 24px rgba(0,0,0,0.4)",
        "armor-accent": "0 0 20px rgba(0,212,255,0.3), 0 0 60px rgba(0,212,255,0.1)",
        "armor-success": "0 0 20px rgba(0,255,136,0.2)",
        "armor-error": "0 0 20px rgba(255,51,102,0.2)",
      },
    },
  },
  plugins: [],
};
