"use client";

interface SkillCardProps {
  skill: { name: string; category: string; icon: string; description: string; abbreviation?: string };
  onOpen: (skill: { name: string; category: string; icon: string; description: string; abbreviation?: string }) => void;
}

export function SkillCard({ skill, onOpen }: SkillCardProps) {
  return (
    <div
      className="skill-card-responsive"
      onClick={() => onOpen(skill)}
      onMouseEnter={(e) => {
        const card = e.currentTarget;
        card.style.transform = "scale(1.04)";
        card.style.borderColor = "rgba(139,92,246,0.6)";
        card.style.boxShadow = "0 0 30px rgba(139,92,246,0.2)";
      }}
      onMouseLeave={(e) => {
        const card = e.currentTarget;
        card.style.transform = "scale(1)";
        card.style.borderColor = "rgba(255,255,255,0.08)";
        card.style.boxShadow = "none";
      }}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "space-between",
        padding: "28px 24px",
        height: "210px",
        backgroundColor: "#0c0c14",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "20px",
        cursor: "pointer",
        overflow: "hidden",
        transition: "transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
      }}
    >
      {/* Animated glow blob */}
      <div
        style={{
          position: "absolute",
          bottom: "-30px",
          right: "-30px",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)",
          filter: "blur(20px)",
          pointerEvents: "none",
        }}
      />

      {/* Icon wrapper (top-left) */}
      <div
        style={{
          width: "88px",
          height: "88px",
          backgroundColor: "rgba(139,92,246,0.12)",
          border: "1px solid rgba(139,92,246,0.25)",
          borderRadius: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        {skill.icon ? (
          <img
            src={skill.icon}
            alt={skill.name}
            style={{
              width: "52px",
              height: "52px",
              objectFit: "contain",
              filter: "brightness(0) invert(1)",
            }}
          />
        ) : (
          <span
            style={{
              color: "white",
              fontSize: "16px",
              fontWeight: "800",
              letterSpacing: "-0.5px",
            }}
          >
            {skill.abbreviation}
          </span>
        )}
      </div>

      {/* Bottom: name + category */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            color: "white",
            fontWeight: "700",
            fontSize: "19px",
            marginBottom: "6px",
            letterSpacing: "-0.3px",
          }}
        >
          {skill.name}
        </div>
        <div
          style={{
            color: "rgba(139,92,246,0.75)",
            fontSize: "11px",
            letterSpacing: "2.5px",
            textTransform: "uppercase",
            fontWeight: "500",
          }}
        >
          {skill.category}
        </div>
      </div>
    </div>
  );
}
