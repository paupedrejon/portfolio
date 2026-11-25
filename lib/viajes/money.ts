/** Parse a rough euro amount from strings like "875 €", "€1.200", "1200 EUR". */
export function parseEuro(raw?: string | null): number | null {
  if (!raw) return null;
  if (/no verificado|variable|incluido|gratis|free/i.test(raw)) return null;
  const m = raw.replace(/\s/g, "").match(/(?:€)?(\d{1,3}(?:[.\s]\d{3})*(?:,\d{1,2})?|\d+)(?:€|EUR)?/i);
  if (!m) return null;
  const normalized = m[1].replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function formatEuro(n: number): string {
  return `${Math.round(n).toLocaleString("es-ES")} €`;
}

/** Prefer explicit total; else nightly × nights. */
export function resolveStayTotal(opts: {
  total?: string;
  nightly?: string;
  nights?: number;
}): string {
  const direct = parseEuro(opts.total);
  if (direct) return formatEuro(direct);
  const nightly = parseEuro(opts.nightly);
  if (nightly && opts.nights && opts.nights > 0) {
    return `${formatEuro(nightly * opts.nights)} (orient.)`;
  }
  return opts.total?.trim() || "No verificado";
}
