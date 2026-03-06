/**
 * Pokemon SV Damage Calculator - Type Definitions
 * 第9世代ダメージ計算システムの全TypeScript型定義
 */

// ============================================================
// 基本列挙型
// ============================================================

/** 18タイプ (第6世代以降) */
export type PokemonType =
  | "Normal"   | "Fire"     | "Water"    | "Electric"
  | "Grass"    | "Ice"      | "Fighting" | "Poison"
  | "Ground"   | "Flying"   | "Psychic"  | "Bug"
  | "Rock"     | "Ghost"    | "Dragon"   | "Dark"
  | "Steel"    | "Fairy"    | "Stellar"  // Stellar: テラスタル専用タイプ (第9世代追加)

/** 技カテゴリ */
export type MoveCategory = "Physical" | "Special" | "Status"

/** 性格 (25種類) */
export type Nature =
  | "Hardy"   | "Lonely"  | "Brave"   | "Adamant" | "Naughty"
  | "Bold"    | "Docile"  | "Relaxed" | "Impish"  | "Lax"
  | "Timid"   | "Hasty"   | "Serious" | "Jolly"   | "Naive"
  | "Modest"  | "Mild"    | "Quiet"   | "Bashful" | "Rash"
  | "Calm"    | "Gentle"  | "Sassy"   | "Careful" | "Quirky"

/** ステータス名 */
export type StatName = "hp" | "attack" | "defense" | "spAttack" | "spDefense" | "speed"

/** 天候 */
export type Weather =
  | "none"
  | "sun"           // 晴れ (にほんばれ)
  | "rain"          // 雨 (あめふらし)
  | "sandstorm"     // 砂嵐 (すなあらし)
  | "snow"          // 雪 (ゆき) ※SVから雹→雪に変更
  | "harshSunlight" // 強い日差し (めざめるパワー系)
  | "heavyRain"     // 大雨 (プライマルカイオーガ)
  | "strongWinds"   // 強い風 (メガレックウザ)

/** フィールド */
export type Field =
  | "none"
  | "electricTerrain"  // エレキフィールド
  | "grassyTerrain"    // グラスフィールド
  | "mistyTerrain"     // ミストフィールド
  | "psychicTerrain"   // サイコフィールド

/** ランク補正 (-6 ~ +6) */
export type Rank = -6 | -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6

/** 急所段階 */
export type CriticalStage = 0 | 1 | 2 | 3

/** バトル形式 */
export type BattleFormat = "singles" | "doubles"

/** 状態異常 */
export type StatusCondition = "none" | "burn" | "poison" | "paralysis" | "sleep" | "freeze"

// ============================================================
// ベース種族値インターフェース
// ============================================================

/** 種族値 */
export interface BaseStats {
  hp: number
  attack: number
  defense: number
  spAttack: number
  spDefense: number
  speed: number
}

/** 努力値 (合計510以下, 各252以下) */
export interface EVs {
  hp: number
  attack: number
  defense: number
  spAttack: number
  spDefense: number
  speed: number
}

/** 個体値 (0-31) */
export interface IVs {
  hp: number
  attack: number
  defense: number
  spAttack: number
  spDefense: number
  speed: number
}

/** 実数値 */
export interface ActualStats {
  hp: number
  attack: number
  defense: number
  spAttack: number
  spDefense: number
  speed: number
}

/** ランク補正 */
export interface StatRanks {
  attack: Rank
  defense: Rank
  spAttack: Rank
  spDefense: Rank
  speed: Rank
  accuracy: Rank
  evasion: Rank
}

// ============================================================
// ポケモン定義
// ============================================================

/** ポケモンデータ (攻撃側・防御側共通) */
export interface PokemonBuildInput {
  /** ポケモン名 (識別用) */
  name: string
  /** 種族値 */
  baseStats: BaseStats
  /** タイプ (最大2つ) */
  types: [PokemonType] | [PokemonType, PokemonType]
  /** レベル (通常50) */
  level: number
  /** 性格 */
  nature: Nature
  /** 努力値 */
  evs: EVs
  /** 個体値 */
  ivs: IVs
  /** 特性 */
  ability: string
  /** 持ち物 */
  item: string
  /** 状態異常 */
  status: StatusCondition
  /** テラスタル状態 */
  terastal: TerastalState
  /** ランク補正 */
  ranks: StatRanks
}

/** テラスタル状態 */
export interface TerastalState {
  /** テラスタルしているか */
  isTerastallized: boolean
  /** テラスタルタイプ */
  teraType: PokemonType | null
}

// ============================================================
// 技定義
// ============================================================

/** 技データ */
export interface MoveData {
  /** 技名 */
  name: string
  /** 技タイプ */
  type: PokemonType
  /** 技カテゴリ */
  category: MoveCategory
  /** 威力 (固定値 or 変動技はnull) */
  power: number | null
  /** 命中率 */
  accuracy: number | null
  /** 優先度 */
  priority: number
  /** 複数対象か (ダブル) */
  isSpread: boolean
  /** 追加効果・特殊処理フラグ */
  flags: MoveFlags
}

/** 技の特殊フラグ */
export interface MoveFlags {
  /** 接触技か */
  isContact: boolean
  /** 音技か */
  isSound: boolean
  /** 貫通技か (守る貫通) */
  isPiercing: boolean
  /** 反動技か */
  isRecoil: boolean
  /** 吸収技か */
  isDrain: boolean
  /** パンチ技か */
  isPunch: boolean
  /** 波動技か */
  isPulse: boolean
  /** 弾技か */
  isBall: boolean
  /** 噛み技か */
  isBite: boolean
  /** 切る技か */
  isCutting: boolean
  /** 爆発技か */
  isExplosive: boolean
  /** 無効化不可か (重力など) */
  ignoreAbility: boolean
}

// ============================================================
// バトルコンテキスト
// ============================================================

/** バトル全体の状況 */
export interface BattleContext {
  /** 天候 */
  weather: Weather
  /** フィールド */
  field: Field
  /** バトル形式 */
  format: BattleFormat
  /** ターン数 (一部技・特性で参照) */
  turn: number
  /** グラビティ状態 */
  isGravity: boolean
  /** マジックルーム状態 */
  isMagicRoom: boolean
  /** ワンダールーム状態 */
  isWonderRoom: boolean
  /** じゅうりょく状態 */
  isTrickRoom: boolean
  /** 壁: リフレクター (防御側に影響) */
  isReflect: boolean
  /** 壁: ひかりのかべ (特防側に影響) */
  isLightScreen: boolean
  /** 壁: オーロラベール */
  isAuroraVeil: boolean
}

// ============================================================
// 計算入力/出力
// ============================================================

/** ダメージ計算入力 */
export interface DamageCalcInput {
  /** 攻撃側ポケモン */
  attacker: PokemonBuildInput
  /** 防御側ポケモン */
  defender: PokemonBuildInput
  /** 使用技 */
  move: MoveData
  /** バトル状況 */
  context: BattleContext
  /** 急所 */
  isCritical: boolean
}

/** ダメージロール (16個の乱数) */
export type DamageRoll = [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number
]

/** ダメージ計算結果 */
export interface DamageCalcResult {
  /** 計算が成功したか */
  success: boolean
  /** エラーメッセージ (失敗時) */
  error?: string

  /** 攻撃側実数値 */
  attackerStats: ActualStats
  /** 防御側実数値 */
  defenderStats: ActualStats

  /** 使用した攻撃ステータス */
  effectiveAttack: number
  /** 使用した防御ステータス */
  effectiveDefense: number

  /** 技の実際の威力 */
  effectivePower: number

  /** 16個のダメージロール */
  damageRolls: DamageRoll

  /** 最小ダメージ */
  minDamage: number
  /** 最大ダメージ */
  maxDamage: number

  /** 防御側HPに対する最小割合 (%) */
  minPercent: number
  /** 防御側HPに対する最大割合 (%) */
  maxPercent: number

  /** 最小何発で倒せるか */
  minKOHits: number
  /** 最大何発で倒せるか */
  maxKOHits: number

  /** 乱数判定の内訳 (例: "16/16で確定1発") */
  koDescription: string

  /** 計算内訳 (デバッグ・表示用) */
  breakdown: DamageBreakdown
}

/** ダメージ計算の内訳 (Gemini API連携で使用想定) */
export interface DamageBreakdown {
  /** 基礎ダメージ */
  baseDamage: number
  /** スプレッド補正 */
  spreadModifier: number
  /** 天候補正 */
  weatherModifier: number
  /** 急所補正 */
  criticalModifier: number
  /** STAB補正 */
  stabModifier: number
  /** タイプ相性補正 */
  typeEffectivenessModifier: number
  /** やけど補正 */
  burnModifier: number
  /** 壁補正 */
  screenModifier: number
  /** その他補正 (持ち物・特性) */
  otherModifiers: ModifierDetail[]
  /** テラスタル補正 */
  teraModifier: number
  /** フィールド補正 */
  fieldModifier: number
}

/** 補正詳細 (デバッグ・表示用) */
export interface ModifierDetail {
  /** 補正の名前 */
  source: string
  /** 補正値 */
  multiplier: number
  /** 説明 */
  description: string
}

// ============================================================
// Google Sheets DB 連携型
// ============================================================

/** スプレッドシート上のポケモン基本データ行 */
export interface PokemonSheetRow {
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

/** スプレッドシート上の技データ行 */
export interface MoveSheetRow {
  id: number
  name: string
  nameJa: string
  type: PokemonType
  category: MoveCategory
  power: number | ""
  accuracy: number | ""
  pp: number
}

// ============================================================
// Lambda API 型
// ============================================================

/** Lambda APIレスポンス共通形式 */
export interface ApiResponse<T> {
  statusCode: number
  headers: Record<string, string>
  body: string // JSON.stringify(T)
}

/** Lambda APIレスポンスボディ */
export interface ApiResponseBody<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}
