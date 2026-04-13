"""テンプレート破壊リスク調査 API エンドポイント

openpyxlで各Excelテンプレートを読み込み、
条件付き書式・データ入力規則・画像・印刷設定・VBAマクロの有無を調査して返す。
Issue #26: openpyxlによるマクロ・条件付き書式・画像の破壊リスク調査
"""

from http.server import BaseHTTPRequestHandler
import json
import os
import glob as glob_mod

import openpyxl


def _paper_size_name(code):
    """用紙サイズコードを日本語名に変換"""
    names = {
        0: "未設定",
        1: "Letter",
        5: "Legal",
        8: "A3",
        9: "A4",
        10: "A4 小",
        11: "A5",
        12: "B4 (JIS)",
        13: "B5 (JIS)",
    }
    return names.get(code, f"コード{code}")


def _orientation_name(orient):
    """印刷方向を日本語名に変換"""
    if orient == "landscape":
        return "横"
    if orient == "portrait":
        return "縦"
    return str(orient) if orient else "未設定"


def _inspect_worksheet(ws):
    """ワークシート1枚の調査結果を辞書で返す"""
    # 条件付き書式
    cf_list = []
    for cf in ws.conditional_formatting:
        rules = []
        for rule in cf.rules:
            rules.append({
                "type": rule.type,
                "priority": rule.priority,
                "formula": list(rule.formula) if rule.formula else [],
            })
        cf_list.append({
            "range": str(cf),
            "rules": rules,
        })

    # データ入力規則
    dv_list = []
    if ws.data_validations and ws.data_validations.dataValidation:
        for dv in ws.data_validations.dataValidation:
            dv_list.append({
                "range": str(dv.sqref),
                "type": dv.type or "なし",
                "formula1": str(dv.formula1) if dv.formula1 else None,
                "allow_blank": dv.allow_blank,
            })

    # 画像
    images = []
    for img in ws._images:
        images.append({
            "size": f"{img.width}x{img.height}",
            "anchor": str(img.anchor) if hasattr(img, "anchor") else "不明",
        })

    # 印刷設定
    ps = ws.page_setup
    print_settings = {
        "paper_size": _paper_size_name(ps.paperSize) if ps.paperSize else "未設定",
        "orientation": _orientation_name(ps.orientation),
        "fit_to_width": ps.fitToWidth,
        "fit_to_height": ps.fitToHeight,
        "scale": ps.scale,
        "print_area": ws.print_area or "未設定",
    }

    # 余白
    margins = None
    if ws.page_margins:
        m = ws.page_margins
        margins = {
            "top": m.top,
            "bottom": m.bottom,
            "left": m.left,
            "right": m.right,
            "header": m.header,
            "footer": m.footer,
        }

    # セル結合
    merged = [str(r) for r in ws.merged_cells.ranges]

    return {
        "sheet_name": ws.title,
        "dimensions": ws.dimensions,
        "conditional_formatting": cf_list,
        "data_validations": dv_list,
        "images": images,
        "print_settings": print_settings,
        "margins": margins,
        "merged_cells_count": len(merged),
        "merged_cells_sample": merged[:10],
    }


def _inspect_template(filepath):
    """Excelテンプレート1ファイルの調査結果を辞書で返す"""
    filename = os.path.basename(filepath)
    is_xlsm = filename.lower().endswith(".xlsm")

    try:
        wb = openpyxl.load_workbook(filepath, data_only=False)
    except Exception as e:
        return {
            "filename": filename,
            "error": str(e),
        }

    has_vba = wb.vba_archive is not None

    sheets = []
    for ws in wb.worksheets:
        sheets.append(_inspect_worksheet(ws))

    # リスク判定
    risks = []
    total_cf = sum(len(s["conditional_formatting"]) for s in sheets)
    total_dv = sum(len(s["data_validations"]) for s in sheets)
    total_img = sum(len(s["images"]) for s in sheets)

    if has_vba:
        risks.append({
            "category": "VBAマクロ",
            "level": "high",
            "detail": "VBAマクロが含まれています。openpyxlで保存すると削除されます。",
            "mitigation": ".xlsmファイルはopenpyxlのkeep_vba=Trueで開くか、xlwingsを使用する。",
        })
    if total_cf > 0:
        risks.append({
            "category": "条件付き書式",
            "level": "medium",
            "detail": f"{total_cf}件の条件付き書式があります。openpyxlは基本的な条件付き書式を保持しますが、複雑なものは破壊される可能性があります。",
            "mitigation": "保存前後でExcelで開いて目視確認する。書き込み対象セル範囲外なら影響なし。",
        })
    if total_dv > 0:
        risks.append({
            "category": "データ入力規則",
            "level": "medium",
            "detail": f"{total_dv}件のデータ入力規則があります。openpyxlは基本的に保持しますが、複雑な数式参照は破壊される場合があります。",
            "mitigation": "ドロップダウンリストの参照先を確認し、保存後も維持されるかテストする。",
        })
    if total_img > 0:
        risks.append({
            "category": "埋め込み画像",
            "level": "high",
            "detail": f"{total_img}件の画像があります。openpyxlで保存すると位置ズレや消失の可能性があります。",
            "mitigation": "画像を含むシートへの書き込みを避けるか、書き込み後に画像を再配置するロジックを追加する。",
        })
    if is_xlsm:
        risks.append({
            "category": "ファイル形式",
            "level": "medium",
            "detail": ".xlsmファイルです。openpyxlで.xlsxとして保存するとマクロが失われます。",
            "mitigation": "keep_vba=Trueオプションを使用し、.xlsm形式で保存する。",
        })

    if not risks:
        risks.append({
            "category": "全般",
            "level": "low",
            "detail": "VBAマクロ・条件付き書式・データ入力規則・画像いずれも検出されませんでした。openpyxlでの読み書きは安全と判断されます。",
            "mitigation": "特別な対策は不要。印刷設定のみ保存後に確認推奨。",
        })

    # 総合リスクレベル
    levels = [r["level"] for r in risks]
    if "high" in levels:
        overall_risk = "high"
    elif "medium" in levels:
        overall_risk = "medium"
    else:
        overall_risk = "low"

    wb.close()

    return {
        "filename": filename,
        "file_extension": os.path.splitext(filename)[1],
        "has_vba": has_vba,
        "sheet_count": len(sheets),
        "sheets": sheets,
        "risks": risks,
        "overall_risk": overall_risk,
        "summary": {
            "conditional_formatting_count": total_cf,
            "data_validations_count": total_dv,
            "images_count": total_img,
            "merged_cells_count": sum(s["merged_cells_count"] for s in sheets),
        },
    }


def _find_templates():
    """templatesディレクトリ内のExcelファイルを検索"""
    base = os.path.join(os.path.dirname(__file__), "..", "templates")
    base = os.path.abspath(base)
    patterns = [
        os.path.join(base, "**", "*.xlsx"),
        os.path.join(base, "**", "*.xlsm"),
    ]
    files = []
    for pat in patterns:
        files.extend(glob_mod.glob(pat, recursive=True))
    return sorted(files)


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        templates = _find_templates()

        results = []
        for tpl in templates:
            # demo番号を判定
            rel = os.path.relpath(tpl, os.path.join(os.path.dirname(__file__), "..", "templates"))
            demo = rel.split(os.sep)[0] if os.sep in rel else "other"
            result = _inspect_template(tpl)
            result["demo"] = demo
            results.append(result)

        # 全体サマリー
        high_count = sum(1 for r in results if r.get("overall_risk") == "high")
        medium_count = sum(1 for r in results if r.get("overall_risk") == "medium")
        low_count = sum(1 for r in results if r.get("overall_risk") == "low")

        response = {
            "total_templates": len(results),
            "overall_summary": {
                "high_risk": high_count,
                "medium_risk": medium_count,
                "low_risk": low_count,
            },
            "templates": results,
        }

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(json.dumps(response, ensure_ascii=False, default=str).encode())
