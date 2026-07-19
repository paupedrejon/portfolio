"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import StudyChat from "@/components/StudyChat";
import Onboarding from "@/components/study-agents/Onboarding";
import StudyAgentsHome, {
  type SaCourseSummary,
} from "@/components/study-agents/StudyAgentsHome";
import "@/components/study-agents/study-agents-bot.css";
import "@/components/study-agents/study-agents-hero.css";
import "@/app/[locale]/home.css";

type View = "home" | "course";

export default function StudyAgentsPageClient() {
  const [mounted, setMounted] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showAPIKeyModal, setShowAPIKeyModal] = useState(false);
  const [view, setView] = useState<View>("home");
  const [activeCourse, setActiveCourse] = useState<SaCourseSummary | null>(null);
  const [openPlanNonce, setOpenPlanNonce] = useState(0);

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

  const openCourse = useCallback((course: SaCourseSummary) => {
    setActiveCourse(course);
    setView("course");
  }, []);

  const startCourse = useCallback(() => {
    setActiveCourse(null);
    setView("course");
    setOpenPlanNonce((n) => n + 1);
  }, []);

  const backHome = useCallback(() => {
    setView("home");
    setActiveCourse(null);
    window.dispatchEvent(new Event("sa-courses-refresh"));
  }, []);

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

  if (!session) return null;

  const userId = session.user?.id || "";

  return (
    <>
      {view === "home" && !showAPIKeyModal && (
        <StudyAgentsHome
          userId={userId}
          onStartCourse={startCourse}
          onOpenCourse={openCourse}
        />
      )}

      <div
        id="study-chat"
        style={{ display: view === "course" ? "block" : "none" }}
      >
        <StudyChat
          courseMode
          hideSidebar
          focusChatId={activeCourse?.chatId || null}
          openPlanNonce={openPlanNonce}
          onBackToCourses={backHome}
          onCourseCreated={(course) => {
            openCourse(course);
            window.dispatchEvent(new Event("sa-courses-refresh"));
          }}
        />
      </div>

      {view === "course" && (
        <Onboarding
          onAskTestClick={() => {
            const input = document.querySelector<HTMLTextAreaElement>(
              "[data-study-chat-input]",
            );
            if (input) {
              input.focus();
              input.value = "Tengo una duda sobre la lección de hoy.";
              input.dispatchEvent(new Event("input", { bubbles: true }));
            }
          }}
        />
      )}
    </>
  );
}
