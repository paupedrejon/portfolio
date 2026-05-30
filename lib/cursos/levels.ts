import { levels, getLevelById, getLevelIds } from "../../courses/react/levels.js";
import { COURSE_SLUG_REACT, TOTAL_LEVELS } from "./constants";

export type HintStep = {
  type: "file" | "code" | "tip" | "action";
  text: string;
  path?: string;
  code?: string;
};

export type Checkpoint = {
  id: string;
  label: string;
  assert: string;
  hint?: string;
  hintSteps?: HintStep[];
};

export type LevelPreview = {
  title: string;
  description: string;
};

export type Level = {
  id: number;
  slug: string;
  title: string;
  block: string;
  description: string;
  objective: string;
  preview: LevelPreview;
  instructions?: string;
  estimatedMinutes: number;
  checkpoints: Checkpoint[];
};

export { levels, getLevelById, getLevelIds, COURSE_SLUG_REACT, TOTAL_LEVELS };

export function getPublicLevel(level: Level) {
  return {
    id: level.id,
    slug: level.slug,
    title: level.title,
    block: level.block,
    description: level.description,
    checkpoints: level.checkpoints.map((c) => ({
      id: c.id,
      label: c.label,
    })),
  };
}

export function getPublicLevelWithInstructions(level: Level) {
  return {
    ...getPublicLevel(level),
    instructions: level.instructions,
  };
}
