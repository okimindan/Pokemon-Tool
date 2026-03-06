"use client"
import { useState, useMemo } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ArrowRight, Minus } from "lucide-react"
import { calcEffectiveSpeed } from "@/lib/speedCalc"
import type { ActualStats } from "@/lib/types"

interface SpeedComparisonProps {
  attackerName:  string
  defenderName:  string
  attackerStats: ActualStats
  defenderStats: ActualStats
  attackerRank:  number
  defenderRank:  number
}

export function SpeedComparison({
  attackerName, defenderName, attackerStats, defenderStats, attackerRank, defenderRank,
}: SpeedComparisonProps) {
  const [atkScarf,  setAtkScarf]  = useState(false)
  const [defScarf,  setDefScarf]  = useState(false)
  const [atkPara,   setAtkPara]   = useState(false)
  const [defPara,   setDefPara]   = useState(false)
  const [trickRoom, setTrickRoom] = useState(false)

  const atkSpeed = useMemo(() => calcEffectiveSpeed(attackerStats.speed, {
    hasScarf: atkScarf, hasParalysis: atkPara, hasTailwind: false, rank: attackerRank, trickRoom: false,
  }), [attackerStats.speed, atkScarf, atkPara, attackerRank])

  const defSpeed = useMemo(() => calcEffectiveSpeed(defenderStats.speed, {
    hasScarf: defScarf, hasParalysis: defPara, hasTailwind: false, rank: defenderRank, trickRoom: false,
  }), [defenderStats.speed, defScarf, defPara, defenderRank])

  const atkGoesFirst = trickRoom ? atkSpeed < defSpeed : atkSpeed > defSpeed
  const isTie = atkSpeed === defSpeed

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {/* 攻撃側 */}
        <div className={`rounded p-2 text-center space-y-1 ${atkGoesFirst && !isTie ? "bg-blue-900/30 border border-blue-500/30" : "bg-zinc-900"}`}>
          <div className="text-xs text-zinc-400 truncate">{attackerName || "攻撃側"}</div>
          <div className="text-xl font-black text-white">{atkSpeed}</div>
          <div className="flex justify-center gap-2">
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={atkScarf} onChange={e => setAtkScarf(e.target.checked)} className="w-3 h-3" />
              <span className="text-[10px] text-zinc-400">スカーフ</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={atkPara} onChange={e => setAtkPara(e.target.checked)} className="w-3 h-3" />
              <span className="text-[10px] text-zinc-400">まひ</span>
            </label>
          </div>
        </div>

        {/* 先制インジケーター */}
        <div className="flex flex-col items-center gap-1">
          {isTie ? (
            <Minus className="h-5 w-5 text-yellow-400" />
          ) : atkGoesFirst ? (
            <ArrowRight className="h-5 w-5 text-blue-400" />
          ) : (
            <ArrowRight className="h-5 w-5 text-red-400 rotate-180" />
          )}
          <span className="text-[10px] text-zinc-500">{isTie ? "同速" : atkGoesFirst ? "先制" : "後攻"}</span>
        </div>

        {/* 防御側 */}
        <div className={`rounded p-2 text-center space-y-1 ${!atkGoesFirst && !isTie ? "bg-red-900/30 border border-red-500/30" : "bg-zinc-900"}`}>
          <div className="text-xs text-zinc-400 truncate">{defenderName || "防御側"}</div>
          <div className="text-xl font-black text-white">{defSpeed}</div>
          <div className="flex justify-center gap-2">
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={defScarf} onChange={e => setDefScarf(e.target.checked)} className="w-3 h-3" />
              <span className="text-[10px] text-zinc-400">スカーフ</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={defPara} onChange={e => setDefPara(e.target.checked)} className="w-3 h-3" />
              <span className="text-[10px] text-zinc-400">まひ</span>
            </label>
          </div>
        </div>
      </div>

      {/* トリックルーム */}
      <div className="flex items-center gap-2">
        <Switch checked={trickRoom} onCheckedChange={setTrickRoom} id="trick-room" className="scale-75" />
        <Label htmlFor="trick-room" className="text-xs cursor-pointer">トリックルーム</Label>
        {trickRoom && <span className="text-[10px] text-purple-400">（低速優先）</span>}
      </div>
    </div>
  )
}
