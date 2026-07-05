import { NextResponse } from "next/server";
import { insertAnalyticsEvent } from "@/lib/analytics/store";
import { isExcludedAnalyticsEvent } from "@/lib/analytics/filters";
import { ANALYTICS_EVENT_TYPES } from "@/lib/analytics/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const event_type = typeof body.event_type === "string" ? body.event_type : "";
    const path = typeof body.path === "string" ? body.path.slice(0, 500) : null;
    const session_id =
      typeof body.session_id === "string" ? body.session_id.slice(0, 64) : null;
    const metadata =
      body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? (body.metadata as Record<string, unknown>)
        : {};

    if (!event_type || event_type.length > 64) {
      return NextResponse.json({ ok: false, error: "invalid_event" }, { status: 400 });
    }

    if (
      !ANALYTICS_EVENT_TYPES.includes(
        event_type as (typeof ANALYTICS_EVENT_TYPES)[number],
      )
    ) {
      return NextResponse.json({ ok: false, error: "unknown_event" }, { status: 400 });
    }

    if (isExcludedAnalyticsEvent({ path, metadata })) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const result = await insertAnalyticsEvent({
      event_type,
      path,
      session_id,
      metadata,
    });

    return NextResponse.json({ ok: result.ok, error: result.error });
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
}
