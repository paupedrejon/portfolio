"use client";

import { signIn, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Props = {
  /** Nivel en el que está el alumno: el zip incluye el código tras completar el nivel anterior */
  levelId?: number;
};

export default function DownloadTemplateButton({ levelId = 1 }: Props) {
  const t = useTranslations("cursos");
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    if (!session) {
      signIn("google", {
        callbackUrl: pathname || "/es/cursos/react/nivel/1",
      });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cursos/react/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ levelId }),
      });
      if (res.status === 503) {
        setError(t("supabaseNotConfigured"));
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al descargar");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disp = res.headers.get("Content-Disposition");
      const match = disp?.match(/filename="([^"]+)"/);
      a.download = match?.[1] ?? `react-portfolio-nivel-${levelId}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading || status === "loading"}
        className="cursos-btn-primary"
      >
        {loading
          ? t("downloading")
          : session
            ? t("downloadTemplate")
            : t("loginToDownload")}
      </button>
      {error && <p className="cursos-download-error">{error}</p>}
    </div>
  );
}
