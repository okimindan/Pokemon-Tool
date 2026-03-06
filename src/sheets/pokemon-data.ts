/**
 * Pokemon データサービス
 * Google Sheetsからポケモン・技データを取得・変換する
 *
 * シート構造:
 *   pokemon: id | name | type1 | type2 | hp | attack | defense | sp_attack | sp_defense | speed
 *   move:    id | name | type  | category | power | accuracy | pp
 */

import type { PokemonSheetRow, MoveSheetRow, PokemonType, MoveCategory, MoveData, MoveFlags } from "../calc/types"
import { readSheet, findRowByColumn, SHEET_NAMES, POKEMON_COLUMNS, MOVE_COLUMNS } from "./client"

// ============================================================
// タイプ名の日本語 → 英語 変換
// ============================================================

const TYPE_JA_TO_EN: Readonly<Record<string, PokemonType>> = {
  "ノーマル":   "Normal",
  "ほのお":     "Fire",
  "みず":       "Water",
  "でんき":     "Electric",
  "くさ":       "Grass",
  "こおり":     "Ice",
  "かくとう":   "Fighting",
  "どく":       "Poison",
  "じめん":     "Ground",
  "ひこう":     "Flying",
  "エスパー":   "Psychic",
  "むし":       "Bug",
  "いわ":       "Rock",
  "ゴースト":   "Ghost",
  "ドラゴン":   "Dragon",
  "あく":       "Dark",
  "はがね":     "Steel",
  "フェアリー": "Fairy",
  "ステラ":     "Stellar",
  // 英語もそのまま通す
  "Normal": "Normal", "Fire": "Fire", "Water": "Water", "Electric": "Electric",
  "Grass": "Grass", "Ice": "Ice", "Fighting": "Fighting", "Poison": "Poison",
  "Ground": "Ground", "Flying": "Flying", "Psychic": "Psychic", "Bug": "Bug",
  "Rock": "Rock", "Ghost": "Ghost", "Dragon": "Dragon", "Dark": "Dark",
  "Steel": "Steel", "Fairy": "Fairy", "Stellar": "Stellar",
}

function normalizeType(raw: string): PokemonType {
  return TYPE_JA_TO_EN[raw.trim()] ?? "Normal"
}

// ============================================================
// 技カテゴリの日本語 → 英語 変換
// ============================================================

const CATEGORY_JA_TO_EN: Readonly<Record<string, MoveCategory>> = {
  "ぶつり":   "Physical",
  "とくしゅ": "Special",
  "へんか":   "Status",
  "Physical": "Physical",
  "Special":  "Special",
  "Status":   "Status",
}

function normalizeCategory(raw: string): MoveCategory {
  return CATEGORY_JA_TO_EN[raw.trim()] ?? "Physical"
}

// ============================================================
// ポケモンデータ取得
// ============================================================

/**
 * 名前でポケモンデータを取得 (大文字小文字無視)
 */
export async function getPokemonByName(name: string): Promise<PokemonSheetRow | null> {
  const row = await findRowByColumn(SHEET_NAMES.POKEMON, POKEMON_COLUMNS.NAME, name)
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
 * 列: id | name | type1 | type2 | hp | attack | defense | sp_attack | sp_defense | speed
 */
function parsePokemonRow(row: string[]): PokemonSheetRow | null {
  if (row.length < 9) return null
  const name = row[POKEMON_COLUMNS.NAME]?.trim() ?? ""
  if (!name) return null

  return {
    id:        parseInt(row[POKEMON_COLUMNS.ID]) || 0,
    name,
    nameJa:    name, // name_ja列がないためnameをそのまま使用
    type1:     normalizeType(row[POKEMON_COLUMNS.TYPE1] ?? ""),
    type2:     row[POKEMON_COLUMNS.TYPE2]?.trim()
                 ? normalizeType(row[POKEMON_COLUMNS.TYPE2])
                 : "" as PokemonType | "",
    hp:        parseInt(row[POKEMON_COLUMNS.HP]) || 0,
    attack:    parseInt(row[POKEMON_COLUMNS.ATTACK]) || 0,
    defense:   parseInt(row[POKEMON_COLUMNS.DEFENSE]) || 0,
    spAttack:  parseInt(row[POKEMON_COLUMNS.SP_ATTACK]) || 0,
    spDefense: parseInt(row[POKEMON_COLUMNS.SP_DEFENSE]) || 0,
    speed:     parseInt(row[POKEMON_COLUMNS.SPEED]) || 0,
  }
}

// ============================================================
// 技データ取得
// ============================================================

/**
 * 名前で技データを取得
 */
export async function getMoveByName(name: string): Promise<MoveSheetRow | null> {
  const row = await findRowByColumn(SHEET_NAMES.MOVES, MOVE_COLUMNS.NAME, name)
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

/**
 * スプレッドシート行をMoveSheetRowに変換
 * 列: id | name | type | category | power | accuracy | pp
 */
function parseMoveRow(row: string[]): MoveSheetRow | null {
  if (row.length < 5) return null
  const name = row[MOVE_COLUMNS.NAME]?.trim() ?? ""
  if (!name) return null

  const powerRaw    = row[MOVE_COLUMNS.POWER]?.trim()
  const accuracyRaw = row[MOVE_COLUMNS.ACCURACY]?.trim()

  return {
    id:       parseInt(row[MOVE_COLUMNS.ID]) || 0,
    name,
    nameJa:   name, // name_ja列がないためnameをそのまま使用
    type:     normalizeType(row[MOVE_COLUMNS.TYPE] ?? ""),
    category: normalizeCategory(row[MOVE_COLUMNS.CATEGORY] ?? ""),
    // "-" や "—" は威力なし (ステータス技等) として扱う
    power:    powerRaw && powerRaw !== "-" && powerRaw !== "—" ? parseInt(powerRaw) : "",
    accuracy: accuracyRaw && accuracyRaw !== "-" && accuracyRaw !== "—" ? parseInt(accuracyRaw) : "",
    pp:       parseInt(row[MOVE_COLUMNS.PP] ?? "0") || 0,
  }
}

// ============================================================
// MoveSheetRow → MoveData 変換
// ============================================================

export function convertToMoveData(row: MoveSheetRow): MoveData {
  return {
    name:     row.nameJa || row.name,
    type:     row.type,
    category: row.category,
    power:    typeof row.power === "number" ? row.power : null,
    accuracy: typeof row.accuracy === "number" ? row.accuracy : null,
    priority: 0,
    isSpread: false,
    flags:    inferMoveFlags(row.name),
  }
}

function inferMoveFlags(moveName: string): MoveFlags {
  const n = moveName.toLowerCase()
  return {
    isContact:     isContactMove(n),
    isSound:       isSoundMove(n),
    isPiercing:    false,
    isRecoil:      isRecoilMove(n),
    isDrain:       isDrainMove(n),
    isPunch:       isPunchMove(n),
    isPulse:       isPulseMove(n),
    isBall:        isBallMove(n),
    isBite:        isBiteMove(n),
    isCutting:     isCuttingMove(n),
    isExplosive:   isExplosiveMove(n),
    ignoreAbility: false,
  }
}

function isContactMove(n: string)  { return ["tackle","scratch","pound","headbutt","bodyslam","slash","closecombat","superpower","ironhead","zenheadbutt","shadowclaw","nightslash","leafblade","woodhammer","bulletpunch","icepunch","thunderpunch","firepunch","brickbreak","bounce","fly","extremespeed","meteormash"].some(k => n.includes(k)) }
function isSoundMove(n: string)    { return ["hypervoice","boomburst","uproar","growl","roar","screech","sing","supersonic","snore","bugbuzz","disarmingvoice","echoedvoice","relicsong","snarl","chatter"].some(k => n.includes(k)) }
function isRecoilMove(n: string)   { return ["doubleedge","headcharge","submission","takedown","flareblitz","volttackle","woodhammer","headsmash","bravebird","wildcharge"].some(k => n.includes(k)) }
function isDrainMove(n: string)    { return ["leechlife","gigadrain","megadrain","oblivionwing","drainpunch","hornleech","paraboliccharge"].some(k => n.includes(k)) }
function isPunchMove(n: string)    { return ["punch","focusblast","meteormash"].some(k => n.includes(k)) }
function isPulseMove(n: string)    { return ["pulse","aurasphere"].some(k => n.includes(k)) }
function isBallMove(n: string)     { return ["ball","bomb","cannon"].some(k => n.includes(k)) }
function isBiteMove(n: string)     { return ["bite","crunch","jawlock","fishious"].some(k => n.includes(k)) }
function isCuttingMove(n: string)  { return ["cut","slash","leafblade","shadowclaw","nightslash","psychocut","airslash","furycutter","sacredsword","secretsword","smartstrike","kowtowcleave","bitterblade","populationbomb"].some(k => n.includes(k)) }
function isExplosiveMove(n: string){ return ["explosion","selfdestruct","mindblown"].some(k => n.includes(k)) }
