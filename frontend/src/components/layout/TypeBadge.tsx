"use client"
import { TYPE_COLORS } from "@/lib/constants"
import type { PokemonType } from "@/lib/types"

interface TypeBadgeProps {
  type: PokemonType | ""
  size?: "sm" | "md"
}

export function TypeBadge({ type, size = "sm" }: TypeBadgeProps) {
  if (!type) return null
  const color = TYPE_COLORS[type]
  if (!color) return null

  return (
    <span
      className={`inline-block rounded font-bold ${size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"}`}
      style={{ backgroundColor: color.bg, color: color.text }}
    >
      {color.label}
    </span>
  )
}
