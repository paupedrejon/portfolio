"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

type ReleaseAsset = {
  name: string;
  browser_download_url: string;
};

type Props = {
  title: string;
  subtitle: string;
  backLabel: string;
  installerTitle: string;
  installerDesc: string;
  installerCta: string;
  installerPending: string;
  devTitle: string;
  sourceCta: string;
  afterInstallTitle: string;
  afterInstallSteps: string[];
};

export default function TealCodeDownloadClient({
  title,
  subtitle,
  backLabel,
  installerTitle,
  installerDesc,
  installerCta,
  installerPending,
  devTitle,
  sourceCta,
  afterInstallTitle,
  afterInstallSteps,
}: Props) {
  const [installerReady, setInstallerReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ghAsset, setGhAsset] = useState<ReleaseAsset | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/tealcode/installer", { method: "HEAD" }).then((r) => r.ok),
      fetch("/api/tealcode/releases")
        .then((r) => r.json())
        .catch(() => ({ available: false, assets: [] })),
    ])
      .then(([localOk, releases]) => {
        setInstallerReady(localOk);
        if (releases.available && Array.isArray(releases.assets)) {
          const win = releases.assets.find(
            (a: ReleaseAsset) =>
              a.name.endsWith(".exe") || a.name.endsWith(".msi")
          );
          if (win) setGhAsset(win);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const downloadHref = ghAsset?.browser_download_url ?? "/api/tealcode/installer";

  return (
    <main className="tealcode-download">
      <div className="tealcode-download__glow" aria-hidden />

      <div className="tealcode-download__inner">
        <Link href="/proyectos/tealcode" className="tealcode-download__back">
          ← {backLabel}
        </Link>

        <p className="tealcode-download__kicker">TealCode</p>
        <h1 className="tealcode-download__title">{title}</h1>
        <p className="tealcode-download__subtitle">{subtitle}</p>

        <section className="tealcode-download__card tealcode-download__card--hero">
          <h2>{installerTitle}</h2>
          <p className="tealcode-download__muted">{installerDesc}</p>
          {loading ? (
            <p className="tealcode-download__muted">Comprobando instalador…</p>
          ) : installerReady || ghAsset ? (
            <a
              href={downloadHref}
              className="tealcode-download__btn tealcode-download__btn--accent"
              download
            >
              {installerCta}
            </a>
          ) : (
            <p className="tealcode-download__pending">{installerPending}</p>
          )}
        </section>

        <section className="tealcode-download__section">
          <h2>{afterInstallTitle}</h2>
          <ol className="tealcode-download__steps">
            {afterInstallSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <details className="tealcode-download__dev">
          <summary>{devTitle}</summary>
          <a
            href="/api/tealcode/download"
            className="tealcode-download__btn tealcode-download__btn--ghost"
            download="tealcode-source.zip"
          >
            {sourceCta}
          </a>
        </details>
      </div>
    </main>
  );
}
