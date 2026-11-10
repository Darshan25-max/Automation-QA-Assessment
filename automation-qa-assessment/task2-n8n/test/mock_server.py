"""Local mock of the GitHub REST API + Telegram Bot API, used ONLY to test the n8n workflows offline.
Usage: python3 mock_server.py [port]   (default 8765)
Modes via env MOCK_MODE: normal (default) | github_500 | telegram_500
Sent Telegram messages are appended to telegram_messages.log
"""
import json, os, sys, re
from http.server import BaseHTTPRequestHandler, HTTPServer

MODE = os.environ.get("MOCK_MODE", "normal")
LOG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "telegram_messages.log")

def repo(owner, name, stars, archived=False):
    return {"full_name": f"{owner}/{name}", "name": name, "owner": {"login": owner},
            "stargazers_count": stars, "forks_count": stars // 5, "language": "Python",
            "description": f"Mock repo {name}", "html_url": f"https://github.com/{owner}/{name}",
            "archived": archived, "disabled": False}

SEARCH = [repo("o1","alpha",90000), repo("o2","beta",80000), repo("o3","gamma",70000, archived=True),
          repo("o4","delta",60000), repo("o5","epsilon",50000), repo("o6","zeta",40000), repo("o7","eta",30000)]
# detail endpoint: 'delta' reports only 900 stars -> must hit the IF "false" branch (no Telegram message)
import copy
DETAIL = {r["full_name"]: copy.deepcopy(r) for r in SEARCH}  # separate copies so detail edits do not change search results
DETAIL["o4/delta"]["stargazers_count"] = 900

class H(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        b = json.dumps(obj).encode(); self.send_response(code)
        self.send_header("Content-Type","application/json"); self.send_header("Content-Length",str(len(b)))
        self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        if self.path.startswith("/search/repositories"):
            if MODE == "github_500": return self._send(500, {"message": "Server Error (mock)"})
            return self._send(200, {"total_count": len(SEARCH), "items": SEARCH})
        m = re.match(r"^/repos/([^/]+)/([^/?]+)", self.path)
        if m and f"{m[1]}/{m[2]}" in DETAIL: return self._send(200, DETAIL[f"{m[1]}/{m[2]}"])
        if self.path == "/ok": return self._send(200, {"ok": True})
        if self.path == "/down": return self._send(503, {"error": "service unavailable (mock)"})
        self._send(404, {"message": "Not Found (mock)"})
    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0)); body = self.rfile.read(n).decode()
        if "/sendMessage" in self.path:
            if MODE == "telegram_500": return self._send(500, {"ok": False, "description": "mock telegram failure"})
            with open(LOG, "a") as f: f.write(body + "\n")
            return self._send(200, {"ok": True, "result": {"message_id": 1, "chat": {"id": 12345}}})
        self._send(404, {"ok": False})
    def log_message(self, *a): pass

if __name__ == "__main__":
    HTTPServer(("127.0.0.1", int(sys.argv[1]) if len(sys.argv) > 1 else 8765), H).serve_forever()
