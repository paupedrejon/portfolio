import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { createStudentToken, ensureProfile } from "@/lib/cursos/progress";
import { buildTemplateZip } from "@/lib/cursos/zip-template";
import { COURSE_SLUG_REACT } from "@/lib/cursos/constants";
import { getLevelById } from "@/lib/cursos/levels";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase no configurado en el servidor" },
      { status: 503 }
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let levelId = 1;
  try {
    const body = await request.json().catch(() => ({}));
    const fromBody = body?.levelId;
    const url = new URL(request.url);
    const fromQuery = url.searchParams.get("levelId");
    const raw = fromBody ?? fromQuery ?? 1;
    levelId = Math.max(1, Math.min(30, parseInt(String(raw), 10) || 1));
  } catch {
    levelId = 1;
  }

  const level = getLevelById(levelId);
  const slug = level?.slug ?? "starter";

  try {
    await ensureProfile(
      session.user.id,
      session.user.name,
      session.user.image
    );
    const token = await createStudentToken(session.user.id, COURSE_SLUG_REACT);
    const zipBuffer = await buildTemplateZip(token, { afterLevel: levelId });

    const filename =
      levelId === 1
        ? "react-portfolio-starter.zip"
        : `react-portfolio-nivel-${levelId}-${slug}.zip`;

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(zipBuffer.length),
      },
    });
  } catch (error) {
    console.error("download error:", error);
    const detail =
      error instanceof Error ? error.message : "Error desconocido";
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: isDev
          ? detail
          : detail.includes("Plantilla no encontrada")
            ? "Plantilla no disponible en el servidor. Contacta al administrador."
            : "Error al generar la plantilla",
      },
      { status: 500 }
    );
  }
}
