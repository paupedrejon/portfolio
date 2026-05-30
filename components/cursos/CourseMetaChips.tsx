import { useTranslations } from "next-intl";
import EstimatedTimeBadge from "./EstimatedTimeBadge";

type Props = {
  totalLevels: number;
  estimatedMinutes: number;
  className?: string;
};

export default function CourseMetaChips({
  totalLevels,
  estimatedMinutes,
  className,
}: Props) {
  const t = useTranslations("cursos");

  return (
    <div
      className={["cursos-meta-chips", className].filter(Boolean).join(" ")}
    >
      <span className="cursos-meta-chip">{t("metaFree")}</span>
      <span className="cursos-meta-chip">
        {t("metaLevels", { count: totalLevels })}
      </span>
      <EstimatedTimeBadge minutes={estimatedMinutes} size="sm" />
    </div>
  );
}
