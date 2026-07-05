import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPO = "paupedrejon/portfolio";
const TAG = "tealcode-v0.1.0";

type GhAsset = { name: string; browser_download_url: string };

export async function GET() {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/releases/tags/${TAG}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "portfolio-tealcode",
        },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ available: false, assets: [] });
    }

    const data = await res.json();
    const assets: GhAsset[] = (data.assets ?? []).map(
      (a: { name: string; browser_download_url: string }) => ({
        name: a.name,
        browser_download_url: a.browser_download_url,
      })
    );

    return NextResponse.json({
      available: assets.length > 0,
      tag: TAG,
      assets,
    });
  } catch {
    return NextResponse.json({ available: false, assets: [] });
  }
}
