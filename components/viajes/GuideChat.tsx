"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

type GuideChatProps = {
  disabled: boolean;
  loading: boolean;
  messages: ChatMessage[];
  onSend: (instruction: string) => Promise<void>;
};

export default function GuideChat({
  disabled,
  loading,
  messages,
  onSend,
}: GuideChatProps) {
  const t = useTranslations("viajes");
  const [draft, setDraft] = useState("");

  return (
    <section className="viajes-panel" aria-labelledby="viajes-chat-title">
      <h2 id="viajes-chat-title" className="viajes-panel__title">
        {t.rich("chatTitle", {
          em: (chunks) => <em>{chunks}</em>,
        })}
      </h2>
      <p className="viajes-panel__hint">{t("chatHint")}</p>

      <div className="viajes-chat">
        <div className="viajes-chat__log" aria-live="polite">
          {messages.length === 0 && (
            <p className="viajes-panel__hint" style={{ margin: 0 }}>
              {t("chatEmpty")}
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={`${m.role}-${i}`}
              className={`viajes-chat__bubble viajes-chat__bubble--${m.role}`}
            >
              {m.text}
            </div>
          ))}
        </div>

        <form
          className="viajes-chat__row"
          onSubmit={async (e) => {
            e.preventDefault();
            const text = draft.trim();
            if (!text || disabled || loading) return;
            setDraft("");
            await onSend(text);
          }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("placeholders.chat")}
            disabled={disabled || loading}
            rows={2}
          />
          <button
            type="submit"
            className="viajes-btn viajes-btn--primary"
            disabled={disabled || loading || !draft.trim()}
          >
            {loading ? t("actions.editing") : t("actions.send")}
          </button>
        </form>
      </div>
    </section>
  );
}
