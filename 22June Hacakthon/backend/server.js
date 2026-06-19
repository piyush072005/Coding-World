/**
 * ArmorIQ — Node.js Express Orchestrator
 * Serves the API on port 3001.
 * Admin panel: http://localhost:3001/admin
 */

const express = require("express");
const cors = require("cors");
const { seed } = require("./seed");
const { logRequest, adminHTML, getAdminData } = require("./admin");

const app = express();
const PORT = 3001;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Enhanced request logger with duration + colour
app.use((req, res, next) => {
  const start = Date.now();
  const bodySnapshot = req.body ? { ...req.body } : {};

  res.on("finish", () => {
    const ms = Date.now() - start;
    const code = res.statusCode;
    const codeColor = code >= 400 ? "\x1b[31m" : code >= 300 ? "\x1b[33m" : "\x1b[32m";
    const reset = "\x1b[0m";
    const method = req.method.padEnd(6);
    console.log(`\x1b[90m[${new Date().toISOString()}]\x1b[0m \x1b[36m${method}\x1b[0m ${req.path.padEnd(25)} ${codeColor}${code}${reset} \x1b[90m${ms}ms${reset}`);
    logRequest(req.method, req.path, code, ms, bodySnapshot);
  });

  next();
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

const commandRouter = require("./routes/command");
app.use("/api", commandRouter);

// ---- Admin Panel (visual DB + request log viewer) ----
app.get("/admin", (_req, res) => {
  const data = getAdminData();
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(adminHTML(data));
});

// ---- Admin JSON API (for programmatic access) ----
app.get("/admin/json", (_req, res) => {
  res.json(getAdminData());
});

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "ArmorIQ Orchestrator",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("\x1b[31m[ERROR]\x1b[0m", err.message);
  res.status(500).json({ error: "Internal server error", detail: err.message });
});

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

seed(); // Idempotent — only runs once

app.listen(PORT, () => {
  const line = "═".repeat(55);
  console.log(`\n\x1b[36m${line}\x1b[0m`);
  console.log(`  \x1b[1m\x1b[37mArmorIQ Orchestrator\x1b[0m  \x1b[90mv0.1\x1b[0m`);
  console.log(`\x1b[36m${line}\x1b[0m`);
  console.log(`  \x1b[32m●\x1b[0m API Server  →  \x1b[36mhttp://localhost:${PORT}\x1b[0m`);
  console.log(`  \x1b[33m●\x1b[0m Admin Panel →  \x1b[33mhttp://localhost:${PORT}/admin\x1b[0m`);
  console.log(`\x1b[36m${line}\x1b[0m`);
  console.log(`  Endpoints:`);
  console.log(`    \x1b[35mPOST\x1b[0m   /api/command`);
  console.log(`    \x1b[36mGET\x1b[0m    /api/audit`);
  console.log(`    \x1b[36mGET\x1b[0m    /api/policies`);
  console.log(`    \x1b[36mGET\x1b[0m    /api/metrics`);
  console.log(`    \x1b[36mGET\x1b[0m    /api/blocked-ips`);
  console.log(`    \x1b[33mGET\x1b[0m    /admin  \x1b[90m← Visual DB viewer\x1b[0m`);
  console.log(`\x1b[36m${line}\x1b[0m\n`);
});
