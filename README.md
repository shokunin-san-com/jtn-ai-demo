# JTN AI デモ

㈱ジェイ・ティー・エヌ向け AI 業務効率化デモ。  
Claude API + Next.js + Vercel で建設業の書類作成を自動化する Web アプリ。

## デモ一覧

| # | デモ | 概要 | 効果 |
|---|------|------|------|
| 1 | KYKシート自動生成 | 作業内容からリスク評価を自動生成 | 30分 → 30秒 |
| 2 | 施工計画書自動生成 | 過去案件を参考に4章を自動生成 | 3日 → 15分 |
| 3 | 工事月報自動生成 | 月次データからテキスト自動生成 | 3時間 → 15分 |

## 技術スタック

- **フロントエンド**: Next.js (App Router) + Tailwind CSS + TypeScript
- **バックエンド**: Vercel Python Serverless Functions
- **AI**: Claude API (Anthropic)
- **Excel操作**: openpyxl

## セットアップ

```bash
git clone https://github.com/shokunin-san-com/jtn-ai-demo.git
cd jtn-ai-demo

# フロントエンド
npm install

# Python（バックエンド）
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 環境変数
cp .env.example .env
# .env に ANTHROPIC_API_KEY を設定

# 開発サーバー
npm run dev
```

## ディレクトリ構成

```
jtn-ai-demo/
├── src/app/              # Next.js フロントエンド
├── api/                  # Vercel Python Serverless Functions
├── lib/                  # Python共通モジュール（AI生成・Excel書込）
├── templates/            # Excelテンプレート
├── doc/                  # Issue・設計ドキュメント
├── vercel.json           # Vercelデプロイ設定
└── requirements.txt      # Python依存パッケージ
```
