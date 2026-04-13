"""コンソール出力のクロスプラットフォーム対応

Windows cp932 環境では絵文字が UnicodeEncodeError を起こすため、
safe_print() で安全にフォールバックする。
"""

import sys


def safe_print(*args, **kwargs) -> None:
    """絵文字を含む出力を Windows でも落とさず出す。"""
    try:
        print(*args, **kwargs)
    except UnicodeEncodeError:
        encoding = getattr(sys.stdout, "encoding", "ascii") or "ascii"
        safe_args = [
            (
                arg.encode(encoding, errors="replace").decode(encoding)
                if isinstance(arg, str)
                else arg
            )
            for arg in args
        ]
        print(*safe_args, **kwargs)
