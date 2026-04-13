"""施工計画書生成 API エンドポイント

章ごとに SSE (Server-Sent Events) でプログレスを返す。
バックエンド (lib/demo2_sekou_keikaku) が実装されたら差し替え。

機密情報（契約金額等）は環境変数から読み込む。

オフラインモード (?offline=true):
  API呼び出しをスキップし、キャッシュ済みレスポンスを即座に返す。
  SSE の sleep を省略して高速にデータを返す。
"""

from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import os
import sys
import time

# lib.config をインポートするためにパス追加
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from lib.config import Demo2Config

# --- キャッシュファイルパス ------------------------------------------------------

CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "cache")
CACHE_FILE = os.path.join(CACHE_DIR, "demo2_last_result.json")


def _get_mock_chapters():
    """環境変数から MOCK_CHAPTERS を動的に生成"""
    cfg = Demo2Config()
    return [
        {
            "chapter": "ch1",
            "title": "第1章 総則",
            "content": f"本施工計画書は、{cfg.PROJECT_NAME}における施工方法、品質管理、安全管理等について定めるものである。本工事は{cfg.CLIENT}が発注する電力量計更新工事であり、関連法規および発注者の規定に基づき施工する。",
        },
        {
            "chapter": "ch2",
            "title": "第2章 工事概要",
            "content": f"工事名: {cfg.PROJECT_NAME}\n工事場所: {cfg.LOCATION}\n発注者: {cfg.CLIENT}\n工期: {cfg.SCHEDULE_START}〜{cfg.SCHEDULE_END}\n工種: {cfg.WORK_TYPE}\n契約金額: {cfg.CONTRACT_AMOUNT}円\n\n本工事は既設の電力量計を新型の電子式電力量計に更新するものである。",
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


def _load_cache():
    """キャッシュファイルが存在すれば読み込み、なければ環境変数ベースの MOCK_CHAPTERS を返す"""
    try:
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return _get_mock_chapters()


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

        # オフラインモード時はキャッシュ、通常時は環境変数から動的生成
        chapters = _load_cache() if is_offline else _get_mock_chapters()

        # SSE レスポンス
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()

        for ch in chapters:
            # generating イベント
            event = {"chapter": ch["chapter"], "status": "generating"}
            self.wfile.write(f"data: {json.dumps(event, ensure_ascii=False)}\n\n".encode())
            self.wfile.flush()
            # オフラインモード時は待機なし
            if not is_offline:
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

        # 通常モードの成功時にキャッシュ保存
        if not is_offline:
            _save_cache(chapters)
