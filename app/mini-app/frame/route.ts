import { NextResponse } from "next/server";

export async function POST() {
  const query = "elontrumpk@gmail.com"; // или любой дефолтный пример
  const token = process.env.LEAKOSINT_API_KEY; // или вставь напрямую строкой
  const limit = 5;
  const lang = "en";

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
  });

  const data = await apiResponse.json();

  if (data["Error code"]) {
    return NextResponse.json({
      image: "https://monad-osint.vercel.app/error.png",
      buttons: [{ label: "Search again" }],
    });
  }

  // Тут можно отрендерить изображение с результатом или заготовить разные
  return NextResponse.json({
    image: "https://monad-osint.vercel.app/result.png",
    post_url: "https://monad-osint.vercel.app/api/frame",
    buttons: [
      { label: "Search more" },
      { label: "Move to site" },
    ],
  });
}
