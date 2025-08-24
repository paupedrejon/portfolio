import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio — Tu Nombre",
  description: "Portfolio de proyectos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {/* Header se renderiza encima del hero */}
        {children}
      </body>
    </html>
  );
}
