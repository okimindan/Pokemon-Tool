"use client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { STATUS_OPTIONS } from "@/lib/constants"
import type { StatusCondition } from "@/lib/types"

interface StatusSelectProps {
  value:    StatusCondition
  onChange: (v: StatusCondition) => void
}

export function StatusSelect({ value, onChange }: StatusSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as StatusCondition)}>
      <SelectTrigger className="bg-zinc-900 border-zinc-700 h-8 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-zinc-900 border-zinc-700">
        {STATUS_OPTIONS.map((s) => (
          <SelectItem key={s.value} value={s.value} className="cursor-pointer">
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
