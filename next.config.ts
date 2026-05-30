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
  async rewrites() {
    return [
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
  },
};

export default withNextIntl(nextConfig);
