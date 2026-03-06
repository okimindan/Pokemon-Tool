import { API_BASE } from "./constants"
import type { PokemonRow, MoveRow, CalcResult, ApiResponse, PokemonConfig, BattleContext } from "./types"

// ============================================================
// データ取得
// ============================================================

export async function fetchAllPokemon(): Promise<PokemonRow[]> {
  const res = await fetch(`${API_BASE}/data/pokemon/all`)
  if (!res.ok) throw new Error(`Pokemon fetch failed: ${res.status}`)
  const json: ApiResponse<PokemonRow[]> = await res.json()
  if (!json.success || !json.data) throw new Error(json.error ?? "Unknown error")
  return json.data
}

export async function fetchAllMoves(): Promise<MoveRow[]> {
  const res = await fetch(`${API_BASE}/data/moves/all`)
  if (!res.ok) throw new Error(`Moves fetch failed: ${res.status}`)
  const json: ApiResponse<MoveRow[]> = await res.json()
  if (!json.success || !json.data) throw new Error(json.error ?? "Unknown error")
  return json.data
}

// ============================================================
// ダメージ計算
// ============================================================

export interface CalcRequest {
  attacker: PokemonConfig
  defender: PokemonConfig
  moveName: string
  isCritical: boolean
  context: BattleContext
}

export async function calcDamage(req: CalcRequest): Promise<CalcResult> {
  const body = {
    attackerName:      req.attacker.name,
    defenderName:      req.defender.name,
    moveName:          req.moveName,
    attackerLevel:     req.attacker.level,
    defenderLevel:     req.defender.level,
    attackerNature:    req.attacker.nature,
    defenderNature:    req.defender.nature,
    attackerEVs:       req.attacker.evs,
    defenderEVs:       req.defender.evs,
    attackerIVs:       req.attacker.ivs,
    defenderIVs:       req.defender.ivs,
    attackerAbility:   req.attacker.ability,
    defenderAbility:   req.defender.ability,
    attackerItem:      req.attacker.item,
    defenderItem:      req.defender.item,
    attackerStatus:    req.attacker.status,
    defenderStatus:    req.defender.status,
    attackerTerastal:  req.attacker.terastal,
    defenderTerastal:  req.defender.terastal,
    attackerRanks:     req.attacker.ranks,
    defenderRanks:     req.defender.ranks,
    isCritical:        req.isCritical,
    context:           req.context,
  }

  const res = await fetch(`${API_BASE}/calc/damage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Calc failed: ${res.status}`)
  const json: ApiResponse<CalcResult> = await res.json()
  if (!json.success || !json.data) throw new Error(json.error ?? "Unknown error")
  return json.data
}
