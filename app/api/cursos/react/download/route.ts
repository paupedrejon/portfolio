import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { createStudentToken } from "@/lib/cursos/progress";
import { buildTemplateZip } from "@/lib/cursos/zip-template";
import { COURSE_SLUG_REACT } from "@/lib/cursos/constants";

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
    return NextResponse.json(
      { error: "Error al generar la plantilla" },
      { status: 500 }
    );
  }
}
