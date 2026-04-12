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

## 前提条件

- **Python 3.9 以上**
- **Node.js 18 以上**
- Anthropic API キー（Claude API）

## セットアップ

```bash
git clone https://github.com/shokunin-san-com/jtn-ai-demo.git
cd jtn-ai-demo

# フロントエンド（Node.js）
npm install

# Python（バックエンド）
python3 -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 環境変数
cp .env.example .env
# .env に ANTHROPIC_API_KEY を設定
```

## 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開くとトップページが表示されます。

## 各デモの実行

開発サーバー起動後、ブラウザから各デモにアクセスできます。

| デモ | URL | API エンドポイント |
|------|-----|-------------------|
| KYKシート自動生成 | http://localhost:3000/demo1 | `POST /api/demo1` |
| 施工計画書自動生成 | http://localhost:3000/demo2 | `POST /api/demo2` |
| 工事月報自動生成 | http://localhost:3000/demo3 | `POST /api/demo3` |

各画面でフォームに入力して送信すると、バックエンドの Python Serverless Function が Claude API を呼び出し、結果を返します。

## ディレクトリ構成

```
jtn-ai-demo/
├── src/app/              # Next.js フロントエンド
│   ├── page.tsx          #   トップページ（デモ一覧）
│   ├── demo1/page.tsx    #   KYKシート画面
│   ├── demo2/page.tsx    #   施工計画書画面
│   └── demo3/page.tsx    #   工事月報画面
├── api/                  # Vercel Python Serverless Functions
│   ├── demo1.py          #   KYKシート API
│   ├── demo2.py          #   施工計画書 API
│   ├── demo3.py          #   工事月報 API
│   └── health.py         #   ヘルスチェック
├── lib/                  # Python共通モジュール（AI生成・Excel書込）
├── templates/            # Excelテンプレート
├── doc/                  # Issue・設計ドキュメント
├── vercel.json           # Vercelデプロイ設定
└── requirements.txt      # Python依存パッケージ
```
