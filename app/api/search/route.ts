import { type NextRequest, NextResponse } from "next/server"

// Встроенный API токен - пользователи его не видят
const API_TOKEN = "5592031950:NxR1cNdr"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { request: query, limit = 100, lang = "ru", userAddress } = body

    if (!query) {
      return NextResponse.json({ error: "Поисковый запрос обязателен" }, { status: 400 })
    }

    // Логируем запрос для мониторинга
    console.log(`🔍 Поисковый запрос от ${userAddress}: "${query}" (лимит: ${limit}, язык: ${lang})`)

    // Делаем запрос к LeakOsint API с нашим встроенным токеном
    const apiResponse = await fetch("https://leakosintapi.com/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: API_TOKEN,
        request: query,
        limit,
        lang,
        type: "json",
      }),
    })

    if (!apiResponse.ok) {
      const errorMessage = `LeakOsint API вернул статус ${apiResponse.status}`
      console.error(`❌ Ошибка API: ${errorMessage}`)
      throw new Error(errorMessage)
    }

    const data = await apiResponse.json()

    // Проверяем на ошибки в ответе API
    if (data["Error code"]) {
      const errorMessage = `Ошибка LeakOsint API: ${data["Error code"]}`
      console.error(`❌ Ошибка в ответе API: ${errorMessage}`)
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    // Логируем успешный ответ
    const resultCount = Object.keys(data.List || {}).length
    console.log(`✅ Поиск успешен: Найдено ${resultCount} результатов в базах данных для пользователя ${userAddress}`)

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Ошибка поиска:", error)

    return NextResponse.json(
      {
        error: error.message || "Внутренняя ошибка сервера",
        details: "Не удалось выполнить поисковый запрос",
      },
      { status: 500 },
    )
  }
}
