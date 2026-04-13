"""工事月報生成 API エンドポイント

バックエンド (lib/demo3_geppo) が実装されたら差し替え。

オフラインモード (?offline=true):
  API呼び出しをスキップし、キャッシュ済みレスポンスを即座に返す。
  将来的には cache/demo3_last_result.json から読み込む。
"""

from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import os

# --- キャッシュファイルパス ------------------------------------------------------

CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "cache")
CACHE_FILE = os.path.join(CACHE_DIR, "demo3_last_result.json")

MOCK_RESPONSE = {
    "工事報告": (
        "令和8年10月度の工事月報を報告する。\n\n"
        "当月は大さん橋ふ頭および山下ふ頭における電力量計取替作業を主に実施した。"
        "大さん橋ふ頭では計3台の積算電力量計を電子式電力量計に更新し、"
        "配線確認および絶縁抵抗測定を完了した。山下ふ頭では計5台の取替を実施し、"
        "いずれも絶縁抵抗値1MΩ以上、接地抵抗値D種100Ω以下を確認した。\n\n"
        "安全面では無事故・無災害を継続しており、毎朝のKYK活動および"
        "作業前の検電確認を徹底した。来月は瑞穂ふ頭の電力量計取替に着手する予定である。"
    ),
    "作業概要": "大さん橋ふ頭・山下ふ頭の電力量計取替作業（計8台）を実施。全数の絶縁抵抗・接地抵抗測定完了。",
    "出来高": {
        "当月": 15,
        "累計": 45,
    },
}


def _load_cache():
    """キャッシュファイルが存在すれば読み込み、なければ MOCK_RESPONSE を返す"""
    try:
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return MOCK_RESPONSE


def _save_cache(data):
    """成功した生成結果をキャッシュファイルに保存する"""
    os.makedirs(CACHE_DIR, exist_ok=True)
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        query = parse_qs(urlparse(self.path).query)
        is_offline = query.get("offline", [""])[0] == "true"

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        try:
            _payload = json.loads(body) if body else {}
        except json.JSONDecodeError:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "不正なJSON"}).encode())
            return

        if is_offline:
            # オフラインモード: キャッシュデータを即座に返す（API呼び出しなし）
            result = _load_cache()
        else:
            # TODO: lib/demo3_geppo が実装されたら差し替え
            result = MOCK_RESPONSE
            # 成功時にキャッシュ保存
            _save_cache(result)

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(result, ensure_ascii=False).encode())
