"use client";

import { useEffect, useState, useMemo, cloneElement, isValidElement } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import ScrollButton from "@/components/ScrollButton";
import CurriculumButton from "@/components/CurriculumButton";
import { FaBriefcase } from "react-icons/fa";
import { leagueSpartan } from "@/app/fonts";

const Prism = dynamic(() => import("@/components/Prism"), { ssr: false });

const GRADIENT = "linear-gradient(135deg, #6366f1, #8b5cf6)";

type WorkBlock = {
  title: string;
  points: string[];
};

type OwiusItem = {
  title: string;
  company: string;
  years: string;
  summary: string;
  workBlocksTitle: string;
  workBlocks: WorkBlock[];
};

export default function ExperiencePage() {
  const t = useTranslations("experience");
  const [mounted, setMounted] = useState(false);
  const [hoveredExp, setHoveredExp] = useState<number | null>(null);
  const [isNarrow, setIsNarrow] = useState(false);

  const owius = t.raw("items.owius") as OwiusItem;

  const experienceItems = useMemo(
    () => [
      {
        icon: <FaBriefcase size={24} />,
        title: owius.title,
        company: owius.company,
        description: owius.summary,
        workBlocksTitle: owius.workBlocksTitle,
        workBlocks: owius.workBlocks,
        years: owius.years,
        gradient: GRADIENT,
      },
    ],
    [owius]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <>
      <style jsx>{`
        @media (max-width: 639px) {
          :global(.exp-page .hero-title) {
            font-size: clamp(2rem, 12vw, 3rem) !important;
            line-height: 1.05;
            padding-left: 0.25rem;
            padding-right: 0.25rem;
          }
        }
      `}</style>
      <section
        className="hero-section exp-page w-full max-w-[100vw] overflow-x-hidden"
        style={{
          position: "relative",
          overflow: "hidden",
          background: "#000000",
        }}
      >
        <div
          className="min-h-[min(85vh,560px)] sm:min-h-[600px]"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            zIndex: 0,
          }}
        >
          <Prism
            animationType="rotate"
            timeScale={0.5}
            height={3.5}
            baseWidth={5.5}
            scale={3.6}
            hueShift={0}
            colorFrequency={1}
            noise={0}
            glow={1}
          />
        </div>

        <div
          className={
            "relative z-10 flex w-full min-w-0 max-w-full flex-col items-center text-center px-4 sm:px-6 " +
            (mounted ? "opacity-100" : "opacity-0")
          }
          style={{ transition: "opacity 0.8s ease-out" }}
        >
          <div
            className={mounted ? "animate-fade-in-up" : ""}
            style={{
              fontFamily: "var(--font-mono)",
              animationDelay: "0.1s",
              animationFillMode: "both",
              marginBottom: "1.5rem",
            }}
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
                color: "rgba(139, 92, 246, 0.9)",
                background:
                  "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
                border: "1px solid rgba(99, 102, 241, 0.2)",
                borderRadius: "50px",
                backdropFilter: "blur(10px)",
                boxShadow:
                  "0 4px 20px rgba(245, 158, 11, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <span style={{ position: "relative", zIndex: 1 }}>{t("badge")}</span>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent)",
                  animation: "shimmer 3s ease-in-out infinite",
                }}
              />
            </div>
          </div>

          <h1
            className={leagueSpartan.className + " hero-title " + (mounted ? "animate-fade-in-up" : "")}
            style={{
              animationDelay: "0.2s",
              animationFillMode: "both",
            }}
          >
            <span style={{ color: "#ffffff" }}>{t("title")}</span>
          </h1>

          <p
            className={
              "hero-tagline mx-auto max-w-[min(36rem,100%)] text-balance px-1 text-sm sm:text-base " +
              (mounted ? "animate-fade-in-up" : "")
            }
            style={{
              fontFamily: "var(--font-body)",
              color: "rgba(255, 255, 255, 0.85)",
              animationDelay: "0.3s",
              animationFillMode: "both",
            }}
          >
            {t("tagline")}
          </p>

          <div
            className={"flex flex-wrap gap-4 justify-center mt-8 " + (mounted ? "animate-fade-in-up" : "")}
            style={{ animationDelay: "0.4s", animationFillMode: "both" }}
          >
            <CurriculumButton href="/PauPedrejonCV.pdf" />
          </div>

          <div
            className={"scroll-wrap " + (mounted ? "animate-fade-in" : "")}
            style={{ animationDelay: "0.6s", animationFillMode: "both", marginTop: "3rem" }}
          >
            <ScrollButton
              targetId="experience"
              color="transparent"
              iconColor="rgba(255, 255, 255, 0.9)"
            />
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "120px",
            background: "linear-gradient(to top, #0a0a0f 0%, transparent 100%)",
            pointerEvents: "none",
            zIndex: 5,
          }}
        />
      </section>

      <section
        id="experience"
        className="w-full max-w-[100vw] overflow-x-hidden py-12 sm:py-16 lg:py-20"
        style={{
          background: "#0a0a0f",
          paddingLeft: "max(1rem, env(safe-area-inset-left))",
          paddingRight: "max(1rem, env(safe-area-inset-right))",
        }}
      >
        <div className="mx-auto w-full max-w-[800px] min-w-0 px-0 sm:px-2">
          <div className="mb-10 text-center sm:mb-14">
            <p
              className="mx-auto max-w-[min(100%,20rem)] text-balance"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(139, 92, 246, 0.95)",
                marginBottom: "0.75rem",
              }}
            >
              {t("timeline.kicker")}
            </p>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
                fontWeight: 700,
                color: "#f8fafc",
              }}
            >
              {t("timeline.title")}
            </h2>
          </div>

          <div
            className="relative mx-auto w-full max-w-[700px] min-w-0"
            style={{ position: "relative" }}
          >
            <div
              className="hidden sm:block"
              style={{
                position: "absolute",
                left: "2rem",
                top: 0,
                bottom: 0,
                width: "2px",
                background: "linear-gradient(180deg, var(--accent-primary), var(--accent-secondary))",
                opacity: 0.3,
              }}
            />

            {experienceItems.map((item, index) => (
              <div
                key={index}
                onMouseEnter={() => setHoveredExp(index)}
                onMouseLeave={() => setHoveredExp(null)}
                className="relative mb-6 pl-0 sm:mb-8 sm:pl-20"
                style={{ position: "relative" }}
              >
                <div
                  className="hidden sm:block"
                  style={{
                    position: "absolute",
                    left: "1.5rem",
                    top: "1.5rem",
                    width: "1rem",
                    height: "1rem",
                    borderRadius: "50%",
                    background: hoveredExp === index ? item.gradient : "rgba(139, 92, 246, 0.9)",
                    border: "3px solid #12121a",
                    zIndex: 2,
                    transition: "all 0.3s ease",
                    transform: hoveredExp === index ? "scale(1.3)" : "scale(1)",
                    boxShadow:
                      hoveredExp === index ? "0 0 20px rgba(99, 102, 241, 0.45)" : "none",
                  }}
                />

                <div
                  style={{
                    position: "relative",
                    display: "block",
                    padding: "clamp(1.1rem, 4vw, 1.75rem) clamp(1rem, 4vw, 2rem)",
                    borderRadius: "clamp(14px, 3vw, 20px)",
                    background: "rgba(26, 26, 36, 0.9)",
                    border:
                      "1px solid " +
                      (hoveredExp === index ? "rgba(139, 92, 246, 0.5)" : "rgba(255, 255, 255, 0.08)"),
                    backdropFilter: "blur(20px)",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform:
                      hoveredExp === index && !isNarrow
                        ? "translateX(10px) scale(1.02)"
                        : "translateX(0) scale(1)",
                    boxShadow:
                      hoveredExp === index
                        ? "0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.3)"
                        : "0 10px 30px -10px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: item.gradient,
                      opacity: hoveredExp === index ? 0.1 : 0,
                      borderRadius: "20px",
                      transition: "opacity 0.4s ease",
                      pointerEvents: "none",
                    }}
                  />

                  <div
                    className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5"
                    style={{
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    <div
                      className="shrink-0"
                      style={{
                        width: "clamp(48px, 12vw, 56px)",
                        height: "clamp(48px, 12vw, 56px)",
                        borderRadius: "14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: hoveredExp === index ? item.gradient : "rgba(139, 92, 246, 0.2)",
                        color: hoveredExp === index ? "white" : "rgba(139, 92, 246, 0.95)",
                        transition: "all 0.4s ease",
                        transform:
                          hoveredExp === index && !isNarrow
                            ? "rotate(-5deg) scale(1.1)"
                            : "rotate(0) scale(1)",
                        boxShadow: hoveredExp === index ? "0 10px 25px rgba(139, 92, 246, 0.4)" : "none",
                      }}
                    >
                      {isValidElement(item.icon)
                        ? cloneElement(item.icon as React.ReactElement<{ size?: number }>, {
                            size: isNarrow ? 20 : 24,
                          })
                        : item.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3
                        className="text-balance"
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "clamp(1.05rem, 4vw, 1.25rem)",
                          fontWeight: 700,
                          color: "#f8fafc",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {item.title}
                      </h3>
                      <p
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "0.95rem",
                          color: "rgba(139, 92, 246, 0.95)",
                          fontWeight: 600,
                          marginBottom: "0.75rem",
                        }}
                      >
                        {item.company}
                      </p>
                      <div
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "clamp(0.85rem, 3.2vw, 0.9rem)",
                          color: "#94a3b8",
                          lineHeight: 1.75,
                          marginBottom: "1.25rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.65rem",
                        }}
                      >
                        {item.description.split("\n\n").map((para, i) => (
                          <p key={i} style={{ margin: 0 }}>
                            {para}
                          </p>
                        ))}
                      </div>
                      <p
                        className="text-balance"
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "clamp(0.62rem, 2.5vw, 0.7rem)",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "rgba(139, 92, 246, 0.85)",
                          marginBottom: "0.85rem",
                          fontWeight: 600,
                        }}
                      >
                        {item.workBlocksTitle}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "1.1rem",
                          marginBottom: "1.25rem",
                        }}
                      >
                        {item.workBlocks.map((block, bi) => (
                          <div
                            key={bi}
                            style={{
                              borderLeft: "2px solid rgba(139, 92, 246, 0.35)",
                              paddingLeft: "clamp(0.65rem, 3vw, 1rem)",
                            }}
                          >
                            <h4
                              className="text-balance"
                              style={{
                                fontFamily: "var(--font-display)",
                                fontSize: "clamp(0.88rem, 3.5vw, 0.95rem)",
                                fontWeight: 700,
                                color: "#e2e8f0",
                                margin: "0 0 0.5rem 0",
                                lineHeight: 1.35,
                              }}
                            >
                              {block.title}
                            </h4>
                            <ul
                              className="pl-4 sm:pl-[1.1rem]"
                              style={{
                                margin: 0,
                                fontFamily: "var(--font-body)",
                                fontSize: "clamp(0.78rem, 2.8vw, 0.8125rem)",
                                color: "#cbd5e1",
                                lineHeight: 1.6,
                              }}
                            >
                              {block.points.map((pt, pi) => (
                                <li key={pi} style={{ marginBottom: "0.3rem" }}>
                                  {pt}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          gap: "0.5rem",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.85rem",
                          color: "#64748b",
                        }}
                      >
                        <span
                          style={{
                            padding: "0.25rem 0.75rem",
                            borderRadius: "100px",
                            background: hoveredExp === index ? item.gradient : "rgba(139, 92, 246, 0.2)",
                            color: hoveredExp === index ? "white" : "rgba(139, 92, 246, 0.95)",
                            fontWeight: 600,
                            transition: "all 0.3s ease",
                          }}
                        >
                          {item.years}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p
            className="mx-auto max-w-[min(520px,100%)] px-2 text-balance text-center"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "clamp(0.72rem, 2.8vw, 0.8rem)",
              color: "#64748b",
              marginTop: "2rem",
              lineHeight: 1.5,
            }}
          >
            {t("yearsFootnote")}
          </p>
        </div>
      </section>
    </>
  );
}
