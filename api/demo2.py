"""施工計画書生成 API エンドポイント

章ごとに SSE (Server-Sent Events) でプログレスを返す。
バックエンド (lib/demo2_sekou_keikaku) が実装されたら差し替え。
"""

from http.server import BaseHTTPRequestHandler
import json
import time

MOCK_CHAPTERS = [
    {
        "chapter": "ch1",
        "title": "第1章 総則",
        "content": "本施工計画書は、各ふ頭電力量計更新工事における施工方法、品質管理、安全管理等について定めるものである。本工事は横浜市港湾局が発注する電力量計更新工事であり、関連法規および横浜市の規定に基づき施工する。",
    },
    {
        "chapter": "ch2",
        "title": "第2章 工事概要",
        "content": "工事名: 各ふ頭電力量計更新工事\n工事場所: 横浜市各ふ頭\n発注者: 横浜市港湾局\n工期: 令和7年6月30日〜令和8年1月30日\n工種: 電力量計更新（積算電力量計の取替）\n\n本工事は横浜市内各ふ頭に設置された老朽化した積算電力量計を新型の電子式電力量計に更新するものである。",
    },
    {
        "chapter": "ch7",
        "title": "第7章 品質管理",
        "content": "電力量計の取替にあたり、以下の品質管理項目を設定する。\n\n1. 絶縁抵抗測定: 取替後に1MΩ以上を確認\n2. 接地抵抗測定: D種接地 100Ω以下を確認\n3. 電圧・電流確認: 定格値の±5%以内\n4. 外観検査: 損傷・変形なきこと\n5. 計量精度確認: JIS C 1216に基づく精度等級を満足",
    },
    {
        "chapter": "ch8",
        "title": "第8章 安全衛生管理",
        "content": "電気工事における主要リスクと対策を以下に定める。\n\n1. 感電防止: 作業前の検電実施、絶縁用保護具の着用義務化\n2. 墜落防止: 高所作業時の安全帯使用、脚立の正しい使用方法の徹底\n3. 短絡・火災防止: ブレーカー遮断確認、絶縁養生の実施\n4. 熱中症対策: WBGT値の測定、休憩・水分補給の確保",
    },
]


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

        # SSE レスポンス
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()

        for ch in MOCK_CHAPTERS:
            # generating イベント
            event = {"chapter": ch["chapter"], "status": "generating"}
            self.wfile.write(f"data: {json.dumps(event, ensure_ascii=False)}\n\n".encode())
            self.wfile.flush()
            time.sleep(0.5)

            # done イベント
            event = {
                "chapter": ch["chapter"],
                "status": "done",
                "content": ch["content"],
            }
            self.wfile.write(f"data: {json.dumps(event, ensure_ascii=False)}\n\n".encode())
            self.wfile.flush()

        self.wfile.write(b"data: [DONE]\n\n")
        self.wfile.flush()
