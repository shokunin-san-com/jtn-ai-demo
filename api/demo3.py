"""工事月報生成 API エンドポイント

- POST /api/demo3         : AI 生成結果を JSON で返す
- POST /api/demo3?action=download : Excel バイナリを返す

オフラインモード (?offline=true):
  AI 呼び出しをスキップし、キャッシュ済みレスポンスを即座に返す。
"""

from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import os
import pathlib
import sys
import traceback

from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

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
    "出来高": {"当月": 15, "累計": 45},
}

BASE_DIR = pathlib.Path(__file__).resolve().parent.parent
TEMPLATE_DIR = BASE_DIR / "templates" / "demo3"
REFERENCE_DIR = BASE_DIR / "templates" / "reference" / "geppo"
TEMPLATE_FILE = TEMPLATE_DIR / "工事月報（月）.xlsx"


def _error_response(handler_self, status, error_type, message, detail=None):
    handler_self.send_response(status)
    handler_self.send_header("Content-Type", "application/json")
    handler_self.end_headers()
    body = {"error": message, "error_type": error_type}
    if detail:
        body["detail"] = detail
    handler_self.wfile.write(json.dumps(body, ensure_ascii=False).encode())


def _validate_payload(payload):
    errors = []

    work_summary = payload.get("work_summary", "")
    if not isinstance(work_summary, str) or not work_summary.strip():
        errors.append("作業概要を入力してください")

    progress = payload.get("progress")
    if progress is None:
        errors.append("進捗率を入力してください")
    elif not isinstance(progress, (int, float)) or progress < 0 or progress > 100:
        errors.append("進捗率は0〜100の範囲で入力してください")

    worker_count = payload.get("worker_count")
    if worker_count is None:
        errors.append("作業員数を入力してください")
    elif not isinstance(worker_count, (int, float)) or worker_count < 1:
        errors.append("作業員数は1人以上を入力してください")

    target_month = payload.get("target_month", "")
    if not target_month:
        errors.append("対象月を選択してください")

    if errors:
        return ("validation_error", "入力内容に不備があります", errors)
    return None


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
    from lib.config import DRY_RUN

    if is_offline or DRY_RUN:
        return _load_cache()

    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        return _load_cache()

    try:
        from lib.demo3_geppo.ai_generator import generate_geppo

        result = generate_geppo(
            target_month=payload.get("target_month", ""),
            work_summary=payload.get("work_summary", ""),
            progress=int(payload.get("progress", 0)),
            worker_count=int(payload.get("worker_count", 0)),
        )
        _save_cache(result)
        return result
    except Exception:
        traceback.print_exc()
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
            _error_response(self, 400, "invalid_json", "不正なJSON形式です")
            return

        validation_err = _validate_payload(payload)
        if validation_err:
            error_type, message, detail = validation_err
            _error_response(self, 400, error_type, message, detail)
            return

        # オフライン以外ではテンプレート／参考データの存在を確認
        if not is_offline:
            if not TEMPLATE_FILE.exists():
                _error_response(
                    self, 500, "template_missing",
                    "テンプレートファイルが見つかりません",
                    f"必要なファイル: {TEMPLATE_FILE.name}",
                )
                return
            if not REFERENCE_DIR.exists() or not any(REFERENCE_DIR.iterdir()):
                _error_response(
                    self, 500, "reference_missing",
                    "参考データが見つかりません",
                    f"参考データフォルダ ({REFERENCE_DIR.name}/) にファイルが存在しません。",
                )
                return

        result = _generate(payload, is_offline)

        if action == "download":
            try:
                from lib.demo3_geppo.excel_writer import write_geppo

                xlsx = write_geppo(
                    result,
                    target_month=payload.get("target_month", ""),
                    worker_count=int(payload.get("worker_count", 0)),
                )
            except Exception as e:
                traceback.print_exc()
                _error_response(
                    self, 500, "excel_write_failed",
                    "Excel生成に失敗しました",
                    str(e),
                )
                return

            self.send_response(200)
            self.send_header(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
            self.send_header(
                "Content-Disposition", 'attachment; filename="geppo.xlsx"'
            )
            self.end_headers()
            self.wfile.write(xlsx)
            return

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(result, ensure_ascii=False).encode())
