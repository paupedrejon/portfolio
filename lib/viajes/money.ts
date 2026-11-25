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

/** Approximate meal/activity price when the model left it blank. */
export function estimateActivityPrice(
  name: string,
  price: string | undefined,
  luxury: number,
): string {
  const raw = (price || "").trim();
  if (raw && !/^(orient\.?|no verificado|-)$/i.test(raw)) return raw;

  const n = name || "";
  const isMeal =
    /desayuno|breakfast|brunch|almuerzo|comida|lunch|cena|dinner|ristorante|restaurante|trattoria|bistro|ramen|sushi|tapas/i.test(
      n,
    );
  if (!isMeal) return raw || "Orient.";

  if (/desayuno|breakfast|brunch/i.test(n)) {
    if (luxury >= 5) return "~28 € / pers.";
    if (luxury >= 4) return "~18 € / pers.";
    if (luxury <= 2) return "~8 € / pers.";
    return "~12 € / pers.";
  }
  if (/cena|dinner/i.test(n)) {
    if (luxury >= 5) return "~120 € / pers.";
    if (luxury >= 4) return "~75 € / pers.";
    if (luxury <= 2) return "~22 € / pers.";
    return "~35 € / pers.";
  }
  // lunch / generic meal
  if (luxury >= 5) return "~85 € / pers.";
  if (luxury >= 4) return "~55 € / pers.";
  if (luxury <= 2) return "~15 € / pers.";
  return "~25 € / pers.";
}

export type MoveOption = {
  icon: "metro" | "taxi" | "car" | "walk" | "bike";
  title: string;
  detail: string;
};

/** Local get-around options with icons + prices, tuned by luxury. */
export function localMoveOptions(city: string, luxury: number): MoveOption[] {
  const place = city.trim() || "la ciudad";
  if (luxury >= 5) {
    return [
      {
        icon: "car",
        title: "Chofer privado",
        detail: `Día completo en ${place} · ~450–700 €`,
      },
      {
        icon: "taxi",
        title: "Taxi / Uber Black",
        detail: "Trayectos cortos · ~25–60 €",
      },
      {
        icon: "walk",
        title: "A pie en el centro",
        detail: "Entre visitas cercanas · gratis",
      },
    ];
  }
  if (luxury >= 4) {
    return [
      {
        icon: "taxi",
        title: "Taxi / Uber Comfort",
        detail: `Entre zonas de ${place} · ~15–35 €`,
      },
      {
        icon: "car",
        title: "Chofer medio día",
        detail: "Museos + almuerzo · ~220–350 €",
      },
      {
        icon: "walk",
        title: "A pie",
        detail: "Barrios céntricos · gratis",
      },
    ];
  }
  if (luxury <= 2) {
    return [
      {
        icon: "metro",
        title: "Pase metro / bus",
        detail: `Día en ${place} · ~5–10 €`,
      },
      {
        icon: "walk",
        title: "A pie",
        detail: "Centro histórico · gratis",
      },
      {
        icon: "bike",
        title: "Bici compartida",
        detail: "Alquiler corto · ~3–8 €",
      },
    ];
  }
  return [
    {
      icon: "metro",
      title: "Pase transporte",
      detail: `24–72 h en ${place} · ~8–20 €`,
    },
    {
      icon: "taxi",
      title: "Taxi / Uber",
      detail: "Cuando llueve o vas tarde · ~12–25 €",
    },
    {
      icon: "walk",
      title: "A pie",
      detail: "Entre visitas próximas · gratis",
    },
  ];
}
