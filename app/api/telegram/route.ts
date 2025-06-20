import { type NextRequest, NextResponse } from "next/server"

// Use environment variable for bot token with fallback
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

// Use environment variable for chat ID
const NOTIFICATION_CHAT_ID = process.env.TELEGRAM_CHAT_ID || process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID

interface TelegramNotification {
  type: string
  message: string
  txHash?: string
  userAddress?: string
}

export async function POST(request: NextRequest) {
  try {
    // Validate bot token format
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_BOT_TOKEN.includes(":")) {
      console.error("Invalid Telegram bot token format")
      return NextResponse.json(
        {
          success: false,
          error: "Invalid bot token configuration",
        },
        { status: 500 },
      )
    }

    // Validate chat ID
    if (!NOTIFICATION_CHAT_ID) {
      console.error("Telegram chat ID not configured")
      return NextResponse.json(
        {
          success: false,
          error: "Chat ID not configured",
        },
        { status: 500 },
      )
    }

    const body: TelegramNotification = await request.json()
    const { type, message, txHash, userAddress } = body

    let formattedMessage = ""
    let emoji = ""

    switch (type) {
      case "payment":
        emoji = "💳"
        formattedMessage = `${emoji} *Payment Initiated*\n\n${message}\n\n*Transaction Hash:* \`${txHash}\`\n*User:* \`${userAddress}\`\n*Time:* ${new Date().toLocaleString()}`
        break

      case "payment_confirmed":
        emoji = "✅"
        formattedMessage = `${emoji} *Payment Confirmed*\n\n${message}\n\n*Transaction Hash:* \`${txHash}\`\n*User:* \`${userAddress}\`\n*Time:* ${new Date().toLocaleString()}`
        break

      case "api_success":
        emoji = "🔍"
        formattedMessage = `${emoji} *API Request Successful*\n\n${message}\n\n*User:* \`${userAddress}\`\n*Time:* ${new Date().toLocaleString()}`
        break

      case "api_error":
        emoji = "❌"
        formattedMessage = `${emoji} *API Request Failed*\n\n${message}\n\n*Time:* ${new Date().toLocaleString()}`
        break

      case "error":
        emoji = "⚠️"
        formattedMessage = `${emoji} *System Error*\n\n${message}\n\n*Time:* ${new Date().toLocaleString()}`
        break

      default:
        emoji = "ℹ️"
        formattedMessage = `${emoji} *Notification*\n\n${message}\n\n*Time:* ${new Date().toLocaleString()}`
    }

    // First, test the bot token by getting bot info
    const botInfoResponse = await fetch(`${TELEGRAM_API_URL}/getMe`)

    if (!botInfoResponse.ok) {
      const botError = await botInfoResponse.json()
      console.error("Bot token validation failed:", botError)
      throw new Error(`Invalid bot token: ${botError.description || "Unknown error"}`)
    }

    // Send message to Telegram
    const telegramResponse = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: NOTIFICATION_CHAT_ID,
        text: formattedMessage,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    })

    const responseData = await telegramResponse.json()

    if (!telegramResponse.ok) {
      console.error("Telegram API Error:", responseData)

      // Provide specific error messages
      let errorMessage = "Unknown Telegram API error"
      if (responseData.error_code === 401) {
        errorMessage = "Bot token is invalid or unauthorized"
      } else if (responseData.error_code === 400) {
        errorMessage = `Bad request: ${responseData.description}`
      } else if (responseData.error_code === 403) {
        errorMessage = "Bot doesn't have permission to send messages to this chat"
      }

      throw new Error(errorMessage)
    }

    return NextResponse.json({
      success: true,
      message: "Notification sent successfully",
      telegramResponse: responseData,
    })
  } catch (error: any) {
    console.error("Telegram notification error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to send Telegram notification",
        details: error.stack,
      },
      { status: 500 },
    )
  }
}
