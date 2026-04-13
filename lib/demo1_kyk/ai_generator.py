"""KYKシート AI生成モジュール

Anthropic API で作業内容に応じた KYK（危険予知活動）シートを生成する。
"""

import anthropic

from lib.ai_utils import extract_json, extract_text_from_message
from lib.config import CLAUDE_MODEL


SYSTEM_PROMPT = (
    "あなたは電気工事現場の安全管理を統括する経験豊富な現場代理人です。"
    "与えられた作業内容に基づき、KYK（危険予知活動）シートを JSON 形式で作成してください。"
)


def _build_prompt(work_description: str, weather: str, date: str) -> str:
    return (
        f"以下の作業に対する KYK シートを作成してください。\n"
        f"作業内容: {work_description}\n"
        f"天候: {weather or '指定なし'}\n"
        f"作業日: {date or '指定なし'}\n\n"
        "以下の JSON スキーマで出力してください（JSON のみ、説明文なし）:\n"
        "{\n"
        '  "作業内容": ["①…", "②…", "③…", "④…"],\n'
        '  "リスク": [\n'
        '    {"危険": "…", "可能性": "○|△|×", "重大性": "○|△|×", "危険度": 1-5, "対策": "…"}\n'
        "  ],\n"
        '  "重点対策": "…",\n'
        '  "安全指示": "…"\n'
        "}\n\n"
        "制約:\n"
        "- 作業内容は 3〜5 項目\n"
        "- リスクは 3〜5 項目、危険度は可能性×重大性で評価\n"
        "- 記号: ×=死亡障害/可能性高、△=休業/可能性あり、○=不休/ほとんど無い\n"
        "- 重点対策・安全指示は 60〜120 文字程度\n"
    )


def generate_kyk(work_description: str, weather: str = "", date: str = "") -> dict:
    """作業内容から KYK シートを生成する。"""
    client = anthropic.Anthropic()
    message = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": _build_prompt(work_description, weather, date)}],
    )
    text = extract_text_from_message(message)
    data = extract_json(text)

    # 最低限のフィールド検証
    for key in ("作業内容", "リスク", "重点対策", "安全指示"):
        if key not in data:
            raise ValueError(f"必須キー '{key}' が応答に含まれていません")
    if not isinstance(data["作業内容"], list):
        raise ValueError("作業内容は配列である必要があります")
    if not isinstance(data["リスク"], list):
        raise ValueError("リスクは配列である必要があります")
    return data
