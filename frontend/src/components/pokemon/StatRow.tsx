"use client"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { STAT_LABELS } from "@/lib/constants"
import type { StatKey } from "@/lib/constants"

interface StatRowProps {
  statKey:    StatKey
  ev:         number
  iv:         number
  actualStat: number | null
  onEvChange: (val: number) => void
  onIvChange: (val: number) => void
  isHP?:      boolean
}

export function StatRow({ statKey, ev, iv, actualStat, onEvChange, onIvChange, isHP = false }: StatRowProps) {
  return (
    <div className="grid grid-cols-[64px_1fr_auto_auto_auto] items-center gap-2 py-1">
      {/* ステータス名 */}
      <span className="text-xs text-zinc-400 font-medium">{STAT_LABELS[statKey]}</span>

      {/* EVスライダー */}
      <Slider
        min={0} max={252} step={4}
        value={[ev]}
        onValueChange={([v]) => onEvChange(v)}
        className="w-full"
      />

      {/* クイックボタン */}
      <div className="flex gap-0.5">
        {([0, 4, 252] as const).map((v) => (
          <Button
            key={v} size="sm" variant={ev === v ? "default" : "ghost"}
            className="h-6 w-8 text-[10px] px-0"
            onClick={() => onEvChange(v)}
          >
            {v}
          </Button>
        ))}
      </div>

      {/* EV数値入力 */}
      <Input
        type="number" min={0} max={252} value={ev}
        onChange={(e) => onEvChange(Math.max(0, Math.min(252, parseInt(e.target.value) || 0)))}
        className="w-12 h-7 text-xs text-center bg-zinc-900 border-zinc-700 px-1"
      />

      {/* IV / 実数値 */}
      <div className="flex flex-col items-end gap-0.5">
        <Input
          type="number" min={0} max={31} value={iv}
          onChange={(e) => onIvChange(Math.max(0, Math.min(31, parseInt(e.target.value) || 0)))}
          className="w-10 h-6 text-[10px] text-center bg-zinc-800 border-zinc-600 px-0.5"
        />
        {actualStat !== null && (
          <span className="text-[10px] text-zinc-300 font-bold">{actualStat}</span>
        )}
      </div>
    </div>
  )
}
