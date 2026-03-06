"use client"
import { useState, useMemo } from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { TypeBadge } from "@/components/layout/TypeBadge"
import { useMoveData } from "@/hooks/useMoveData"

interface MoveComboboxProps {
  value:    string
  onChange: (value: string) => void
}

export function MoveCombobox({ value, onChange }: MoveComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const { moves, isLoading } = useMoveData()

  const filtered = useMemo(() => {
    if (!query) return moves.slice(0, 80)
    const q = query.toLowerCase()
    return moves.filter(m =>
      m.nameJa.includes(query) || m.name.toLowerCase().includes(q)
    ).slice(0, 80)
  }, [moves, query])

  const selected = moves.find(m => m.nameJa === value || m.name === value)

  const categoryLabel = (cat: string) => ({ Physical: "物理", Special: "特殊", Status: "変化" }[cat] ?? cat)
  const categoryColor = (cat: string) =>
    cat === "Physical" ? "text-orange-400" : cat === "Special" ? "text-blue-400" : "text-green-400"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between bg-zinc-900 border-zinc-700 hover:bg-zinc-800 h-auto py-2"
        >
          <span className="flex items-center gap-2 min-w-0">
            {selected ? (
              <>
                <span className="font-medium truncate">{selected.nameJa}</span>
                <TypeBadge type={selected.type} />
                <span className={`text-[10px] font-bold ${categoryColor(selected.category)}`}>
                  {categoryLabel(selected.category)}
                </span>
                {selected.power !== "" && (
                  <span className="text-[10px] text-zinc-400">威力{selected.power}</span>
                )}
              </>
            ) : (
              <span className="text-zinc-400">{isLoading ? "読込中..." : "技を選択"}</span>
            )}
          </span>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronsUpDown className="h-4 w-4 opacity-50" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-zinc-900 border-zinc-700" align="start">
        <Command className="bg-zinc-900">
          <CommandInput
            placeholder="技名で検索..."
            value={query}
            onValueChange={setQuery}
            className="border-zinc-700"
          />
          <CommandList>
            <CommandEmpty>見つかりません</CommandEmpty>
            <CommandGroup>
              {filtered.map((m) => (
                <CommandItem
                  key={m.id + m.nameJa}
                  value={m.nameJa}
                  onSelect={() => {
                    onChange(m.nameJa)
                    setOpen(false)
                    setQuery("")
                  }}
                  className="cursor-pointer hover:bg-zinc-800"
                >
                  <Check className={cn("mr-2 h-4 w-4 shrink-0", value === m.nameJa ? "opacity-100" : "opacity-0")} />
                  <span className="flex-1">{m.nameJa}</span>
                  <span className="flex items-center gap-1.5">
                    <TypeBadge type={m.type} />
                    <span className={`text-[10px] font-bold ${categoryColor(m.category)}`}>
                      {categoryLabel(m.category)}
                    </span>
                    {m.power !== "" && (
                      <span className="text-[10px] text-zinc-400">P{m.power}</span>
                    )}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
