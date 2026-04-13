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

## 必要な環境

- **Node.js**: 18.x 以上
- **Python**: 3.9 以上
- **npm** または **yarn**

## セットアップ

### 1. リポジトリをクローン
```bash
git clone https://github.com/shokunin-san-com/jtn-ai-demo.git
cd jtn-ai-demo
```

### 2. フロントエンド（Node.js）の設定
```bash
npm install
```

### 3. バックエンド（Python）の設定
```bash
# 仮想環境の作成（推奨）
python3 -m venv .venv

# 仮想環境の有効化
# macOS / Linux:
source .venv/bin/activate

# Windows:
.venv\Scripts\activate

# 依存パッケージのインストール
pip install -r requirements.txt

# Python バージョン確認（3.9以上であることを確認）
python --version
```

### 4. 環境変数の設定
```bash
# .env.example をコピー
cp .env.example .env

# .env を編集して ANTHROPIC_API_KEY を設定
# ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### 5. 開発サーバーの起動
```bash
npm run dev
```

開発サーバーは `http://localhost:3000` で起動します。

## 仮想環境について

このプロジェクトでは Python の依存パッケージを管理するため、仮想環境（venv）の使用を推奨します。

- **作成**: `python3 -m venv .venv`
- **有効化**: `source .venv/bin/activate` (macOS/Linux)
- **有効化**: `.venv\Scripts\activate` (Windows)
- **無効化**: `deactivate`

仮想環境内で `pip install` を実行することで、プロジェクト用のパッケージを独立して管理できます。

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
