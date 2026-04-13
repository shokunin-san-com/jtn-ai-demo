"""プロジェクト設定の管理

環境変数から機密情報以外の設定を読み込む。
機密情報（APIキー等）は別途管理。
"""

import os
from dotenv import load_dotenv

# .env ファイルを読み込む
load_dotenv()


# --- AI モデル設定 ---
DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-20250514"
CLAUDE_MODEL = os.environ.get("CLAUDE_MODEL", DEFAULT_CLAUDE_MODEL)


class Demo2Config:
    """Demo2（施工計画書）の設定"""

    PROJECT_NAME = os.getenv("DEMO2_PROJECT_NAME", "各ふ頭電力量計更新工事")
    LOCATION = os.getenv("DEMO2_LOCATION", "横浜市各ふ頭")
    CLIENT = os.getenv("DEMO2_CLIENT", "横浜市港湾局")
    SCHEDULE_START = os.getenv("DEMO2_SCHEDULE_START", "令和7年6月30日")
    SCHEDULE_END = os.getenv("DEMO2_SCHEDULE_END", "令和8年1月30日")
    WORK_TYPE = os.getenv("DEMO2_WORK_TYPE", "電力量計更新（積算電力量計の取替）")
    CONTRACT_AMOUNT = os.getenv("DEMO2_CONTRACT_AMOUNT", "2450000")

    @classmethod
    def to_dict(cls):
        """辞書形式で返す"""
        return {
            "工事名": cls.PROJECT_NAME,
            "工事場所": cls.LOCATION,
            "発注者": cls.CLIENT,
            "工期_着手": cls.SCHEDULE_START,
            "工期_完成": cls.SCHEDULE_END,
            "工種": cls.WORK_TYPE,
            "契約金額": f"{cls.CONTRACT_AMOUNT}円",
        }


class Demo1Config:
    """Demo1（KYKシート）の設定"""

    PROJECT_NAME = os.getenv("DEMO1_PROJECT_NAME", "各ふ頭電力量計更新工事")
    COMPANY = os.getenv("DEMO1_COMPANY", "㈱ジェイ・ティー・エヌ")

    @classmethod
    def to_dict(cls):
        """辞書形式で返す"""
        return {
            "現場名": cls.PROJECT_NAME,
            "元請会社": cls.COMPANY,
        }


class Demo3Config:
    """Demo3（工事月報）の設定"""

    PROJECT_NAME = os.getenv("DEMO3_PROJECT_NAME", "各ふ頭電力量計更新工事")
    COMPANY = os.getenv("DEMO3_COMPANY", "㈱ジェイ・ティー・エヌ")

    @classmethod
    def to_dict(cls):
        """辞書形式で返す"""
        return {
            "工事名": cls.PROJECT_NAME,
            "施工会社": cls.COMPANY,
        }
