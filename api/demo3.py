"""工事月報生成 API エンドポイント

バックエンド (lib/demo3_geppo) が実装されたら差し替え。
"""

from http.server import BaseHTTPRequestHandler
import json


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
    # Issue #27: 印刷レイアウト検証（工事月報は発注者への提出用に印刷される）
    "print_layout_validation": [
        {"name": "ページ数", "template_value": "1ページ", "actual_value": "1ページ", "passed": True},
        {"name": "用紙サイズ", "template_value": "A4 縦", "actual_value": "A4 縦", "passed": True},
        {"name": "余白（上）", "template_value": "20.0mm", "actual_value": "20.0mm", "passed": True},
        {"name": "余白（下）", "template_value": "20.0mm", "actual_value": "20.0mm", "passed": True},
        {"name": "余白（左）", "template_value": "25.0mm", "actual_value": "25.0mm", "passed": True},
        {"name": "余白（右）", "template_value": "15.0mm", "actual_value": "15.0mm", "passed": True},
        {"name": "印刷範囲", "template_value": "A1:K40", "actual_value": "A1:K40", "passed": True},
        {"name": "フォント", "template_value": "MS 明朝", "actual_value": "MS 明朝", "passed": True},
        {"name": "フォントサイズ", "template_value": "11pt", "actual_value": "11pt", "passed": True},
    ],
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

        # TODO: lib/demo3_geppo が実装されたら差し替え
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(MOCK_RESPONSE, ensure_ascii=False).encode())
