/**
 * Lambda ハンドラー: ダメージ計算API
 *
 * エンドポイント: POST /calc/damage
 *
 * リクエストボディ: DamageCalcInput (JSON)
 * レスポンス: DamageCalcResult (JSON)
 *
 * 将来のGemini API連携 (思考モード) での使用を想定した設計:
 * - 入出力がすべてJSON形式
 * - breakdownフィールドにより計算内訳を構造化
 * - エラー情報も構造化して返す
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda"
import type { DamageCalcInput, ApiResponseBody, DamageCalcResult } from "../calc/types"
import { calculateDamage } from "../calc/damage"
import { getPokemonByName, getMoveByName, convertToMoveData } from "../sheets/pokemon-data"
import { createDefaultContext } from "../calc/index"
import { loadSheetsIdFromSSM } from "./ssm-loader"

// ============================================================
// メインハンドラー
// ============================================================

export const handler = async (
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  // CORS対応ヘッダー
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }

  // OPTIONSリクエスト (CORS preflight)
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" }
  }

  if (event.httpMethod !== "POST") {
    return buildErrorResponse(405, "Method Not Allowed", headers)
  }

  if (!event.body) {
    return buildErrorResponse(400, "リクエストボディが空です", headers)
  }

  try {
    await loadSheetsIdFromSSM()
    const body = JSON.parse(event.body)

    // ── リクエスト種別の分岐 ──────────────────────────────────
    // 1. 完全なDamageCalcInputを直接渡す場合 (フロントエンド詳細計算)
    // 2. 簡易リクエスト (ポケモン名・技名・EVなどを渡してDBから補完)

    const calcInput: DamageCalcInput = body.attacker?.baseStats
      ? (body as DamageCalcInput)
      : await buildCalcInputFromSimpleRequest(body)

    const result = calculateDamage(calcInput)

    const responseBody: ApiResponseBody<DamageCalcResult> = {
      success: result.success,
      data: result,
      timestamp: new Date().toISOString(),
    }

    return {
      statusCode: result.success ? 200 : 422,
      headers,
      body: JSON.stringify(responseBody),
    }
  } catch (err) {
    console.error("Damage calc error:", err)

    if (err instanceof SyntaxError) {
      return buildErrorResponse(400, "JSONパースエラー: リクエストボディを確認してください", headers)
    }

    return buildErrorResponse(500, "サーバーエラーが発生しました", headers)
  }
}

// ============================================================
// 簡易リクエストからDamageCalcInputを構築
// ============================================================

/**
 * 簡易リクエスト形式 (名前指定) からDamageCalcInputを構築
 * Google SheetsのDBからポケモン・技データを補完する
 */
async function buildCalcInputFromSimpleRequest(body: SimpleCalcRequest): Promise<DamageCalcInput> {
  const [attackerData, defenderData, moveData] = await Promise.all([
    getPokemonByName(body.attackerName),
    getPokemonByName(body.defenderName),
    getMoveByName(body.moveName),
  ])

  if (!attackerData) throw new Error(`攻撃側ポケモン "${body.attackerName}" が見つかりません`)
  if (!defenderData) throw new Error(`防御側ポケモン "${body.defenderName}" が見つかりません`)
  if (!moveData) throw new Error(`技 "${body.moveName}" が見つかりません`)

  const attackerTypes = attackerData.type2
    ? [attackerData.type1, attackerData.type2] as [string, string]
    : [attackerData.type1] as [string]

  const defenderTypes = defenderData.type2
    ? [defenderData.type1, defenderData.type2] as [string, string]
    : [defenderData.type1] as [string]

  return {
    attacker: {
      name: attackerData.nameJa || attackerData.name,
      baseStats: {
        hp: attackerData.hp,
        attack: attackerData.attack,
        defense: attackerData.defense,
        spAttack: attackerData.spAttack,
        spDefense: attackerData.spDefense,
        speed: attackerData.speed,
      },
      types: attackerTypes as any,
      level: body.attackerLevel ?? 50,
      nature: body.attackerNature ?? "Hardy",
      evs: body.attackerEVs ?? { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
      ivs: body.attackerIVs ?? { hp: 31, attack: 31, defense: 31, spAttack: 31, spDefense: 31, speed: 31 },
      ability: body.attackerAbility ?? "",
      item: body.attackerItem ?? "なし",
      status: body.attackerStatus ?? "none",
      terastal: body.attackerTerastal ?? { isTerastallized: false, teraType: null },
      ranks: body.attackerRanks ?? {
        attack: 0, defense: 0, spAttack: 0, spDefense: 0,
        speed: 0, accuracy: 0, evasion: 0
      },
    },
    defender: {
      name: defenderData.nameJa || defenderData.name,
      baseStats: {
        hp: defenderData.hp,
        attack: defenderData.attack,
        defense: defenderData.defense,
        spAttack: defenderData.spAttack,
        spDefense: defenderData.spDefense,
        speed: defenderData.speed,
      },
      types: defenderTypes as any,
      level: body.defenderLevel ?? 50,
      nature: body.defenderNature ?? "Hardy",
      evs: body.defenderEVs ?? { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
      ivs: body.defenderIVs ?? { hp: 31, attack: 31, defense: 31, spAttack: 31, spDefense: 31, speed: 31 },
      ability: body.defenderAbility ?? "",
      item: body.defenderItem ?? "なし",
      status: body.defenderStatus ?? "none",
      terastal: body.defenderTerastal ?? { isTerastallized: false, teraType: null },
      ranks: body.defenderRanks ?? {
        attack: 0, defense: 0, spAttack: 0, spDefense: 0,
        speed: 0, accuracy: 0, evasion: 0
      },
    },
    move: convertToMoveData(moveData),
    context: createDefaultContext(body.context),
    isCritical: body.isCritical ?? false,
  }
}

// ============================================================
// 簡易リクエスト型
// ============================================================

interface SimpleCalcRequest {
  attackerName: string
  defenderName: string
  moveName: string
  attackerLevel?: number
  defenderLevel?: number
  attackerNature?: string
  defenderNature?: string
  attackerEVs?: any
  defenderEVs?: any
  attackerIVs?: any
  defenderIVs?: any
  attackerAbility?: string
  defenderAbility?: string
  attackerItem?: string
  defenderItem?: string
  attackerStatus?: string
  defenderStatus?: string
  attackerTerastal?: any
  defenderTerastal?: any
  attackerRanks?: any
  defenderRanks?: any
  context?: any
  isCritical?: boolean
}

// ============================================================
// レスポンスビルダー
// ============================================================

function buildErrorResponse(
  statusCode: number,
  message: string,
  headers: Record<string, string>
): APIGatewayProxyResult {
  const body: ApiResponseBody<null> = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  }
  return {
    statusCode,
    headers,
    body: JSON.stringify(body),
  }
}
