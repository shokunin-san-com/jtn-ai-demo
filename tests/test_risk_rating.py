"""KYK 危険度マトリクスのユニットテスト"""

from lib.demo1_kyk.ai_generator import _compute_risk_rating


def test_risk_highest():
    assert _compute_risk_rating("×", "×") == 5


def test_risk_high():
    assert _compute_risk_rating("×", "△") == 4
    assert _compute_risk_rating("△", "×") == 4


def test_risk_medium():
    assert _compute_risk_rating("△", "△") == 3
    assert _compute_risk_rating("×", "○") == 3
    assert _compute_risk_rating("○", "×") == 3


def test_risk_low():
    assert _compute_risk_rating("△", "○") == 2
    assert _compute_risk_rating("○", "△") == 2


def test_risk_lowest():
    assert _compute_risk_rating("○", "○") == 1


def test_risk_unknown_falls_back_to_3():
    assert _compute_risk_rating("?", "?") == 3
    assert _compute_risk_rating("", "") == 3
