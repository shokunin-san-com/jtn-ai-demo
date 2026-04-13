"""KYKシート生成 API エンドポイント

バックエンド (lib/demo1_kyk) が実装されたら generate_kyk / write_kyk を呼び出す。
現時点ではモックデータを返す。

オフラインモード (?offline=true):
  API呼び出しをスキップし、キャッシュ済みレスポンスを即座に返す。
  将来的には cache/demo1_last_result.json から読み込む。
"""

from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import os

# --- キャッシュファイルパス ------------------------------------------------------

CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "cache")
CACHE_FILE = os.path.join(CACHE_DIR, "demo1_last_result.json")

# --- モックレスポンス（キャッシュが無い場合のフォールバック） ----------------------

MOCK_RESPONSE = {
    "作業内容": [
        "①大さん橋ふ頭 電力量計取替 3台",
        "②配線確認・絶縁抵抗測定",
        "③養生・清掃",
        "④作業報告書作成",
    ],
    "リスク": [
        {
            "危険": "充電部接触による感電",
            "可能性": "△",
            "重大性": "×",
            "危険度": 2,
            "対策": "検電確認後に作業開始。絶縁手袋・絶縁工具を使用。活線作業は原則禁止。",
        },
        {
            "危険": "脚立からの墜落・転落",
            "可能性": "△",
            "重大性": "△",
            "危険度": 3,
            "対策": "脚立は水平な場所に設置し開き止めを確認。2人1組で作業し、1人が脚立を保持する。",
        },
        {
            "危険": "短絡による火傷・火災",
            "可能性": "○",
            "重大性": "×",
            "危険度": 3,
            "対策": "ブレーカーOFF確認後に作業開始。絶縁テープで端子を養生。消火器を作業場所に配置。",
        },
    ],
    "重点対策": "電力量計交換時の感電防止を最重点とする。作業前に必ず検電器で無電圧確認を実施し、短絡防止養生を徹底すること。",
    "安全指示": "暑熱環境が予想されるため、WBGT値を確認しこまめな水分補給と休憩を確保すること。体調不良時は直ちに申告すること。",
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
            # TODO: lib/demo1_kyk が実装されたら以下を差し替え
            # from lib.demo1_kyk.ai_generator import generate_kyk
            # result = generate_kyk(payload["work_description"])
            result = MOCK_RESPONSE
            # 成功時にキャッシュ保存
            _save_cache(result)

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(result, ensure_ascii=False).encode())
