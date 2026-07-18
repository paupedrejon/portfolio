"use client";

import { leagueSpartan, outfit } from "@/app/fonts";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import StudyChat from "@/components/StudyChat";
import Onboarding from "@/components/study-agents/Onboarding";
import StudyAgentsBotAvatar from "@/components/study-agents/StudyAgentsBotAvatar";
import HomeHeroBackground from "@/components/home/HomeHeroBackground";
import { SA_PRIMARY } from "@/lib/study-agents/brand";
import { OPEN_API_KEY_MODAL_EVENT } from "@/lib/study-agents/api-keys";
import "@/components/study-agents/study-agents-bot.css";
import "@/components/study-agents/study-agents-hero.css";
import "@/app/[locale]/home.css";

export default function StudyAgentsPageClient() {
  const [mounted, setMounted] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showAPIKeyModal, setShowAPIKeyModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleAPIKeyModalChange = (e: CustomEvent) => {
      setShowAPIKeyModal(e.detail.isOpen);
    };

    window.addEventListener("apiKeyModalChange", handleAPIKeyModalChange as EventListener);
    return () => {
      window.removeEventListener("apiKeyModalChange", handleAPIKeyModalChange as EventListener);
    };
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/study-agents");
    }
  }, [status, router]);

  const scrollToChat = () => {
    document.getElementById("study-chat")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (status === "loading" || !mounted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#030d14",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid rgba(53, 140, 159, 0.25)",
            borderTop: "3px solid #358c9f",
            borderRadius: "50%",
            animation: "sa-spin 0.8s linear infinite",
          }}
        />
        <style jsx>{`
          @keyframes sa-spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <section
        className="sa-hero"
        style={{ display: showAPIKeyModal ? "none" : undefined }}
        aria-label="Study Agents"
      >
        <div className="sa-hero__bg" aria-hidden />
        <HomeHeroBackground />

        <div className={`sa-hero__inner ${mounted ? "sa-hero__fade" : ""}`}>
          <div className="sa-hero__bot" style={{ animationDelay: "0s" }}>
            <StudyAgentsBotAvatar
              size={112}
              color={SA_PRIMARY}
              state="idle"
              title="Study Agents"
            />
          </div>

          <p className={`${outfit.className} sa-hero__kicker`}>
            <span className="sa-hero__kicker-dot" aria-hidden />
            AI Study Assistant
          </p>

          <h1 className={`${leagueSpartan.className} sa-hero__title`}>
            <span className="sa-hero__title-lead">STUDY</span>
            <br />
            <span className="sa-hero__title-accent">AGENTS</span>
          </h1>

          <p className={`${outfit.className} sa-hero__tagline`}>
            ChatGPT te responde. Study Agents sabe qué no sabes y te lo hace practicar.
          </p>

          <div className="sa-hero__actions">
            <button type="button" className="sa-hero__cta" onClick={scrollToChat}>
              Empezar a estudiar
            </button>
            <button
              type="button"
              className="sa-hero__cta-ghost"
              onClick={() => {
                window.dispatchEvent(new Event(OPEN_API_KEY_MODAL_EVENT));
              }}
            >
              Configurar API Key
            </button>
          </div>
        </div>
      </section>

      <div id="study-chat">
        <StudyChat />
      </div>
      <Onboarding
        onAskTestClick={() => {
          const input = document.querySelector<HTMLTextAreaElement>(
            "[data-study-chat-input]",
          );
          if (input) {
            input.focus();
            input.value = "Hazme un test de 5 preguntas sobre el documento que subí.";
            input.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }}
      />
    </>
  );
}
