"use client";

import { signIn } from "next-auth/react";
import { spaceGrotesk, outfit } from "@/app/fonts";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SignInContent() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const callbackUrl = searchParams.get("callbackUrl") || "/study-agents";
  const error = searchParams.get("error");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl });
  };

  if (!mounted) {
    return null;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1a1a24 0%, #2d2d44 100%)",
        padding: "2rem",
      }}
    >
      <div
        style={{
          background: "rgba(26, 26, 36, 0.95)",
          borderRadius: "24px",
          padding: "3rem",
          maxWidth: "500px",
          width: "100%",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
          border: "1px solid rgba(99, 102, 241, 0.2)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1
            className={spaceGrotesk.className}
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "0.5rem",
            }}
          >
            Study Agents
          </h1>
          <p
            className={outfit.className}
            style={{
              color: "rgba(226, 232, 240, 0.7)",
              fontSize: "1rem",
            }}
          >
            Inicia sesión para acceder a tu asistente de estudio
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "1rem",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "12px",
              marginBottom: "1.5rem",
              color: "#ef4444",
              fontSize: "0.875rem",
            }}
          >
            Error al iniciar sesión. Por favor, intenta de nuevo.
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          style={{
            width: "100%",
            padding: "1rem 1.5rem",
            background: "white",
            color: "#1a1a24",
            border: "none",
            borderRadius: "12px",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            transition: "all 0.3s ease",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            style={{ flexShrink: 0 }}
          >
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continuar con Google
        </button>

        <p
          style={{
            marginTop: "1.5rem",
            textAlign: "center",
            fontSize: "0.75rem",
            color: "rgba(226, 232, 240, 0.5)",
            lineHeight: 1.6,
          }}
        >
          Al iniciar sesión, aceptas nuestros términos de servicio y política de privacidad.
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a1a24 0%, #2d2d44 100%)",
        }}
      >
        <div style={{ color: "white" }}>Cargando...</div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
