import { getLevelById } from "@/lib/cursos/levels";
import {
  getCurrentLevelId,
  upsertLevelProgress,
  validateStudentToken,
  allCheckpointsPassed,
} from "@/lib/cursos/progress";
import { TOTAL_LEVELS } from "@/lib/cursos/constants";

export type VerifyResultItem = {
  checkpointId: string;
  passed: boolean;
};

export async function processVerify(
  token: string,
  levelId: number,
  results: VerifyResultItem[]
) {
  const tokenRow = await validateStudentToken(token);
  if (!tokenRow) {
    return { error: "Token inválido o revocado", status: 401 };
  }

  const level = getLevelById(levelId);
  if (!level) {
    return { error: "Nivel no encontrado", status: 404 };
  }

  const expectedIds = new Set(level.checkpoints.map((c) => c.id));
  const submittedIds = new Set(results.map((r) => r.checkpointId));

  if (submittedIds.size !== expectedIds.size) {
    return {
      error: "Número de checkpoints incorrecto",
      status: 400,
    };
  }

  for (const id of expectedIds) {
    if (!submittedIds.has(id)) {
      return { error: `Falta checkpoint: ${id}`, status: 400 };
    }
  }

  const currentLevelId = await getCurrentLevelId(
    tokenRow.user_id,
    tokenRow.course_slug
  );

  if (levelId > currentLevelId) {
    return {
      error: "Debes completar los niveles anteriores primero",
      status: 403,
    };
  }

  const completed: Record<string, boolean> = {};
  for (const r of results) {
    if (!expectedIds.has(r.checkpointId)) {
      return { error: `Checkpoint desconocido: ${r.checkpointId}`, status: 400 };
    }
    completed[r.checkpointId] = r.passed === true;
  }

  const levelPassed = await upsertLevelProgress(
    tokenRow.user_id,
    tokenRow.course_slug,
    levelId,
    completed
  );

  const nextLevelId =
    levelPassed && levelId < TOTAL_LEVELS ? levelId + 1 : null;
  const newCurrent = await getCurrentLevelId(
    tokenRow.user_id,
    tokenRow.course_slug
  );
  const courseCompleted = newCurrent > TOTAL_LEVELS;

  return {
    status: 200,
    body: {
      levelPassed,
      nextLevelId,
      courseCompleted,
      checkpoints: level.checkpoints.map((c) => ({
        id: c.id,
        label: c.label,
        passed: completed[c.id] === true,
      })),
      allPassed: allCheckpointsPassed(levelId, completed),
    },
  };
}

export function extractToken(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7).trim();
  }
  const url = new URL(request.url);
  return url.searchParams.get("token");
}
