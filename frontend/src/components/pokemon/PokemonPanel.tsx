"use client"
import { useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"
import { PokemonCombobox } from "./PokemonCombobox"
import { EVInputGroup } from "./EVInputGroup"
import { NatureSelect } from "./NatureSelect"
import { RankAdjuster } from "./RankAdjuster"
import { TerastalToggle } from "./TerastalToggle"
import { StatusSelect } from "./StatusSelect"
import { TypeBadge } from "@/components/layout/TypeBadge"
import { useDataStore } from "@/store/dataStore"
import { calcActualStats } from "@/lib/speedCalc"
import type { PokemonConfig, EVs, IVs, StatRanks, Nature, StatusCondition, TerastalState } from "@/lib/types"

interface PokemonPanelProps {
  label:     string
  config:    PokemonConfig
  onUpdate:  (updates: Partial<PokemonConfig>) => void
  onEvChange:(stat: keyof EVs, val: number) => void
  onIvChange:(stat: keyof IVs, val: number) => void
  onRankChange:(stat: keyof StatRanks, val: number) => void
  onReset:   () => void
  color:     "blue" | "red"
}

export function PokemonPanel({
  label, config, onUpdate, onEvChange, onIvChange, onRankChange, onReset, color,
}: PokemonPanelProps) {
  const { pokemon } = useDataStore()
  const pokemonData = useMemo(
    () => pokemon.find(p => p.nameJa === config.name || p.name === config.name),
    [pokemon, config.name]
  )

  const actualStats = useMemo(() => {
    if (!pokemonData) return null
    return calcActualStats(config, {
      hp: pokemonData.hp, attack: pokemonData.attack, defense: pokemonData.defense,
      spAttack: pokemonData.spAttack, spDefense: pokemonData.spDefense, speed: pokemonData.speed,
    })
  }, [pokemonData, config])

  const borderColor = color === "blue" ? "border-blue-500/40" : "border-red-500/40"
  const labelColor  = color === "blue" ? "text-blue-400"      : "text-red-400"

  return (
    <div className={`rounded-lg border ${borderColor} bg-zinc-950 p-3`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs font-bold uppercase tracking-wider ${labelColor}`}>{label}</span>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-zinc-500" onClick={onReset}>
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>

      {/* ポケモン選択 */}
      <div className="mb-2">
        <PokemonCombobox
          value={config.name}
          onChange={(v) => onUpdate({ name: v })}
        />
      </div>

      {/* 選択済みポケモン情報 */}
      {pokemonData && (
        <div className="flex items-center gap-2 mb-2 text-xs text-zinc-400">
          <TypeBadge type={pokemonData.type1} />
          {pokemonData.type2 && <TypeBadge type={pokemonData.type2} />}
          <span className="text-zinc-500">
            HP{pokemonData.hp} / 攻{pokemonData.attack} / 防{pokemonData.defense} /
            特攻{pokemonData.spAttack} / 特防{pokemonData.spDefense} / 速{pokemonData.speed}
          </span>
        </div>
      )}

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="w-full bg-zinc-900 h-7">
          <TabsTrigger value="basic"  className="flex-1 text-xs h-6">基本</TabsTrigger>
          <TabsTrigger value="stats"  className="flex-1 text-xs h-6">努力値/個体値</TabsTrigger>
          <TabsTrigger value="battle" className="flex-1 text-xs h-6">バトル</TabsTrigger>
        </TabsList>

        {/* ── 基本タブ ── */}
        <TabsContent value="basic" className="mt-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-zinc-400">Lv.</Label>
              <Input
                type="number" min={1} max={100} value={config.level}
                onChange={(e) => onUpdate({ level: Math.max(1, Math.min(100, parseInt(e.target.value) || 50)) })}
                className="h-8 bg-zinc-900 border-zinc-700 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-zinc-400">性格</Label>
              <NatureSelect value={config.nature} onChange={(v) => onUpdate({ nature: v as Nature })} />
            </div>
          </div>
          <div>
            <Label className="text-xs text-zinc-400">特性</Label>
            <Input
              value={config.ability} placeholder="例: かたやぶり"
              onChange={(e) => onUpdate({ ability: e.target.value })}
              className="h-8 bg-zinc-900 border-zinc-700 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-zinc-400">持ち物</Label>
            <Input
              value={config.item} placeholder="例: いのちのたま"
              onChange={(e) => onUpdate({ item: e.target.value })}
              className="h-8 bg-zinc-900 border-zinc-700 text-sm"
            />
          </div>
        </TabsContent>

        {/* ── 努力値/個体値タブ ── */}
        <TabsContent value="stats" className="mt-2">
          <EVInputGroup
            evs={config.evs} ivs={config.ivs} actualStats={actualStats}
            onEvChange={onEvChange} onIvChange={onIvChange}
          />
        </TabsContent>

        {/* ── バトルタブ ── */}
        <TabsContent value="battle" className="mt-2 space-y-3">
          <div>
            <Label className="text-xs text-zinc-400 mb-1 block">状態異常</Label>
            <StatusSelect
              value={config.status}
              onChange={(v) => onUpdate({ status: v as StatusCondition })}
            />
          </div>
          <div>
            <Label className="text-xs text-zinc-400 mb-1 block">テラスタル</Label>
            <TerastalToggle
              value={config.terastal}
              onChange={(v) => onUpdate({ terastal: v as TerastalState })}
            />
          </div>
          <div>
            <Label className="text-xs text-zinc-400 mb-2 block">ランク補正</Label>
            <RankAdjuster ranks={config.ranks} onChange={onRankChange} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
