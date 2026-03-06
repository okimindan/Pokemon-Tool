/**
 * SSM Parameter Store からシート設定を読み込む
 * GOOGLE_SHEETS_ID を環境変数に注入する
 * Lambda コールドスタート時に1回だけ実行
 */

import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm"

const ssmClient = new SSMClient({ region: process.env.AWS_REGION ?? "ap-northeast-1" })

let loaded = false

/**
 * SSM から GOOGLE_SHEETS_ID を取得して環境変数にセット
 * 2回目以降はキャッシュを使用
 */
export async function loadSheetsIdFromSSM(): Promise<void> {
  if (loaded) return

  const paramName = process.env.GOOGLE_SHEETS_ID_PARAM
  if (!paramName) return // ローカル開発時はGOOGLE_SHEETS_IDを直接セット

  if (process.env.GOOGLE_SHEETS_ID) {
    loaded = true
    return
  }

  const command = new GetParameterCommand({ Name: paramName })
  const response = await ssmClient.send(command)
  const value = response.Parameter?.Value

  if (value) {
    process.env.GOOGLE_SHEETS_ID = value
    loaded = true
  }
}
