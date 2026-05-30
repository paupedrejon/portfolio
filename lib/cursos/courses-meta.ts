import { REACT_COURSE_ESTIMATED_MINUTES } from "../../courses/react/estimated-minutes.js";
import { COURSE_SLUG_REACT, TOTAL_LEVELS } from "./constants";

export type CourseMeta = {
  slug: string;
  totalLevels: number;
  estimatedMinutes: number;
  resultPath: string;
};

export const REACT_COURSE: CourseMeta = {
  slug: COURSE_SLUG_REACT,
  totalLevels: TOTAL_LEVELS,
  estimatedMinutes: REACT_COURSE_ESTIMATED_MINUTES,
  resultPath: "/cursos/react/resultado",
};

export const COURSES: CourseMeta[] = [REACT_COURSE];

export function getCourseMeta(slug: string): CourseMeta | undefined {
  return COURSES.find((c) => c.slug === slug);
}
