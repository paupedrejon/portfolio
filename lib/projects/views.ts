import type { ExpertiseAreaId } from "@/components/expertise/types";
import type { ProjectEntityId, ProjectSlug } from "@/lib/projects/config";
import type { ProjectListItem } from "@/components/projects/ProjectsList";

export type ProjectViewMode = "list" | "timeline" | "entity" | "category";

export const PROJECT_VIEW_MODES: ProjectViewMode[] = [
  "list",
  "timeline",
  "entity",
  "category",
];

export function isProjectViewMode(value: string | null): value is ProjectViewMode {
  return value !== null && PROJECT_VIEW_MODES.includes(value as ProjectViewMode);
}

export type ProjectGroup = {
  id: string;
  titleKey?: string;
  title?: string;
  entityId?: ProjectEntityId;
  areaId?: ExpertiseAreaId;
  /** YYYY-MM para agrupación cronológica mensual */
  monthKey?: string;
  projects: ProjectListItem[];
};

const ENTITY_ORDER: ProjectEntityId[] = ["owius", "upc", "iia", "itb", "personal"];

const AREA_ORDER: ExpertiseAreaId[] = [
  "web-development",
  "ai",
  "mobile",
  "videogames",
  "hardware",
];

function sortByDateDesc(a: ProjectListItem, b: ProjectListItem): number {
  return b.sortDate.localeCompare(a.sortDate);
}

function sortByListOrder(
  a: ProjectListItem,
  b: ProjectListItem,
  order: Map<ProjectSlug, number>,
): number {
  return (order.get(a.slug as ProjectSlug) ?? 0) - (order.get(b.slug as ProjectSlug) ?? 0);
}

export function groupProjectsByTimeline(projects: ProjectListItem[]): ProjectGroup[] {
  const byMonth = new Map<string, ProjectListItem[]>();

  for (const project of projects) {
    const monthKey = project.sortDate.slice(0, 7);
    const bucket = byMonth.get(monthKey) ?? [];
    bucket.push(project);
    byMonth.set(monthKey, bucket);
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([monthKey, items]) => ({
      id: `month-${monthKey}`,
      monthKey,
      projects: items.sort(sortByDateDesc),
    }));
}

export function formatTimelineMonth(
  monthKey: string,
  locale: string,
): { monthShort: string; monthLong: string; year: string } {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);

  const monthShort = new Intl.DateTimeFormat(locale, { month: "short" })
    .format(date)
    .replace(/\.$/u, "")
    .toUpperCase();

  const monthLong = new Intl.DateTimeFormat(locale, { month: "long" }).format(date);

  return {
    monthShort,
    monthLong: monthLong.charAt(0).toUpperCase() + monthLong.slice(1),
    year: String(year),
  };
}

export function groupProjectsByEntity(projects: ProjectListItem[]): ProjectGroup[] {
  const buckets = new Map<ProjectEntityId, ProjectListItem[]>();

  for (const project of projects) {
    const bucket = buckets.get(project.entityId) ?? [];
    bucket.push(project);
    buckets.set(project.entityId, bucket);
  }

  return ENTITY_ORDER.filter((id) => buckets.has(id)).map((entityId) => ({
    id: `entity-${entityId}`,
    entityId,
    titleKey: `entity.${entityId}`,
    projects: (buckets.get(entityId) ?? []).sort(sortByDateDesc),
  }));
}

export function groupProjectsByCategory(projects: ProjectListItem[]): ProjectGroup[] {
  const buckets = new Map<ExpertiseAreaId, ProjectListItem[]>();

  for (const project of projects) {
    for (const areaId of project.sections) {
      const bucket = buckets.get(areaId) ?? [];
      if (!bucket.some((p) => p.slug === project.slug)) {
        bucket.push(project);
      }
      buckets.set(areaId, bucket);
    }
  }

  return AREA_ORDER.filter((id) => buckets.has(id)).map((areaId) => ({
    id: `area-${areaId}`,
    areaId,
    projects: (buckets.get(areaId) ?? []).sort(sortByDateDesc),
  }));
}

export function buildListOrderMap(slugs: ProjectSlug[]): Map<ProjectSlug, number> {
  return new Map(slugs.map((slug, index) => [slug, index]));
}

export function sortProjectsForListView(
  projects: ProjectListItem[],
  order: Map<ProjectSlug, number>,
): ProjectListItem[] {
  return [...projects].sort((a, b) => sortByListOrder(a, b, order));
}
