"use client"
import { useEffect } from "react"
import { useDataStore } from "@/store/dataStore"

export function usePokemonData() {
  const { pokemon, isLoadingPokemon, pokemonError, fetchPokemon } = useDataStore()
  useEffect(() => { fetchPokemon() }, [fetchPokemon])
  return { pokemon, isLoading: isLoadingPokemon, hasError: pokemonError }
}
