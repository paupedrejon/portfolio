"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { HiHome, HiKey, HiUserCircle } from "react-icons/hi2";
import {
  getStoredAPIKeys,
  hasConfiguredProviderKeys,
  openAPIKeyModal,
} from "@/lib/study-agents/api-keys";
import StudyAgentsBotAvatar from "@/components/study-agents/StudyAgentsBotAvatar";
import { SA_PRIMARY, SA_PRIMARY_BRIGHT } from "@/lib/study-agents/brand";
import "@/components/study-agents/study-agents-bot.css";
import "@/components/study-agents/study-agents-chat.css";

export default function StudyAgentsNav() {
  const { data: session } = useSession();
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const sync = () => setHasApiKey(hasConfiguredProviderKeys(getStoredAPIKeys()));
    sync();
    window.addEventListener("apiKeysUpdated", sync);
    return () => window.removeEventListener("apiKeysUpdated", sync);
  }, []);

  return (
    <div
      className="sa-nav"
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
        borderRadius: "50px",
        backdropFilter: "blur(20px)",
      }}
    >
      <Link
        href="/study-agents"
        title="Study Agents"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: "50%",
          textDecoration: "none",
          background: "rgba(53, 140, 159, 0.18)",
          border: "1px solid rgba(53, 140, 159, 0.4)",
        }}
      >
        <StudyAgentsBotAvatar size={26} color={SA_PRIMARY_BRIGHT} state="idle" />
      </Link>

      <Link
        href="/"
        title="Volver al portfolio"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: "50%",
          color: "rgba(255,255,255,0.75)",
          textDecoration: "none",
          background: "rgba(255, 255, 255, 0.06)",
          border: "1px solid rgba(53, 140, 159, 0.3)",
        }}
      >
        <HiHome size={20} />
      </Link>

      <button
        type="button"
        onClick={openAPIKeyModal}
        title={hasApiKey ? "Cambiar API Key" : "Configurar API Key"}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          height: 40,
          padding: "0 0.9rem",
          borderRadius: 20,
          cursor: "pointer",
          fontSize: "0.8rem",
          fontWeight: 600,
          color: hasApiKey ? "#86efac" : SA_PRIMARY_BRIGHT,
          background: hasApiKey ? "rgba(34, 197, 94, 0.12)" : "rgba(53, 140, 159, 0.16)",
          border: hasApiKey
            ? "1px solid rgba(34, 197, 94, 0.35)"
            : "1px solid rgba(53, 140, 159, 0.4)",
        }}
      >
        <HiKey size={16} />
        {hasApiKey ? "API Key" : "Configurar API"}
      </button>

      {session?.user && (
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/auth/signin", redirect: true })}
          title={session.user.email ?? "Cerrar sesión"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: "50%",
            cursor: "pointer",
            color: "rgba(255,255,255,0.75)",
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(53, 140, 159, 0.3)",
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
