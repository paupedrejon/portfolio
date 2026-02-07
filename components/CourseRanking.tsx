"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { TbTrophy } from "react-icons/tb";
import { HiTrophy } from "react-icons/hi2";

interface RankingEntry {
  user_id: string;
  xp: number;
  enrolled_at: string;
}

interface CourseRankingProps {
  courseId: string;
  currentUserId: string;
}

export default function CourseRanking({ courseId, currentUserId }: CourseRankingProps) {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserPosition, setCurrentUserPosition] = useState<number | null>(null);

  useEffect(() => {
    loadRanking();
  }, [courseId]);

  const loadRanking = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/study-agents/get-course-ranking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, limit: 20 }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRanking(data.ranking || []);
          
          // Encontrar posición del usuario actual
          const position = data.ranking.findIndex((entry: RankingEntry) => entry.user_id === currentUserId);
          setCurrentUserPosition(position >= 0 ? position + 1 : null);
        }
      }
    } catch (error) {
      console.error("Error cargando ranking:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMedal = (position: number) => {
    if (position === 1) return <HiTrophy size={20} color="#FFD700" />;
    if (position === 2) return <HiTrophy size={20} color="#C0C0C0" />;
    if (position === 3) return <HiTrophy size={20} color="#CD7F32" />;
    return null;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div style={{ 
        padding: "3rem 2rem", 
        textAlign: "center",
        color: "var(--text-secondary)"
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: "3px solid rgba(99, 102, 241, 0.2)",
          borderTop: "3px solid #6366f1",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto"
        }} />
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (ranking.length === 0) {
    return (
      <div style={{ 
        padding: "3rem 2rem", 
        textAlign: "center",
        color: "var(--text-secondary)"
      }}>
        <TbTrophy size={64} style={{ margin: "0 auto 1rem", color: "var(--text-muted)" }} />
        <p style={{ fontSize: "1rem", color: "var(--text-primary)" }}>Aún no hay participantes en el ranking</p>
        <p style={{ fontSize: "0.85rem", marginTop: "0.5rem", color: "var(--text-secondary)" }}>
          Completa actividades para aparecer aquí
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {ranking.map((entry, index) => {
          const position = index + 1;
          const isCurrentUser = entry.user_id === currentUserId;
          const medal = getMedal(position);

          return (
            <div
              key={entry.user_id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1.25rem",
                padding: "1.25rem 1.75rem",
                background: isCurrentUser 
                  ? "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)" 
                  : "var(--bg-card)",
                borderRadius: "16px",
                border: isCurrentUser 
                  ? "2px solid rgba(99, 102, 241, 0.4)" 
                  : "1px solid var(--border-overlay-1)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "pointer",
                boxShadow: isCurrentUser 
                  ? "0 4px 20px rgba(99, 102, 241, 0.2)" 
                  : "0 2px 8px rgba(0, 0, 0, 0.05)",
              }}
              onMouseEnter={(e) => {
                if (!isCurrentUser) {
                  e.currentTarget.style.background = "var(--bg-overlay-04)";
                  e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.1)";
                } else {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 24px rgba(99, 102, 241, 0.3)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isCurrentUser) {
                  e.currentTarget.style.background = "var(--bg-card)";
                  e.currentTarget.style.borderColor = "var(--border-overlay-1)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.05)";
                } else {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(99, 102, 241, 0.2)";
                }
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: position <= 3 
                    ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" 
                    : "rgba(99, 102, 241, 0.1)",
                  color: position <= 3 ? "white" : "#6366f1",
                  borderRadius: "14px",
                  fontWeight: "700",
                  fontSize: position <= 3 ? "1.5rem" : "1.25rem",
                  boxShadow: position <= 3 ? "0 4px 16px rgba(99, 102, 241, 0.4)" : "none",
                  flexShrink: 0,
                  border: position <= 3 ? "none" : "1px solid rgba(99, 102, 241, 0.2)",
                  transition: "all 0.2s ease",
                }}
              >
                {medal || position}
              </div>

              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  gap: "1rem"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 }}>
                    <span style={{ 
                      fontWeight: isCurrentUser ? "700" : "600", 
                      fontSize: "1.05rem",
                      color: isCurrentUser ? "#6366f1" : "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      {isCurrentUser ? "Tú" : `Usuario ${entry.user_id.substring(0, 8)}...`}
                    </span>
                    {isCurrentUser && (
                      <span style={{
                        padding: "0.25rem 0.75rem",
                        background: "#6366f1",
                        color: "white",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px"
                      }}>
                        Tú
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ 
                      display: "flex", 
                      flexDirection: "column", 
                      alignItems: "flex-end",
                      gap: "0.25rem"
                    }}>
                      <span style={{ 
                        fontSize: "0.875rem", 
                        color: "var(--text-secondary)",
                        whiteSpace: "nowrap",
                        fontWeight: "500"
                      }}>
                        {formatDate(entry.enrolled_at)}
                      </span>
                      <span style={{ 
                        fontSize: "0.75rem", 
                        color: "var(--text-muted)",
                        whiteSpace: "nowrap"
                      }}>
                        Inscrito
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 1rem",
                    background: isCurrentUser 
                      ? "rgba(99, 102, 241, 0.2)" 
                      : "rgba(99, 102, 241, 0.1)",
                    borderRadius: "10px",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                  }}>
                    <TbTrophy size={16} color="#6366f1" />
                    <span style={{
                      color: "#6366f1",
                      fontSize: "0.9rem",
                      fontWeight: "700",
                    }}>
                      {entry.xp} XP
                    </span>
                  </div>
                  <div style={{
                    padding: "0.5rem 1rem",
                    background: "var(--bg-overlay-02)",
                    borderRadius: "10px",
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)",
                    fontWeight: "500",
                  }}>
                    Posición #{position}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {currentUserPosition === null && (
        <div style={{ 
          marginTop: "1.5rem", 
          padding: "1.25rem", 
          background: "var(--bg-card)", 
          borderRadius: "12px", 
          textAlign: "center", 
          fontSize: "0.9rem", 
          color: "var(--text-secondary)",
          border: "1px solid var(--border-overlay-1)"
        }}>
          <p style={{ margin: 0, color: "var(--text-primary)" }}>Completa actividades para aparecer en el ranking</p>
        </div>
      )}
    </div>
  );
}
