import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PokéCalc SV - ポケモンSVダメージ計算機",
  description: "ポケモン スカーレット・バイオレット (第9世代) ダメージ計算機",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="dark">
      <body className={`${geist.className} bg-zinc-950 text-zinc-100 min-h-screen`}>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
