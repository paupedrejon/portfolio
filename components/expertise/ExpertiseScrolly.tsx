"use client";

import dynamic from "next/dynamic";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ComponentType, MutableRefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { expertiseAreas } from "./data";
import ExpertiseNav from "./ExpertiseNav";
import ExpertiseSection from "./ExpertiseSection";
import { ExpertiseSnapScrollerContext } from "./ExpertiseSnapScrollerContext";
import { preloadExpertiseGltf } from "./preloadExpertiseGltf";
import SideIndicator from "./SideIndicator";
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

export default function ExpertiseScrolly() {
  const t = useTranslations("expertise");
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<ExpertiseAreaId | "explore">(expertiseAreas[0]!.id);
  const [navVisible, setNavVisible] = useState(false);
  const { reducedMotion, isMobile, weakDevice } = useDeviceHints();

  const sections = useMemo(
    () =>
      expertiseAreas.map((area) => ({
        ...area,
        title: t(area.titleKey),
        subtitle: t(area.subtitleKey),
        education: area.educationKey ? t(area.educationKey) : "",
        educationLines: area.educationLineKeys?.map((key) => t(key)),
        experience: area.experienceKey ? t(area.experienceKey) : undefined,
        portfolioLabel: area.portfolioLinks[0] ? t(area.portfolioLinks[0].labelKey) : "",
        ctaLabel: t(area.ctaLabelKey),
      })),
    [t],
  );

  useEffect(() => {
    let rafId = 0;
    const runMeasurement = () => {
      rafId = 0;
      const mid = window.innerHeight / 2;
      let matchedArea = false;

      for (const area of expertiseAreas) {
        const el = document.getElementById(`section-${area.id}`);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) {
          setActiveId(area.id);
          matchedArea = true;
          break;
        }
      }

      if (!matchedArea) {
        const exploreEl = document.getElementById("explore-section");
        if (exploreEl) {
          const r = exploreEl.getBoundingClientRect();
          if (r.top <= mid && r.bottom >= mid) {
            setActiveId("explore");
          }
        }
      }

      const webSection = document.getElementById(`section-${expertiseAreas[0]!.id}`);
      const exploreSection = document.getElementById("explore-section");
      if (!webSection || !exploreSection) {
        setNavVisible(false);
        return;
      }
      const webRect = webSection.getBoundingClientRect();
      const exploreRect = exploreSection.getBoundingClientRect();
      // Visible solo desde WEB hasta justo antes de "Explore my work".
      const reachedWeb = webRect.top <= window.innerHeight * 0.35;
      const beforeExplore = exploreRect.top > window.innerHeight * 0.05;
      setNavVisible(reachedWeb && beforeExplore);
    };
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(runMeasurement);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    preloadExpertiseGltf();
  }, []);

  return (
    <ExpertiseSnapScrollerContext.Provider value={null}>
      <div ref={containerRef} id="expertise" style={{ position: "relative", background: "#000000" }}>
        <ExpertiseNav activeId={activeId} visible={navVisible} />
        <SideIndicator
          items={sections.map((section) => ({
            id: section.id,
            areaNumber: section.areaNumber,
            label: section.title,
          }))}
          activeId={expertiseAreas.some((a) => a.id === activeId) ? activeId : "__none__"}
          activeAccent={sections.find((s) => s.id === activeId)?.accent ?? "#f5f3ee"}
        />
        {sections.map((section, index) => (
          <div
            key={section.id}
            id={`section-${section.id}`}
            style={{
              height: isMobile && section.id === "videogames" ? "120vh" : "100vh",
              overflow: "hidden",
              position: "relative",
              scrollSnapAlign: "start",
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
              scene={sceneById[section.sceneId]}
              textAlign={index % 2 === 0 ? "left" : "right"}
              reducedMotion={reducedMotion}
              isMobile={isMobile}
              weakDevice={weakDevice}
              active={activeId === section.id}
              onActive={() => setActiveId(section.id)}
            />
          </div>
        ))}
      </div>
    </ExpertiseSnapScrollerContext.Provider>
  );
}
