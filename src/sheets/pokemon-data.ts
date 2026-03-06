/**
 * Pokemon データサービス
 * Google Sheetsからポケモン・技データを取得・変換する
 */

import type { PokemonSheetRow, MoveSheetRow, PokemonType, MoveCategory, MoveData, MoveFlags } from "../calc/types"
import { readSheet, findRowByColumn, SHEET_NAMES, POKEMON_COLUMNS, MOVE_COLUMNS } from "./client"

// ============================================================
// ポケモンデータ取得
// ============================================================

/**
 * 名前でポケモンデータを取得 (英語名 or 日本語名)
 */
export async function getPokemonByName(name: string): Promise<PokemonSheetRow | null> {
  // まず英語名で検索
  let row = await findRowByColumn(SHEET_NAMES.POKEMON, POKEMON_COLUMNS.NAME, name)

  // 見つからなければ日本語名で検索
  if (!row) {
    row = await findRowByColumn(SHEET_NAMES.POKEMON, POKEMON_COLUMNS.NAME_JA, name)
  }

  if (!row) return null
  return parsePokemonRow(row)
}

/**
 * 全ポケモンデータを取得
 */
export async function getAllPokemon(): Promise<PokemonSheetRow[]> {
  const rows = await readSheet(SHEET_NAMES.POKEMON)
  return rows.map(parsePokemonRow).filter((p): p is PokemonSheetRow => p !== null)
}

/**
 * スプレッドシート行をPokemonSheetRowに変換
 */
function parsePokemonRow(row: string[]): PokemonSheetRow | null {
  if (row.length < 11) return null
  return {
    id: parseInt(row[POKEMON_COLUMNS.ID]) || 0,
    name: row[POKEMON_COLUMNS.NAME] ?? "",
    nameJa: row[POKEMON_COLUMNS.NAME_JA] ?? "",
    type1: (row[POKEMON_COLUMNS.TYPE1] ?? "Normal") as PokemonType,
    type2: (row[POKEMON_COLUMNS.TYPE2] ?? "") as PokemonType | "",
    hp: parseInt(row[POKEMON_COLUMNS.HP]) || 0,
    attack: parseInt(row[POKEMON_COLUMNS.ATTACK]) || 0,
    defense: parseInt(row[POKEMON_COLUMNS.DEFENSE]) || 0,
    spAttack: parseInt(row[POKEMON_COLUMNS.SP_ATTACK]) || 0,
    spDefense: parseInt(row[POKEMON_COLUMNS.SP_DEFENSE]) || 0,
    speed: parseInt(row[POKEMON_COLUMNS.SPEED]) || 0,
  }
}

// ============================================================
// 技データ取得
// ============================================================

/**
 * 名前で技データを取得 (英語名 or 日本語名)
 */
export async function getMoveByName(name: string): Promise<MoveSheetRow | null> {
  let row = await findRowByColumn(SHEET_NAMES.MOVES, MOVE_COLUMNS.NAME, name)
  if (!row) {
    row = await findRowByColumn(SHEET_NAMES.MOVES, MOVE_COLUMNS.NAME_JA, name)
  }
  if (!row) return null
  return parseMoveRow(row)
}

/**
 * 全技データを取得
 */
export async function getAllMoves(): Promise<MoveSheetRow[]> {
  const rows = await readSheet(SHEET_NAMES.MOVES)
  return rows.map(parseMoveRow).filter((m): m is MoveSheetRow => m !== null)
}

function parseMoveRow(row: string[]): MoveSheetRow | null {
  if (row.length < 6) return null
  return {
    id: parseInt(row[MOVE_COLUMNS.ID]) || 0,
    name: row[MOVE_COLUMNS.NAME] ?? "",
    nameJa: row[MOVE_COLUMNS.NAME_JA] ?? "",
    type: (row[MOVE_COLUMNS.TYPE] ?? "Normal") as PokemonType,
    category: (row[MOVE_COLUMNS.CATEGORY] ?? "Physical") as MoveCategory,
    power: row[MOVE_COLUMNS.POWER] ? parseInt(row[MOVE_COLUMNS.POWER]) : "",
    accuracy: row[MOVE_COLUMNS.ACCURACY] ? parseInt(row[MOVE_COLUMNS.ACCURACY]) : "",
  }
}

// ============================================================
// MoveSheetRow → MoveData 変換
// ============================================================

/**
 * スプレッドシートの技データをMoveDataに変換
 * フラグは技名から推論 (完全なデータはシートに列追加を推奨)
 */
export function convertToMoveData(row: MoveSheetRow): MoveData {
  return {
    name: row.nameJa || row.name,
    type: row.type,
    category: row.category,
    power: typeof row.power === "number" ? row.power : null,
    accuracy: typeof row.accuracy === "number" ? row.accuracy : null,
    priority: 0,
    isSpread: false,
    flags: inferMoveFlags(row.name),
  }
}

/**
 * 技名からフラグを推論
 * (完全な実装はシートに列追加が望ましい)
 */
function inferMoveFlags(moveName: string): MoveFlags {
  const name = moveName.toLowerCase()
  return {
    isContact: isContactMove(name),
    isSound: isSoundMove(name),
    isPiercing: false,
    isRecoil: isRecoilMove(name),
    isDrain: isDrainMove(name),
    isPunch: isPunchMove(name),
    isPulse: isPulseMove(name),
    isBall: isBallMove(name),
    isBite: isBiteMove(name),
    isCutting: isCuttingMove(name),
    isExplosive: isExplosiveMove(name),
    ignoreAbility: false,
  }
}

function isContactMove(name: string): boolean {
  const contact = ["tackle", "scratch", "pound", "headbutt", "bodyslam", "earthquake",
    "drillpeck", "wingattack", "slash", "crabhammer", "closecombat", "superpower",
    "ironhead", "zenheadbutt", "shadowclaw", "nightslash", "leafblade", "aquatail",
    "dragonrush", "woodhammer", "ironhead", "bulletpunch", "icepunch", "thunderpunch",
    "firepunch", "meteormash", "extremespeed", "brickbreak", "bounce", "fly"]
  return contact.some(c => name.includes(c))
}

function isSoundMove(name: string): boolean {
  const sound = ["hypervoice", "boomburst", "uproar", "growl", "roar", "screech",
    "grasswhistle", "sing", "supersonic", "snore", "soundwave", "noiseburst",
    "chatter", "relicsong", "snarl", "disarmingvoice", "echoedvoice", "bugbuzz"]
  return sound.some(s => name.includes(s))
}

function isRecoilMove(name: string): boolean {
  const recoil = ["doubleedge", "headcharge", "submission", "takedown", "flareblitz",
    "volttackle", "woodhammer", "highhorsepower", "headsmash", "bravebird",
    "wildcharge", "superpower"]
  return recoil.some(r => name.includes(r))
}

function isDrainMove(name: string): boolean {
  const drain = ["leechlife", "gigadrain", "megadrain", "oblivionwing", "drainpunch",
    "hornleech", "paraboliccharge"]
  return drain.some(d => name.includes(d))
}

function isPunchMove(name: string): boolean {
  const punch = ["punch", "focus", "meteorma"]
  return punch.some(p => name.includes(p))
}

function isPulseMove(name: string): boolean {
  const pulse = ["pulse", "aurasp"]
  return pulse.some(p => name.includes(p))
}

function isBallMove(name: string): boolean {
  const ball = ["ball", "bomb", "cannon", "throw"]
  return ball.some(b => name.includes(b))
}

function isBiteMove(name: string): boolean {
  const bite = ["bite", "crunch", "jawlock", "fishious"]
  return bite.some(b => name.includes(b))
}

function isCuttingMove(name: string): boolean {
  const cut = ["cut", "slash", "leaf", "blade", "claw", "fury"]
  return cut.some(c => name.includes(c))
}

function isExplosiveMove(name: string): boolean {
  const explosive = ["explosion", "selfdestruct", "mindblown"]
  return explosive.some(e => name.includes(e))
}
