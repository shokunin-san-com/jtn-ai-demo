# JTN AI デモ

㈱ジェイ・ティー・エヌ向け AI 業務効率化デモ。  
Claude API を使って建設業の書類作成を自動化する。

## デモ一覧

| # | デモ | 概要 | 効果 |
|---|------|------|------|
| 1 | KYKシート自動生成 | 作業内容からリスク評価を自動生成 | 30分 → 30秒 |
| 2 | 施工計画書自動生成 | 過去案件を参考に4章を自動生成 | 3日 → 15分 |
| 3 | 工事月報自動生成 | 月次データからテキスト自動生成 | 3時間 → 15分 |

## セットアップ

```bash
git clone https://github.com/<org>/jtn-ai-demo.git
cd jtn-ai-demo
pip install -r requirements.txt
cp .env.example .env
# .env に ANTHROPIC_API_KEY を設定
```

## ディレクトリ構成

```
jtn-ai-demo/
├── demo1_kyk/           # KYKシートデモ
├── demo2_sekou_keikaku/ # 施工計画書デモ
├── demo3_geppo/         # 工事月報デモ
└── doc/                 # Issue・設計ドキュメント
```
