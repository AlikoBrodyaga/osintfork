const farcasterConfig = {
  accountAssociation: {
    header: "eyJmaWQiOjEwOTk3MzcsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgxYzY1QTY4MEM5NDBkNTE5NDExQjUwNzRFMjYxYkVlNDkxNmQ3NDgwIn0",
    payload: "eyJkb21haW4iOiJtb25hZC1vc2ludC52ZXJjZWwuYXBwIn0",
    signature: "MHhhMjQ0YzFjZWExZThkNzU4NjQ1MGIwY2ZkZjE3ZDI1ZWE2OThmN2I1NjZkZjI3YmJkOGNiZjhjMjZmZWM2MjZkMWFIMDVlYzkzYjg0MGNmY2QwMjVhN2Y5NDFjODAzYmE2ZmJkNjQwMDFmOTg0YWIyZmVkNjQwZTBlYjJlM2QwZjFj"
  },
  frame: {
    version: "1",
    name: "MonadOsintSearch Mini App",
    iconUrl: "https://monad-osint.vercel.app/icon.png",
    homeUrl: "https://monad-osint.vercel.app/mini-app",
    imageUrl: "https://monad-osint.vercel.app/mini-app-preview.png",
    buttonTitle: "Open OSINT Search",
    splashImageUrl: "https://monad-osint.vercel.app/splash.png",
    splashBackgroundColor: "#1a1a2e",
    webhookUrl: "https://monad-osint.vercel.app/api/farcaster-webhook"
  }
};

import { NextResponse } from "next/server";

export async function POST() {
  const query = "jhondeep@gmail.com"; // или любой дефолтный пример
  const token = process.env.LEAKOSINT_API_KEY;
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
      buttons: [{ label: "Попробовать ещё раз" }],
    });
  }

  // Тут можно отрендерить изображение с результатом или заготовить разные
  return NextResponse.json({
    image: "https://monad-osint.vercel.app/result.png",
    post_url: "https://monad-osint.vercel.app/api/frame",
    buttons: [
      { label: "more search" },
      { label: "site" },
    ],
  });
}
