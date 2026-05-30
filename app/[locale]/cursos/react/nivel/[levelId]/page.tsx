import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getLevelById } from "@/lib/cursos/levels";
import {
  buildProgressPayload,
  getProgressRows,
  getProfile,
  ensureProfile,
} from "@/lib/cursos/progress";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import LevelDetailClient from "@/components/cursos/LevelDetailClient";

type Props = {
  params: Promise<{ locale: string; levelId: string }>;
};

export default async function LevelPage({ params }: Props) {
  const { locale, levelId: levelIdStr } = await params;
  setRequestLocale(locale);

  const levelId = parseInt(levelIdStr, 10);
  if (Number.isNaN(levelId)) notFound();

  const level = getLevelById(levelId);
  if (!level) notFound();

  let status = "locked";
  let checkpoints = level.checkpoints.map((c) => ({
    id: c.id,
    label: c.label,
    passed: false,
  }));

  if (isSupabaseConfigured()) {
    const session = await auth();
    if (session?.user?.id) {
      await ensureProfile(
        session.user.id,
        session.user.name,
        session.user.image
      );
      const [rows, profile] = await Promise.all([
        getProgressRows(session.user.id),
        getProfile(session.user.id),
      ]);
      const progress = buildProgressPayload(
        rows,
        profile?.display_name ?? session.user.name ?? null
      );
      const levelState = progress.levels.find((l) => l.id === levelId);
      if (levelState) {
        status = levelState.status;
        checkpoints = levelState.checkpoints;
      }
    }
  } else {
    status = levelId === 1 ? "current" : "locked";
  }

  return (
    <LevelDetailClient
      levelId={level.id}
      title={level.title}
      block={level.block}
      instructions={level.instructions}
      checkpoints={checkpoints}
      status={status}
    />
  );
}
