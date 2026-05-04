export type ExpertiseSceneId = "web" | "ai" | "mobile" | "games" | "hardware";

/** Ids de `expertiseAreas`: query `?section=` y filtros en /proyectos. */
export const EXPERTISE_AREA_IDS = [
  "web-development",
  "ai",
  "mobile",
  "videogames",
  "hardware",
] as const;

export type ExpertiseAreaId = (typeof EXPERTISE_AREA_IDS)[number];

export function isExpertiseAreaId(v: string): v is ExpertiseAreaId {
  return (EXPERTISE_AREA_IDS as readonly string[]).includes(v);
}

export interface ExpertisePortfolioLink {
  labelKey: string;
  href: string | null;
  external?: boolean;
}

export interface ExpertiseArea {
  id: ExpertiseAreaId;
  areaNumber: string;
  sceneId: ExpertiseSceneId;
  accent: string;
  background: string;
  titleKey: string;
  subtitleKey: string;
  /** Una línea (WEB) si no usas `educationLineKeys`. */
  educationKey?: string;
  /** Varias líneas EDUCATION (AI). */
  educationLineKeys?: string[];
  experienceKey?: string;
  hideExperience?: boolean;
  portfolioLinks: ExpertisePortfolioLink[];
  ctaLabelKey: string;
  ctaHref: string;
  /** Color de fondo del `<Canvas>` (Three). */
  canvasBackground?: string;
  /** Gradiente radial de la capa tipo vignette (z-index 10). */
  vignetteGradient?: string;
}
