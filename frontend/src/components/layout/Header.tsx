"use client"
import { MySetsDialog } from "@/components/sets/MySetsDialog"
import { ShareButton } from "@/components/share/ShareButton"
import { useDataStore } from "@/store/dataStore"
import { AlertTriangle } from "lucide-react"

export function Header() {
  const { pokemonError, movesError } = useDataStore()
  const hasError = pokemonError || movesError

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            PokéCalc SV
          </span>
          <span className="text-xs text-zinc-500 hidden sm:block">第9世代ダメージ計算機</span>
        </div>

        {hasError && (
          <div className="flex items-center gap-1 text-xs text-yellow-500">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="hidden sm:block">オフラインモード (代替データ使用中)</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <MySetsDialog />
          <ShareButton />
        </div>
      </div>
    </header>
  )
}
