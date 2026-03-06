/**
 * Lambda ハンドラー: ポケモン・技データ取得API
 *
 * エンドポイント:
 *   GET /data/pokemon?name={name}  - ポケモン検索
 *   GET /data/pokemon/all          - 全ポケモン一覧
 *   GET /data/moves?name={name}    - 技検索
 *   GET /data/moves/all            - 全技一覧
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda"
import type { ApiResponseBody } from "../calc/types"
import { getPokemonByName, getAllPokemon, getMoveByName, getAllMoves } from "../sheets/pokemon-data"

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export const handler = async (
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" }
  }

  const path = event.path
  const query = event.queryStringParameters ?? {}

  try {
    // ── ポケモンデータ ─────────────────────────────────────
    if (path.startsWith("/data/pokemon")) {
      if (path === "/data/pokemon/all") {
        const pokemon = await getAllPokemon()
        return buildSuccess(pokemon)
      }

      const name = query.name
      if (!name) return buildError(400, "クエリパラメータ 'name' が必要です")

      const pokemon = await getPokemonByName(name)
      if (!pokemon) return buildError(404, `ポケモン "${name}" が見つかりません`)

      return buildSuccess(pokemon)
    }

    // ── 技データ ─────────────────────────────────────────
    if (path.startsWith("/data/moves")) {
      if (path === "/data/moves/all") {
        const moves = await getAllMoves()
        return buildSuccess(moves)
      }

      const name = query.name
      if (!name) return buildError(400, "クエリパラメータ 'name' が必要です")

      const move = await getMoveByName(name)
      if (!move) return buildError(404, `技 "${name}" が見つかりません`)

      return buildSuccess(move)
    }

    return buildError(404, "エンドポイントが見つかりません")
  } catch (err) {
    console.error("Data handler error:", err)
    return buildError(500, "データ取得中にエラーが発生しました")
  }
}

function buildSuccess<T>(data: T): APIGatewayProxyResult {
  const body: ApiResponseBody<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  }
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  }
}

function buildError(statusCode: number, message: string): APIGatewayProxyResult {
  const body: ApiResponseBody<null> = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  }
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  }
}
