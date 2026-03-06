"use client"
import { create } from "zustand"
import { fetchAllPokemon, fetchAllMoves } from "@/lib/api"
import { FALLBACK_POKEMON, FALLBACK_MOVES } from "@/lib/fallbackData"
import type { PokemonRow, MoveRow } from "@/lib/types"

interface DataState {
  pokemon: PokemonRow[]
  moves: MoveRow[]
  isLoadingPokemon: boolean
  isLoadingMoves: boolean
  pokemonError: boolean
  movesError: boolean
  fetchPokemon: () => Promise<void>
  fetchMoves: () => Promise<void>
}

export const useDataStore = create<DataState>()((set, get) => ({
  pokemon: [],
  moves: [],
  isLoadingPokemon: false,
  isLoadingMoves: false,
  pokemonError: false,
  movesError: false,

  fetchPokemon: async () => {
    if (get().pokemon.length > 0 || get().isLoadingPokemon) return
    set({ isLoadingPokemon: true, pokemonError: false })
    try {
      const data = await fetchAllPokemon()
      set({ pokemon: data, isLoadingPokemon: false })
    } catch {
      set({ pokemon: FALLBACK_POKEMON, isLoadingPokemon: false, pokemonError: true })
    }
  },

  fetchMoves: async () => {
    if (get().moves.length > 0 || get().isLoadingMoves) return
    set({ isLoadingMoves: true, movesError: false })
    try {
      const data = await fetchAllMoves()
      set({ moves: data, isLoadingMoves: false })
    } catch {
      set({ moves: FALLBACK_MOVES, isLoadingMoves: false, movesError: true })
    }
  },
}))
