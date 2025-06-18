"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wifi, WifiOff, AlertTriangle, Activity } from "lucide-react"

export function NetworkStatus() {
  const [isConnected, setIsConnected] = useState(false)
  const [chainId, setChainId] = useState<string | null>(null)
  const [blockNumber, setBlockNumber] = useState<string | null>(null)
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false)
  const [gasPrice, setGasPrice] = useState<string | null>(null)

  useEffect(() => {
    const checkNetworkStatus = async () => {
      try {
        if (typeof window.ethereum !== "undefined") {
          const currentChainId = await window.ethereum.request({
            method: "eth_chainId",
          })

          const currentBlockNumber = await window.ethereum.request({
            method: "eth_blockNumber",
          })

          const currentGasPrice = await window.ethereum.request({
            method: "eth_gasPrice",
          })

          setChainId(currentChainId)
          setBlockNumber(currentBlockNumber)
          setGasPrice(currentGasPrice)
          setIsConnected(true)
          setIsCorrectNetwork(currentChainId === "0x279F") // Monad Testnet
        } else {
          setIsConnected(false)
        }
      } catch (error) {
        console.error("Ошибка проверки статуса сети:", error)
        setIsConnected(false)
      }
    }

    checkNetworkStatus()

    // Слушаем изменения сети
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("chainChanged", (newChainId: string) => {
        setChainId(newChainId)
        setIsCorrectNetwork(newChainId === "0x279F")
      })

      // Проверяем номер блока каждые 15 секунд
      const interval = setInterval(checkNetworkStatus, 15000)

      return () => {
        clearInterval(interval)
        window.ethereum.removeListener("chainChanged", () => {})
      }
    }
  }, [])

  const getNetworkName = (chainId: string) => {
    switch (chainId) {
      case "0x279F":
        return "Monad Testnet"
      case "0x1":
        return "Ethereum Mainnet"
      case "0x89":
        return "Polygon"
      case "0xA":
        return "Optimism"
      case "0xA4B1":
        return "Arbitrum"
      default:
        return `Неизвестная сеть (${Number.parseInt(chainId, 16)})`
    }
  }

  const formatGasPrice = (gasPriceHex: string) => {
    const gasPriceWei = Number.parseInt(gasPriceHex, 16)
    const gasPriceGwei = gasPriceWei / 1e9
    return gasPriceGwei.toFixed(2)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isConnected ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-red-500" />}
          Network Status
        </CardTitle>
        <CardDescription>Информация о текущем подключении к блокчейну</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Подключение:</span>
          <Badge variant={isConnected ? "default" : "destructive"}>{isConnected ? "Подключено" : "Отключено"}</Badge>
        </div>

        {chainId && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Сеть:</span>
            <Badge variant={isCorrectNetwork ? "default" : "secondary"}>{getNetworkName(chainId)}</Badge>
          </div>
        )}

        {blockNumber && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Последний блок:</span>
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3 text-green-500" />
              <span className="text-sm text-muted-foreground">
                #{Number.parseInt(blockNumber, 16).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {gasPrice && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Цена газа:</span>
            <span className="text-sm text-muted-foreground">{formatGasPrice(gasPrice)} Gwei</span>
          </div>
        )}

        {isConnected && !isCorrectNetwork && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Пожалуйста, переключитесь на Monad Testnet для использования приложения. Требуется Monad Testnet (Chain
              ID: 10143).
            </AlertDescription>
          </Alert>
        )}

        {!isConnected && (
          <Alert>
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              Подключение к кошельку не обнаружено. Пожалуйста, подключите ваш MetaMask кошелёк для продолжения.
            </AlertDescription>
          </Alert>
        )}

        {isConnected && isCorrectNetwork && (
          <Alert>
            <Activity className="h-4 w-4" />
            <AlertDescription>
              Подключено к Monad Testnet. Готово к обработке платежей и поисковых запросов.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
