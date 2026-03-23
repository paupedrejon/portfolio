"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { useEffect, useMemo, useRef, useState } from "react";
import StudyChat from "@/components/StudyChat";

type BackendMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  type?: string;
  timestamp?: string;
  topic?: string;
};

type PromoChat = {
  chatTitle: string;
  chatId: string;
  topic: string;
  level: number;
  uploadedFiles: string[];
  selectedModel: string;
  messages: BackendMessage[];
};

export default function ExactPromoClient({
  variant,
  userId,
  promoChat,
}: {
  variant: string;
  userId: string;
  promoChat: PromoChat;
}) {
  const [ready, setReady] = useState(false);
  const fakeSession = useMemo(() => {
    // next-auth Session no tipa `user.id` por defecto; lo forzamos sin usar `any`.
    const base = {
      user: {
        id: userId,
        name: "Promo",
        email: "promo@example.com",
      },
      expires: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
    };

    return base as unknown as Session;
  }, [userId]);

  // Instalamos localStorage + mock de fetch ANTES de montar StudyChat.
  const fetchPatchedRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem("study_agents_color_theme", "light");
      localStorage.setItem("study_agents_model", "auto");
      localStorage.setItem(
        "study_agents_api_keys",
        JSON.stringify({ openai: "sk-promo" })
      );
    } catch {
      // ignore
    }

    if (fetchPatchedRef.current) {
      setReady(true);
      return;
    }
    fetchPatchedRef.current = true;

    const originalFetch = window.fetch.bind(window);

    const makeJsonResponse = <T,>(data: T, status = 200) => {
      return Promise.resolve(
        new Response(JSON.stringify(data), {
          status,
          headers: { "Content-Type": "application/json" },
        })
      );
    };

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = (init?.method || "GET").toUpperCase();

      try {
        if (method === "POST" && url.endsWith("/api/study-agents/list-chats")) {
          return makeJsonResponse({
            success: true,
            chats: [{ title: promoChat.chatTitle, chat_id: promoChat.chatId }],
          });
        }

        if (method === "POST" && url.endsWith("/api/study-agents/load-chat")) {
          return makeJsonResponse({
            success: true,
            chat: {
              title: promoChat.chatTitle,
              chat_id: promoChat.chatId,
              messages: [],
              metadata: {
                uploadedFiles: promoChat.uploadedFiles,
                selectedModel: promoChat.selectedModel,
                topic: promoChat.topic,
              },
            },
          });
        }

        if (method === "POST" && url.endsWith("/api/study-agents/get-chat-progress")) {
          return makeJsonResponse({
            success: true,
            progress: { topic: promoChat.topic, level: promoChat.level },
          });
        }

        if (method === "POST" && url.endsWith("/api/study-agents/get-progress")) {
          return makeJsonResponse({
            success: true,
            progress: { [promoChat.topic]: { level: promoChat.level } },
          });
        }

        if (method === "POST" && url.includes("/api/study-agents/")) {
          // fallback para evitar romper la UI
          return makeJsonResponse({ success: true });
        }
      } catch {
        // ignore and fallback
      }

      return originalFetch(input, init);
    };

    setReady(true);
  }, [promoChat]);

  // Scroll a la tarjeta correcta (en móvil) para que el take “empiece” donde interesa.
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      const findAndScroll = (needle: string) => {
        const all = Array.from(
          document.querySelectorAll("h1,h2,h3,h4,h5,div")
        );
        const el = all.find((n) =>
          (n.textContent || "").toLowerCase().includes(needle.toLowerCase())
        ) as HTMLElement | undefined;
        el?.scrollIntoView({ behavior: "auto", block: "center" });
      };

      if (variant === "v1-notes") findAndScroll("Resumen de Estudio");
      if (variant === "v2-feedback") findAndScroll("Conceptos a Repasar");
      if (variant === "v3-exercise") findAndScroll("Feedback General");
    }, 800);

    return () => clearTimeout(t);
  }, [variant]);

  // Inyectar mensajes uno por uno para que la grabación parezca una interacción real.
  useEffect(() => {
    if (!ready) return;
    if (typeof window === "undefined") return;
    if (!promoChat.messages?.length) return;
    let cancelled = false;
    let cleanupTimers: undefined | (() => void);

    const schedule = () => {
      if (cancelled) return;

      // Pacing: suficiente para que en el vídeo se vea cada burbuja entrar.
      let t = 2600;
      const timers = promoChat.messages.map((m) => {
        const pushAt = t;
        const role = m.role;

        if (role === "user") {
          const typingMs = Math.max(800, Math.min(3200, m.content.length * 55));
          window.setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent("studyAgentsPromoTyping", {
                detail: {
                  content: m.content,
                },
              })
            );
          }, Math.max(0, pushAt - typingMs));
        }

        // El usuario "escribe" (y su burbuja) antes; el asistente tarda más.
        t += role === "user" ? 4300 : 5200;

        return window.setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("studyAgentsPromoPushMessage", {
              detail: {
                role: m.role,
                content: m.content,
                type: m.type || "message",
              },
            })
          );
        }, pushAt);
      });

      // Limpieza
      cleanupTimers = () => timers.forEach((x) => window.clearTimeout(x));
    };

    const onReady = () => {
      schedule();
    };

    window.addEventListener("studyAgentsPromoListenerReady", onReady, { once: true });
    const fallback = window.setTimeout(onReady, 1800);

    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
      if (typeof cleanupTimers === "function") cleanupTimers();
      window.removeEventListener("studyAgentsPromoListenerReady", onReady);
    };
  }, [promoChat.messages]);

  return (
    <SessionProvider session={fakeSession}>
      <div style={{ minHeight: "100vh", background: "#ffffff" }}>
        {ready ? <StudyChat /> : null}
      </div>
    </SessionProvider>
  );
}

