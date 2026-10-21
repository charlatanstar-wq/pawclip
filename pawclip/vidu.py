"""Minimal Vidu API client using only the Python standard library."""
import base64
import json
import mimetypes
import os
import urllib.error
import urllib.request

API_BASE = os.environ.get("VIDU_API_BASE", "https://api.vidu.com")


class ViduError(RuntimeError):
    pass


class ViduClient:
    def __init__(self, api_key=None, base=API_BASE, timeout=60):
        self.api_key = api_key or os.environ.get("VIDU_API_KEY")
        if not self.api_key:
            raise ViduError("Set VIDU_API_KEY or pass --api-key")
        self.base = base.rstrip("/")
        self.timeout = timeout

    def _request(self, method, path, body=None):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(self.base + path, data=data, method=method)
        req.add_header("Authorization", f"Token {self.api_key}")
        req.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as r:
                return json.loads(r.read().decode() or "{}")
        except urllib.error.HTTPError as e:
            detail = e.read().decode(errors="replace")[:500]
            raise ViduError(f"HTTP {e.code} on {path}: {detail}") from None

    # --- account -----------------------------------------------------------
    def credits_remaining(self):
        d = self._request("GET", "/ent/v2/credits")
        return sum(int(x.get("credit_remain", 0)) for x in d.get("remains", []))

    # --- generation --------------------------------------------------------
    def text2video(self, **params):
        return self._request("POST", "/ent/v2/text2video", params)

    def img2video(self, image_path, **params):
        params["images"] = [encode_image(image_path)]
        return self._request("POST", "/ent/v2/img2video", params)

    def task(self, task_id):
        return self._request("GET", f"/ent/v2/tasks/{task_id}/creations")


def encode_image(path):
    if path.startswith(("http://", "https://")):
        return path
    mime = mimetypes.guess_type(path)[0] or "image/png"
    with open(path, "rb") as f:
        return f"data:{mime};base64," + base64.b64encode(f.read()).decode()


def download(url, dest):
    os.makedirs(os.path.dirname(dest) or ".", exist_ok=True)
    with urllib.request.urlopen(url, timeout=300) as r, open(dest, "wb") as f:
        while chunk := r.read(1 << 16):
            f.write(chunk)
    return dest
