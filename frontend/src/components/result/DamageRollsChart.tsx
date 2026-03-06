"use client"

interface DamageRollsChartProps {
  rolls:      number[]
  defenderHP: number
}

export function DamageRollsChart({ rolls, defenderHP }: DamageRollsChartProps) {
  if (!rolls || rolls.length === 0) return null

  const maxRoll = Math.max(...rolls)
  const randomValues = Array.from({ length: 16 }, (_, i) => 85 + i)

  return (
    <div className="space-y-1">
      <div className="text-xs text-zinc-400">乱数 (85/100 ~ 100/100)</div>
      <div className="flex items-end gap-0.5 h-16">
        {rolls.map((dmg, i) => {
          const isKO      = dmg >= defenderHP
          const height    = maxRoll > 0 ? Math.max(8, (dmg / maxRoll) * 100) : 8
          const isMedian  = i === 7 || i === 8
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-0.5"
              title={`${randomValues[i]}/100: ${dmg} (${((dmg / defenderHP) * 100).toFixed(1)}%)`}
            >
              <div
                className={`w-full rounded-sm transition-all ${
                  isKO     ? "bg-red-400"
                  : isMedian ? "bg-blue-300"
                  : "bg-blue-500"
                }`}
                style={{ height: `${height}%` }}
              />
            </div>
          )
        })}
      </div>
      {/* 乱数値 */}
      <div className="flex gap-0.5">
        {rolls.map((dmg, i) => (
          <div key={i} className={`flex-1 text-center text-[8px] ${dmg >= defenderHP ? "text-red-400 font-bold" : "text-zinc-500"}`}>
            {dmg}
          </div>
        ))}
      </div>
    </div>
  )
}
