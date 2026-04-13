# 施工計画書デモ — Issue詳細（#2-1 〜 #2-8）

**※ KYKシートデモ（#1-1〜#1-8）が全て完了してから着手**

---

## Issue #2-1: 施工計画書テンプレート配置＋全章セル構造調査

### ブランチ名
`feature/2-1-sekou-template`

### やること
1. 対象4章のExcelテンプレートをコピー
2. 赤レンガ倉庫の参考データもコピー
3. 4章全てのセル構造を完全調査

### 手順

**Step 1: 全章のセル構造調査**
※テンプレート・参考データは `demo2_sekou_keikaku/templates/` `demo2_sekou_keikaku/reference/` にコミット済み

以下のスクリプトを4ファイル全てに対して実行。
```python
import openpyxl, sys

path = sys.argv[1]
wb = openpyxl.load_workbook(path, data_only=True)
for sn in wb.sheetnames:
    ws = wb[sn]
    print(f"\n=== Sheet: {sn} ({ws.max_row}行 x {ws.max_column}列) ===")
    print(f"結合: {list(ws.merged_cells.ranges)}")
    for row in ws.iter_rows(values_only=False):
        for cell in row:
            if cell.value is not None:
                print(f"  {cell.coordinate}: {str(cell.value)[:100]}")
```

```bash
python inspect.py demo2_sekou_keikaku/templates/1.総則.xlsx > cell_map_ch1.txt
python inspect.py demo2_sekou_keikaku/templates/2.工事概要.xlsx > cell_map_ch2.txt
python inspect.py demo2_sekou_keikaku/templates/7.品質管理.xlsx > cell_map_ch7.txt
python inspect.py demo2_sekou_keikaku/templates/8.安全衛生管理.xlsx > cell_map_ch8.txt
```

**Step 3: cell_map.pyを作成**

KYKシートの #1-1 と同じ要領で、4章分のセル配置マップを作成。

### PRに含めるファイル
```
demo2_sekou_keikaku/templates/1.総則.xlsx
demo2_sekou_keikaku/templates/2.工事概要.xlsx
demo2_sekou_keikaku/templates/7.品質管理.xlsx
demo2_sekou_keikaku/templates/8.安全衛生管理.xlsx
demo2_sekou_keikaku/reference/（赤レンガ倉庫データ）
demo2_sekou_keikaku/cell_map.py
```

### OKの基準
- [ ] 4つのテンプレートExcelがリポジトリにある
- [ ] 赤レンガ倉庫の参考データがreferenceフォルダにある
- [ ] cell_map.pyに4章全てのセル配置が記載されている
- [ ] 書き換え対象セル（工事名・場所・工期等）が明確にマークされている

---

## Issue #2-2: 過去案件テキスト抽出モジュール

### ブランチ名
`feature/2-2-reference-loader`

### やること
赤レンガ倉庫の施工計画書をテキスト抽出して、Claude APIのコンテキストとして使えるようにする。

### 作成ファイル
`demo2_sekou_keikaku/reference_loader.py`

### 実装ポイント
- openpyxlでExcelの全セルをテキスト化
- 1章あたり2000文字程度に要約（Claude APIのトークン節約）
- 長すぎる場合は「見出し + 最初の数行」だけ抽出

### OKの基準
- [ ] `python reference_loader.py` で赤レンガ倉庫の全章テキストが表示される
- [ ] 各章のテキストが2000文字以内に収まっている
- [ ] 重要な情報（見出し、キーフレーズ）が残っている

---

## Issue #2-3: 案件情報入力モジュール

### ブランチ名
`feature/2-3-project-input`

### 作成ファイル
`demo2_sekou_keikaku/project_input.py`

### 内容
KYKの `master_data.py` と同じ方針。デモ用にハードコードした案件情報。

```python
PROJECT_INFO = {
    "工事名": "各ふ頭電力量計更新工事",
    "工事場所": "横浜市各ふ頭",
    "発注者": "横浜市港湾局",
    "工期_着手": "令和7年6月30日",
    "工期_完成": "令和8年1月30日",
    "工種": "電力量計更新（積算電力量計の取替）",
    "施工会社": "㈱ジェイ・ティー・エヌ",
    "現場代理人": "安野 真",
    "契約金額": "2,450,000円",
}
```

### OKの基準
- [ ] `import project_input` でエラーなく読み込める
- [ ] 必要な全キーが定義されている

---

## Issue #2-4: Claude API章別生成モジュール

### ブランチ名
`feature/2-4-sekou-ai-generator`

### 作成ファイル
`demo2_sekou_keikaku/ai_generator.py`

### 実装ポイント
- 章ごとにAPI呼び出しを分ける（1章=1 API call）
- 過去案件テキストをコンテキストに含める
- JSON形式で各章の書き換え内容を返す

### 各章のプロンプト設計方針

**第1章 総則**: 工事名の差し替え + 発注者に応じた適用図書リストの更新
**第2章 工事概要**: 工事場所・工期・工種の反映
**第7章 品質管理**: 工種に応じた管理項目・管理基準の生成
**第8章 安全衛生**: 工種に応じた安全対策（電気工事特有のリスク）

### OKの基準
- [ ] 4章それぞれの `generate_chapter_X()` 関数が動作する
- [ ] 各関数がJSONをdictで返す
- [ ] 返り値に必要なキーが含まれている
- [ ] 3回実行して安定動作

---

## Issue #2-5: Excel書き込みモジュール（4章分）

### ブランチ名
`feature/2-5-sekou-excel-writer`

### 前提
- #2-1 の cell_map.py が完成していること
- #2-4 のAI生成結果の形式が確定していること

### 作成ファイル
`demo2_sekou_keikaku/excel_writer.py`

### 実装方針
- KYKシートの #1-4 と同じアプローチ
- テンプレートをコピー→書き換え対象セルのみ上書き
- 4章それぞれに `write_chapter_X()` 関数を作る

### OKの基準

#### Excel出力・データ品質
- [ ] ダミーデータでExcel出力ができる
- [ ] 4つのExcelが出力される
- [ ] 各Excelのレイアウトが元テンプレートと同じ
- [ ] 書き換え箇所に新しいデータが入っている
- [ ] 書き換え対象外のセルが変わっていない

#### 印刷レイアウト検証
- [ ] 4つのExcel全てを A4縦で印刷プレビュー
  - [ ] 第1章（総則）: 1-2ページに収まる
  - [ ] 第2章（工事概要）: 1ページに収まる
  - [ ] 第7章（品質管理）: 1ページに収まる
  - [ ] 第8章（安全衛生管理）: 1-2ページに収まる
- [ ] 各Excelで余白・スケーリングが元テンプレートと同じ設定
- [ ] 印刷時に表の枠線が残っている（背景色も保持）
- [ ] テーブル内の文字が切れていない（必要に応じて行高の調整）
- [ ] ページの上下左右に不要な空白がない（デザイン意図を維持）

---

## Issue #2-6: main.py（CLI統合）

### ブランチ名
`feature/2-6-sekou-main`

### KYKの #1-5 と同じ構成。4章を順番に生成して出力する。

### OKの基準
- [ ] `python main.py` で4つのExcelが `output/` に出力される
- [ ] 実行ログに各章の生成進捗が表示される
- [ ] 全体の実行時間が表示される

---

## Issue #2-7: 生成品質テスト＋プロンプト調整

### ブランチ名
`feature/2-7-sekou-quality`

### KYKの #1-6 と同じ。生成内容を千葉がレビューし、プロンプト調整。

### OKの基準
- [ ] 4章全ての生成内容が電気工事として妥当
- [ ] 品質管理チェックシートの項目が「電力量計」に適切
- [ ] 安全対策が電気工事に適切（感電防止等）
- [ ] 千葉がレビューしてOK

---

## Issue #2-8: デモ録画

### 録画の構成（5分以内）
```
0:00 - 0:30  タイトル + 赤レンガ案件のExcelを見せる
0:30 - 1:00  「過去案件をコピーして手で書き換え→2-3日かかる」
1:00 - 1:30  python main.py 実行
1:30 - 3:00  生成された4章を順に開いて確認
3:00 - 4:30  赤レンガ版と並べて構成の比較
4:30 - 5:00  まとめ（「3日→15分」）
```

### OKの基準
- [ ] 録画が5分以内
- [ ] 赤レンガ案件との比較がある
- [ ] 千葉がレビューしてOK
