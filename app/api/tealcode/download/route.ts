import { NextResponse } from "next/server";
import { buildTealcodeSourceZip } from "@/lib/tealcode/zip-source";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const zipBuffer = await buildTealcodeSourceZip();

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="tealcode-source.zip"',
        "Content-Length": String(zipBuffer.length),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al generar ZIP";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
