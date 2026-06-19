"""
ArmorIQ NLP Parser Engine
Translates natural language security commands into structured JSON using
regex-based pattern matching with confidence scoring.
"""

import re
import ipaddress

# ---------------------------------------------------------------------------
# Compiled pattern registry – ordered by specificity (most specific first)
# ---------------------------------------------------------------------------

PATTERNS = [
    # --- IP-level actions ---
    {
        "pattern": re.compile(
            r"(?:block|deny|drop|reject|ban)\s+(?:suspicious\s+)?(?:ip|host|address)?\s*"
            r"((?:\d{1,3}\.){3}\d{1,3})",
            re.IGNORECASE,
        ),
        "action": "BLOCK_IP",
        "target_group": 1,
        "confidence": 0.97,
        "description": "Block a specific IP address at the firewall",
        "risk_level": "MEDIUM",
    },
    {
        "pattern": re.compile(
            r"(?:allow|permit|whitelist|unblock|trust)\s+(?:ip|host|address)?\s*"
            r"((?:\d{1,3}\.){3}\d{1,3})",
            re.IGNORECASE,
        ),
        "action": "ALLOW_IP",
        "target_group": 1,
        "confidence": 0.96,
        "description": "Add an IP address to the allowlist",
        "risk_level": "HIGH",
    },
    # --- Subnet / network scanning ---
    {
        "pattern": re.compile(
            r"(?:scan|probe|audit|enumerate|discover)\s+(?:subnet|network|range|cidr)?\s*"
            r"((?:\d{1,3}\.){3}\d{1,3}(?:/\d{1,2})?)",
            re.IGNORECASE,
        ),
        "action": "SCAN_SUBNET",
        "target_group": 1,
        "confidence": 0.95,
        "description": "Run a network scan on the specified subnet",
        "risk_level": "LOW",
    },
    # --- User / access management ---
    {
        "pattern": re.compile(
            r"(?:revoke|terminate|remove|disable|suspend)\s+(?:access|session|credentials|account)?\s+"
            r"(?:for|of|from)?\s*([a-zA-Z0-9._\-@]+)",
            re.IGNORECASE,
        ),
        "action": "REVOKE_ACCESS",
        "target_group": 1,
        "confidence": 0.94,
        "description": "Revoke user access or session",
        "risk_level": "HIGH",
    },
    {
        "pattern": re.compile(
            r"(?:grant|restore|enable|give)\s+(?:access|permissions?|privileges?)\s+"
            r"(?:to|for)?\s*([a-zA-Z0-9._\-@]+)",
            re.IGNORECASE,
        ),
        "action": "GRANT_ACCESS",
        "target_group": 1,
        "confidence": 0.93,
        "description": "Grant access or restore privileges for a user",
        "risk_level": "HIGH",
    },
    # --- Firewall rules ---
    {
        "pattern": re.compile(
            r"(?:enable|activate|turn on|apply)\s+(?:firewall\s+)?(?:rule|policy|acl)\s+"
            r"[\"']?([a-zA-Z0-9_\-\s]+?)[\"']?\s*$",
            re.IGNORECASE,
        ),
        "action": "ENABLE_RULE",
        "target_group": 1,
        "confidence": 0.92,
        "description": "Enable a named firewall rule or ACL policy",
        "risk_level": "HIGH",
    },
    {
        "pattern": re.compile(
            r"(?:disable|deactivate|turn off|remove)\s+(?:firewall\s+)?(?:rule|policy|acl)\s+"
            r"[\"']?([a-zA-Z0-9_\-\s]+?)[\"']?\s*$",
            re.IGNORECASE,
        ),
        "action": "DISABLE_RULE",
        "target_group": 1,
        "confidence": 0.92,
        "description": "Disable a named firewall rule or ACL policy",
        "risk_level": "HIGH",
    },
    # --- Host quarantine ---
    {
        "pattern": re.compile(
            r"(?:quarantine|isolate|sandbox|contain)\s+(?:host|machine|device|node|endpoint)?\s*"
            r"([a-zA-Z0-9._\-]+)",
            re.IGNORECASE,
        ),
        "action": "QUARANTINE_HOST",
        "target_group": 1,
        "confidence": 0.95,
        "description": "Isolate a host from the network for inspection",
        "risk_level": "MEDIUM",
    },
    # --- Threat intelligence ---
    {
        "pattern": re.compile(
            r"(?:check|lookup|investigate|query|threat\s+intel(?:ligence)?)\s+(?:ip|host|address|domain)?\s*"
            r"([a-zA-Z0-9._\-@/]+)",
            re.IGNORECASE,
        ),
        "action": "THREAT_INTEL_LOOKUP",
        "target_group": 1,
        "confidence": 0.88,
        "description": "Query threat intelligence feeds for an IP or domain",
        "risk_level": "LOW",
    },
    # --- Port operations ---
    {
        "pattern": re.compile(
            r"(?:close|block|shutdown)\s+port\s+(\d{1,5})",
            re.IGNORECASE,
        ),
        "action": "CLOSE_PORT",
        "target_group": 1,
        "confidence": 0.96,
        "description": "Close or block a specific network port",
        "risk_level": "MEDIUM",
    },
    {
        "pattern": re.compile(
            r"(?:open|allow|expose)\s+port\s+(\d{1,5})",
            re.IGNORECASE,
        ),
        "action": "OPEN_PORT",
        "target_group": 1,
        "confidence": 0.96,
        "description": "Open or allow traffic on a specific network port",
        "risk_level": "HIGH",
    },
    # --- Alerts & monitoring ---
    {
        "pattern": re.compile(
            r"(?:alert|notify|warn|flag)\s+(?:on|about|for)?\s*(.+)",
            re.IGNORECASE,
        ),
        "action": "SET_ALERT",
        "target_group": 1,
        "confidence": 0.85,
        "description": "Configure a monitoring alert",
        "risk_level": "LOW",
    },
]

# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------

def _validate_ip(ip_str: str) -> bool:
    """Validate an IPv4 address string."""
    try:
        ipaddress.IPv4Address(ip_str.strip())
        return True
    except ValueError:
        return False


def _validate_cidr(cidr_str: str) -> bool:
    """Validate a CIDR notation string."""
    try:
        ipaddress.IPv4Network(cidr_str.strip(), strict=False)
        return True
    except ValueError:
        return False


def _get_cidr_prefix(cidr_str: str) -> int:
    """Extract prefix length from CIDR."""
    try:
        net = ipaddress.IPv4Network(cidr_str.strip(), strict=False)
        return net.prefixlen
    except ValueError:
        return 32


# ---------------------------------------------------------------------------
# Public parse function
# ---------------------------------------------------------------------------

def parse_command(text: str) -> dict:
    """
    Parse a natural language security command into a structured JSON object.

    Returns:
        dict with keys: action, target, confidence, description, risk_level,
                        raw_input, validation_notes, parsed_ok
    """
    text = text.strip()

    for entry in PATTERNS:
        match = entry["pattern"].search(text)
        if match:
            target = match.group(entry["target_group"]).strip()
            action = entry["action"]
            confidence = entry["confidence"]
            validation_notes = []
            parsed_ok = True

            # IP validation
            if action in ("BLOCK_IP", "ALLOW_IP", "THREAT_INTEL_LOOKUP"):
                if not _validate_ip(target):
                    parsed_ok = False
                    validation_notes.append(f"'{target}' is not a valid IPv4 address")
                    confidence = 0.40

            # CIDR validation
            if action == "SCAN_SUBNET":
                if "/" not in target:
                    target = target + "/24"  # assume /24 if omitted
                if not _validate_cidr(target):
                    parsed_ok = False
                    validation_notes.append(f"'{target}' is not a valid CIDR block")
                    confidence = 0.40

            # Port range validation
            if action in ("CLOSE_PORT", "OPEN_PORT"):
                try:
                    port = int(target)
                    if not (1 <= port <= 65535):
                        parsed_ok = False
                        validation_notes.append(f"Port {port} is out of valid range (1-65535)")
                        confidence = 0.30
                except ValueError:
                    parsed_ok = False
                    validation_notes.append(f"'{target}' is not a valid port number")
                    confidence = 0.30

            return {
                "action": action,
                "target": target,
                "confidence": round(confidence, 2),
                "description": entry["description"],
                "risk_level": entry["risk_level"],
                "raw_input": text,
                "validation_notes": validation_notes,
                "parsed_ok": parsed_ok,
            }

    # No pattern matched
    return {
        "action": "UNKNOWN",
        "target": None,
        "confidence": 0.0,
        "description": "Could not interpret the command. Please rephrase.",
        "risk_level": "UNKNOWN",
        "raw_input": text,
        "validation_notes": ["No pattern matched the input text"],
        "parsed_ok": False,
    }
