# Pokemon SV Damage Calculator Backend

ポケモン スカーレット・バイオレット (第9世代) のダメージ計算バックエンドシステム

## 技術構成

| 項目 | 技術 |
|------|------|
| 言語 | TypeScript / Node.js 20 |
| インフラ | AWS CDK (Lambda + API Gateway + S3 + CloudFront) |
| DB | Google Sheets API |
| CI/CD | GitHub Actions |

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
│   │   ├── client.ts       # Sheetsクライアント
│   │   └── pokemon-data.ts # ポケモン・技データ取得
│   └── lambda/             # Lambda ハンドラー
│       ├── calc-handler.ts # POST /calc/damage
│       └── data-handler.ts # GET /data/pokemon, /data/moves
├── cdk/
│   ├── bin/app.ts          # CDKアプリエントリ
│   └── lib/pokemon-stack.ts # CDKスタック定義
├── .github/workflows/
│   └── deploy.yml          # GitHub Actions (mainブランチ自動デプロイ)
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

### 計算結果

```json
{
  "minDamage": 132,
  "maxDamage": 156,
  "minPercent": 79.5,
  "maxPercent": 93.9,
  "minKOHits": 1,
  "maxKOHits": 1,
  "koDescription": "乱数1発 (13/16)",
  "breakdown": { ... }
}
```

## APIエンドポイント

### POST /calc/damage

ダメージを計算します。

**簡易リクエスト例:**
```json
{
  "attackerName": "ガブリアス",
  "defenderName": "ドラパルト",
  "moveName": "じしん",
  "attackerNature": "ようき",
  "attackerEVs": { "attack": 252, "speed": 252, "hp": 4 },
  "context": { "weather": "none", "field": "none" }
}
```

**詳細リクエスト (DamageCalcInput直接):** 型定義 `DamageCalcInput` を参照

### GET /data/pokemon?name={name}

ポケモンデータを取得します。

### GET /data/moves?name={name}

技データを取得します。

## セットアップ

### 1. 依存関係インストール

```bash
npm install
```

### 2. Google Sheets設定

1. Google Cloud ConsoleでService Accountを作成
2. Google Sheets APIを有効化
3. スプレッドシートにService AccountのメールをEditorとして追加
4. Secrets Managerに認証情報を登録:

```bash
aws secretsmanager update-secret \
  --secret-id "pokemon-tool/google-sheets" \
  --secret-string '{
    "GOOGLE_SERVICE_ACCOUNT_EMAIL": "xxx@project.iam.gserviceaccount.com",
    "GOOGLE_PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----\n...",
    "GOOGLE_SHEETS_ID": "your-spreadsheet-id"
  }'
```

### 3. スプレッドシート構造

| シート名 | 列構成 |
|---------|-------|
| `pokemon` | id, name, name_ja, type1, type2, hp, attack, defense, sp_attack, sp_defense, speed |
| `moves` | id, name, name_ja, type, category, power, accuracy, pp |
| `abilities` | id, name, name_ja, description |
| `items` | id, name, name_ja, description |

### 4. GitHub Actions設定

以下のSecretsをGitHubリポジトリに設定:

| Secret名 | 説明 |
|---------|------|
| `AWS_ROLE_ARN` | OIDC認証用IAMロールARN |

IAMロールには以下のポリシーが必要:
- `AWSCloudFormationFullAccess`
- `AWSLambdaFullAccess`
- `AmazonAPIGatewayAdministrator`
- `AmazonS3FullAccess`
- `SecretsManagerReadWrite`

### 5. CDKデプロイ

```bash
# 初回: CDK Bootstrap
npm run cdk:bootstrap

# デプロイ
npm run cdk:deploy
```

## 将来の拡張計画

- [ ] Gemini APIを使った対戦ログ解析「思考モード」
- [ ] S3 + CloudFrontフロントエンド (React/Next.js)
- [ ] 調整先サジェスト機能
- [ ] パーティ管理・保存機能
- [ ] 対戦シミュレーション機能
