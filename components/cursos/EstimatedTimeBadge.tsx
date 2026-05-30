import { Clock } from "lucide-react";
import { formatEstimatedMinutes } from "@/lib/cursos/format-duration";

type Props = {
  minutes: number;
  size?: "sm" | "md" | "lg";
  /** Texto opcional antes de la duración (p. ej. "Estimado") */
  label?: string;
  className?: string;
};

export default function EstimatedTimeBadge({
  minutes,
  size = "md",
  label,
  className,
}: Props) {
  const duration = formatEstimatedMinutes(minutes);

  return (
    <span
      className={[
        "cursos-time-badge",
        `cursos-time-badge--${size}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      title={label ? `${label}: ${duration}` : duration}
    >
      <Clock className="cursos-time-badge__icon" aria-hidden strokeWidth={2.25} />
      {label ? (
        <span className="cursos-time-badge__text">
          <span className="cursos-time-badge__label">{label}</span>
          <span className="cursos-time-badge__value">{duration}</span>
        </span>
      ) : (
        <span className="cursos-time-badge__value">{duration}</span>
      )}
    </span>
  );
}
