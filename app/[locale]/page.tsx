"use client";

import { outfit, jetbrainsMono, leagueSpartan } from "../fonts";
import ScrollButton from "@/components/ScrollButton";
import CurriculumButton from "@/components/CurriculumButton";
import FloatingLines from "@/components/FloatingLines";
import ExpertiseScrolly from "@/components/expertise/ExpertiseScrolly";
import ExploreWorkSection from "@/components/expertise/ExploreWorkSection";
import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const [mounted, setMounted] = useState(false);
  const floatingLinesWaves = useMemo(() => ["top", "middle", "bottom"] as ("top" | "middle" | "bottom")[], []);
  const floatingLinesGradient = useMemo(() => ["#6366f1", "#8b5cf6", "#a855f7"], []);

  const risingLinesConfig = useMemo(
    () =>
      [
        { width: 1.8, height: 245, left: 18, duration: 10.4, delay: 5, color: "139, 92, 246", opacity: 0.33, shadowSize: 13.6 },
        { width: 1.35, height: 154, left: 15, duration: 13.5, delay: 2.9, color: "139, 92, 246", opacity: 0.2, shadowSize: 10.8 },
        { width: 1.66, height: 206, left: 6, duration: 6, delay: 0.7, color: "99, 102, 241", opacity: 0.21, shadowSize: 8.5 },
        { width: 2.68, height: 121, left: 42, duration: 10.5, delay: 2.6, color: "99, 102, 241", opacity: 0.41, shadowSize: 10.2 },
        { width: 1.64, height: 196, left: 19, duration: 13.2, delay: 1.2, color: "139, 92, 246", opacity: 0.54, shadowSize: 7.7 },
        { width: 2.85, height: 286, left: 86, duration: 12.6, delay: 0.7, color: "139, 92, 246", opacity: 0.46, shadowSize: 6.8 },
        { width: 2.99, height: 119, left: 27, duration: 13.6, delay: 4.8, color: "99, 102, 241", opacity: 0.4, shadowSize: 10.1 },
        { width: 2.41, height: 266, left: 27, duration: 6.8, delay: 3, color: "99, 102, 241", opacity: 0.41, shadowSize: 8.5 },
        { width: 1.87, height: 128, left: 36, duration: 9.8, delay: 4.2, color: "139, 92, 246", opacity: 0.49, shadowSize: 13.1 },
        { width: 2.35, height: 110, left: 69, duration: 13.1, delay: 0.7, color: "139, 92, 246", opacity: 0.51, shadowSize: 14.1 },
        { width: 1.47, height: 296, left: 9, duration: 11.3, delay: 1.8, color: "99, 102, 241", opacity: 0.22, shadowSize: 9.3 },
        { width: 2.55, height: 123, left: 53, duration: 9.3, delay: 1.8, color: "139, 92, 246", opacity: 0.4, shadowSize: 13 },
        { width: 1.17, height: 147, left: 18, duration: 12.8, delay: 2.5, color: "99, 102, 241", opacity: 0.29, shadowSize: 9 },
        { width: 1.06, height: 140, left: 98, duration: 7.5, delay: 1.6, color: "139, 92, 246", opacity: 0.35, shadowSize: 5.2 },
        { width: 1.31, height: 293, left: 89, duration: 11.1, delay: 1.9, color: "139, 92, 246", opacity: 0.33, shadowSize: 12.7 },
      ],
    []
  );
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <section
        id="hero-section"
        className="hero-section"
        style={{ position: "relative", overflow: "hidden" }}
      >
        <div className="hero-grid" />
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <FloatingLines
            enabledWaves={floatingLinesWaves}
            lineCount={5}
            lineDistance={5}
            bendRadius={5}
            bendStrength={-0.5}
            interactive={true}
            parallax={true}
            linesGradient={floatingLinesGradient}
            mixBlendMode="screen"
          />
        </div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute rounded-full blur-[120px] opacity-25"
            style={{
              width: "600px",
              height: "600px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              top: "10%",
              left: "20%",
              animation: "floatOrb1 60s ease-in-out infinite",
            }}
          />
          <div
            className="absolute rounded-full blur-[100px] opacity-20"
            style={{
              width: "500px",
              height: "500px",
              background: "linear-gradient(135deg, #a855f7, #6366f1)",
              bottom: "20%",
              right: "15%",
              animation: "floatOrb2 70s ease-in-out infinite reverse",
            }}
          />
          <div
            className="absolute rounded-full blur-[80px] opacity-15"
            style={{
              width: "400px",
              height: "400px",
              background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              animation: "floatOrb3 80s ease-in-out infinite",
            }}
          />
          <div
            className="absolute rounded-full blur-[90px] opacity-18"
            style={{
              width: "450px",
              height: "450px",
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              animation: "floatOrb3 80s ease-in-out infinite",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.08) 0%, transparent 50%)
            `,
            animation: "pulseBg 30s ease-in-out infinite",
          }}
        />
        {risingLinesConfig.map((line, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: `${line.width}px`,
              height: `${line.height}px`,
              background: `linear-gradient(to top, rgba(${line.color}, 0), rgba(${line.color}, ${line.opacity}))`,
              left: `${line.left}%`,
              bottom: "-200px",
              borderRadius: "2px",
              animation: `riseLine ${line.duration}s linear infinite`,
              animationDelay: `${line.delay}s`,
              boxShadow: `0 0 ${line.shadowSize}px rgba(${line.color}, 0.3)`,
            }}
          />
        ))}

        <div
          className={`relative z-10 flex flex-col items-center text-center px-6 ${mounted ? "opacity-100" : "opacity-0"}`}
          style={{ transition: "opacity 0.8s ease-out" }}
        >
          <div
            className={`${jetbrainsMono.className} ${mounted ? "animate-fade-in-up" : ""}`}
            style={{ animationDelay: "0.1s", animationFillMode: "both", marginBottom: "1.5rem" }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1.25rem",
                fontSize: "0.75rem",
                fontWeight: 500,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "rgba(99, 102, 241, 0.9)",
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                borderRadius: "50px",
                backdropFilter: "blur(10px)",
                boxShadow: "0 4px 20px rgba(99, 102, 241, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <span style={{ position: "relative", zIndex: 1 }}>{tCommon("softwareEngineer")}</span>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent)",
                  animation: "shimmer 3s ease-in-out infinite",
                }}
              />
            </div>
          </div>

          <h1
            className={`${leagueSpartan.className} hero-title ${mounted ? "animate-fade-in-up" : ""}`}
            style={{ animationDelay: "0.2s", animationFillMode: "both" }}
          >
            <span style={{ color: "white" }}>{t("title")}</span>
          </h1>

          <p
            className={`${outfit.className} hero-tagline ${mounted ? "animate-fade-in-up" : ""}`}
            style={{ animationDelay: "0.4s", animationFillMode: "both", color: "white" }}
          >
            {t("tagline")}
          </p>

          <div
            className={`flex flex-wrap gap-4 justify-center mt-10 ${mounted ? "animate-fade-in-up" : ""}`}
            style={{ animationDelay: "0.5s", animationFillMode: "both" }}
          >
            <CurriculumButton href="/PauPedrejonCV.pdf" />
          </div>

          <div
            className={`scroll-wrap ${mounted ? "animate-fade-in" : ""}`}
            style={{ animationDelay: "0.8s", animationFillMode: "both", marginTop: "4rem" }}
          >
            <ScrollButton targetId="expertise" color="transparent" iconColor="rgba(255,255,255,0.9)" />
          </div>
        </div>

        <style jsx>{`
          @keyframes floatOrb1 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(60px, -100px) scale(1.1); }
            50% { transform: translate(-40px, 80px) scale(0.9); }
            75% { transform: translate(100px, 50px) scale(1.05); }
          }
          @keyframes floatOrb2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(-80px, -120px) scale(1.15); }
            66% { transform: translate(60px, 100px) scale(0.85); }
          }
          @keyframes floatOrb3 {
            0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
            50% { transform: translate(-50%, -50%) scale(1.2) rotate(180deg); }
          }
          @keyframes riseLine {
            0% { transform: translateY(0); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(calc(-100vh - 200px)); opacity: 0; }
          }
          @keyframes pulseBg {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "280px",
            background: "linear-gradient(to bottom, transparent 0%, rgba(10, 10, 15, 0.5) 40%, #0a0a0f 85%)",
            pointerEvents: "none",
            zIndex: 5,
          }}
        />
      </section>

      <section
        className="relative"
        style={{ background: "#0a0a0f" }}
      >
        <ExpertiseScrolly />
      </section>

      <div id="explore-section">
        <ExploreWorkSection />
      </div>
    </>
  );
}
