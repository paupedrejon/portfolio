import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Braces,
  Cpu,
  Gamepad2,
  GitBranch,
  Layers,
  Monitor,
  Server,
} from "lucide-react";

export type SkillCategoryKey =
  | "programmingLanguages"
  | "frontEnd"
  | "backEnd"
  | "artificialIntelligence"
  | "gameCreative"
  | "versionControl"
  | "hardware3d";

const CATEGORY_FILTER_ICONS: Record<SkillCategoryKey, LucideIcon> = {
  programmingLanguages: Braces,
  frontEnd: Monitor,
  backEnd: Server,
  artificialIntelligence: Bot,
  gameCreative: Gamepad2,
  versionControl: GitBranch,
  hardware3d: Cpu,
};

export function SkillCategoryFilterIcon({
  categoryKey,
  className,
  size = 16,
}: {
  categoryKey: SkillCategoryKey;
  className?: string;
  size?: number;
}) {
  const Icon = CATEGORY_FILTER_ICONS[categoryKey];
  return <Icon className={className} size={size} strokeWidth={2} aria-hidden />;
}

export const SKILL_CATEGORY_KEYS = Object.keys(
  CATEGORY_FILTER_ICONS,
) as SkillCategoryKey[];
