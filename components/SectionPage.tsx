// components/SectionPage.tsx
import { ReactNode } from "react";
import { Poppins, Open_Sans, Roboto } from "next/font/google";

export const poppins = Poppins({ subsets: ["latin"], weight: ["600", "700", "800"] });
export const openSans = Open_Sans({ subsets: ["latin"], weight: ["400", "600"] });
export const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"] });

type Align = "center" | "left" | "right";

interface SectionPageProps {
  id?: string;
  title: ReactNode;
  title2?: ReactNode;
  subtitle?: ReactNode;
  /** Puedes pasar "/portada.png", "portada.png", "url(/portada.png)" o una URL absoluta */
  background: string;
  /** 0..1 intensidad del oscurecido */
  darken?: number;
  /** Usa degradado en vez de overlay sólido */
  gradient?: boolean;
  ctaText?: string;
  ctaHref?: string;
  align?: Align;
  className?: string;
  kicker?: string;
}

export default function SectionPage({
  id,
  title,
  title2,
  subtitle,
  background,
  darken = 0.8,      // más oscurito por defecto
  gradient = false,  // overlay sólido por defecto
  ctaText,
  ctaHref,
  align = "center",
  className = "",
  kicker,
}: SectionPageProps) {
  // Normaliza la ruta del fondo y envuélvela en url(...)
  let bg = background.trim();
  const isUrlWrapped = bg.startsWith("url(");
  const isAbsolute = /^https?:\/\//i.test(bg);
  if (!isUrlWrapped) {
    if (!isAbsolute && !bg.startsWith("/")) bg = "/" + bg;
    bg = `url(${bg})`;
  }

  const justifyMap: Record<Align, string> = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  };
  const textMap: Record<Align, string> = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  // clamp de darken a [0,1]
  const overlayOpacity = Math.max(0, Math.min(1, darken));

  return (
    <section
      id={id}
      className={`relative w-full overflow-hidden flex items-center ${justifyMap[align]} ${className}`}
      style={{
        minHeight: "92vh",
        backgroundImage: bg,
        backgroundSize: "cover",
        backgroundPosition: "50% 30%",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay: sólido con opacity (fiable) o degradado opcional */}
      {gradient ? (
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: `linear-gradient(rgba(0,0,0,${Math.min(
              1,
              overlayOpacity + 0.15
            )}), rgba(0,0,0,${overlayOpacity}))`,
          }}
        />
      ) : (
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            backgroundColor: "#000",
            opacity: overlayOpacity,
          }}
        />
      )}

       {/* Oscurecedor */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 1,
          }}
        />

      {/* Contenido */}
      <div className={`relative z-20 container mx-auto px-4 ${textMap[align]}`}>
        <div className="max-w-5xl">
          {kicker && (
            <p
              className={`${roboto.className} text-indigo-400 tracking-widest text-sm mb-3 font-semibold`}
              style={{ fontSize: "clamp(1rem, 1.2vw, 1.2rem)" }}
            >
              {kicker}
            </p>
          )}

          {/* Título 1 */}
          <h2
            className={`${poppins.className} text-white font-extrabold tracking-wider`}
            style={{
              fontSize: "clamp(3rem, 3vw, 5rem)",
              lineHeight: 0.95,
              marginBottom: 0,
            }}
          >
            {title}
          </h2>

          {/* Título 2 (opcional y muy pegado) */}
          {title2 && (
            <h3
              className={`${poppins.className} text-white font-extrabold tracking-wider`}
              style={{
                fontSize: "clamp(2rem, 2vw, 4rem)",
                lineHeight: 0.95,
                marginTop: "0.25rem",
                marginBottom: 0,
              }}
            >
              {title2}
            </h3>
          )}

          {subtitle && (
            <p className={`${openSans.className} mt-4 text-white/85 text-lg md:text-xl max-w-2xl`}>
              {subtitle}
            </p>
          )}

          {ctaText && ctaHref && (
            <div className="mt-8">
              <a href={ctaHref} className={`${poppins.className} cta-btn`}>
                {ctaText}
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
