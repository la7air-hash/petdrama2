// Renders a square shareable PNG in POLAROID/STICKER style:
// - thick colored frame around the photo
// - clean pet photo (no overlay text)
// - sticker pill badge centered on the bottom edge of the photo
// - dramatic quote written below the photo, on the frame
// - small PETDRAMA wordmark + optional watermark in the footer
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
  const onDark = style.color === "foreground" || style.color === "secondary";

  // ---- Frame (Polaroid) ---------------------------------------------------
  // Outer frame fills the canvas with the style color.
  const outerR = Math.round(size * 0.05);
  drawRoundedRect(ctx, 0, 0, size, size, outerR);
  ctx.fillStyle = accent;
  ctx.fill();
  // Thick black border for the sticker look
  drawRoundedRect(ctx, 4, 4, size - 8, size - 8, outerR - 2);
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#121212";
  ctx.stroke();

  // ---- Photo area ---------------------------------------------------------
  const sideMargin = Math.round(size * 0.07);
  const topMargin = Math.round(size * 0.07);
  const photoW = size - sideMargin * 2;
  const photoH = Math.round(size * 0.62); // square-ish photo area
  const photoX = sideMargin;
  const photoY = topMargin;
  const photoR = Math.round(size * 0.035);

  const img = await loadImage(opts.imageDataUrl);
  drawRoundedImage(ctx, img, photoX, photoY, photoW, photoH, photoR);

  // ---- Sticker badge (centered, sitting on the bottom edge of the photo) -
  const idText = `${(opts.petName || "Your pet").toUpperCase()} — ${style.name.toUpperCase()}`;
  const badgeFontSize = Math.round(size * 0.032);
  ctx.font = `800 ${badgeFontSize}px "Syne", system-ui, sans-serif`;
  let actualText = idText;
  let actualSize = badgeFontSize;
  const badgePadX = Math.round(size * 0.028);
  const maxBadgeW = photoW - sideMargin;
  while (ctx.measureText(actualText).width + badgePadX * 2 > maxBadgeW && actualSize > 18) {
    actualSize -= 2;
    ctx.font = `800 ${actualSize}px "Syne", system-ui, sans-serif`;
  }
  const badgePadY = Math.round(size * 0.016);
  const badgeW = ctx.measureText(actualText).width + badgePadX * 2;
  const badgeH = actualSize + badgePadY * 2;
  const badgeX = photoX + (photoW - badgeW) / 2;
  const badgeY = photoY + photoH - badgeH / 2;
  const badgeR = Math.round(badgeH / 2);

  // sticker shadow
  drawRoundedRect(ctx, badgeX + 6, badgeY + 6, badgeW, badgeH, badgeR);
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fill();
  // badge fill (dark to pop on any frame color, like the example cards)
  drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeR);
  ctx.fillStyle = onDark ? "#ffffff" : "#121212";
  ctx.fill();
  drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeR);
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#121212";
  ctx.stroke();
  ctx.fillStyle = onDark ? "#121212" : "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(actualText, badgeX + badgeW / 2, badgeY + badgeH / 2 + 2);

  // ---- Quote area (below the photo, on the frame) ------------------------
  const quote = `“${opts.quote}”`;
  const quoteTop = photoY + photoH + Math.round(badgeH / 2) + Math.round(size * 0.025);
  const footerH = Math.round(size * 0.05);
  const quoteAreaBottom = size - sideMargin - footerH;
  const maxQuoteWidth = photoW;

  // Frame text color: dark on light/bright frames, white on dark frames
  const frameTextColor = onDark ? "#ffffff" : "#121212";

  // Pick a font size that fits in the available block (max 4 lines)
  let qSize = quote.length > 90 ? 40 : quote.length > 60 ? 48 : 56;
  let qLines: string[] = [];
  let qLineH = 0;
  for (let attempt = 0; attempt < 8; attempt++) {
    ctx.font = `800 ${qSize}px "Syne", system-ui, sans-serif`;
    qLines = wrapLines(ctx, quote, maxQuoteWidth);
    qLineH = Math.round(qSize * 1.12);
    const totalH = qLines.length * qLineH;
    if (qLines.length <= 4 && totalH <= quoteAreaBottom - quoteTop - 60) break;
    qSize -= 4;
    if (qSize <= 24) break;
  }
  if (qLines.length > 4) {
    qLines = qLines.slice(0, 4);
    qLines[3] = qLines[3].replace(/\s+\S*$/, "") + "…”";
  }

  ctx.fillStyle = frameTextColor;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  let qy = quoteTop + qSize;
  for (const line of qLines) {
    ctx.fillText(line, photoX, qy);
    qy += qLineH;
  }

  // ---- Caption (smaller, under the quote) --------------------------------
  const caption = (opts.caption || "").trim();
  if (caption) {
    const cSize = caption.length > 110 ? 22 : caption.length > 70 ? 26 : 30;
    const cLineH = Math.round(cSize * 1.25);
    ctx.font = `600 ${cSize}px "Space Grotesk", system-ui, sans-serif`;
    let cLines = wrapLines(ctx, caption, maxQuoteWidth);
    if (cLines.length > 2) {
      cLines = cLines.slice(0, 2);
      cLines[1] = cLines[1].replace(/\s+\S*$/, "") + "…";
    }
    ctx.fillStyle = onDark ? "rgba(255,255,255,0.92)" : "rgba(18,18,18,0.78)";
    let cy = qy + Math.round(size * 0.012);
    // make sure it fits
    const maxCy = quoteAreaBottom;
    for (const line of cLines) {
      if (cy > maxCy) break;
      ctx.fillText(line, photoX, cy);
      cy += cLineH;
    }
  }

  // ---- Footer: PETDRAMA + watermark --------------------------------------
  const footerY = size - sideMargin + 4;
  ctx.font = `800 20px "Syne", system-ui, sans-serif`;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.beginPath();
  ctx.arc(photoX + 6, footerY - 7, 6, 0, Math.PI * 2);
  ctx.fillStyle = onDark ? "#ffffff" : "#121212";
  ctx.fill();
  ctx.fillStyle = frameTextColor;
  ctx.fillText("PETDRAMA", photoX + 20, footerY);

  if (opts.watermark) {
    ctx.font = `500 13px "Space Grotesk", system-ui, sans-serif`;
    ctx.fillStyle = onDark ? "rgba(255,255,255,0.7)" : "rgba(18,18,18,0.6)";
    ctx.textAlign = "right";
    ctx.fillText("Made with PetDrama · petdrama.app", photoX + photoW, footerY);
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
  drawRoundedRect(ctx, x, y, w, h, r);
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#121212";
  ctx.stroke();
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
