"use client";

import { spaceGrotesk, outfit, jetbrainsMono } from "../fonts";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import CoursesMenu from "@/components/CoursesMenu";

export default function StudyAgentsPage() {
  const [mounted, setMounted] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showAPIKeyModal, setShowAPIKeyModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Escuchar eventos de cuando se abre/cierra el modal de API keys
  useEffect(() => {
    const handleAPIKeyModalChange = (e: CustomEvent) => {
      setShowAPIKeyModal(e.detail.isOpen);
    };

    window.addEventListener('apiKeyModalChange', handleAPIKeyModalChange as EventListener);
    return () => {
      window.removeEventListener('apiKeyModalChange', handleAPIKeyModalChange as EventListener);
    };
  }, []);

  // Redirigir a login si no está autenticado (solo una vez)
  useEffect(() => {
    if (status === "unauthenticated" && mounted) {
      // Evitar loops: solo redirigir si no estamos ya en la página de signin
      if (window.location.pathname !== "/auth/signin") {
        const currentPath = window.location.pathname;
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(currentPath)}`);
      }
    }
  }, [status, router, mounted]);

  // Mostrar loading mientras se verifica la sesión
  if (status === "loading" || !mounted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a1a24 0%, #2d2d44 100%)",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid rgba(99, 102, 241, 0.2)",
            borderTop: "4px solid #6366f1",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style jsx>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  // Si no hay sesión, no renderizar nada (el useEffect redirigirá)
  if (!session) {
    return null;
  }

  return (
    <>
      {/* Courses Menu */}
      <CoursesMenu />
    </>
  );
}
