import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("🔔 Farcaster webhook received:", body)

    // Здесь можно обрабатывать события от Farcaster
    // Например, когда пользователь открывает Mini App

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
    })
  } catch (error: any) {
    console.error("❌ Farcaster webhook error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Webhook processing failed",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Farcaster webhook endpoint is active",
    timestamp: new Date().toISOString(),
  })
}
