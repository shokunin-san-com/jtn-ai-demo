"""KYKシート生成 API エンドポイント

バックエンド (lib/demo1_kyk) が実装されたら generate_kyk / write_kyk を呼び出す。
現時点ではモックデータを返す。
"""

from http.server import BaseHTTPRequestHandler
import json

from dotenv import load_dotenv

load_dotenv()

# --- モックレスポンス ----------------------------------------------------------

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


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
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

        # TODO: lib/demo1_kyk が実装されたら以下を差し替え
        # from lib.demo1_kyk.ai_generator import generate_kyk
        # result = generate_kyk(payload["work_description"])

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(MOCK_RESPONSE, ensure_ascii=False).encode())
