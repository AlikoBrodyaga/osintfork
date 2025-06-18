"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Search, AlertCircle } from "lucide-react"

interface FarcasterUser {
  fid?: number
  username?: string
  displayName?: string
  pfpUrl?: string
}

interface SearchResult {
  id: string
  type: string
  value: string
  source: string
  date: string
}

export default function MiniApp() {
  const [user, setUser] = useState<FarcasterUser | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchLimit, setSearchLimit] = useState("100")
  const [language, setLanguage] = useState("Russian")
  const [isLoading, setIsLoading] = useState(false)
  const [hasMetaMask, setHasMetaMask] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [activeTab, setActiveTab] = useState("search")

  useEffect(() => {
    // Проверяем наличие MetaMask
    const checkMetaMask = () => {
      const hasMetaMask = typeof window !== "undefined" && typeof window.ethereum !== "undefined"
      setHasMetaMask(hasMetaMask)
    }

    // Получаем данные пользователя из Farcaster контекста
    const getUserData = async () => {
      try {
        // В реальном приложении здесь будет аутентификация через Farcaster
        const urlParams = new URLSearchParams(window.location.search)
        const fid = urlParams.get("fid")

        if (fid) {
          setUser({
            fid: Number.parseInt(fid),
            username: "user",
            displayName: "Farcaster User",
          })
        }
      } catch (error) {
        console.error("Error getting user data:", error)
      }
    }

    checkMetaMask()
    getUserData()
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchQuery.trim()) return

    setIsLoading(true)
    setSearchResults([])

    try {
      // Здесь будет реальный запрос к вашему API
      // Имитация запроса
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Имитация результатов
      const mockResults: SearchResult[] = [
        {
          id: "1",
          type: "email",
          value: searchQuery.includes("@") ? searchQuery : `${searchQuery}@example.com`,
          source: "Database leak",
          date: "2023-05-15",
        },
        {
          id: "2",
          type: "phone",
          value: searchQuery.match(/\d+/) ? searchQuery : "+7 999 123 4567",
          source: "Public directory",
          date: "2023-06-22",
        },
      ]

      setSearchResults(mockResults)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleShareResults = async () => {
    if (searchResults.length === 0) return

    try {
      // Создаем текст для поста в Farcaster
      const resultText = `OSINT search results for "${searchQuery}": Found ${searchResults.length} matches.`

      // Отправляем результат обратно в Farcaster
      if (window.parent !== window) {
        window.parent.postMessage({ type: "createCast", cast: { text: resultText } }, "*")
      }
    } catch (error) {
      console.error("Error sharing results:", error)
    }
  }

  return (
    <div className="min-h-screen bg-[#121726] p-4">
      <div className="max-w-3xl mx-auto">
        <header className="mb-6">
          <div className="flex items-center gap-3 mb-2">
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
          <p className="text-gray-400 text-sm">
            The First OSINT Project on Web3 - Built on Monad Testnet (1 MON per request)
          </p>

          <div className="flex gap-2 mt-4">
            <Button
              variant={hasMetaMask ? "outline" : "default"}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {hasMetaMask ? "MetaMask Connected" : "Install MetaMask"}
            </Button>
            <Button variant="outline" className="bg-purple-600 hover:bg-purple-700 text-white">
              Notifications On
            </Button>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-6 bg-[#1a2235]">
            <TabsTrigger value="search" className="data-[state=active]:bg-purple-600">
              Search
            </TabsTrigger>
            <TabsTrigger value="farcaster" className="data-[state=active]:bg-purple-600">
              Farcaster
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-purple-600">
              History
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-purple-600">
              Payments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <Card className="bg-[#1a2235] border-none text-white p-6">
              <h2 className="text-xl font-semibold mb-2">Search Settings</h2>
              <p className="text-gray-400 text-sm mb-4">Configure database search parameters</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Results Language</label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="bg-[#121726] border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2235] border-gray-700">
                      <SelectItem value="Russian">Russian</SelectItem>
                      <SelectItem value="English">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Search Limit (100-10000)</label>
                  <Input
                    type="number"
                    value={searchLimit}
                    onChange={(e) => setSearchLimit(e.target.value)}
                    className="bg-[#121726] border-gray-700 text-white"
                    min="100"
                    max="10000"
                  />
                </div>
              </div>
            </Card>

            <Card className="bg-[#1a2235] border-none text-white p-6">
              <h2 className="text-xl font-semibold mb-2">Search Query</h2>
              <p className="text-gray-400 text-sm mb-4">Enter data to search. Cost: 1 MON token per request</p>

              <form onSubmit={handleSearch}>
                <div className="mb-4">
                  <label className="block text-sm text-white mb-1">What to search?</label>
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter email, name, phone number or other data to search..."
                    className="bg-[#121726] border-gray-700 text-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Examples: john.doe@email.com, +1 555 123 4567, John Smith
                  </p>
                </div>

                {!hasMetaMask && (
                  <Alert variant="destructive" className="mb-4 bg-red-900/50 border-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>MetaMask не найден. Пожалуйста, установите MetaMask расширение.</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={isLoading || !searchQuery.trim() || !hasMetaMask}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search Web (1 MON)
                    </>
                  )}
                </Button>
              </form>
            </Card>

            {searchResults.length > 0 && (
              <Card className="bg-[#1a2235] border-none text-white p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Search Results</h2>
                  <Button
                    variant="outline"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={handleShareResults}
                  >
                    Share to Farcaster
                  </Button>
                </div>

                <div className="space-y-4">
                  {searchResults.map((result) => (
                    <div key={result.id} className="border border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between">
                        <span className="text-purple-400">{result.type}</span>
                        <span className="text-gray-400 text-sm">{result.date}</span>
                      </div>
                      <div className="text-lg font-medium mt-1">{result.value}</div>
                      <div className="text-sm text-gray-400 mt-1">Source: {result.source}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="farcaster">
            <Card className="bg-[#1a2235] border-none text-white p-6">
              <h2 className="text-xl font-semibold mb-4">Farcaster Integration</h2>
              <p className="text-gray-400">Connect your Farcaster account to enhance OSINT capabilities.</p>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="bg-[#1a2235] border-none text-white p-6">
              <h2 className="text-xl font-semibold mb-4">Search History</h2>
              <p className="text-gray-400">Your previous searches will appear here.</p>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="bg-[#1a2235] border-none text-white p-6">
              <h2 className="text-xl font-semibold mb-4">MON Token Payments</h2>
              <p className="text-gray-400">Manage your MON tokens and payment history.</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
