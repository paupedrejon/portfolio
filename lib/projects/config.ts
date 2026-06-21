import type { ExpertiseAreaId } from "@/components/expertise/types";

export type ProjectSlug =
  | "tealcode"
  | "study-agents"
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

export type ProjectConfig = {
  slug: ProjectSlug;
  imageCard: string;
  tech: string;
  /** Enlace externo opcional (demo, juego, etc.) */
  externalHref?: string;
  sections: ExpertiseAreaId[];
  /** Contenido extendido tipo /ego (solo algunos proyectos) */
  extendedLayout?: "ego";
};

export const PROJECTS_CONFIG: ProjectConfig[] = [
  {
    slug: "tealcode",
    imageCard: "/tealcode.png",
    tech: "Tauri 2, Rust, React 19, TypeScript, Monaco Editor, Ollama, DeepSeek, Qwen, GLM",
    externalHref: "/api/tealcode/installer",
    sections: ["ai", "web-development"],
  },
  {
    slug: "study-agents",
    imageCard: "/react_study_agents.png",
    tech: "Next.js, React, TypeScript, Python, FastAPI, LangChain, OpenAI, Vector DB",
    externalHref: "/study-agents",
    sections: ["ai", "web-development"],
  },
  {
    slug: "react-course",
    imageCard: "/react.png",
    tech: "React, Vite, Tailwind CSS, Playwright, Next.js, Supabase",
    externalHref: "/cursos/react",
    sections: ["web-development"],
  },
  {
    slug: "portfolio",
    imageCard: "/react.png",
    tech: "React, Next.js, TypeScript, TailwindCSS, Vercel",
    sections: ["web-development"],
  },
  {
    slug: "ego",
    imageCard: "/egoprojecte.png",
    tech: "React Native, Expo, Expo Router, TypeScript, Node.js, Express, PostgreSQL, Google OAuth 2.0, JWT, Stripe, AWS Lambda, AWS S3, GitHub Actions, Jest, Supertest, Docker",
    externalHref:
      "https://github.com/paupedrejon/portfolio/releases/download/v1.0.0-ego/e-Go.apk",
    sections: ["mobile", "web-development"],
    extendedLayout: "ego",
  },
  {
    slug: "shooter",
    imageCard: "/salmon2.png",
    tech: "Unreal Engine, Blender, Substance Painter, Photoshop, Networking, C++, Mixamo",
    externalHref: "https://gamejolt.com/games/salmon_infinite/681208",
    sections: ["videogames"],
  },
  {
    slug: "tire-inflator",
    imageCard: "/proteus.png",
    tech: "Proteus, C, Microcontroller Simulation, Embedded Systems",
    sections: ["hardware"],
  },
  {
    slug: "fiblab",
    imageCard: "/fiblab.png",
    tech: "Unity, Photoshop",
    externalHref: "https://pa2005.itch.io/fib-lab",
    sections: ["videogames"],
  },
  {
    slug: "circusvr",
    imageCard: "/circusvr.png",
    tech: "Unreal Engine VR, Blender, Photoshop, Git",
    externalHref: "https://gamejambcn.com/",
    sections: ["videogames"],
  },
  {
    slug: "vr-experience",
    imageCard: "/portada.png",
    tech: "Unreal Engine VR, Blender, Photoshop, MetaHumans",
    externalHref: "https://gamejolt.com/games/realyexperience/728307",
    sections: ["videogames"],
  },
  {
    slug: "drovo",
    imageCard: "/drovo.png",
    tech: "Unreal Engine, Blender, Photoshop, Mixamo",
    externalHref: "https://gamejolt.com/games/drovo/726952",
    sections: ["videogames"],
  },
  {
    slug: "salmon1",
    imageCard: "/salmon1.png",
    tech: "Unreal Engine, Blender, Substance Painter, Photoshop, Networking, C++, Mixamo",
    externalHref: "https://gamejolt.com/games/salmon_infinite_experimental/712867",
    sections: ["videogames"],
  },
  {
    slug: "3dprinting",
    imageCard: "/impresora3D.jpg",
    tech: "FreeCad, Blender, UltiMaker Cura, Photoshop, FDM Printers",
    sections: ["hardware"],
  },
];

export function getProjectBySlug(slug: string): ProjectConfig | undefined {
  return PROJECTS_CONFIG.find((p) => p.slug === slug);
}

export function isProjectSlug(slug: string): slug is ProjectSlug {
  return PROJECTS_CONFIG.some((p) => p.slug === slug);
}
