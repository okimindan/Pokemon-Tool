/**
 * Pokemon SV Damage Calculator - コアダメージ計算ロジック
 *
 * 第9世代 (Scarlet/Violet) の公式ダメージ計算式を実装
 *
 * 計算式:
 *   BaseDmg = floor(floor(floor(2 * Level / 5 + 2) * Power * A / D) / 50) + 2
 *   FinalDmg = floor(BaseDmg * Spread * Weather * Critical * Random * STAB * Type * Burn * Other * TeraStab)
 *
 * 補正適用順序 (Bulbapedia準拠):
 *   1. スプレッド (ダブル複数対象)
 *   2. 天候
 *   3. グレイブラッシュ (前ターン使用時2倍)
 *   4. 急所 (1.5倍)
 *   5. 乱数 (85〜100/100 = 16段階)
 *   6. STAB (1.5倍 / テラスタル2倍)
 *   7. タイプ相性 (0.25, 0.5, 1, 2, 4)
 *   8. やけど (0.5倍)
 *   9. その他 (壁・持ち物・特性)
 *  10. テラスタル補正
 */

import type {
  DamageCalcInput,
  DamageCalcResult,
  DamageRoll,
  DamageBreakdown,
  ModifierDetail,
  ActualStats,
  PokemonType,
} from "./types"
import {
  getTypeEffectivenessMultiplier,
  getWeatherModifier,
  getFieldModifier,
  getScreenModifier,
  STAB_NORMAL,
  STAB_ADAPTABILITY,
  STAB_TERA_SAME_AS_ORIGINAL,
  STAB_TERA_NEW_TYPE,
} from "./constants"
import { calcPokemonStats, getEffectiveAttack, getEffectiveDefense } from "./stats"

// ============================================================
// メインダメージ計算関数
// ============================================================

/**
 * 第9世代ダメージ計算
 *
 * @param input - 攻撃側・防御側・技・バトル状況
 * @returns DamageCalcResult - ダメージ範囲・割合・内訳
 */
export function calculateDamage(input: DamageCalcInput): DamageCalcResult {
  try {
    const { attacker, defender, move, context, isCritical } = input

    // ── ステータス実数値計算 ──────────────────────────────────
    const attackerStats = calcPokemonStats(attacker)
    const defenderStats = calcPokemonStats(defender)

    // ── 技威力の確定 ──────────────────────────────────────────
    const effectivePower = resolveMovePower(input, attackerStats, defenderStats)
    if (effectivePower === 0) {
      return buildFailResult("技の威力が0です (無効タイプかステータス技)")
    }

    // ── 使用するA/Dステータスの決定 ────────────────────────────
    const isPhysical = move.category === "Physical"
    // ワンダールーム: 物理と特殊の防御参照を入れ替え
    const usePhysical = context.isWonderRoom ? !isPhysical : isPhysical

    const effectiveAttack = resolveEffectiveAttack(input, attackerStats, usePhysical, isCritical)
    const effectiveDefense = resolveEffectiveDefense(input, defenderStats, usePhysical, isCritical)

    // ── 基礎ダメージ計算 ─────────────────────────────────────
    // BaseDmg = floor(floor(floor(2 * Level / 5 + 2) * Power * A / D) / 50) + 2
    const levelFactor = Math.floor(2 * attacker.level / 5 + 2)
    const baseDamage =
      Math.floor(
        Math.floor(levelFactor * effectivePower * effectiveAttack / effectiveDefense) / 50
      ) + 2

    // ── 各補正値の計算 ───────────────────────────────────────
    const otherModifiers: ModifierDetail[] = []

    // スプレッド補正 (ダブルで複数対象の場合 0.75)
    const spreadModifier = resolveSpreadModifier(move, context)
    if (spreadModifier !== 1) {
      otherModifiers.push({ source: "スプレッド", multiplier: spreadModifier, description: "ダブルバトル複数対象" })
    }

    // 天候補正
    const weatherModifier = getWeatherModifier(move.type, context.weather)
    if (weatherModifier !== 1) {
      otherModifiers.push({ source: "天候", multiplier: weatherModifier, description: context.weather })
    }

    // 急所補正
    const criticalModifier = isCritical ? 1.5 : 1.0
    if (isCritical) {
      otherModifiers.push({ source: "急所", multiplier: criticalModifier, description: "急所に当たった！" })
    }

    // STAB補正
    const stabModifier = resolveSTABModifier(attacker, move.type)
    if (stabModifier !== 1) {
      otherModifiers.push({ source: "STAB", multiplier: stabModifier, description: "タイプ一致ボーナス" })
    }

    // タイプ相性補正
    const defenderTypes = resolveDefenderTypes(defender)
    const typeModifier = getTypeEffectivenessMultiplier(move.type, defenderTypes)
    if (typeModifier !== 1) {
      otherModifiers.push({ source: "タイプ相性", multiplier: typeModifier, description: `${move.type} vs ${defenderTypes.join("/")}` })
    }

    // やけど補正 (物理技 + やけど + Guts/根性なし)
    const burnModifier = resolveBurnModifier(attacker, isPhysical)
    if (burnModifier !== 1) {
      otherModifiers.push({ source: "やけど", multiplier: burnModifier, description: "物理技でやけど状態" })
    }

    // 壁補正 (リフレクター・ひかりのかべ・オーロラベール)
    const hasPhysicalScreen = isPhysical && (context.isReflect || context.isAuroraVeil)
    const hasSpecialScreen = !isPhysical && (context.isLightScreen || context.isAuroraVeil)
    const screenModifier = getScreenModifier(isCritical, hasPhysicalScreen || hasSpecialScreen, context.format === "doubles")
    if (screenModifier !== 1) {
      const screenName = isPhysical ? (context.isAuroraVeil ? "オーロラベール" : "リフレクター") : (context.isAuroraVeil ? "オーロラベール" : "ひかりのかべ")
      otherModifiers.push({ source: screenName, multiplier: screenModifier, description: "壁効果" })
    }

    // 持ち物補正
    const itemModifier = resolveItemModifier(attacker, move.type, typeModifier > 1)
    if (itemModifier !== 1) {
      otherModifiers.push({ source: `持ち物: ${attacker.item}`, multiplier: itemModifier, description: "持ち物の補正" })
    }

    // 特性補正 (攻撃側)
    const attackerAbilityModifier = resolveAttackerAbilityModifier(attacker, defender, move.type, context, typeModifier)
    if (attackerAbilityModifier !== 1) {
      otherModifiers.push({ source: `特性: ${attacker.ability}`, multiplier: attackerAbilityModifier, description: "攻撃側特性補正" })
    }

    // 特性補正 (防御側)
    const defenderAbilityModifier = resolveDefenderAbilityModifier(defender, move.type, context)
    if (defenderAbilityModifier !== 1) {
      otherModifiers.push({ source: `特性: ${defender.ability}`, multiplier: defenderAbilityModifier, description: "防御側特性補正" })
    }

    // フィールド補正
    const attackerGrounded = isGrounded(attacker)
    const fieldModifier = getFieldModifier(move.type, context.field, attackerGrounded)
    if (fieldModifier !== 1) {
      otherModifiers.push({ source: "フィールド", multiplier: fieldModifier, description: context.field })
    }

    // テラスタル補正 (Tera Stellarの場合は1.2倍、それ以外はSTABで処理済み)
    const teraModifier = resolveTeraModifier(defender, move.type)
    if (teraModifier !== 1) {
      otherModifiers.push({ source: "テラスタル", multiplier: teraModifier, description: "テラスタル防御補正" })
    }

    // ── 16段階乱数ダメージロール計算 ──────────────────────────
    const damageRolls = calcDamageRolls(
      baseDamage,
      spreadModifier,
      weatherModifier,
      criticalModifier,
      stabModifier,
      typeModifier,
      burnModifier,
      screenModifier,
      itemModifier,
      attackerAbilityModifier,
      defenderAbilityModifier,
      fieldModifier,
      teraModifier
    )

    const minDamage = damageRolls[0]
    const maxDamage = damageRolls[15]
    const defenderHP = defenderStats.hp

    const minPercent = Math.round((minDamage / defenderHP) * 1000) / 10
    const maxPercent = Math.round((maxDamage / defenderHP) * 1000) / 10

    const minKOHits = Math.ceil(defenderHP / maxDamage)
    const maxKOHits = Math.ceil(defenderHP / minDamage)

    const koDescription = buildKODescription(damageRolls, defenderHP)

    const breakdown: DamageBreakdown = {
      baseDamage,
      spreadModifier,
      weatherModifier,
      criticalModifier,
      stabModifier,
      typeEffectivenessModifier: typeModifier,
      burnModifier,
      screenModifier,
      otherModifiers,
      teraModifier,
      fieldModifier,
    }

    return {
      success: true,
      attackerStats,
      defenderStats,
      effectiveAttack,
      effectiveDefense,
      effectivePower,
      damageRolls,
      minDamage,
      maxDamage,
      minPercent,
      maxPercent,
      minKOHits,
      maxKOHits,
      koDescription,
      breakdown,
    }
  } catch (err) {
    return buildFailResult(err instanceof Error ? err.message : "予期しないエラーが発生しました")
  }
}

// ============================================================
// 乱数ダメージロール計算
// ============================================================

/**
 * 85〜100の16段階乱数で全ダメージロールを計算
 * 各ステップでfloorを適用する (乱数補正以外は先にfloor済み基礎ダメージに適用)
 */
function calcDamageRolls(
  baseDamage: number,
  spread: number,
  weather: number,
  critical: number,
  stab: number,
  type: number,
  burn: number,
  screen: number,
  item: number,
  attackerAbility: number,
  defenderAbility: number,
  field: number,
  tera: number
): DamageRoll {
  const rolls: number[] = []

  for (let r = 85; r <= 100; r++) {
    // 補正適用: 各乗算ごとにfloorを適用 (Gen9仕様)
    let dmg = baseDamage

    // スプレッド
    dmg = chainFloorMul(dmg, spread)
    // 天候
    dmg = chainFloorMul(dmg, weather)
    // 急所
    dmg = chainFloorMul(dmg, critical)
    // 乱数 (r/100)
    dmg = Math.floor(dmg * r / 100)
    // STAB
    dmg = Math.floor(dmg * (stab * 4096) / 4096)
    // タイプ相性 (4096ベースの整数演算)
    dmg = pokeRound(dmg * typeToFraction(type) / 4096)
    // やけど
    dmg = chainFloorMul(dmg, burn)
    // 壁
    dmg = chainFloorMul(dmg, screen)
    // 持ち物
    dmg = pokeRound(dmg * (item * 4096) / 4096)
    // 攻撃側特性
    dmg = pokeRound(dmg * (attackerAbility * 4096) / 4096)
    // 防御側特性
    dmg = pokeRound(dmg * (defenderAbility * 4096) / 4096)
    // フィールド
    dmg = pokeRound(dmg * (field * 4096) / 4096)
    // テラスタル
    dmg = pokeRound(dmg * (tera * 4096) / 4096)

    rolls.push(Math.max(1, dmg))
  }

  return rolls as unknown as DamageRoll
}

/**
 * Gen9の4096分率乗算 (STAB・タイプ等)
 * pokeRound: 0.5以上の端数は切り上げ
 */
function pokeRound(value: number): number {
  return Math.floor(value + 0.5)
}

/**
 * floorを適用しながら乗算
 */
function chainFloorMul(base: number, multiplier: number): number {
  if (multiplier === 1) return base
  return Math.floor(base * multiplier)
}

/**
 * タイプ相性を4096ベース整数に変換して適用
 * 0.25 → 1024/4096, 0.5 → 2048/4096, 2 → 8192/4096, 4 → 16384/4096
 */
function typeToFraction(typeModifier: number): number {
  return typeModifier * 4096
}

// ============================================================
// 技威力の解決
// ============================================================

function resolveMovePower(
  input: DamageCalcInput,
  attackerStats: ActualStats,
  _defenderStats: ActualStats
): number {
  const { move, attacker } = input
  if (move.power === null) return 0

  let power = move.power

  // 特殊な威力変動技の処理
  switch (move.name) {
    case "かわらわり":
    case "れいとうパンチ":
      break // 固定威力

    case "じたばた":
    case "きしかいせい": {
      const hpRatio = attackerStats.hp / attackerStats.hp // 現HPは別途渡す必要
      power = calcFlailPower(hpRatio)
      break
    }

    case "テラバースト":
      // テラバースト: テラスタル時はテラタイプが技タイプになり、攻撃 > 特攻ならば物理扱い
      power = 80
      break
  }

  // 特性による威力変動
  power = applyAbilityPowerBoost(power, input)

  return power
}

/**
 * じたばた・きしかいせいの威力計算
 * HP残量による威力変動
 */
function calcFlailPower(hpRatio: number): number {
  const percent = hpRatio * 100
  if (percent <= 4.167)  return 200
  if (percent <= 10.417) return 150
  if (percent <= 20.833) return 100
  if (percent <= 35.417) return 80
  if (percent <= 68.750) return 40
  return 20
}

function applyAbilityPowerBoost(power: number, input: DamageCalcInput): number {
  const { attacker, move, context } = input
  const ability = attacker.ability

  switch (ability) {
    case "テクニシャン":
      return power <= 60 ? Math.floor(power * 1.5) : power
    case "すてみ":
      if (move.flags.isRecoil) return Math.floor(power * 1.2)
      break
    case "アイスフェイス":
      break
    case "アナライズ":
      // 最後に動くと1.3倍 (簡略実装: contextで判定)
      break
    case "がんじょうあご":
      if (move.flags.isBite) return Math.floor(power * 1.5)
      break
    case "てつのこぶし":
      if (move.flags.isPunch) return Math.floor(power * 1.2)
      break
    case "メガランチャー":
      if (move.flags.isPulse) return Math.floor(power * 1.5)
      break
    case "はがねのせいしん":
    case "ハードロック":
      break
    case "すなのちから":
      if (context.weather === "sandstorm" &&
          (move.type === "Rock" || move.type === "Ground" || move.type === "Steel")) {
        return Math.floor(power * 1.3)
      }
      break
    case "りゅうのあぎと":
      if (move.type === "Dragon") return Math.floor(power * 1.5)
      break
  }
  return power
}

// ============================================================
// 有効A/D の解決
// ============================================================

function resolveEffectiveAttack(
  input: DamageCalcInput,
  attackerStats: ActualStats,
  isPhysical: boolean,
  isCritical: boolean
): number {
  const { attacker, context } = input

  let stat = getEffectiveAttack(attackerStats, attacker.ranks, isPhysical, isCritical)

  // 特性による攻撃補正
  switch (attacker.ability) {
    case "はりきり":
      stat = Math.floor(stat * 1.5)
      break
    case "ふくつのこころ": // 不撓の心 (フォルムチェンジ系)
      break
    case "ごりむちゅう":
      if (isPhysical) stat = Math.floor(stat * 1.5)
      break
    case "こんじょう":
      if (isPhysical && attacker.status !== "none" && attacker.status !== "burn") {
        stat = Math.floor(stat * 1.5)
      }
      break
    case "はやてのつばさ":
      if (!isPhysical) break
      break
    case "フラワーギフト":
      if (isPhysical && context.weather === "sun") stat = Math.floor(stat * 1.5)
      break
    case "スロースタート":
      if (isPhysical) stat = Math.floor(stat * 0.5)
      break
    case "よわき":
      stat = Math.floor(stat * 0.5)
      break
  }

  // やけど時の物理攻撃補正 (根性持ち以外)
  if (isPhysical && attacker.status === "burn" && attacker.ability !== "こんじょう") {
    stat = Math.floor(stat * 0.5)
  }

  return stat
}

function resolveEffectiveDefense(
  input: DamageCalcInput,
  defenderStats: ActualStats,
  isPhysical: boolean,
  isCritical: boolean
): number {
  const { defender, context } = input

  let stat = getEffectiveDefense(defenderStats, defender.ranks, isPhysical, isCritical, context.weather)

  // 特性による防御補正
  switch (defender.ability) {
    case "ふしぎなまもり":
      // 不思議なまもり: スーパー有効でなければ無効 (ダメージ計算外で処理)
      break
    case "あついしぼう":
      if (input.move.type === "Fire" || input.move.type === "Ice") {
        stat = Math.floor(stat * 2)
      }
      break
    case "もふもふ":
      if (input.move.flags.isContact) stat = Math.floor(stat * 0.5) // 接触: 2倍ダメージ
      if (input.move.type === "Fire") stat = Math.floor(stat * 0.5) // 炎技: 2倍ダメージ
      break
    case "ファーコート":
      if (isPhysical) stat = stat * 2
      break
    case "くさのけがわ":
      if (!isPhysical && context.field === "grassyTerrain") stat = Math.floor(stat * 1.5)
      break
    case "フラワーギフト":
      if (!isPhysical && context.weather === "sun") stat = Math.floor(stat * 1.5)
      break
  }

  // 砂嵐時のいわタイプ特防1.5倍
  if (!isPhysical && context.weather === "sandstorm") {
    if (defender.types.includes("Rock")) {
      stat = Math.floor(stat * 1.5)
    }
  }

  // 雪時のこおりタイプ防御1.5倍 (第9世代追加)
  if (isPhysical && context.weather === "snow") {
    if (defender.types.includes("Ice")) {
      stat = Math.floor(stat * 1.5)
    }
  }

  return stat
}

// ============================================================
// STAB補正の解決
// ============================================================

function resolveSTABModifier(
  attacker: DamageCalcInput["attacker"],
  moveType: PokemonType
): number {
  const ability = attacker.ability
  const { isTerastallized, teraType } = attacker.terastal

  if (isTerastallized && teraType !== null) {
    // テラスタル時のSTAB計算
    const originalTypes = attacker.types as PokemonType[]
    const teraMatchesMove = teraType === moveType
    const originalHasMove = originalTypes.includes(moveType)

    if (teraMatchesMove) {
      if (originalHasMove) {
        // Tera = 元タイプ & 技タイプ一致: 2.0倍 (Adaptabilityは2.25)
        return ability === "てきおうりょく" ? 2.25 : STAB_TERA_SAME_AS_ORIGINAL
      } else {
        // Tera ≠ 元タイプ & 技タイプ一致: 1.5倍 (Adaptabilityは2.0)
        return ability === "てきおうりょく" ? STAB_ADAPTABILITY : STAB_TERA_NEW_TYPE
      }
    } else if (originalHasMove) {
      // Tera ≠ 技タイプ だが元タイプ一致: 1.5倍保持
      return ability === "てきおうりょく" ? STAB_ADAPTABILITY : STAB_NORMAL
    }
    return 1.0
  }

  // 通常時のSTAB
  const types = attacker.types as PokemonType[]
  if (types.includes(moveType)) {
    return ability === "てきおうりょく" ? STAB_ADAPTABILITY : STAB_NORMAL
  }
  return 1.0
}

// ============================================================
// テラスタル防御補正
// ============================================================

/**
 * テラスタル Stellar タイプ時の補正
 * (攻撃側がStellarタイプでテラスタルしている場合は1.2倍が攻撃側補正に含まれる)
 * ここでは防御側のテラスタルによる補正を処理
 */
function resolveTeraModifier(_defender: DamageCalcInput["defender"], _moveType: PokemonType): number {
  // 防御側のテラスタルは直接のダメージ補正はなし (タイプ相性変化で対応済み)
  return 1.0
}

// ============================================================
// やけど補正
// ============================================================

function resolveBurnModifier(
  attacker: DamageCalcInput["attacker"],
  isPhysical: boolean
): number {
  if (isPhysical && attacker.status === "burn" && attacker.ability !== "こんじょう") {
    return 0.5
  }
  return 1.0
}

// ============================================================
// スプレッド補正
// ============================================================

function resolveSpreadModifier(
  move: DamageCalcInput["move"],
  context: DamageCalcInput["context"]
): number {
  if (context.format === "doubles" && move.isSpread) {
    return 0.75
  }
  return 1.0
}

// ============================================================
// 持ち物補正
// ============================================================

function resolveItemModifier(
  attacker: DamageCalcInput["attacker"],
  moveType: PokemonType,
  isSuperEffective: boolean
): number {
  const item = attacker.item
  switch (item) {
    case "いのちのたま":
      return 1.3
    case "こだわりメガネ":
      return 1.5
    case "こだわりハチマキ":
      return 1.5
    case "たつじんのおび":
      return isSuperEffective ? 1.2 : 1.0
    case "メトロノーム": // 複数回使用で累積
      return 1.0 // 簡略実装: 1回目は補正なし
    // タイプ強化アイテム
    case "もくたん": case "かえんだま": case "ほのおのプレート":
      return moveType === "Fire" ? 1.2 : 1.0
    case "しずくプレート": case "みずのいし":
      return moveType === "Water" ? 1.2 : 1.0
    case "いかずちプレート":
      return moveType === "Electric" ? 1.2 : 1.0
    case "みどりのプレート":
      return moveType === "Grass" ? 1.2 : 1.0
    case "つきのいし": case "こおりのプレート":
      return moveType === "Ice" ? 1.2 : 1.0
    case "こぶしのプレート":
      return moveType === "Fighting" ? 1.2 : 1.0
    case "もうどくプレート":
      return moveType === "Poison" ? 1.2 : 1.0
    case "だいちのプレート":
      return moveType === "Ground" ? 1.2 : 1.0
    case "あおぞらプレート":
      return moveType === "Flying" ? 1.2 : 1.0
    case "ふしぎのプレート":
      return moveType === "Psychic" ? 1.2 : 1.0
    case "たまむしプレート":
      return moveType === "Bug" ? 1.2 : 1.0
    case "がんせきプレート":
      return moveType === "Rock" ? 1.2 : 1.0
    case "もののけプレート":
      return moveType === "Ghost" ? 1.2 : 1.0
    case "りゅうのプレート":
      return moveType === "Dragon" ? 1.2 : 1.0
    case "こわもてプレート":
      return moveType === "Dark" ? 1.2 : 1.0
    case "こうてつプレート":
      return moveType === "Steel" ? 1.2 : 1.0
    case "せいれいプレート":
      return moveType === "Fairy" ? 1.2 : 1.0
    case "シルクのスカーフ":
      return moveType === "Normal" ? 1.2 : 1.0
    default:
      return 1.0
  }
}

// ============================================================
// 特性補正 (攻撃側)
// ============================================================

function resolveAttackerAbilityModifier(
  attacker: DamageCalcInput["attacker"],
  defender: DamageCalcInput["defender"],
  moveType: PokemonType,
  context: DamageCalcInput["context"],
  typeModifier: number
): number {
  const ability = attacker.ability
  switch (ability) {
    case "もらいび":
      if (moveType === "Fire") return 1.5
      break
    case "すいすい":
      if (moveType === "Water" && (context.weather === "rain" || context.weather === "heavyRain")) return 1.5
      break
    case "もしらず":
      return typeModifier > 1 ? 1.0 : 1.0 // Tinted Lens: 相性今ひとつを等倍 (type計算側で処理推奨)
    case "ねつぼうそう":
      if (attacker.status === "burn" && moveType === "Fire") return 1.5
      break
    case "どくぼうそう":
      if ((attacker.status === "poison") && moveType === "Poison") return 1.5
      break
    case "ひでり":
    case "にほんばれ":
      if (moveType === "Fire" && context.weather === "sun") break // 天候補正と重複しないよう注意
      break
    case "フェアリーオーラ":
      if (moveType === "Fairy") return Math.sqrt(4 / 3) // 約1.333
      break
    case "ダークオーラ":
      if (moveType === "Dark") return Math.sqrt(4 / 3)
      break
    case "はりこみ":
      // 交代直後の相手に2倍 (簡略実装)
      break
  }
  return 1.0
}

// ============================================================
// 特性補正 (防御側)
// ============================================================

function resolveDefenderAbilityModifier(
  defender: DamageCalcInput["defender"],
  moveType: PokemonType,
  context: DamageCalcInput["context"]
): number {
  const ability = defender.ability
  switch (ability) {
    case "もふもふ":
      if (moveType === "Fire") return 2.0
      break
    case "ふわふわ":
      if (moveType === "Fire") return 2.0
      break
    case "かんそうはだ":
      if (moveType === "Fire") return 1.25
      if (moveType === "Water") return 0 // 水タイプを無効化
      break
    case "たいねつ":
      if (moveType === "Fire") return 0.5
      break
    case "どしゃぶり": break // 大雨特性
    case "ソウルハート": break
    case "ハードロック":
    case "フィルター":
    case "プリズムアーマー":
      if (context.field === "none" && moveType !== "Normal") {
        // 抜群ダメージを0.75倍に (typeModifier > 1の判定は呼び出し側で)
      }
      break
    case "フェアリーオーラ":
      if (moveType === "Fairy") return Math.sqrt(4 / 3)
      break
    case "ダークオーラ":
      if (moveType === "Dark") return Math.sqrt(4 / 3)
      break
  }
  return 1.0
}

// ============================================================
// テラスタル時の防御タイプ解決
// ============================================================

function resolveDefenderTypes(defender: DamageCalcInput["defender"]): PokemonType[] {
  const { isTerastallized, teraType } = defender.terastal
  if (isTerastallized && teraType !== null) {
    return [teraType]
  }
  return defender.types as PokemonType[]
}

// ============================================================
// 接地判定 (フィールド効果適用)
// ============================================================

function isGrounded(pokemon: DamageCalcInput["attacker"]): boolean {
  if (pokemon.types.includes("Flying")) return false
  if (pokemon.ability === "ふゆう") return false
  if (pokemon.item === "ふうせん") return false
  return true
}

// ============================================================
// KO判定文字列の生成
// ============================================================

function buildKODescription(rolls: DamageRoll, defenderHP: number): string {
  let koRolls = 0

  for (const dmg of rolls) {
    if (dmg >= defenderHP) koRolls++
  }

  if (koRolls === 16) return "確定1発"
  if (koRolls > 0) return `乱数1発 (${koRolls}/16)`

  // 2発以上
  const maxDmg = rolls[15]
  const minDmg = rolls[0]

  const minHitsMax = Math.ceil(defenderHP / maxDmg)
  const maxHitsMin = Math.ceil(defenderHP / minDmg)

  if (minHitsMax === maxHitsMin) {
    return `確定${minHitsMax}発`
  }

  // 乱数による複数発KO判定
  let twoHitKOCount = 0
  for (const dmg of rolls) {
    if (dmg * 2 >= defenderHP) twoHitKOCount++
  }
  if (twoHitKOCount === 16) return "確定2発"
  if (twoHitKOCount > 0) return `乱数2発 (${twoHitKOCount}/16)`

  return `確定${maxHitsMin}発`
}

// ============================================================
// エラー結果生成
// ============================================================

function buildFailResult(error: string): DamageCalcResult {
  const zeroStats = { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 }
  const zeroRolls = Array(16).fill(0) as unknown as DamageRoll

  return {
    success: false,
    error,
    attackerStats: zeroStats,
    defenderStats: zeroStats,
    effectiveAttack: 0,
    effectiveDefense: 0,
    effectivePower: 0,
    damageRolls: zeroRolls,
    minDamage: 0,
    maxDamage: 0,
    minPercent: 0,
    maxPercent: 0,
    minKOHits: 0,
    maxKOHits: 0,
    koDescription: "計算失敗",
    breakdown: {
      baseDamage: 0,
      spreadModifier: 1,
      weatherModifier: 1,
      criticalModifier: 1,
      stabModifier: 1,
      typeEffectivenessModifier: 1,
      burnModifier: 1,
      screenModifier: 1,
      otherModifiers: [],
      teraModifier: 1,
      fieldModifier: 1,
    },
  }
}
