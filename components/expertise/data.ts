import type { ExpertiseArea } from "./types";

export const expertiseAreas: ExpertiseArea[] = [
  {
    id: "web-development",
    areaNumber: "01",
    sceneId: "web",
    accent: "#00d9ff",
    background:
      "radial-gradient(circle at 50% 45%, rgba(0, 217, 255, 0.2) 0%, rgba(10, 10, 15, 0.94) 48%, #0a0a0f 100%)",
    titleKey: "areas.web.title",
    subtitleKey: "areas.web.subtitle",
    educationKey: "areas.web.education",
    experienceKey: "areas.web.experience",
    portfolioLinks: [
      {
        labelKey: "areas.web.portfolio",
        href: "https://turelojya.com",
        external: true,
      },
    ],
    ctaLabelKey: "areas.web.cta",
    ctaHref: "/proyectos?section=web-development",
    canvasBackground: "#000000",
    vignetteGradient:
      "radial-gradient(ellipse 70% 60% at center, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 55%, rgba(0,0,0,0.97) 100%)",
  },
  {
    id: "ai",
    areaNumber: "02",
    sceneId: "ai",
    accent: "#a855f7",
    background:
      "radial-gradient(circle at 50% 40%, rgba(168, 85, 247, 0.12) 0%, rgba(10, 8, 18, 0.92) 50%, #0a0812 100%)",
    titleKey: "areas.ai.title",
    subtitleKey: "areas.ai.subtitle",
    educationLineKeys: [
      "areas.ai.education.line1",
      "areas.ai.education.line2",
      "areas.ai.education.line3",
    ],
    hideExperience: true,
    portfolioLinks: [
      {
        labelKey: "areas.ai.portfolio",
        href: "https://paupedrejon.com/study-agents",
        external: true,
      },
    ],
    ctaLabelKey: "areas.ai.cta",
    ctaHref: "/proyectos?section=ai",
    canvasBackground: "#0a0812",
    vignetteGradient:
      "radial-gradient(ellipse 65% 55% at center, rgba(168,85,247,0.06) 0%, rgba(0,0,0,0.65) 55%, rgba(0,0,0,0.97) 100%)",
  },
  {
    id: "mobile",
    areaNumber: "03",
    sceneId: "mobile",
    accent: "#06b6d4",
    background:
      "radial-gradient(circle at 50% 45%, rgba(0, 0, 0, 0.35) 0%, rgba(5, 13, 18, 0.96) 55%, #050d12 100%)",
    titleKey: "areas.mobile.title",
    subtitleKey: "areas.mobile.subtitle",
    educationKey: "areas.mobile.education",
    hideExperience: true,
    portfolioLinks: [],
    ctaLabelKey: "areas.mobile.cta",
    ctaHref: "/proyectos?section=mobile",
    canvasBackground: "#050d12",
    vignetteGradient:
      "radial-gradient(ellipse 60% 70% at center, transparent 20%, rgba(0,0,0,0.5) 65%, rgba(0,0,0,0.97) 100%)",
  },
  {
    id: "videogames",
    areaNumber: "04",
    sceneId: "games",
    accent: "#ef4444",
    background:
      "radial-gradient(circle at 50% 42%, rgba(239, 68, 68, 0.12) 0%, rgba(18, 5, 5, 0.95) 55%, #120505 100%)",
    titleKey: "areas.games.title",
    subtitleKey: "areas.games.subtitle",
    educationKey: "areas.games.education",
    hideExperience: true,
    portfolioLinks: [
      {
        labelKey: "areas.games.portfolio.salmon",
        href: "https://gamejolt.com/games/salmon_infinite/681208",
        external: true,
      },
      {
        labelKey: "areas.games.portfolio.fiblab",
        href: "https://pa2005.itch.io/fib-lab",
        external: true,
      },
      {
        labelKey: "areas.games.portfolio.circusvr",
        href: "https://gamejambcn.com/",
        external: true,
      },
      {
        labelKey: "areas.games.portfolio.drovo",
        href: "https://gamejolt.com/games/drovo/726952",
        external: true,
      },
      {
        labelKey: "areas.games.portfolio.vr",
        href: "https://gamejolt.com/games/realyexperience/728307",
        external: true,
      },
    ],
    ctaLabelKey: "areas.games.cta",
    ctaHref: "/proyectos?section=videogames",
    canvasBackground: "#120505",
    vignetteGradient:
      "radial-gradient(ellipse 60% 70% at center, transparent 18%, rgba(0,0,0,0.52) 65%, rgba(0,0,0,0.97) 100%)",
  },
  {
    id: "hardware",
    areaNumber: "05",
    sceneId: "hardware",
    accent: "#fb923c",
    background:
      "radial-gradient(circle at 50% 40%, rgba(251, 146, 60, 0.1) 0%, rgba(15, 8, 0, 0.96) 55%, #0f0800 100%)",
    titleKey: "areas.hardware.title",
    subtitleKey: "areas.hardware.subtitle",
    educationKey: "areas.hardware.education",
    hideExperience: true,
    portfolioLinks: [
      {
        labelKey: "areas.hardware.portfolio.tires",
        href: null,
        external: false,
      },
      {
        labelKey: "areas.hardware.portfolio.maker",
        href: null,
        external: false,
      },
    ],
    ctaLabelKey: "areas.hardware.cta",
    ctaHref: "/proyectos?section=hardware",
    canvasBackground: "#0f0800",
    vignetteGradient:
      "radial-gradient(ellipse 60% 70% at center, transparent 18%, rgba(0,0,0,0.52) 65%, rgba(0,0,0,0.97) 100%)",
  },
];
