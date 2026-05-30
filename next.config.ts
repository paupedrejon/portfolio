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
  // Incluir plantilla del curso en el bundle de la API en Vercel
  outputFileTracingIncludes: {
    "/api/cursos/react/download": [
      "./templates/react-starter/**/*",
      "./courses/react/levels.js",
    ],
  },
};

export default withNextIntl(nextConfig);
