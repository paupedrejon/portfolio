"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackPortfolioEvent } from "@/lib/analytics/track-client";

/** Registra page_view al cambiar de ruta (portfolio, no /admin). */
export default function PortfolioTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    if (pathname.startsWith("/study-agents")) {
      trackPortfolioEvent("study_agents_view", { section: pathname }, pathname);
    } else if (pathname.includes("/cursos/react")) {
      const levelMatch = pathname.match(/nivel\/(\d+)/);
      trackPortfolioEvent(
        "react_course_view",
        { level: levelMatch ? Number(levelMatch[1]) : null },
        pathname,
      );
    }

    trackPortfolioEvent("page_view", {}, pathname);
  }, [pathname]);

  return null;
}
