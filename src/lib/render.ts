// Renders a square shareable PNG with the pet image + dramatic quote overlay
import { getStyle, type DramaStyleId } from "./drama";

const STYLE_GRADIENT: Record<string, [string, string]> = {
  primary: ["#FF00BD", "#FF7A00"],
  secondary: ["#2E16FF", "#00F0FF"],
  accent: ["#00F0FF", "#2E16FF"],
  highlight: ["#F4FF00", "#FF7A00"],
  foreground: ["#121212", "#3a3a3a"],
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
  const [g1, g2] = STYLE_GRADIENT[style.color] ?? STYLE_GRADIENT.primary;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, g1);
  grad.addColorStop(1, g2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Load image
  const img = await loadImage(opts.imageDataUrl);

  // Pet image card area (rounded)
  const pad = size * 0.06;
  const imgArea = { x: pad, y: pad, w: size - pad * 2, h: size * 0.62 };
  drawRoundedImage(ctx, img, imgArea.x, imgArea.y, imgArea.w, imgArea.h, 48);

  // Style chip top-left
  drawChip(ctx, `${style.emoji} ${style.name.toUpperCase()}`, pad + 24, pad + 24, "#ffffff", "#121212");

  // Pet name chip top-right
  if (opts.petName.trim()) {
    const label = opts.petName.toUpperCase();
    drawChip(ctx, label, size - pad - 24, pad + 24, "#121212", "#ffffff", true);
  }

  // Quote panel
  const panelY = imgArea.y + imgArea.h + size * 0.04;
  const panelH = size - panelY - pad;
  drawRoundedRect(ctx, pad, panelY, size - pad * 2, panelH, 40);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#121212";
  ctx.stroke();

  // Quote text
  ctx.fillStyle = "#121212";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const quote = `"${opts.quote}"`;
  const fontSize = quote.length > 90 ? 38 : quote.length > 60 ? 46 : 54;
  ctx.font = `800 ${fontSize}px "Syne", system-ui, sans-serif`;
  wrapText(ctx, quote, pad + 36, panelY + 36, size - pad * 2 - 72, fontSize * 1.15);

  // Brand / watermark
  ctx.font = `700 22px "Space Grotesk", system-ui, sans-serif`;
  ctx.fillStyle = "#121212";
  ctx.textAlign = "left";
  ctx.fillText("PETDRAMA", pad + 36, size - pad - 50);

  if (opts.watermark) {
    ctx.font = `500 20px "Space Grotesk", system-ui, sans-serif`;
    ctx.fillStyle = "rgba(18,18,18,0.55)";
    ctx.textAlign = "right";
    ctx.fillText("Made with PetDrama · petdrama.app", size - pad - 36, size - pad - 48);
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
  // cover fit
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
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();

  // Border
  drawRoundedRect(ctx, x, y, w, h, r);
  ctx.lineWidth = 8;
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
  ctx.font = `700 22px "Space Grotesk", system-ui, sans-serif`;
  const padX = 22;
  const padY = 14;
  const w = ctx.measureText(text).width + padX * 2;
  const h = 22 + padY * 2;
  const rx = rightAlign ? x - w : x;
  drawRoundedRect(ctx, rx, y, w, h, 999);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#121212";
  ctx.stroke();
  ctx.fillStyle = fg;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, rx + padX, y + h / 2);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let cy = y;
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + " ";
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, cy);
      line = words[i] + " ";
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line.trim(), x, cy);
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
