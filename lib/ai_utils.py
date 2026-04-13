"""AI 応答共通ユーティリティ

Claude API のレスポンスから JSON を堅牢に抽出する。
"""

import json
import re


def extract_json(text: str) -> dict:
    """AI 応答テキストから JSON オブジェクトを抽出する。

    - ```json ... ``` フェンスを除去
    - 最初の { から対応する } までを抽出
    - JSONDecodeError が発生した場合は ValueError を raise
    """
    if not text:
        raise ValueError("空のレスポンス")

    # コードフェンス除去
    fence = re.search(r"```(?:json)?\s*(.+?)```", text, re.DOTALL)
    if fence:
        text = fence.group(1)

    # 最初の { から対応する } を抽出
    start = text.find("{")
    if start < 0:
        raise ValueError("JSON が見つかりません")

    depth = 0
    in_str = False
    escape = False
    for i in range(start, len(text)):
        ch = text[i]
        if escape:
            escape = False
            continue
        if ch == "\\":
            escape = True
            continue
        if ch == '"':
            in_str = not in_str
            continue
        if in_str:
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(text[start : i + 1])
                except json.JSONDecodeError as e:
                    raise ValueError(f"JSON パース失敗: {e}")
    raise ValueError("JSON の終端が見つかりません")


def extract_text_from_message(message) -> str:
    """Anthropic Message オブジェクトからテキスト部分を結合して返す。"""
    parts = []
    for block in message.content:
        if getattr(block, "type", None) == "text":
            parts.append(block.text)
    return "\n".join(parts)
