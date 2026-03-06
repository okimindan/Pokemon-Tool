"use client"

interface KODescriptionProps {
  description:  string
  minPercent:   number
  maxPercent:   number
  minDamage:    number
  maxDamage:    number
  defenderHP:   number
}

function koColor(desc: string): string {
  if (desc.includes("確定1発")) return "text-red-400"
  if (desc.includes("乱数1発")) return "text-orange-400"
  if (desc.includes("確定2発")) return "text-yellow-400"
  if (desc.includes("乱数2発")) return "text-yellow-600"
  return "text-green-400"
}

export function KODescription({ description, minPercent, maxPercent, minDamage, maxDamage, defenderHP }: KODescriptionProps) {
  const pctWidth = Math.min(100, maxPercent)

  return (
    <div className="space-y-2">
      {/* KO判定 */}
      <div className={`text-2xl font-black ${koColor(description)}`}>
        {description}
      </div>

      {/* ダメージ範囲 */}
      <div className="text-sm text-zinc-300">
        <span className="font-bold">{minDamage}</span>
        <span className="text-zinc-500"> ~ </span>
        <span className="font-bold">{maxDamage}</span>
        <span className="text-zinc-500 ml-2">({minPercent.toFixed(1)}% ~ {maxPercent.toFixed(1)}%)</span>
      </div>

      {/* HPバー */}
      <div className="relative h-3 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(100, maxPercent)}%`,
            background: maxPercent >= 100 ? "#ef4444" : maxPercent >= 50 ? "#f97316" : "#22c55e",
            opacity: 0.4,
          }}
        />
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(100, minPercent)}%`,
            background: maxPercent >= 100 ? "#ef4444" : maxPercent >= 50 ? "#f97316" : "#22c55e",
          }}
        />
      </div>
    </div>
  )
}
