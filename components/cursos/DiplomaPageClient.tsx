"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import DiplomaGenerator from "./DiplomaGenerator";

export default function DiplomaPageClient() {
  const t = useTranslations("cursos");
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [issuedAt, setIssuedAt] = useState(new Date().toISOString());

  useEffect(() => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const progressRes = await fetch("/api/me/progress?course=react");
        const progress = await progressRes.json();
        if (!progress.courseCompleted) {
          setAllowed(false);
          setLoading(false);
          return;
        }
        const name = progress.displayName?.trim();
        if (!name) {
          setAllowed(false);
          setLoading(false);
          return;
        }
        setDisplayName(name);
        await fetch("/api/cursos/react/diploma", { method: "POST" });
        const dipRes = await fetch("/api/cursos/react/diploma");
        const dipData = await dipRes.json();
        if (dipData.diploma?.issued_at) {
          setIssuedAt(dipData.diploma.issued_at);
        }
        setAllowed(true);
      } catch {
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [status, session]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <p className="text-[var(--text-muted)]">Cargando...</p>
      </div>
    );
  }

  if (!session || !allowed) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-[var(--text-secondary)] mb-6 max-w-md">{t("diplomaLocked")}</p>
        <Link href="/cursos/react" className="btn-primary">
          {t("diplomaGoCourse")}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/cursos/react"
          className="text-sm text-indigo-400 hover:text-indigo-300 mb-8 inline-block"
        >
          ← {t("diplomaGoCourse")}
        </Link>
        <h1 className="text-3xl font-bold text-center mb-12 gradient-text">{t("diplomaTitle")}</h1>
        <DiplomaGenerator displayName={displayName} issuedAt={issuedAt} />
      </div>
    </div>
  );
}
