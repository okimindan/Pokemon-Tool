"use client"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { nanoid } from "nanoid"
import type {
  PokemonConfig, BattleContext, CalcResult, SavedSet,
  EVs, IVs, StatRanks, Nature, StatusCondition,
} from "@/lib/types"

// ============================================================
// デフォルト値
// ============================================================

export const DEFAULT_EVS: EVs = { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 }
export const DEFAULT_IVS: IVs = { hp: 31, attack: 31, defense: 31, spAttack: 31, spDefense: 31, speed: 31 }
export const DEFAULT_RANKS: StatRanks = { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0, accuracy: 0, evasion: 0 }

export const DEFAULT_POKEMON: PokemonConfig = {
  name:    "",
  level:   50,
  nature:  "Hardy",
  evs:     { ...DEFAULT_EVS },
  ivs:     { ...DEFAULT_IVS },
  ability: "",
  item:    "",
  status:  "none",
  terastal: { isTerastallized: false, teraType: null },
  ranks:   { ...DEFAULT_RANKS },
}

export const DEFAULT_CONTEXT: BattleContext = {
  weather:       "none",
  field:         "none",
  format:        "singles",
  isReflect:     false,
  isLightScreen: false,
  isAuroraVeil:  false,
  isWonderRoom:  false,
}

const MAX_EV_TOTAL = 508

// ============================================================
// Store
// ============================================================

interface CalculatorState {
  attacker:      PokemonConfig
  defender:      PokemonConfig
  moveName:      string
  isCritical:    boolean
  context:       BattleContext
  result:        CalcResult | null
  isCalculating: boolean
  calcError:     string | null
  savedSets:     SavedSet[]

  setAttacker:     (updates: Partial<PokemonConfig>) => void
  setDefender:     (updates: Partial<PokemonConfig>) => void
  setAttackerEV:   (stat: keyof EVs, value: number) => void
  setDefenderEV:   (stat: keyof EVs, value: number) => void
  setAttackerIV:   (stat: keyof IVs, value: number) => void
  setDefenderIV:   (stat: keyof IVs, value: number) => void
  setAttackerRank: (stat: keyof StatRanks, value: number) => void
  setDefenderRank: (stat: keyof StatRanks, value: number) => void
  setMoveName:     (name: string) => void
  setContext:      (updates: Partial<BattleContext>) => void
  setIsCritical:   (v: boolean) => void
  swapSides:       () => void
  setResult:       (result: CalcResult) => void
  setCalculating:  (v: boolean) => void
  setCalcError:    (e: string | null) => void
  saveSet:         (name: string, side: "attacker" | "defender") => void
  loadSet:         (id: string, side: "attacker" | "defender") => void
  deleteSet:       (id: string) => void
  resetAttacker:   () => void
  resetDefender:   () => void
  loadShareState:  (state: Partial<{
    attacker: PokemonConfig; defender: PokemonConfig;
    moveName: string; isCritical: boolean; context: BattleContext;
  }>) => void
}

function capEV(evs: EVs, stat: keyof EVs, value: number): EVs {
  const otherTotal = Object.entries(evs)
    .filter(([k]) => k !== stat)
    .reduce((sum, [, v]) => sum + (v as number), 0)
  const capped = Math.min(value, MAX_EV_TOTAL - otherTotal, 252)
  return { ...evs, [stat]: Math.max(0, capped) }
}

export const useCalculatorStore = create<CalculatorState>()(
  persist(
    (set, get) => ({
      attacker:      { ...DEFAULT_POKEMON },
      defender:      { ...DEFAULT_POKEMON },
      moveName:      "",
      isCritical:    false,
      context:       { ...DEFAULT_CONTEXT },
      result:        null,
      isCalculating: false,
      calcError:     null,
      savedSets:     [],

      setAttacker: (updates) =>
        set((s) => ({ attacker: { ...s.attacker, ...updates } })),

      setDefender: (updates) =>
        set((s) => ({ defender: { ...s.defender, ...updates } })),

      setAttackerEV: (stat, value) =>
        set((s) => ({ attacker: { ...s.attacker, evs: capEV(s.attacker.evs, stat, value) } })),

      setDefenderEV: (stat, value) =>
        set((s) => ({ defender: { ...s.defender, evs: capEV(s.defender.evs, stat, value) } })),

      setAttackerIV: (stat, value) =>
        set((s) => ({ attacker: { ...s.attacker, ivs: { ...s.attacker.ivs, [stat]: Math.max(0, Math.min(31, value)) } } })),

      setDefenderIV: (stat, value) =>
        set((s) => ({ defender: { ...s.defender, ivs: { ...s.defender.ivs, [stat]: Math.max(0, Math.min(31, value)) } } })),

      setAttackerRank: (stat, value) =>
        set((s) => ({ attacker: { ...s.attacker, ranks: { ...s.attacker.ranks, [stat]: Math.max(-6, Math.min(6, value)) } } })),

      setDefenderRank: (stat, value) =>
        set((s) => ({ defender: { ...s.defender, ranks: { ...s.defender.ranks, [stat]: Math.max(-6, Math.min(6, value)) } } })),

      setMoveName:     (name)    => set({ moveName: name }),
      setContext:      (updates) => set((s) => ({ context: { ...s.context, ...updates } })),
      setIsCritical:   (v)       => set({ isCritical: v }),

      swapSides: () =>
        set((s) => ({ attacker: s.defender, defender: s.attacker })),

      setResult:      (result) => set({ result, calcError: null }),
      setCalculating: (v)      => set({ isCalculating: v }),
      setCalcError:   (e)      => set({ calcError: e, isCalculating: false }),

      saveSet: (name, side) => {
        const config = get()[side]
        const newSet: SavedSet = { id: nanoid(), name, config: { ...config }, createdAt: Date.now() }
        set((s) => ({ savedSets: [...s.savedSets, newSet] }))
      },

      loadSet: (id, side) => {
        const found = get().savedSets.find((s) => s.id === id)
        if (!found) return
        set({ [side]: { ...found.config } })
      },

      deleteSet: (id) =>
        set((s) => ({ savedSets: s.savedSets.filter((x) => x.id !== id) })),

      resetAttacker: () => set({ attacker: { ...DEFAULT_POKEMON }, result: null }),
      resetDefender: () => set({ defender: { ...DEFAULT_POKEMON }, result: null }),

      loadShareState: (state) => set((s) => ({
        attacker:   state.attacker   ?? s.attacker,
        defender:   state.defender   ?? s.defender,
        moveName:   state.moveName   ?? s.moveName,
        isCritical: state.isCritical ?? s.isCritical,
        context:    state.context    ?? s.context,
      })),
    }),
    {
      name: "pokemon-calc-v1",
      partialize: (s) => ({
        attacker:   s.attacker,
        defender:   s.defender,
        moveName:   s.moveName,
        isCritical: s.isCritical,
        context:    s.context,
        savedSets:  s.savedSets,
      }),
    }
  )
)
