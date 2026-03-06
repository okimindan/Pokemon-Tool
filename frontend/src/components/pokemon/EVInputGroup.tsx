"use client"
import { StatRow } from "./StatRow"
import { STAT_KEYS } from "@/lib/constants"
import type { EVs, IVs, ActualStats } from "@/lib/types"

interface EVInputGroupProps {
  evs:         EVs
  ivs:         IVs
  actualStats: ActualStats | null
  onEvChange:  (stat: keyof EVs, val: number) => void
  onIvChange:  (stat: keyof IVs, val: number) => void
}

export function EVInputGroup({ evs, ivs, actualStats, onEvChange, onIvChange }: EVInputGroupProps) {
  const totalEV = Object.values(evs).reduce((a, b) => a + b, 0)
  const overLimit = totalEV > 508

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-400">努力値 / 個体値</span>
        <span className={`text-xs font-bold ${overLimit ? "text-red-400" : totalEV >= 500 ? "text-yellow-400" : "text-zinc-400"}`}>
          合計 EV: {totalEV} / 508
        </span>
      </div>
      {STAT_KEYS.map((key) => (
        <StatRow
          key={key}
          statKey={key}
          ev={evs[key]}
          iv={ivs[key]}
          actualStat={actualStats ? actualStats[key] : null}
          onEvChange={(v) => onEvChange(key, v)}
          onIvChange={(v) => onIvChange(key, v)}
          isHP={key === "hp"}
        />
      ))}
    </div>
  )
}
