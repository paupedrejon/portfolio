import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSupabaseConfigured, getSupabaseAdmin } from "@/lib/supabase/admin";

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

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("user_id", session.user.id)
    .maybeSingle();

  return NextResponse.json({
    displayName: data?.display_name ?? session.user.name ?? "",
    avatarUrl: data?.avatar_url ?? session.user.image ?? null,
  });
}

export async function PATCH(request: Request) {
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

  let body: { displayName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const displayName = body.displayName?.trim();
  if (!displayName || displayName.length < 2 || displayName.length > 80) {
    return NextResponse.json(
      { error: "El nombre debe tener entre 2 y 80 caracteres" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: session.user.id,
      display_name: displayName,
      avatar_url: session.user.image ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return NextResponse.json({ error: "Error al guardar perfil" }, { status: 500 });
  }

  return NextResponse.json({ displayName });
}
