"use client"
import { useCallback } from "react"
import { useCalculatorStore } from "@/store/calculatorStore"
import { calcDamage } from "@/lib/api"

export function useCalcApi() {
  const store = useCalculatorStore()

  const calculate = useCallback(async () => {
    if (!store.attacker.name || !store.defender.name || !store.moveName) {
      store.setCalcError("攻撃側・防御側のポケモンと技を選択してください")
      return
    }

    store.setCalculating(true)
    store.setCalcError(null)

    try {
      const result = await calcDamage({
        attacker:   store.attacker,
        defender:   store.defender,
        moveName:   store.moveName,
        isCritical: store.isCritical,
        context:    store.context,
      })

      if (!result.success) {
        store.setCalcError(result.error ?? "計算に失敗しました")
        return
      }

      store.setResult(result)
    } catch (err) {
      store.setCalcError(err instanceof Error ? err.message : "通信エラーが発生しました")
    } finally {
      store.setCalculating(false)
    }
  }, [store])

  return {
    calculate,
    isCalculating: store.isCalculating,
    calcError:     store.calcError,
    result:        store.result,
  }
}
