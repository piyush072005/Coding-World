/**
 * ArmorIQ — Pure-JS JSON File Database
 * No native compilation required. Stores data in armoriq-data.json.
 * Provides the same API surface as the original SQLite-based db.js.
 */

const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "armoriq-data.json");

// ---------------------------------------------------------------------------
// In-memory store — loaded from disk on startup
// ---------------------------------------------------------------------------

let store = {
  audit_logs: [],
  policies: [],
  blocked_ips: [],
  settings: {},
};

function load() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, "utf8");
      store = JSON.parse(raw);
      // Ensure all collections exist (migration guard)
      store.audit_logs  = store.audit_logs  || [];
      store.policies    = store.policies    || [];
      store.blocked_ips = store.blocked_ips || [];
      store.settings    = store.settings    || {};
    }
  } catch (e) {
    console.warn("[DB] Could not load data file, starting fresh:", e.message);
  }
}

function save() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2), "utf8");
  } catch (e) {
    console.error("[DB] Failed to persist data:", e.message);
  }
}

// Boot — load from disk
load();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

module.exports = {
  // ---- Audit Logs ----

  insertLog(record) {
    // record.parsed_command may be a JSON string already — keep consistent as object
    const entry = { ...record };
    if (typeof entry.parsed_command === "string") {
      try { entry.parsed_command = JSON.parse(entry.parsed_command); } catch (_) {}
    }
    store.audit_logs.unshift(entry); // newest first
    save();
  },

  getAllLogs() {
    return store.audit_logs.slice(0, 200);
  },

  searchLogs(query) {
    const q = query.toLowerCase();
    return store.audit_logs
      .filter(
        (l) =>
          (l.original_input && l.original_input.toLowerCase().includes(q)) ||
          (l.status         && l.status.toLowerCase().includes(q))         ||
          (l.sha256_hash    && l.sha256_hash.toLowerCase().includes(q))    ||
          (l.enforcement    && l.enforcement.toLowerCase().includes(q))
      )
      .slice(0, 100);
  },

  // ---- Policies ----

  getAllPolicies() {
    return store.policies;
  },

  insertPolicy(policy) {
    const existing = store.policies.findIndex((p) => p.code === policy.code);
    if (existing === -1) {
      store.policies.push(policy);
      save();
    }
  },

  // ---- Blocked IPs ----

  getAllBlockedIPs() {
    return store.blocked_ips;
  },

  insertBlockedIP(record) {
    const idx = store.blocked_ips.findIndex((b) => b.ip === record.ip);
    if (idx === -1) {
      store.blocked_ips.unshift(record);
    } else {
      store.blocked_ips[idx] = record; // upsert
    }
    save();
  },

  removeBlockedIP(ip) {
    store.blocked_ips = store.blocked_ips.filter((b) => b.ip !== ip);
    save();
  },

  // ---- Metrics ----

  getMetrics() {
    const logs = store.audit_logs;
    return {
      total_actions:       logs.length,
      successful_actions:  logs.filter((l) => l.status === "SUCCESS").length,
      violations_prevented: logs.filter((l) => l.status === "POLICY_VIOLATION").length,
      parse_errors:        logs.filter((l) => l.status === "PARSE_ERROR").length,
      active_blocked_ips:  store.blocked_ips.length,
      audit_time_saved_pct: 80,
    };
  },

  // ---- Settings ----

  getSetting(key) {
    return store.settings[key] ?? null;
  },

  setSetting(key, value) {
    store.settings[key] = String(value);
    save();
  },
};
