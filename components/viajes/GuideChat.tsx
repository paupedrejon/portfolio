"use client";

import { useEffect, useRef, useState } from "react";
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
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  return (
    <aside className="viajes-chatpanel" aria-labelledby="viajes-chat-title">
      <header className="viajes-chatpanel__head">
        <h2 id="viajes-chat-title">{t("chatTitlePlain")}</h2>
        <p>{t("chatHint")}</p>
      </header>

      <div className="viajes-chatpanel__log" ref={logRef} aria-live="polite">
        {messages.length === 0 && (
          <div className="viajes-chatpanel__empty">{t("chatEmpty")}</div>
        )}
        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}`}
            className={`viajes-msg viajes-msg--${m.role}`}
          >
            <span className="viajes-msg__role">
              {m.role === "user" ? t("chat.you") : t("chat.assistant")}
            </span>
            <div className="viajes-msg__bubble">{m.text}</div>
          </div>
        ))}
        {loading && (
          <div className="viajes-msg viajes-msg--assistant">
            <span className="viajes-msg__role">{t("chat.assistant")}</span>
            <div className="viajes-msg__bubble viajes-msg__bubble--typing">
              {t("actions.editing")}
            </div>
          </div>
        )}
      </div>

      <form
        className="viajes-chatpanel__composer"
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
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <button
          type="submit"
          className="viajes-btn viajes-btn--primary"
          disabled={disabled || loading || !draft.trim()}
        >
          {t("actions.send")}
        </button>
      </form>
    </aside>
  );
}
