"use client";

import { useState, useEffect } from "react";
import { StarIcon } from "./Icons";

interface TopicProgress {
  level: number;
  experience: number;
  exercises_completed?: number;
  tests_completed?: number;
  last_updated?: string;
}

interface ProfileViewProps {
  userId: string;
  colorTheme: "light" | "dark";
  onClose: () => void;
}

export default function ProfileView({ userId, colorTheme, onClose }: ProfileViewProps) {
  const [progress, setProgress] = useState<Record<string, TopicProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [userId]);

  const loadProgress = async () => {
    try {
      console.log(`📊 [ProfileView] Cargando progreso para userId: ${userId}`);
      const response = await fetch("/api/study-agents/get-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      console.log(`📊 [ProfileView] Respuesta HTTP: status=${response.status}, ok=${response.ok}`);
      
      const data = await response.json();
      console.log(`📊 [ProfileView] Datos recibidos:`, data);
      
      if (data.success) {
        setProgress(data.progress || {});
        console.log(`📊 [ProfileView] Progreso establecido:`, data.progress);
      } else {
        console.error(`📊 [ProfileView] Error en respuesta:`, data);
      }
    } catch (error) {
      console.error("📊 [ProfileView] Error loading progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: number) => {
    if (level === 0) return "#94a3b8"; // Gris (no sabe nada)
    if (level <= 3) return "#ef4444"; // Rojo (principiante)
    if (level <= 6) return "#f59e0b"; // Naranja (intermedio)
    if (level <= 9) return "#10b981"; // Verde (avanzado)
    return "#6366f1"; // Azul (experto - nivel 10)
  };

  const getLevelLabel = (level: number) => {
    if (level === 0) return "Sin conocimiento";
    if (level <= 3) return "Principiante";
    if (level <= 6) return "Intermedio";
    if (level <= 9) return "Avanzado";
    return "Experto";
  };

  const getExperienceForNextLevel = (currentLevel: number) => {
    const thresholds = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700];
    if (currentLevel >= 10) return 0;
    return thresholds[currentLevel] || 0;
  };

  const topics = Object.entries(progress).sort((a, b) => {
    // Ordenar por nivel descendente, luego por experiencia
    if (b[1].level !== a[1].level) {
      return b[1].level - a[1].level;
    }
    return b[1].experience - a[1].experience;
  });

  const bgColor = colorTheme === "dark" ? "rgba(26, 26, 36, 0.95)" : "#ffffff";
  const textColor = colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24";
  const secondaryTextColor = colorTheme === "dark" ? "var(--text-secondary)" : "#64748b";
  const borderColor = colorTheme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.3)";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: colorTheme === "dark" ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: "2rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: bgColor,
          borderRadius: "16px",
          padding: "2rem",
          maxWidth: "800px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          border: `1px solid ${borderColor}`,
          boxShadow: colorTheme === "dark"
            ? "0 10px 40px rgba(0, 0, 0, 0.5)"
            : "0 10px 40px rgba(0, 0, 0, 0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: textColor }}>
            Mi Progreso
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: secondaryTextColor,
              cursor: "pointer",
              fontSize: "1.5rem",
              padding: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: secondaryTextColor }}>
            Cargando progreso...
          </div>
        ) : topics.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: secondaryTextColor }}>
            Aún no tienes progreso registrado. ¡Comienza a estudiar para ver tu nivel!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {topics.map(([topic, data]) => {
              const level = data.level || 0;
              const experience = data.experience || 0;
              const nextLevelExp = getExperienceForNextLevel(level);
              const currentLevelExp = level === 0 ? 0 : (level === 1 ? 0 : [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700][level - 1]);
              const progressToNext = level >= 10 ? 100 : nextLevelExp > 0 ? ((experience - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100 : 0;
              
              return (
                <div
                  key={topic}
                  style={{
                    padding: "1.5rem",
                    background: colorTheme === "dark" ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.05)",
                    borderRadius: "12px",
                    border: `1px solid ${borderColor}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600, color: textColor }}>
                      {topic}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: 700,
                          color: getLevelColor(level),
                        }}
                      >
                        {level}/10
                      </span>
                      <StarIcon size={24} color={getLevelColor(level)} />
                    </div>
                  </div>

                  <div style={{ marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.875rem", color: secondaryTextColor }}>
                        {getLevelLabel(level)}
                      </span>
                      <span style={{ fontSize: "0.875rem", color: secondaryTextColor }}>
                        {experience} XP
                      </span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "8px",
                        background: colorTheme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.3)",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(progressToNext, 100)}%`,
                          height: "100%",
                          background: getLevelColor(level),
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "1rem", fontSize: "0.875rem", color: secondaryTextColor }}>
                    {data.exercises_completed !== undefined && (
                      <span>Ejercicios: {data.exercises_completed}</span>
                    )}
                    {data.tests_completed !== undefined && (
                      <span>Tests: {data.tests_completed}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

