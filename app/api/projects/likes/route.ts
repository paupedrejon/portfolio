import { NextResponse } from "next/server";
import {
  getLikedSlugsForSession,
  getProjectLikeCounts,
  setProjectLike,
} from "@/lib/projects/likes";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/i;
const SESSION_RE = /^[a-zA-Z0-9_-]{8,64}$/;

function parseSlugs(raw: string | null): string[] | undefined {
  if (!raw) return undefined;
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => SLUG_RE.test(s))
    .slice(0, 80);
  return list.length > 0 ? list : undefined;
}

/** Contadores públicos — no requiere consentimiento. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slugs = parseSlugs(searchParams.get("slugs"));
  const sessionIdRaw = searchParams.get("session_id");
  const sessionId =
    typeof sessionIdRaw === "string" && SESSION_RE.test(sessionIdRaw)
      ? sessionIdRaw
      : null;

  const countsResult = await getProjectLikeCounts(slugs);
  if (!countsResult.ok) {
    return NextResponse.json(
      { ok: false, counts: {}, error: countsResult.error },
      { status: 500 },
    );
  }

  let liked: string[] = [];
  if (sessionId) {
    const likedResult = await getLikedSlugsForSession(sessionId);
    if (likedResult.ok) liked = likedResult.liked;
  }

  return NextResponse.json({
    ok: true,
    counts: countsResult.counts,
    liked,
  });
}

/** Registrar / quitar me gusta — requiere session_id (solo si hay consentimiento en cliente). */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    const sessionId =
      typeof body.session_id === "string" ? body.session_id.trim() : "";
    const liked = body.liked === true;

    if (!SLUG_RE.test(slug)) {
      return NextResponse.json({ ok: false, error: "invalid_slug" }, { status: 400 });
    }
    if (!SESSION_RE.test(sessionId)) {
      return NextResponse.json(
        { ok: false, error: "invalid_session" },
        { status: 400 },
      );
    }

    const result = await setProjectLike({ slug, sessionId, liked });
    if (!result.ok) {
      const status =
        result.error === "supabase_not_configured" ? 503 : 500;
      return NextResponse.json(
        { ok: false, error: result.error, count: result.count, liked: result.liked },
        { status },
      );
    }

    return NextResponse.json({
      ok: true,
      count: result.count,
      liked: result.liked,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
}
