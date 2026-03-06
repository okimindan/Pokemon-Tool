"use client"
import type { DamageBreakdown } from "@/lib/types"

interface BreakdownTableProps {
  breakdown:    DamageBreakdown
  effectivePower: number
  effectiveAttack: number
  effectiveDefense: number
}

function fmtMod(v: number): string {
  return v === 1 ? "×1" : `×${v}`
}

export function BreakdownTable({ breakdown, effectivePower, effectiveAttack, effectiveDefense }: BreakdownTableProps) {
  const rows: { label: string; value: string | number; highlight?: boolean }[] = [
    { label: "技の威力",    value: effectivePower },
    { label: "攻撃実数値",  value: effectiveAttack },
    { label: "防御実数値",  value: effectiveDefense },
    { label: "基礎ダメージ",value: breakdown.baseDamage, highlight: true },
    ...(breakdown.stabModifier !== 1        ? [{ label: "STAB",         value: fmtMod(breakdown.stabModifier) }] : []),
    ...(breakdown.typeEffectivenessModifier !== 1 ? [{ label: "タイプ相性",  value: fmtMod(breakdown.typeEffectivenessModifier) }] : []),
    ...(breakdown.weatherModifier !== 1     ? [{ label: "天候",          value: fmtMod(breakdown.weatherModifier) }] : []),
    ...(breakdown.criticalModifier !== 1    ? [{ label: "急所",          value: fmtMod(breakdown.criticalModifier), highlight: true }] : []),
    ...(breakdown.burnModifier !== 1        ? [{ label: "やけど",         value: fmtMod(breakdown.burnModifier) }] : []),
    ...(breakdown.screenModifier !== 1      ? [{ label: "壁",            value: fmtMod(breakdown.screenModifier) }] : []),
    ...(breakdown.fieldModifier !== 1       ? [{ label: "フィールド",     value: fmtMod(breakdown.fieldModifier) }] : []),
    ...breakdown.otherModifiers.map(m => ({ label: m.source, value: fmtMod(m.multiplier) })),
  ]

  return (
    <div className="rounded border border-zinc-800 overflow-hidden">
      <table className="w-full text-xs">
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-zinc-900" : "bg-zinc-950"}>
              <td className="px-2 py-1 text-zinc-400">{row.label}</td>
              <td className={`px-2 py-1 text-right font-bold ${row.highlight ? "text-yellow-400" : "text-zinc-200"}`}>
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
