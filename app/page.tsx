"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Wallet, Search, History, AlertCircle, CheckCircle, Bell, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { FarcasterIntegration } from "@/components/farcaster-integration"

interface ApiResponse {
  List: Record<
    string,
    {
      InfoLeak: string
      Data: Record<string, any>[]
    }
  >
}

interface PaymentHistory {
  id: string
  timestamp: string
  amount: number
  txHash: string
  status: "pending" | "confirmed" | "failed"
}

interface RequestHistory {
  id: string
  timestamp: string
  query: string
  cost: number
  results: number
  status: "success" | "error"
  errorMessage?: string
}

export default function LeakSearchApp() {
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [balance, setBalance] = useState(0)
  const [query, setQuery] = useState("")
  const [limit, setLimit] = useState(100)
  const [language, setLanguage] = useState("ru")
  const [isLoading, setIsLoading] = useState(false)
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null)
  const [error, setError] = useState("")
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [requestHistory, setRequestHistory] = useState<RequestHistory[]>([])
  const [currentTxHash, setCurrentTxHash] = useState<string | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Проверяем наличие MetaMask только в браузере
    if (typeof window !== "undefined" && window.ethereum) {
      console.log("✅ MetaMask обнаружен")

      // Проверяем, был ли кошелёк уже подключен
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            console.log("🔗 Кошелёк уже подключен:", accounts[0])
            setWalletAddress(accounts[0])
            setIsConnected(true)
            checkBalance(accounts[0]).catch(console.error)
          }
        })
        .catch((error: any) => {
          console.log("⚠️ Ошибка проверки подключенных аккаунтов:", error)
        })
    } else if (typeof window !== "undefined") {
      setError("MetaMask не найден. Пожалуйста, установите MetaMask расширение.")
    }

    // Загружаем сохраненные данные из localStorage
    if (typeof window !== "undefined") {
      try {
        const savedHistory = localStorage.getItem("request_history")
        const savedPayments = localStorage.getItem("payment_history")
        const savedNotifications = localStorage.getItem("notifications_enabled")

        if (savedHistory) setRequestHistory(JSON.parse(savedHistory))
        if (savedPayments) setPaymentHistory(JSON.parse(savedPayments))
        if (savedNotifications !== null) setNotificationsEnabled(JSON.parse(savedNotifications))
      } catch (error) {
        console.error("Ошибка загрузки данных из localStorage:", error)
      }
    }
  }, [])

  const connectWallet = async () => {
    try {
      if (typeof window === "undefined") {
        throw new Error("Приложение должно работать в браузере")
      }

      if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask не найден. Пожалуйста, установите MetaMask для продолжения.")
      }

      console.log("🔗 Запрос подключения кошелька...")

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (!accounts || accounts.length === 0) {
        throw new Error("Не удалось получить аккаунты из MetaMask")
      }

      console.log("✅ Аккаунты получены:", accounts)

      // Переключаемся на Monad Testnet
      try {
        console.log("🔄 Переключение на Monad Testnet...")
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x279F" }], // Monad Testnet (10143)
        })
      } catch (switchError: any) {
        console.log("⚠️ Сеть не найдена, добавляем...")
        // Если сеть не существует, добавляем её
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
        } else {
          throw switchError
        }
      }

      setWalletAddress(accounts[0])
      setIsConnected(true)
      await checkBalance(accounts[0])

      console.log("🎉 Кошелёк успешно подключен!")

      toast({
        title: "Wallet Connected",
        description: "Successfully connected to Monad Testnet",
      })

      // Отправляем уведомление о подключении
      if (notificationsEnabled) {
        sendNotification({
          type: "connection",
          message: `Кошелёк подключен: ${accounts[0]}`,
          userAddress: accounts[0],
        })
      }
    } catch (error: any) {
      console.error("❌ Ошибка подключения кошелька:", error)
      const errorMessage = error.message || "Неизвестная ошибка подключения"
      setError(`Ошибка подключения кошелька: ${errorMessage}`)
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const checkBalance = async (address: string) => {
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("MetaMask не доступен")
      }

      // Получаем реальный баланс из Monad testnet
      const balance = await window.ethereum.request({
        method: "eth_getBalance",
        params: [address, "latest"],
      })

      // Конвертируем из wei в MON
      const balanceInMON = Number.parseInt(balance, 16) / Math.pow(10, 18)
      setBalance(Math.floor(balanceInMON * 100) / 100) // Округляем до 2 знаков
    } catch (error) {
      console.error("Ошибка проверки баланса:", error)
      // Резервный баланс для демонстрации
      setBalance(10)
    }
  }

  const sendNotification = async (data: {
    type: string
    message: string
    txHash?: string
    userAddress?: string
    errorDetails?: string
  }) => {
    if (!notificationsEnabled) return

    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log("Уведомление отправлено:", result)
    } catch (error) {
      console.warn("Ошибка отправки уведомления:", error)
    }
  }

  const processPayment = async (): Promise<boolean> => {
    if (balance < 1) {
      const errorMsg = "Недостаточно MON токенов. Необходимо минимум 1 MON токен для поиска."
      setError(errorMsg)

      if (notificationsEnabled) {
        sendNotification({
          type: "error",
          message: `Ошибка оплаты: Недостаточно средств (${balance} MON). Пользователь: ${walletAddress}`,
          userAddress: walletAddress,
        })
      }
      return false
    }

    try {
      setIsLoading(true)

      // Отправляем транзакцию на Monad testnet (1 MON)
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: walletAddress,
            to: "0x35e4fb9cd12a9a76cdc2496003008cee8f5fc000", // Новый адрес кошелька
            value: "0xDE0B6B3A7640000", // 1 MON в wei (1 * 10^18)
            gas: "0x5208", // 21000 лимит газа
          },
        ],
      })

      setCurrentTxHash(txHash)

      const payment: PaymentHistory = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        amount: 1,
        txHash,
        status: "pending",
      }

      const updatedPayments = [...paymentHistory, payment]
      setPaymentHistory(updatedPayments)
      localStorage.setItem("payment_history", JSON.stringify(updatedPayments))

      // Отправляем уведомление об оплате
      if (notificationsEnabled) {
        sendNotification({
          type: "payment",
          message: `Оплата инициирована: 1 MON токен отправлен за поиск`,
          txHash,
          userAddress: walletAddress,
        })
      }

      // Ждём подтверждения транзакции
      await waitForTransactionConfirmation(txHash)

      // Обновляем статус оплаты на подтверждённый
      const confirmedPayments = updatedPayments.map((p) =>
        p.txHash === txHash ? { ...p, status: "confirmed" as const } : p,
      )
      setPaymentHistory(confirmedPayments)
      localStorage.setItem("payment_history", JSON.stringify(confirmedPayments))

      setBalance((prev) => Math.max(0, prev - 1))

      toast({
        title: "Оплата подтверждена",
        description: `Успешно оплачен 1 MON токен. TX: ${txHash.slice(0, 10)}...`,
      })

      // Отправляем уведомление о подтверждении
      if (notificationsEnabled) {
        sendNotification({
          type: "payment_confirmed",
          message: `Оплата подтверждена: 1 MON токен успешно переведён`,
          txHash,
          userAddress: walletAddress,
        })
      }

      return true
    } catch (error: any) {
      const errorMsg = `Ошибка оплаты: ${error.message}`
      setError(errorMsg)

      // Отправляем уведомление об ошибке
      if (notificationsEnabled) {
        sendNotification({
          type: "error",
          message: `Ошибка оплаты: ${error.message}. Пользователь: ${walletAddress}`,
          userAddress: walletAddress,
          errorDetails: error.stack,
        })
      }

      // Обновляем статус оплаты на неудачный
      const failedPayments = paymentHistory.map((p) =>
        p.status === "pending" ? { ...p, status: "failed" as const } : p,
      )
      setPaymentHistory(failedPayments)
      localStorage.setItem("payment_history", JSON.stringify(failedPayments))

      return false
    } finally {
      setIsLoading(false)
    }
  }

  const waitForTransactionConfirmation = async (txHash: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      let attempts = 0
      const maxAttempts = 30 // Таймаут 1 минута

      const checkTransaction = async () => {
        try {
          attempts++

          const receipt = await window.ethereum.request({
            method: "eth_getTransactionReceipt",
            params: [txHash],
          })

          if (receipt) {
            if (receipt.status === "0x1") {
              resolve()
            } else {
              reject(new Error("Транзакция не прошла в блокчейне"))
            }
          } else if (attempts >= maxAttempts) {
            reject(new Error("Таймаут подтверждения транзакции"))
          } else {
            // Транзакция ещё в ожидании, проверяем снова через 2 секунды
            setTimeout(checkTransaction, 2000)
          }
        } catch (error) {
          reject(error)
        }
      }

      checkTransaction()
    })
  }

  const makeSearch = async () => {
    if (!query.trim()) {
      setError("Пожалуйста, введите поисковый запрос")
      return
    }

    if (!isConnected) {
      setError("Пожалуйста, сначала подключите кошелёк")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      // Сначала обрабатываем оплату
      const paymentSuccess = await processPayment()
      if (!paymentSuccess) {
        return
      }

      // Делаем запрос к API
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request: query,
          limit,
          lang: language,
          userAddress: walletAddress,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Ошибка поиска")
      }

      setApiResponse(data)
      console.log("🔍 Полученные результаты:", data)
      console.log("📊 Количество баз данных:", Object.keys(data.List || {}).length)

      // Выводим детальную информацию о каждой базе
      Object.entries(data.List || {}).forEach(([dbName, dbData]) => {
        console.log(`📁 База: ${dbName}`)
        console.log(`📝 Описание: ${dbData.InfoLeak}`)
        console.log(`📋 Количество записей: ${dbData.Data?.length || 0}`)
        if (dbData.Data && dbData.Data.length > 0) {
          console.log(`📄 Первая запись:`, dbData.Data[0])
        }
      })

      // Сохраняем успешный запрос в историю
      const request: RequestHistory = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        query,
        cost: 1,
        results: Object.keys(data.List || {}).length,
        status: "success",
      }

      const updatedRequests = [...requestHistory, request]
      setRequestHistory(updatedRequests)
      localStorage.setItem("request_history", JSON.stringify(updatedRequests))

      toast({
        title: "Поиск завершён",
        description: `Найдены результаты в ${Object.keys(data.List || {}).length} базах данных`,
      })

      // Отправляем уведомление об успехе
      if (notificationsEnabled) {
        sendNotification({
          type: "api_success",
          message: `Поиск успешен: Найдено ${Object.keys(data.List || {}).length} результатов в базах данных для запроса: "${query}"`,
          userAddress: walletAddress,
        })
      }
    } catch (error: any) {
      const errorMsg = error.message
      setError(errorMsg)

      // Сохраняем неудачный запрос в историю
      const request: RequestHistory = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        query,
        cost: 1,
        results: 0,
        status: "error",
        errorMessage: errorMsg,
      }

      const updatedRequests = [...requestHistory, request]
      setRequestHistory(updatedRequests)
      localStorage.setItem("request_history", JSON.stringify(updatedRequests))

      toast({
        title: "Ошибка поиска",
        description: errorMsg,
        variant: "destructive",
      })

      // Отправляем уведомление об ошибке
      if (notificationsEnabled) {
        sendNotification({
          type: "api_error",
          message: `Ошибка поиска: ${errorMsg}. Запрос: "${query}". Пользователь: ${walletAddress}`,
          userAddress: walletAddress,
          errorDetails: error.stack,
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const toggleNotifications = () => {
    const newState = !notificationsEnabled
    setNotificationsEnabled(newState)

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("notifications_enabled", JSON.stringify(newState))
      } catch (error) {
        console.error("Ошибка сохранения настроек уведомлений:", error)
      }
    }

    toast({
      title: newState ? "Уведомления включены" : "Уведомления отключены",
      description: newState ? "Вы будете получать уведомления в Telegram" : "Уведомления в Telegram отключены",
    })
  }

  // Получаем данные для Farcaster интеграции
  const getSearchResultsCount = () => {
    return apiResponse ? Object.keys(apiResponse.List).length : 0
  }

  return (
    <div className="min-h-screen text-white font-mono p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Заголовок */}
        <Card className="bg-gray-900 border-purple-500 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white font-bold text-2xl glow-text">
              <Shield className="h-8 w-8 text-purple-400" />
              MonadOsintSearch
            </CardTitle>
            <CardDescription className="text-gray-300 text-lg mt-2">
              🕷️ The First OSINT Project on Web3 - Built on Monad Testnet (1 MON per request)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {!isConnected ? (
                  typeof window !== "undefined" && typeof window.ethereum === "undefined" ? (
                    <Button
                      onClick={() => window.open("https://metamask.io/download/", "_blank")}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                    >
                      <Wallet className="h-4 w-4 mr-2" />
                      Install MetaMask
                    </Button>
                  ) : (
                    <Button
                      onClick={connectWallet}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                    >
                      <Wallet className="h-4 w-4 mr-2" />
                      Connect Wallet
                    </Button>
                  )
                ) : (
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="border-purple-500 text-purple-300 flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      Connected
                    </Badge>
                    <span className="text-sm text-gray-400">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </span>
                  </div>
                )}
                <Button
                  onClick={toggleNotifications}
                  variant="outline"
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                >
                  <Bell className={`h-4 w-4 ${notificationsEnabled ? "text-green-500" : "text-gray-400"}`} />
                  {notificationsEnabled ? "Notifications On" : "Notifications Off"}
                </Button>
              </div>
              {isConnected && (
                <Badge className="bg-purple-600 text-white text-lg px-3 py-1">{balance.toFixed(2)} MON</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="search" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-purple-500">
            <TabsTrigger value="search" className="text-white data-[state=active]:bg-purple-600">
              Search
            </TabsTrigger>
            <TabsTrigger value="farcaster" className="text-white data-[state=active]:bg-purple-600">
              Farcaster
            </TabsTrigger>
            <TabsTrigger value="history" className="text-white data-[state=active]:bg-purple-600">
              History
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-white data-[state=active]:bg-purple-600">
              Payments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            {/* Настройки поиска */}
            <Card className="bg-gray-900 border-purple-500 shadow-xl">
              <CardHeader>
                <CardTitle className="text-purple-300">Search Settings</CardTitle>
                <CardDescription className="text-gray-400">Configure database search parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language" className="text-white">
                      Results Language
                    </Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="bg-gray-800 border-purple-500 text-white placeholder-gray-400 focus:border-purple-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-purple-500 text-white">
                        <SelectItem value="ru">Russian</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="limit" className="text-white">
                      Search Limit (100-10000)
                    </Label>
                    <Input
                      id="limit"
                      type="number"
                      min="100"
                      max="10000"
                      value={limit}
                      onChange={(e) => setLimit(Number.parseInt(e.target.value) || 100)}
                      className="bg-gray-800 border-purple-500 text-white placeholder-gray-400 focus:border-purple-400"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Интерфейс поиска */}
            <Card className="bg-gray-900 border-purple-500 shadow-xl">
              <CardHeader>
                <CardTitle className="text-purple-300">Search Query</CardTitle>
                <CardDescription className="text-gray-400">
                  Enter data to search. Cost: 1 MON token per request
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="query" className="text-white">
                    What to search?
                  </Label>
                  <Textarea
                    id="query"
                    placeholder="Enter email, name, phone number or other data to search..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    rows={3}
                    className="bg-gray-800 border-purple-500 text-white placeholder-gray-400 focus:border-purple-400"
                  />
                  <p className="text-xs text-gray-400">Examples: john.doe@email.com, +1 555 123 4567, John Smith</p>
                </div>

                {error && (
                  <Alert variant="destructive" className="bg-red-900 border-red-700 text-red-100">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={makeSearch}
                  disabled={isLoading || !isConnected}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing payment and searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      🕷️ Search Web (1 MON)
                    </>
                  )}
                </Button>
                {apiResponse && (
                  <Button
                    onClick={() => {
                      console.log("📊 Текущие результаты:", apiResponse)
                      alert(
                        `Найдено результатов в ${Object.keys(apiResponse.List).length} базах данных. Смотрите консоль браузера (F12) для подробностей.`,
                      )
                    }}
                    variant="outline"
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 w-full mt-2 border-purple-500"
                  >
                    📋 Show results in console
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Статус оплаты */}
            {currentTxHash && (
              <Card className="bg-gray-900 border-purple-500 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-300">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                    Payment Processing
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Transaction: {currentTxHash.slice(0, 10)}...{currentTxHash.slice(-8)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="bg-purple-900 border-purple-700">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-purple-100">
                      Your payment is being processed on the Monad testnet. This may take a few minutes.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* Результаты */}
            {apiResponse && (
              <Card className="bg-gray-900 border-purple-500 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-purple-300">Search Results</CardTitle>
                  <CardDescription className="text-gray-400">
                    Data found in {Object.keys(apiResponse.List).length} database(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(apiResponse.List).map(([dbName, dbData]) => (
                      <Card
                        key={dbName}
                        className="bg-gray-900 border-purple-500 shadow-xl border-l-4 border-l-purple-500"
                      >
                        <CardHeader>
                          <CardTitle className="text-lg text-purple-300">{dbName}</CardTitle>
                          <CardDescription className="text-gray-400">{dbData.InfoLeak}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {dbData.Data && dbData.Data.length > 0 ? (
                            <div className="space-y-2">
                              {dbData.Data.slice(0, 5).map((item, index) => (
                                <div key={index} className="p-3 bg-gray-800 rounded-lg border border-purple-600">
                                  {Object.entries(item).map(([key, value]) => (
                                    <div key={key} className="flex justify-between">
                                      <span className="font-medium text-purple-300">{key}:</span>
                                      <span className="text-gray-300">{String(value)}</span>
                                    </div>
                                  ))}
                                </div>
                              ))}
                              {dbData.Data.length > 5 && (
                                <p className="text-sm text-gray-400">... и ещё {dbData.Data.length - 5} результатов</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-gray-400">No data found in this database</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="farcaster">
            <FarcasterIntegration
              searchQuery={query}
              searchResults={getSearchResultsCount()}
              txHash={currentTxHash || undefined}
            />
          </TabsContent>

          <TabsContent value="history">
            <Card className="bg-gray-900 border-purple-500 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-300">
                  <History className="h-5 w-5" />
                  Request History
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Просмотр ваших предыдущих поисковых запросов
                </CardDescription>
              </CardHeader>
              <CardContent>
                {requestHistory.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No requests made yet</p>
                ) : (
                  <div className="space-y-3">
                    {requestHistory
                      .slice()
                      .reverse()
                      .map((request) => (
                        <div
                          key={request.id}
                          className="flex items-center justify-between p-3 border border-purple-600 rounded-lg bg-gray-800"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-white">{request.query}</p>
                            <p className="text-sm text-gray-400">
                              {new Date(request.timestamp).toLocaleString("ru-RU")}
                            </p>
                            {request.errorMessage && (
                              <p className="text-xs text-red-500 mt-1">{request.errorMessage}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              className="bg-purple-600 text-white"
                              variant={request.status === "success" ? "default" : "destructive"}
                            >
                              {request.results} results
                            </Badge>
                            <Badge variant="outline" className="border-purple-500 text-purple-300">
                              {request.cost} MON
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="bg-gray-900 border-purple-500 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-300">
                  <Wallet className="h-5 w-5" />
                  Payment History
                </CardTitle>
                <CardDescription className="text-gray-400">Просмотр ваших блокчейн транзакций</CardDescription>
              </CardHeader>
              <CardContent>
                {paymentHistory.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No payments made yet</p>
                ) : (
                  <div className="space-y-3">
                    {paymentHistory
                      .slice()
                      .reverse()
                      .map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-3 border border-purple-600 rounded-lg bg-gray-800"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-white">{payment.amount} MON</p>
                            <p className="text-sm text-gray-400">
                              {new Date(payment.timestamp).toLocaleString("ru-RU")}
                            </p>
                            <p className="text-xs text-gray-400 font-mono">{payment.txHash}</p>
                          </div>
                          <Badge
                            className="bg-purple-600 text-white"
                            variant={
                              payment.status === "confirmed"
                                ? "default"
                                : payment.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {payment.status === "confirmed"
                              ? "confirmed"
                              : payment.status === "pending"
                                ? "pending"
                                : "failed"}
                          </Badge>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
