"""工事月報 AI生成モジュール

Anthropic API で月次情報から工事月報を生成する。
"""

import anthropic

from lib.ai_utils import extract_json, extract_text_from_message, truncate_text
from lib.config import CLAUDE_MODEL, CLAUDE_TEMPERATURE, MAX_CONTENT_CHARS


SYSTEM_PROMPT = (
    "あなたは公共工事（電気設備）の工事月報を作成する現場代理人です。"
    "報告書らしい硬めの文体（「〜した」「〜である」）で、事実ベースに簡潔に記述してください。"
)


def _build_prompt(target_month: str, work_summary: str, progress: int, worker_count: int) -> str:
    return (
        f"以下の月次情報に基づき、工事月報を作成してください。\n"
        f"対象月: {target_month}\n"
        f"作業概要: {work_summary}\n"
        f"進捗率: {progress}%\n"
        f"作業員数: {worker_count}名\n\n"
        "以下の JSON スキーマで出力してください（JSON のみ、説明文なし）:\n"
        "{\n"
        '  "工事報告": "200〜400文字の報告本文。当月実施内容・安全状況・翌月予定を含む",\n'
        '  "作業概要": "60〜120文字の簡潔な概要",\n'
        '  "出来高": {"当月": <当月出来高%>, "累計": <累計出来高%>}\n'
        "}\n"
        "出来高の累計は 0〜100 の整数で、入力された進捗率と整合させること。"
    )


def generate_geppo(target_month: str, work_summary: str, progress: int, worker_count: int) -> dict:
    """月次情報から工事月報を生成する。"""
    client = anthropic.Anthropic()
    message = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=2048,
        temperature=CLAUDE_TEMPERATURE,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": _build_prompt(target_month, work_summary, progress, worker_count),
            }
        ],
    )
    text = extract_text_from_message(message)
    data = extract_json(text)

    # 文字数制限
    if isinstance(data.get("工事報告"), str):
        data["工事報告"] = truncate_text(data["工事報告"], MAX_CONTENT_CHARS)
    if isinstance(data.get("作業概要"), str):
        data["作業概要"] = truncate_text(data["作業概要"], MAX_CONTENT_CHARS)

    for key in ("工事報告", "作業概要", "出来高"):
        if key not in data:
            raise ValueError(f"必須キー '{key}' が応答に含まれていません")
    if not isinstance(data["出来高"], dict):
        raise ValueError("出来高は辞書である必要があります")
    for sub in ("当月", "累計"):
        if sub not in data["出来高"]:
            raise ValueError(f"出来高.{sub} が含まれていません")

    return data
