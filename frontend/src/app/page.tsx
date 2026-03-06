"use client"
import { useEffect } from "react"
import { ArrowLeftRight, Calculator, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Header } from "@/components/layout/Header"
import { PokemonPanel } from "@/components/pokemon/PokemonPanel"
import { MoveCombobox } from "@/components/move/MoveCombobox"
import { BattleContextPanel } from "@/components/context/BattleContextPanel"
import { ResultBar } from "@/components/result/ResultBar"
import { useCalculatorStore } from "@/store/calculatorStore"
import { useCalcApi } from "@/hooks/useCalcApi"
import { decodeState } from "@/lib/urlState"
import type { EVs, IVs, StatRanks } from "@/lib/types"

export default function Home() {
  const store = useCalculatorStore()
  const { calculate, isCalculating, calcError, result } = useCalcApi()

  // URL パラメータからの状態復元
  useEffect(() => {
    if (typeof window === "undefined") return
    const search = window.location.search
    if (!search) return
    const decoded = decodeState(search)
    if (decoded) {
      store.loadShareState(decoded)
      // URL クリア (共有URLを使い捨てにしない)
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 py-4 pb-24 lg:pb-8">
        {/* ── デスクトップ: 3カラム ── */}
        <div className="lg:grid lg:grid-cols-[1fr_280px_1fr_300px] lg:gap-4">

          {/* 攻撃側 */}
          <div>
            <PokemonPanel
              label="攻撃側"
              config={store.attacker}
              onUpdate={(u) => store.setAttacker(u)}
              onEvChange={(s: keyof EVs, v: number) => store.setAttackerEV(s, v)}
              onIvChange={(s: keyof IVs, v: number) => store.setAttackerIV(s, v)}
              onRankChange={(s: keyof StatRanks, v: number) => store.setAttackerRank(s, v)}
              onReset={store.resetAttacker}
              color="blue"
            />
          </div>

          {/* 中央: 技・状況・計算ボタン */}
          <div className="mt-4 lg:mt-0 space-y-3">
            {/* 入れ替えボタン */}
            <div className="flex justify-center">
              <Button
                variant="ghost" size="sm"
                className="gap-1.5 text-zinc-400 hover:text-zinc-200"
                onClick={store.swapSides}
              >
                <ArrowLeftRight className="h-4 w-4" />
                入れ替え
              </Button>
            </div>

            {/* 技選択 */}
            <div>
              <Label className="text-xs text-zinc-400 mb-1 block">技</Label>
              <MoveCombobox value={store.moveName} onChange={store.setMoveName} />
            </div>

            <Separator className="bg-zinc-800" />

            {/* バトル状況 */}
            <div>
              <Label className="text-xs text-zinc-400 mb-2 block">バトル状況</Label>
              <BattleContextPanel
                context={store.context}
                onChange={store.setContext}
                isCritical={store.isCritical}
                onCriticalChange={store.setIsCritical}
              />
            </div>

            <Separator className="bg-zinc-800" />

            {/* 計算ボタン */}
            <Button
              className="w-full font-bold text-base gap-2 bg-blue-600 hover:bg-blue-500"
              onClick={calculate}
              disabled={isCalculating}
            >
              {isCalculating ? (
                <><Loader2 className="h-4 w-4 animate-spin" />計算中...</>
              ) : (
                <><Calculator className="h-4 w-4" />ダメージ計算</>
              )}
            </Button>
          </div>

          {/* 防御側 */}
          <div className="mt-4 lg:mt-0">
            <PokemonPanel
              label="防御側"
              config={store.defender}
              onUpdate={(u) => store.setDefender(u)}
              onEvChange={(s: keyof EVs, v: number) => store.setDefenderEV(s, v)}
              onIvChange={(s: keyof IVs, v: number) => store.setDefenderIV(s, v)}
              onRankChange={(s: keyof StatRanks, v: number) => store.setDefenderRank(s, v)}
              onReset={store.resetDefender}
              color="red"
            />
          </div>

          {/* 結果 (デスクトップ) */}
          <div className="hidden lg:block mt-0">
            <ResultBar
              result={result}
              calcError={calcError}
              isCalculating={isCalculating}
              attackerName={store.attacker.name}
              defenderName={store.defender.name}
              attackerRank={store.attacker.ranks.speed}
              defenderRank={store.defender.ranks.speed}
            />
          </div>
        </div>
      </main>

      {/* 結果 (モバイル下部固定) */}
      <ResultBar
        result={result}
        calcError={calcError}
        isCalculating={isCalculating}
        attackerName={store.attacker.name}
        defenderName={store.defender.name}
        attackerRank={store.attacker.ranks.speed}
        defenderRank={store.defender.ranks.speed}
      />
    </div>
  )
}
