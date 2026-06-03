"use client";

import { useTranslations } from "next-intl";
import {
  EgoFeatureIcon,
  EgoPillarIcon,
  EgoTechIcon,
  IconGit,
  IconUsers,
  type FeatureIconKey,
  type PillarIconKey,
  type TechIconKey,
} from "./EgoIcons";

const ACCENT = "#4eb3c8";
const SECTION = {
  padding: "clamp(2.75rem, 8vw, 7rem) clamp(1rem, 4vw, 4rem)",
  maxWidth: 1200,
  margin: "0 auto",
  width: "100%",
  boxSizing: "border-box" as const,
} as const;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.72rem",
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: ACCENT,
        marginBottom: "0.65rem",
      }}
    >
      {children}
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: "\"Lulo Clean\", \"Bebas Neue\", var(--font-league-spartan), sans-serif",
        fontSize: "clamp(2.25rem, 5.5vw, 3.5rem)",
        letterSpacing: "0.03em",
        lineHeight: 1.05,
        marginBottom: "0.35rem",
      }}
    >
      {children}
    </h2>
  );
}

function VisualCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <article
      style={{
        padding: "clamp(1.25rem, 3vw, 1.75rem)",
        borderRadius: "16px",
        border: "1px solid rgba(78, 179, 200, 0.22)",
        background: "linear-gradient(160deg, rgba(53, 140, 159, 0.12) 0%, rgba(255,255,255,0.02) 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "0.85rem",
        ...style,
      }}
    >
      {children}
    </article>
  );
}

function IconBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: "14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(78, 179, 200, 0.15)",
        color: "#5eead4",
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

const FEATURE_KEYS: FeatureIconKey[] = [
  "map",
  "route",
  "search",
  "report",
  "favorites",
  "premium",
  "ranking",
  "events",
  "i18n",
  "vehicle",
  "ai",
  "accessibility",
];

const PILLAR_KEYS: PillarIconKey[] = ["stations", "routes", "gamification", "rewards"];

const TECH_KEYS: TechIconKey[] = ["client", "server", "cloud", "quality"];

export default function EgoPageSections() {
  const tAbout = useTranslations("egoPage.about");
  const tFeatures = useTranslations("egoPage.features");
  const tTech = useTranslations("egoPage.tech");
  const tMethod = useTranslations("egoPage.methodology");

  return (
    <>
      <section id="about" style={{ ...SECTION, borderTop: "1px solid rgba(78, 179, 200, 0.12)" }}>
        <SectionLabel>{tAbout("label")}</SectionLabel>
        <SectionTitle>{tAbout("title")}</SectionTitle>
        <p
          style={{
            fontSize: "clamp(1.1rem, 2vw, 1.35rem)",
            color: "rgba(255,255,255,0.7)",
            maxWidth: 520,
            marginBottom: "2.5rem",
            lineHeight: 1.4,
          }}
        >
          {tAbout("tagline")}
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem",
          }}
        >
          {PILLAR_KEYS.map((key) => {
            const pillars = tAbout.raw("pillars") as Record<
              PillarIconKey,
              { title: string; desc: string }
            >;
            const { title, desc } = pillars[key];
            return (
              <VisualCard key={key}>
                <IconBox>
                  <EgoPillarIcon name={key} width={28} height={28} />
                </IconBox>
                <div>
                  <h3 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.25rem" }}>{title}</h3>
                  <p style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.55)", margin: 0 }}>{desc}</p>
                </div>
              </VisualCard>
            );
          })}
        </div>
      </section>

      <section
        id="features"
        style={{
          ...SECTION,
          background: "rgba(0,0,0,0.35)",
        }}
      >
        <SectionLabel>{tFeatures("label")}</SectionLabel>
        <SectionTitle>{tFeatures("title")}</SectionTitle>
        <div className="ego-features-grid" style={{ marginTop: "2rem" }}>
          {FEATURE_KEYS.map((key) => {
            const items = tFeatures.raw("items") as Record<FeatureIconKey, { title: string; desc: string }>;
            const { title, desc } = items[key];
            return (
              <VisualCard key={key} style={{ alignItems: "center", textAlign: "center" }}>
                <IconBox>
                  <EgoFeatureIcon name={key} width={26} height={26} />
                </IconBox>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>{title}</h3>
                <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.35 }}>
                  {desc}
                </p>
              </VisualCard>
            );
          })}
        </div>
        <style jsx>{`
          .ego-features-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.85rem;
          }
          @media (min-width: 640px) {
            .ego-features-grid {
              grid-template-columns: repeat(3, 1fr);
              gap: 1rem;
            }
          }
          @media (min-width: 1024px) {
            .ego-features-grid {
              grid-template-columns: repeat(6, 1fr);
            }
          }
        `}</style>
      </section>

      <section id="tech" style={SECTION}>
        <SectionLabel>{tTech("label")}</SectionLabel>
        <SectionTitle>{tTech("title")}</SectionTitle>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1rem",
            marginTop: "2rem",
          }}
        >
          {TECH_KEYS.map((key) => {
            const blocks = tTech.raw("blocks") as Record<TechIconKey, { title: string; pills: string[] }>;
            const { title, pills } = blocks[key];
            return (
              <VisualCard key={key}>
                <IconBox>
                  <EgoTechIcon name={key} width={28} height={28} />
                </IconBox>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>{title}</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {pills.map((pill) => (
                    <span
                      key={pill}
                      style={{
                        fontSize: "0.78rem",
                        fontFamily: "var(--font-mono)",
                        padding: "0.35rem 0.65rem",
                        borderRadius: "6px",
                        background: "rgba(78, 179, 200, 0.12)",
                        color: "rgba(255,255,255,0.75)",
                        border: "1px solid rgba(78, 179, 200, 0.2)",
                      }}
                    >
                      {pill}
                    </span>
                  ))}
                </div>
              </VisualCard>
            );
          })}
        </div>
      </section>

      <section
        id="methodology"
        style={{
          ...SECTION,
          paddingBottom: "clamp(5rem, 12vw, 8rem)",
        }}
      >
        <SectionLabel>{tMethod("label")}</SectionLabel>
        <SectionTitle>{tMethod("title")}</SectionTitle>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            marginTop: "2rem",
          }}
        >
          {(tMethod.raw("tags") as { label: string; icon: "team" | "git" }[]).map(({ label, icon }) => (
            <span
              key={label}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.65rem 1.1rem",
                borderRadius: "12px",
                fontSize: "0.95rem",
                fontWeight: 600,
                background: "rgba(78, 179, 200, 0.1)",
                color: "rgba(255,255,255,0.9)",
                border: "1px solid rgba(78, 179, 200, 0.22)",
              }}
            >
              {icon === "team" ? (
                <IconUsers width={18} height={18} style={{ color: ACCENT }} />
              ) : (
                <IconGit width={18} height={18} style={{ color: ACCENT }} />
              )}
              {label}
            </span>
          ))}
        </div>
      </section>
    </>
  );
}
