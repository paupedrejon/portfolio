"use client";

import { useTranslations } from "next-intl";

type GuidePreviewProps = {
  html: string | null;
  title: string | null;
  loading: boolean;
  onPrint: () => void;
  onDownloadHtml: () => void;
};

export default function GuidePreview({
  html,
  title,
  loading,
  onPrint,
  onDownloadHtml,
}: GuidePreviewProps) {
  const t = useTranslations("viajes");

  return (
    <section className="viajes-panel" aria-labelledby="viajes-preview-title">
      <div className="viajes-preview-toolbar">
        <div>
          <h2 id="viajes-preview-title" className="viajes-panel__title">
            {t.rich("previewTitle", {
              em: (chunks) => <em>{chunks}</em>,
            })}
          </h2>
          {title ? (
            <p className="viajes-panel__hint" style={{ marginBottom: 0 }}>
              {title}
            </p>
          ) : (
            <p className="viajes-panel__hint" style={{ marginBottom: 0 }}>
              {t("previewHint")}
            </p>
          )}
        </div>
        <div className="viajes-actions" style={{ marginTop: 0 }}>
          <button
            type="button"
            className="viajes-btn viajes-btn--ghost"
            disabled={!html || loading}
            onClick={onPrint}
          >
            {t("actions.print")}
          </button>
          <button
            type="button"
            className="viajes-btn viajes-btn--primary"
            disabled={!html || loading}
            onClick={onDownloadHtml}
          >
            {t("actions.downloadHtml")}
          </button>
        </div>
      </div>

      <div className="viajes-preview-shell">
        {!html && !loading && (
          <div className="viajes-empty">
            <strong>{t("emptyTitle")}</strong>
            <span>{t("emptyBody")}</span>
          </div>
        )}
        {loading && !html && (
          <div className="viajes-empty">
            <strong>{t("actions.generating")}</strong>
            <span>{t("generatingHint")}</span>
          </div>
        )}
        {html && (
          <div className="viajes-preview-frame">
            <iframe
              title={title || t("previewFrameTitle")}
              srcDoc={html}
              sandbox="allow-same-origin allow-modals"
            />
          </div>
        )}
      </div>
    </section>
  );
}
