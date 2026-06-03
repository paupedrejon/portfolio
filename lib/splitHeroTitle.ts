/** Parte el título solo si hay espacio real (evita "PRO YECTOS"). */
export function splitHeroTitle(title: string) {
  const t = title.trim();
  const space = t.indexOf(" ");
  if (space > 0) {
    return { lead: t.slice(0, space), accent: t.slice(space + 1) };
  }
  return { lead: t, accent: "" };
}
