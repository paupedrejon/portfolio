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
      <div className="cursos-page cursos-diploma-page">
        <p className="cursos-diploma-page__loading">Cargando...</p>
      </div>
    );
  }

  if (!session || !allowed) {
    return (
      <div className="cursos-page cursos-diploma-page">
        <div className="cursos-diploma-page__locked">
          <p>{t("diplomaLocked")}</p>
          <Link href="/cursos/react" className="cursos-btn-primary">
            {t("diplomaGoCourse")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cursos-page cursos-diploma-page">
      <div className="cursos-diploma-page__inner">
        <Link href="/cursos/react" className="cursos-diploma-page__back">
          ← {t("diplomaGoCourse")}
        </Link>

        <header className="cursos-diploma-page__header">
          <img src="/logo.svg" alt="" width={40} height={40} className="cursos-diploma-page__logo" />
          <h1 className="cursos-diploma-page__title">{t("diplomaTitle")}</h1>
          <p className="cursos-diploma-page__subtitle">{t("diplomaSubtitle")}</p>
        </header>

        <DiplomaGenerator displayName={displayName} issuedAt={issuedAt} />
      </div>
    </div>
  );
}
