"use client"
import { useEffect } from "react"
import { useDataStore } from "@/store/dataStore"

export function useMoveData() {
  const { moves, isLoadingMoves, movesError, fetchMoves } = useDataStore()
  useEffect(() => { fetchMoves() }, [fetchMoves])
  return { moves, isLoading: isLoadingMoves, hasError: movesError }
}
