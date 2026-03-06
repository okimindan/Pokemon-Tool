# Pokemon SV Damage Calculator Backend

ポケモン スカーレット・バイオレット (第9世代) のダメージ計算バックエンドシステム

## デプロイ状況

| リソース | 値 |
|---------|---|
| API Gateway URL | `https://k7jncd6nq5.execute-api.ap-northeast-1.amazonaws.com/v1/` |
| CloudFront URL | `https://d23dsspv6o03c0.cloudfront.net` |
| S3 バケット | `pokemon-tool-frontend-869807375374` |
| Lambda IAM Role | `arn:aws:iam::869807375374:role/pokemon-tool-lambda-role` |
| リージョン | `ap-northeast-1` (東京) |

## 技術構成

| 項目 | 技術 |
|------|------|
| 言語 | TypeScript / Node.js 20 |
| インフラ | AWS CDK (Lambda + API Gateway + S3 + CloudFront) |
| DB | Google Sheets API (Workload Identity Federation) |
| CI/CD | GitHub Actions (mainブランチ push → 自動デプロイ) |

## GCP 認証構成 (Workload Identity Federation)

JSONキー不要。AWS Lambda の IAM ロールで GCP に認証。

| 項目 | 値 |
|------|---|
| GCP プロジェクト | `awsproject-489403` (project number: `625034425659`) |
| Workload Identity Pool | `pokemon-tool-pool` |
| AWS Provider | `aws-lambda-provider` (AWSアカウント: `869807375374`) |
| GCP サービスアカウント | `pokemon-tool-sa@awsproject-489403.iam.gserviceaccount.com` |
| 許可対象 IAM ロール | `arn:aws:sts::869807375374:assumed-role/pokemon-tool-lambda-role` |
| 認証設定ファイル | `config/gcp-credentials.json` (秘密情報なし) |

## スプレッドシート構造

| シート名 | 列構成 |
|---------|-------|
| `pokemon` | id, name, type1, type2, hp, attack, defense, sp_attack, sp_defense, speed |
| `move` | id, name, type, category, power, accuracy, pp |

- タイプ名は日本語 (ほのお / みず / でんき 等) ・英語どちらでも自動変換
- カテゴリは日本語 (ぶつり / とくしゅ / へんか) ・英語どちらでも対応

## フォルダ構造

```
Pokemon/
├── src/
│   ├── calc/               # ダメージ計算コアロジック
│   │   ├── types.ts        # 全TypeScript型定義
│   │   ├── constants.ts    # タイプ相性表・性格補正等の定数
│   │   ├── stats.ts        # ステータス実数値計算
│   │   ├── damage.ts       # 第9世代ダメージ計算式
│   │   └── index.ts        # 公開APIエクスポート
│   ├── sheets/             # Google Sheets DB連携
│   │   ├── client.ts       # Workload Identity対応Sheetsクライアント
│   │   └── pokemon-data.ts # ポケモン・技データ取得
│   └── lambda/             # Lambda ハンドラー
│       ├── calc-handler.ts # POST /calc/damage
│       ├── data-handler.ts # GET /data/pokemon, /data/moves
│       └── ssm-loader.ts   # SSM Parameter StoreからSheets IDを取得
├── config/
│   └── gcp-credentials.json # Workload Identity設定 (秘密情報なし)
├── cdk/
│   ├── bin/app.ts           # CDKアプリエントリ
│   └── lib/pokemon-stack.ts # CDKスタック定義
├── .github/workflows/
│   └── deploy.yml           # GitHub Actions (mainブランチ自動デプロイ)
├── package.json
└── tsconfig.json
```

## 第9世代ダメージ計算式

```
BaseDmg = floor(floor(floor(2 * Level / 5 + 2) * Power * A / D) / 50) + 2

FinalDmg = BaseDmg × Spread × Weather × Critical × Random(85-100) × STAB × Type × Burn × Other × TeraBoost
```

### 考慮要素

- 努力値 (EV) / 個体値 (IV)
- 性格補正 (25種類)
- ランク補正 (-6〜+6)
- 天候: 晴れ / 雨 / 砂嵐 / 雪 / 強い日差し / 大雨 / 強い風
- フィールド: エレキ / グラス / ミスト / サイコ
- テラスタル (Tera STAB 2.0倍 / 新タイプ 1.5倍)
- 壁: リフレクター / ひかりのかべ / オーロラベール
- 持ち物: いのちのたま / こだわり系 / たつじんのおび / 各タイプ強化アイテム
- 特性: てきおうりょく / もらいび / テクニシャン / etc.
- 状態異常: やけど (物理ダメージ0.5倍)

### 計算結果の形式

```json
{
  "success": true,
  "data": {
    "minDamage": 132,
    "maxDamage": 156,
    "minPercent": 79.5,
    "maxPercent": 93.9,
    "minKOHits": 1,
    "maxKOHits": 1,
    "koDescription": "乱数1発 (13/16)",
    "damageRolls": [132, 133, 135, 136, 138, 139, 141, 142, 144, 145, 147, 148, 150, 151, 153, 156],
    "breakdown": {
      "baseDamage": 120,
      "stabModifier": 1.5,
      "typeEffectivenessModifier": 2,
      "weatherModifier": 1,
      "criticalModifier": 1,
      "otherModifiers": []
    }
  },
  "timestamp": "2026-03-06T04:23:48.000Z"
}
```

## APIエンドポイント

ベースURL: `https://k7jncd6nq5.execute-api.ap-northeast-1.amazonaws.com/v1`

### GET /data/pokemon/all

全ポケモンデータを取得します。

```bash
curl https://k7jncd6nq5.execute-api.ap-northeast-1.amazonaws.com/v1/data/pokemon/all
```

### GET /data/pokemon?name={name}

ポケモンを名前で検索します。

```bash
curl "https://k7jncd6nq5.execute-api.ap-northeast-1.amazonaws.com/v1/data/pokemon?name=カイリュー"
```

### GET /data/moves/all

全技データを取得します。

### GET /data/moves?name={name}

技を名前で検索します。

### POST /calc/damage

ダメージを計算します。

**リクエスト例 (簡易形式 - 名前指定でDB補完):**

```bash
curl -X POST https://k7jncd6nq5.execute-api.ap-northeast-1.amazonaws.com/v1/calc/damage \
  -H "Content-Type: application/json" \
  -d '{
    "attackerName": "ガブリアス",
    "defenderName": "ドラパルト",
    "moveName": "じしん",
    "attackerNature": "Jolly",
    "attackerEVs": { "hp": 4, "attack": 252, "defense": 0, "spAttack": 0, "spDefense": 0, "speed": 252 },
    "context": { "weather": "none", "field": "none", "format": "singles" }
  }'
```

- 指定できるKEY項目は`calc-handler.ts:173-197`に記載
## ローカル開発

```bash
# 依存関係インストール
npm install

# TypeScriptビルド
npm run build

# CDK差分確認
npm run cdk:diff

# デプロイ
npm run cdk:deploy
```

## セットアップ手順 (新規環境)

### 1. AWS CDK Bootstrap

```bash
npm run cdk:bootstrap
```

### 2. SSM Parameter Store にSheets IDを登録

```bash
aws ssm put-parameter \
  --name "/pokemon-tool/google-sheets-id" \
  --value "YOUR_SPREADSHEET_ID" \
  --type String \
  --region ap-northeast-1
```

### 3. GitHub Actions設定

GitHubリポジトリの `Settings → Secrets → Actions` に追加:

| Secret名 | 説明 |
|---------|------|
| `AWS_ROLE_ARN` | OIDC認証用IAMロールARN |

### 4. CDKデプロイ

```bash
npm run cdk:deploy
```

## 将来の拡張計画

- [ ] Gemini APIを使った対戦ログ解析「思考モード」
- [ ] S3 + CloudFrontフロントエンド (React/Next.js)
- [ ] 調整先サジェスト機能
- [ ] パーティ管理・保存機能
- [ ] 対戦シミュレーション機能
