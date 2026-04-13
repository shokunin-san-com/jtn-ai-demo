"""施工計画書生成 API エンドポイント

- POST /api/demo2                         : SSE で章ごとにプログレスを返す
- POST /api/demo2?action=download&chapter=chX : 指定章の Excel バイナリを返す

オフラインモード (?offline=true):
  AI 呼び出しをスキップし、キャッシュ済みレスポンスを即座に返す。
"""

from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import os
import sys
import time
import traceback

from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from lib.config import Demo2Config

CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "cache")
CACHE_FILE = os.path.join(CACHE_DIR, "demo2_last_result.json")


def _get_mock_chapters():
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
    try:
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return _get_mock_chapters()


def _save_cache(data):
    os.makedirs(CACHE_DIR, exist_ok=True)
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def _project_info_from_payload(payload: dict) -> dict:
    cfg = Demo2Config()
    return {
        "project_name": payload.get("project_name") or cfg.PROJECT_NAME,
        "location": payload.get("location") or cfg.LOCATION,
        "client": payload.get("client") or cfg.CLIENT,
        "schedule_start": payload.get("schedule_start") or cfg.SCHEDULE_START,
        "schedule_end": payload.get("schedule_end") or cfg.SCHEDULE_END,
        "work_type": payload.get("work_type") or cfg.WORK_TYPE,
    }


def _find_chapter(chapters, key):
    for ch in chapters:
        if ch["chapter"] == key:
            return ch
    return None


def _generate_chapter_with_fallback(chapter_key: str, project_info: dict, mock_chapters: list) -> dict:
    """章を生成。失敗時は mock_chapters からフォールバック。"""
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        return _find_chapter(mock_chapters, chapter_key)
    try:
        from lib.demo2_sekou_keikaku.ai_generator import generate_chapter

        return generate_chapter(chapter_key, project_info)
    except Exception:
        traceback.print_exc()
        return _find_chapter(mock_chapters, chapter_key)


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        query = parse_qs(urlparse(self.path).query)
        is_offline = query.get("offline", [""])[0] == "true"
        action = query.get("action", [""])[0]
        download_chapter = query.get("chapter", [""])[0]

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

        project_info = _project_info_from_payload(payload)
        mock_chapters = _get_mock_chapters()

        # --- ダウンロード ------------------------------------------------------
        if action == "download":
            if not download_chapter:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(
                    json.dumps({"error": "chapter パラメータが必要です"}, ensure_ascii=False).encode()
                )
                return

            # キャッシュから対象章を取得（無ければ生成、それも失敗ならモック）
            cached = _load_cache()
            ch = _find_chapter(cached, download_chapter)
            if ch is None:
                ch = _generate_chapter_with_fallback(download_chapter, project_info, mock_chapters)
            if ch is None:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(
                    json.dumps({"error": f"未知の章: {download_chapter}"}, ensure_ascii=False).encode()
                )
                return

            try:
                from lib.demo2_sekou_keikaku.excel_writer import write_chapter

                xlsx = write_chapter(download_chapter, ch["content"])
            except Exception as e:
                traceback.print_exc()
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(
                    json.dumps(
                        {"error": "Excel生成に失敗しました", "detail": str(e)}, ensure_ascii=False
                    ).encode()
                )
                return

            self.send_response(200)
            self.send_header(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
            self.send_header(
                "Content-Disposition", f'attachment; filename="{download_chapter}.xlsx"'
            )
            self.end_headers()
            self.wfile.write(xlsx)
            return

        # --- SSE 章生成 ---------------------------------------------------------
        retry_chapters = payload.get("retry_chapters")  # list[str] | None

        if is_offline:
            chapters = _load_cache()
        elif retry_chapters:
            # 指定章のみ再生成。他はキャッシュから
            cached = _load_cache()
            chapters = []
            for key in retry_chapters:
                ch = _generate_chapter_with_fallback(key, project_info, mock_chapters)
                if ch is not None:
                    chapters.append(ch)
            # キャッシュ更新（再生成分を差し替え）
            merged = []
            for c in cached:
                if c["chapter"] in retry_chapters:
                    new = _find_chapter(chapters, c["chapter"])
                    merged.append(new if new else c)
                else:
                    merged.append(c)
            _save_cache(merged)
        else:
            # 全章生成
            chapters = []
            for spec in mock_chapters:
                ch = _generate_chapter_with_fallback(spec["chapter"], project_info, mock_chapters)
                if ch is not None:
                    chapters.append(ch)

        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()

        for ch in chapters:
            event = {"chapter": ch["chapter"], "status": "generating"}
            self.wfile.write(f"data: {json.dumps(event, ensure_ascii=False)}\n\n".encode())
            self.wfile.flush()
            if not is_offline:
                time.sleep(0.3)

            event = {
                "chapter": ch["chapter"],
                "status": "done",
                "content": ch["content"],
            }
            self.wfile.write(f"data: {json.dumps(event, ensure_ascii=False)}\n\n".encode())
            self.wfile.flush()

        self.wfile.write(b"data: [DONE]\n\n")
        self.wfile.flush()

        # 通常の全章生成成功時にキャッシュ保存
        if not is_offline and not retry_chapters and chapters:
            _save_cache(chapters)
