"""工事月報 AI生成モジュール

.env から CLAUDE_MODEL を読み込み、Anthropic API で工事月報を生成する。
"""

import anthropic

from lib.config import CLAUDE_MODEL


def generate_geppo(target_month: str, work_summary: str, progress: int, worker_count: int) -> dict:
    """月次情報から工事月報を生成する。

    Returns:
        dict: 工事報告・作業概要・出来高を含む辞書
    """
    client = anthropic.Anthropic()

    prompt = (
        f"以下の月次情報に基づき、公共工事の文体で工事月報を作成してください。\n"
        f"対象月: {target_month}\n"
        f"作業概要: {work_summary}\n"
        f"進捗率: {progress}%\n"
        f"作業員数: {worker_count}名\n\n"
        f"JSON形式で、工事報告（文字列）、作業概要（文字列）、"
        f"出来高（当月・累計を含む辞書）を返してください。"
    )

    message = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )

    # TODO: レスポンスのパース処理を実装
    raise NotImplementedError("AI生成のレスポンスパースは未実装です")
