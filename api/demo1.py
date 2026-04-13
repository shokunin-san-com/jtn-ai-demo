"""KYKシート生成 API エンドポイント

- POST /api/demo1         : AI生成結果を JSON で返す
- POST /api/demo1?action=download : Excel バイナリを返す

オフラインモード (?offline=true):
  AI 呼び出しをスキップし、キャッシュ済みレスポンスを即座に返す。
"""

from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import os
import sys
import traceback

from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# --- キャッシュファイルパス ------------------------------------------------------

CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "cache")
CACHE_FILE = os.path.join(CACHE_DIR, "demo1_last_result.json")

# --- モックレスポンス（キャッシュが無い・API失敗時のフォールバック） --------------

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
    try:
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return MOCK_RESPONSE


def _save_cache(data):
    os.makedirs(CACHE_DIR, exist_ok=True)
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def _generate(payload: dict, is_offline: bool) -> dict:
    """AI 生成またはフォールバック。成功時はキャッシュに保存。"""
    if is_offline:
        return _load_cache()

    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        # API キー未設定時はフォールバック
        return _load_cache()

    try:
        from lib.demo1_kyk.ai_generator import generate_kyk

        result = generate_kyk(
            work_description=payload.get("work_description", ""),
            weather=payload.get("weather", ""),
            date=payload.get("date", ""),
        )
        _save_cache(result)
        return result
    except Exception:
        traceback.print_exc()
        # 失敗時もキャッシュ/モックでフォールバック
        return _load_cache()


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        query = parse_qs(urlparse(self.path).query)
        is_offline = query.get("offline", [""])[0] == "true"
        action = query.get("action", [""])[0]

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        try:
            payload = json.loads(body) if body else {}
        except json.JSONDecodeError:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "不正なJSON"}).encode())
            return

        result = _generate(payload, is_offline)

        if action == "download":
            try:
                from lib.demo1_kyk.excel_writer import write_kyk

                xlsx = write_kyk(
                    result,
                    date=payload.get("date", ""),
                    weather=payload.get("weather", ""),
                )
            except Exception as e:
                traceback.print_exc()
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(
                    json.dumps(
                        {"error": "Excel生成に失敗しました", "detail": str(e)},
                        ensure_ascii=False,
                    ).encode()
                )
                return
            self.send_response(200)
            self.send_header(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
            self.send_header("Content-Disposition", 'attachment; filename="KYK.xlsx"')
            self.end_headers()
            self.wfile.write(xlsx)
            return

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(result, ensure_ascii=False).encode())
