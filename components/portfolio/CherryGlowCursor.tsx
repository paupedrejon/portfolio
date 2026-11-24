"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import "@/components/home/GlowCursor.css";

const GlowCursor = dynamic(() => import("@/components/home/GlowCursor"), {
  ssr: false,
});

function isDarkCherryPath(pathname: string | null): boolean {
  if (!pathname) return true;
  if (/^\/(es|en|it)\/?$/.test(pathname) || pathname === "/") return true;
  if (pathname.includes("/cursos") || pathname.startsWith("/study-agents")) {
    return false;
  }
  if (pathname.includes("/admin")) return false;
  return (
    /\/(proyectos|projects|progetti|skills|experience|education|about-me|contact|privacy|blog|ego|tealcode)(\/|$)/.test(
      pathname,
    ) ||
    /\/(experiencia|educacion|sobre-mi|contacto|privacidad)(\/|$)/.test(pathname)
  );
}

/** GlowCursor Dark Cherry en home + páginas portfolio (no cursos / Study Agents). */
export default function CherryGlowCursor() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isDarkCherryPath(pathname)) {
      setEnabled(false);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowCpu = (navigator.hardwareConcurrency || 8) < 6;
    const lowMem =
      "deviceMemory" in navigator &&
      (navigator as Navigator & { deviceMemory?: number }).deviceMemory! <= 4;
    setEnabled(!reduce && !lowCpu && !lowMem);
  }, [pathname]);

  if (!enabled) return null;

  return (
    <div className="cherry-glow-cursor" aria-hidden>
      <GlowCursor
        color="#e04667"
        secondaryColor="#87002e"
        intensity={1.25}
        trailWidth={3}
        linger={0.75}
        glow={1.15}
        followSpeed={1}
        clickBurst
        quality="medium"
        maxDevicePixelRatio={1.5}
        theme="dark"
      />
    </div>
  );
}
