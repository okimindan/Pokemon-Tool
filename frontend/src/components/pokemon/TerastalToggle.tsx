"use client"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TypeBadge } from "@/components/layout/TypeBadge"
import { ALL_TYPES, TYPE_COLORS } from "@/lib/constants"
import type { TerastalState, PokemonType } from "@/lib/types"

interface TerastalToggleProps {
  value:    TerastalState
  onChange: (v: TerastalState) => void
}

export function TerastalToggle({ value, onChange }: TerastalToggleProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <Switch
          checked={value.isTerastallized}
          onCheckedChange={(checked) => onChange({ ...value, isTerastallized: checked })}
          id="tera-switch"
        />
        <Label htmlFor="tera-switch" className="text-sm cursor-pointer">テラスタル</Label>
      </div>
      {value.isTerastallized && (
        <Select
          value={value.teraType ?? ""}
          onValueChange={(v) => onChange({ ...value, teraType: v as PokemonType })}
        >
          <SelectTrigger className="bg-zinc-900 border-zinc-700 h-8 w-40 text-sm">
            <SelectValue placeholder="テラタイプ選択">
              {value.teraType && <TypeBadge type={value.teraType} size="md" />}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            {ALL_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="cursor-pointer">
                <TypeBadge type={t} size="md" />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
