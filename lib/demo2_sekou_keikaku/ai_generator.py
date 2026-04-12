"""施工計画書 AI生成モジュール

.env から CLAUDE_MODEL を読み込み、Anthropic API で施工計画書を章ごとに生成する。
"""

import os

import anthropic

CLAUDE_MODEL = os.environ.get("CLAUDE_MODEL", "claude-sonnet-4-20250514")

client = anthropic.Anthropic()


def generate_chapter(chapter_key: str, project_info: dict) -> dict:
    """指定された章の施工計画書を生成する。

    Args:
        chapter_key: 章キー (ch1, ch2, ch7, ch8)
        project_info: 工事名・場所・発注者・工期・工種を含む辞書

    Returns:
        dict: chapter, title, content を含む辞書
    """
    prompt = (
        f"以下の工事情報に基づき、施工計画書の{chapter_key}を作成してください。\n"
        f"工事名: {project_info.get('project_name', '')}\n"
        f"工事場所: {project_info.get('location', '')}\n"
        f"発注者: {project_info.get('client', '')}\n"
        f"工期: {project_info.get('schedule_start', '')}〜{project_info.get('schedule_end', '')}\n"
        f"工種: {project_info.get('work_type', '')}\n"
    )

    message = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    # TODO: レスポンスのパース処理を実装
    raise NotImplementedError("AI生成のレスポンスパースは未実装です")
