"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, AlertCircle, CheckCircle, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Script from "next/script"

const appUrl = "https://monad-osint.vercel.app";

const frame = {
  version: "next",
  imageUrl: `${appUrl}/images/feed.png`,
  button: {
    title: "Launch Template",
    action: {
      type: "launch_frame",
      name: "Monad Farcaster MiniApp Template",
      url: appUrl,
      splashImageUrl: `${appUrl}/images/splash.png`, // App icon in the splash screen (200px * 200px)
      splashBackgroundColor: "#f7f7f7", // Splash screen background color
    },
  },
};

interface ApiResponse {
  List: Record<
    string,
    {
      InfoLeak: string
      Data: Record<string, any>[]
    }
  >
}

export default function FarcasterMiniApp() {
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [balance, setBalance] = useState(0)
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null)
  const [error, setError] = useState("")
  const [farcasterReady, setFarcasterReady] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Инициализация Farcaster Frame SDK
    const initFarcaster = () => {
      if (typeof window !== "undefined" && window.frameSDK) {
        try {
          window.frameSDK.actions.ready()
          setFarcasterReady(true)
          console.log("✅ Farcaster Frame SDK готов")
        } catch (error) {
          console.warn("⚠️ Ошибка инициализации Farcaster SDK:", error)
        }
      }
    }

    // Проверяем MetaMask
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0])
            setIsConnected(true)
            checkBalance(accounts[0]).catch(console.error)
          }
        })
        .catch(console.error)
    }

    // Пытаемся инициализировать Farcaster
    initFarcaster()

    // Если SDK еще не загружен, ждем
    const checkFarcaster = setInterval(() => {
      if (window.frameSDK && !farcasterReady) {
        initFarcaster()
        clearInterval(checkFarcaster)
      }
    }, 1000)

    return () => clearInterval(checkFarcaster)
  }, [farcasterReady])

  const checkBalance = async (address: string) => {
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("MetaMask не доступен")
      }

      const balance = await window.ethereum.request({
        method: "eth_getBalance",
        params: [address, "latest"],
      })

      const balanceInMON = Number.parseInt(balance, 16) / Math.pow(10, 18)
      setBalance(Math.floor(balanceInMON * 100) / 100)
    } catch (error) {
      console.error("Ошибка проверки баланса:", error)
      setBalance(10) // Резервный баланс
    }
  }

  const connectWallet = async () => {
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("MetaMask не найден")
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (!accounts || accounts.length === 0) {
        throw new Error("Не удалось получить аккаунты")
      }

      // Переключаемся на Monad Testnet
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x279F" }],
        })
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x279F",
                chainName: "Monad Testnet",
                nativeCurrency: {
                  name: "MON",
                  symbol: "MON",
                  decimals: 18,
                },
                rpcUrls: ["https://testnet-rpc.monad.xyz"],
                blockExplorerUrls: ["https://testnet-explorer.monad.xyz"],
              },
            ],
          })
        }
      }

      setWalletAddress(accounts[0])
      setIsConnected(true)
      await checkBalance(accounts[0])

      toast({
        title: "Wallet Connected",
        description: "Connected to Monad Testnet",
      })
    } catch (error: any) {
      setError(`Connection error: ${error.message}`)
      toast({
        title: "Connection Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const makeSearch = async () => {
    if (!query.trim()) {
      setError("Please enter a search query")
      return
    }

    if (!isConnected) {
      setError("Please connect your wallet first")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask не найден")
      }

      // Отправляем транзакцию
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: walletAddress,
            to: "0x35e4fb9cd12a9a76cdc2496003008cee8f5fc000",
            value: "0xDE0B6B3A7640000", // 1 MON
            gas: "0x5208",
          },
        ],
      })

      // Делаем поиск
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request: query,
          limit: 100,
          lang: "en",
          userAddress: walletAddress,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Search error")
      }

      setApiResponse(data)
      setBalance((prev) => Math.max(0, prev - 1))

      toast({
        title: "Search Complete",
        description: `Found results in ${Object.keys(data.List || {}).length} databases`,
      })
    } catch (error: any) {
      setError(error.message)
      toast({
        title: "Search Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="min-h-screen bg-black text-white font-mono p-2">
        <div className="max-w-md mx-auto space-y-4">
          {/* Заголовок для Mini App */}
          <Card className="bg-gray-900 border-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-white font-bold text-lg">
                <Shield className="h-6 w-6 text-purple-400" />
                OSINT Search
                <Badge className="bg-purple-600 text-white text-xs">Mini App</Badge>
              </CardTitle>
              <CardDescription className="text-gray-300 text-sm">🕷️ Web3 OSINT on Monad Testnet</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                {!isConnected ? (
                  <Button onClick={connectWallet} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                    Connect Wallet
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-purple-500 text-purple-300 text-xs">
                      <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                      Connected
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </span>
                  </div>
                )}
                {isConnected && <Badge className="bg-purple-600 text-white text-xs">{balance.toFixed(2)} MON</Badge>}
              </div>
            </CardContent>
          </Card>

          {/* Поиск */}
          <Card className="bg-gray-900 border-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-purple-300 text-base">Quick Search</CardTitle>
              <CardDescription className="text-gray-400 text-sm">1 MON per search</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="query" className="text-white text-sm">
                  Search Query
                </Label>
                <Textarea
                  id="query"
                  placeholder="Enter email, name, phone..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  rows={2}
                  className="bg-gray-800 border-purple-500 text-white placeholder-gray-400 text-sm"
                />
              </div>

              {error && (
                <Alert variant="destructive" className="bg-red-900 border-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={makeSearch}
                disabled={isLoading || !isConnected}
                className="bg-purple-600 hover:bg-purple-700 text-white w-full"
                size="sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search (1 MON)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Результаты */}
          {apiResponse && (
            <Card className="bg-gray-900 border-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-purple-300 text-base">Results</CardTitle>
                <CardDescription className="text-gray-400 text-sm">
                  Found in {Object.keys(apiResponse.List).length} database(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(apiResponse.List)
                    .slice(0, 3)
                    .map(([dbName, dbData]) => (
                      <div key={dbName} className="p-2 bg-gray-800 rounded border border-purple-600">
                        <h4 className="font-medium text-purple-300 text-sm mb-1">{dbName}</h4>
                        <p className="text-xs text-gray-400 mb-2">{dbData.InfoLeak}</p>
                        {dbData.Data && dbData.Data.length > 0 && (
                          <div className="text-xs text-gray-300">
                            <strong>Records:</strong> {dbData.Data.length}
                          </div>
                        )}
                      </div>
                    ))}
                  {Object.keys(apiResponse.List).length > 3 && (
                    <p className="text-xs text-gray-400 text-center">
                      +{Object.keys(apiResponse.List).length - 3} more databases
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Статус Farcaster */}
          <Card className="bg-gray-900 border-purple-500">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Farcaster Frame:</span>
                <Badge variant={farcasterReady ? "default" : "secondary"} className="text-xs">
                  {farcasterReady ? "Ready" : "Loading..."}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Farcaster Frame SDK */}
      <Script
        src="https://cdn.jsdelivr.net/npm/@farcaster/frame-sdk/dist/index.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (window.frameSDK) {
            try {
              window.frameSDK.actions.ready()
              setFarcasterReady(true)
            } catch (error) {
              console.warn("Farcaster SDK error:", error)
            }
          }
        }}
      />
    </>
  )
}
