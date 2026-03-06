"use client"
import { useCallback } from "react"
import { useCalculatorStore } from "@/store/calculatorStore"
import { encodeState } from "@/lib/urlState"
import { toast } from "sonner"

export function useShareUrl() {
  const store = useCalculatorStore()

  const copyShareUrl = useCallback(() => {
    const params = encodeState({
      attacker:   store.attacker,
      defender:   store.defender,
      moveName:   store.moveName,
      isCritical: store.isCritical,
      context:    store.context,
    })

    const url = `${window.location.origin}${window.location.pathname}?${params}`
    navigator.clipboard.writeText(url).then(() => {
      toast.success("URLをコピーしました")
    }).catch(() => {
      toast.error("コピーに失敗しました")
    })
  }, [store])

  return { copyShareUrl }
}
