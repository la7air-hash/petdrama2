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

  // Subtle bottom gradient scrim so the quote stays readable over any photo
  const scrimH = Math.round(size * 0.42);
  const scrimY = size - pad - scrimH;
  ctx.save();
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, radius);
  ctx.clip();
  const scrim = ctx.createLinearGradient(0, scrimY, 0, size - pad);
  scrim.addColorStop(0, "rgba(0,0,0,0)");
  scrim.addColorStop(1, "rgba(0,0,0,0.78)");
  ctx.fillStyle = scrim;
  ctx.fillRect(cardX, scrimY, cardW, scrimH);
  ctx.restore();

  // Small style chip top-left
  drawChip(ctx, `${style.emoji} ${style.name.toUpperCase()}`, cardX + 28, cardY + 28, "#ffffff", "#121212");

  // Pet name chip top-right
  if (opts.petName.trim()) {
    const label = opts.petName.toUpperCase();
    drawChip(ctx, label, cardX + cardW - 28, cardY + 28, accent, "#121212", true);
  }

  // Quote text directly on the scrim — no big white panel covering the pet
  const quote = `“${opts.quote}”`;
  const maxQuoteWidth = cardW - 80;
  const fontSize = quote.length > 90 ? 42 : quote.length > 60 ? 50 : 58;
  ctx.font = `800 ${fontSize}px "Syne", system-ui, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // Compute wrapped lines first so we can position from the bottom
  const lines = wrapLines(ctx, quote, maxQuoteWidth);
  const lineHeight = Math.round(fontSize * 1.12);
  const brandRowH = 44;
  const bottomY = size - pad - 36; // baseline anchor for brand row
  const quoteBottom = bottomY - brandRowH - 18;
  let y = quoteBottom - (lines.length - 1) * lineHeight;
  for (const line of lines) {
    ctx.fillText(line, cardX + 40, y);
    y += lineHeight;
  }

  // Brand row (logo left, watermark right) — small, clean
  ctx.font = `800 22px "Syne", system-ui, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  // logo dot
  ctx.beginPath();
  ctx.arc(cardX + 40 + 7, bottomY - 7, 8, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillText("PETDRAMA", cardX + 40 + 24, bottomY);

  if (opts.watermark) {
    ctx.font = `500 18px "Space Grotesk", system-ui, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.textAlign = "right";
    ctx.fillText("Made with PetDrama · petdrama.app", cardX + cardW - 40, bottomY);
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
