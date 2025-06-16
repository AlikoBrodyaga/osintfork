import { type NextRequest, NextResponse } from "next/server"

// JWT токен для уведомлений
const NOTIFICATION_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkX2F0IjoxNzUwMDQ4NDA3LCJhcHBfaWQiOjE3NTAwNDg0MDd9._XmzTDsnTL32ZdatPXnD9fYtwraB0P8S1bj3ragHKXk"

interface NotificationData {
  type: string
  message: string
  txHash?: string
  userAddress?: string
  errorDetails?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: NotificationData = await request.json()
    const { type, message, txHash, userAddress, errorDetails } = body

    let formattedMessage = ""
    let emoji = ""

    switch (type) {
      case "connection":
        emoji = "🔗"
        formattedMessage = `${emoji} **Кошелёк подключен**\n\n${message}\n\n**Время:** ${new Date().toLocaleString("ru-RU")}`
        break

      case "payment":
        emoji = "💳"
        formattedMessage = `${emoji} **Оплата инициирована**\n\n${message}\n\n**Хэш транзакции:** \`${txHash}\`\n**Пользователь:** \`${userAddress}\`\n**Время:** ${new Date().toLocaleString("ru-RU")}`
        break

      case "payment_confirmed":
        emoji = "✅"
        formattedMessage = `${emoji} **Оплата подтверждена**\n\n${message}\n\n**Хэш транзакции:** \`${txHash}\`\n**Пользователь:** \`${userAddress}\`\n**Время:** ${new Date().toLocaleString("ru-RU")}`
        break

      case "api_success":
        emoji = "🔍"
        formattedMessage = `${emoji} **Поиск успешен**\n\n${message}\n\n**Пользователь:** \`${userAddress}\`\n**Время:** ${new Date().toLocaleString("ru-RU")}`
        break

      case "api_error":
        emoji = "❌"
        formattedMessage = `${emoji} **Ошибка поиска**\n\n${message}\n\n**Время:** ${new Date().toLocaleString("ru-RU")}`
        if (errorDetails) {
          formattedMessage += `\n\n**Детали ошибки:** \`${errorDetails.slice(0, 200)}...\``
        }
        break

      case "error":
        emoji = "⚠️"
        formattedMessage = `${emoji} **Системная ошибка**\n\n${message}\n\n**Время:** ${new Date().toLocaleString("ru-RU")}`
        if (errorDetails) {
          formattedMessage += `\n\n**Детали ошибки:** \`${errorDetails.slice(0, 200)}...\``
        }
        break

      default:
        emoji = "ℹ️"
        formattedMessage = `${emoji} **Уведомление**\n\n${message}\n\n**Время:** ${new Date().toLocaleString("ru-RU")}`
    }

    // Создаём полезную нагрузку для уведомления
    const notificationPayload = {
      token: NOTIFICATION_TOKEN,
      message: formattedMessage,
      type,
      metadata: {
        txHash,
        userAddress,
        timestamp: new Date().toISOString(),
      },
    }

    // Логируем уведомление
    console.log("📱 Уведомление:", notificationPayload)

    // Имитируем отправку в сервис уведомлений
    try {
      // Здесь был бы реальный эндпоинт вашего сервиса уведомлений
      // const response = await fetch('https://your-notification-service.com/webhook', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${NOTIFICATION_TOKEN}`
      //   },
      //   body: JSON.stringify(notificationPayload)
      // })

      // Пока имитируем успешный ответ
      const simulatedResponse = {
        success: true,
        messageId: `msg_${Date.now()}`,
        timestamp: new Date().toISOString(),
      }

      return NextResponse.json({
        success: true,
        message: "Уведомление отправлено успешно",
        response: simulatedResponse,
      })
    } catch (webhookError: any) {
      console.error("Ошибка отправки уведомления:", webhookError)

      return NextResponse.json({
        success: false,
        message: "Основное уведомление не удалось, пытаемся резервный способ",
        error: webhookError.message,
      })
    }
  } catch (error: any) {
    console.error("Ошибка обработки уведомления:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Не удалось обработать уведомление",
      },
      { status: 500 },
    )
  }
}
