"use client";

import dynamic from "next/dynamic";
import type { ComponentType, MutableRefObject } from "react";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ScrollButton from "@/components/ScrollButton";
import { expertiseAreas } from "./data";
import ExpertiseSection from "./ExpertiseSection";
import { preloadExpertiseGltf } from "./preloadExpertiseGltf";
import type { ExpertiseAreaId, ExpertiseSceneId } from "./types";

const WebScene = dynamic(() => import("./scenes/WebScene"), { ssr: false });
const AIScene = dynamic(() => import("./scenes/AIScene"), { ssr: false });
const MobileScene = dynamic(() => import("./scenes/MobileScene"), { ssr: false });
const GamesScene = dynamic(() => import("./scenes/GamesScene"), { ssr: false });
const HardwareScene = dynamic(() => import("./scenes/HardwareScene"), { ssr: false });

type SceneComponentProps = {
  reducedMotion: boolean;
  scrollProgressRef: MutableRefObject<number>;
  isMobile: boolean;
};

const sceneById: Record<ExpertiseSceneId, ComponentType<SceneComponentProps>> = {
  web: WebScene,
  ai: AIScene,
  mobile: MobileScene,
  games: GamesScene,
  hardware: HardwareScene,
};

function useDeviceHints() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [weakDevice, setWeakDevice] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReducedMotion(media.matches);
      setIsMobile(window.innerWidth < 768);
      setWeakDevice((navigator.hardwareConcurrency || 8) < 4);
    };
    update();
    media.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return { reducedMotion, isMobile, weakDevice };
}

type ExpertiseAreaHeroProps = {
  areaId: ExpertiseAreaId;
};

/** Hero de área (Web, AI, Mobile, etc.) en /proyectos al filtrar por `?section=`. */
export default function ExpertiseAreaHero({ areaId }: ExpertiseAreaHeroProps) {
  const t = useTranslations("expertise");
  const { reducedMotion, isMobile, weakDevice } = useDeviceHints();

  const area = useMemo(() => expertiseAreas.find((a) => a.id === areaId), [areaId]);

  const section = useMemo(() => {
    if (!area) return null;
    return {
      ...area,
      title: t(area.titleKey),
      subtitle: t(area.subtitleKey),
      education: area.educationKey ? t(area.educationKey) : "",
      educationLines: area.educationLineKeys?.map((key) => t(key)),
      experience: area.experienceKey ? t(area.experienceKey) : undefined,
      portfolioLabel: area.portfolioLinks[0] ? t(area.portfolioLinks[0].labelKey) : "",
      ctaLabel: t(area.ctaLabelKey),
    };
  }, [area, t]);

  useEffect(() => {
    preloadExpertiseGltf();
  }, []);

  if (!area || !section) return null;

  const Scene = sceneById[area.sceneId];

  return (
    <div
      id={`section-${area.id}`}
      style={{
        height: isMobile && area.id === "videogames" ? "120vh" : "100vh",
        overflow: "hidden",
        position: "relative",
        background: "#000000",
      }}
    >
      <ExpertiseSection
        area={section}
        title={section.title}
        subtitle={section.subtitle}
        education={section.education}
        educationLines={section.educationLines}
        experience={section.experience}
        portfolioLabel={section.portfolioLabel}
        ctaLabel={section.ctaLabel}
        scene={Scene}
        textAlign="left"
        reducedMotion={reducedMotion}
        isMobile={isMobile}
        weakDevice={weakDevice}
        active
        heroMode
        onActive={() => {}}
      />
      <div
        className="scroll-wrap"
        style={{
          position: "absolute",
          bottom: "2rem",
          left: 0,
          right: 0,
          zIndex: 40,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "auto",
        }}
      >
        <ScrollButton targetId="projects" color="transparent" iconColor="rgba(255,255,255,0.9)" />
      </div>
    </div>
  );
}
