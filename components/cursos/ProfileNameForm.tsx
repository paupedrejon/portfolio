"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Props = {
  initialName: string;
  onSaved?: (name: string) => void;
};

export default function ProfileNameForm({ initialName, onSaved }: Props) {
  const t = useTranslations("cursos");
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setSaved(true);
      onSaved?.(data.displayName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] backdrop-blur"
    >
      <h3 className="text-lg font-semibold mb-1">{t("profileTitle")}</h3>
      <p className="text-sm text-[var(--text-muted)] mb-4">{t("profileHint")}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("profilePlaceholder")}
          minLength={2}
          maxLength={80}
          required
          className="flex-1 px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={saving}
          className="btn-primary whitespace-nowrap disabled:opacity-50"
        >
          {saving ? "..." : t("profileSave")}
        </button>
      </div>
      {saved && (
        <p className="text-emerald-400 text-sm mt-2">{t("profileSaved")}</p>
      )}
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </form>
  );
}
