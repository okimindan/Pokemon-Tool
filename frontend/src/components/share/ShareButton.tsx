"use client"
import { Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useShareUrl } from "@/hooks/useShareUrl"

export function ShareButton() {
  const { copyShareUrl } = useShareUrl()
  return (
    <Button variant="outline" size="sm" className="gap-1.5 bg-zinc-900 border-zinc-700 hover:bg-zinc-800" onClick={copyShareUrl}>
      <Share2 className="h-3.5 w-3.5" />
      共有URL
    </Button>
  )
}
