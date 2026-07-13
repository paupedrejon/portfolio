import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title")?.slice(0, 80) ?? "Pau Pedrejon";
  const subtitle =
    searchParams.get("subtitle")?.slice(0, 120) ??
    "Full-Stack Developer & AI Engineer";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(53,140,159,0.35) 0%, transparent 70%), linear-gradient(160deg, #0a0f14 0%, #111827 45%, #0d1a22 100%)",
          color: "#f0f4f8",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "22px",
            color: "rgba(148, 210, 220, 0.9)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#4eb3c8",
              boxShadow: "0 0 16px #4eb3c8",
            }}
          />
          paupedrejon.com
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              fontSize: title.length > 40 ? "52px" : "64px",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              textShadow: "0 0 40px rgba(78,179,200,0.4)",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 400,
              color: "rgba(200, 220, 230, 0.85)",
              maxWidth: "900px",
              lineHeight: 1.35,
            }}
          >
            {subtitle}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "16px",
            fontSize: "20px",
            color: "rgba(120, 180, 195, 0.8)",
          }}
        >
          <span>React</span>
          <span>·</span>
          <span>Next.js</span>
          <span>·</span>
          <span>TypeScript</span>
          <span>·</span>
          <span>AI</span>
          <span>·</span>
          <span>Barcelona</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
