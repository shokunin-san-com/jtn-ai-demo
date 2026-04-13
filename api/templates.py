"""テンプレートExcel一覧 / ダウンロード API

templates/ ディレクトリに集約されたExcelテンプレートの一覧取得と
ファイルダウンロードを提供する。

GET ?action=list          → テンプレート一覧 JSON
GET ?action=download&path=demo1/KYKシート.xlsx → ファイルダウンロード
"""

from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import os
import mimetypes

TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "..", "templates")

# デモごとのメタ情報
DEMO_META = {
    "demo1": {"title": "KYKシート", "color": "blue"},
    "demo2": {"title": "施工計画書", "color": "emerald"},
    "demo3": {"title": "工事月報", "color": "amber"},
    "reference": {"title": "参考データ（過去案件）", "color": "gray"},
}


def _scan_templates():
    """templates/ 以下のファイルをスキャンしてカテゴリ別に返す"""
    result = []
    if not os.path.isdir(TEMPLATES_DIR):
        return result

    for category in sorted(os.listdir(TEMPLATES_DIR)):
        cat_path = os.path.join(TEMPLATES_DIR, category)
        if not os.path.isdir(cat_path):
            continue

        meta = DEMO_META.get(category, {"title": category, "color": "gray"})
        files = []

        for root, _dirs, filenames in os.walk(cat_path):
            for fname in sorted(filenames):
                if fname.startswith(".") or fname == "__init__.py":
                    continue
                full = os.path.join(root, fname)
                rel = os.path.relpath(full, TEMPLATES_DIR)
                sub = os.path.relpath(root, cat_path)
                files.append({
                    "name": fname,
                    "path": rel,
                    "subcategory": sub if sub != "." else None,
                    "size": os.path.getsize(full),
                })

        result.append({
            "category": category,
            "title": meta["title"],
            "color": meta["color"],
            "files": files,
        })

    return result


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        query = parse_qs(urlparse(self.path).query)
        action = query.get("action", ["list"])[0]

        if action == "download":
            self._handle_download(query)
        else:
            self._handle_list()

    def _handle_list(self):
        data = _scan_templates()
        body = json.dumps(data, ensure_ascii=False)
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body.encode())

    def _handle_download(self, query):
        file_path = query.get("path", [""])[0]
        if not file_path:
            self._error(400, "path パラメータが必要です")
            return

        # パストラバーサル防止
        safe = os.path.normpath(os.path.join(TEMPLATES_DIR, file_path))
        if not safe.startswith(os.path.normpath(TEMPLATES_DIR)):
            self._error(403, "不正なパスです")
            return

        if not os.path.isfile(safe):
            self._error(404, "ファイルが見つかりません")
            return

        mime, _ = mimetypes.guess_type(safe)
        fname = os.path.basename(safe)

        self.send_response(200)
        self.send_header("Content-Type", mime or "application/octet-stream")
        self.send_header("Content-Disposition", f'attachment; filename="{fname}"')
        self.end_headers()

        with open(safe, "rb") as f:
            self.wfile.write(f.read())

    def _error(self, code, message):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}).encode())
