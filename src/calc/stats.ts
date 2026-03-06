/**
 * Pokemon SV Damage Calculator - ステータス計算
 * 第9世代の実数値計算・ランク補正込み有効ステータス計算
 */

import type { BaseStats, EVs, IVs, ActualStats, Nature, PokemonBuildInput, StatRanks } from "./types"
import { getNatureModifier, getRankNumerator, getRankDenominator } from "./constants"

// ============================================================
// 個別ステータス計算
// ============================================================

/**
 * HP実数値を計算
 * HP = floor((2*Base + IV + floor(EV/4)) * Level / 100) + Level + 10
 * ※ヌケニン(Shedinja)は常に1
 */
export function calcHP(base: number, iv: number, ev: number, level: number): number {
  if (base === 1) return 1 // ヌケニン判定
  return Math.floor(
    (Math.floor(2 * base + iv + Math.floor(ev / 4)) * level) / 100
  ) + level + 10
}

/**
 * HP以外のステータス実数値を計算
 * Stat = floor((floor((2*Base + IV + floor(EV/4)) * Level / 100) + 5) * NatureModifier)
 */
export function calcStat(
  base: number,
  iv: number,
  ev: number,
  level: number,
  natureModifier: number
): number {
  const inner = Math.floor((2 * base + iv + Math.floor(ev / 4)) * level / 100) + 5
  return Math.floor(inner * natureModifier)
}

/**
 * 全ステータス実数値を一括計算
 */
export function calcAllStats(
  baseStats: BaseStats,
  ivs: IVs,
  evs: EVs,
  level: number,
  nature: Nature
): ActualStats {
  return {
    hp: calcHP(baseStats.hp, ivs.hp, evs.hp, level),
    attack: calcStat(
      baseStats.attack, ivs.attack, evs.attack, level,
      getNatureModifier(nature, "attack")
    ),
    defense: calcStat(
      baseStats.defense, ivs.defense, evs.defense, level,
      getNatureModifier(nature, "defense")
    ),
    spAttack: calcStat(
      baseStats.spAttack, ivs.spAttack, evs.spAttack, level,
      getNatureModifier(nature, "spAttack")
    ),
    spDefense: calcStat(
      baseStats.spDefense, ivs.spDefense, evs.spDefense, level,
      getNatureModifier(nature, "spDefense")
    ),
    speed: calcStat(
      baseStats.speed, ivs.speed, evs.speed, level,
      getNatureModifier(nature, "speed")
    ),
  }
}

// ============================================================
// ランク補正込みステータス計算
// ============================================================

/**
 * ランク補正を適用した有効ステータスを計算
 * StatRank = floor(ActualStat * Numerator / Denominator)
 */
export function applyRankModifier(stat: number, rank: number): number {
  const num = getRankNumerator(rank)
  const den = getRankDenominator(rank)
  return Math.floor(stat * num / den)
}

/**
 * 攻撃側の有効攻撃/特攻ステータスを計算
 * (急所時はランク低下を無視)
 */
export function getEffectiveAttack(
  actualStats: ActualStats,
  ranks: StatRanks,
  isPhysical: boolean,
  isCritical: boolean
): number {
  const baseStat = isPhysical ? actualStats.attack : actualStats.spAttack
  const baseRank = isPhysical ? ranks.attack : ranks.spAttack

  // 急所時は攻撃ランク低下を無視 (マイナスは0として扱う)
  const effectiveRank = isCritical ? Math.max(0, baseRank) : baseRank
  return applyRankModifier(baseStat, effectiveRank)
}

/**
 * 防御側の有効防御/特防ステータスを計算
 * (急所時はランク上昇を無視)
 */
export function getEffectiveDefense(
  actualStats: ActualStats,
  ranks: StatRanks,
  isPhysical: boolean,
  isCritical: boolean,
  weather: string
): number {
  const baseStat = isPhysical ? actualStats.defense : actualStats.spDefense
  const baseRank = isPhysical ? ranks.defense : ranks.spDefense

  // 急所時は防御ランク上昇を無視 (プラスは0として扱う)
  const effectiveRank = isCritical ? Math.min(0, baseRank) : baseRank

  let stat = applyRankModifier(baseStat, effectiveRank)

  // 砂嵐時のいわタイプの特防1.5倍補正はダメージ計算内で処理

  return stat
}

// ============================================================
// PokemonBuildInput から実数値を計算するユーティリティ
// ============================================================

/**
 * PokemonBuildInputからActualStatsを計算して返す
 */
export function calcPokemonStats(pokemon: PokemonBuildInput): ActualStats {
  return calcAllStats(
    pokemon.baseStats,
    pokemon.ivs,
    pokemon.evs,
    pokemon.level,
    pokemon.nature
  )
}

/**
 * 努力値の合計が有効かチェック (最大510)
 */
export function validateEVs(evs: EVs): boolean {
  const total = Object.values(evs).reduce((sum, v) => sum + v, 0)
  return total <= 510 && Object.values(evs).every(v => v >= 0 && v <= 252)
}

/**
 * 個体値の有効チェック (0-31)
 */
export function validateIVs(ivs: IVs): boolean {
  return Object.values(ivs).every(v => v >= 0 && v <= 31)
}

/**
 * デフォルトの最大個体値IVsを返す
 */
export function maxIVs(): IVs {
  return { hp: 31, attack: 31, defense: 31, spAttack: 31, spDefense: 31, speed: 31 }
}

/**
 * デフォルトの努力値ゼロを返す
 */
export function zeroEVs(): EVs {
  return { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 }
}

/**
 * デフォルトのランク補正ゼロを返す
 */
export function defaultRanks() {
  return {
    attack: 0 as const,
    defense: 0 as const,
    spAttack: 0 as const,
    spDefense: 0 as const,
    speed: 0 as const,
    accuracy: 0 as const,
    evasion: 0 as const,
  }
}
