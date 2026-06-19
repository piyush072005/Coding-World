/**
 * ArmorIQ — Command Route + ArmorClaw Policy Engine
 * Handles: POST /api/command, GET /api/audit, GET /api/policies,
 *          GET /api/metrics, GET /api/blocked-ips
 */

const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const database = require("../db");

const router = express.Router();

const AGENT_URL = "http://127.0.0.1:5001/parse";
const AGENT_TIMEOUT_MS = 8000;

// ---------------------------------------------------------------------------
// ArmorClaw constants
// ---------------------------------------------------------------------------

/** IPs that may never be modified without a signed change request */
const RESERVED_IPS = new Set([
  "10.0.0.1",
  "192.168.0.1",
  "192.168.1.1",
  "172.16.0.1",
  "172.31.0.1",
]);

/** Actions that require admin privileges */
const ADMIN_ONLY_ACTIONS = new Set([
  "REVOKE_ACCESS",
  "GRANT_ACCESS",
  "ENABLE_RULE",
  "DISABLE_RULE",
  "OPEN_PORT",
]);

/** Off-hours window (UTC): 23:00 – 05:00 */
const OFF_HOURS_START = 23;
const OFF_HOURS_END = 5;

/** Actions blocked during off-hours (they become log-only violations) */
const OFF_HOURS_RESTRICTED = new Set([
  "BLOCK_IP",
  "ALLOW_IP",
  "QUARANTINE_HOST",
  "CLOSE_PORT",
  "ENABLE_RULE",
  "DISABLE_RULE",
]);

/** Maximum subnet prefix allowed for scan operations (wider = violation) */
const MAX_SCAN_PREFIX = 16;

// ---------------------------------------------------------------------------
// SHA-256 helper
// ---------------------------------------------------------------------------

function sha256(obj) {
  return crypto.createHash("sha256").update(JSON.stringify(obj)).digest("hex");
}

// ---------------------------------------------------------------------------
// ArmorClaw Pre-flight Engine
// ---------------------------------------------------------------------------

/**
 * Runs all 5 policy checks against a parsed command.
 * Returns { passed: boolean, violation: string|null, policy_code: string|null }
 */
function armorClawPreflight(parsedCommand, requestMeta = {}) {
  const { action, target } = parsedCommand;
  const isAdmin = requestMeta.isAdmin === true; // in production: JWT/RBAC

  // --- POL-004: Reserved IP Protection ---
  if (
    ["BLOCK_IP", "ALLOW_IP", "QUARANTINE_HOST"].includes(action) &&
    RESERVED_IPS.has(target)
  ) {
    return {
      passed: false,
      violation: `Target IP ${target} is a reserved gateway/management address. Modification requires a signed Change Request ticket.`,
      policy_code: "POL-004",
      enforcement: "POL-004: Reserved IP Protection — gateway address",
    };
  }

  // --- POL-005: Known Malicious IP Allowlist Guard ---
  if (action === "ALLOW_IP") {
    const blockedIPs = database.getAllBlockedIPs();
    const knownBad = blockedIPs.find((b) => b.ip === target);
    if (knownBad) {
      return {
        passed: false,
        violation: `IP ${target} is in the threat intelligence blocklist (${knownBad.reason}). It cannot be added to the allowlist.`,
        policy_code: "POL-005",
        enforcement: "POL-005: Known Malicious IP Allowlist Guard",
      };
    }
  }

  // --- POL-001: Admin Restrictions ---
  if (ADMIN_ONLY_ACTIONS.has(action) && !isAdmin) {
    return {
      passed: false,
      violation: `Action '${action}' requires elevated admin privileges. Current session has standard user permissions.`,
      policy_code: "POL-001",
      enforcement: "POL-001: Enforce Admin Restrictions — privilege check failed",
    };
  }

  // --- POL-002: Restrict Execution Hours ---
  const utcHour = new Date().getUTCHours();
  const isOffHours =
    utcHour >= OFF_HOURS_START || utcHour < OFF_HOURS_END;
  if (isOffHours && OFF_HOURS_RESTRICTED.has(action)) {
    return {
      passed: false,
      violation: `Action '${action}' is restricted during off-hours (23:00–05:00 UTC). Current UTC hour: ${utcHour}:00. Schedule for business hours or raise an emergency change request.`,
      policy_code: "POL-002",
      enforcement: "POL-002: Restrict Execution Hours — off-hours window active",
    };
  }

  // --- POL-003: Subnet Scope Guard ---
  if (action === "SCAN_SUBNET" && target) {
    const cidrParts = target.split("/");
    if (cidrParts.length === 2) {
      const prefix = parseInt(cidrParts[1], 10);
      if (!isNaN(prefix) && prefix < MAX_SCAN_PREFIX) {
        return {
          passed: false,
          violation: `Subnet /${prefix} exceeds the maximum allowed scan scope (/${MAX_SCAN_PREFIX}). Narrow the target range to proceed.`,
          policy_code: "POL-003",
          enforcement: `POL-003: Subnet Scope Guard — /${prefix} exceeds /${MAX_SCAN_PREFIX} limit`,
        };
      }
    }
  }

  // --- All checks passed ---
  return {
    passed: true,
    violation: null,
    policy_code: null,
    enforcement: "ArmorClaw v2.1 — Zero-Trust Gate",
  };
}

// ---------------------------------------------------------------------------
// Determine enforcement label for successful commands
// ---------------------------------------------------------------------------

function resolveEnforcement(action) {
  const map = {
    BLOCK_IP: "ArmorClaw v2.1 — Zero-Trust Gate",
    ALLOW_IP: "ArmorClaw v2.1 — Zero-Trust Gate",
    SCAN_SUBNET: "ArmorClaw v2.1 — Network Scope Check",
    REVOKE_ACCESS: "ArmorClaw v2.1 — Identity & Access Management",
    GRANT_ACCESS: "ArmorClaw v2.1 — Identity & Access Management",
    ENABLE_RULE: "ArmorClaw v2.1 — Firewall Rule Enforcement",
    DISABLE_RULE: "ArmorClaw v2.1 — Firewall Rule Enforcement",
    QUARANTINE_HOST: "ArmorClaw v2.1 — Host Isolation Engine",
    THREAT_INTEL_LOOKUP: "ArmorClaw v2.1 — Threat Intel Feed",
    CLOSE_PORT: "ArmorClaw v2.1 — Port Management",
    OPEN_PORT: "ArmorClaw v2.1 — Port Management",
    SET_ALERT: "ArmorClaw v2.1 — Monitoring & Alerting",
  };
  return map[action] || "ArmorClaw v2.1 — General Enforcement";
}

// ---------------------------------------------------------------------------
// POST /api/command
// ---------------------------------------------------------------------------

router.post("/command", async (req, res) => {
  const { input, isAdmin = false } = req.body;

  if (!input || typeof input !== "string" || input.trim().length < 3) {
    return res.status(400).json({
      error: "Invalid input: must be a non-empty string of at least 3 characters.",
    });
  }

  const trimmedInput = input.trim();
  let parsedCommand = null;
  let agentError = null;

  // --- Step 1: Call Python NLP Agent ---
  try {
    const agentRes = await axios.post(
      AGENT_URL,
      { input: trimmedInput },
      { timeout: AGENT_TIMEOUT_MS }
    );
    parsedCommand = agentRes.data;
  } catch (err) {
    agentError = err.message;

    // Fall back to an UNKNOWN command so we can still log the attempt
    parsedCommand = {
      action: "UNKNOWN",
      target: null,
      confidence: 0.0,
      description: `NLP Agent unreachable: ${agentError}`,
      risk_level: "UNKNOWN",
      parsed_ok: false,
    };
  }

  // --- Step 2: Parse error check ---
  if (!parsedCommand.parsed_ok || parsedCommand.action === "UNKNOWN") {
    const logId = uuidv4();
    const ts = new Date().toISOString();
    const logObj = {
      id: logId,
      timestamp: ts,
      original_input: trimmedInput,
      parsed_command: parsedCommand,
      status: "PARSE_ERROR",
      enforcement: "ArmorClaw v2.1 — Input Validation",
    };
    const hash = sha256(logObj);

    database.insertLog({
      ...logObj,
      parsed_command: JSON.stringify(parsedCommand),
      sha256_hash: hash,
      user_agent: req.headers["user-agent"] || "Web Console",
      ip_address: req.ip || "127.0.0.1",
    });

    return res.status(200).json({
      status: "PARSE_ERROR",
      message: parsedCommand.description || "Command could not be parsed.",
      parsed_command: parsedCommand,
      audit_id: logId,
      sha256_hash: hash,
      timestamp: ts,
    });
  }

  // --- Step 3: ArmorClaw Pre-flight ---
  const preflight = armorClawPreflight(parsedCommand, { isAdmin });

  const finalStatus = preflight.passed ? "SUCCESS" : "POLICY_VIOLATION";
  const enforcement = preflight.passed
    ? resolveEnforcement(parsedCommand.action)
    : preflight.enforcement;

  // --- Step 4: Side-effects on success ---
  if (preflight.passed) {
    if (parsedCommand.action === "BLOCK_IP" && parsedCommand.target) {
      database.insertBlockedIP({
        ip: parsedCommand.target,
        reason: `Blocked via AI Console: "${trimmedInput}"`,
        blocked_at: new Date().toISOString(),
        blocked_by: "Web Console",
      });
    }
    if (parsedCommand.action === "ALLOW_IP" && parsedCommand.target) {
      database.removeBlockedIP(parsedCommand.target);
    }
  }

  // --- Step 5: Build & store immutable audit log ---
  const logId = uuidv4();
  const ts = new Date().toISOString();
  const logObj = {
    id: logId,
    timestamp: ts,
    original_input: trimmedInput,
    parsed_command: parsedCommand,
    status: finalStatus,
    enforcement,
  };
  const hash = sha256(logObj);

  database.insertLog({
    ...logObj,
    sha256_hash: hash,
    user_agent: req.headers["user-agent"] || "Web Console",
    ip_address: req.ip || "127.0.0.1",
  });

  // --- Step 6: Respond ---
  return res.status(200).json({
    status: finalStatus,
    message: preflight.passed
      ? `Command executed successfully via ${enforcement}.`
      : preflight.violation,
    parsed_command: parsedCommand,
    enforcement,
    policy_violated: preflight.policy_code,
    audit_id: logId,
    sha256_hash: hash,
    timestamp: ts,
  });
});

// ---------------------------------------------------------------------------
// GET /api/audit
// ---------------------------------------------------------------------------

router.get("/audit", (req, res) => {
  const { q } = req.query;
  const logs = q ? database.searchLogs(q) : database.getAllLogs();
  res.json({ logs, count: logs.length });
});

// ---------------------------------------------------------------------------
// GET /api/policies
// ---------------------------------------------------------------------------

router.get("/policies", (req, res) => {
  res.json({ policies: database.getAllPolicies() });
});

// ---------------------------------------------------------------------------
// GET /api/metrics
// ---------------------------------------------------------------------------

router.get("/metrics", (req, res) => {
  res.json(database.getMetrics());
});

// ---------------------------------------------------------------------------
// GET /api/blocked-ips
// ---------------------------------------------------------------------------

router.get("/blocked-ips", (req, res) => {
  res.json({ blocked_ips: database.getAllBlockedIPs() });
});

module.exports = router;
