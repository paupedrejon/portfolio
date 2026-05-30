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

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase no configurado" },
      { status: 503 }
    );
  }

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
    buildProgressPayload(rows, profile?.display_name ?? session.user.name ?? null)
  );
}
