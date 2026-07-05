import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Bot,
  Brain,
  Code2,
  Cpu,
  Database,
  FileText,
  Gamepad2,
  Globe,
  GraduationCap,
  Layers,
  Link2,
  MessagesSquare,
  Palette,
  Rocket,
  Sparkles,
  User,
  Users,
  Zap,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  graduation: GraduationCap,
  bots: Bot,
  database: Database,
  books: BookOpen,
  rocket: Rocket,
  link: Link2,
  user: User,
  layers: Layers,
  code: Code2,
  palette: Palette,
  globe: Globe,
  gamepad: Gamepad2,
  cpu: Cpu,
  sparkles: Sparkles,
  brain: Brain,
  messages: MessagesSquare,
  users: Users,
  file: FileText,
  zap: Zap,
};

export function ProjectDetailIcon({
  name,
  className,
  size = 28,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  const Icon = ICON_MAP[name] ?? Sparkles;
  return <Icon className={className} size={size} strokeWidth={1.75} aria-hidden />;
}
