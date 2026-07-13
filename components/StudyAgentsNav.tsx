"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { HiHome, HiKey, HiUserCircle } from "react-icons/hi2";
import {
  getStoredAPIKeys,
  openAPIKeyModal,
} from "@/lib/study-agents/api-keys";

export default function StudyAgentsNav() {
  const { data: session } = useSession();
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const sync = () => setHasApiKey(!!getStoredAPIKeys()?.openai);
    sync();
    window.addEventListener("apiKeysUpdated", sync);
    return () => window.removeEventListener("apiKeysUpdated", sync);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: "1rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 0.75rem",
        background: "var(--bg-overlay-05, rgba(18, 18, 26, 0.85))",
        border: "1px solid var(--border-overlay-1, rgba(148, 163, 184, 0.2))",
        borderRadius: "50px",
        backdropFilter: "blur(20px)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
      }}
    >
      <Link
        href="/"
        title="Volver al portfolio"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          color: "var(--text-secondary)",
          textDecoration: "none",
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid var(--border-subtle, rgba(148, 163, 184, 0.15))",
        }}
      >
        <HiHome size={20} />
      </Link>

      <button
        type="button"
        onClick={openAPIKeyModal}
        title={hasApiKey ? "Cambiar API Key de OpenAI" : "Configurar API Key de OpenAI"}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          height: "40px",
          padding: "0 0.9rem",
          borderRadius: "20px",
          cursor: "pointer",
          fontSize: "0.8rem",
          fontWeight: 600,
          color: hasApiKey ? "#86efac" : "#fbbf24",
          background: hasApiKey
            ? "rgba(34, 197, 94, 0.12)"
            : "rgba(245, 158, 11, 0.12)",
          border: hasApiKey
            ? "1px solid rgba(34, 197, 94, 0.35)"
            : "1px solid rgba(245, 158, 11, 0.35)",
        }}
      >
        <HiKey size={16} />
        {hasApiKey ? "API Key" : "Configurar API"}
      </button>

      {session?.user && (
        <button
          type="button"
          onClick={() =>
            signOut({ callbackUrl: "/auth/signin", redirect: true })
          }
          title={session.user.email ?? "Cerrar sesión"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            cursor: "pointer",
            color: "var(--text-secondary)",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--border-subtle, rgba(148, 163, 184, 0.15))",
          }}
        >
          {session.user.image ? (
            <img
              src={session.user.image}
              alt=""
              style={{ width: 28, height: 28, borderRadius: "50%" }}
            />
          ) : (
            <HiUserCircle size={22} />
          )}
        </button>
      )}
    </div>
  );
}
