import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async redirects() {
    return [
      // URLs de proyectos no canónicas → redirect 301 a la canónica por locale
      { source: "/es/projects", destination: "/es/proyectos", permanent: true },
      { source: "/es/projects/:slug", destination: "/es/proyectos/:slug", permanent: true },
      { source: "/es/progetti", destination: "/es/proyectos", permanent: true },
      { source: "/es/progetti/:slug", destination: "/es/proyectos/:slug", permanent: true },
      { source: "/en/proyectos", destination: "/en/projects", permanent: true },
      { source: "/en/proyectos/:slug", destination: "/en/projects/:slug", permanent: true },
      { source: "/en/progetti", destination: "/en/projects", permanent: true },
      { source: "/en/progetti/:slug", destination: "/en/projects/:slug", permanent: true },
      { source: "/it/proyectos", destination: "/it/progetti", permanent: true },
      { source: "/it/proyectos/:slug", destination: "/it/progetti/:slug", permanent: true },
      { source: "/it/projects", destination: "/it/progetti", permanent: true },
      { source: "/it/projects/:slug", destination: "/it/progetti/:slug", permanent: true },
    ];
  },
  async rewrites() {
    return [
      // URLs canónicas sirven el contenido de /proyectos (filesystem)
      { source: "/en/projects", destination: "/en/proyectos" },
      { source: "/en/projects/:slug", destination: "/en/proyectos/:slug" },
      { source: "/it/progetti", destination: "/it/proyectos" },
      { source: "/it/progetti/:slug", destination: "/it/proyectos/:slug" },
      {
        source: "/cursos/react-demo/:path*",
        destination: "/cursos/react-demo/index.html",
      },
    ];
  },
  // Incluir plantilla del curso en el bundle de la API en Vercel
  outputFileTracingIncludes: {
    "/api/cursos/react/download": [
      "./templates/react-starter/**/*",
      "./courses/react/levels.js",
    ],
    "/api/me/progress": ["./courses/react/levels.js"],
    "/api/me/profile": ["./courses/react/levels.js"],
    "/api/cursos/react/current-level": ["./courses/react/levels.js"],
    "/api/cursos/react/diploma": ["./courses/react/levels.js"],
    "/api/cursos/react/levels/[levelId]/verify": ["./courses/react/levels.js"],
    "/api/tealcode/download": ["./tealcode/**/*"],
    "/api/tealcode/installer": [
      "./public/downloads/**/*",
      "./tealcode/src-tauri/target/release/bundle/**/*",
    ],
  },
};

export default withNextIntl(nextConfig);
