import type { PokemonConfig, BattleContext } from "./types"

// ============================================================
// URL パラメータへのエンコード/デコード
// 短縮キーを使って URL を短く保つ
// ============================================================

interface ShareState {
  attacker: PokemonConfig
  defender: PokemonConfig
  moveName: string
  isCritical: boolean
  context: BattleContext
}

// 短縮キー
const K = {
  an:  "attackerName",   dn: "defenderName",   mn: "moveName",
  al:  "attackerLevel",  dl: "defenderLevel",
  ana: "attackerNature", dna: "defenderNature",
  aab: "attackerAbility",dab: "defenderAbility",
  ait: "attackerItem",   dit: "defenderItem",
  ast: "attackerStatus", dst: "defenderStatus",
  att: "attackerTera",   dtt: "defenderTera",
  atv: "attackerTeraType", dtv: "defenderTeraType",
  ic:  "isCritical",
  cw:  "weather",        cf: "field",           cx: "format",
  cr:  "reflect",        cl: "lightScreen",     ca: "auroraVeil", cwr: "wonderRoom",
} as const

function enc(p: URLSearchParams, key: string, val: string | number | boolean): void {
  if (val === "" || val === 0 || val === false || val === "none" || val === "Hardy" || val === "none") {
    // Skip defaults to keep URL short
    if (val === 0 || val === false) return
    if (val === "") return
  }
  p.set(key, String(val))
}

function encEVs(p: URLSearchParams, prefix: string, evs: PokemonConfig["evs"]): void {
  const keys = ["hp", "at", "df", "sa", "sd", "sp"] as const
  const vals = [evs.hp, evs.attack, evs.defense, evs.spAttack, evs.spDefense, evs.speed]
  vals.forEach((v, i) => { if (v !== 0) p.set(`${prefix}.${keys[i]}`, String(v)) })
}

function encIVs(p: URLSearchParams, prefix: string, ivs: PokemonConfig["ivs"]): void {
  const keys = ["hp", "at", "df", "sa", "sd", "sp"] as const
  const vals = [ivs.hp, ivs.attack, ivs.defense, ivs.spAttack, ivs.spDefense, ivs.speed]
  vals.forEach((v, i) => { if (v !== 31) p.set(`${prefix}.${keys[i]}`, String(v)) })
}

function encRanks(p: URLSearchParams, prefix: string, ranks: PokemonConfig["ranks"]): void {
  const entries = Object.entries(ranks)
  entries.forEach(([k, v]) => { if (v !== 0) p.set(`${prefix}.${k.slice(0, 3)}`, String(v)) })
}

export function encodeState(state: ShareState): string {
  const p = new URLSearchParams()

  // Attacker
  if (state.attacker.name)              p.set("an",  state.attacker.name)
  if (state.attacker.level !== 50)      p.set("al",  String(state.attacker.level))
  if (state.attacker.nature !== "Hardy") p.set("ana", state.attacker.nature)
  if (state.attacker.ability)           p.set("aab", state.attacker.ability)
  if (state.attacker.item)              p.set("ait", state.attacker.item)
  if (state.attacker.status !== "none") p.set("ast", state.attacker.status)
  if (state.attacker.terastal.isTerastallized) {
    p.set("att", "1")
    if (state.attacker.terastal.teraType) p.set("atv", state.attacker.terastal.teraType)
  }
  encEVs(p, "ae", state.attacker.evs)
  encIVs(p, "ai", state.attacker.ivs)
  encRanks(p, "ar", state.attacker.ranks)

  // Defender
  if (state.defender.name)              p.set("dn",  state.defender.name)
  if (state.defender.level !== 50)      p.set("dl",  String(state.defender.level))
  if (state.defender.nature !== "Hardy") p.set("dna", state.defender.nature)
  if (state.defender.ability)           p.set("dab", state.defender.ability)
  if (state.defender.item)              p.set("dit", state.defender.item)
  if (state.defender.status !== "none") p.set("dst", state.defender.status)
  if (state.defender.terastal.isTerastallized) {
    p.set("dtt", "1")
    if (state.defender.terastal.teraType) p.set("dtv", state.defender.terastal.teraType)
  }
  encEVs(p, "de", state.defender.evs)
  encIVs(p, "di", state.defender.ivs)
  encRanks(p, "dr", state.defender.ranks)

  // Move & context
  if (state.moveName)                   p.set("mn",  state.moveName)
  if (state.isCritical)                 p.set("ic",  "1")
  if (state.context.weather !== "none") p.set("cw",  state.context.weather)
  if (state.context.field !== "none")   p.set("cf",  state.context.field)
  if (state.context.format !== "singles") p.set("cx", state.context.format)
  if (state.context.isReflect)          p.set("cr",  "1")
  if (state.context.isLightScreen)      p.set("cl",  "1")
  if (state.context.isAuroraVeil)       p.set("ca",  "1")
  if (state.context.isWonderRoom)       p.set("cwr", "1")

  return p.toString()
}

function decEVs(p: URLSearchParams, prefix: string): PokemonConfig["evs"] {
  const g = (k: string) => parseInt(p.get(`${prefix}.${k}`) ?? "0") || 0
  return { hp: g("hp"), attack: g("at"), defense: g("df"), spAttack: g("sa"), spDefense: g("sd"), speed: g("sp") }
}

function decIVs(p: URLSearchParams, prefix: string): PokemonConfig["ivs"] {
  const g = (k: string) => {
    const v = p.get(`${prefix}.${k}`)
    return v !== null ? (parseInt(v) || 0) : 31
  }
  return { hp: g("hp"), attack: g("at"), defense: g("df"), spAttack: g("sa"), spDefense: g("sd"), speed: g("sp") }
}

function decRanks(p: URLSearchParams, prefix: string): PokemonConfig["ranks"] {
  const g = (k: string) => parseInt(p.get(`${prefix}.${k}`) ?? "0") || 0
  return { attack: g("att"), defense: g("def"), spAttack: g("spa"), spDefense: g("spd"), speed: g("spe"), accuracy: g("acc"), evasion: g("eva") }
}

export function decodeState(search: string): Partial<ShareState> | null {
  try {
    const p = new URLSearchParams(search)
    if (!p.get("an") && !p.get("dn")) return null

    const attacker: PokemonConfig = {
      name:    p.get("an") ?? "",
      level:   parseInt(p.get("al") ?? "50") || 50,
      nature:  (p.get("ana") as PokemonConfig["nature"]) ?? "Hardy",
      ability: p.get("aab") ?? "",
      item:    p.get("ait") ?? "",
      status:  (p.get("ast") as PokemonConfig["status"]) ?? "none",
      terastal: {
        isTerastallized: p.get("att") === "1",
        teraType: (p.get("atv") as PokemonConfig["terastal"]["teraType"]) ?? null,
      },
      evs: decEVs(p, "ae"),
      ivs: decIVs(p, "ai"),
      ranks: decRanks(p, "ar"),
    }

    const defender: PokemonConfig = {
      name:    p.get("dn") ?? "",
      level:   parseInt(p.get("dl") ?? "50") || 50,
      nature:  (p.get("dna") as PokemonConfig["nature"]) ?? "Hardy",
      ability: p.get("dab") ?? "",
      item:    p.get("dit") ?? "",
      status:  (p.get("dst") as PokemonConfig["status"]) ?? "none",
      terastal: {
        isTerastallized: p.get("dtt") === "1",
        teraType: (p.get("dtv") as PokemonConfig["terastal"]["teraType"]) ?? null,
      },
      evs: decEVs(p, "de"),
      ivs: decIVs(p, "di"),
      ranks: decRanks(p, "dr"),
    }

    const context: BattleContext = {
      weather:      (p.get("cw") as BattleContext["weather"]) ?? "none",
      field:        (p.get("cf") as BattleContext["field"]) ?? "none",
      format:       (p.get("cx") as BattleContext["format"]) ?? "singles",
      isReflect:    p.get("cr") === "1",
      isLightScreen: p.get("cl") === "1",
      isAuroraVeil: p.get("ca") === "1",
      isWonderRoom: p.get("cwr") === "1",
    }

    return {
      attacker,
      defender,
      moveName:   p.get("mn") ?? "",
      isCritical: p.get("ic") === "1",
      context,
    }
  } catch {
    return null
  }
}
