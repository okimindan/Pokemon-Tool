"use client"
import { useState, useMemo } from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { TypeBadge } from "@/components/layout/TypeBadge"
import { usePokemonData } from "@/hooks/usePokemonData"

interface PokemonComboboxProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function PokemonCombobox({ value, onChange, placeholder = "ポケモンを選択" }: PokemonComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const { pokemon, isLoading } = usePokemonData()

  const filtered = useMemo(() => {
    if (!query) return pokemon.slice(0, 80)
    const q = query.toLowerCase()
    return pokemon.filter(p =>
      p.nameJa.includes(query) || p.name.toLowerCase().includes(q)
    ).slice(0, 80)
  }, [pokemon, query])

  const selected = pokemon.find(p => p.nameJa === value || p.name === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-left h-auto py-2"
        >
          <span className="flex items-center gap-2 min-w-0">
            {selected ? (
              <>
                <span className="font-medium truncate">{selected.nameJa}</span>
                <TypeBadge type={selected.type1} />
                {selected.type2 && <TypeBadge type={selected.type2} />}
              </>
            ) : (
              <span className="text-zinc-400">{isLoading ? "読込中..." : placeholder}</span>
            )}
          </span>
          {isLoading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0 bg-zinc-900 border-zinc-700" align="start">
        <Command className="bg-zinc-900">
          <CommandInput
            placeholder="名前で検索..."
            value={query}
            onValueChange={setQuery}
            className="border-zinc-700"
          />
          <CommandList>
            <CommandEmpty>見つかりません</CommandEmpty>
            <CommandGroup>
              {filtered.map((p) => (
                <CommandItem
                  key={p.id + p.nameJa}
                  value={p.nameJa}
                  onSelect={() => {
                    onChange(p.nameJa)
                    setOpen(false)
                    setQuery("")
                  }}
                  className="cursor-pointer hover:bg-zinc-800"
                >
                  <Check className={cn("mr-2 h-4 w-4 shrink-0", value === p.nameJa ? "opacity-100" : "opacity-0")} />
                  <span className="flex-1 font-medium">{p.nameJa}</span>
                  <span className="flex gap-1">
                    <TypeBadge type={p.type1} />
                    {p.type2 && <TypeBadge type={p.type2} />}
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
