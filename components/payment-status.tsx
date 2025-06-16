"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ExternalLink, CheckCircle, XCircle, Clock } from "lucide-react"

interface PaymentStatusProps {
  txHash: string
  onStatusChange?: (status: "pending" | "confirmed" | "failed") => void
}

export function PaymentStatus({ txHash, onStatusChange }: PaymentStatusProps) {
  const [status, setStatus] = useState<"pending" | "confirmed" | "failed">("pending")
  const [isChecking, setIsChecking] = useState(true)
  const [blockNumber, setBlockNumber] = useState<string | null>(null)
  const [gasUsed, setGasUsed] = useState<string | null>(null)
  const [confirmations, setConfirmations] = useState(0)

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    const checkTransactionStatus = async () => {
      try {
        if (typeof window.ethereum !== "undefined") {
          const receipt = await window.ethereum.request({
            method: "eth_getTransactionReceipt",
            params: [txHash],
          })

          if (receipt) {
            const newStatus = receipt.status === "0x1" ? "confirmed" : "failed"
            setStatus(newStatus)
            setBlockNumber(receipt.blockNumber)
            setGasUsed(receipt.gasUsed)
            setIsChecking(false)
            onStatusChange?.(newStatus)

            // Получаем текущий номер блока для расчёта подтверждений
            const currentBlock = await window.ethereum.request({
              method: "eth_blockNumber",
            })
            const confirmationCount = Number.parseInt(currentBlock, 16) - Number.parseInt(receipt.blockNumber, 16)
            setConfirmations(Math.max(0, confirmationCount))

            if (intervalId) {
              clearInterval(intervalId)
            }
          }
        }
      } catch (error) {
        console.error("Ошибка проверки статуса транзакции:", error)
        setStatus("failed")
        setIsChecking(false)
        onStatusChange?.("failed")

        if (intervalId) {
          clearInterval(intervalId)
        }
      }
    }

    // Проверяем сразу
    checkTransactionStatus()

    // Затем проверяем каждые 3 секунды, если ещё в ожидании
    if (status === "pending") {
      intervalId = setInterval(checkTransactionStatus, 3000)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [txHash, status, onStatusChange])

  const getStatusIcon = () => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case "pending":
        return "secondary"
      case "confirmed":
        return "default"
      case "failed":
        return "destructive"
    }
  }

  const getStatusText = () => {
    switch (status) {
      case "pending":
        return "В ожидании"
      case "confirmed":
        return "Подтверждён"
      case "failed":
        return "Неудачно"
    }
  }

  const openInExplorer = () => {
    window.open(`https://testnet-explorer.monad.xyz/tx/${txHash}`, "_blank")
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Статус оплаты
        </CardTitle>
        <CardDescription>
          Транзакция: {txHash.slice(0, 10)}...{txHash.slice(-8)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Статус:</span>
          <Badge variant={getStatusColor()} className="flex items-center gap-1">
            {isChecking && status === "pending" && <Loader2 className="h-3 w-3 animate-spin" />}
            {getStatusText()}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Сумма:</span>
          <span className="text-sm text-muted-foreground">1 MON</span>
        </div>

        {blockNumber && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Блок:</span>
            <span className="text-sm text-muted-foreground">{Number.parseInt(blockNumber, 16).toLocaleString()}</span>
          </div>
        )}

        {confirmations > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Подтверждения:</span>
            <span className="text-sm text-muted-foreground">{confirmations}</span>
          </div>
        )}

        {gasUsed && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Использовано газа:</span>
            <span className="text-sm text-muted-foreground">{Number.parseInt(gasUsed, 16).toLocaleString()}</span>
          </div>
        )}

        {status === "pending" && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Транзакция обрабатывается в сети Monad testnet. Это может занять несколько минут.
            </AlertDescription>
          </Alert>
        )}

        {status === "confirmed" && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Оплата подтверждена! Ваш поисковый запрос был успешно обработан.</AlertDescription>
          </Alert>
        )}

        {status === "failed" && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Транзакция не прошла. Пожалуйста, проверьте детали транзакции и попробуйте снова.
            </AlertDescription>
          </Alert>
        )}

        <Button onClick={openInExplorer} variant="outline" className="w-full">
          <ExternalLink className="mr-2 h-4 w-4" />
          Посмотреть в Monad Explorer
        </Button>
      </CardContent>
    </Card>
  )
}
