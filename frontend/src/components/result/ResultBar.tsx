"use client"
import { useState } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { KODescription } from "./KODescription"
import { DamageRollsChart } from "./DamageRollsChart"
import { BreakdownTable } from "./BreakdownTable"
import { SpeedComparison } from "./SpeedComparison"
import type { CalcResult } from "@/lib/types"

interface ResultBarProps {
  result:       CalcResult | null
  calcError:    string | null
  isCalculating:boolean
  attackerName: string
  defenderName: string
  attackerRank: number
  defenderRank: number
}

export function ResultBar({
  result, calcError, isCalculating, attackerName, defenderName, attackerRank, defenderRank,
}: ResultBarProps) {
  const [expanded, setExpanded] = useState(false)

  // ── デスクトップ版 (lg+): aside に展開表示 ──────────────────
  return (
    <>
      {/* モバイル: 下部固定バー */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-50">
        {/* ミニバー */}
        <div
          className="bg-zinc-900 border-t border-zinc-700 px-4 py-2 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          {isCalculating ? (
            <div className="text-center text-zinc-400 text-sm animate-pulse">計算中...</div>
          ) : calcError ? (
            <div className="text-center text-red-400 text-sm">{calcError}</div>
          ) : result ? (
            <div className="flex items-center justify-between">
              <div>
                <span className="text-lg font-black text-white mr-2">{result.koDescription}</span>
                <span className="text-sm text-zinc-400">
                  {result.minPercent.toFixed(1)}% ~ {result.maxPercent.toFixed(1)}%
                </span>
              </div>
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </div>
          ) : (
            <div className="text-center text-zinc-500 text-sm">計算するにはポケモン・技を選択</div>
          )}
        </div>

        {/* 展開パネル */}
        {expanded && result && (
          <div className="bg-zinc-950 border-t border-zinc-700 p-4 max-h-[60vh] overflow-y-auto">
            <ResultDetail
              result={result}
              attackerName={attackerName}
              defenderName={defenderName}
              attackerRank={attackerRank}
              defenderRank={defenderRank}
            />
          </div>
        )}
      </div>

      {/* デスクトップ: aside */}
      <div className="hidden lg:block">
        <div className="sticky top-4 space-y-4">
          {isCalculating ? (
            <div className="text-center text-zinc-400 animate-pulse py-8">計算中...</div>
          ) : calcError ? (
            <div className="text-red-400 text-sm rounded border border-red-500/30 bg-red-950/20 p-3">{calcError}</div>
          ) : result ? (
            <ResultDetail
              result={result}
              attackerName={attackerName}
              defenderName={defenderName}
              attackerRank={attackerRank}
              defenderRank={defenderRank}
            />
          ) : (
            <div className="text-center text-zinc-500 text-sm py-8 border border-zinc-800 rounded-lg">
              ポケモン・技を選択して<br />計算ボタンを押してください
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function ResultDetail({
  result, attackerName, defenderName, attackerRank, defenderRank,
}: {
  result: CalcResult
  attackerName: string
  defenderName: string
  attackerRank: number
  defenderRank: number
}) {
  return (
    <div className="space-y-4">
      <KODescription
        description={result.koDescription}
        minPercent={result.minPercent}
        maxPercent={result.maxPercent}
        minDamage={result.minDamage}
        maxDamage={result.maxDamage}
        defenderHP={result.defenderStats.hp}
      />

      <DamageRollsChart
        rolls={result.damageRolls}
        defenderHP={result.defenderStats.hp}
      />

      <div>
        <div className="text-xs text-zinc-400 mb-1">補正内訳</div>
        <BreakdownTable
          breakdown={result.breakdown}
          effectivePower={result.effectivePower}
          effectiveAttack={result.effectiveAttack}
          effectiveDefense={result.effectiveDefense}
        />
      </div>

      <div>
        <div className="text-xs text-zinc-400 mb-1">素早さ比較</div>
        <SpeedComparison
          attackerName={attackerName}
          defenderName={defenderName}
          attackerStats={result.attackerStats}
          defenderStats={result.defenderStats}
          attackerRank={attackerRank}
          defenderRank={defenderRank}
        />
      </div>
    </div>
  )
}
