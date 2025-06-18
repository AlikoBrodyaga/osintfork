import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, request: query, limit = 100, lang = "en", userAddress } = body

    if (!token) {
      return NextResponse.json({ error: "API token is required" }, { status: 400 })
    }

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    // Log the API request for monitoring
    console.log(`🔍 API Request from ${userAddress}: "${query}" (limit: ${limit}, lang: ${lang})`)

    // Make request to LeakOsint API
    const apiResponse = await fetch("https://leakosintapi.com/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        request: query,
        limit,
        lang,
        type: "json",
      }),
    })

    if (!apiResponse.ok) {
      const errorMessage = `LeakOsint API returned status ${apiResponse.status}`
      console.error(`❌ API Error: ${errorMessage}`)
      throw new Error(errorMessage)
    }

    const data = await apiResponse.json()

    // Check for API errors in response
    if (data["Error code"]) {
      const errorMessage = `LeakOsint API Error: ${data["Error code"]}`
      console.error(`❌ API Response Error: ${errorMessage}`)
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    // Log successful response
    const resultCount = Object.keys(data.List || {}).length
    console.log(`✅ API Success: Found ${resultCount} database results for user ${userAddress}`)

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("LeakOsint API Error:", error)

    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        details: "Failed to process API request",
      },
      { status: 500 },
    )
  }
}
