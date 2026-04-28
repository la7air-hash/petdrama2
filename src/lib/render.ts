// Renders a square shareable PNG with the pet image as the hero + dramatic quote overlay
import { getStyle, type DramaStyleId } from "./drama";

const STYLE_ACCENT: Record<string, string> = {
  primary: "#FF00BD",
  secondary: "#2E16FF",
  accent: "#00F0FF",
  highlight: "#F4FF00",
  foreground: "#121212",
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
  const accent = STYLE_ACCENT[style.color] ?? STYLE_ACCENT.primary;

  // Solid background (visible only as a thin frame around the pet)
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, size, size);

  // Load image
  const img = await loadImage(opts.imageDataUrl);

  // Pet image fills almost the entire canvas — pet is the hero
  const pad = Math.round(size * 0.025);
  const cardX = pad;
  const cardY = pad;
  const cardW = size - pad * 2;
  const cardH = size - pad * 2;
  const radius = Math.round(size * 0.04);
  drawRoundedImage(ctx, img, cardX, cardY, cardW, cardH, radius);

  // Subtle dark gradient ONLY at the bottom — keeps the pet visible
  const scrimH = Math.round(size * 0.42);
  const scrimY = size - pad - scrimH;
  ctx.save();
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, radius);
  ctx.clip();
  const scrim = ctx.createLinearGradient(0, scrimY, 0, size - pad);
  scrim.addColorStop(0, "rgba(0,0,0,0)");
  scrim.addColorStop(0.45, "rgba(0,0,0,0.45)");
  scrim.addColorStop(1, "rgba(0,0,0,0.88)");
  ctx.fillStyle = scrim;
  ctx.fillRect(cardX, scrimY, cardW, scrimH);
  ctx.restore();

  // === IDENTITY BADGE (top) — "Persy — Mafia Boss" ===
  // Bold sticker-style badge so the pet identity is unmistakable.
  const idText = `${(opts.petName || "Your pet").toUpperCase()} — ${style.name.toUpperCase()}`;
  const badgeFontSize = Math.round(size * 0.038); // ~41 at 1080
  ctx.font = `800 ${badgeFontSize}px "Syne", system-ui, sans-serif`;
  const idMetrics = ctx.measureText(idText);
  const badgePadX = Math.round(size * 0.032);
  const badgePadY = Math.round(size * 0.018);
  const badgeW = Math.min(cardW - pad * 2, idMetrics.width + badgePadX * 2);
  const badgeH = badgeFontSize + badgePadY * 2;
  const badgeX = cardX + (cardW - badgeW) / 2;
  const badgeY = cardY + Math.round(size * 0.04);
  const badgeR = Math.round(badgeH / 2);

  // Hard offset shadow behind badge (sticker style)
  drawRoundedRect(ctx, badgeX + 7, badgeY + 7, badgeW, badgeH, badgeR);
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fill();
  // Badge fill
  drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeR);
  ctx.fillStyle = accent;
  ctx.fill();
  // Thick black border
  drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeR);
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#121212";
  ctx.stroke();
  // Text — pick contrast color based on accent
  const onDark = style.color === "foreground" || style.color === "secondary";
  ctx.fillStyle = onDark ? "#ffffff" : "#121212";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Auto-shrink if too wide for the card
  let actualText = idText;
  let actualSize = badgeFontSize;
  while (ctx.measureText(actualText).width > badgeW - badgePadX * 2 && actualSize > 22) {
    actualSize -= 2;
    ctx.font = `800 ${actualSize}px "Syne", system-ui, sans-serif`;
  }
  ctx.fillText(actualText, badgeX + badgeW / 2, badgeY + badgeH / 2 + 2);

  // Quote text on the scrim — bottom placement, no chips covering the pet
  const quote = `“${opts.quote}”`;
  const sidePad = Math.round(size * 0.05);
  const maxQuoteWidth = cardW - sidePad * 2;
  const fontSize = quote.length > 90 ? 38 : quote.length > 60 ? 44 : 50;
  ctx.font = `800 ${fontSize}px "Syne", system-ui, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const lines = wrapLines(ctx, quote, maxQuoteWidth);
  const lineHeight = Math.round(fontSize * 1.12);
  const brandRowH = 22;
  const bottomY = size - pad - 30;

  // Caption (selected) — sits between quote and brand row
  const caption = (opts.caption || "").trim();
  let captionLines: string[] = [];
  let captionFontSize = 0;
  let captionLineHeight = 0;
  let captionBlockH = 0;
  if (caption) {
    captionFontSize = caption.length > 110 ? 22 : caption.length > 70 ? 26 : 30;
    captionLineHeight = Math.round(captionFontSize * 1.25);
    ctx.font = `600 ${captionFontSize}px "Space Grotesk", system-ui, sans-serif`;
    captionLines = wrapLines(ctx, caption, maxQuoteWidth);
    // cap to 3 lines for clean composition
    if (captionLines.length > 3) {
      captionLines = captionLines.slice(0, 3);
      const last = captionLines[2];
      captionLines[2] = last.replace(/\s+\S*$/, "") + "…";
    }
    captionBlockH = captionLines.length * captionLineHeight;
  }

  const captionGap = caption ? 22 : 0;
  const captionBottom = bottomY - brandRowH - 18;
  const quoteBottom = captionBottom - captionBlockH - captionGap;

  // Draw quote
  ctx.font = `800 ${fontSize}px "Syne", system-ui, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  let y = quoteBottom - (lines.length - 1) * lineHeight;
  for (const line of lines) {
    ctx.fillText(line, cardX + sidePad, y);
    y += lineHeight;
  }

  // Draw caption below quote
  if (caption) {
    ctx.font = `600 ${captionFontSize}px "Space Grotesk", system-ui, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    let cy = captionBottom - (captionLines.length - 1) * captionLineHeight;
    for (const line of captionLines) {
      ctx.fillText(line, cardX + sidePad, cy);
      cy += captionLineHeight;
    }
  }

  // Small brand row: PETDRAMA (left) + pet name/style + watermark (right)
  ctx.font = `800 18px "Syne", system-ui, sans-serif`;
  ctx.textBaseline = "alphabetic";
  ctx.beginPath();
  ctx.arc(cardX + sidePad + 5, bottomY - 6, 6, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.fillText("PETDRAMA", cardX + sidePad + 18, bottomY);

  const right = cardX + cardW - sidePad;
  if (opts.watermark) {
    ctx.font = `500 13px "Space Grotesk", system-ui, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.textAlign = "right";
    ctx.fillText("Made with PetDrama · petdrama.app", right, bottomY);
  }

  return canvas.toDataURL("image/png");
}

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
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
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
  // cover fit, biased slightly upward so faces stay in frame
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
    sy = Math.max(0, (img.height - sh) * 0.35);
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();

  // Border
  drawRoundedRect(ctx, x, y, w, h, r);
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#121212";
  ctx.stroke();
}

function drawChip(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  bg: string,
  fg: string,
  rightAlign = false,
) {
  ctx.font = `700 20px "Space Grotesk", system-ui, sans-serif`;
  const padX = 18;
  const padY = 12;
  const w = ctx.measureText(text).width + padX * 2;
  const h = 20 + padY * 2;
  const rx = rightAlign ? x - w : x;
  drawRoundedRect(ctx, rx, y, w, h, 999);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#121212";
  ctx.stroke();
  ctx.fillStyle = fg;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, rx + padX, y + h / 2 + 1);
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

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
