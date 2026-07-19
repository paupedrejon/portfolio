import jsPDF from "jspdf";

type TocEntry = { title: string; level: number; page?: number };

function sanitizePdfText(input: string): string {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu, "")
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[—–]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\n\t\x20-\x7EÁÉÍÓÚáéíóúÑñÜü¿¡°±×÷€$%&/()[\]{}=+\-_*.,:;!?@#<>\\|]/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    img.src = src;
    setTimeout(() => reject(new Error(`Timeout cargando ${src}`)), 4000);
  });
}

type Block =
  | { type: "h1" | "h2" | "h3" | "p" | "li" | "code"; text: string }
  | { type: "hr" };

function parseMarkdownBlocks(md: string): Block[] {
  const lines = sanitizePdfText(md).split("\n");
  const blocks: Block[] = [];
  let i = 0;
  let inCode = false;
  let codeBuf: string[] = [];

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trimEnd();

    if (line.startsWith("```")) {
      if (inCode) {
        blocks.push({ type: "code", text: codeBuf.join("\n") });
        codeBuf = [];
        inCode = false;
      } else {
        inCode = true;
      }
      i += 1;
      continue;
    }
    if (inCode) {
      codeBuf.push(raw);
      i += 1;
      continue;
    }

    if (!line.trim()) {
      i += 1;
      continue;
    }

    // skip markdown tables (render as plain lines without pipes mess)
    if (/^\|.*\|$/.test(line.trim())) {
      const cells = line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean);
      if (!/^[-:]+$/.test(cells.join(""))) {
        blocks.push({ type: "p", text: cells.join(" — ") });
      }
      i += 1;
      continue;
    }

    if (/^#{1}\s+/.test(line)) {
      blocks.push({ type: "h1", text: line.replace(/^#\s+/, "").trim() });
    } else if (/^#{2}\s+/.test(line)) {
      blocks.push({ type: "h2", text: line.replace(/^##\s+/, "").trim() });
    } else if (/^#{3}\s+/.test(line)) {
      blocks.push({ type: "h3", text: line.replace(/^###\s+/, "").trim() });
    } else if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push({ type: "hr" });
    } else if (/^\s*[-*+]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      blocks.push({
        type: "li",
        text: line.replace(/^\s*[-*+]\s+/, "").replace(/^\s*\d+\.\s+/, "").trim(),
      });
    } else {
      blocks.push({
        type: "p",
        text: line
          .replace(/(\*\*|__)(.*?)\1/g, "$2")
          .replace(/(\*|_)(.*?)\1/g, "$2")
          .replace(/`([^`]+)`/g, "$1")
          .trim(),
      });
    }
    i += 1;
  }

  if (inCode && codeBuf.length) {
    blocks.push({ type: "code", text: codeBuf.join("\n") });
  }
  return blocks.filter((b) => b.type === "hr" || (b.type !== "hr" && b.text.trim()));
}

/**
 * PDF académico Study Agents: portada (con bot), índice y secciones con estilo.
 * Solo se descarga al pulsar el botón (no automático).
 */
export async function downloadStudyNotesPdf(markdown: string, topic = "Apuntes"): Promise<void> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const maxW = pageW - margin * 2;
  const brand = { r: 53, g: 140, b: 159 };
  const cyan = { r: 0, g: 217, b: 255 };
  const bg = { r: 3, g: 13, b: 20 };
  const card = { r: 8, g: 24, b: 32 };

  const title = sanitizePdfText(topic).slice(0, 60) || "Apuntes";
  const dateStr = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const paintPageBg = () => {
    pdf.setFillColor(bg.r, bg.g, bg.b);
    pdf.rect(0, 0, pageW, pageH, "F");
  };

  // ——— Portada ———
  paintPageBg();
  pdf.setFillColor(brand.r, brand.g, brand.b);
  pdf.rect(0, 0, pageW, 8, "F");
  pdf.setFillColor(cyan.r, cyan.g, cyan.b);
  pdf.rect(0, 8, pageW, 1.2, "F");

  try {
    const bot = await loadImage("/StudyAgentsBot.png");
    const botW = 42;
    const botH = (bot.height / bot.width) * botW;
    pdf.addImage(bot, "PNG", (pageW - botW) / 2, 38, botW, botH);
  } catch {
    // fallback círculo marca si no carga el bot
    pdf.setFillColor(brand.r, brand.g, brand.b);
    pdf.circle(pageW / 2, 55, 16, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("SA", pageW / 2, 57, { align: "center" });
  }

  pdf.setTextColor(cyan.r, cyan.g, cyan.b);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("STUDY AGENTS", pageW / 2, 95, { align: "center" });

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(28);
  const coverTitle = pdf.splitTextToSize(title, maxW - 10);
  pdf.text(coverTitle, pageW / 2, 112, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(14);
  pdf.setTextColor(200, 220, 230);
  pdf.text("Apuntes de estudio", pageW / 2, 112 + coverTitle.length * 10 + 6, { align: "center" });

  pdf.setFontSize(11);
  pdf.setTextColor(148, 163, 184);
  pdf.text(dateStr, pageW / 2, pageH - 28, { align: "center" });
  pdf.setDrawColor(cyan.r, cyan.g, cyan.b);
  pdf.setLineWidth(0.4);
  pdf.line(pageW / 2 - 28, pageH - 22, pageW / 2 + 28, pageH - 22);

  // ——— Índice ———
  const blocks = parseMarkdownBlocks(markdown);
  const toc: TocEntry[] = [];
  for (const b of blocks) {
    if (b.type === "h1" || b.type === "h2") {
      toc.push({ title: b.text, level: b.type === "h1" ? 1 : 2 });
    }
  }

  pdf.addPage();
  paintPageBg();
  let y = margin + 4;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(255, 255, 255);
  pdf.text("Indice", margin, y);
  y += 4;
  pdf.setDrawColor(cyan.r, cyan.g, cyan.b);
  pdf.setLineWidth(0.6);
  pdf.line(margin, y, margin + 36, y);
  y += 12;

  if (toc.length === 0) {
    toc.push({ title: "Contenido", level: 1 });
  }

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  toc.forEach((entry, idx) => {
    if (y > pageH - margin - 10) {
      pdf.addPage();
      paintPageBg();
      y = margin;
    }
    const pad = entry.level === 1 ? 0 : 6;
    const label = `${idx + 1}. ${entry.title}`;
    pdf.setTextColor(entry.level === 1 ? 255 : 200, entry.level === 1 ? 255 : 220, entry.level === 1 ? 255 : 230);
    pdf.setFont("helvetica", entry.level === 1 ? "bold" : "normal");
    const lines = pdf.splitTextToSize(label, maxW - pad);
    pdf.text(lines, margin + pad, y);
    y += lines.length * 6 + 3;
  });

  // ——— Contenido ———
  const ensureSpace = (need: number) => {
    if (y + need > pageH - margin) {
      pdf.addPage();
      paintPageBg();
      y = margin;
      // header fino
      pdf.setFillColor(brand.r, brand.g, brand.b);
      pdf.rect(0, 0, pageW, 3.5, "F");
      y = margin;
    }
  };

  pdf.addPage();
  paintPageBg();
  pdf.setFillColor(brand.r, brand.g, brand.b);
  pdf.rect(0, 0, pageW, 3.5, "F");
  y = margin;

  const drawWrapped = (text: string, fontSize: number, leading: number, color: [number, number, number], bold = false) => {
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(fontSize);
    pdf.setTextColor(color[0], color[1], color[2]);
    const lines = pdf.splitTextToSize(text, maxW);
    const h = lines.length * leading;
    ensureSpace(h + 2);
    pdf.text(lines, margin, y);
    y += h;
  };

  for (const block of blocks) {
    if (block.type === "hr") {
      ensureSpace(8);
      pdf.setDrawColor(brand.r, brand.g, brand.b);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y, pageW - margin, y);
      y += 8;
      continue;
    }

    if (block.type === "h1") {
      y += 4;
      ensureSpace(16);
      pdf.setFillColor(card.r, card.g, card.b);
      pdf.roundedRect(margin - 2, y - 6, maxW + 4, 12, 2, 2, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(15);
      pdf.setTextColor(cyan.r, cyan.g, cyan.b);
      const lines = pdf.splitTextToSize(block.text, maxW - 4);
      pdf.text(lines, margin, y);
      y += Math.max(12, lines.length * 7) + 4;
      continue;
    }

    if (block.type === "h2") {
      y += 3;
      ensureSpace(12);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.setTextColor(255, 255, 255);
      const lines = pdf.splitTextToSize(block.text, maxW);
      pdf.text(lines, margin, y);
      y += lines.length * 6 + 2;
      pdf.setDrawColor(brand.r, brand.g, brand.b);
      pdf.setLineWidth(0.35);
      pdf.line(margin, y, margin + 28, y);
      y += 5;
      continue;
    }

    if (block.type === "h3") {
      ensureSpace(10);
      drawWrapped(block.text, 11.5, 5.5, [180, 230, 240], true);
      y += 2;
      continue;
    }

    if (block.type === "li") {
      ensureSpace(8);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10.5);
      pdf.setTextColor(226, 232, 240);
      const bullet = `•  ${block.text}`;
      const lines = pdf.splitTextToSize(bullet, maxW - 2);
      pdf.text(lines, margin + 1, y);
      y += lines.length * 5.2 + 1.5;
      continue;
    }

    if (block.type === "code") {
      const codeLines = block.text.split("\n");
      const lineH = 4.2;
      const boxH = Math.min(pageH - margin - y - 4, codeLines.length * lineH + 8);
      ensureSpace(Math.min(28, boxH));
      const startY = y;
      pdf.setFillColor(2, 8, 14);
      pdf.setDrawColor(brand.r, brand.g, brand.b);
      pdf.setLineWidth(0.3);
      const fullH = codeLines.length * lineH + 8;
      // may span pages simply: draw what fits then continue
      let drawn = 0;
      while (drawn < codeLines.length) {
        const avail = pageH - margin - y - 4;
        const can = Math.max(1, Math.floor((avail - 8) / lineH));
        const slice = codeLines.slice(drawn, drawn + can);
        const h = slice.length * lineH + 8;
        pdf.setFillColor(2, 8, 14);
        pdf.roundedRect(margin - 1, y, maxW + 2, h, 2, 2, "FD");
        pdf.setFont("courier", "normal");
        pdf.setFontSize(8.5);
        pdf.setTextColor(180, 230, 210);
        let cy = y + 5;
        for (const cl of slice) {
          const safe = sanitizePdfText(cl).slice(0, 95);
          pdf.text(safe, margin + 2, cy);
          cy += lineH;
        }
        y += h + 3;
        drawn += slice.length;
        if (drawn < codeLines.length) {
          pdf.addPage();
          paintPageBg();
          pdf.setFillColor(brand.r, brand.g, brand.b);
          pdf.rect(0, 0, pageW, 3.5, "F");
          y = margin;
        }
      }
      void startY;
      void fullH;
      continue;
    }

    // paragraph
    drawWrapped(block.text, 10.5, 5.3, [226, 232, 240], false);
    y += 3;
  }

  // pie en última página
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text("Study Agents · Apuntes", margin, pageH - 10);

  const safe = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9áéíóúñü-]/gi, "").slice(0, 40) || "apuntes";
  pdf.save(`apuntes-${safe}-${new Date().toISOString().split("T")[0]}.pdf`);
}
