import { NATURES } from "./constants"
import type { PokemonConfig, ActualStats } from "./types"

// ============================================================
// ステータス実数値計算 (バックエンド stats.ts と同じ計算式)
// ============================================================

function calcHP(base: number, iv: number, ev: number, level: number): number {
  return Math.floor((Math.floor(2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10
}

function calcStat(base: number, iv: number, ev: number, level: number, natureModifier: number): number {
  return Math.floor((Math.floor((2 * base + iv + Math.floor(ev / 4)) * level / 100) + 5) * natureModifier)
}

function getNatureModifier(nature: string, stat: string): number {
  const n = NATURES.find(n => n.name === nature)
  if (!n) return 1.0
  if (n.boosted === stat) return 1.1
  if (n.dropped === stat) return 0.9
  return 1.0
}

export function calcActualStats(config: PokemonConfig, baseStats: {
  hp: number; attack: number; defense: number; spAttack: number; spDefense: number; speed: number
}): ActualStats {
  const { level, nature, evs, ivs } = config
  return {
    hp:        calcHP(baseStats.hp, ivs.hp, evs.hp, level),
    attack:    calcStat(baseStats.attack,    ivs.attack,    evs.attack,    level, getNatureModifier(nature, "attack")),
    defense:   calcStat(baseStats.defense,   ivs.defense,   evs.defense,   level, getNatureModifier(nature, "defense")),
    spAttack:  calcStat(baseStats.spAttack,  ivs.spAttack,  evs.spAttack,  level, getNatureModifier(nature, "spAttack")),
    spDefense: calcStat(baseStats.spDefense, ivs.spDefense, evs.spDefense, level, getNatureModifier(nature, "spDefense")),
    speed:     calcStat(baseStats.speed,     ivs.speed,     evs.speed,     level, getNatureModifier(nature, "speed")),
  }
}

// ============================================================
// ランク補正
// ============================================================

const RANK_NUMERATORS: Record<number, number> = {
  [-6]: 2, [-5]: 2, [-4]: 2, [-3]: 2, [-2]: 2, [-1]: 3,
  [0]: 4,
  [1]: 5, [2]: 6, [3]: 7, [4]: 8, [5]: 9, [6]: 10,
}
const RANK_DENOMINATORS: Record<number, number> = {
  [-6]: 8, [-5]: 7, [-4]: 6, [-3]: 5, [-2]: 4, [-1]: 3,
  [0]: 4,
  [1]: 4, [2]: 4, [3]: 4, [4]: 4, [5]: 4, [6]: 4,
}

function applyRank(stat: number, rank: number): number {
  const num = RANK_NUMERATORS[rank] ?? 4
  const den = RANK_DENOMINATORS[rank] ?? 4
  return Math.floor(stat * num / den)
}

// ============================================================
// 素早さ比較
// ============================================================

export interface SpeedOptions {
  hasScarf: boolean
  hasParalysis: boolean
  hasTailwind: boolean
  rank: number
  trickRoom: boolean
}

export function calcEffectiveSpeed(
  baseSpeed: number,
  options: SpeedOptions
): number {
  let speed = baseSpeed
  speed = applyRank(speed, options.rank)
  if (options.hasScarf)     speed = Math.floor(speed * 1.5)
  if (options.hasTailwind)  speed = speed * 2
  if (options.hasParalysis) speed = Math.floor(speed * 0.5)
  return speed
}

export interface SpeedComparisonResult {
  attackerSpeed: number
  defenderSpeed: number
  attackerGoesFirst: boolean
  isTie: boolean
}

export function compareSpeed(
  attackerBaseSpeed: number,
  defenderBaseSpeed: number,
  attackerOpts: SpeedOptions,
  defenderOpts: SpeedOptions
): SpeedComparisonResult {
  const aSpeed = calcEffectiveSpeed(attackerBaseSpeed, attackerOpts)
  const dSpeed = calcEffectiveSpeed(defenderBaseSpeed, defenderOpts)

  const trickRoom = attackerOpts.trickRoom
  const attackerGoesFirst = trickRoom ? aSpeed < dSpeed : aSpeed > dSpeed

  return {
    attackerSpeed: aSpeed,
    defenderSpeed: dSpeed,
    attackerGoesFirst: isTie(aSpeed, dSpeed) ? true : attackerGoesFirst,
    isTie: isTie(aSpeed, dSpeed),
  }
}

function isTie(a: number, b: number): boolean {
  return a === b
}
