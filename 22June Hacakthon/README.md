# ArmorIQ — AI-Powered Security Automation

> **Team: TechyBotsXO** | Zero-Trust Policy Engine | NLP Command Processing | Immutable Audit Trails

A production-ready full-stack cybersecurity dashboard that lets non-expert IT staff submit plain-English security commands, validates them against a zero-trust policy engine (ArmorClaw), and records every action in a tamper-proof SHA-256 audit trail.

---

## Architecture

```
┌─────────────────┐     HTTP      ┌──────────────────┐     HTTP      ┌─────────────────┐
│  React Frontend │ ────────────► │  Node.js Backend │ ────────────► │  Python Agent   │
│  (Vite + TW)    │ ◄──────────── │  Express :3001   │ ◄──────────── │  Flask :5001    │
│  localhost:5173 │               │  ArmorClaw Engine│               │  NLP Parser     │
└─────────────────┘               └────────┬─────────┘               └─────────────────┘
                                           │
                                    ┌──────▼──────┐
                                    │  SQLite DB  │
                                    │ armoriq.db  │
                                    └─────────────┘
```

## Quick Start

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.9
- npm

### 1. Start the Python NLP Agent (Terminal 1)
```bash
cd agent
pip install -r requirements.txt
python agent.py
# → Running on http://127.0.0.1:5001
```

### 2. Start the Node.js Backend (Terminal 2)
```bash
cd backend
npm install
node server.js
# → Running on http://localhost:3001
# → Database seeded automatically on first run
```

### 3. Start the React Frontend (Terminal 3)
```bash
cd frontend
npm install
npm run dev
# → Running on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/command` | Submit a natural language command |
| GET | `/api/audit` | Fetch all audit logs (with `?q=` search) |
| GET | `/api/policies` | List all active zero-trust policies |
| GET | `/api/metrics` | Get aggregated dashboard metrics |
| GET | `/api/blocked-ips` | List all currently blocked IPs |

### POST `/api/command` — Example
```json
// Request
{ "input": "Block suspicious IP 192.168.1.50" }

// Response
{
  "status": "SUCCESS",
  "message": "Command executed successfully via ArmorClaw v2.1 — Zero-Trust Gate.",
  "parsed_command": {
    "action": "BLOCK_IP",
    "target": "192.168.1.50",
    "confidence": 0.97,
    "risk_level": "MEDIUM"
  },
  "enforcement": "ArmorClaw v2.1 — Zero-Trust Gate",
  "audit_id": "uuid-...",
  "sha256_hash": "abc123...",
  "timestamp": "2024-06-20T..."
}
```

---

## ArmorClaw Policy Engine

Five zero-trust policies enforced on every command:

| Policy | Code | Rule |
|--------|------|------|
| Enforce Admin Restrictions | POL-001 | HIGH-risk actions require admin role |
| Restrict Execution Hours | POL-002 | Destructive ops blocked 23:00–05:00 UTC |
| Block Unauthorized Subnets | POL-003 | SCAN_SUBNET denied for prefix < /16 |
| Reserved IP Protection | POL-004 | Gateway IPs (10.0.0.1, etc.) are immutable |
| Malicious IP Allowlist Guard | POL-005 | Known-bad IPs cannot be allowlisted |

---

## Test Commands

| Command | Expected Result |
|---------|----------------|
| `Block suspicious IP 192.168.1.50` | ✅ SUCCESS |
| `Scan subnet 10.0.0.0/24` | ✅ SUCCESS |
| `Allow IP 10.0.0.1` | ❌ POL-004 Violation |
| `Allow IP 45.33.32.156` | ❌ POL-005 Violation |
| `Revoke access john.doe` | ❌ POL-001 Violation |
| `Scan subnet 0.0.0.0/8` | ❌ POL-003 Violation |
| `Quarantine host db-primary-01` | ✅ SUCCESS |
| `Close port 443` | ✅ SUCCESS |

---

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Axios
- **Backend**: Node.js, Express.js, uuid, axios (no native dependencies)
- **AI Agent**: Python, Flask, flask-cors (regex NLP parser)
- **Database**: JSON file store (`armoriq-data.json`) — pure-JS, zero native compilation
- **Security**: SHA-256 tamper-proof hashing, zero-trust policy engine
