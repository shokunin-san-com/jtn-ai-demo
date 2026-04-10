# KYKシートデモ — Issue詳細（#1-1 〜 #1-8）

---

## Issue #1-1: KYKテンプレートをリポジトリに配置＋結合セルの完全調査

### ブランチ名
`feature/1-1-kyk-template`

### やること
1. JTN実データからKYKテンプレートをコピー
2. 結合セル・列幅・行高の完全マップを作成（コメントとしてコードに残す）

### 手順

**Step 1: 結合セルの完全調査**
※テンプレートは `demo1_kyk/templates/KYKシート.xlsx` にコミット済み
以下のスクリプトを実行して結果を確認する。
```python
import openpyxl

wb = openpyxl.load_workbook('demo1_kyk/templates/KYKシート.xlsx')
ws = wb['作業日報・KYK']

print("=== 結合セル一覧 ===")
for merged in sorted(ws.merged_cells.ranges, key=lambda x: (x.min_row, x.min_col)):
    print(f"  {merged}")

print("\n=== 全セルの値と座標 ===")
for row in ws.iter_rows(min_row=1, max_row=41, max_col=23, values_only=False):
    for cell in row:
        if cell.value is not None:
            print(f"  {cell.coordinate} ({cell.column_letter}{cell.row}): [{type(cell.value).__name__}] {str(cell.value)[:80]}")

print("\n=== 列幅 ===")
for col_letter in 'ABCDEFGHIJKLMNOPQRSTUVW':
    w = ws.column_dimensions[col_letter].width
    if w:
        print(f"  {col_letter}: {w}")

print("\n=== 行高 ===")
for r in range(1, 42):
    h = ws.row_dimensions[r].height
    if h:
        print(f"  Row {r}: {h}")
```

**Step 3: 調査結果をcell_map.pyとしてコミット**

`demo1_kyk/cell_map.py` を作成。中身は調査結果をもとに以下の形式で記述:

```python
"""KYKシートのセル配置マップ
テンプレート: templates/KYKシート.xlsx
シート名: 作業日報・KYK
"""

# === 書き込み対象セル ===
# ヘッダー部（マスターデータ）
CELLS_MASTER = {
    "現場名": "K1",          # 結合: K1:?? （調査結果で確定）
    "作業日時": "C2",        # 結合: C2:??
    "天候": "K2",            # 結合: ??
    "作業所長": "M2",
    "現場代理人": "Q2",
    "担当者": "U2",
    "元請会社": "C3",
    "次会社": "E3",
    "作業責任者": "Q3",      # ★結合範囲を調査で確定
    "施工会社": "C4",
    "作業責任者2": "H4",
}

# 作業内容（AI生成）
CELLS_WORK_CONTENT = {
    "①": "D5",
    "②": "D7",
    "③": "D9",
    "④": "D11",
}

# リスクアセスメント（AI生成の核心）
# ★以下の列番号は結合セル調査で確定させること
CELLS_RISK = {
    # リスク①
    "risk1_danger": {"row": 14, "col": ??},    # 予想される危険
    "risk1_possibility": {"row": 14, "col": ??}, # 可能性（×△○）
    "risk1_severity": {"row": 14, "col": ??},    # 重大性（×△○）
    "risk1_rating": {"row": 14, "col": ??},      # 評価
    "risk1_level": {"row": 14, "col": ??},        # 危険度（1-5）
    "risk1_measure": {"row": 14, "col": ??},      # 安全対策

    # リスク② row=16, リスク③ row=18 も同様
}

# 重点対策・安全指示
CELLS_SAFETY = {
    "重点対策": "A20",       # 結合: ??
    "安全指示": "A22",       # 結合: ??
}

# 作業員欄
CELLS_WORKERS = {
    "start_row": 23,  # K23から
    "end_row": 32,    # K32まで（最大10名）
    "name_col": ??,   # 調査で確定
    "health_col": ??,
    "temp_col": ??,
    "ppe_col": ??,
}
```

**※ `??` の部分は全てStep 2の調査結果で埋める。推測で書かない。**

### PRに含めるファイル
```
demo1_kyk/templates/KYKシート.xlsx  （テンプレートファイル）
demo1_kyk/cell_map.py              （セル配置マップ）
```

### OKの基準
- [ ] `templates/KYKシート.xlsx` がリポジトリにある
- [ ] `cell_map.py` の `??` が全てなくなっている（全セル位置が確定している）
- [ ] 結合セルの範囲が全て記載されている
- [ ] リスクアセスメント欄の列番号（可能性/重大性/評価/危険度/安全対策）が確定している
- [ ] 作業員欄の列番号が確定している

---

## Issue #1-2: マスターデータ定義

### ブランチ名
`feature/1-2-master-data`

### やること
JTNの案件情報・作業員情報を定数として定義するファイルを作る。

### 作成ファイル
`demo1_kyk/master_data.py`

```python
"""JTN 各ふ頭電力量計更新工事 マスターデータ
デモ用の固定値。本番ではDBまたは設定ファイルから読む想定。
"""

PROJECT = {
    "現場名": "各ふ頭電力量計更新工事",
    "元請会社": "㈱ジェイ・ティー・エヌ",
    "次会社区分": "元請",
    "作業所長": "",           # Phase 0ヒアリングで確認
    "現場代理人": "",         # Phase 0ヒアリングで確認
    "担当者": "安野 真",
    "作業責任者": "安野 真",
}

# デモ用サンプル作業員
WORKERS = [
    {
        "名前": "安野 真",
        "役割": "職長",
        "健康状態": "良好",
        "体温": "36.5",
        "保護具": "ヘルメット・安全帯・絶縁手袋",
        "資格": ["電気工事士1種", "低圧電気取扱"],
    },
    {
        "名前": "作業員A",
        "役割": "作業員",
        "健康状態": "良好",
        "体温": "36.3",
        "保護具": "ヘルメット・安全帯",
        "資格": ["電気工事士2種"],
    },
    # 実際のデモ時に追加
]

# 作業時間のデフォルト
DEFAULT_WORK_HOURS = {
    "開始": "8時00分",
    "終了": "17時00分",
}
```

### OKの基準
- [ ] `master_data.py` が作成されている
- [ ] `PROJECT` に必要なキーが全て定義されている
- [ ] `WORKERS` にサンプルデータが最低2名入っている
- [ ] Pythonとして `import master_data` でエラーなく読み込める

---

## Issue #1-3: Claude APIプロンプト設計＋API呼び出し

### ブランチ名
`feature/1-3-ai-generator`

### やること
Claude APIに作業内容を渡して、KYKシートの中身（リスク評価・安全対策）をJSON形式で返すモジュールを作る。

### 作成ファイル
`demo1_kyk/ai_generator.py`

### 実装の詳細

**1. システムプロンプト（以下をそのまま使う）:**

```python
SYSTEM_PROMPT = """あなたは電気工事のベテラン安全管理者です。
与えられた作業内容に基づいて、KYKシート（リスクアセスメント）の内容を生成してください。

# 出力形式
以下のJSON形式のみ出力してください。マークダウンのコードフェンスは不要です。

{
  "作業内容": [
    "①具体的な作業内容（例：大さん橋ふ頭 電力量計取替 3台）",
    "②具体的な作業内容",
    "③具体的な作業内容",
    "④具体的な作業内容"
  ],
  "リスク": [
    {
      "危険": "予想される危険の内容（具体的に）",
      "可能性": "×または△または○",
      "重大性": "×または△または○",
      "危険度": 2,
      "対策": "具体的な安全対策（2文以上）"
    },
    {
      "危険": "...",
      "可能性": "...",
      "重大性": "...",
      "危険度": 3,
      "対策": "..."
    },
    {
      "危険": "...",
      "可能性": "...",
      "重大性": "...",
      "危険度": 3,
      "対策": "..."
    }
  ],
  "重点対策": "本日の災害防止重点対策（2-3文）",
  "安全指示": "管理者からの安全指示事項（2-3文）"
}

# 制約
- リスクは必ず3件出力すること
- 電気工事特有のリスクを必ず1件以上含めること（感電、短絡、漏電等）
- 可能性: ×=高い / △=ある / ○=低い
- 重大性: ×=大きい / △=中程度 / ○=小さい
- 危険度: 1=最も危険 ～ 5=最も安全
- 対策は具体的に書くこと（「注意する」はNG、「検電器で確認後に作業開始」はOK）
- JSONのみ出力。前後に説明文や```を付けないこと"""
```

**2. API呼び出し関数:**

```python
import anthropic
import json
import os

def generate_kyk(work_description: str) -> dict:
    """
    作業内容の文字列を受け取り、KYKシートの内容をdictで返す。

    Args:
        work_description: 例「各ふ頭の電力量計交換作業」

    Returns:
        dict: システムプロンプトで定義したJSON構造

    Raises:
        ValueError: JSONパースに3回失敗した場合
    """
    client = anthropic.Anthropic()  # ANTHROPIC_API_KEY環境変数から

    user_message = (
        f"本日の作業: {work_description}\n"
        f"現場: 各ふ頭電力量計更新工事\n"
        f"施工会社: ㈱ジェイ・ティー・エヌ"
    )

    # 最大3回リトライ
    for attempt in range(3):
        try:
            message = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_message}]
            )

            text = message.content[0].text.strip()

            # ```json ... ``` が付いてた場合の除去
            if text.startswith("```"):
                text = text.split("\n", 1)[1]
            if text.endswith("```"):
                text = text.rsplit("```", 1)[0]
            text = text.strip()

            data = json.loads(text)

            # 必須キーの存在チェック
            assert "作業内容" in data, "作業内容キーがない"
            assert "リスク" in data, "リスクキーがない"
            assert len(data["リスク"]) == 3, f"リスクが3件ではない: {len(data['リスク'])}件"

            return data

        except (json.JSONDecodeError, AssertionError) as e:
            print(f"  リトライ {attempt+1}/3: {e}")
            if attempt == 2:
                raise ValueError(f"JSON生成に3回失敗: {e}")
```

**3. 動作確認用のif main:**

```python
if __name__ == "__main__":
    result = generate_kyk("各ふ頭の電力量計交換作業")
    print(json.dumps(result, ensure_ascii=False, indent=2))
```

### テスト方法
```bash
cd demo1_kyk
python ai_generator.py
```

### OKの基準
- [ ] `python ai_generator.py` を実行するとJSONが表示される
- [ ] リスクが3件出力される
- [ ] 各リスクに「危険」「可能性」「重大性」「危険度」「対策」が全て含まれる
- [ ] 電気工事特有のリスク（感電・短絡等）が1件以上含まれる
- [ ] 「重点対策」「安全指示」が含まれる
- [ ] 3回実行して3回ともJSONパースに成功する（安定性確認）
- [ ] APIキーがコードにハードコードされていない

---

## Issue #1-4: Excel書き込みモジュール

### ブランチ名
`feature/1-4-excel-writer`

### 前提
- #1-1 の `cell_map.py` が完成していること（セル位置が確定済み）
- #1-2 の `master_data.py` が完成していること

### やること
Claude APIの出力（dict）を受け取って、JTNのKYKテンプレートに書き込むモジュールを作る。

### 作成ファイル
`demo1_kyk/excel_writer.py`

### 実装の詳細

```python
"""KYKテンプレートにAI生成データを書き込む"""
import openpyxl
import shutil
from datetime import datetime
from cell_map import CELLS_MASTER, CELLS_WORK_CONTENT, CELLS_RISK, CELLS_SAFETY, CELLS_WORKERS
from master_data import PROJECT, WORKERS, DEFAULT_WORK_HOURS

TEMPLATE_PATH = "templates/KYKシート.xlsx"
SHEET_NAME = "作業日報・KYK"

def write_kyk(ai_data: dict, output_path: str, weather: str = "晴れ"):
    """
    AI生成データをKYKテンプレートに書き込んでExcelを出力する。

    Args:
        ai_data: ai_generator.generate_kyk()の戻り値
        output_path: 出力ファイルパス（例: "output/KYK_20260410.xlsx"）
        weather: 天候（デフォルト: "晴れ"）
    """
    # テンプレートをコピー（元ファイルを壊さない）
    shutil.copy2(TEMPLATE_PATH, output_path)
    wb = openpyxl.load_workbook(output_path)
    ws = wb[SHEET_NAME]

    # 1. マスターデータの書き込み
    _write_master(ws)

    # 2. 日付・時間・天候
    _write_datetime(ws, weather)

    # 3. 作業内容（AI生成）
    _write_work_content(ws, ai_data)

    # 4. リスクアセスメント（AI生成の核心）
    _write_risks(ws, ai_data)

    # 5. 重点対策・安全指示（AI生成）
    _write_safety(ws, ai_data)

    # 6. 作業員情報
    _write_workers(ws)

    wb.save(output_path)


def _write_master(ws):
    """マスターデータ（現場名・担当者等）を書き込む"""
    ws[CELLS_MASTER["現場名"]] = PROJECT["現場名"]
    ws[CELLS_MASTER["元請会社"]] = PROJECT["元請会社"]
    ws[CELLS_MASTER["担当者"]] = PROJECT["担当者"]
    ws[CELLS_MASTER["作業責任者"]] = PROJECT["作業責任者"]
    ws[CELLS_MASTER["施工会社"]] = PROJECT["元請会社"]
    # その他のマスター項目も同様


def _write_datetime(ws, weather: str):
    """日付・時間・天候を書き込む"""
    now = datetime.now()
    weekday = "月火水木金土日"[now.weekday()]
    reiwa_year = now.year - 2018
    date_str = (
        f"令和{reiwa_year}年{now.month}月{now.day}日（{weekday}）"
        f"{DEFAULT_WORK_HOURS['開始']}～{DEFAULT_WORK_HOURS['終了']}"
    )
    ws[CELLS_MASTER["作業日時"]] = date_str
    ws[CELLS_MASTER["天候"]] = weather


def _write_work_content(ws, ai_data: dict):
    """作業内容①〜④を書き込む"""
    contents = ai_data.get("作業内容", [])
    for key, cell_addr in CELLS_WORK_CONTENT.items():
        idx = int(key.replace("①","0").replace("②","1").replace("③","2").replace("④","3"))
        if idx < len(contents):
            ws[cell_addr] = contents[idx]


def _write_risks(ws, ai_data: dict):
    """リスクアセスメント①〜③を書き込む

    ★ここが最も注意が必要。
    cell_map.pyのCELLS_RISKで定義した行・列番号を使う。
    結合セルの左上セルにのみ書き込むこと。
    """
    risks = ai_data.get("リスク", [])
    risk_keys = ["risk1", "risk2", "risk3"]

    for i, prefix in enumerate(risk_keys):
        if i >= len(risks):
            break
        risk = risks[i]

        ws.cell(
            row=CELLS_RISK[f"{prefix}_danger"]["row"],
            column=CELLS_RISK[f"{prefix}_danger"]["col"],
            value=risk["危険"]
        )
        ws.cell(
            row=CELLS_RISK[f"{prefix}_possibility"]["row"],
            column=CELLS_RISK[f"{prefix}_possibility"]["col"],
            value=risk["可能性"]
        )
        ws.cell(
            row=CELLS_RISK[f"{prefix}_severity"]["row"],
            column=CELLS_RISK[f"{prefix}_severity"]["col"],
            value=risk["重大性"]
        )
        ws.cell(
            row=CELLS_RISK[f"{prefix}_level"]["row"],
            column=CELLS_RISK[f"{prefix}_level"]["col"],
            value=risk["危険度"]
        )
        ws.cell(
            row=CELLS_RISK[f"{prefix}_measure"]["row"],
            column=CELLS_RISK[f"{prefix}_measure"]["col"],
            value=risk["対策"]
        )


def _write_safety(ws, ai_data: dict):
    """重点対策・安全指示を書き込む"""
    ws[CELLS_SAFETY["重点対策"]] = ai_data.get("重点対策", "")
    ws[CELLS_SAFETY["安全指示"]] = ai_data.get("安全指示", "")


def _write_workers(ws):
    """作業員情報を書き込む"""
    start_row = CELLS_WORKERS["start_row"]
    for i, worker in enumerate(WORKERS):
        if i >= (CELLS_WORKERS["end_row"] - start_row + 1):
            break
        row = start_row + i
        ws.cell(row=row, column=CELLS_WORKERS["name_col"], value=worker["名前"])
        ws.cell(row=row, column=CELLS_WORKERS["health_col"], value=worker["健康状態"])
        ws.cell(row=row, column=CELLS_WORKERS["temp_col"], value=worker["体温"])
        ws.cell(row=row, column=CELLS_WORKERS["ppe_col"], value=worker["保護具"])


if __name__ == "__main__":
    # テスト用ダミーデータ
    test_data = {
        "作業内容": [
            "①大さん橋ふ頭 電力量計取替 3台",
            "②配線確認・絶縁抵抗測定",
            "③養生・清掃",
            "④作業報告書作成"
        ],
        "リスク": [
            {"危険": "充電部接触による感電", "可能性": "△", "重大性": "×", "危険度": 2, "対策": "検電確認後に作業開始。絶縁手袋・絶縁工具を使用。"},
            {"危険": "脚立からの墜落", "可能性": "△", "重大性": "△", "危険度": 3, "対策": "脚立は水平な場所に設置。2人1組で作業。"},
            {"危険": "短絡による火傷", "可能性": "○", "重大性": "×", "危険度": 3, "対策": "ブレーカーOFF確認。絶縁テープで養生。消火器配置。"},
        ],
        "重点対策": "電力量計交換時の感電防止を最重点とする。必ず検電確認を実施。",
        "安全指示": "暑熱環境が予想されるため、こまめな水分補給と休憩を確保すること。",
    }
    write_kyk(test_data, "output/test_kyk.xlsx")
    print("出力: output/test_kyk.xlsx")
```

### テスト方法
```bash
cd demo1_kyk
python excel_writer.py
# → output/test_kyk.xlsx が生成される
# → Excelで開いて、元のテンプレートとレイアウトが同じか確認
# → 書き込んだ値が正しいセルに入っているか確認
```

### OKの基準
- [ ] `python excel_writer.py` でExcelが出力される
- [ ] 出力Excelを開いて、元のKYKシートとレイアウト（罫線・結合・フォント）が崩れていない
- [ ] マスターデータ（現場名・担当者等）が正しいセルに入っている
- [ ] 日付が当日の日付（令和8年○月○日）で入っている
- [ ] 作業内容①〜④が正しいセルに入っている
- [ ] リスク評価3件がそれぞれ正しいセルに入っている（危険・可能性・重大性・危険度・対策）
- [ ] 重点対策・安全指示が入っている
- [ ] 作業員情報が入っている
- [ ] 空のセルに余計な値が入っていない

---

## Issue #1-5: main.py（CLI統合）

### ブランチ名
`feature/1-5-kyk-main`

### 前提
- #1-3 `ai_generator.py` が完成していること
- #1-4 `excel_writer.py` が完成していること

### やること
コマンドラインから作業内容を渡すと、AI生成→Excel出力まで一気通貫で動くスクリプトを作る。

### 作成ファイル
`demo1_kyk/main.py`

```python
"""KYKシート自動生成デモ
使い方: python main.py "電力量計交換作業"
"""
import sys
import os
import time
from datetime import datetime
from ai_generator import generate_kyk
from excel_writer import write_kyk

def main():
    # 引数チェック
    if len(sys.argv) > 1:
        work = " ".join(sys.argv[1:])
    else:
        work = "各ふ頭の電力量計交換作業"

    print(f"{'='*50}")
    print(f"KYKシート自動生成デモ")
    print(f"{'='*50}")
    print(f"作業内容: {work}")
    print()

    # AI生成
    print("🤖 AIでリスク評価を生成中...")
    start = time.time()
    data = generate_kyk(work)
    elapsed = time.time() - start
    print(f"✅ 生成完了 ({elapsed:.1f}秒)")
    print(f"   リスク: {len(data['リスク'])}件")
    for i, risk in enumerate(data['リスク']):
        print(f"   ①②③"[i*1:(i+1)*1] + f" {risk['危険'][:30]}... (危険度{risk['危険度']})")
    print()

    # Excel出力
    os.makedirs("output", exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = f"output/KYK_{timestamp}.xlsx"

    print(f"📝 Excel出力中...")
    write_kyk(data, output_path)
    total = time.time() - start
    print(f"✅ 完了！ ({total:.1f}秒)")
    print(f"📂 ファイル: {output_path}")
    print()
    print(f"従来: 15〜30分 → AI: {total:.0f}秒")

if __name__ == "__main__":
    main()
```

### テスト方法
```bash
cd demo1_kyk

# テスト1: デフォルト引数
python main.py

# テスト2: 引数指定
python main.py "高所での配線工事"

# テスト3: 別の作業
python main.py "受変電設備の点検作業"
```

### OKの基準
- [ ] 3つのテストコマンドが全てエラーなく完了する
- [ ] それぞれ異なるリスクが生成される（同じ内容にならない）
- [ ] 出力されたExcelを開いてフォーマットが崩れていない
- [ ] 実行時間の表示が出る
- [ ] 絵文字付きのログが表示される（デモ映え用）

---

## Issue #1-6: 作業内容バリエーションテスト

### ブランチ名
`feature/1-6-kyk-test`

### やること
5パターンの作業内容で実行して、生成品質を確認する。問題があればプロンプトを調整する。

### テストケース
```bash
python main.py "電力量計交換作業（大さん橋ふ頭）"
python main.py "高所での照明器具取替作業"
python main.py "受変電設備の年次点検"
python main.py "地中配管の配線引き込み作業"
python main.py "分電盤の増設工事"
```

### 確認ポイント（各テストで）
1. JSONパースが成功するか
2. リスクが3件出力されるか
3. 電気工事特有のリスクが含まれるか
4. 対策が具体的か（「注意する」ではなく具体的な行動）
5. 作業内容①〜④が入力に対して適切か

### プロンプト調整が必要な場合
`ai_generator.py` の `SYSTEM_PROMPT` を修正する。
修正した場合、修正内容と理由をPRの説明に書くこと。

### OKの基準
- [ ] 5パターン全てエラーなく完了
- [ ] 5パターンのExcelを全て確認し、レイアウト崩れがない
- [ ] リスクの内容が作業に対して適切（明らかに変なリスクがない）
- [ ] プロンプト調整が必要だった場合、修正内容がPRに記載されている

---

## Issue #1-7: エラーハンドリング強化

### ブランチ名
`feature/1-7-kyk-error-handling`

### やること
デモ本番で落ちないようにエラーハンドリングを追加する。

### 対応するエラーケース
1. **APIキー未設定**: `ANTHROPIC_API_KEY` がない場合、わかりやすいエラーメッセージ
2. **API呼び出し失敗**: ネットワークエラー等の場合、リトライ＋メッセージ
3. **テンプレートファイル不在**: `templates/KYKシート.xlsx` がない場合
4. **出力先ディレクトリ作成失敗**: 権限エラー等

### 実装方針
main.pyの `main()` を `try-except` で囲む。各モジュールは個別のエラーを適切にraiseする。

### OKの基準
- [ ] APIキーを削除した状態で実行→「ANTHROPIC_API_KEYを設定してください」と表示
- [ ] テンプレートファイルを削除した状態で実行→「テンプレートが見つかりません」と表示
- [ ] 正常系は引き続き動作する

---

## Issue #1-8: デモ録画

### ブランチ名
なし（録画タスクなのでコード変更なし）

### やること
1. ターミナルを全画面で開く
2. `python main.py "電力量計交換作業"` を実行
3. 生成されたExcelと元のKYKテンプレートを並べて表示
4. 録画をLoom等で保存

### 録画の構成（3分以内）
```
0:00 - 0:15  タイトル：「KYKシート自動生成デモ」
0:15 - 0:30  元のKYKテンプレートを見せる（「これを毎朝15-30分かけて手入力」）
0:30 - 1:00  python main.py を実行（「AIで自動生成します」）
1:00 - 2:00  生成されたExcelを開いて中身を確認
2:00 - 2:30  元のテンプレートと並べて比較
2:30 - 3:00  まとめ（「30分→30秒」）
```

### OKの基準
- [ ] 録画が3分以内
- [ ] 元テンプレートとの比較がある
- [ ] 時間短縮の効果が画面で伝わる
- [ ] 千葉がレビューしてOKを出す
