"use client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NATURES } from "@/lib/constants"
import { STAT_LABELS } from "@/lib/constants"
import type { Nature } from "@/lib/types"

interface NatureSelectProps {
  value:    Nature
  onChange: (v: Nature) => void
}

export function NatureSelect({ value, onChange }: NatureSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Nature)}>
      <SelectTrigger className="bg-zinc-900 border-zinc-700 h-8 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-zinc-900 border-zinc-700 max-h-60">
        {NATURES.map((n) => (
          <SelectItem key={n.name} value={n.name} className="text-sm cursor-pointer">
            <span className="flex items-center gap-1.5">
              <span>{n.name}</span>
              {n.boosted && (
                <span className="text-[10px] text-blue-400">
                  ↑{STAT_LABELS[n.boosted]}
                </span>
              )}
              {n.dropped && (
                <span className="text-[10px] text-red-400">
                  ↓{STAT_LABELS[n.dropped]}
                </span>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
