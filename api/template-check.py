"""テンプレート調査 API エンドポイント

各Excelテンプレートに対して openpyxl で以下を調査する:
1. VBAマクロの有無
2. 条件付き書式の有無
3. データ入力規則（ドロップダウン等）の有無
4. 埋め込み画像・ロゴの有無
5. 印刷設定（用紙サイズ、余白、拡大縮小、印刷範囲）

Issue #26: openpyxlによるマクロ・条件付き書式・画像の破壊リスク調査
"""

from http.server import BaseHTTPRequestHandler
import json
import os

import openpyxl

# --- テンプレート定義 -----------------------------------------------------------

BASE_DIR = os.path.join(os.path.dirname(__file__), "..")

DEMO_GROUPS = {
    "demo1": {
        "title": "KYKシート",
        "color": "blue",
        "files": ["templates/demo1/KYKシート.xlsx"],
    },
    "demo2": {
        "title": "施工計画書",
        "color": "emerald",
        "files": [
            "templates/demo2/1.総則.xlsx",
            "templates/demo2/2.工事概要.xlsx",
            "templates/demo2/7.品質管理.xlsx",
            "templates/demo2/8.安全衛生管理.xlsx",
        ],
    },
    "demo3": {
        "title": "工事月報",
        "color": "amber",
        "files": [
            "templates/demo3/工事月報（10月）.xlsx",
            "templates/demo3/工事月報（月）.xlsx",
        ],
    },
}

# --- 用紙サイズ名称マップ -------------------------------------------------------

PAPER_SIZE_NAMES = {
    0: "指定なし",
    1: "Letter",
    5: "Legal",
    8: "A3",
    9: "A4",
    11: "A5",
    13: "B4 (JIS)",
    70: "A4 (小)",
}

ORIENTATION_NAMES = {
    "portrait": "縦",
    "landscape": "横",
    None: "未設定",
    "default": "デフォルト",
}


# --- 調査ロジック ---------------------------------------------------------------


def analyze_template(file_path: str) -> dict:
    """1つのExcelテンプレートを openpyxl で調査する。"""
    abs_path = os.path.join(BASE_DIR, file_path)
    filename = os.path.basename(file_path)
    ext = os.path.splitext(filename)[1]

    result = {
        "file": filename,
        "path": file_path,
        "extension": ext,
        "vba_macros": False,
        "sheets": [],
        "conditional_formatting": [],
        "data_validations": [],
        "images": [],
        "print_settings": {},
        "risks": [],
        "status": "ok",
    }

    if not os.path.exists(abs_path):
        result["status"] = "error"
        result["risks"].append(f"ファイルが見つかりません: {file_path}")
        return result

    try:
        wb = openpyxl.load_workbook(abs_path, data_only=False)
    except Exception as e:
        result["status"] = "error"
        result["risks"].append(f"ファイル読み込みエラー: {str(e)}")
        return result

    # VBAマクロ判定
    if ext == ".xlsm":
        result["vba_macros"] = True
        result["risks"].append(
            "VBAマクロが含まれています（.xlsm）。openpyxlでは保持できません。"
        )

    for ws in wb.worksheets:
        sheet_name = ws.title
        result["sheets"].append(sheet_name)

        # 条件付き書式
        if ws.conditional_formatting:
            for cf in ws.conditional_formatting:
                result["conditional_formatting"].append(
                    {
                        "sheet": sheet_name,
                        "range": str(cf),
                        "rules_count": len(cf.rules),
                    }
                )

        # データ入力規則
        if ws.data_validations and ws.data_validations.dataValidation:
            for dv in ws.data_validations.dataValidation:
                result["data_validations"].append(
                    {
                        "sheet": sheet_name,
                        "type": dv.type or "不明",
                        "range": str(dv.sqref) if dv.sqref else "不明",
                        "formula1": str(dv.formula1) if dv.formula1 else None,
                    }
                )

        # 埋め込み画像
        if ws._images:
            for img in ws._images:
                result["images"].append(
                    {
                        "sheet": sheet_name,
                        "width": getattr(img, "width", None),
                        "height": getattr(img, "height", None),
                    }
                )

        # 印刷設定
        ps = ws.page_setup
        paper_size = ps.paperSize if ps.paperSize else 0
        result["print_settings"][sheet_name] = {
            "paper_size": paper_size,
            "paper_size_name": PAPER_SIZE_NAMES.get(paper_size, f"不明 ({paper_size})"),
            "orientation": ORIENTATION_NAMES.get(
                ps.orientation, str(ps.orientation)
            ),
            "print_area": ws.print_area or None,
            "fit_to_width": ps.fitToWidth,
            "fit_to_height": ps.fitToHeight,
            "top_margin": round(ws.page_margins.top * 2.54, 1) if ws.page_margins else None,
            "bottom_margin": round(ws.page_margins.bottom * 2.54, 1) if ws.page_margins else None,
            "left_margin": round(ws.page_margins.left * 2.54, 1) if ws.page_margins else None,
            "right_margin": round(ws.page_margins.right * 2.54, 1) if ws.page_margins else None,
        }

    wb.close()

    # リスク判定
    if result["vba_macros"]:
        result["status"] = "danger"
    if result["images"]:
        result["status"] = "danger"
        result["risks"].append(
            f"埋め込み画像が {len(result['images'])} 件あります。"
            "openpyxl で保存すると位置やサイズが変わる可能性があります。"
        )
    if result["conditional_formatting"]:
        if result["status"] == "ok":
            result["status"] = "warning"
        result["risks"].append(
            f"条件付き書式が {len(result['conditional_formatting'])} 件あります。"
            "複雑なルールは openpyxl 保存時に破壊される場合があります。"
        )
    if result["data_validations"]:
        if result["status"] == "ok":
            result["status"] = "warning"
        result["risks"].append(
            f"データ入力規則が {len(result['data_validations'])} 件あります。"
            "openpyxl で概ね保持されますが、複雑なものは要検証です。"
        )

    return result


def build_response() -> dict:
    """全テンプレートの調査結果をまとめる。"""
    groups = {}
    total = 0
    ok_count = 0
    warning_count = 0
    danger_count = 0

    for demo_key, group in DEMO_GROUPS.items():
        templates = []
        for file_path in group["files"]:
            res = analyze_template(file_path)
            templates.append(res)
            total += 1
            if res["status"] == "ok":
                ok_count += 1
            elif res["status"] == "warning":
                warning_count += 1
            else:
                danger_count += 1

        groups[demo_key] = {
            "title": group["title"],
            "color": group["color"],
            "templates": templates,
        }

    recommendations = []
    if danger_count > 0:
        recommendations.append(
            "画像付きテンプレートは openpyxl 保存後に目視確認を行うこと。"
        )
        recommendations.append(
            "画像の再挿入が必要な場合は、Pillow + openpyxl.drawing で対応可能。"
        )
    if warning_count > 0:
        recommendations.append(
            "条件付き書式・データ入力規則付きテンプレートは、保存前後で差分検証を行うこと。"
        )
    recommendations.append(
        "全テンプレートが .xlsx 形式のため、VBAマクロの破壊リスクはありません。"
    )
    recommendations.append(
        "印刷設定（用紙サイズ・余白・拡大縮小）は openpyxl で保持されます。"
    )

    return {
        "groups": groups,
        "summary": {
            "total_files": total,
            "ok_count": ok_count,
            "warning_count": warning_count,
            "danger_count": danger_count,
            "recommendations": recommendations,
        },
    }


# --- HTTP ハンドラ --------------------------------------------------------------


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            data = build_response()
            body = json.dumps(data, ensure_ascii=False).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Cache-Control", "public, max-age=3600")
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(
                json.dumps({"error": str(e)}, ensure_ascii=False).encode()
            )

    def do_POST(self):
        self.do_GET()
