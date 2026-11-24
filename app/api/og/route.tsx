import { ImageResponse } from "next/og";
import { SITE_URL } from "@/lib/seo/config";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title")?.slice(0, 48) ?? "Pau Pedrejon";
  const subtitle =
    searchParams.get("subtitle")?.slice(0, 72) ??
    "Full-Stack Developer & AI";

  const origin = new URL(request.url).origin;
  const logoCandidates = [`${origin}/LOGO_portfolio.png`, `${SITE_URL}/LOGO_portfolio.png`];
  let logoSrc: string | null = null;

  const toDataUri = (buf: ArrayBuffer) => {
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
    return `data:image/png;base64,${btoa(binary)}`;
  };

  for (const logoUrl of logoCandidates) {
    try {
      const logoRes = await fetch(logoUrl);
      if (!logoRes.ok) continue;
      logoSrc = toDataUri(await logoRes.arrayBuffer());
      break;
    } catch {
      // try next candidate
    }
  }

  const shortTitle =
    title.length > 28 && title.includes("—")
      ? title.split("—")[0]!.trim()
      : title.length > 36
        ? `${title.slice(0, 34)}…`
        : title;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#110508",
          color: "#f5eeed",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Atmosphere — Dark Cherry */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 70% 55% at 28% 42%, rgba(191,57,87,0.32) 0%, transparent 62%), radial-gradient(ellipse 55% 50% at 82% 18%, rgba(224,70,103,0.18) 0%, transparent 55%), linear-gradient(165deg, #1b0b0e 0%, #110508 48%, #0a0305 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(17,5,8,0.15) 0%, transparent 35%, rgba(17,5,8,0.65) 100%)",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: "56px 64px",
            gap: "48px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "22px",
              flex: 1,
              maxWidth: "640px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontSize: "20px",
                fontWeight: 600,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#e04667",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "999px",
                  background: "#e04667",
                  boxShadow: "0 0 18px rgba(224,70,103,0.85)",
                }}
              />
              paupedrejon.com
            </div>

            <div
              style={{
                fontSize: shortTitle.length > 22 ? "64px" : "76px",
                fontWeight: 700,
                lineHeight: 0.95,
                letterSpacing: "-0.045em",
                color: "#f5eeed",
              }}
            >
              {shortTitle}
            </div>

            <div
              style={{
                fontSize: "30px",
                fontWeight: 400,
                lineHeight: 1.3,
                color: "#cab9b9",
                maxWidth: "560px",
              }}
            >
              {subtitle}
            </div>

            <div
              style={{
                display: "flex",
                gap: "14px",
                marginTop: "8px",
                fontSize: "18px",
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#f58393",
              }}
            >
              <span>React</span>
              <span style={{ color: "#9b8688" }}>·</span>
              <span>Next.js</span>
              <span style={{ color: "#9b8688" }}>·</span>
              <span>IA</span>
              <span style={{ color: "#9b8688" }}>·</span>
              <span>Barcelona</span>
            </div>
          </div>

          {logoSrc ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "340px",
                height: "340px",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 50% 45%, rgba(191,57,87,0.35) 0%, transparent 68%)",
                boxShadow: "0 0 80px rgba(224,70,103,0.22)",
              }}
            >
              <img
                src={logoSrc}
                width={280}
                height={280}
                alt=""
                style={{
                  width: "280px",
                  height: "280px",
                  objectFit: "contain",
                }}
              />
            </div>
          ) : null}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
