/** Parse a rough euro amount from strings like "875 €", "€1.200", "1200 EUR". */
export function parseEuro(raw?: string | null): number | null {
  if (!raw) return null;
  if (/no verificado|variable|incluido|gratis|free|orient/i.test(raw) && !/\d/.test(raw))
    return null;
  const m = raw
    .replace(/\s/g, "")
    .match(/(?:€)?(\d{1,3}(?:[.\s]\d{3})*(?:,\d{1,2})?|\d+)(?:€|EUR)?/i);
  if (!m) return null;
  const normalized = m[1].replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function formatEuro(n: number): string {
  return `${Math.round(n).toLocaleString("es-ES")} €`;
}

/**
 * Stay total: ALWAYS nightly × nights when nightly is known.
 * Never trust a conflicting AI "total" (e.g. 125€/noche → 200€).
 */
export function resolveStayTotal(opts: {
  total?: string;
  nightly?: string;
  nights?: number;
}): string {
  const nightly = parseEuro(opts.nightly);
  const nights = opts.nights && opts.nights > 0 ? opts.nights : null;

  if (nightly && nights) {
    return formatEuro(nightly * nights);
  }

  const direct = parseEuro(opts.total);
  if (direct && nights && nightly) {
    // inconsistent — prefer product
    return formatEuro(nightly * nights);
  }
  if (direct) return formatEuro(direct);
  return opts.total?.trim() || "No verificado";
}

/** Pick lodging platform from luxury level. */
export function stayPlatformForLuxury(
  luxury: number,
): "booking" | "airbnb" {
  return luxury <= 2 ? "airbnb" : "booking";
}
