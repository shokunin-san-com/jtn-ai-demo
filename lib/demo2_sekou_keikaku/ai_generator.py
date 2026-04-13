"""施工計画書 AI生成モジュール

章ごとに Anthropic API で施工計画書本文を生成する。
"""

import anthropic

from lib.ai_utils import extract_text_from_message
from lib.config import CLAUDE_MODEL


SYSTEM_PROMPT = (
    "あなたは公共工事（電気設備）の施工計画書を作成する経験豊富な技術者です。"
    "簡潔で実務的な文体（です・ます調ではなく「〜する」「〜とする」）で記述してください。"
)

CHAPTER_SPECS = {
    "ch1": {
        "title": "第1章 総則",
        "instruction": (
            "本施工計画書の適用範囲と目的、適用図書、変更・疑義・協議の手続きを"
            "300〜500 文字程度で記述してください。"
        ),
    },
    "ch2": {
        "title": "第2章 工事概要",
        "instruction": (
            "工事名・工期・工事場所・発注者・施工会社・工事内容・施工理由を"
            "箇条書き中心で簡潔に記述してください。"
        ),
    },
    "ch7": {
        "title": "第7章 品質管理",
        "instruction": (
            "品質管理の基本方針、管理項目（絶縁抵抗・接地抵抗・計量精度等）、"
            "確認方法、記録保管について 400〜600 文字程度で記述してください。"
        ),
    },
    "ch8": {
        "title": "第8章 安全衛生管理",
        "instruction": (
            "電気工事における主要リスク（感電・墜落・短絡火災・熱中症）とその対策、"
            "異常気象時の作業中止基準を含め 400〜600 文字程度で記述してください。"
        ),
    },
}


def _build_prompt(chapter_key: str, project_info: dict) -> str:
    spec = CHAPTER_SPECS[chapter_key]
    return (
        f"以下の工事情報に基づき、施工計画書『{spec['title']}』の本文を作成してください。\n\n"
        f"工事名: {project_info.get('project_name', '')}\n"
        f"工事場所: {project_info.get('location', '')}\n"
        f"発注者: {project_info.get('client', '')}\n"
        f"工期: {project_info.get('schedule_start', '')}〜{project_info.get('schedule_end', '')}\n"
        f"工種: {project_info.get('work_type', '')}\n\n"
        f"{spec['instruction']}\n"
        "本文のみを出力し、章番号や見出しは付けないでください。"
    )


def generate_chapter(chapter_key: str, project_info: dict) -> dict:
    """指定された章の本文を生成する。"""
    if chapter_key not in CHAPTER_SPECS:
        raise ValueError(f"未知の章キー: {chapter_key}")

    client = anthropic.Anthropic()
    message = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": _build_prompt(chapter_key, project_info)}],
    )
    content = extract_text_from_message(message).strip()
    if not content:
        raise ValueError("AI 応答が空でした")

    return {
        "chapter": chapter_key,
        "title": CHAPTER_SPECS[chapter_key]["title"],
        "content": content,
    }
