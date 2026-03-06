// ============================================================
// フロントエンド型定義 (バックエンド types.ts に対応)
// ============================================================

export type PokemonType =
  | "Normal" | "Fire" | "Water" | "Electric" | "Grass" | "Ice"
  | "Fighting" | "Poison" | "Ground" | "Flying" | "Psychic" | "Bug"
  | "Rock" | "Ghost" | "Dragon" | "Dark" | "Steel" | "Fairy" | "Stellar"

export type Nature =
  | "Hardy" | "Lonely" | "Brave" | "Adamant" | "Naughty"
  | "Bold" | "Docile" | "Relaxed" | "Impish" | "Lax"
  | "Timid" | "Hasty" | "Serious" | "Jolly" | "Naive"
  | "Modest" | "Mild" | "Quiet" | "Bashful" | "Rash"
  | "Calm" | "Gentle" | "Sassy" | "Careful" | "Quirky"

export type StatusCondition = "none" | "burn" | "poison" | "paralysis" | "sleep" | "freeze"
export type Weather = "none" | "sun" | "rain" | "sandstorm" | "snow" | "harshSun" | "heavyRain" | "strongWinds"
export type Field = "none" | "electricTerrain" | "grassyTerrain" | "mistyTerrain" | "psychicTerrain"
export type BattleFormat = "singles" | "doubles"

export interface EVs {
  hp: number
  attack: number
  defense: number
  spAttack: number
  spDefense: number
  speed: number
}

export interface IVs {
  hp: number
  attack: number
  defense: number
  spAttack: number
  spDefense: number
  speed: number
}

export interface StatRanks {
  attack: number
  defense: number
  spAttack: number
  spDefense: number
  speed: number
  accuracy: number
  evasion: number
}

export interface TerastalState {
  isTerastallized: boolean
  teraType: PokemonType | null
}

export interface BattleContext {
  weather: Weather
  field: Field
  format: BattleFormat
  isReflect: boolean
  isLightScreen: boolean
  isAuroraVeil: boolean
  isWonderRoom: boolean
}

export interface PokemonConfig {
  name: string
  level: number
  nature: Nature
  evs: EVs
  ivs: IVs
  ability: string
  item: string
  status: StatusCondition
  terastal: TerastalState
  ranks: StatRanks
}

export interface SavedSet {
  id: string
  name: string
  config: PokemonConfig
  createdAt: number
}

// ── API データ型 ──────────────────────────────────────────────

export interface PokemonRow {
  id: number
  name: string
  nameJa: string
  type1: PokemonType
  type2: PokemonType | ""
  hp: number
  attack: number
  defense: number
  spAttack: number
  spDefense: number
  speed: number
}

export interface MoveRow {
  id: number
  name: string
  nameJa: string
  type: PokemonType
  category: "Physical" | "Special" | "Status"
  power: number | ""
  accuracy: number | ""
  pp: number
}

// ── API レスポンス型 ──────────────────────────────────────────

export interface ActualStats {
  hp: number
  attack: number
  defense: number
  spAttack: number
  spDefense: number
  speed: number
}

export interface ModifierDetail {
  source: string
  multiplier: number
  description: string
}

export interface DamageBreakdown {
  baseDamage: number
  spreadModifier: number
  weatherModifier: number
  criticalModifier: number
  stabModifier: number
  typeEffectivenessModifier: number
  burnModifier: number
  screenModifier: number
  otherModifiers: ModifierDetail[]
  teraModifier: number
  fieldModifier: number
}

export interface CalcResult {
  success: boolean
  error?: string
  attackerStats: ActualStats
  defenderStats: ActualStats
  effectiveAttack: number
  effectiveDefense: number
  effectivePower: number
  damageRolls: number[]
  minDamage: number
  maxDamage: number
  minPercent: number
  maxPercent: number
  minKOHits: number
  maxKOHits: number
  koDescription: string
  breakdown: DamageBreakdown
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}
