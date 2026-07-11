import json
import os
import re
import smtplib
from email.message import EmailMessage

import functions_framework

TO = "guillermo.angarita.gutierrez@gmail.com"
GMAIL_USER = os.environ.get("GMAIL_USER", TO)
ALLOWED_ORIGINS = {"https://andesprit.github.io"}
EMAIL_RE = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]+")


def _cors(origin):
    allowed = origin if origin in ALLOWED_ORIGINS else "https://andesprit.github.io"
    return {
        "Access-Control-Allow-Origin": allowed,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "3600",
    }


@functions_framework.http
def contact(request):
    headers = _cors(request.headers.get("Origin", ""))
    if request.method == "OPTIONS":
        return ("", 204, headers)
    if request.method != "POST":
        return (json.dumps({"error": "method not allowed"}), 405, headers)

    data = request.get_json(silent=True) or {}
    if data.get("website"):
        return (json.dumps({"ok": True}), 200, headers)

    name = str(data.get("name", "")).strip()[:120]
    email = str(data.get("email", "")).strip()[:200]
    message = str(data.get("message", "")).strip()[:5000]
    if not name or not message or not EMAIL_RE.fullmatch(email):
        return (json.dumps({"error": "invalid input"}), 400, headers)

    msg = EmailMessage()
    msg["Subject"] = f"Andesprit inquiry from {name}"
    msg["From"] = GMAIL_USER
    msg["To"] = TO
    msg["Reply-To"] = email
    msg.set_content(f"Name: {name}\nEmail: {email}\n\n{message}")

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(GMAIL_USER, os.environ["GMAIL_APP_PASSWORD"])
        server.send_message(msg)

    return (json.dumps({"ok": True}), 200, headers)
