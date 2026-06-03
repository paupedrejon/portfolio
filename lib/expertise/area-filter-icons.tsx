import type { ExpertiseAreaId } from "@/components/expertise/types";
import type { LucideIcon } from "lucide-react";
import { Brain, Code2, Cpu, Gamepad2, Smartphone } from "lucide-react";

const AREA_FILTER_ICONS: Record<ExpertiseAreaId, LucideIcon> = {
  "web-development": Code2,
  ai: Brain,
  mobile: Smartphone,
  videogames: Gamepad2,
  hardware: Cpu,
};

export function ExpertiseAreaFilterIcon({
  areaId,
  className,
  size = 16,
}: {
  areaId: ExpertiseAreaId;
  className?: string;
  size?: number;
}) {
  const Icon = AREA_FILTER_ICONS[areaId];
  return <Icon className={className} size={size} strokeWidth={2} aria-hidden />;
}
