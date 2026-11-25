import type { ItineraryPlan } from "./itinerary-schema";

/** Minimum bar for a usable agency-style itinerary. */
export function isItineraryDenseEnough(
  plan: ItineraryPlan,
  opts: { nights: number; minDays?: number },
): { ok: true } | { ok: false; reason: string } {
  const nights = Math.max(1, opts.nights);
  const minDays = opts.minDays ?? Math.min(nights, Math.max(5, Math.ceil(nights * 0.75)));
  const days = plan.days || [];
  if (days.length < minDays) {
    return {
      ok: false,
      reason: `solo ${days.length} días (mín. ${minDays} para ${nights} noches)`,
    };
  }

  const thin = days.filter((d) => (d.activities || []).length < 2).length;
  if (thin > Math.ceil(days.length * 0.25)) {
    return {
      ok: false,
      reason: `${thin} días con <2 actividades`,
    };
  }

  const avg =
    days.reduce((a, d) => a + (d.activities || []).length, 0) / Math.max(1, days.length);
  if (avg < 2.2) {
    return { ok: false, reason: `media ${avg.toFixed(1)} actividades/día` };
  }

  return { ok: true };
}
