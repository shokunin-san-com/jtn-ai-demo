# JTN AI デモ — Issue一覧

## リポジトリ名
`jtn-ai-demo`

## ブランチ戦略
- `main`: 保護。直プッシュ禁止。PRマージのみ。
- `feature/xxx`: 各タスクの作業ブランチ。PRで千葉がレビュー→mainにマージ。

---

## Issue #0: リポジトリ初期設定【千葉担当】

緑川さんは触らなくてOK。千葉が全部やる。

### やること
1. GitHubリポジトリ作成（`jtn-ai-demo`）
2. mainブランチのプロテクションルール設定
   - Require a pull request before merging
   - Require approvals: 1
   - Do not allow bypassing the above settings
3. 以下のディレクトリ構成でinitial commit

```
jtn-ai-demo/
├── README.md
├── requirements.txt
├── .gitignore
├── .env.example
├── demo1_kyk/
│   ├── templates/
│   │   └── .gitkeep
│   └── output/
│       └── .gitkeep
├── demo2_sekou_keikaku/
│   ├── templates/
│   │   └── .gitkeep
│   ├── reference/
│   │   └── .gitkeep
│   └── output/
│       └── .gitkeep
└── demo3_geppo/
    ├── templates/
    │   └── .gitkeep
    ├── reference/
    │   └── .gitkeep
    └── output/
        └── .gitkeep
```

4. `.gitignore` 作成
```
output/
*.pyc
__pycache__/
.env
.DS_Store
```

5. `.env.example` 作成
```
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

6. `requirements.txt` 作成
```
anthropic>=0.40.0
openpyxl>=3.1.0
```

7. 緑川さんをコラボレーターに追加
8. 緑川さんに以下を指示:
   - リポジトリclone
   - `pip install -r requirements.txt`
   - `.env` にAPIキー設定
   - Issue #1-1から開始

### 完了条件
- [ ] リポジトリが作成されている
- [ ] mainブランチが保護されている
- [ ] 緑川さんがclone + pip installできている

---

## KYKシートデモ（Issue #1-1 〜 #1-8）

### 前提知識（緑川さんへ）

KYKシート = 毎朝の安全ミーティングで使うリスク評価シート。
JTNでは41行×23列のExcelに手入力している。これを30秒で自動生成する。

元データ: `/Users/miyu/Desktop/data/KYKシート.xlsx`

---

## 施工計画書デモ（Issue #2-1 〜 #2-8）

KYKシートデモが完了してから着手。

元データ: `/Users/miyu/Desktop/data/5.施工計画書/`

---

## 工事月報デモ（Issue #3-1 〜 #3-6）

施工計画書デモが完了してから着手。

元データ: `/Users/miyu/Desktop/data/工事月報/`

---

## ANDPAD連携について
今回のデモには含めない。JTNがANDPADを導入した後の将来構想。
設計書・コードでANDPAD関連の記述は一切不要。
