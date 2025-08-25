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

  /** === HERO (imagen de fondo a pantalla completa) === */
  background?: string;          // "/img.png" | "url(/img.png)" | "https://..."
  darken?: number;              // 0..1 opacidad overlay
  gradient?: boolean;           // overlay degradado en vez de sólido

  /** === SPLIT (fondo sólido + imagen enmarcada) === */
  solidBg?: string;             // activa modo split; default: rgba(220,227,228,1)
  imageCard?: string;           // ruta imagen del marco
  imageSide?: "left" | "right"; // lado de la imagen
  imageMaxW?: string;           // tamaño máx. del marco (CSS)  -> ej: "clamp(280px, 38vw, 560px)"
  imageAspect?: string;         // proporción -> ej: "4/3", "16/10"
  showSeparator?: boolean;
  separatorColor?: string;

  /** Comunes */
  textColor?: string;           // color de títulos y textos; default: "#676767" en split, blanco en hero
  ctaText?: string;
  ctaHref?: string;
  align?: Align;
  className?: string;
  kicker?: string;

  /** Texto intermedio entre título y descripción */
  midText?: ReactNode;         // ← nuevo
  midTextColor?: string;       // ← nuevo
}

const textAlignMap: Record<Align, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export default function SectionPage({
  id,
  title,
  title2,
  subtitle,

  // HERO
  background = "",
  darken = 0.8,
  gradient = false,

  // SPLIT
  solidBg,                                   // si viene -> modo split
  imageCard,
  imageSide = "right",
  imageMaxW = "clamp(280px, 38vw, 560px)",   // 👈 tamaño por defecto más contenido
  imageAspect = "16/10",
  showSeparator = true,
  separatorColor = "#676767",

  // comunes
  textColor,
  ctaText,
  ctaHref,
  align = "center",
  className = "",
  kicker,
  midText,
  midTextColor,
}: SectionPageProps) {
  const useSplit = !!solidBg || !!imageCard;

  // === Normaliza la imagen de fondo (HERO) ===
  let bg = background?.trim() || "";
  if (bg) {
    const isUrlWrapped = bg.startsWith("url(");
    const isAbsolute = /^https?:\/\//i.test(bg);
    if (!isUrlWrapped) {
      if (!isAbsolute && !bg.startsWith("/")) bg = "/" + bg;
      bg = `url(${bg})`;
    }
  }

  // clamp de darken [0,1]
  const overlayOpacity = Math.max(0, Math.min(1, darken));

  // Colores por defecto según modo
  const effectiveTextColor = textColor ?? (useSplit ? "#676767" : "#ffffff");
  const effectiveSolidBg = solidBg ?? "rgba(220, 227, 228, 1)";

  // Bloque reutilizable
  const ContentBlock = (
    <>
      {kicker && (
        <p
          className={`${roboto.className} tracking-widest text-sm mb-3 font-semibold`}
          style={{ color: effectiveTextColor + (useSplit ? "B3" : "CC"), fontSize: "clamp(1rem, 1.2vw, 1.2rem)" }}
        >
          {kicker}
        </p>
      )}

      <h2
        className={`${poppins.className} font-extrabold tracking-wider`}
        style={{
          color: effectiveTextColor,
          fontSize: "clamp(2.4rem, 3vw, 5rem)",
          lineHeight: 0.95,
          marginBottom: 0,
        }}
      >
        {title}
      </h2>

      {title2 && (
        <h3
          className={`${poppins.className} font-extrabold tracking-wider`}
          style={{
            color: effectiveTextColor,
            fontSize: "clamp(1.6rem, 2vw, 4rem)",
            lineHeight: 0.95,
            marginTop: "0.25rem",
            marginBottom: 0,
          }}
        >
          {title2}
        </h3>
      )}

      {midText && (
        <p
          className={`${openSans.className} mt-3 text-lg md:text-xl`}
          style={{
            color: midTextColor ?? effectiveTextColor, // mismo color que el resto o el que pases
            fontWeight: 600,                            // un pelín más grueso que la descripción
          }}
        >
          {midText}
        </p>
      )}

      {subtitle && (
  <p
    className={`${openSans.className} mt-4 text-lg md:text-xl`}
    style={{
      color: effectiveTextColor,   // 👈 ahora usa el color sólido
      maxWidth: "40rem",
      fontWeight: 500,             // opcional: puedes darle un poco más de grosor si lo quieres aún más visible
    }}
  >
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
    </>
  );

  // ================== MODO SPLIT ==================
  if (useSplit) {
    return (
      <section
        id={id}
        className={`relative w-full overflow-hidden ${className}`}
        style={{
          minHeight: "92vh",
          backgroundColor: effectiveSolidBg,
          borderBottom: showSeparator ? `3px solid ${separatorColor}` : "1px solid #676767",

        }}
      >
        <div
          className="relative z-20 w-full max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
          style={{
            paddingInline: "clamp(20px, 5vw, 96px)",
            paddingBlock: "clamp(32px, 8vh, 96px)",
          }}
        >
          {/* Texto */}
          <div className={`${textAlignMap[align]} ${imageSide === "left" ? "order-2 lg:order-2" : "order-1"}`}>
            <div className="max-w-5xl">{ContentBlock}</div>
          </div>

          {/* Imagen enmarcada (más pequeña y configurable) */}
          <div className={`${imageSide === "left" ? "order-1 lg:order-1" : "order-2"} w-full flex justify-center lg:justify-end`}>
            {imageCard && (
              <div
                className="relative overflow-hidden rounded-2xl"
                style={{
                  width: "100%",
                  maxWidth: imageMaxW,                // 👈 controlas tamaño aquí
                  aspectRatio: imageAspect,           // 👈 y proporción aquí
                  boxShadow: "0 20px 50px rgba(0,0,0,.25)",
                  border: "1px solid rgba(0,0,0,.08)",
                  background: "linear-gradient(180deg, rgba(255,255,255,.5), rgba(255,255,255,.2))",
                }}
              >
                <img
                  src={imageCard.startsWith("/") ? imageCard : `/${imageCard}`}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // ================== MODO HERO ==================
  return (
    <section
      id={id}
      className={`relative w-full overflow-hidden flex items-center justify-center ${className}`}
      style={{
        minHeight: "92vh",
        backgroundImage: bg,
        backgroundSize: "cover",
        backgroundPosition: "50% 30%",
        backgroundRepeat: "no-repeat",
        borderBottom: showSeparator ? `1px solid ${separatorColor}` : undefined,
      }}
    >
      {/* Overlay: gradiente o sólido */}
      {gradient ? (
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: `linear-gradient(rgba(0,0,0,${Math.min(1, overlayOpacity + 0.15)}), rgba(0,0,0,${overlayOpacity}))`,
          }}
        />
      ) : (
        <div className="absolute inset-0 z-10 pointer-events-none" style={{ backgroundColor: "#000", opacity: overlayOpacity }} />
      )}

      {/* Oscurecedor extra (lo dejas activo) */}
      <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1 }} />

      {/* Contenido con gutters */}
      <div
        className={`relative z-20 w-full max-w-screen-2xl px-6 md:px-12 lg:px-24
                    flex ${align === "center" ? "justify-center" : align === "left" ? "justify-start" : "justify-end"}`}
      >
        <div className={`max-w-5xl ${textAlignMap[align]}`}
             style={{ color: effectiveTextColor }}>
          {ContentBlock}
        </div>
      </div>
    </section>
  );
}
