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
    <form onSubmit={handleSubmit} className="cursos-card">
      <h3 style={{ fontSize: "1.125rem", fontWeight: 600, margin: "0 0 0.25rem" }}>
        {t("profileTitle")}
      </h3>
      <p style={{ fontSize: "0.875rem", color: "#94a3b8", margin: "0 0 1rem" }}>
        {t("profileHint")}
      </p>
      <div className="cursos-form-row">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("profilePlaceholder")}
          minLength={2}
          maxLength={80}
          required
          className="cursos-input"
        />
        <button
          type="submit"
          disabled={saving}
          className="btn-primary"
        >
          {saving ? "..." : t("profileSave")}
        </button>
      </div>
      {saved && (
        <p style={{ color: "#34d399", fontSize: "0.875rem", marginTop: "0.75rem" }}>
          {t("profileSaved")}
        </p>
      )}
      {error && (
        <p style={{ color: "#f87171", fontSize: "0.875rem", marginTop: "0.75rem" }}>
          {error}
        </p>
      )}
    </form>
  );
}
