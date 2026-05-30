import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { createStudentToken, ensureProfile } from "@/lib/cursos/progress";
import { buildTemplateZip } from "@/lib/cursos/zip-template";
import { COURSE_SLUG_REACT } from "@/lib/cursos/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
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

  try {
    await ensureProfile(
      session.user.id,
      session.user.name,
      session.user.image
    );
    const token = await createStudentToken(session.user.id, COURSE_SLUG_REACT);
    const zipBuffer = await buildTemplateZip(token);

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition":
          'attachment; filename="react-portfolio-starter.zip"',
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
