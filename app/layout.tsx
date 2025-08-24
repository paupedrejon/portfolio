// app/layout.tsx
import "./globals.css";
import Header from "@/components/Header";          // 👈 importa el Header
import { din } from "./fonts";                     // si usas Barlow como var(--font-din)

export const metadata = {
  title: "Portfolio",
  description: "Pau Pedrejon",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={din?.variable}>
      <body className="bg-black text-white">
  {/* Header va aquí */}
  <Header />

  {/* Deja hueco para el header fijo */}
  <main className="pt-20">
    {children}
  </main>
</body>

    </html>
  );
}
