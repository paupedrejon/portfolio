import type { ExpertiseAreaId } from "@/components/expertise/types";

const ORG_UPC = {
  id: "upc" as const,
  name: "UPC",
  logo: "/logo_upc.webp",
  href: "https://www.upc.edu/",
  logoStyle: "round" as const,
};

const ORG_IIA = {
  id: "iia" as const,
  name: "IIA",
  logo: "/IIA.png",
  href: "https://iia.es/",
  logoStyle: "blend" as const,
};

const ORG_ITB = {
  id: "itb" as const,
  name: "ITB",
  logo: "/ITB.png",
  href: "https://www.itb.cat/",
  logoStyle: "blend" as const,
};

const ORG_OWius = {
  id: "owius" as const,
  name: "Owius",
  logo: "/owius.avif",
  href: "https://owius.com/",
  logoStyle: "warm" as const,
};

export type ProjectSlug =
  | "tealcode"
  | "study-agents"
  | "turelojya"
  | "evenely"
  | "react-course"
  | "portfolio"
  | "ego"
  | "shooter"
  | "tire-inflator"
  | "fiblab"
  | "circusvr"
  | "vr-experience"
  | "drovo"
  | "salmon1"
  | "3dprinting";

export type ProjectEntityId = "personal" | "owius" | "upc" | "iia" | "itb";

export type ProjectConfig = {
  slug: ProjectSlug;
  imageCard: string;
  /** Capturas adicionales en la ficha de detalle */
  gallery?: string[];
  tech: string;
  /** YYYY-MM para ordenación cronológica */
  sortDate: string;
  /** Oculto del listado /proyectos (la ficha sigue accesible por URL directa). */
  hidden?: boolean;
  /** Enlace externo opcional (demo, juego, etc.) */
  externalHref?: string;
  sections: ExpertiseAreaId[];
  /** Empresa / institución (logo en tarjeta y ficha). */
  company?: {
    id: ProjectEntityId;
    name: string;
    logo: string;
    href: string;
    /** round = emblema circular (UPC); blend = PNG oscuro; warm = logo claro sobre acento cálido */
    logoStyle?: "round" | "blend" | "warm";
  };
  /** Contenido extendido tipo /ego (solo algunos proyectos) */
  extendedLayout?: "ego";
};

export function getProjectEntityId(config: ProjectConfig): ProjectEntityId {
  return config.company?.id ?? "personal";
}

export const PROJECTS_CONFIG: ProjectConfig[] = [
  {
    slug: "tealcode",
    imageCard: "/tealcode.png",
    sortDate: "2026-01",
    tech: "Tauri 2, Rust, React 19, TypeScript, Monaco Editor, Ollama, DeepSeek, Qwen, GLM",
    externalHref: "/api/tealcode/installer",
    sections: ["ai", "web-development"],
    hidden: true,
  },
  {
    slug: "study-agents",
    imageCard: "/react_study_agents.png",
    sortDate: "2026-01",
    tech: "Next.js, React, TypeScript, Python, FastAPI, LangChain, OpenAI, Vector DB",
    externalHref: "/study-agents",
    sections: ["ai", "web-development"],
    company: ORG_IIA,
  },
  {
    slug: "turelojya",
    imageCard: "/turelojya.png",
    sortDate: "2025-12",
    tech: "React, Node.js, MongoDB, Docker, Redsys, Brevo, SEO, i18n",
    externalHref: "https://turelojya.com/",
    sections: ["web-development"],
    company: ORG_OWius,
  },
  {
    slug: "evenely",
    imageCard: "/evenely1.png",
    gallery: ["/evenely1.png", "/evenely2.png", "/evenely3.png"],
    sortDate: "2026-02",
    tech: "React, Node.js, TypeScript, Redsys, SaaS, WebSockets, Docker, Yarn",
    externalHref: "https://evenely.com/",
    sections: ["web-development"],
    company: ORG_OWius,
  },
  {
    slug: "react-course",
    imageCard: "/curso-react.png",
    sortDate: "2026-05",
    tech: "React, Vite, Tailwind CSS, Playwright, Next.js, Supabase",
    externalHref: "/cursos/react",
    sections: ["web-development"],
  },
  {
    slug: "portfolio",
    imageCard: "/react.png",
    sortDate: "2025-07",
    tech: "React, Next.js, TypeScript, TailwindCSS, Vercel",
    sections: ["web-development"],
  },
  {
    slug: "ego",
    imageCard: "/egoprojecte.png",
    sortDate: "2026-05",
    tech: "React Native, Expo, Expo Router, TypeScript, Node.js, Express, PostgreSQL, Google OAuth 2.0, JWT, Stripe, AWS Lambda, AWS S3, GitHub Actions, Jest, Supertest, Docker",
    externalHref:
      "https://github.com/paupedrejon/portfolio/releases/download/v1.0.0-ego/e-Go.apk",
    sections: ["mobile", "web-development"],
    extendedLayout: "ego",
    company: ORG_UPC,
  },
  {
    slug: "shooter",
    imageCard: "/salmon2.png",
    sortDate: "2025-06",
    tech: "Unreal Engine, Blender, Substance Painter, Photoshop, Networking, C++, Mixamo",
    externalHref: "https://gamejolt.com/games/salmon_infinite/681208",
    sections: ["videogames"],
  },
  {
    slug: "tire-inflator",
    imageCard: "/proteus.png",
    sortDate: "2025-01",
    tech: "Proteus, C, Microcontroller Simulation, Embedded Systems",
    sections: ["hardware"],
  },
  {
    slug: "fiblab",
    imageCard: "/fiblab.png",
    sortDate: "2024-02",
    tech: "Unity, Photoshop",
    externalHref: "https://pa2005.itch.io/fib-lab",
    sections: ["videogames"],
    company: ORG_UPC,
  },
  {
    slug: "circusvr",
    imageCard: "/circusvr.png",
    sortDate: "2024-02",
    tech: "Unreal Engine VR, Blender, Photoshop, Git",
    externalHref: "https://gamejambcn.com/",
    sections: ["videogames"],
    company: ORG_UPC,
  },
  {
    slug: "vr-experience",
    imageCard: "/portada.png",
    sortDate: "2022-05",
    tech: "Unreal Engine VR, Blender, Photoshop, MetaHumans",
    externalHref: "https://gamejolt.com/games/realyexperience/728307",
    sections: ["videogames"],
    company: ORG_ITB,
  },
  {
    slug: "drovo",
    imageCard: "/drovo.png",
    sortDate: "2022-07",
    tech: "Unreal Engine, Blender, Photoshop, Mixamo",
    externalHref: "https://gamejolt.com/games/drovo/726952",
    sections: ["videogames"],
  },
  {
    slug: "salmon1",
    imageCard: "/salmon1.png",
    sortDate: "2022-06",
    tech: "Unreal Engine, Blender, Substance Painter, Photoshop, Networking, C++, Mixamo",
    externalHref: "https://gamejolt.com/games/salmon_infinite_experimental/712867",
    sections: ["videogames"],
  },
  {
    slug: "3dprinting",
    imageCard: "/impresora3D.jpg",
    sortDate: "2020-04",
    tech: "FreeCad, Blender, UltiMaker Cura, Photoshop, FDM Printers",
    sections: ["hardware"],
  },
];

export function getVisibleProjects(): ProjectConfig[] {
  return PROJECTS_CONFIG.filter((p) => !p.hidden);
}

export function getProjectBySlug(slug: string): ProjectConfig | undefined {
  return PROJECTS_CONFIG.find((p) => p.slug === slug);
}

export function isProjectSlug(slug: string): slug is ProjectSlug {
  return PROJECTS_CONFIG.some((p) => p.slug === slug);
}
