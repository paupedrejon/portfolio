import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import {
  buildProgressPayload,
  ensureProfile,
  getProfile,
  getProgressRows,
} from "@/lib/cursos/progress";
import { COURSE_SLUG_REACT } from "@/lib/cursos/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase no configurado" },
      { status: 503 }
    );
  }

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const url = new URL(request.url);
    const courseSlug = url.searchParams.get("course") ?? COURSE_SLUG_REACT;

    await ensureProfile(
      session.user.id,
      session.user.name,
      session.user.image
    );

    const [rows, profile] = await Promise.all([
      getProgressRows(session.user.id, courseSlug),
      getProfile(session.user.id),
    ]);

    return NextResponse.json(
      buildProgressPayload(
        rows,
        profile?.display_name ?? session.user.name ?? null
      )
    );
  } catch (error) {
    console.error("GET /api/me/progress:", error);
    const message =
      error instanceof Error ? error.message : "Error al cargar progreso";
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      { error: isDev ? message : "Error al cargar el progreso" },
      { status: 500 }
    );
  }
}
