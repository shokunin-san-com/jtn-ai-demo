"""共通設定モジュール

.env から読み込む環境変数のデフォルト値を一元管理する。
"""

import os

DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-20250514"

CLAUDE_MODEL = os.environ.get("CLAUDE_MODEL", DEFAULT_CLAUDE_MODEL)
