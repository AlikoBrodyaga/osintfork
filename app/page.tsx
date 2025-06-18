import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "MonadOsintSearch",
  description: "The First OSINT Project on Web3 - Built on Monad Testnet",
  openGraph: {
    title: "MonadOsintSearch",
    description: "The First OSINT Project on Web3 - Built on Monad Testnet",
    images: ["/api/og"],
  },
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": `${process.env.NEXT_PUBLIC_URL}/api/og`,
    "fc:frame:button:1": "Open OSINT Search",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": `${process.env.NEXT_PUBLIC_URL}/mini-app`,
  },
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#121726] flex items-center justify-center">
      <div className="bg-[#1a2235] rounded-lg shadow-xl p-8 max-w-md w-full mx-4 border border-purple-600">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-purple-600 p-2 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
              <path d="M16 16h5v5"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">MonadOsintSearch</h1>
        </div>
        <p className="text-gray-400 text-sm mb-6">
          The First OSINT Project on Web3 - Built on Monad Testnet (1 MON per request)
        </p>
        <div className="text-center">
          <a
            href="/mini-app"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors w-full block"
          >
            Open OSINT Search
          </a>
        </div>
      </div>
    </div>
  )
}
