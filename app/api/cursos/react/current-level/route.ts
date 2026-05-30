import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import {
  getCurrentLevelId,
  validateStudentToken,
} from "@/lib/cursos/progress";
import { getLevelById, getPublicLevel } from "@/lib/cursos/levels";
import { extractToken } from "@/lib/cursos/verify";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase no configurado" },
      { status: 503 }
    );
  }

  const token = extractToken(request);
  if (!token) {
    return NextResponse.json({ error: "Token requerido" }, { status: 401 });
  }

  const tokenRow = await validateStudentToken(token);
  if (!tokenRow) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const url = new URL(request.url);
  const levelParam = url.searchParams.get("levelId");
  const levelIdOverride = levelParam ? parseInt(levelParam, 10) : null;

  const levelId =
    levelIdOverride && !Number.isNaN(levelIdOverride)
      ? levelIdOverride
      : await getCurrentLevelId(tokenRow.user_id, tokenRow.course_slug);

  const level = getLevelById(levelId);
  if (!level) {
    return NextResponse.json({
      levelId,
      courseCompleted: true,
      level: null,
      checkpoints: [],
    });
  }

  return NextResponse.json({
    levelId,
    courseCompleted: false,
    level: getPublicLevel(level),
    checkpoints: level.checkpoints.map((c) => ({
      id: c.id,
      label: c.label,
    })),
  });
}
