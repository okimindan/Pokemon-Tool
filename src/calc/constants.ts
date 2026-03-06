/**
 * Pokemon SV Damage Calculator - 定数・テーブル定義
 * タイプ相性表・性格補正・ランク補正テーブル等
 */

import type { Nature, PokemonType, StatName } from "./types"

// ============================================================
// タイプ相性表 (第6世代以降 / Gen9対応)
// [攻撃タイプ][防御タイプ] = 倍率 (0, 0.5, 1, 2)
// ============================================================

export const TYPE_CHART: Readonly<Record<PokemonType, Partial<Record<PokemonType, number>>>> = {
  Normal:   { Rock: 0.5, Ghost: 0, Steel: 0.5 },
  Fire:     { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 },
  Water:    { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Electric: { Water: 2, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Grass:    { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5, Steel: 0.5 },
  Ice:      { Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 },
  Fighting: { Normal: 2, Ice: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ghost: 0, Dark: 2, Steel: 2, Fairy: 0.5 },
  Poison:   { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 2 },
  Ground:   { Fire: 2, Electric: 2, Grass: 0.5, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 },
  Flying:   { Electric: 0.5, Grass: 2, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
  Psychic:  { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
  Bug:      { Fire: 0.5, Grass: 2, Fighting: 0.5, Flying: 0.5, Psychic: 2, Ghost: 0.5, Dark: 2, Steel: 0.5, Fairy: 0.5 },
  Rock:     { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
  Ghost:    { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 },
  Dragon:   { Dragon: 2, Steel: 0.5, Fairy: 0 },
  Dark:     { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5, Fairy: 0.5 },
  Steel:    { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 2, Rock: 2, Steel: 0.5, Fairy: 2 },
  Fairy:    { Fire: 0.5, Fighting: 2, Poison: 0.5, Dragon: 2, Dark: 2, Steel: 0.5 },
  Stellar:  {}, // テラスタル専用: 全タイプに等倍 (通常の相性は無効)
} as const

/**
 * タイプ相性倍率を取得
 * @param attackType 攻撃タイプ
 * @param defenseType 防御タイプ
 * @returns 倍率 (0, 0.5, 1, 2)
 */
export function getTypeEffectiveness(attackType: PokemonType, defenseType: PokemonType): number {
  if (attackType === "Stellar") return 1.2 // Stellar: 各タイプに1.2倍 (初回のみ)
  return TYPE_CHART[attackType]?.[defenseType] ?? 1
}

/**
 * 複合タイプへのタイプ相性倍率を計算
 * @param attackType 攻撃タイプ
 * @param defenseTypes 防御側のタイプ配列 (1〜2タイプ)
 */
export function getTypeEffectivenessMultiplier(
  attackType: PokemonType,
  defenseTypes: PokemonType[]
): number {
  return defenseTypes.reduce((acc, t) => acc * getTypeEffectiveness(attackType, t), 1)
}

// ============================================================
// 性格補正テーブル
// ============================================================

/** 性格による補正が上昇するステータス */
const NATURE_BOOST: Readonly<Partial<Record<Nature, StatName>>> = {
  Lonely: "attack",  Brave:   "attack",  Adamant: "attack",  Naughty: "attack",
  Bold:   "defense", Relaxed: "defense", Impish:  "defense", Lax:     "defense",
  Timid:  "speed",   Hasty:   "speed",   Jolly:   "speed",   Naive:   "speed",
  Modest: "spAttack",Mild:    "spAttack",Quiet:   "spAttack",Rash:    "spAttack",
  Calm:   "spDefense",Gentle: "spDefense",Sassy:  "spDefense",Careful: "spDefense",
} as const

/** 性格による補正が下降するステータス */
const NATURE_DROP: Readonly<Partial<Record<Nature, StatName>>> = {
  Lonely:  "defense",  Bold:    "attack",   Modest: "attack",   Calm:    "attack",
  Timid:   "attack",   Hasty:   "defense",  Mild:   "defense",  Gentle:  "defense",
  Brave:   "speed",    Relaxed: "speed",    Quiet:  "speed",    Sassy:   "speed",
  Adamant: "spAttack", Impish:  "spAttack", Jolly:  "spAttack", Careful: "spAttack",
  Naughty: "spDefense",Lax:     "spDefense",Naive:  "spDefense",Rash:    "spDefense",
} as const

/**
 * 性格補正倍率を取得
 * @param nature 性格
 * @param stat ステータス名
 * @returns 1.1, 0.9, または 1.0
 */
export function getNatureModifier(nature: Nature, stat: StatName): number {
  if (stat === "hp") return 1.0
  if (NATURE_BOOST[nature] === stat) return 1.1
  if (NATURE_DROP[nature] === stat) return 0.9
  return 1.0
}

// ============================================================
// ランク補正テーブル
// ============================================================

/** 攻撃・防御・特攻・特防・素早さのランク補正分子/分母 */
const STAT_RANK_NUMERATOR: Readonly<Record<number, number>> = {
  "-6": 2, "-5": 2, "-4": 2, "-3": 2, "-2": 2, "-1": 2,
  "0": 2,
  "1": 3, "2": 4, "3": 5, "4": 6, "5": 7, "6": 8,
}

const STAT_RANK_DENOMINATOR: Readonly<Record<number, number>> = {
  "-6": 8, "-5": 7, "-4": 6, "-3": 5, "-2": 4, "-1": 3,
  "0": 2,
  "1": 2, "2": 2, "3": 2, "4": 2, "5": 2, "6": 2,
}

/**
 * ランク補正の分子を取得 (stat * numerator / denominator)
 */
export function getRankNumerator(rank: number): number {
  return (STAT_RANK_NUMERATOR as Record<string, number>)[rank.toString()] ?? 2
}

export function getRankDenominator(rank: number): number {
  return (STAT_RANK_DENOMINATOR as Record<string, number>)[rank.toString()] ?? 2
}

/**
 * ランク補正倍率を返す (float)
 */
export function getStatRankModifier(rank: number): number {
  return getRankNumerator(rank) / getRankDenominator(rank)
}

// ============================================================
// 天候補正テーブル
// ============================================================

/**
 * 天候による技威力補正を取得
 * @param moveType 技タイプ
 * @param weather 天候
 * @returns 補正値 (0.5, 1.0, 1.5)
 */
export function getWeatherModifier(moveType: PokemonType, weather: string): number {
  switch (weather) {
    case "sun":
      if (moveType === "Fire")  return 1.5
      if (moveType === "Water") return 0.5
      return 1.0
    case "harshSunlight":
      if (moveType === "Fire")  return 1.5
      if (moveType === "Water") return 0    // 大日照: 水技無効
      return 1.0
    case "rain":
      if (moveType === "Water") return 1.5
      if (moveType === "Fire")  return 0.5
      return 1.0
    case "heavyRain":
      if (moveType === "Water") return 1.5
      if (moveType === "Fire")  return 0    // 大雨: 炎技無効
      return 1.0
    case "sandstorm":
    case "snow":
    case "strongWinds":
    case "none":
    default:
      return 1.0
  }
}

// ============================================================
// フィールド補正テーブル
// ============================================================

/**
 * フィールドによる技威力補正を取得
 * (地面に接地しているポケモンのみ効果)
 */
export function getFieldModifier(
  moveType: PokemonType,
  field: string,
  isGrounded: boolean
): number {
  if (!isGrounded) return 1.0
  switch (field) {
    case "electricTerrain":
      return moveType === "Electric" ? 1.3 : 1.0
    case "grassyTerrain":
      return moveType === "Grass" ? 1.3 : 1.0
    case "psychicTerrain":
      return moveType === "Psychic" ? 1.3 : 1.0
    case "mistyTerrain":
      return moveType === "Dragon" ? 0.5 : 1.0
    default:
      return 1.0
  }
}

// ============================================================
// 壁補正
// ============================================================

/**
 * リフレクター/ひかりのかべ/オーロラベールの補正
 * ダブルでは 2/3, シングルでは 1/2 に減少
 * 急所時は無効
 */
export function getScreenModifier(
  isCritical: boolean,
  hasScreen: boolean,
  isDoubles: boolean
): number {
  if (isCritical || !hasScreen) return 1.0
  return isDoubles ? 2 / 3 : 0.5
}

// ============================================================
// よく使う持ち物の補正値
// ============================================================

export const ITEM_MODIFIERS: Readonly<Record<string, number>> = {
  "いのちのたま":     1.3,   // Life Orb
  "こだわりメガネ":   1.5,   // Choice Specs
  "こだわりハチマキ": 1.5,   // Choice Band
  "たつじんのおび":   1.2,   // Expert Belt (相性抜群時のみ)
  "タイプ強化アイテム": 1.2, // Type-enhancing items (炎のプレート等)
  "シルクのスカーフ":  1.2,  // Silk Scarf (ノーマル強化)
}

// ============================================================
// ランク補正を無視する特性リスト
// ============================================================

/** 防御側のランク上昇を無視する特性 */
export const ABILITIES_IGNORE_DEFENSE_BOOST = new Set([
  "かたやぶり",   // Mold Breaker
  "テラボルテージ", // Teravolt
  "ターボブレイズ", // Turboblaze
])

/** 防御側のランク低下を無視する急所関連 */
export const ABILITIES_IGNORE_ATTACK_DROP = new Set([
  // 急所時は攻撃側ランク低下・防御側ランク上昇を無視
])

// ============================================================
// STAB倍率
// ============================================================

/** 通常STAB */
export const STAB_NORMAL = 1.5
/** Adaptability (てきおうりょく) */
export const STAB_ADAPTABILITY = 2.0
/** テラスタル時: Teraタイプ = 元タイプ */
export const STAB_TERA_SAME_AS_ORIGINAL = 2.0
/** テラスタル時: Teraタイプ ≠ 元タイプ だが技タイプと一致 */
export const STAB_TERA_NEW_TYPE = 1.5
