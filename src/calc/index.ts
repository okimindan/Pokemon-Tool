/**
 * Pokemon SV Damage Calculator - Public API
 * このモジュールが外部から利用するエントリポイント
 */

export { calculateDamage } from "./damage"
export { calcAllStats, calcHP, calcStat, calcPokemonStats, validateEVs, validateIVs, maxIVs, zeroEVs, defaultRanks } from "./stats"
export { getTypeEffectiveness, getTypeEffectivenessMultiplier, getNatureModifier, getStatRankModifier, getWeatherModifier, getFieldModifier } from "./constants"
export type {
  // 基本型
  PokemonType,
  MoveCategory,
  Nature,
  StatName,
  Weather,
  Field,
  Rank,
  BattleFormat,
  StatusCondition,
  // ポケモン・技データ
  BaseStats,
  EVs,
  IVs,
  ActualStats,
  StatRanks,
  PokemonBuildInput,
  TerastalState,
  MoveData,
  MoveFlags,
  // バトルコンテキスト
  BattleContext,
  // 計算入出力
  DamageCalcInput,
  DamageCalcResult,
  DamageRoll,
  DamageBreakdown,
  ModifierDetail,
  // DB連携
  PokemonSheetRow,
  MoveSheetRow,
  // API
  ApiResponse,
  ApiResponseBody,
} from "./types"

// ============================================================
// 便利ファクトリ関数
// ============================================================

import type { BattleContext, PokemonBuildInput } from "./types"
import { defaultRanks, maxIVs, zeroEVs } from "./stats"

/**
 * デフォルトのバトルコンテキストを生成
 * (シングル・天候なし・フィールドなし)
 */
export function createDefaultContext(overrides?: Partial<BattleContext>): BattleContext {
  return {
    weather: "none",
    field: "none",
    format: "singles",
    turn: 1,
    isGravity: false,
    isMagicRoom: false,
    isWonderRoom: false,
    isTrickRoom: false,
    isReflect: false,
    isLightScreen: false,
    isAuroraVeil: false,
    ...overrides,
  }
}

/**
 * 最小限の情報からPokemonBuildInputを生成するファクトリ
 * (個体値最大・努力値ゼロ・テラスタルなし)
 */
export function createPokemonInput(
  partial: Pick<PokemonBuildInput, "name" | "baseStats" | "types" | "nature" | "ability"> &
    Partial<PokemonBuildInput>
): PokemonBuildInput {
  return {
    level: 50,
    evs: zeroEVs(),
    ivs: maxIVs(),
    item: "なし",
    status: "none",
    terastal: { isTerastallized: false, teraType: null },
    ranks: defaultRanks(),
    ...partial,
  }
}
