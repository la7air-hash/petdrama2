// Renders a square shareable PNG — refined PetDrama brand: cream paper,
// soft polaroid, teal/coral/yellow accents, pet-aware decorative toy stickers.
import { getStyle, type DramaStyleId } from "./drama";
import type { PetType } from "./drama";

// PetDrama brand palette (per logo): teal, coral, warm yellow, cream.
const BRAND = {
  teal: "#2EBFB8",
  tealDeep: "#1FA39C",
  coral: "#F08070",
  coralDeep: "#E26656",
  yellow: "#F8D24A",
  yellowSoft: "#FFE9A8",
  cream: "#FBF4E4",
  creamWarm: "#F7EBC6",
  pink: "#F7C7C7",
  ink: "#23393F", // soft warm dark instead of pure black
  inkSoft: "rgba(35,57,63,0.65)",
  inkLine: "rgba(35,57,63,0.18)",
};

// Per-style accent picks from the brand palette (no purples).
const STYLE_ACCENT: Record<
  string,
  { paper: string; paper2: string; accent: string; accent2: string }
> = {
  primary:    { paper: BRAND.cream,     paper2: BRAND.yellowSoft, accent: BRAND.coral, accent2: BRAND.teal },
  secondary:  { paper: BRAND.cream,     paper2: BRAND.pink,       accent: BRAND.teal,  accent2: BRAND.coral },
  accent:     { paper: BRAND.cream,     paper2: "#CFEFEC",        accent: BRAND.teal,  accent2: BRAND.yellow },
  highlight:  { paper: BRAND.creamWarm, paper2: BRAND.yellowSoft, accent: BRAND.coral, accent2: BRAND.teal },
  foreground: { paper: BRAND.cream,     paper2: BRAND.yellowSoft, accent: BRAND.coral, accent2: BRAND.teal },
};

interface RenderOpts {
  imageDataUrl: string;
  petName: string;
  styleId: DramaStyleId;
  petType?: PetType;
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
  const ink = BRAND.ink;
  const inkSoft = BRAND.inkSoft;

  // ============== 1. CREAM PAPER BACKGROUND with soft warm vignette ==============
  // Base diagonal warm gradient (cream → slightly warmer cream)
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, accent.paper);
  grad.addColorStop(1, accent.paper2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Soft warm radial glow center (gives premium 3D-toy depth)
  const glow = ctx.createRadialGradient(size * 0.5, size * 0.42, size * 0.05, size * 0.5, size * 0.5, size * 0.7);
  glow.addColorStop(0, "rgba(255,255,255,0.55)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  // Subtle dotted texture
  drawDotGrid(ctx, size, "rgba(35,57,63,0.05)");

  // Pastel decorative blobs (cream/yellow/teal/coral hints)
  drawSoftBlob(ctx, size * 0.10, size * 0.16, size * 0.34, BRAND.yellowSoft, 0.65);
  drawSoftBlob(ctx, size * 0.94, size * 0.84, size * 0.32, "#CFEFEC", 0.6);
  drawSoftBlob(ctx, size * 0.88, size * 0.10, size * 0.18, BRAND.pink, 0.45);
  drawSoftBlob(ctx, size * 0.06, size * 0.92, size * 0.20, BRAND.yellowSoft, 0.5);

  // Decorative paw prints scattered (very soft, brand-tinted)
  drawPaw(ctx, size * 0.06, size * 0.74, size * 0.045, BRAND.coral, 0.20, -0.2);
  drawPaw(ctx, size * 0.94, size * 0.22, size * 0.04, BRAND.teal, 0.22, 0.3);
  drawPaw(ctx, size * 0.16, size * 0.94, size * 0.035, BRAND.yellow, 0.28, 0.1);
  drawPaw(ctx, size * 0.84, size * 0.94, size * 0.03, BRAND.coral, 0.20, -0.4);
  drawPaw(ctx, size * 0.04, size * 0.06, size * 0.028, BRAND.teal, 0.18, 0.6);

  // Tiny sparkle stars for the toy-like premium feel
  drawSparkle(ctx, size * 0.20, size * 0.10, size * 0.018, BRAND.yellow, 0.7);
  drawSparkle(ctx, size * 0.78, size * 0.06, size * 0.014, BRAND.coral, 0.55);
  drawSparkle(ctx, size * 0.72, size * 0.94, size * 0.016, BRAND.teal, 0.6);
  drawSparkle(ctx, size * 0.26, size * 0.86, size * 0.013, BRAND.coral, 0.5);


  // ============== 2. POLAROID PHOTO FRAME (rounded, soft shadow, slight tilt) ==============
  const frameW = Math.round(size * 0.74);
  const frameH = Math.round(size * 0.56);
  const frameX = Math.round((size - frameW) / 2);
  const frameY = Math.round(size * 0.1);
  const frameR = Math.round(size * 0.05);
  const tilt = -0.02;

  const cx = frameX + frameW / 2;
  const cy = frameY + frameH / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tilt);
  ctx.translate(-cx, -cy);

  // Soft drop shadow (multi-pass for softness)
  ctx.save();
  ctx.shadowColor = "rgba(35,57,63,0.22)";
  ctx.shadowBlur = 32;
  ctx.shadowOffsetY = 14;
  drawRoundedRect(ctx, frameX, frameY, frameW, frameH, frameR);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.restore();

  // Inner thin pastel frame line (toy-like)
  drawRoundedRect(ctx, frameX + 4, frameY + 4, frameW - 8, frameH - 8, frameR - 4);
  ctx.lineWidth = 2;
  ctx.strokeStyle = BRAND.inkLine;
  ctx.stroke();

  // Inner photo
  const inset = Math.round(size * 0.028);
  const photoX = frameX + inset;
  const photoY = frameY + inset;
  const photoW = frameW - inset * 2;
  const photoH = frameH - inset * 2 - Math.round(size * 0.04);
  const photoR = Math.round(size * 0.03);

  const img = await loadImage(opts.imageDataUrl);
  drawRoundedImage(ctx, img, photoX, photoY, photoW, photoH, photoR);

  // Subtle glossy highlight on top of the photo (toy feel)
  ctx.save();
  drawRoundedRect(ctx, photoX, photoY, photoW, photoH, photoR);
  ctx.clip();
  const gloss = ctx.createLinearGradient(photoX, photoY, photoX, photoY + photoH * 0.5);
  gloss.addColorStop(0, "rgba(255,255,255,0.28)");
  gloss.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gloss;
  ctx.fillRect(photoX, photoY, photoW, photoH * 0.5);
  ctx.restore();

  ctx.restore(); // end tilt

  // ============== 3. PET-AWARE TOY STICKERS (subtle, around the frame) ==============
  drawPetToys(ctx, size, opts.petType, accent);

  // ============== 4. PILL BADGE ==============
  const idText = `${(opts.petName || "Your pet").toUpperCase()} — ${style.name.toUpperCase()}`;
  let badgeFontSize = Math.round(size * 0.032);
  ctx.font = `700 ${badgeFontSize}px "Fredoka", "Nunito", system-ui, sans-serif`;
  const badgePadX = Math.round(size * 0.038);
  const badgePadY = Math.round(size * 0.018);
  const maxBadgeW = frameW - inset * 2 + 20;
  while (ctx.measureText(idText).width + badgePadX * 2 > maxBadgeW && badgeFontSize > 16) {
    badgeFontSize -= 2;
    ctx.font = `700 ${badgeFontSize}px "Fredoka", "Nunito", system-ui, sans-serif`;
  }
  const badgeW = ctx.measureText(idText).width + badgePadX * 2;
  const badgeH = badgeFontSize + badgePadY * 2;
  const badgeX = (size - badgeW) / 2;
  const photoBottom = photoY + photoH;
  const badgeY = photoBottom - badgeH / 2 + 4;
  const badgeR = Math.round(badgeH / 2);

  // Soft shadow under badge
  ctx.save();
  ctx.shadowColor = "rgba(35,57,63,0.25)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 6;
  drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeR);
  ctx.fillStyle = accent.accent;
  ctx.fill();
  ctx.restore();

  // Glossy highlight on badge top
  ctx.save();
  drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeR);
  ctx.clip();
  const bg = ctx.createLinearGradient(0, badgeY, 0, badgeY + badgeH);
  bg.addColorStop(0, "rgba(255,255,255,0.35)");
  bg.addColorStop(0.6, "rgba(255,255,255,0)");
  ctx.fillStyle = bg;
  ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
  ctx.restore();

  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(idText, badgeX + badgeW / 2, badgeY + badgeH / 2 + 1);

  // ============== 5. QUOTE + CAPTION (top-down, no overlap) ==============
  const sideMargin = Math.round(size * 0.085);
  const maxTextW = size - sideMargin * 2;
  const quote = `“${opts.quote}”`;
  const footerH = Math.round(size * 0.06);

  const badgeBottom = badgeY + badgeH + 6;
  const tiltDrop = Math.round((frameW / 2) * Math.abs(tilt));
  const breathingGap = Math.round(size * 0.04);
  const quoteTop = Math.max(badgeBottom, photoBottom + tiltDrop) + breathingGap;

  const caption = (opts.caption || "").trim();
  const hasCaption = !!caption;
  const panelMargin = Math.round(size * 0.09);
  const panelW = size - panelMargin * 2;
  const panelR = Math.round(size * 0.035);
  const panelPadY = Math.round(size * 0.022);

  let cSize = 0;
  let cLines: string[] = [];
  let cLineH = 0;
  let panelH = 0;
  if (hasCaption) {
    cSize = caption.length > 110 ? 22 : caption.length > 70 ? 26 : 30;
    ctx.font = `500 ${cSize}px "Nunito", system-ui, sans-serif`;
    cLines = wrapLines(ctx, caption, panelW - Math.round(size * 0.05));
    if (cLines.length > 2) {
      cLines = cLines.slice(0, 2);
      cLines[1] = cLines[1].replace(/\s+\S*$/, "") + "…";
    }
    cLineH = Math.round(cSize * 1.3);
    panelH = cLines.length * cLineH + panelPadY * 2;
  }

  const bottomReserve = footerH + Math.round(size * 0.025);
  const captionGap = hasCaption ? Math.round(size * 0.04) : 0;
  const underlineReserve = Math.round(size * 0.035);
  const captionPanelTopMax = size - bottomReserve - panelH;
  const quoteAreaBottom = (hasCaption ? captionPanelTopMax : size - bottomReserve) - captionGap - underlineReserve;
  const quoteAreaH = Math.max(0, quoteAreaBottom - quoteTop);

  let qSize =
    quote.length > 140 ? 30 :
    quote.length > 110 ? 34 :
    quote.length > 90  ? 40 :
    quote.length > 60  ? 50 : 58;
  let qLines: string[] = [];
  let qLineH = 0;
  const MAX_LINES = 4;
  for (let attempt = 0; attempt < 20; attempt++) {
    ctx.font = `700 ${qSize}px "Fredoka", system-ui, sans-serif`;
    qLines = wrapLines(ctx, quote, maxTextW);
    qLineH = Math.round(qSize * 1.14);
    const fitsLines = qLines.length <= MAX_LINES;
    const fitsHeight = qLines.length * qLineH <= quoteAreaH;
    if (fitsLines && fitsHeight) break;
    qSize -= 3;
    if (qSize <= 16) break;
  }
  if (qLines.length > MAX_LINES) {
    qLines = qLines.slice(0, MAX_LINES);
    qLines[MAX_LINES - 1] = qLines[MAX_LINES - 1].replace(/\s+\S*$/, "") + "…”";
  }

  const quoteBlockH = qLines.length * qLineH;
  const quoteStartY = quoteTop + Math.max(0, (quoteAreaH - quoteBlockH) / 2);

  ctx.font = `700 ${qSize}px "Fredoka", system-ui, sans-serif`;
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  let qy = quoteStartY + qSize;
  for (const line of qLines) {
    ctx.fillText(line, size / 2, qy);
    qy += qLineH;
  }

  // Hand-drawn underline accent
  const underlineW = Math.min(Math.round(size * 0.2), maxTextW * 0.4);
  const underlineH = Math.round(size * 0.012);
  const lastLineBaselineY = qy - qLineH;
  const underlineY = lastLineBaselineY + Math.round(qSize * 0.32);
  drawRoundedRect(ctx, (size - underlineW) / 2, underlineY, underlineW, underlineH, underlineH / 2);
  ctx.fillStyle = accent.accent;
  ctx.fill();

  // ============== 6. CAPTION SPEECH-BUBBLE PANEL ==============
  if (hasCaption) {
    const panelX = panelMargin;
    const panelY = size - bottomReserve - panelH;
    const minPanelY = underlineY + underlineH + Math.round(size * 0.025);
    const finalPanelY = Math.max(panelY, minPanelY);

    ctx.save();
    ctx.shadowColor = "rgba(35,57,63,0.18)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    drawRoundedRect(ctx, panelX, finalPanelY, panelW, panelH, panelR);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.restore();

    drawRoundedRect(ctx, panelX, finalPanelY, panelW, panelH, panelR);
    ctx.lineWidth = 2;
    ctx.strokeStyle = BRAND.inkLine;
    ctx.stroke();

    ctx.font = `500 ${cSize}px "Nunito", system-ui, sans-serif`;
    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    let cy2 = finalPanelY + panelPadY + cSize;
    for (const line of cLines) {
      ctx.fillText(line, size / 2, cy2);
      cy2 += cLineH;
    }
  }

  // ============== 7. FOOTER ==============
  const footerY = size - Math.round(size * 0.035);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  // Teal dot mark
  ctx.beginPath();
  ctx.arc(sideMargin + 7, footerY - 8, 7, 0, Math.PI * 2);
  ctx.fillStyle = BRAND.teal;
  ctx.fill();

  ctx.font = `700 20px "Fredoka", system-ui, sans-serif`;
  ctx.fillStyle = ink;
  ctx.fillText("PetDrama", sideMargin + 24, footerY);

  if (opts.watermark) {
    const wmFontSize = Math.max(18, Math.round(size * 0.022));
    ctx.font = `600 ${wmFontSize}px "Nunito", system-ui, sans-serif`;
    ctx.fillStyle = inkSoft;
    ctx.textAlign = "right";
    ctx.fillText("Made with PetDrama · petdrama.online", size - sideMargin, footerY);
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
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, r);
  ctx.clip();
  const ir = img.width / img.height;
  const tr = w / h;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
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

function drawSoftBlob(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha = 0.5) {
  const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
  g.addColorStop(0, hexToRgba(color, alpha));
  g.addColorStop(1, hexToRgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function hexToRgba(hex: string, a: number): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.substring(0, 2), 16);
  const g = parseInt(m.substring(2, 4), 16);
  const b = parseInt(m.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// ============== Decorative paw + toys ==============

function drawSparkle(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number, color: string, alpha = 1,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = hexToRgba(color, alpha);
  // 4-point sparkle (diamond with pinched waist)
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.quadraticCurveTo(r * 0.18, -r * 0.18, r, 0);
  ctx.quadraticCurveTo(r * 0.18, r * 0.18, 0, r);
  ctx.quadraticCurveTo(-r * 0.18, r * 0.18, -r, 0);
  ctx.quadraticCurveTo(-r * 0.18, -r * 0.18, 0, -r);
  ctx.closePath();
  ctx.fill();
  // Tiny center highlight
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = hexToRgba("#FFFFFF", Math.min(1, alpha + 0.2));
  ctx.fill();
  ctx.restore();
}

function drawPaw(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, size: number, color: string, alpha = 1, rotate = 0,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotate);
  ctx.fillStyle = hexToRgba(color, alpha);
  // Main pad
  ctx.beginPath();
  ctx.ellipse(0, size * 0.35, size * 0.5, size * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  // Toes
  const toes = [
    { x: -size * 0.55, y: -size * 0.1, r: size * 0.22 },
    { x: -size * 0.2, y: -size * 0.45, r: size * 0.22 },
    { x: size * 0.2, y: -size * 0.45, r: size * 0.22 },
    { x: size * 0.55, y: -size * 0.1, r: size * 0.22 },
  ];
  for (const t of toes) {
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPetToys(
  ctx: CanvasRenderingContext2D,
  size: number,
  petType: PetType | undefined,
  accent: { accent: string; accent2: string },
) {
  // Anchor points around the frame: top-right, bottom-left
  const tr = { x: size * 0.86, y: size * 0.12 };
  const bl = { x: size * 0.12, y: size * 0.6 };

  switch (petType) {
    case "dog":
      drawBone(ctx, bl.x, bl.y, size * 0.085, "#FFFFFF", BRAND.ink, -0.35);
      drawBall(ctx, tr.x, tr.y, size * 0.06, BRAND.coral, BRAND.ink);
      break;
    case "cat":
      drawYarn(ctx, bl.x, bl.y, size * 0.075, BRAND.coral);
      drawFish(ctx, tr.x, tr.y, size * 0.08, BRAND.teal, BRAND.ink, 0.25);
      break;
    case "bird":
      drawBell(ctx, bl.x, bl.y, size * 0.07, BRAND.yellow, BRAND.ink);
      drawSeed(ctx, tr.x, tr.y, size * 0.05, BRAND.coral);
      break;
    case "rabbit":
      drawCarrot(ctx, bl.x, bl.y, size * 0.09, -0.3);
      drawBall(ctx, tr.x, tr.y, size * 0.05, BRAND.teal, BRAND.ink);
      break;
    case "hamster":
      drawWheel(ctx, bl.x, bl.y, size * 0.09, BRAND.teal, BRAND.ink);
      drawSeed(ctx, tr.x, tr.y, size * 0.05, BRAND.coral);
      break;
    default:
      drawBall(ctx, bl.x, bl.y, size * 0.06, BRAND.coral, BRAND.ink);
      drawBall(ctx, tr.x, tr.y, size * 0.05, BRAND.teal, BRAND.ink);
  }
}

function withSoftShadow(ctx: CanvasRenderingContext2D, fn: () => void) {
  ctx.save();
  ctx.shadowColor = "rgba(35,57,63,0.22)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 5;
  fn();
  ctx.restore();
}

function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, stroke: string) {
  withSoftShadow(ctx, () => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  });
  // Glossy highlight
  ctx.beginPath();
  ctx.ellipse(x - r * 0.35, y - r * 0.4, r * 0.35, r * 0.2, -0.4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.lineWidth = 2;
  ctx.strokeStyle = hexToRgba(stroke, 0.25);
  ctx.stroke();
}

function drawBone(
  ctx: CanvasRenderingContext2D, x: number, y: number, len: number, fill: string, stroke: string, rot = 0,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  withSoftShadow(ctx, () => {
    const r = len * 0.35;
    ctx.beginPath();
    ctx.arc(-len, -r * 0.5, r, 0, Math.PI * 2);
    ctx.arc(-len, r * 0.5, r, 0, Math.PI * 2);
    ctx.arc(len, -r * 0.5, r, 0, Math.PI * 2);
    ctx.arc(len, r * 0.5, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    drawRoundedRect(ctx, -len, -r * 0.55, len * 2, r * 1.1, r * 0.4);
    ctx.fill();
  });
  // Soft outline
  ctx.lineWidth = 2;
  ctx.strokeStyle = hexToRgba(stroke, 0.25);
  ctx.stroke();
  ctx.restore();
}

function drawYarn(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  withSoftShadow(ctx, () => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });
  // Yarn lines
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 2;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.ellipse(x + i * r * 0.18, y, r * 0.95, r * 0.95, 0.4, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  // Loose strand
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.bezierCurveTo(x + r * 1.6, y + r * 0.2, x + r * 1.4, y + r * 1.1, x + r * 1.9, y + r * 1.2);
  ctx.stroke();
}

function drawFish(
  ctx: CanvasRenderingContext2D, x: number, y: number, len: number, fill: string, stroke: string, rot = 0,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  withSoftShadow(ctx, () => {
    ctx.beginPath();
    ctx.ellipse(0, 0, len, len * 0.55, 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    // Tail
    ctx.beginPath();
    ctx.moveTo(len * 0.7, 0);
    ctx.lineTo(len * 1.3, -len * 0.45);
    ctx.lineTo(len * 1.3, len * 0.45);
    ctx.closePath();
    ctx.fill();
  });
  // Eye
  ctx.beginPath();
  ctx.arc(-len * 0.5, -len * 0.1, len * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-len * 0.5, -len * 0.1, len * 0.04, 0, Math.PI * 2);
  ctx.fillStyle = stroke;
  ctx.fill();
  ctx.restore();
}

function drawBell(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, stroke: string) {
  withSoftShadow(ctx, () => {
    ctx.beginPath();
    ctx.moveTo(x - r, y + r * 0.6);
    ctx.lineTo(x - r * 0.85, y - r * 0.7);
    ctx.quadraticCurveTo(x, y - r * 1.1, x + r * 0.85, y - r * 0.7);
    ctx.lineTo(x + r, y + r * 0.6);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  });
  // Slot
  drawRoundedRect(ctx, x - r * 0.5, y + r * 0.2, r, r * 0.18, r * 0.09);
  ctx.fillStyle = hexToRgba(stroke, 0.5);
  ctx.fill();
  // Top hoop
  ctx.beginPath();
  ctx.arc(x, y - r * 1.2, r * 0.18, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

function drawSeed(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  for (let i = 0; i < 3; i++) {
    const dx = (i - 1) * r * 0.9;
    const dy = (i % 2) * r * 0.4;
    ctx.save();
    ctx.translate(x + dx, y + dy);
    ctx.rotate(i * 0.4);
    withSoftShadow(ctx, () => {
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.6, r * 0.35, 0, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
    ctx.restore();
  }
}

function drawCarrot(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  withSoftShadow(ctx, () => {
    ctx.beginPath();
    ctx.moveTo(-len * 0.3, -len * 0.2);
    ctx.lineTo(len * 0.5, 0);
    ctx.lineTo(-len * 0.3, len * 0.2);
    ctx.closePath();
    ctx.fillStyle = BRAND.coral;
    ctx.fill();
  });
  // Greens
  ctx.fillStyle = BRAND.teal;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(-len * 0.35 + i * len * 0.05, -len * 0.35 + i * 0.04, len * 0.14, len * 0.08, -0.4 + i * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawWheel(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, stroke: string) {
  withSoftShadow(ctx, () => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
  });
  ctx.lineWidth = r * 0.18;
  ctx.strokeStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  // Spokes
  ctx.lineWidth = 3;
  ctx.strokeStyle = hexToRgba(stroke, 0.45);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.18, y + Math.sin(a) * r * 0.18);
    ctx.lineTo(x + Math.cos(a) * (r - r * 0.2), y + Math.sin(a) * (r - r * 0.2));
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(x, y, r * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
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
    window.open(url, "_blank", "noopener");
  }
}
