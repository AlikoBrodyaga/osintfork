import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#121726",
        backgroundImage: "linear-gradient(45deg, #121726 0%, #1a2235 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            backgroundColor: "#7c3aed",
            padding: "16px",
            borderRadius: "12px",
            marginRight: "16px",
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
            <path d="M16 16h5v5"></path>
          </svg>
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: "bold",
            color: "white",
          }}
        >
          MonadOsintSearch
        </div>
      </div>
      <div
        style={{
          fontSize: 24,
          color: "rgba(255,255,255,0.8)",
          marginTop: 10,
          textAlign: "center",
        }}
      >
        The First OSINT Project on Web3 - Built on Monad Testnet
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  )
}
