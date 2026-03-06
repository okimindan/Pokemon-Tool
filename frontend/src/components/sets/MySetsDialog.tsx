"use client"
import { useState } from "react"
import { Bookmark, Trash2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useCalculatorStore } from "@/store/calculatorStore"
import type { SavedSet } from "@/lib/types"

export function MySetsDialog() {
  const [open, setOpen]       = useState(false)
  const [setName, setSetName] = useState("")
  const [saveSide, setSaveSide] = useState<"attacker" | "defender">("attacker")
  const { savedSets, saveSet, loadSet, deleteSet, attacker, defender } = useCalculatorStore()

  const handleSave = () => {
    if (!setName.trim()) return
    saveSet(setName.trim(), saveSide)
    setSetName("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 bg-zinc-900 border-zinc-700 hover:bg-zinc-800">
          <Bookmark className="h-3.5 w-3.5" />
          マイセット ({savedSets.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-zinc-700 max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>マイセット</DialogTitle>
        </DialogHeader>

        {/* 保存フォーム */}
        <div className="space-y-2 border-b border-zinc-800 pb-4">
          <div className="text-xs text-zinc-400">現在の設定を保存</div>
          <div className="flex gap-2">
            <Button
              size="sm" variant={saveSide === "attacker" ? "default" : "outline"}
              className="text-xs"
              onClick={() => setSaveSide("attacker")}
            >
              攻撃側 ({attacker.name || "未選択"})
            </Button>
            <Button
              size="sm" variant={saveSide === "defender" ? "default" : "outline"}
              className="text-xs"
              onClick={() => setSaveSide("defender")}
            >
              防御側 ({defender.name || "未選択"})
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              value={setName}
              onChange={e => setSetName(e.target.value)}
              placeholder="セット名 (例: 陽気AS252ガブ)"
              className="bg-zinc-900 border-zinc-700 text-sm h-8"
              onKeyDown={e => { if (e.key === "Enter") handleSave() }}
            />
            <Button size="sm" onClick={handleSave} disabled={!setName.trim()}>保存</Button>
          </div>
        </div>

        {/* セット一覧 */}
        <div className="space-y-2">
          {savedSets.length === 0 ? (
            <div className="text-center text-zinc-500 text-sm py-4">保存済みセットなし</div>
          ) : (
            savedSets.map((set: SavedSet) => (
              <div key={set.id} className="flex items-center gap-2 p-2 rounded bg-zinc-900 hover:bg-zinc-800">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{set.name}</div>
                  <div className="text-[10px] text-zinc-500">
                    {set.config.name || "未選択"} / {set.config.nature} /
                    Lv.{set.config.level}
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="h-7 text-xs"
                  onClick={() => { loadSet(set.id, "attacker"); setOpen(false) }}>
                  <Download className="h-3 w-3 mr-1" />攻撃
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs"
                  onClick={() => { loadSet(set.id, "defender"); setOpen(false) }}>
                  <Download className="h-3 w-3 mr-1" />防御
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                  onClick={() => deleteSet(set.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
