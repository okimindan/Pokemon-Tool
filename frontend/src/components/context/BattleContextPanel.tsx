"use client"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WEATHER_OPTIONS, FIELD_OPTIONS } from "@/lib/constants"
import type { BattleContext, Weather, Field, BattleFormat } from "@/lib/types"

interface BattleContextPanelProps {
  context:   BattleContext
  onChange:  (updates: Partial<BattleContext>) => void
  isCritical: boolean
  onCriticalChange: (v: boolean) => void
}

export function BattleContextPanel({ context, onChange, isCritical, onCriticalChange }: BattleContextPanelProps) {
  return (
    <div className="space-y-3">
      {/* 天候 / フィールド */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-zinc-400 mb-1 block">天候</Label>
          <Select value={context.weather} onValueChange={(v) => onChange({ weather: v as Weather })}>
            <SelectTrigger className="h-8 bg-zinc-900 border-zinc-700 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {WEATHER_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value} className="cursor-pointer text-sm">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-zinc-400 mb-1 block">フィールド</Label>
          <Select value={context.field} onValueChange={(v) => onChange({ field: v as Field })}>
            <SelectTrigger className="h-8 bg-zinc-900 border-zinc-700 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {FIELD_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value} className="cursor-pointer text-sm">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 壁 + ワンダールーム */}
      <div className="grid grid-cols-2 gap-2">
        {([
          { key: "isReflect",     label: "リフレクター" },
          { key: "isLightScreen", label: "ひかりのかべ" },
          { key: "isAuroraVeil",  label: "オーロラベール" },
          { key: "isWonderRoom",  label: "ワンダールーム" },
        ] as const).map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2">
            <Switch
              checked={context[key]}
              onCheckedChange={(v) => onChange({ [key]: v })}
              id={key}
              className="scale-75"
            />
            <Label htmlFor={key} className="text-xs cursor-pointer">{label}</Label>
          </div>
        ))}
      </div>

      {/* フォーマット + 急所 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={context.format === "doubles"}
            onCheckedChange={(v) => onChange({ format: v ? "doubles" : "singles" })}
            id="format"
            className="scale-75"
          />
          <Label htmlFor="format" className="text-xs cursor-pointer">ダブルバトル</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={isCritical}
            onCheckedChange={onCriticalChange}
            id="critical"
            className="scale-75"
          />
          <Label htmlFor="critical" className="text-xs cursor-pointer text-yellow-400">急所</Label>
        </div>
      </div>
    </div>
  )
}
