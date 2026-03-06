/**
 * Google Sheets API クライアント
 * Workload Identity Federation を使用 (JSONキー不要)
 *
 * 必要な環境変数:
 *   GOOGLE_SHEETS_ID          - スプレッドシートのID
 *   GOOGLE_APPLICATION_CREDENTIALS - 外部認証設定JSONのファイルパス
 *                               (Lambda: /var/task/config/gcp-credentials.json)
 */

import { google, sheets_v4, Auth } from "googleapis"
import * as path from "path"
import * as fs from "fs"

// ============================================================
// クライアント初期化
// ============================================================

let sheetsClient: sheets_v4.Sheets | null = null

/**
 * Google Sheets APIクライアントを取得 (シングルトン)
 * Workload Identity Federation で AWS IAMロールから自動認証
 */
export async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  if (sheetsClient) return sheetsClient

  const credentialsPath = resolveCredentialsPath()

  const auth = new google.auth.GoogleAuth({
    keyFilename: credentialsPath,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  })

  const authClient = await auth.getClient() as Auth.OAuth2Client
  sheetsClient = google.sheets({ version: "v4", auth: authClient })
  return sheetsClient
}

/**
 * 認証設定ファイルのパスを解決
 * 優先順: 環境変数 → Lambdaデプロイパス → ローカル開発パス
 */
function resolveCredentialsPath(): string {
  // 環境変数で明示指定されている場合はそちらを使用
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return process.env.GOOGLE_APPLICATION_CREDENTIALS
  }

  // Lambda実行環境: /var/task/ 以下にバンドルされる
  const lambdaPath = "/var/task/config/gcp-credentials.json"
  if (fs.existsSync(lambdaPath)) {
    return lambdaPath
  }

  // ローカル開発環境: プロジェクトルートのconfigディレクトリ
  const localPath = path.join(__dirname, "../../config/gcp-credentials.json")
  if (fs.existsSync(localPath)) {
    return localPath
  }

  throw new Error(
    "GCP認証設定ファイルが見つかりません。\n" +
    "GOOGLE_APPLICATION_CREDENTIALS 環境変数に config/gcp-credentials.json のパスを設定してください。"
  )
}

/**
 * スプレッドシートIDを取得
 */
export function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SHEETS_ID
  if (!id) {
    throw new Error("GOOGLE_SHEETS_ID が設定されていません。")
  }
  return id
}

// ============================================================
// シート読み取り共通関数
// ============================================================

/**
 * 指定シートの全データを2次元配列で取得
 * @param sheetName シート名 (例: "pokemon", "moves")
 * @param range 範囲 (例: "A2:Z" でヘッダーをスキップ)
 */
export async function readSheet(
  sheetName: string,
  range: string = "A2:Z"
): Promise<string[][]> {
  const client = await getSheetsClient()
  const spreadsheetId = getSpreadsheetId()

  const response = await client.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!${range}`,
  })

  return (response.data.values as string[][] | undefined) ?? []
}

/**
 * 指定シートの特定列でフィルタして行を取得
 * @param sheetName シート名
 * @param columnIndex 検索対象の列インデックス (0始まり)
 * @param value 検索値
 */
export async function findRowByColumn(
  sheetName: string,
  columnIndex: number,
  value: string
): Promise<string[] | null> {
  const rows = await readSheet(sheetName)
  return rows.find((row) => row[columnIndex]?.toLowerCase() === value.toLowerCase()) ?? null
}

// ============================================================
// スプレッドシート構造定義
// ============================================================

/**
 * 推奨スプレッドシート構造:
 *
 * シート: "pokemon"
 * 列: id | name | name_ja | type1 | type2 | hp | attack | defense | sp_attack | sp_defense | speed
 *
 * シート: "moves"
 * 列: id | name | name_ja | type | category | power | accuracy | pp
 *
 * シート: "abilities"
 * 列: id | name | name_ja | description
 *
 * シート: "items"
 * 列: id | name | name_ja | description
 */

export const SHEET_NAMES = {
  POKEMON: "pokemon",
  MOVES: "moves",
  ABILITIES: "abilities",
  ITEMS: "items",
} as const

export const POKEMON_COLUMNS = {
  ID: 0,
  NAME: 1,
  NAME_JA: 2,
  TYPE1: 3,
  TYPE2: 4,
  HP: 5,
  ATTACK: 6,
  DEFENSE: 7,
  SP_ATTACK: 8,
  SP_DEFENSE: 9,
  SPEED: 10,
} as const

export const MOVE_COLUMNS = {
  ID: 0,
  NAME: 1,
  NAME_JA: 2,
  TYPE: 3,
  CATEGORY: 4,
  POWER: 5,
  ACCURACY: 6,
  PP: 7,
} as const
