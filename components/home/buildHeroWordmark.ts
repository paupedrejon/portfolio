/** Rasteriza el nombre del hero a PNG para ElectricLogo (silueta tipográfica). */

export function buildHeroWordmarkDataUrl(title: string): string {
  const lines = title.trim().split(/\s+/).filter(Boolean);
  const display = lines.length >= 2 ? lines : [title.trim()];
  const width = 1400;
  const height = display.length === 1 ? 420 : 520;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font =
    '800 210px "Geist Sans", var(--font-geist-sans), system-ui, Arial Black, sans-serif';

  // Ajuste fino si PEDREJON no cabe
  const longest = display.reduce((a, b) => (a.length >= b.length ? a : b), "");
  let size = 210;
  while (size > 120) {
    ctx.font = `800 ${size}px "Geist Sans", system-ui, Arial Black, sans-serif`;
    if (ctx.measureText(longest).width < width * 0.92) break;
    size -= 8;
  }

  const lineHeight = size * 0.95;
  const block = lineHeight * display.length;
  const startY = height / 2 - block / 2 + lineHeight / 2;

  display.forEach((line, i) => {
    ctx.fillText(line.toUpperCase(), width / 2, startY + i * lineHeight);
  });

  return canvas.toDataURL("image/png");
}
