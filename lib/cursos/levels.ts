import { levels, getLevelById, getLevelIds } from "../../courses/react/levels.js";
import { COURSE_SLUG_REACT, TOTAL_LEVELS } from "./constants";

export type Checkpoint = {
  id: string;
  label: string;
  assert: string;
  hint?: string;
};

export type Level = {
  id: number;
  slug: string;
  title: string;
  block: string;
  description: string;
  instructions: string;
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
