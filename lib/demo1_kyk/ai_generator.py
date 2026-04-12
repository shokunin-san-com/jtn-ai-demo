"""KYKシート AI生成モジュール

.env から CLAUDE_MODEL を読み込み、Anthropic API でKYKシートを生成する。
"""

import anthropic

from lib.config import CLAUDE_MODEL


def generate_kyk(work_description: str, weather: str = "", date: str = "") -> dict:
    """作業内容からKYKシート（リスクアセスメント付き）を生成する。

    Returns:
        dict: 作業内容・リスク・重点対策・安全指示を含む辞書
    """
    client = anthropic.Anthropic()

    prompt = (
        f"以下の作業内容に対するKYK（危険予知活動）シートを作成してください。\n"
        f"作業内容: {work_description}\n"
        f"天候: {weather}\n"
        f"作業日: {date}\n\n"
        f"JSON形式で、作業内容（配列）、リスク（危険・可能性・重大性・危険度・対策を含む配列）、"
        f"重点対策（文字列）、安全指示（文字列）を返してください。"
    )

    message = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )

    # TODO: レスポンスのパース処理を実装
    raise NotImplementedError("AI生成のレスポンスパースは未実装です")
