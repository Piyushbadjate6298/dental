export const STORE = 'shital-dental-v1';

export const defaultData = {
  doctors: [],
  whatsapp: '919423105611',
  labName: 'Shital Dental Services',
  labAddress: 'Lasalgaon 422306, Tal. Niphad, Nashik',
  labPhone: '9370045066',
  nextNo: 301,
  inquiries: [],
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

export const teeth = [8, 7, 6, 5, 4, 3, 2, 1, 1, 2, 3, 4, 5, 6, 7, 8];

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
    const [j, i] = k.split('-');
    return `${j === 'U' ? 'Upper' : 'Lower'} ${teeth[Number(i)]}`;
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
  const jaws = getJawTeeth(x.teeth);
  const labTitle = (d.labName || 'Shital Dental Services').toUpperCase();
  const lines = [
    `*${labTitle}*`,
    `*CUSTOMER INQUIRY REPORT*`,
    `──────────────────────────`,
    `*Inquiry Ref:* #${x.number}`,
    `*Date:* ${x.date}`,
    ``,
    `*Doctor's Name:* ${x.doctor || '—'}`,
    `*Patient's Name:* ${x.patient || '—'}`,
    `*Tooth Shade:* ${x.shade || '—'}`,
    ``,
    `*Selected Upper Jaw Teeth:* ${jaws.upper}`,
    `*Selected Lower Jaw Teeth:* ${jaws.lower}`,
    ``,
    `*Lab Instructions:* ${(x.instructions || []).join(', ') || '—'}`,
    `*Trial Requirements:* ${(x.stages || []).join(', ') || '—'}`,
  ];

  if (x.note && x.note.trim()) {
    lines.push(``);
    lines.push(`*Additional Instructions:* ${x.note.trim()}`);
  }

  lines.push(`──────────────────────────`);
  lines.push(`*Lab Contact:* ${d.labPhone || '—'}`);
  lines.push(`*Submitted via Shital Dental Services Digital Lab Desk*`);

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

export function makeInquiryReportBlob(x, d) {
  return new Promise((resolve) => {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    const W = 1000;
    const jaws = getJawTeeth(x.teeth);

    // Pre-calculate wrapped lines for all inquiry report fields
    ctx.font = 'bold 22px Arial';
    const detailRows = [
      ['Doctor\'s Name', x.doctor || '—'],
      ['Patient\'s Name', x.patient || '—'],
      ['Inquiry Date', x.date || '—'],
      ['Tooth Shade', x.shade || '—'],
      ['Upper Jaw Teeth', jaws.upper],
      ['Lower Jaw Teeth', jaws.lower],
      ['Lab Instructions', (x.instructions || []).join(', ') || '—'],
      ['Trial Requirements', (x.stages || []).join(', ') || '—'],
      ...(x.note && x.note.trim() ? [['Additional Instructions', x.note.trim()]] : []),
    ].map(([label, val]) => ({
      label,
      lines: wrapLines(ctx, val, 580),
    }));

    const detailHeight = detailRows.reduce(
      (sum, row) => sum + 26 + row.lines.length * 32,
      0
    );
    const neededHeight = 360 + detailHeight + 170;
    const H = Math.max(1050, neededHeight);

    c.width = W;
    c.height = H;

    // Background
    ctx.fillStyle = '#f4f7f5';
    ctx.fillRect(0, 0, W, H);

    // Card container
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(48, 48, 904, H - 96);
    ctx.strokeStyle = '#d9e3dc';
    ctx.lineWidth = 2;
    ctx.strokeRect(48, 48, 904, H - 96);

    // Header banner
    ctx.fillStyle = '#12363b';
    ctx.fillRect(48, 48, 904, 205);

    // Emblem
    ctx.fillStyle = '#d7e7d8';
    ctx.beginPath();
    ctx.arc(130, 125, 43, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#12363b';
    ctx.font = 'bold 43px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('✦', 130, 141);
    ctx.textAlign = 'left';

    // Lab title and subtitle
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px Arial';
    ctx.fillText(d.labName || 'Shital Dental Services', 200, 117);
    ctx.fillStyle = '#9ec0b5';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('CUSTOMER INQUIRY & PRESCRIPTION REPORT', 202, 153);
    ctx.fillStyle = '#c9dcd4';
    ctx.font = '16px Arial';
    ctx.fillText(d.labAddress || '', 202, 186);

    // Inquiry Ref & Date Bar
    ctx.fillStyle = '#19383b';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`CUSTOMER INQUIRY  #${x.number}`, 90, 305);
    ctx.font = 'bold 19px Arial';
    ctx.fillStyle = '#556d67';
    ctx.textAlign = 'right';
    ctx.fillText(`Date: ${x.date}`, 910, 305);
    ctx.textAlign = 'left';

    // Top divider
    ctx.strokeStyle = '#dce5df';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(90, 330);
    ctx.lineTo(910, 330);
    ctx.stroke();

    // Detail rows
    let y = 380;
    detailRows.forEach(({ label, lines }, idx) => {
      // Subtle alternate background
      if (idx % 2 === 0) {
        ctx.fillStyle = '#f8faf9';
        const rowH = 20 + lines.length * 32;
        ctx.fillRect(85, y - 22, 830, rowH);
      }

      ctx.fillStyle = '#5c726b';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(label.toUpperCase(), 105, y);

      ctx.fillStyle = '#12363b';
      ctx.font = 'bold 21px Arial';
      lines.forEach((lineText, lineIdx) => {
        ctx.fillText(lineText, 340, y + lineIdx * 32);
      });

      y += 26 + lines.length * 32;
    });

    // Bottom divider
    ctx.strokeStyle = '#dce5df';
    ctx.beginPath();
    ctx.moveTo(90, H - 120);
    ctx.lineTo(910, H - 120);
    ctx.stroke();

    // Footer
    ctx.fillStyle = '#5c726b';
    ctx.font = 'bold 17px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Shital Dental Services  •  Dental Laboratory Inquiry', 500, H - 85);
    ctx.font = '15px Arial';
    ctx.fillStyle = '#7b8c82';
    ctx.fillText(`Contact: ${d.labPhone || '—'}  |  WhatsApp: +${cleanPhone(d.whatsapp)}`, 500, H - 60);
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

