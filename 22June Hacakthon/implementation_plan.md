# ArmorIQ: AI-Powered Security Automation

A production-ready prototype for a zero-trust security automation platform with NLP command parsing, policy enforcement, and immutable audit trails.

## Proposed File Structure

```
22June Hacakthon/
├── frontend/                  # React + Vite + Tailwind
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       └── components/
│           ├── Header.jsx
│           ├── CommandConsole.jsx
│           ├── PolicyPanel.jsx
│           ├── MetricCards.jsx
│           ├── AuditTable.jsx
│           └── StatusBadge.jsx
│
├── backend/                   # Node.js + Express
│   ├── package.json
│   ├── server.js
│   ├── db.js                  # SQLite via better-sqlite3
│   ├── routes/
│   │   └── command.js
│   └── seed.js                # Mock data seeder
│
├── agent/                     # Python NLP microservice
│   ├── requirements.txt
│   ├── agent.py               # Flask server (port 5001)
│   └── parser.py              # NLP pattern matching logic
│
└── README.md
```

## Proposed Changes

### Frontend (React + Vite + Tailwind CSS)

#### [NEW] `frontend/src/App.jsx`
Single-page app shell with two-column layout: Command Console (left) and Metrics + Policy Panel (right). Bottom panel: Audit Trail table. Uses `axios` to call the Node backend.

#### [NEW] `frontend/src/components/Header.jsx`
Sticky header: "ArmorIQ Dashboard" branding, "Team: TechyBotsXO", animated "System Status: Secure (Zero-Trust Enabled)" badge with pulsing green dot.

#### [NEW] `frontend/src/components/CommandConsole.jsx`
- Natural language input bar with animated placeholder cycling through example commands
- Multi-step animated status feedback: Idle → Parsing → ArmorClaw Scanning → Policy Check → Result (Success/Violation/Error)
- Command output card showing parsed JSON and enforcement mechanism

#### [NEW] `frontend/src/components/MetricCards.jsx`
Four animated metric cards:
- Manual Audit Time Saved: 80%
- Active Blocked IPs: live count
- Total Executed Actions: live count
- Policy Violations Prevented: live count

#### [NEW] `frontend/src/components/PolicyPanel.jsx`
Side panel listing active zero-trust policies with status indicators.

#### [NEW] `frontend/src/components/AuditTable.jsx`
Full-width table with search/filter, showing: Timestamp, Input, Parsed Command, Status, Enforcement, SHA-256 Hash (truncated with copy button).

---

### Backend (Node.js + Express)

#### [NEW] `backend/server.js`
Express app on port 3001. Mounts `/api/command`, `/api/audit`, `/api/policies`, `/api/metrics` routes. Spawns SQLite DB on startup and seeds mock data.

#### [NEW] `backend/db.js`
`better-sqlite3` wrapper. Creates tables: `audit_logs`, `policies`, `blocked_ips`. Exports typed query helpers.

#### [NEW] `backend/routes/command.js`
- POST `/api/command`: receives `{ input: string }`, calls Python agent via `axios`, runs ArmorClaw validation, inserts audit record, returns full result.
- GET `/api/audit`: returns paginated audit logs.
- GET `/api/policies`: returns active policies list.
- GET `/api/metrics`: returns aggregated metric counts.

#### [NEW] `backend/seed.js`
Seeds 10 realistic mock audit records and 3 predefined policies on first run.

---

### Python AI Agent

#### [NEW] `agent/agent.py`
Flask microservice on port 5001. Single POST `/parse` endpoint.

#### [NEW] `agent/parser.py`
Pattern-matching NLP engine with regex rules for:
- `block ip <IP>` → `{ action: "BLOCK_IP", target: "<IP>" }`
- `scan subnet <CIDR>` → `{ action: "SCAN_SUBNET", target: "<CIDR>" }`
- `allow ip <IP>` → `{ action: "ALLOW_IP", target: "<IP>" }`
- `revoke access <user>` → `{ action: "REVOKE_ACCESS", target: "<user>" }`
- `enable firewall rule <name>` → `{ action: "ENABLE_RULE", target: "<name>" }`
- `quarantine host <host>` → `{ action: "QUARANTINE_HOST", target: "<host>" }`
- Confidence score + unknown command fallback

---

### ArmorClaw Policy Engine (inside `backend/routes/command.js`)

Explicit pre-flight validation logic:
1. **Restricted IP ranges**: Deny modifications to gateway/management IPs (10.0.0.1, 192.168.0.1)
2. **Admin-only actions**: `REVOKE_ACCESS`, `ENABLE_RULE` require `isAdmin` flag (simulated)
3. **Time-based restrictions**: Log-only mode between 23:00–05:00 UTC
4. **Subnet scope guard**: Block SCAN_SUBNET on ranges wider than /16
5. **Allowlist bypass protection**: Prevent ALLOW_IP for known malicious IPs in blocklist

---

### Audit Log Schema

```json
{
  "id": "uuid",
  "timestamp": "ISO8601",
  "original_input": "string",
  "parsed_command": { "action": "...", "target": "...", "confidence": 0.95 },
  "status": "SUCCESS | POLICY_VIOLATION | PARSE_ERROR",
  "enforcement_mechanism": "ArmorClaw v2.1 | Zero-Trust Gate",
  "sha256_hash": "computed over all other fields"
}
```

---

## Verification Plan

### Automated
- Run `node backend/server.js` and verify all 4 API routes respond correctly
- Run `python agent/agent.py` and POST sample commands to `/parse`
- Run `npm run dev` in `frontend/` and verify dashboard loads with mock data

### Manual Verification
- Submit "Block suspicious IP 192.168.1.50" → should succeed
- Submit "Allow IP 10.0.0.1" → should trigger policy violation (reserved gateway)
- Submit "Revoke access john.doe" → should be blocked (non-admin)
- Verify audit table updates in real time with SHA-256 hash visible
- Verify metric cards increment after each successful command
