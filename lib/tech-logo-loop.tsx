"use client";

import {
  SiReact,
  SiNextdotjs,
  SiTypescript,
  SiTailwindcss,
  SiPython,
  SiFastapi,
  SiLangchain,
  SiVercel,
  SiUnrealengine,
  SiBlender,
  SiCplusplus,
  SiC,
  SiGit,
  SiUnity,
  SiProteus,
  SiFreecad,
  SiArduino,
  SiAdobephotoshop,
} from "react-icons/si";
import type { IconType } from "react-icons";

export interface TechLogoItem {
  node: React.ReactNode;
  title: string;
  href?: string;
}

const TECH_ICON_MAP: Record<string, { Icon: IconType; href?: string }> = {
  "next.js": { Icon: SiNextdotjs, href: "https://nextjs.org" },
  nextjs: { Icon: SiNextdotjs, href: "https://nextjs.org" },
  react: { Icon: SiReact, href: "https://react.dev" },
  typescript: { Icon: SiTypescript, href: "https://www.typescriptlang.org" },
  ts: { Icon: SiTypescript, href: "https://www.typescriptlang.org" },
  python: { Icon: SiPython, href: "https://python.org" },
  fastapi: { Icon: SiFastapi, href: "https://fastapi.tiangolo.com" },
  langchain: { Icon: SiLangchain, href: "https://langchain.com" },
  tailwind: { Icon: SiTailwindcss, href: "https://tailwindcss.com" },
  tailwindcss: { Icon: SiTailwindcss, href: "https://tailwindcss.com" },
  vercel: { Icon: SiVercel, href: "https://vercel.com" },
  "unreal engine": { Icon: SiUnrealengine, href: "https://unrealengine.com" },
  "unreal engine vr": { Icon: SiUnrealengine, href: "https://unrealengine.com" },
  blender: { Icon: SiBlender, href: "https://blender.org" },
  photoshop: { Icon: SiAdobephotoshop, href: "https://adobe.com/products/photoshop" },
  "c++": { Icon: SiCplusplus, href: "https://isocpp.org" },
  cpp: { Icon: SiCplusplus, href: "https://isocpp.org" },
  c: { Icon: SiC, href: "https://en.wikipedia.org/wiki/C_(programming_language)" },
  git: { Icon: SiGit, href: "https://git-scm.com" },
  unity: { Icon: SiUnity, href: "https://unity.com" },
  proteus: { Icon: SiProteus },
  freecad: { Icon: SiFreecad, href: "https://freecad.org" },
  arduino: { Icon: SiArduino, href: "https://arduino.cc" },
};

const ICON_STYLE = { fontSize: "1em", color: "#ffffff", display: "block" };

/**
 * Parse tech string and return LogoItem[] for LogoLoop (only techs with icons).
 */
export function getTechLogoItems(techString: string): TechLogoItem[] {
  if (!techString || typeof techString !== "string") return [];
  const cleaned = techString.replace(/^USED:\s*/i, "").trim();
  const techs = cleaned.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
  const seen = new Set<string>();
  const items: TechLogoItem[] = [];

  for (const tech of techs) {
    const entry = TECH_ICON_MAP[tech];
    if (!entry || seen.has(tech)) continue;
    seen.add(tech);
    const displayName = tech.charAt(0).toUpperCase() + tech.slice(1);
    items.push({
      node: <entry.Icon style={ICON_STYLE} />,
      title: displayName,
      href: entry.href,
    });
  }

  return items;
}
