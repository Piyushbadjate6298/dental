/**
 * Dental Utilities and Prescription Report Generator
 * Shital Dental Services
 */

import {
  getSelectedTeethSummary,
  LEFT_INDICES,
  RIGHT_INDICES,
  teeth,
  TOOTH_NAMES,
  TOOTH_PATHS,
} from './toothData.js';

export const STORE = 'shital-dental-v1';

export const DEFAULT_INQUIRY_FORM_SETTINGS = {
  labInstructions: [
    { id: 'inst-1', name: 'White Metal', enabled: true },
    { id: 'inst-2', name: 'Ceramic', enabled: true },
    { id: 'inst-3', name: 'Zircon', enabled: true },
    { id: 'inst-4', name: 'Valplast', enabled: true },
    { id: 'inst-5', name: 'R.P.D.C.', enabled: true },
    { id: 'inst-6', name: 'Half Ceramic', enabled: true },
    { id: 'inst-7', name: 'Japanese Gold', enabled: true },
  ],
  trialOptions: [
    { id: 'trial-1', name: 'Metal Trial', enabled: true },
    { id: 'trial-2', name: 'Bisque Trial', enabled: true },
    { id: 'trial-3', name: 'Final', enabled: true },
  ],
  toothShades: [
    { id: 'shade-1', name: 'A1', enabled: true },
    { id: 'shade-2', name: 'A2', enabled: true },
    { id: 'shade-3', name: 'A3', enabled: true },
    { id: 'shade-4', name: 'A3.5', enabled: true },
    { id: 'shade-5', name: 'B1', enabled: true },
    { id: 'shade-6', name: 'B2', enabled: true },
    { id: 'shade-7', name: 'C1', enabled: true },
    { id: 'shade-8', name: 'C2', enabled: true },
    { id: 'shade-9', name: 'D2', enabled: true },
    { id: 'shade-10', name: 'Bleach', enabled: true },
  ],
  allowOtherLabInstruction: true,
  allowOtherTrialOption: true,
  allowOtherShade: true,
  customFields: [],
};

export const defaultData = {
  doctors: [],
  whatsapp: '919370045066',
  labName: 'Shital Dental Services',
  labAddress: 'Lasalgaon 422306, Tal. Niphad, Nashik',
  labPhone: '9370045066',
  nextNo: 1,
  inquiries: [],
  inquiryFormSettings: DEFAULT_INQUIRY_FORM_SETTINGS,
};

export const instructions = [
  'White Metal',
  'Ceramic',
  'Zircon',
  'Valplast',
  'R.P.D.C.',
  'Half Ceramic',
  'Japanese Gold',
];

export const stages = ['Metal Trial', 'Bisque Trial', 'Final'];

export { teeth };

export const today = () => new Date().toISOString().slice(0, 10);

export const readData = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORE) || '{}');
    const merged = { ...defaultData, ...stored };
    if (!String(merged.whatsapp || '').trim()) {
      merged.whatsapp = defaultData.whatsapp;
    }
    return merged;
  } catch {
    return { ...defaultData };
  }
};

export function toothNames(keys = []) {
  return (keys || []).map((k) => {
    const [j, rawI] = k.split('-');
    const i = Number(rawI);
    const num = teeth[i];
    const side = i <= 7 ? "Patient's Right" : "Patient's Left";
    const typeName = TOOTH_NAMES[num] || 'Tooth';
    return `${j === 'U' ? 'Upper' : 'Lower'} ${side} ${typeName} (#${num})`;
  });
}

export function getJawTeeth(keys = []) {
  const upper = [];
  const lower = [];
  (keys || []).forEach((k) => {
    const [j, i] = k.split('-');
    const num = teeth[Number(i)];
    if (j === 'U') upper.push(num);
    else if (j === 'L') lower.push(num);
  });
  return {
    upper: upper.length ? upper.join(', ') : 'None',
    lower: lower.length ? lower.join(', ') : 'None',
    upperCount: upper.length,
    lowerCount: lower.length,
    totalCount: (keys || []).length,
  };
}

export function cleanPhone(s) {
  let digits = (s || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if (digits.length === 10) {
    return '91' + digits;
  }
  return digits;
}

export function makeMessage(x, d) {
  const summary = getSelectedTeethSummary(x.teeth);
  const labTitle = (d.labName || 'Shital Dental Services').toUpperCase();

  const upperRightStr = summary.upper.right.length
    ? summary.upper.right.join(', ')
    : 'None';
  const upperLeftStr = summary.upper.left.length
    ? summary.upper.left.join(', ')
    : 'None';
  const lowerRightStr = summary.lower.right.length
    ? summary.lower.right.join(', ')
    : 'None';
  const lowerLeftStr = summary.lower.left.length
    ? summary.lower.left.join(', ')
    : 'None';

  const lines = [
    `*${labTitle}*`,
    `*CUSTOMER INQUIRY & DENTAL PRESCRIPTION*`,
    `──────────────────────────`,
    `*Inquiry Ref:* Inquiry #${x.number}`,
    `*Date:* ${x.date}`,
    ``,
    `*Doctor's Name:* ${x.doctor || '—'}`,
    `*Patient's Name:* ${x.patient || '—'}`,
    `*Tooth Shade:* ${x.shade || '—'}`,
    ``,
    `*SELECTED TEETH (ODONTOGRAM SUMMARY):*`,
    `*Upper Jaw (Maxillary):*`,
    `  • Patient's Right: ${upperRightStr}`,
    `  • Patient's Left: ${upperLeftStr}`,
    `*Lower Jaw (Mandibular):*`,
    `  • Patient's Right: ${lowerRightStr}`,
    `  • Patient's Left: ${lowerLeftStr}`,
    `*Total Selected:* ${summary.totalCount} tooth/teeth`,
    ``,
    `*Lab Instructions:* ${(x.instructions || []).join(', ') || '—'}`,
    `*Trial Requirements:* ${(x.stages || []).join(', ') || '—'}`,
  ];

  if (x.customFields && typeof x.customFields === 'object' && Object.keys(x.customFields).length > 0) {
    lines.push(``);
    lines.push(`*Custom Details:*`);
    Object.entries(x.customFields).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim()) {
        lines.push(`  • *${k}:* ${Array.isArray(v) ? v.join(', ') : v}`);
      }
    });
  }

  if (x.note && x.note.trim()) {
    lines.push(``);
    lines.push(`*Additional Instructions:* ${x.note.trim()}`);
  }

  lines.push(`──────────────────────────`);
  lines.push(`*Lab Contact:* ${d.labPhone || '—'}`);
  lines.push(`*Anatomical Tooth Chart Attached in Generated Prescription Image*`);

  return lines.join('\n');
}

export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function wrapLines(ctx, text, maxWidth) {
  const str = String(text || '—');
  const words = str.split(/\s+/);
  const lines = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      if (ctx.measureText(word).width <= maxWidth) {
        current = word;
      } else {
        let chunk = '';
        for (const ch of word) {
          if (ctx.measureText(chunk + ch).width > maxWidth && chunk) {
            lines.push(chunk);
            chunk = ch;
          } else {
            chunk += ch;
          }
        }
        current = chunk;
      }
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : ['—'];
}

function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/**
 * Draws a single anatomical tooth on the 2D canvas using vector paths.
 */
function drawCanvasTooth(ctx, toothNumber, jaw, side, isSelected, x, y, width, height) {
  const num = Number(toothNumber);
  const paths = TOOTH_PATHS[num] || TOOTH_PATHS[1];
  const isLower = jaw === 'L';
  const isLeft = side === 'L';

  // 1. Tooth Slot Container Box
  drawRoundRect(ctx, x, y, width, height, 7);
  if (isSelected) {
    ctx.fillStyle = '#f0fdfa';
    ctx.fill();
    ctx.strokeStyle = '#0d9488';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 2. Anatomical Crown Vector Illustration
  const illustrationH = 46;
  const illustrationW = 38;
  const illX = x + (width - illustrationW) / 2;
  const illY = y + 5;

  ctx.save();
  ctx.translate(illX, illY);

  if (isLeft) {
    ctx.translate(illustrationW, 0);
    ctx.scale(-1, 1);
  }
  if (isLower) {
    ctx.translate(0, illustrationH);
    ctx.scale(1, -1);
  }

  // Scale from 50x60 viewBox to illustrationW x illustrationH
  const scaleX = illustrationW / 50;
  const scaleY = illustrationH / 60;
  ctx.scale(scaleX, scaleY);

  try {
    const crownPath = new Path2D(paths.crown);

    // Crown fill
    if (isSelected) {
      const grad = ctx.createLinearGradient(0, 0, 0, 60);
      grad.addColorStop(0, '#14b8a6');
      grad.addColorStop(0.5, '#0d9488');
      grad.addColorStop(1, '#0f766e');
      ctx.fillStyle = grad;
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, 60);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.65, '#f8fafc');
      grad.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = grad;
    }
    ctx.fill(crownPath);

    // Crown stroke
    ctx.strokeStyle = isSelected ? '#0f766e' : '#94a3b8';
    ctx.lineWidth = isSelected ? 2 : 1.3;
    ctx.lineJoin = 'round';
    ctx.stroke(crownPath);

    // Incisal edge
    if (paths.incisal) {
      const incisalPath = new Path2D(paths.incisal);
      ctx.strokeStyle = isSelected ? '#ffffff' : '#94a3b8';
      ctx.lineWidth = isSelected ? 1.8 : 1.3;
      ctx.lineCap = 'round';
      ctx.stroke(incisalPath);
    }

    // Fissures / Grooves
    if (paths.grooves) {
      const groovesPath = new Path2D(paths.grooves);
      ctx.strokeStyle = isSelected ? 'rgba(255, 255, 255, 0.9)' : '#cbd5e1';
      ctx.lineWidth = isSelected ? 1.4 : 1.1;
      ctx.lineCap = 'round';
      ctx.stroke(groovesPath);
    }

    // Fossa accents
    if (paths.fossa) {
      const fossaPath = new Path2D(paths.fossa);
      ctx.strokeStyle = isSelected ? 'rgba(255, 255, 255, 0.75)' : '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      ctx.stroke(fossaPath);
    }
  } catch {
    // Graceful fallback if Path2D is unsupported
    ctx.fillStyle = isSelected ? '#0d9488' : '#e2e8f0';
    ctx.fillRect(4, 4, 42, 52);
  }

  ctx.restore();

  // 3. Tooth Number Badge
  const badgeY = y + height - 24;
  const badgeH = 20;
  const badgeW = width - 12;
  const badgeX = x + 6;

  drawRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 5);
  if (isSelected) {
    ctx.fillStyle = '#0f766e';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
  } else {
    ctx.fillStyle = '#f1f5f9';
    ctx.fill();
    ctx.fillStyle = '#334155';
  }

  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(num), badgeX + badgeW / 2, badgeY + badgeH / 2 + 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

/**
 * Draws the complete dental odontogram (Upper & Lower arches, midline, side labels) on canvas.
 */
function drawCanvasOdontogram(ctx, selectedKeys, startY, contentW, centerX) {
  const selectedSet = new Set(selectedKeys || []);
  const toothW = 54;
  const toothH = 78;
  const spacing = 8;
  const quadWidth = 8 * toothW + 7 * spacing; // 488px
  const midlineGap = 64; // gap for midline pillar

  const startXRight = centerX - midlineGap / 2 - quadWidth; // e.g. 600 - 32 - 488 = 80px
  const startXLeft = centerX + midlineGap / 2; // e.g. 600 + 32 = 632px

  let currentY = startY;

  // Odontogram Container Card
  const totalOdontogramH = 310;
  ctx.fillStyle = '#f8faf9';
  drawRoundRect(ctx, 60, currentY, contentW, totalOdontogramH, 12);
  ctx.fill();
  ctx.strokeStyle = '#dce5df';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Odontogram Header Banner inside card
  ctx.fillStyle = '#164e63';
  drawRoundRect(ctx, 60, currentY, contentW, 42, 10);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.fillText('ANATOMICAL DENTAL ODONTOGRAM (ALL 32 PERMANENT TEETH)', 85, currentY + 27);

  // Viewer / Patient orientation reminder on the right of header
  ctx.font = 'bold 13px Arial, sans-serif';
  ctx.fillStyle = '#a5f3fc';
  ctx.textAlign = 'right';
  ctx.fillText("Viewer's Left = Patient's Right  |  Viewer's Right = Patient's Left", contentW + 35, currentY + 27);
  ctx.textAlign = 'left';

  currentY += 54;

  // Patient Orientation Indicators row
  ctx.font = 'bold 13px Arial, sans-serif';
  ctx.fillStyle = '#0f766e';
  ctx.fillText('← PATIENT\'S RIGHT', startXRight + 6, currentY);

  ctx.textAlign = 'right';
  ctx.fillText('PATIENT\'S LEFT →', startXLeft + quadWidth - 6, currentY);
  ctx.textAlign = 'left';

  currentY += 12;

  // --- UPPER JAW (Maxillary) ---
  // Jaw label
  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('UPPER JAW (MAXILLARY)', startXRight + 6, currentY);
  currentY += 8;

  // Draw Upper Right (indices 0..7 => teeth 8..1)
  RIGHT_INDICES.forEach((i, idx) => {
    const num = teeth[i];
    const key = `U-${i}`;
    const isSelected = selectedSet.has(key);
    const tx = startXRight + idx * (toothW + spacing);
    drawCanvasTooth(ctx, num, 'U', 'R', isSelected, tx, currentY, toothW, toothH);
  });

  // Center Midline Pillar for Upper
  const midX = centerX;
  ctx.strokeStyle = '#94a3b8';
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(midX, currentY - 5);
  ctx.lineTo(midX, currentY + toothH + 5);
  ctx.stroke();
  ctx.setLineDash([]); // reset dash

  // Midline badge
  drawRoundRect(ctx, midX - 22, currentY + toothH / 2 - 10, 44, 20, 10);
  ctx.fillStyle = '#e0f2fe';
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#0369a1';
  ctx.font = 'bold 9px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MIDLINE', midX, currentY + toothH / 2 + 3);
  ctx.textAlign = 'left';

  // Draw Upper Left (indices 8..15 => teeth 1..8)
  LEFT_INDICES.forEach((i, idx) => {
    const num = teeth[i];
    const key = `U-${i}`;
    const isSelected = selectedSet.has(key);
    const tx = startXLeft + idx * (toothW + spacing);
    drawCanvasTooth(ctx, num, 'U', 'L', isSelected, tx, currentY, toothW, toothH);
  });

  currentY += toothH + 14;

  // --- OCCLUSAL PLANE DIVIDER ---
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(startXRight, currentY);
  ctx.lineTo(midX - 110, currentY);
  ctx.moveTo(midX + 110, currentY);
  ctx.lineTo(startXLeft + quadWidth, currentY);
  ctx.stroke();

  // Occlusal plane center badge
  drawRoundRect(ctx, midX - 105, currentY - 11, 210, 22, 11);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 10px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('OCCLUSAL PLANE • BITING SURFACE', midX, currentY + 3);
  ctx.textAlign = 'left';

  currentY += 14;

  // --- LOWER JAW (Mandibular) ---
  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('LOWER JAW (MANDIBULAR)', startXRight + 6, currentY);
  currentY += 8;

  // Draw Lower Right (indices 0..7 => teeth 8..1)
  RIGHT_INDICES.forEach((i, idx) => {
    const num = teeth[i];
    const key = `L-${i}`;
    const isSelected = selectedSet.has(key);
    const tx = startXRight + idx * (toothW + spacing);
    drawCanvasTooth(ctx, num, 'L', 'R', isSelected, tx, currentY, toothW, toothH);
  });

  // Center Midline Pillar for Lower
  ctx.strokeStyle = '#94a3b8';
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(midX, currentY - 5);
  ctx.lineTo(midX, currentY + toothH + 5);
  ctx.stroke();
  ctx.setLineDash([]);

  drawRoundRect(ctx, midX - 22, currentY + toothH / 2 - 10, 44, 20, 10);
  ctx.fillStyle = '#e0f2fe';
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#0369a1';
  ctx.font = 'bold 9px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MIDLINE', midX, currentY + toothH / 2 + 3);
  ctx.textAlign = 'left';

  // Draw Lower Left (indices 8..15 => teeth 1..8)
  LEFT_INDICES.forEach((i, idx) => {
    const num = teeth[i];
    const key = `L-${i}`;
    const isSelected = selectedSet.has(key);
    const tx = startXLeft + idx * (toothW + spacing);
    drawCanvasTooth(ctx, num, 'L', 'L', isSelected, tx, currentY, toothW, toothH);
  });

  return startY + totalOdontogramH;
}

/**
 * Draws the grouped Selected Teeth Summary card on the canvas immediately below the odontogram.
 */
function drawCanvasSelectedTeethSummary(ctx, selectedKeys, startY, contentW) {
  const summary = getSelectedTeethSummary(selectedKeys);
  const total = summary.totalCount;
  const cardH = 138;

  drawRoundRect(ctx, 60, startY, contentW, cardH, 12);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#0d9488';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Summary Card Header Bar
  ctx.fillStyle = '#0f766e';
  drawRoundRect(ctx, 60, startY, contentW, 36, 10);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.fillText('SELECTED TEETH SUMMARY (FOR DENTAL LABORATORY FABRICATION)', 85, startY + 23);

  // Total count pill
  const countText = `${total} ${total === 1 ? 'TOOTH' : 'TEETH'} SELECTED`;
  ctx.font = 'bold 13px Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ccfbf1';
  ctx.fillText(countText, contentW + 35, startY + 23);
  ctx.textAlign = 'left';

  if (total === 0) {
    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 16px Arial, sans-serif';
    ctx.fillText('No teeth selected in this inquiry. Full prescription details below.', 85, startY + 75);
    return startY + cardH;
  }

  const colW = (contentW - 40) / 2;
  const leftColX = 80;
  const rightColX = 80 + colW + 20;

  // Helper to draw tooth number chips
  const drawChips = (label, numbers, x, y) => {
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(label, x, y);

    const labelW = ctx.measureText(label).width;
    let chipX = x + labelW + 10;

    if (!numbers || numbers.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'italic 13px Arial, sans-serif';
      ctx.fillText('None', chipX, y);
      return;
    }

    numbers.forEach((num) => {
      const chipW = 26;
      const chipH = 22;
      drawRoundRect(ctx, chipX, y - 16, chipW, chipH, 5);
      ctx.fillStyle = '#0d9488';
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(num), chipX + chipW / 2, y);
      ctx.textAlign = 'left';

      chipX += chipW + 6;
    });
  };

  // Row 1: Upper Jaw (Maxillary)
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.fillStyle = '#0f766e';
  ctx.fillText('Upper Jaw (Maxillary):', leftColX, startY + 62);

  drawChips("Patient's Right: ", summary.upper.right, leftColX + 175, startY + 62);
  drawChips("Patient's Left: ", summary.upper.left, rightColX + 20, startY + 62);

  // Subtle separator line
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, startY + 82);
  ctx.lineTo(contentW + 40, startY + 82);
  ctx.stroke();

  // Row 2: Lower Jaw (Mandibular)
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.fillStyle = '#0f766e';
  ctx.fillText('Lower Jaw (Mandibular):', leftColX, startY + 112);

  drawChips("Patient's Right: ", summary.lower.right, leftColX + 175, startY + 112);
  drawChips("Patient's Left: ", summary.lower.left, rightColX + 20, startY + 112);

  return startY + cardH;
}

/**
 * Generates the high-resolution A4-proportioned customer inquiry report image
 * containing the full realistic anatomical odontogram and complete prescription details.
 */
export function makeInquiryReportBlob(x, d) {
  return new Promise((resolve) => {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    const W = 1200; // Crisp high-definition width
    const contentW = W - 120; // 1080px
    const centerX = W / 2; // 600px

    // Pre-calculate wrapped notes lines if present
    ctx.font = '17px Arial, sans-serif';
    const noteLines = x.note && x.note.trim() ? wrapLines(ctx, x.note.trim(), contentW - 60) : [];

    // Calculate canvas height
    // Header (210) + Info Bar (70) + Patient Details Card (110) + Odontogram (320) +
    // Summary Box (145) + Instructions & Trials (160) + Notes (if any) + Footer (120) + Margins
    let neededH = 1260;
    if (noteLines.length > 0) {
      neededH += 40 + noteLines.length * 26;
    }
    const H = Math.max(1360, neededH);

    c.width = W;
    c.height = H;

    // 1. Sheet Background
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, W, H);

    // 2. White Prescription Paper Card
    drawRoundRect(ctx, 36, 36, W - 72, H - 72, 16);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. Header Banner
    ctx.fillStyle = '#0f3a40';
    drawRoundRect(ctx, 36, 36, W - 72, 185, 16);
    ctx.fill();
    // Square the bottom corners of banner
    ctx.fillRect(36, 170, W - 72, 51);

    // Lab Medical Emblem
    ctx.fillStyle = '#14b8a6';
    ctx.beginPath();
    ctx.arc(120, 125, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✦', 120, 140);
    ctx.textAlign = 'left';

    // Lab Title & Details
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.fillText(d.labName || 'Shital Dental Services', 185, 112);

    ctx.fillStyle = '#5eead4';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText('DIGITAL DENTAL LABORATORY & PRESCRIPTION REPORT', 188, 144);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '15px Arial, sans-serif';
    ctx.fillText(`${d.labAddress || 'Lasalgaon 422306, Tal. Niphad, Nashik'}   •   Phone: ${d.labPhone || '9370045066'}`, 188, 172);

    // 4. Inquiry Ref & Date Subheader
    let curY = 252;
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText(`CUSTOMER INQUIRY  #${x.number}`, 60, curY);

    ctx.textAlign = 'right';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(`Date: ${x.date || today()}`, contentW + 60, curY);
    ctx.textAlign = 'left';

    curY += 16;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(60, curY);
    ctx.lineTo(contentW + 60, curY);
    ctx.stroke();

    curY += 20;

    // 5. Patient & Doctor Details Card (4 clean metric columns)
    const infoCardH = 82;
    drawRoundRect(ctx, 60, curY, contentW, infoCardH, 10);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.stroke();

    const colW = contentW / 4;
    const patientFields = [
      ["DOCTOR'S NAME", x.doctor || '—'],
      ["PATIENT'S NAME", x.patient || '—'],
      ['TOOTH SHADE', x.shade || '—'],
      ['STATUS', x.status || 'Submitted'],
    ];

    patientFields.forEach(([label, val], idx) => {
      const fx = 80 + idx * colW;
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.fillText(label, fx, curY + 28);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 19px Arial, sans-serif';
      // Truncate long strings if necessary
      let displayVal = val;
      if (ctx.measureText(displayVal).width > colW - 25) {
        displayVal = displayVal.slice(0, 18) + '…';
      }
      ctx.fillText(displayVal, fx, curY + 58);
    });

    curY += infoCardH + 24;

    // 6. Complete Anatomical Dental Odontogram (Upper & Lower)
    curY = drawCanvasOdontogram(ctx, x.teeth, curY, contentW, centerX);

    curY += 20;

    // 7. Grouped Selected Teeth Summary Card
    curY = drawCanvasSelectedTeethSummary(ctx, x.teeth, curY, contentW);

    curY += 24;

    // 8. Lab Instructions & Trial Requirements Section
    const labSecH = 92;
    drawRoundRect(ctx, 60, curY, contentW, labSecH, 10);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Lab Instructions Column
    ctx.fillStyle = '#0f766e';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillText('LAB INSTRUCTIONS (MATERIALS / WORK TYPES):', 80, curY + 30);

    const instList = (x.instructions || []).length > 0 ? x.instructions : ['Standard prescription'];
    let instChipX = 80;
    instList.forEach((inst) => {
      ctx.font = 'bold 13px Arial, sans-serif';
      const textW = ctx.measureText(inst).width;
      const chipW = textW + 24;
      drawRoundRect(ctx, instChipX, curY + 44, chipW, 28, 6);
      ctx.fillStyle = '#e6fffa';
      ctx.fill();
      ctx.strokeStyle = '#99f6e4';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#0d9488';
      ctx.fillText(`✓ ${inst}`, instChipX + 8, curY + 63);
      instChipX += chipW + 10;
    });

    // Trial Requirements Column
    const trialsX = centerX + 40;
    ctx.fillStyle = '#0f766e';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillText('TRIAL REQUIREMENTS:', trialsX, curY + 30);

    const stageList = (x.stages || []).length > 0 ? x.stages : ['Not specified'];
    let stageChipX = trialsX;
    stageList.forEach((stg) => {
      ctx.font = 'bold 13px Arial, sans-serif';
      const textW = ctx.measureText(stg).width;
      const chipW = textW + 24;
      drawRoundRect(ctx, stageChipX, curY + 44, chipW, 28, 6);
      ctx.fillStyle = '#f0fdf4';
      ctx.fill();
      ctx.strokeStyle = '#bbf7d0';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#16a34a';
      ctx.fillText(`✓ ${stg}`, stageChipX + 8, curY + 63);
      stageChipX += chipW + 10;
    });

    curY += labSecH + 20;

    // 9. Additional Instructions / Notes (if present)
    if (noteLines.length > 0) {
      const noteH = 36 + noteLines.length * 24;
      drawRoundRect(ctx, 60, curY, contentW, noteH, 8);
      ctx.fillStyle = '#fffbeb';
      ctx.fill();
      ctx.strokeStyle = '#fef3c7';
      ctx.stroke();

      ctx.fillStyle = '#b45309';
      ctx.font = 'bold 13px Arial, sans-serif';
      ctx.fillText('ADDITIONAL LAB INSTRUCTIONS / NOTES:', 80, curY + 24);

      ctx.fillStyle = '#78350f';
      ctx.font = '15px Arial, sans-serif';
      noteLines.forEach((line, lIdx) => {
        ctx.fillText(line, 80, curY + 48 + lIdx * 24);
      });

      curY += noteH + 20;
    }

    // 10. Bottom Verification Footer
    const footerY = H - 85;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(60, footerY - 20);
    ctx.lineTo(contentW + 60, footerY - 20);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Shital Dental Services  •  Digital Laboratory Prescription Desk', centerX, footerY);

    ctx.font = '14px Arial, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`Lab Contact: ${d.labPhone || '9370045066'}   •   WhatsApp: +${cleanPhone(d.whatsapp)}`, centerX, footerY + 24);
    ctx.textAlign = 'left';

    c.toBlob((b) => resolve(b), 'image/png');
  });
}

export async function shareInquiryOnWhatsApp(item, data) {
  const phone = cleanPhone(data.whatsapp);
  const canFileShare = !!(
    navigator.share &&
    navigator.canShare?.({
      files: [new File(['x'], 'share-test.txt', { type: 'text/plain' })],
    })
  );
  const fallbackTab = canFileShare ? null : window.open('about:blank', '_blank');

  try {
    const blob = await makeInquiryReportBlob(item, data);
    const file = new File([blob], `Shital-Inquiry-${item.number}.png`, {
      type: 'image/png',
    });
    const text = makeMessage(item, data);

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      if (fallbackTab && !fallbackTab.closed) fallbackTab.close();
      await navigator.share({
        title: `Dental Inquiry #${item.number}`,
        text,
        files: [file],
      });
      return 'shared';
    }

    downloadBlob(blob, `Shital-Inquiry-${item.number}.png`);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    if (fallbackTab && !fallbackTab.closed) {
      fallbackTab.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    return 'fallback';
  } catch (e) {
    if (fallbackTab && !fallbackTab.closed) fallbackTab.close();
    throw e;
  }
}
