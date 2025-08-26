// components/SkillRow.tsx
"use client";

import { ReactNode } from "react";

type SkillRowProps = {
  icon: ReactNode;
  label: string;
  value: number;            // 0..100
  /**
   * Colores:
   *   trackColor → fondo del track (barra vacía)
   *   fillFrom/to → degradado de la barra llena
   */
  trackColor?: string;
  fillFrom?: string;
  fillTo?: string;
  className?: string;
};

export default function SkillRow({
  icon,
  label,
  value,
  trackColor = "bg-white/12",
  fillFrom = "from-emerald-400",
  fillTo = "to-teal-500",
  className = "",
}: SkillRowProps) {
  const width = Math.min(Math.max(value, 0), 100);

  return (
    <div
      className={`
        relative rounded-2xl px-4 py-4 sm:px-5 sm:py-5
        bg-gradient-to-b from-white/6 to-white/[0.04]
        ring-1 ring-white/10 shadow-[0_6px_30px_-12px_rgba(0,0,0,0.35)]
        backdrop-blur-sm
        ${className}
      `}
    >
      <div className="flex items-center gap-4">
        {/* icono */}
        <div className="grid place-items-center size-11 rounded-full bg-white/10 ring-1 ring-white/20 shrink-0">
          <div className="size-6 opacity-90">{icon}</div>
        </div>

        {/* texto + barra */}
        <div className="flex-1 min-w-0">
          <div className="text-[10.5px] uppercase tracking-[0.28em] opacity-75">
            Skill
          </div>
          <div className="text-lg font-semibold leading-tight">
            {label}
          </div>

          {/* barra sin número */}
          <div className="mt-3 h-3 rounded-full overflow-hidden ring-1 ring-white/15">
            <div className={`h-full ${trackColor}`} />
            <div
              className={`absolute left-0 top-0 h-3 rounded-full bg-gradient-to-r ${fillFrom} ${fillTo}
                          transition-[width] duration-500`}
              style={{ width: `${width}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
