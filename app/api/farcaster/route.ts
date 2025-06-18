import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const fid = url.searchParams.get("fid")

    if (!fid) {
      return NextResponse.json({ error: "FID is required" }, { status: 400 })
    }

    // В реальном приложении здесь будет запрос к Farcaster Hub API
    // для получения данных пользователя

    // Имитация данных пользователя
    const userData = {
      fid: Number.parseInt(fid),
      username: `user_${fid}`,
      displayName: `Farcaster User ${fid}`,
      pfpUrl: null,
      followerCount: 42,
      followingCount: 123,
    }

    return NextResponse.json({
      success: true,
      user: userData,
    })
  } catch (error) {
    console.error("Farcaster API error:", error)
    return NextResponse.json({ error: "Failed to fetch Farcaster data" }, { status: 500 })
  }
}
