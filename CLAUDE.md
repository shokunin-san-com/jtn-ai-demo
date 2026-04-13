# jtn-ai-demo

公共工事（電気設備）向け書類生成デモ。Next.js フロント + Vercel Python Functions で Anthropic Claude を呼び出し、既存 Excel テンプレートに書き込んで返す。

## 構成

- **フロント**: Next.js 16 (App Router) + Tailwind v4、`src/app/{demo1,demo2,demo3}/`
- **API**: `api/*.py`（Vercel Python Functions, `@vercel/python@4.3.1`）
- **生成ロジック**: `lib/demo1_kyk/`, `lib/demo2_sekou_keikaku/`, `lib/demo3_geppo/`
  - 各ディレクトリに `ai_generator.py`（Claude 呼び出し）と `excel_writer.py`（openpyxl でテンプレートに書き込み）
- **共通**: `lib/ai_utils.py`（JSON 抽出、truncate）、`lib/config.py`（環境変数）
- **テンプレート**: `templates/**/*.xlsx`（`vercel.json` の `includeFiles` で Functions に同梱）

### 3 デモ

| デモ | 画面 | API | 用途 |
|---|---|---|---|
| demo1 | `/demo1` | `api/demo1.py` | KYK（危険予知活動）シート生成 |
| demo2 | `/demo2` | `api/demo2.py` | 施工計画書（章単位、SSE ストリーミング） |
| demo3 | `/demo3` | `api/demo3.py` | 工事月報 |

## デプロイ（Vercel）

- 本番: https://jtn-ai-demo.vercel.app/
- team: `shokunin-san-syss-projects`, project: `jtn-ai-demo`
- 環境変数: `ANTHROPIC_API_KEY`（Production, Encrypted）

### vercel.json のポイント

```json
{
  "version": 2,
  "framework": "nextjs",
  "functions": {
    "api/*.py": {
      "runtime": "@vercel/python@4.3.1",
      "maxDuration": 60,
      "memory": 1024,
      "includeFiles": "templates/**/*.xlsx,lib/**/*.py,requirements.txt"
    }
  }
}
```

**ハマりポイント（重要）**:
- `framework: nextjs` を明示しないと Next.js 成果物が配信されず `/` が 404。`functions` だけ書くと Python 関数だけデプロイされる。
- `maxDuration: 10`（Hobby デフォルト）だと施工計画書で 504。1 章 15〜40 秒かかるので **60** が必須。
- `builds` と `functions` は併用不可（新形式は `functions` のみ）。
- `.python-version` は **3.12**（3.11 は Vercel の uv にない）。

## ローカル開発

```bash
# フロント
npm install
npm run dev        # http://localhost:3000

# Python（.env.local に ANTHROPIC_API_KEY）
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

### ユニットテスト
```bash
.venv/bin/pytest tests/
```

### 品質テスト（実 API 呼び出し）
```bash
.venv/bin/python tests/quality_run.py [kyk|sekou|geppo|all]
```
結果は `tests/out/quality_report.json` と `tests/out/*.xlsx` に保存。部分実行した場合は既存レポートとマージされる。

## 実測パフォーマンス（Claude Sonnet 4）

- KYK: 10〜12 秒（5 パターン）
- 施工計画書: 15〜40 秒/章（ch1/ch2/ch7/ch8）
- 工事月報: 5〜10 秒（3 パターン）

## よくある実装上の注意

- **MergedCell への代入不可**: テンプレートはセル結合が多いので Excel 書き込みは `_safe_set()` でマージ範囲の左上セルを解決してから書く。
- **Claude の JSON 出力**: ` ```json ... ``` ` で囲まれるケースがある。`lib/ai_utils.extract_json()` が fence 除去とブレース深さ追跡で対応。
- **文字数制限**: 生成結果は `MAX_CONTENT_CHARS`（デフォルト 2000）で `truncate_text` される。Excel セル幅の破綻防止。
- **参照データ取り込み**: demo2 は `lib/demo2_sekou_keikaku/reference_extractor.py` で過去の施工計画書 xlsx から章単位のテキストを抽出し、プロンプトに含める。

## 関連 Issue / PR

- #6 KYK 品質テスト（クローズ済み）
- #15 施工計画書 品質テスト（クローズ済み）
- #21 工事月報 品質テスト（クローズ済み）
- #52 デモ録画 → 緑川さん担当
