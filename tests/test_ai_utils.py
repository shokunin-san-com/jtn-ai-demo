"""lib/ai_utils.py のユニットテスト"""

import pytest

from lib.ai_utils import extract_json, truncate_text


def test_extract_json_plain():
    assert extract_json('{"a": 1}') == {"a": 1}


def test_extract_json_with_code_fence():
    text = 'some text\n```json\n{"a": 1, "b": [2, 3]}\n```\nafter'
    assert extract_json(text) == {"a": 1, "b": [2, 3]}


def test_extract_json_with_bare_fence():
    text = "```\n{\"x\": true}\n```"
    assert extract_json(text) == {"x": True}


def test_extract_json_nested():
    assert extract_json('{"a": {"b": {"c": 1}}}') == {"a": {"b": {"c": 1}}}


def test_extract_json_with_string_containing_brace():
    # 文字列内の { や } に惑わされないこと
    assert extract_json('{"msg": "hello {world}"}') == {"msg": "hello {world}"}


def test_extract_json_raises_on_missing():
    with pytest.raises(ValueError):
        extract_json("no json here")


def test_extract_json_raises_on_empty():
    with pytest.raises(ValueError):
        extract_json("")


def test_truncate_text_under_limit():
    assert truncate_text("short", 10) == "short"


def test_truncate_text_over_limit():
    result = truncate_text("a" * 100, 10)
    assert len(result) == 10
    assert result.endswith("…")


def test_truncate_text_non_string():
    assert truncate_text(None, 10) is None
