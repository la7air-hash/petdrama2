// Renders a square shareable PNG — premium colorful social meme card.
// Composition:
//   - bright colored "paper" background with a soft tinted dot pattern
//   - two layered accent sticker shapes (offset blobs/squares) for liveliness
//   - white polaroid-style photo frame with thick black border + offset shadow
//   - sticker pill badge centered on the bottom edge of the photo
//   - dramatic quote on the colored paper, with a bright accent underline
//   - caption in a small white rounded panel for clear separation
//   - tiny PETDRAMA mark + optional watermark in the footer
import { getStyle, type DramaStyleId } from "./drama";

// Bright, curated palette per style (paper bg + accent + secondary accent).
const STYLE_PALETTE: Record<
  string,
  { paper: string; accent: string; accent2: string; onPaper: "dark" | "light" }
> = {
  primary:    { paper: "#FFD9F0", accent: "#FF1FA8", accent2: "#2E16FF", onPaper: "dark"  }, // hot pink paper
  secondary:  { paper: "#DCD7FF", accent: "#2E16FF", accent2: "#F4FF00", onPaper: "dark"  }, // electric blue
  accent:     { paper: "#C8FBFF", accent: "#00C2D1", accent2: "#FF1FA8", onPaper: "dark"  }, // cyan
  highlight:  { paper: "#FFFBA8", accent: "#FFD400", accent2: "#FF1FA8", onPaper: "dark"  }, // bright yellow
  foreground: { paper: "#171717", accent: "#FF1FA8", accent2: "#F4FF00", onPaper: "light" }, // dark
};

interface RenderOpts {
  imageDataUrl: string;
  petName: string;
  styleId: DramaStyleId;
  quote: string;
  caption?: string;
  watermark: boolean;
  size?: number;
}

export async function renderDramaPng(opts: RenderOpts): Promise<string> {
  const size = opts.size ?? 1080;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const style = getStyle(opts.styleId);
  const palette = STYLE_PALETTE[style.color] ?? STYLE_PALETTE.primary;
  const isLightOnDark = palette.onPaper === "light";
  const ink = isLightOnDark ? "#FFFFFF" : "#121212";
  const inkSoft = isLightOnDark ? "rgba(255,255,255,0.78)" : "rgba(18,18,18,0.72)";
  const black = "#121212";

  // ============== 1. PAPER BACKGROUND ==============
  ctx.fillStyle = palette.paper;
  ctx.fillRect(0, 0, size, size);

  // Soft tinted dot pattern (very subtle)
  drawDotGrid(ctx, size, isLightOnDark ? "rgba(255,255,255,0.07)" : "rgba(18,18,18,0.08)");

  // ============== 2. LAYERED ACCENT STICKER SHAPES ==============
  // A bold accent blob behind the top-left of the photo
  ctx.save();
  ctx.translate(size * 0.18, size * 0.16);
  ctx.rotate(-0.18);
  drawRoundedRect(ctx, -size * 0.18, -size * 0.08, size * 0.42, size * 0.18, size * 0.06);
  ctx.fillStyle = palette.accent;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = black;
  ctx.stroke();
  ctx.restore();

  // A small secondary sticker on the right side
  ctx.save();
  ctx.translate(size * 0.86, size * 0.74);
  ctx.rotate(0.22);
  drawRoundedRect(ctx, -size * 0.12, -size * 0.05, size * 0.24, size * 0.1, size * 0.04);
  ctx.fillStyle = palette.accent2;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = black;
  ctx.stroke();
  ctx.restore();

  // A small dot/star marker top-right
  drawStar(ctx, size * 0.9, size * 0.12, size * 0.045, 5, palette.accent2, black);

  // ============== 3. POLAROID PHOTO FRAME (tilted, offset shadow) ==============
  const frameW = Math.round(size * 0.78);
  const frameH = Math.round(size * 0.66);
  const frameX = Math.round((size - frameW) / 2);
  const frameY = Math.round(size * 0.13);
  const frameR = Math.round(size * 0.035);
  const tilt = -0.025; // very subtle tilt

  ctx.save();
  // rotate around frame center
  const cx = frameX + frameW / 2;
  const cy = frameY + frameH / 2;
  ctx.translate(cx, cy);
  ctx.rotate(tilt);
  ctx.translate(-cx, -cy);

  // offset hard shadow
  drawRoundedRect(ctx, frameX + 12, frameY + 14, frameW, frameH, frameR);
  ctx.fillStyle = black;
  ctx.fill();
  // white polaroid card
  drawRoundedRect(ctx, frameX, frameY, frameW, frameH, frameR);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = black;
  ctx.stroke();

  // Inner photo area
  const inset = Math.round(size * 0.03);
  const photoX = frameX + inset;
  const photoY = frameY + inset;
  const photoW = frameW - inset * 2;
  const photoH = frameH - inset * 2 - Math.round(size * 0.04); // leave a small white strip at the bottom of polaroid
  const photoR = Math.round(size * 0.022);

  const img = await loadImage(opts.imageDataUrl);
  drawRoundedImage(ctx, img, photoX, photoY, photoW, photoH, photoR);

  ctx.restore(); // end tilt

  // ============== 4. STICKER BADGE (centered on photo bottom edge) ==============
  // (Drawn un-tilted so it reads cleanly.)
  const idText = `${(opts.petName || "Your pet").toUpperCase()} — ${style.name.toUpperCase()}`;
  let badgeFontSize = Math.round(size * 0.034);
  ctx.font = `800 ${badgeFontSize}px "Syne", system-ui, sans-serif`;
  const badgePadX = Math.round(size * 0.034);
  const badgePadY = Math.round(size * 0.018);
  const maxBadgeW = frameW - inset * 2 + 20;
  while (ctx.measureText(idText).width + badgePadX * 2 > maxBadgeW && badgeFontSize > 18) {
    badgeFontSize -= 2;
    ctx.font = `800 ${badgeFontSize}px "Syne", system-ui, sans-serif`;
  }
  const badgeW = ctx.measureText(idText).width + badgePadX * 2;
  const badgeH = badgeFontSize + badgePadY * 2;
  const badgeX = (size - badgeW) / 2;
  // Sit on the photo's visual bottom edge
  const photoBottom = photoY + photoH;
  const badgeY = photoBottom - badgeH / 2 + 4;
  const badgeR = Math.round(badgeH / 2);

  // hard offset shadow
  drawRoundedRect(ctx, badgeX + 6, badgeY + 6, badgeW, badgeH, badgeR);
  ctx.fillStyle = black;
  ctx.fill();
  // badge body — vibrant accent
  drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeR);
  ctx.fillStyle = palette.accent;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = black;
  ctx.stroke();
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(idText, badgeX + badgeW / 2, badgeY + badgeH / 2 + 2);

  // ============== 5. QUOTE (on the colored paper) ==============
  const sideMargin = Math.round(size * 0.085);
  const maxTextW = size - sideMargin * 2;
  const quote = `“${opts.quote}”`;

  // Safe top: clear the badge + its 6px hard shadow, the photo's tilt drop,
  // and add a comfortable breathing gap so the quote is never visually crowded
  // by the photo frame or badge.
  const badgeBottom = badgeY + badgeH + 6; // include badge shadow
  const tiltDrop = Math.round((frameW / 2) * Math.abs(tilt)); // vertical extent added by frame rotation
  const breathingGap = Math.round(size * 0.055);
  const quoteTop = Math.max(badgeBottom, photoBottom + tiltDrop) + breathingGap;

  const footerH = Math.round(size * 0.06);
  // Reserve space for caption panel below the quote (panel + clear gap)
  const hasCaption = !!(opts.caption || "").trim();
  const captionReserve = hasCaption ? Math.round(size * 0.16) : Math.round(size * 0.02);
  const quoteAreaBottom = size - sideMargin - footerH - captionReserve;
  const quoteAreaH = Math.max(0, quoteAreaBottom - quoteTop);

  // Start size scales by length; shrink aggressively until it fits cleanly.
  let qSize =
    quote.length > 140 ? 30 :
    quote.length > 110 ? 34 :
    quote.length > 90  ? 40 :
    quote.length > 60  ? 50 : 60;
  let qLines: string[] = [];
  let qLineH = 0;
  const MAX_LINES = 4;
  for (let attempt = 0; attempt < 16; attempt++) {
    ctx.font = `800 ${qSize}px "Syne", system-ui, sans-serif`;
    qLines = wrapLines(ctx, quote, maxTextW);
    qLineH = Math.round(qSize * 1.12);
    const fitsLines = qLines.length <= MAX_LINES;
    const fitsHeight = qLines.length * qLineH <= quoteAreaH;
    if (fitsLines && fitsHeight) break;
    qSize -= 3;
    if (qSize <= 18) break;
  }
  if (qLines.length > MAX_LINES) {
    qLines = qLines.slice(0, MAX_LINES);
    qLines[MAX_LINES - 1] = qLines[MAX_LINES - 1].replace(/\s+\S*$/, "") + "…”";
  }

  // Vertically center the quote block within the safe quote area
  // so it's clearly separated from both photo above and caption below.
  const quoteBlockH = qLines.length * qLineH;
  const quoteStartY = quoteTop + Math.max(0, (quoteAreaH - quoteBlockH) / 2);

  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  let qy = quoteStartY + qSize;
  for (const line of qLines) {
    ctx.fillText(line, size / 2, qy);
    qy += qLineH;
  }

  // Bright accent underline bar under the quote — adds a designed feel.
  // Place it BELOW the last quote line (qy already advanced past it by qLineH),
  // with a small clear gap so it never visually overlaps the text descenders.
  const underlineW = Math.min(Math.round(size * 0.18), maxTextW * 0.4);
  const underlineH = Math.round(size * 0.012);
  const lastLineBaselineY = qy - qLineH; // baseline of last drawn line
  const underlineY = lastLineBaselineY + Math.round(qSize * 0.32);
  drawRoundedRect(ctx, (size - underlineW) / 2, underlineY, underlineW, underlineH, underlineH / 2);
  ctx.fillStyle = palette.accent;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = black;
  ctx.stroke();

  // ============== 6. CAPTION PANEL ==============
  const caption = (opts.caption || "").trim();
  if (caption) {
    const panelMargin = Math.round(size * 0.09);
    const panelX = panelMargin;
    const panelW = size - panelMargin * 2;
    let cSize = caption.length > 110 ? 22 : caption.length > 70 ? 26 : 30;
    ctx.font = `600 ${cSize}px "Space Grotesk", system-ui, sans-serif`;
    let cLines = wrapLines(ctx, caption, panelW - Math.round(size * 0.05));
    if (cLines.length > 2) {
      cLines = cLines.slice(0, 2);
      cLines[1] = cLines[1].replace(/\s+\S*$/, "") + "…";
    }
    const cLineH = Math.round(cSize * 1.3);
    const panelPadY = Math.round(size * 0.022);
    const panelH = cLines.length * cLineH + panelPadY * 2;
    const panelY = size - footerH - panelH - Math.round(size * 0.025);
    const panelR = Math.round(size * 0.03);

    // shadow
    drawRoundedRect(ctx, panelX + 5, panelY + 5, panelW, panelH, panelR);
    ctx.fillStyle = black;
    ctx.fill();
    // panel body — white for clean separation (or accent2 tinted on dark paper)
    drawRoundedRect(ctx, panelX, panelY, panelW, panelH, panelR);
    ctx.fillStyle = isLightOnDark ? "#FFFFFF" : "#FFFFFF";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = black;
    ctx.stroke();

    ctx.fillStyle = "#121212";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    let cy = panelY + panelPadY + cSize;
    for (const line of cLines) {
      ctx.fillText(line, size / 2, cy);
      cy += cLineH;
    }
  }

  // ============== 7. FOOTER (PETDRAMA mark + watermark) ==============
  const footerY = size - Math.round(size * 0.035);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  // small accent dot
  ctx.beginPath();
  ctx.arc(sideMargin + 7, footerY - 8, 7, 0, Math.PI * 2);
  ctx.fillStyle = palette.accent;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = black;
  ctx.stroke();

  ctx.font = `800 20px "Syne", system-ui, sans-serif`;
  ctx.fillStyle = ink;
  ctx.fillText("PETDRAMA", sideMargin + 24, footerY);

  if (opts.watermark) {
    ctx.font = `500 13px "Space Grotesk", system-ui, sans-serif`;
    ctx.fillStyle = inkSoft;
    ctx.textAlign = "right";
    ctx.fillText("Made with PetDrama · petdrama.app", size - sideMargin, footerY);
  }

  return canvas.toDataURL("image/png");
}

// ============== Helpers ==============

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawRoundedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, r);
  ctx.clip();
  const ir = img.width / img.height;
  const tr = w / h;
  let sx = 0,
    sy = 0,
    sw = img.width,
    sh = img.height;
  if (ir > tr) {
    sw = img.height * tr;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / tr;
    sy = Math.max(0, (img.height - sh) * 0.3);
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + " " + words[i] : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = words[i];
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawDotGrid(ctx: CanvasRenderingContext2D, size: number, color: string) {
  const step = Math.round(size * 0.022);
  const r = Math.max(1, Math.round(size * 0.0018));
  ctx.fillStyle = color;
  for (let y = step; y < size; y += step) {
    for (let x = step; x < size; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  points: number,
  fill: string,
  stroke: string,
) {
  const innerR = outerR * 0.45;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (Math.PI / points) * i - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Download any URL (data:, blob:, http(s):) as a real file without navigating
 * away. For cross-origin URLs (e.g. Supabase signed URLs) the browser ignores
 * the anchor `download` attribute and would otherwise navigate to the image —
 * so we fetch into a Blob first and download from a blob: URL.
 */
export async function downloadUrlAsFile(url: string, filename: string) {
  // Fast path: data: URLs work directly with the anchor download attribute.
  if (url.startsWith("data:")) {
    downloadDataUrl(url, filename);
    return;
  }
  try {
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (err) {
    console.error("[PetDrama download fallback]", err);
    // Last resort: open in new tab so we never replace the current page.
    window.open(url, "_blank", "noopener");
  }
}
