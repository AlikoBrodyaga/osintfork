export default function Loading() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#18182a"
    }}>
      <img src="/placeholder-logo.png" alt="Loading..." width={100} height={100} />
      {/* Можно добавить спиннер или анимацию */}
    </div>
  )
}
