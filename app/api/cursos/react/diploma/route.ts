import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSupabaseConfigured, getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  issueDiploma,
  getDiploma,
  getProgressRows,
  buildProgressPayload,
} from "@/lib/cursos/progress";
import { COURSE_SLUG_REACT } from "@/lib/cursos/constants";

export async function GET() {
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

  const diploma = await getDiploma(session.user.id, COURSE_SLUG_REACT);
  return NextResponse.json({ diploma });
}

export async function POST() {
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

  const rows = await getProgressRows(session.user.id, COURSE_SLUG_REACT);
  const progress = buildProgressPayload(
    rows,
    session.user.name ?? null
  );

  if (!progress.courseCompleted) {
    return NextResponse.json(
      { error: "Curso no completado" },
      { status: 403 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", session.user.id)
    .maybeSingle();

  const nameOnDiploma = profile?.display_name?.trim();
  if (!nameOnDiploma) {
    return NextResponse.json(
      { error: "Configura tu nombre en el perfil antes de obtener el diploma" },
      { status: 400 }
    );
  }

  await issueDiploma(session.user.id, nameOnDiploma, COURSE_SLUG_REACT);

  const diploma = await getDiploma(session.user.id, COURSE_SLUG_REACT);
  return NextResponse.json({ diploma });
}
