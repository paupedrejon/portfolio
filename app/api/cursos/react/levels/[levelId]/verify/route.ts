import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { processVerify, type VerifyResultItem } from "@/lib/cursos/verify";

type RouteParams = { params: Promise<{ levelId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase no configurado" },
      { status: 503 }
    );
  }

  const { levelId: levelIdStr } = await params;
  const levelId = parseInt(levelIdStr, 10);
  if (Number.isNaN(levelId)) {
    return NextResponse.json({ error: "levelId inválido" }, { status: 400 });
  }

  let body: { token?: string; results?: VerifyResultItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { token, results } = body;
  if (!token || !Array.isArray(results)) {
    return NextResponse.json(
      { error: "token y results son requeridos" },
      { status: 400 }
    );
  }

  const outcome = await processVerify(token, levelId, results);

  if ("error" in outcome) {
    return NextResponse.json(
      { error: outcome.error },
      { status: outcome.status }
    );
  }

  return NextResponse.json(outcome.body);
}
