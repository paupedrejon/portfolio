"use client";

import { useState } from "react";
import { HiCheck, HiStar } from "react-icons/hi2";

interface SatisfactionFeedbackProps {
  courseId: string;
  userId: string;
  onSubmitted?: () => void;
}

export default function SatisfactionFeedback({ courseId, userId, onSubmitted }: SatisfactionFeedbackProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!rating) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/study-agents/submit-satisfaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          courseId,
          rating,
          comment: comment.trim() || null,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        if (onSubmitted) {
          onSubmitted();
        }
      }
    } catch (error) {
      console.error("Error enviando feedback:", error);
      alert("Error al enviar feedback. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ 
        padding: "3rem 2rem", 
        textAlign: "center",
        background: "rgba(16, 185, 129, 0.1)",
        borderRadius: "16px",
        border: "1px solid rgba(16, 185, 129, 0.3)"
      }}>
        <HiCheck size={64} style={{ 
          margin: "0 auto 1.5rem", 
          color: "#10b981",
          animation: "scaleIn 0.3s ease"
        }} />
        <style jsx>{`
          @keyframes scaleIn {
            0% { transform: scale(0); }
            100% { transform: scale(1); }
          }
        `}</style>
        <h3 style={{ 
          fontSize: "1.5rem", 
          fontWeight: "600", 
          marginBottom: "0.75rem",
          color: "#ffffff"
        }}>
          ¡Gracias por tu feedback!
        </h3>
        <p style={{ 
          color: "rgba(255, 255, 255, 0.7)",
          fontSize: "1rem",
          lineHeight: "1.6"
        }}>
          Tu opinión nos ayuda a mejorar el curso.
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: "2.5rem",
      background: "rgba(255, 255, 255, 0.03)",
      borderRadius: "20px",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      backdropFilter: "blur(10px)"
    }}>
      <h3 style={{ 
        fontSize: "1.75rem", 
        fontWeight: "600", 
        marginBottom: "0.75rem",
        color: "#ffffff",
        textAlign: "center"
      }}>
        ¿Cómo valoras este curso?
      </h3>
      <p style={{ 
        color: "rgba(255, 255, 255, 0.6)", 
        marginBottom: "2.5rem",
        textAlign: "center",
        fontSize: "1rem",
        lineHeight: "1.6"
      }}>
        Tu opinión es muy importante para nosotros. Ayúdanos a mejorar.
      </p>

      <div style={{ 
        display: "flex", 
        gap: "0.75rem", 
        justifyContent: "center", 
        marginBottom: "2.5rem",
        flexWrap: "wrap"
      }}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = rating !== null && star <= rating;
          const isHovered = hoveredStar !== null && star <= hoveredStar;
          const shouldHighlight = isActive || isHovered;

          return (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(null)}
              style={{
                fontSize: "3.5rem",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "0.5rem",
                opacity: shouldHighlight ? 1 : 0.3,
                transform: shouldHighlight ? "scale(1.15)" : "scale(1)",
                transition: "all 0.2s ease",
                filter: shouldHighlight ? "drop-shadow(0 0 20px rgba(255, 215, 0, 0.6))" : "none",
              }}
            >
              <HiStar size={56} color={shouldHighlight ? "#FFD700" : "rgba(255, 255, 255, 0.3)"} />
            </button>
          );
        })}
      </div>

      {rating && (
        <div style={{ textAlign: "center", width: "100%" }}>
          <p style={{ 
            marginBottom: "1.5rem", 
            color: "rgba(255, 255, 255, 0.8)",
            fontSize: "1.1rem",
            fontWeight: "500"
          }}>
            {rating === 1 && "😞 Muy insatisfecho"}
            {rating === 2 && "😐 Insatisfecho"}
            {rating === 3 && "😊 Neutral"}
            {rating === 4 && "😄 Satisfecho"}
            {rating === 5 && "🤩 Muy satisfecho"}
          </p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Escribe un comentario (opcional)..."
            style={{
              width: "100%",
              minHeight: "100px",
              padding: "1rem",
              marginBottom: "1.5rem",
              background: "rgba(255, 255, 255, 0.05)",
              border: "2px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              color: "white",
              fontSize: "1rem",
              fontFamily: "inherit",
              resize: "vertical",
              outline: "none",
              transition: "all 0.2s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: "1rem 2.5rem",
              background: submitting 
                ? "rgba(156, 163, 175, 0.5)" 
                : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              cursor: submitting ? "not-allowed" : "pointer",
              fontWeight: "600",
              fontSize: "1rem",
              boxShadow: submitting 
                ? "none" 
                : "0 4px 20px rgba(99, 102, 241, 0.4)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              if (!submitting) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 30px rgba(99, 102, 241, 0.5)";
              }
            }}
            onMouseLeave={(e) => {
              if (!submitting) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(99, 102, 241, 0.4)";
              }
            }}
          >
            {submitting ? "Enviando..." : "Enviar Feedback"}
          </button>
        </div>
      )}
    </div>
  );
}
