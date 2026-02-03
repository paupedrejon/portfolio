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
    <div style={{ padding: "1.5rem" }}>
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
                gap: "1rem",
                padding: "1rem 1.25rem",
                background: isCurrentUser 
                  ? "rgba(99, 102, 241, 0.1)" 
                  : "var(--bg-card)",
                borderRadius: "12px",
                border: isCurrentUser 
                  ? "1px solid rgba(99, 102, 241, 0.3)" 
                  : "1px solid var(--border-overlay-1)",
                transition: "all 0.2s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                if (!isCurrentUser) {
                  e.currentTarget.style.background = "var(--bg-overlay-04)";
                  e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.2)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isCurrentUser) {
                  e.currentTarget.style.background = "var(--bg-card)";
                  e.currentTarget.style.borderColor = "var(--border-overlay-1)";
                }
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: position <= 3 
                    ? "#6366f1" 
                    : "rgba(99, 102, 241, 0.1)",
                  color: position <= 3 ? "white" : "var(--text-primary)",
                  borderRadius: "12px",
                  fontWeight: "700",
                  fontSize: position <= 3 ? "1.25rem" : "1rem",
                  boxShadow: position <= 3 ? "0 4px 20px rgba(99, 102, 241, 0.3)" : "none",
                  flexShrink: 0,
                  border: position <= 3 ? "none" : "1px solid rgba(99, 102, 241, 0.2)",
                }}
              >
                {medal || position}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  gap: "1rem"
                }}>
                  <span style={{ 
                    fontWeight: isCurrentUser ? "600" : "500", 
                    fontSize: "0.95rem",
                    color: isCurrentUser ? "#6366f1" : "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    {isCurrentUser ? "Tú" : `Usuario ${entry.user_id.substring(0, 8)}...`}
                  </span>
                  <span style={{ 
                    fontSize: "0.8rem", 
                    color: "var(--text-secondary)",
                    whiteSpace: "nowrap"
                  }}>
                    {formatDate(entry.enrolled_at)}
                  </span>
                </div>
              </div>

              <div
                style={{
                  padding: "0.5rem 1rem",
                  background: isCurrentUser 
                    ? "#6366f1" 
                    : "rgba(99, 102, 241, 0.15)",
                  color: "white",
                  borderRadius: "10px",
                  fontSize: "0.875rem",
                  fontWeight: "700",
                  minWidth: "70px",
                  textAlign: "center",
                  boxShadow: isCurrentUser ? "0 4px 15px rgba(99, 102, 241, 0.3)" : "none",
                  flexShrink: 0,
                  border: isCurrentUser ? "none" : "1px solid rgba(99, 102, 241, 0.2)",
                }}
              >
                {entry.xp} XP
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
