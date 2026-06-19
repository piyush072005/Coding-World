"""
ArmorIQ Python Agent — Flask Microservice
Exposes a single POST /parse endpoint consumed by the Node.js orchestrator.
Rich coloured terminal output so judges can watch NLP parsing live.
"""

import sys
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS
from command_parser import parse_command

app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------------------------
# ANSI colour helpers
# ---------------------------------------------------------------------------

RESET  = "\033[0m"
BOLD   = "\033[1m"
CYAN   = "\033[36m"
GREEN  = "\033[32m"
YELLOW = "\033[33m"
RED    = "\033[31m"
PURPLE = "\033[35m"
GREY   = "\033[90m"
WHITE  = "\033[97m"

def ts():
    return datetime.now(timezone.utc).strftime("%H:%M:%S")

def log_parse(user_input: str, result: dict):
    action    = result.get("action", "UNKNOWN")
    target    = result.get("target", "—")
    conf      = result.get("confidence", 0)
    risk      = result.get("risk_level", "UNKNOWN")
    parsed_ok = result.get("parsed_ok", False)

    action_color = GREEN if parsed_ok else RED
    risk_color   = RED if risk == "HIGH" else (YELLOW if risk == "MEDIUM" else GREEN)
    conf_bar_len = int(conf * 20)
    conf_bar     = "█" * conf_bar_len + "░" * (20 - conf_bar_len)

    print(f"\n{GREY}{'─' * 60}{RESET}")
    print(f"  {GREY}[{ts()} UTC]{RESET}  {CYAN}{BOLD}NLP PARSE REQUEST{RESET}")
    print(f"  {GREY}Input   :{RESET}  {WHITE}\"{user_input}\"{RESET}")
    print(f"  {GREY}Action  :{RESET}  {action_color}{BOLD}{action}{RESET}")
    print(f"  {GREY}Target  :{RESET}  {CYAN}{target}{RESET}")
    print(f"  {GREY}Risk    :{RESET}  {risk_color}{risk}{RESET}")
    print(f"  {GREY}Conf.   :{RESET}  {YELLOW}{conf_bar}{RESET}  {conf:.0%}")
    if result.get("validation_notes"):
        for note in result["validation_notes"]:
            print(f"  {GREY}⚠ Note  :{RESET}  {YELLOW}{note}{RESET}")
    status_label = f"{GREEN}✔  PARSED OK{RESET}" if parsed_ok else f"{RED}✖  PARSE FAILED{RESET}"
    print(f"  {GREY}Status  :{RESET}  {status_label}")
    print(f"{GREY}{'─' * 60}{RESET}", flush=True)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/health", methods=["GET"])
def health():
    print(f"  {GREY}[{ts()}]{RESET} {CYAN}GET{RESET} /health  {GREEN}200{RESET}", flush=True)
    return jsonify({"status": "ok", "service": "ArmorIQ NLP Agent", "version": "1.0.0"})


@app.route("/parse", methods=["POST"])
def parse():
    data = request.get_json(silent=True)
    if not data or "input" not in data:
        print(f"  {GREY}[{ts()}]{RESET} {PURPLE}POST{RESET} /parse  {RED}400  Missing input field{RESET}", flush=True)
        return jsonify({
            "error": "Missing 'input' field in request body",
            "parsed_ok": False,
        }), 400

    user_input = str(data["input"]).strip()

    if len(user_input) < 3:
        return jsonify({"error": "Input too short to parse", "parsed_ok": False}), 400
    if len(user_input) > 500:
        return jsonify({"error": "Input exceeds maximum length of 500 characters", "parsed_ok": False}), 400

    result = parse_command(user_input)
    log_parse(user_input, result)
    return jsonify(result), 200


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    line = "═" * 55
    print(f"\n{CYAN}{line}{RESET}")
    print(f"  {BOLD}{WHITE}ArmorIQ NLP Agent{RESET}  {GREY}v0.1{RESET}")
    print(f"{CYAN}{line}{RESET}")
    print(f"  {GREEN}●{RESET} Listening  →  {CYAN}http://127.0.0.1:5001{RESET}")
    print(f"  {YELLOW}●{RESET} Endpoints  →  {WHITE}GET /health  |  POST /parse{RESET}")
    print(f"  {PURPLE}●{RESET} Patterns   →  {WHITE}12 NLP rules loaded{RESET}")
    print(f"{CYAN}{line}{RESET}\n")
    sys.stdout.flush()
    app.run(host="127.0.0.1", port=5001, debug=False)
