import { getLevelById, type Level } from "@/lib/cursos/levels";
import {
  getCurrentLevelId,
  getLevelCheckpointProgress,
  upsertLevelProgress,
  validateStudentToken,
  allCheckpointsPassed,
} from "@/lib/cursos/progress";
import { TOTAL_LEVELS } from "@/lib/cursos/constants";

export type VerifyResultItem = {
  checkpointId: string;
  passed: boolean;
};

/**
 * Solo avanza un paso a la vez: el siguiente pendiente puede pasar si Playwright
 * lo valida; los posteriores quedan bloqueados aunque el código ya los cumpla.
 * Los pasos ya completados en previousCompleted se conservan.
 */
export function applySequentialCheckpoints(
  level: Level,
  rawResults: VerifyResultItem[],
  previousCompleted: Record<string, boolean> = {}
): Record<string, boolean> {
  const rawMap = Object.fromEntries(
    rawResults.map((r) => [r.checkpointId, r.passed === true])
  );
  const completed: Record<string, boolean> = {};
  let canAdvance = true;

  for (const cp of level.checkpoints) {
    const id = cp.id;
    if (previousCompleted[id] === true) {
      completed[id] = true;
      continue;
    }
    if (!canAdvance) {
      completed[id] = false;
      continue;
    }
    if (rawMap[id] === true) {
      completed[id] = true;
      canAdvance = false;
    } else {
      completed[id] = false;
      canAdvance = false;
    }
  }

  return completed;
}

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

  for (const r of results) {
    if (!expectedIds.has(r.checkpointId)) {
      return { error: `Checkpoint desconocido: ${r.checkpointId}`, status: 400 };
    }
  }

  const previousCompleted = await getLevelCheckpointProgress(
    tokenRow.user_id,
    tokenRow.course_slug,
    levelId
  );

  const completed = applySequentialCheckpoints(
    level,
    results,
    previousCompleted
  );

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
