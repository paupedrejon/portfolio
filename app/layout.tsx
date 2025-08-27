// app/layout.tsx
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

import Header from "@/components/Header";          // 👈 importa el Header
import { din } from "./fonts";                     // si usas Barlow como var(--font-din)
import { Poppins, Roboto_Mono } from "next/font/google";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { AiOutlineMail } from "react-icons/ai";
const robotoMono = Roboto_Mono({ subsets: ["latin"], weight: ["400", "700"] });


const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "800"] });


export const metadata = {
  title: "Portfolio — Pau Pedrejon",
  description: "Portfolio",
};

// 👇 añade el viewport para móviles
export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={din?.variable}>
      <body className="bg-black text-white overflow-x-hidden w-full">

        
        <Header />
        {/* ajusta el “offset” del header según el alto en móvil/escritorio */}
        <main className="pt-16 md:pt-20 w-full">

          {children}
        </main>


  <section
  style={{
    position: "relative",
    width: "100%",
    height: "20vh",
    overflow: "hidden",
  }}
>
  {/* Fondo */}
  <div
    style={{
      
      position: "absolute",
      inset: 0,
      backgroundColor: "rgba(220, 227, 228, 1)",
      zIndex: 0,
    }}
  />

  {/* Contenido */}
  <div
    style={{
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.5rem",
      zIndex: 1,
      color: "#575757",
      textAlign: "center",
    }}
  >
    {/* Derechos */}
    <p style={{ fontSize: "14px", margin: 10 }}>
      © {new Date().getFullYear()} Pau Pedrejon. All rights reserved.
    </p>

{/* Redes sociales */}
<div
  className="flex justify-center mt-4"
  style={{ gap: "48px" }}          // 👈 separación forzada entre items (override)
>
  <a
    href="https://github.com/paupedrejon"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="GitHub"
    className="inline-flex items-center justify-center rounded-full"
    style={{
      width: 25,                   // 56px de caja para el icono
      height: 25,
      padding: 5,                  // algo de padding interno
    }}
  >
    <FaGithub
      size={25}
      className="text-[#575757] hover:text-black transition-colors duration-200"
    />
  </a>

  <a
    href="https://es.linkedin.com/in/pau-pedrejon-sobrino-0b5643380"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="LinkedIn"
    className="inline-flex items-center justify-center rounded-full"
    style={{ width: 25, height: 25, padding: 5 }}
  >
    <FaLinkedin
      size={25}
      className="text-[#575757] hover:text-blue-600 transition-colors duration-200"
    />
  </a>

  <a
    href="mailto:paupedrejon@gmail.com"
    aria-label="Email"
    className="inline-flex items-center justify-center rounded-full"
    style={{ width: 25, height: 25, padding: 5 }}
  >
    <AiOutlineMail
      size={25}
      className="text-[#575757] hover:text-red-600 transition-colors duration-200"
    />
  </a>
</div>




</div>


  
</section>

</body>

    </html>
  );
}
