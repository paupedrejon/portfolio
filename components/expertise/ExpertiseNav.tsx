"use client";

import { useTranslations } from "next-intl";
import { Fragment, useMemo } from "react";
import { expertiseAreas } from "./data";

export default function ExpertiseNav({
  activeId,
  visible,
}: {
  activeId: string;
  visible: boolean;
}) {
  const t = useTranslations("expertise");
  const tHome = useTranslations("home");

  const navItems = useMemo(
    () => [
      ...expertiseAreas.map((a) => ({ id: a.id, label: t(a.titleKey) })),
      { id: "explore", label: tHome("exploreWork") },
    ],
    [t, tHome],
  );

  const scrollTo = (id: string) => {
    const el =
      id === "explore"
        ? document.getElementById("explore-section")
        : document.getElementById(`section-${id}`);
    if (!el) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
  };

  return (
    <nav
      aria-label="Expertise sections"
      style={{
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        display: "flex",
        alignItems: "flex-start",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 0.3s",
      }}
    >
      {navItems.map((item, i) => (
        <Fragment key={item.id}>
          {i > 0 && (
            <div
              style={{
                width: "52px",
                height: "1px",
                background: "rgba(255,255,255,0.3)",
                flexShrink: 0,
                alignSelf: "flex-start",
                marginTop: "6px",
              }}
            />
          )}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              aria-label={item.label}
              aria-current={activeId === item.id ? true : undefined}
              onClick={() => scrollTo(item.id)}
              style={{
                width: "12px",
                height: "12px",
                border: `1px solid ${activeId === item.id ? "#ffffff" : "rgba(255,255,255,0.4)"}`,
                background: activeId === item.id ? "#ffffff" : "transparent",
                transform: "rotate(45deg)",
                cursor: "pointer",
                flexShrink: 0,
                transition: "all 0.3s",
                padding: 0,
              }}
            />
            <button
              type="button"
              onClick={() => scrollTo(item.id)}
              style={{
                marginTop: "10px",
                color: activeId === item.id ? "#ffffff" : "rgba(255,255,255,0.35)",
                fontWeight: activeId === item.id ? 700 : 400,
                fontSize: "10px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontFamily: "Inter, sans-serif",
                cursor: "pointer",
                whiteSpace: "nowrap",
                padding: "0 6px",
                transition: "all 0.3s",
                background: "none",
                border: "none",
              }}
            >
              {item.label}
            </button>
          </div>
        </Fragment>
      ))}
    </nav>
  );
}
