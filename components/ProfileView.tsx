"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface TopicProgress {
  level: number;
  experience: number;
  exercises_completed?: number;
  tests_completed?: number;
  last_updated?: string;
}

interface ProfileViewProps {
  userId: string;
  onClose: () => void;
}

interface UserStats {
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost: number;
  total_requests: number;
  by_model: Record<string, {
    input_tokens: number;
    output_tokens: number;
    cost: number;
    requests: number;
  }>;
}

export default function ProfileView({ userId, onClose }: ProfileViewProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: session } = useSession();
  const [progress, setProgress] = useState<Record<string, TopicProgress>>({});
  const [loading, setLoading] = useState(true);
  const [colorTheme, setColorTheme] = useState<"light" | "dark">("dark");
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  
  // Leer el tema del localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("study_agents_color_theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        setColorTheme(savedTheme);
      }
    }
  }, []);

  useEffect(() => {
    loadProgress();
    loadUserStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
  
  const loadUserStats = async () => {
    try {
      if (!userId || userId.trim() === "") {
        return;
      }
      
      const response = await fetch("/api/study-agents/get-user-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.stats) {
          // Asegurar que los valores numéricos sean números, no strings
          const stats = {
            ...data.stats,
            total_cost: typeof data.stats.total_cost === 'string' 
              ? parseFloat(data.stats.total_cost) 
              : (data.stats.total_cost || 0),
            total_input_tokens: typeof data.stats.total_input_tokens === 'string'
              ? parseInt(data.stats.total_input_tokens)
              : (data.stats.total_input_tokens || 0),
            total_output_tokens: typeof data.stats.total_output_tokens === 'string'
              ? parseInt(data.stats.total_output_tokens)
              : (data.stats.total_output_tokens || 0),
            total_requests: typeof data.stats.total_requests === 'string'
              ? parseInt(data.stats.total_requests)
              : (data.stats.total_requests || 0),
          };
          setUserStats(stats);
        }
      }
    } catch (error) {
      console.error("Error al cargar estadísticas del usuario:", error);
    }
  };
  
  // Recargar estadísticas periódicamente para reflejar cambios
  useEffect(() => {
    if (userId) {
      const statsInterval = setInterval(() => {
        loadUserStats();
      }, 5000); // Actualizar cada 5 segundos
      
      return () => clearInterval(statsInterval);
    }
  }, [userId]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      console.log(`📊 [ProfileView] ========== INICIO CARGA PROGRESO ==========`);
      console.log(`📊 [ProfileView] userId recibido: "${userId}"`);
      console.log(`📊 [ProfileView] Tipo de userId: ${typeof userId}`);
      console.log(`📊 [ProfileView] userId.trim(): "${userId?.trim()}"`);
      
      if (!userId || userId.trim() === "") {
        console.error(`📊 [ProfileView] ❌ userId vacío o inválido: "${userId}"`);
        setProgress({});
        setLoading(false);
        return;
      }
      
      console.log(`📊 [ProfileView] Enviando petición a /api/study-agents/get-progress con userId: "${userId}"`);
      
      const response = await fetch("/api/study-agents/get-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      console.log(`📊 [ProfileView] Respuesta HTTP recibida: status=${response.status}, ok=${response.ok}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`📊 [ProfileView] ❌ Error HTTP: ${response.status}`);
        console.error(`📊 [ProfileView] ❌ Error text: ${errorText}`);
        setProgress({});
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      console.log(`📊 [ProfileView] ========== DATOS RECIBIDOS ==========`);
      console.log(`📊 [ProfileView] data completo:`, JSON.stringify(data, null, 2));
      console.log(`📊 [ProfileView] data.success:`, data.success);
      console.log(`📊 [ProfileView] data.progress:`, data.progress);
      console.log(`📊 [ProfileView] Tipo de data.progress:`, typeof data.progress);
      console.log(`📊 [ProfileView] Es array?:`, Array.isArray(data.progress));
      console.log(`📊 [ProfileView] Keys de data.progress:`, data.progress && typeof data.progress === 'object' ? Object.keys(data.progress) : "N/A");
      console.log(`📊 [ProfileView] Número de keys:`, data.progress && typeof data.progress === 'object' ? Object.keys(data.progress).length : 0);
      
      if (data.success && data.progress) {
        const progressData = data.progress || {};
        console.log(`📊 [ProfileView] Progreso a establecer:`, JSON.stringify(progressData, null, 2));
        console.log(`📊 [ProfileView] Número de temas:`, Object.keys(progressData).length);
        
        // Validar que progressData sea un objeto
        if (typeof progressData === 'object' && !Array.isArray(progressData)) {
          const topicsCount = Object.keys(progressData).length;
          console.log(`📊 [ProfileView] ✅ Progreso válido con ${topicsCount} temas`);
          if (topicsCount > 0) {
            console.log(`📊 [ProfileView] Temas encontrados:`, Object.keys(progressData));
          } else {
            console.warn(`📊 [ProfileView] ⚠️ Progreso vacío - no hay temas registrados`);
          }
          setProgress(progressData);
          console.log(`📊 [ProfileView] ✅ Progreso establecido exitosamente en el estado`);
        } else {
          console.error(`📊 [ProfileView] ❌ progressData no es un objeto válido:`, progressData);
          setProgress({});
        }
      } else {
        console.error(`📊 [ProfileView] ❌ Error en respuesta o datos faltantes:`);
        console.error(`📊 [ProfileView] - data.success:`, data.success);
        console.error(`📊 [ProfileView] - data.progress existe?:`, !!data.progress);
        setProgress({});
      }
      console.log(`📊 [ProfileView] ========== FIN CARGA PROGRESO ==========`);
    } catch (error) {
      console.error("📊 [ProfileView] ❌ Error loading progress:", error);
      if (error instanceof Error) {
        console.error("📊 [ProfileView] Error message:", error.message);
        console.error("📊 [ProfileView] Error stack:", error.stack);
      }
      setProgress({});
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: number) => {
    // Colores diferentes para cada nivel (0-10)
    const colors = [
      "#94a3b8", // 0 - Gris
      "#ef4444", // 1 - Rojo
      "#f97316", // 2 - Naranja oscuro
      "#f59e0b", // 3 - Naranja
      "#eab308", // 4 - Amarillo
      "#84cc16", // 5 - Verde lima
      "#22c55e", // 6 - Verde
      "#10b981", // 7 - Verde esmeralda
      "#06b6d4", // 8 - Cian
      "#3b82f6", // 9 - Azul
      "#6366f1", // 10 - Índigo (experto)
    ];
    return colors[Math.min(level, 10)];
  };
  
  const getLevelGradient = (level: number) => {
    // Gradientes diferentes para cada nivel
    const gradients = [
      "linear-gradient(90deg, #94a3b8 0%, #94a3b8 100%)", // 0
      "linear-gradient(90deg, #ef4444 0%, #f87171 100%)", // 1
      "linear-gradient(90deg, #f97316 0%, #fb923c 100%)", // 2
      "linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)", // 3
      "linear-gradient(90deg, #eab308 0%, #facc15 100%)", // 4
      "linear-gradient(90deg, #84cc16 0%, #a3e635 100%)", // 5
      "linear-gradient(90deg, #22c55e 0%, #4ade80 100%)", // 6
      "linear-gradient(90deg, #10b981 0%, #34d399 100%)", // 7
      "linear-gradient(90deg, #06b6d4 0%, #22d3ee 100%)", // 8
      "linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)", // 9
      "linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)", // 10
    ];
    return gradients[Math.min(level, 10)];
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getLevelLabel = (level: number) => {
    if (level === 0) return "Sin conocimiento";
    if (level <= 3) return "Principiante";
    if (level <= 6) return "Intermedio";
    if (level <= 9) return "Avanzado";
    return "Experto";
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const bgColor = colorTheme === "dark" ? "rgba(26, 26, 36, 0.98)" : "#ffffff";
  const textColor = colorTheme === "dark" ? "#f1f5f9" : "#1a1a24";
  const secondaryTextColor = colorTheme === "dark" ? "#94a3b8" : "#64748b";
  const borderColor = colorTheme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.3)";

  return (
    <div
      className="profile-view-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: colorTheme === "dark" ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "2rem",
        paddingLeft: "calc(280px + 2rem)", // Compensar el sidebar de 280px en desktop
      }}
      onClick={onClose}
    >
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .profile-view-overlay {
            padding-left: 2rem !important;
          }
        }
        @media (min-width: 769px) {
          .profile-view-overlay {
            padding-left: calc(280px + 2rem) !important;
          }
        }
      `}} />
      <div
        className="profile-view-scroll"
        style={{
          background: bgColor,
          borderRadius: "16px",
          padding: "1.5rem",
          maxWidth: "1000px",
          width: "100%",
          maxHeight: "50vh",
          overflowY: "auto",
          overflowX: "hidden",
          border: `1px solid ${borderColor}`,
          boxShadow: colorTheme === "dark"
            ? "0 10px 40px rgba(0, 0, 0, 0.5)"
            : "0 10px 40px rgba(0, 0, 0, 0.2)",
          scrollbarWidth: "thin",
          scrollbarColor: `${colorTheme === "dark" ? "rgba(148, 163, 184, 0.4)" : "rgba(148, 163, 184, 0.5)"} ${colorTheme === "dark" ? "rgba(26, 26, 36, 0.3)" : "rgba(255, 255, 255, 0.3)"}`,
          willChange: "scroll-position",
          WebkitOverflowScrolling: "touch",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style dangerouslySetInnerHTML={{__html: `
          .profile-view-scroll {
            scroll-behavior: smooth;
          }
          .profile-view-scroll::-webkit-scrollbar {
            width: 8px;
          }
          .profile-view-scroll::-webkit-scrollbar-track {
            background: ${colorTheme === "dark" ? "rgba(26, 26, 36, 0.2)" : "rgba(241, 245, 249, 0.4)"};
            border-radius: 8px;
          }
          .profile-view-scroll::-webkit-scrollbar-thumb {
            background: ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.4)" : "rgba(148, 163, 184, 0.5)"};
            border-radius: 8px;
            border: 1px solid ${colorTheme === "dark" ? "rgba(26, 26, 36, 0.2)" : "rgba(255, 255, 255, 0.3)"};
          }
          .profile-view-scroll::-webkit-scrollbar-thumb:hover {
            background: ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.6)" : "rgba(148, 163, 184, 0.7)"};
          }
        `}} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: textColor }}>
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
        
        {/* Estadísticas de Uso */}
        {userStats && (
          <div style={{
            marginBottom: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}>
            {/* Resumen Principal */}
            <div style={{
              padding: "1rem",
              background: colorTheme === "dark" 
                ? "rgba(148, 163, 184, 0.05)" 
                : "rgba(148, 163, 184, 0.03)",
              borderRadius: "12px",
              border: `1px solid ${borderColor}`,
            }}>
              <div style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: secondaryTextColor,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "1rem",
              }}>
                Resumen de Uso
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "1rem",
              }}>
                <div>
                  <div style={{
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    color: secondaryTextColor,
                    marginBottom: "0.25rem",
                  }}>
                    Coste Total
                  </div>
                  <div style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: textColor,
                  }}>
                    ${userStats.total_cost.toFixed(4)}
                  </div>
                </div>
                <div>
                  <div style={{
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    color: secondaryTextColor,
                    marginBottom: "0.25rem",
                  }}>
                    Tokens Entrada
                  </div>
                  <div style={{
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    color: textColor,
                  }}>
                    {userStats.total_input_tokens.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    color: secondaryTextColor,
                    marginBottom: "0.25rem",
                  }}>
                    Tokens Salida
                  </div>
                  <div style={{
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    color: textColor,
                  }}>
                    {userStats.total_output_tokens.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    color: secondaryTextColor,
                    marginBottom: "0.25rem",
                  }}>
                    Total Tokens
                  </div>
                  <div style={{
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    color: textColor,
                  }}>
                    {(userStats.total_input_tokens + userStats.total_output_tokens).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    color: secondaryTextColor,
                    marginBottom: "0.25rem",
                  }}>
                    Solicitudes
                  </div>
                  <div style={{
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    color: textColor,
                  }}>
                    {userStats.total_requests.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    color: secondaryTextColor,
                    marginBottom: "0.25rem",
                  }}>
                    Promedio por Solicitud
                  </div>
                  <div style={{
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    color: textColor,
                  }}>
                    {userStats.total_requests > 0 
                      ? ((userStats.total_input_tokens + userStats.total_output_tokens) / userStats.total_requests).toFixed(0)
                      : "0"}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Desglose por Modelo */}
            {userStats.by_model && Object.keys(userStats.by_model).length > 0 && (
              <div style={{
                padding: "1rem",
                background: colorTheme === "dark" 
                  ? "rgba(148, 163, 184, 0.05)" 
                  : "rgba(148, 163, 184, 0.03)",
                borderRadius: "12px",
                border: `1px solid ${borderColor}`,
              }}>
                <div style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: secondaryTextColor,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "1rem",
                }}>
                  Desglose por Modelo
                </div>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}>
                  {Object.entries(userStats.by_model)
                    .sort(([, a], [, b]) => (b.cost || 0) - (a.cost || 0))
                    .map(([model, stats]: [string, { input_tokens?: number; output_tokens?: number; cost?: number; requests?: number }]) => (
                      <div
                        key={model}
                        style={{
                          padding: "0.75rem",
                          background: colorTheme === "dark"
                            ? "rgba(148, 163, 184, 0.03)"
                            : "rgba(148, 163, 184, 0.02)",
                          borderRadius: "8px",
                          border: `1px solid ${borderColor}`,
                        }}
                      >
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.5rem",
                        }}>
                          <div style={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: textColor,
                          }}>
                            {model}
                          </div>
                          <div style={{
                            fontSize: "0.875rem",
                            fontWeight: 700,
                            color: "#ef4444",
                          }}>
                            ${(stats.cost || 0).toFixed(4)}
                          </div>
                        </div>
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: "0.5rem",
                          fontSize: "0.75rem",
                          color: secondaryTextColor,
                        }}>
                          <div>
                            <span style={{ fontWeight: 500 }}>Entrada:</span> {(stats.input_tokens || 0).toLocaleString()}
                          </div>
                          <div>
                            <span style={{ fontWeight: 500 }}>Salida:</span> {(stats.output_tokens || 0).toLocaleString()}
                          </div>
                          <div>
                            <span style={{ fontWeight: 500 }}>Solicitudes:</span> {(stats.requests || 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div style={{ 
            textAlign: "center", 
            padding: "3rem 2rem", 
            color: secondaryTextColor,
            fontSize: "1rem",
          }}>
            Cargando progreso...
          </div>
        ) : topics.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: "3rem 2rem", 
            color: secondaryTextColor,
            fontSize: "1rem",
          }}>
            Aún no tienes progreso registrado. ¡Comienza a estudiar para ver tu nivel!
          </div>
        ) : (
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: "2rem",
            padding: "1rem 0",
          }}>
            {/* Gráfica de barras horizontales */}
            <div style={{
              position: "relative",
              width: "100%",
              padding: "1rem",
              background: colorTheme === "dark" 
                ? "rgba(148, 163, 184, 0.05)" 
                : "rgba(148, 163, 184, 0.03)",
              borderRadius: "12px",
              border: `1px solid ${borderColor}`,
            }}>
              {/* Eje Y - Temas */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                paddingRight: "0.75rem",
              }}>
                {topics.map(([topic, data]) => {
                  const level = (data && typeof data === 'object' && 'level' in data) ? (data.level || 0) : 0;
                  const barWidth = (level / 10) * 100; // Porcentaje del nivel (0-10 = 0-100%)
                  
                  return (
                    <div
                      key={topic}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        height: "40px",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {/* Etiqueta del tema (eje Y) */}
                      <div style={{
                        minWidth: "180px",
                        maxWidth: "180px",
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        color: textColor,
                        textAlign: "right",
                        paddingRight: "0.75rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {topic}
                      </div>
                      
                      {/* Barra horizontal */}
                      <div style={{
                        flex: 1,
                        position: "relative",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                      }}>
                        {/* Fondo de la barra con líneas de cuadrícula */}
                        <div style={{
                          width: "100%",
                          height: "100%",
                          background: colorTheme === "dark" 
                            ? "rgba(148, 163, 184, 0.1)" 
                            : "rgba(148, 163, 184, 0.08)",
                          borderRadius: "6px",
                          position: "relative",
                          overflow: "hidden",
                          backgroundImage: `repeating-linear-gradient(
                            to right,
                            transparent,
                            transparent calc(20% - 1px),
                            ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.15)"} calc(20% - 1px),
                            ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.15)"} 20%
                          )`,
                        }}>
                          {/* Barra con color según el nivel */}
                          <div
                            style={{
                              width: `${barWidth}%`,
                              height: "100%",
                              background: getLevelGradient(level),
                              borderRadius: "6px",
                              transition: "width 0.5s ease",
                              boxShadow: barWidth > 0 
                                ? colorTheme === "dark"
                                  ? `0 2px 8px ${getLevelColor(level)}40`
                                  : `0 2px 8px ${getLevelColor(level)}30`
                                : "none",
                            }}
                          />
                        </div>
                        
                        {/* Valor del nivel */}
                        <div style={{
                          position: "absolute",
                          left: `${Math.min(barWidth + 2, 92)}%`,
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: barWidth > 85 
                            ? (colorTheme === "dark" ? "#ffffff" : "#1a1a24")
                            : (colorTheme === "dark" ? "var(--text-secondary)" : "#64748b"),
                          paddingLeft: "0.5rem",
                          whiteSpace: "nowrap",
                          background: barWidth > 85 
                            ? "transparent" 
                            : (colorTheme === "dark" 
                                ? "rgba(26, 26, 36, 0.95)" 
                                : "rgba(255, 255, 255, 0.95)"),
                          padding: barWidth > 85 ? "0" : "0.2rem 0.4rem",
                          borderRadius: "4px",
                          border: barWidth > 85 
                            ? "none" 
                            : `1px solid ${colorTheme === "dark" 
                                ? "rgba(148, 163, 184, 0.2)" 
                                : "rgba(148, 163, 184, 0.3)"}`,
                        }}>
                          {level}/10
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Eje X - Escala de niveles */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "1rem",
                paddingLeft: "180px",
                paddingRight: "0",
                fontSize: "0.6875rem",
                color: secondaryTextColor,
                fontWeight: 500,
              }}>
                <span>0</span>
                <span>2</span>
                <span>4</span>
                <span>6</span>
                <span>8</span>
                <span>10</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

