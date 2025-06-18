import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "MonadOsintSearch Mini App",
  description: "Web3 OSINT Search on Monad Testnet",
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": "https://your-domain.vercel.app/mini-app-preview.png",
    "fc:frame:button:1": "Open OSINT Search",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": "https://your-domain.vercel.app/mini-app",
  },
}

export default function MiniAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
