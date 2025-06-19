import { sdk } from '@farcaster/frame-sdk'
import { useEffect } from 'react'
import { NavLink, Route, Routes } from 'react-router'
import QuickAuth from './Routes/QuickAuth.tsx'
import Wagmi from './Routes/Wagmi.tsx'

function App() {
  useEffect(() => {
    sdk.actions.ready()
    sdk.back.enableWebNavigation()
  }, [])

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/quick-auth" element={<QuickAuth />} />
      <Route path="/wagmi" element={<Wagmi />} />
    </Routes>
  )
}

function Home() {
  return (
    <>
      <NavLink to="/quick-auth" style={{ display: 'block' }}>
        Quick Auth
      </NavLink>
      <NavLink to="/wagmi" style={{ display: 'block' }} end>
        Wagmi
      </NavLink>
    </>
  )
}

export default App
import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        backgroundColor: "#0f172a",
        color: "white",
        padding: "40px",
      }}
    >
      <div style={{ fontSize: "60px", marginBottom: "20px" }}>🕷️</div>
      <h1
        style={{
          fontSize: "60px",
          fontWeight: "bold",
          margin: "0",
        }}
      >
        OSINT Mini Search
      </h1>
      <p
        style={{
          fontSize: "30px",
          color: "#9ca3af",
          marginTop: "8px",
        }}
      >
        Web3 Intelligence on Monad Testnet
      </p>
      <p
        style={{
          fontSize: "24px",
          color: "#c084fc",
          marginTop: "40px",
          fontWeight: "500",
        }}
      >
        Click Launch App to start your search
      </p>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  )
}
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Shield, ExternalLink, CheckCircle, AlertCircle, Share2, Wallet } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import { ethers } from "ethers"

interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
}

interface SearchResult {
  databases: number
  totalRecords: number
  query: string
  timestamp: string
}

const MONAD_TESTNET_CHAIN_ID = "0x279F" // 10143
const RECIPIENT_ADDRESS = process.env.NEXT_PUBLIC_RECIPIENT_ADDRESS || "0x35e4fb9cd12a9a76cdc2496003008cee8f5fc000"
const SEARCH_COST = "0.5" // in MON

export default function OsintAppPage() {
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null)
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [error, setError] = useState("")
  const [txHash, setTxHash] = useState<string | null>(null)
  const [txStatus, setTxStatus] = useState<"pending" | "confirmed" | "failed" | null>(null)

  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false)

  useEffect(() => {
    const fid = searchParams.get("fid")
    if (fid) {
      setFarcasterUser({
        fid: Number.parseInt(fid),
        username: `user-${fid}`,
        displayName: `Farcaster User #${fid}`,
        pfpUrl: `/placeholder.svg?height=40&width=40&query=farcaster+user+${fid}`,
      })
    }

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)
      checkWalletConnection()
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [searchParams]) // Добавил searchParams в зависимости useEffect

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length > 0) {
      setWalletAddress(accounts[0])
      setIsWalletConnected(true)
    } else {
      setIsWalletConnected(false)
      setWalletAddress(null)
    }
  }

  const handleChainChanged = (chainId: string) => {
    setIsCorrectNetwork(chainId === MONAD_TESTNET_CHAIN_ID)
  }

  const checkWalletConnection = async () => {
    if (!window.ethereum) return
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.listAccounts()
      if (accounts.length > 0 && accounts[0]) {
        // Проверка что accounts[0] существует
        setWalletAddress(accounts[0].address)
        setIsWalletConnected(true)
        const network = await provider.getNetwork()
        setIsCorrectNetwork(network.chainId.toString() === MONAD_TESTNET_CHAIN_ID.slice(2))
      } else {
        setIsWalletConnected(false)
        setWalletAddress(null)
      }
    } catch (err) {
      console.error("Failed to check wallet connection:", err)
      setIsWalletConnected(false)
      setWalletAddress(null)
    }
  }

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({ title: "MetaMask не найден", description: "Пожалуйста, установите MetaMask.", variant: "destructive" })
      return
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send("eth_requestAccounts", [])
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      setWalletAddress(address)
      setIsWalletConnected(true)
      const network = await provider.getNetwork()
      if (network.chainId.toString() !== MONAD_TESTNET_CHAIN_ID.slice(2)) {
        await switchNetwork()
      } else {
        setIsCorrectNetwork(true)
      }
    } catch (err) {
      console.error(err)
      toast({ title: "Ошибка подключения", description: "Не удалось подключить кошелек.", variant: "destructive" })
    }
  }

  const switchNetwork = async () => {
    if (!window.ethereum) return
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: MONAD_TESTNET_CHAIN_ID }],
      })
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: MONAD_TESTNET_CHAIN_ID,
                chainName: "Monad Testnet",
                rpcUrls: ["https://testnet.monad.xyz"],
                nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
                blockExplorerUrls: ["https://testnet-explorer.monad.xyz"],
              },
            ],
          })
        } catch (addError) {
          console.error(addError)
          toast({ title: "Ошибка добавления сети", variant: "destructive" })
        }
      }
    }
  }

  const handleSearch = async () => {
    if (!query.trim()) {
      setError("Пожалуйста, введите поисковый запрос.")
      return
    }
    if (!isWalletConnected || !isCorrectNetwork) {
      setError("Пожалуйста, подключите кошелек к сети Monad Testnet.")
      return
    }

    setError("")
    setIsLoading(true)
    setTxStatus(null)
    setSearchResult(null)

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const tx = await signer.sendTransaction({
        to: RECIPIENT_ADDRESS,
        value: ethers.parseEther(SEARCH_COST),
      })

      setTxHash(tx.hash)
      setTxStatus("pending")
      toast({ title: "Транзакция отправлена", description: "Ожидание подтверждения..." })

      const receipt = await tx.wait()

      if (receipt && receipt.status === 1) {
        setTxStatus("confirmed")
        toast({
          title: "Оплата подтверждена!",
          description: "Выполняем поиск...",
          className: "bg-green-600 text-white",
        })
        await performOsintSearch()
      } else {
        throw new Error("Транзакция не удалась")
      }
    } catch (err: any) {
      console.error(err)
      setError(err.reason || "Ошибка транзакции.")
      setTxStatus("failed")
      toast({ title: "Ошибка оплаты", description: err.reason || "Транзакция была отклонена.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const performOsintSearch = async () => {
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, userAddress: walletAddress }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Ошибка API поиска")
      }

      const data = await response.json()
      const result: SearchResult = {
        databases: Object.keys(data.List || {}).length,
        totalRecords: data.total || 0,
        query,
        timestamp: new Date().toISOString(),
      }
      setSearchResult(result)
    } catch (err: any) {
      setError(err.message)
      toast({ title: "Ошибка поиска", description: err.message, variant: "destructive" })
    }
  }

  const shareToFarcaster = () => {
    if (!searchResult) return

    const castText = `🕷️ OSINT Search Results:\n\n🔍 "${searchResult.query}"\n📊 Found in ${searchResult.databases} databases\n📋 ${searchResult.totalRecords} total records\n\n#Web3OSINT #Monad #OSINT\n\nTry it: ${window.location.origin}/api/frame`
    const farcasterUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}`
    window.open(farcasterUrl, "_blank")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black text-white p-4">
      <div
        className="fixed inset-0 bg-contain bg-center bg-no-repeat opacity-10"
        style={{ backgroundImage: "url('/images/spidar.png')" }}
      />
      <div className="fixed inset-0 bg-black/70" />
      <div className="relative z-10 max-w-md mx-auto space-y-4">
        <Card className="bg-gray-900/80 border-purple-500 backdrop-blur-sm">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2 text-purple-300 text-lg">
                  <Shield className="h-5 w-5" />
                  OSINT Mini Search
                </CardTitle>
                <CardDescription className="text-gray-400 text-sm">Web3 Intelligence on Monad</CardDescription>
              </div>
              {!isWalletConnected ? (
                <Button onClick={connectWallet} size="sm" className="bg-purple-600 hover:bg-purple-700">
                  <Wallet className="mr-2 h-4 w-4" /> Connect
                </Button>
              ) : (
                <div className="text-right">
                  <Badge variant="secondary" className="text-xs truncate max-w-[120px]">
                    {walletAddress}
                  </Badge>
                  <Badge
                    variant={isCorrectNetwork ? "default" : "destructive"}
                    className={`text-xs mt-1 block ${isCorrectNetwork ? "bg-green-600" : "bg-red-600"}`} // Динамический класс для фона
                  >
                    {isCorrectNetwork ? "Monad Testnet" : "Wrong Network"}
                  </Badge>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        <Card className="bg-gray-900/80 border-purple-500 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-purple-300 text-base">New Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="query" className="text-white text-sm">
                Search Query
              </Label>
              <Input
                id="query"
                placeholder="Email, phone, username..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="bg-gray-800 border-purple-500 text-white placeholder-gray-400 focus:border-purple-400"
              />
            </div>
            {error && (
              <Alert variant="destructive" className="bg-red-900/50 border-red-700">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}
            <Button
              onClick={handleSearch}
              disabled={isLoading || !query.trim() || !isWalletConnected || !isCorrectNetwork}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                `Pay ${SEARCH_COST} MON & Search`
              )}
            </Button>
          </CardContent>
        </Card>

        {txHash && (
          <Card className="bg-gray-900/80 border-purple-500 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-purple-300 text-base">Transaction Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge
                  variant={txStatus === "confirmed" ? "default" : txStatus === "failed" ? "destructive" : "secondary"}
                  className={txStatus === "confirmed" ? "bg-green-600" : ""} // Фон для confirmed
                >
                  {txStatus}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tx Hash:</span>
                <a
                  href={`https://testnet-explorer.monad.xyz/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:underline text-sm truncate max-w-[180px]"
                >
                  {txHash} <ExternalLink className="inline h-3 w-3 ml-1" />
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {searchResult && (
          <Card className="bg-gray-900/80 border-green-500 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-400 text-base">
                <CheckCircle className="h-4 w-4" /> Search Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-purple-900/30 rounded-lg">
                  <div className="text-lg font-bold text-purple-300">{searchResult.databases}</div>
                  <div className="text-xs text-gray-400">Databases</div>
                </div>
                <div className="text-center p-3 bg-purple-900/30 rounded-lg">
                  <div className="text-lg font-bold text-purple-300">{searchResult.totalRecords}</div>
                  <div className="text-xs text-gray-400">Records</div>
                </div>
              </div>
              <Button onClick={shareToFarcaster} className="w-full bg-blue-600 hover:bg-blue-700">
                <Share2 className="mr-2 h-4 w-4" /> Share on Farcaster
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

