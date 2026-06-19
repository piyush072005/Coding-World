/**
 * ArmorIQ — Seed Script
 * Populates the JSON store with realistic mock data on first run.
 */

const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const database = require("./db");

function sha256(obj) {
  return crypto.createHash("sha256").update(JSON.stringify(obj)).digest("hex");
}

function seedPolicies() {
  const policies = [
    {
      code: "POL-001",
      name: "Enforce Admin Restrictions",
      description:
        "Actions classified as HIGH risk (REVOKE_ACCESS, ENABLE_RULE, DISABLE_RULE, GRANT_ACCESS, OPEN_PORT) require elevated admin privileges.",
      enabled: true,
      created_at: new Date().toISOString(),
    },
    {
      code: "POL-002",
      name: "Restrict Execution Hours",
      description:
        "Network-modifying commands (BLOCK_IP, QUARANTINE_HOST, CLOSE_PORT) operate in log-only mode between 23:00–05:00 UTC to prevent off-hours changes.",
      enabled: true,
      created_at: new Date().toISOString(),
    },
    {
      code: "POL-003",
      name: "Block Unauthorized Subnets",
      description:
        "SCAN_SUBNET operations are restricted to subnets with a prefix length of /16 or smaller. Scans on excessively wide ranges are rejected.",
      enabled: true,
      created_at: new Date().toISOString(),
    },
    {
      code: "POL-004",
      name: "Reserved IP Protection",
      description:
        "Modification of gateway and management IPs (10.0.0.1, 192.168.0.1, 172.16.0.1) is strictly prohibited without a signed change request.",
      enabled: true,
      created_at: new Date().toISOString(),
    },
    {
      code: "POL-005",
      name: "Known Malicious IP Allowlist Guard",
      description:
        "IPs listed in the threat intelligence blocklist cannot be added to the system allowlist. ALLOW_IP commands against known-bad IPs are automatically rejected.",
      enabled: true,
      created_at: new Date().toISOString(),
    },
  ];

  policies.forEach((p) => database.insertPolicy(p));
  console.log("  ✔ Policies seeded");
}

function seedBlockedIPs() {
  const ips = [
    { ip: "185.220.101.47", reason: "Known Tor exit node — brute force origin",     blocked_at: new Date(Date.now() - 86400000 * 3).toISOString(), blocked_by: "ArmorClaw" },
    { ip: "45.33.32.156",   reason: "Shodan scanner — repeated reconnaissance",      blocked_at: new Date(Date.now() - 86400000 * 5).toISOString(), blocked_by: "ArmorClaw" },
    { ip: "198.20.70.114",  reason: "Mass vulnerability scanner",                    blocked_at: new Date(Date.now() - 86400000 * 1).toISOString(), blocked_by: "ArmorClaw" },
    { ip: "192.168.1.50",   reason: "Lateral movement detected — internal host",     blocked_at: new Date(Date.now() - 3600000).toISOString(),       blocked_by: "Web Console" },
    { ip: "10.10.5.200",    reason: "Anomalous outbound traffic volume",              blocked_at: new Date(Date.now() - 7200000).toISOString(),       blocked_by: "Web Console" },
    { ip: "203.0.113.99",   reason: "SQLi attack source — CVE-2024-1234",            blocked_at: new Date(Date.now() - 86400000 * 2).toISOString(), blocked_by: "ArmorClaw" },
  ];
  ips.forEach((r) => database.insertBlockedIP(r));
  console.log("  ✔ Blocked IPs seeded");
}

function seedAuditLogs() {
  const mockLogs = [
    {
      input: "Block suspicious IP 185.220.101.47",
      parsed: { action: "BLOCK_IP",           target: "185.220.101.47",      confidence: 0.97, risk_level: "MEDIUM" },
      status: "SUCCESS",          enforcement: "ArmorClaw v2.1 — Zero-Trust Gate",                      hoursAgo: 0.5,
    },
    {
      input: "Scan subnet 10.0.0.0/24",
      parsed: { action: "SCAN_SUBNET",         target: "10.0.0.0/24",         confidence: 0.95, risk_level: "LOW" },
      status: "SUCCESS",          enforcement: "ArmorClaw v2.1 — Network Scope Check",                  hoursAgo: 1,
    },
    {
      input: "Allow IP 45.33.32.156",
      parsed: { action: "ALLOW_IP",            target: "45.33.32.156",        confidence: 0.96, risk_level: "HIGH" },
      status: "POLICY_VIOLATION", enforcement: "POL-005: Known Malicious IP Allowlist Guard",           hoursAgo: 2,
    },
    {
      input: "Revoke access john.doe",
      parsed: { action: "REVOKE_ACCESS",       target: "john.doe",            confidence: 0.94, risk_level: "HIGH" },
      status: "POLICY_VIOLATION", enforcement: "POL-001: Admin Privileges Required",                    hoursAgo: 3,
    },
    {
      input: "Quarantine host web-server-03",
      parsed: { action: "QUARANTINE_HOST",     target: "web-server-03",       confidence: 0.95, risk_level: "MEDIUM" },
      status: "SUCCESS",          enforcement: "ArmorClaw v2.1 — Host Isolation Engine",                hoursAgo: 4,
    },
    {
      input: "Close port 22",
      parsed: { action: "CLOSE_PORT",          target: "22",                  confidence: 0.96, risk_level: "MEDIUM" },
      status: "SUCCESS",          enforcement: "ArmorClaw v2.1 — Port Management",                      hoursAgo: 5,
    },
    {
      input: "Enable firewall rule Block-RDP-Inbound",
      parsed: { action: "ENABLE_RULE",         target: "Block-RDP-Inbound",   confidence: 0.92, risk_level: "HIGH" },
      status: "POLICY_VIOLATION", enforcement: "POL-001: Admin Privileges Required",                    hoursAgo: 6,
    },
    {
      input: "Scan subnet 0.0.0.0/8",
      parsed: { action: "SCAN_SUBNET",         target: "0.0.0.0/8",           confidence: 0.95, risk_level: "LOW" },
      status: "POLICY_VIOLATION", enforcement: "POL-003: Subnet Scope Guard — /8 exceeds /16 limit",    hoursAgo: 7,
    },
    {
      input: "Block suspicious IP 203.0.113.99",
      parsed: { action: "BLOCK_IP",            target: "203.0.113.99",        confidence: 0.97, risk_level: "MEDIUM" },
      status: "SUCCESS",          enforcement: "ArmorClaw v2.1 — Zero-Trust Gate",                      hoursAgo: 8,
    },
    {
      input: "Allow IP 192.168.0.1",
      parsed: { action: "ALLOW_IP",            target: "192.168.0.1",         confidence: 0.96, risk_level: "HIGH" },
      status: "POLICY_VIOLATION", enforcement: "POL-004: Reserved IP Protection — gateway address",     hoursAgo: 10,
    },
    {
      input: "Investigate domain malicious-payload.ru",
      parsed: { action: "THREAT_INTEL_LOOKUP", target: "malicious-payload.ru", confidence: 0.88, risk_level: "LOW" },
      status: "SUCCESS",          enforcement: "ArmorClaw v2.1 — Threat Intel Feed",                    hoursAgo: 12,
    },
    {
      input: "Quarantine host db-primary-01",
      parsed: { action: "QUARANTINE_HOST",     target: "db-primary-01",       confidence: 0.95, risk_level: "MEDIUM" },
      status: "SUCCESS",          enforcement: "ArmorClaw v2.1 — Host Isolation Engine",                hoursAgo: 18,
    },
  ];

  // Insert in reverse order so newest ends up at index 0 (store.audit_logs.unshift)
  [...mockLogs].reverse().forEach((entry) => {
    const ts = new Date(Date.now() - entry.hoursAgo * 3600000).toISOString();
    const logObj = {
      id:             uuidv4(),
      timestamp:      ts,
      original_input: entry.input,
      parsed_command: entry.parsed,
      status:         entry.status,
      enforcement:    entry.enforcement,
    };
    const hash = sha256(logObj);
    database.insertLog({
      ...logObj,
      sha256_hash: hash,
      user_agent:  "Web Console",
      ip_address:  "127.0.0.1",
    });
  });

  console.log("  ✔ Audit logs seeded (12 records)");
}

function seed() {
  const seeded = database.getSetting("seeded");
  if (seeded === "true") {
    console.log("  ℹ  Database already seeded — skipping");
    return;
  }
  console.log("\n  Seeding ArmorIQ database...");
  seedPolicies();
  seedBlockedIPs();
  seedAuditLogs();
  database.setSetting("seeded", "true");
  console.log("  ✔ Seed complete\n");
}

module.exports = { seed };
