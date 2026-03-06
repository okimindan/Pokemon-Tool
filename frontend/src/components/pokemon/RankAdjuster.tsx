"use client"
import { Button } from "@/components/ui/button"
import { STAT_LABELS } from "@/lib/constants"
import type { StatRanks } from "@/lib/types"

interface RankAdjusterProps {
  ranks:    StatRanks
  onChange: (stat: keyof StatRanks, val: number) => void
}

const RANK_STATS: (keyof StatRanks)[] = ["attack", "defense", "spAttack", "spDefense", "speed"]

function rankColor(rank: number): string {
  if (rank > 0) return "text-blue-400"
  if (rank < 0) return "text-red-400"
  return "text-zinc-400"
}

export function RankAdjuster({ ranks, onChange }: RankAdjusterProps) {
  return (
    <div className="space-y-1">
      {RANK_STATS.map((stat) => (
        <div key={stat} className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 w-16 shrink-0">{STAT_LABELS[stat]}</span>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
            onClick={() => onChange(stat, Math.max(-6, ranks[stat] - 1))}>−</Button>
          <span className={`w-6 text-center text-sm font-bold ${rankColor(ranks[stat])}`}>
            {ranks[stat] > 0 ? `+${ranks[stat]}` : ranks[stat]}
          </span>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
            onClick={() => onChange(stat, Math.min(6, ranks[stat] + 1))}>＋</Button>
          <Button size="sm" variant="ghost" className="h-5 text-[10px] px-1 text-zinc-500"
            onClick={() => onChange(stat, 0)}>0</Button>
        </div>
      ))}
    </div>
  )
}
