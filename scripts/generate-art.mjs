// Renders LUMA's packshot illustrations and editorial still-lifes as SVG.
// Source of truth for art direction is `art` on each product in src/data/products.js.
// Run: npm run generate:art   (outputs to public/images)
//
// These are art-directed placeholders that keep the storefront visually coherent in demo
// mode. Replace them with real product photography (same 4:5 ratio) before launch.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { products } from '../src/data/products.js';
import { brands } from '../src/data/categories.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images');

// ───────────────────────── colour helpers
const hex = (h) => h.replace('#', '');
const toRgb = (h) => {
  const v = hex(h);
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
};
const toHex = (rgb) => '#' + rgb.map((n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0')).join('');
const mix = (a, b, t) => {
  const A = toRgb(a);
  const B = toRgb(b);
  return toHex(A.map((v, i) => v + (B[i] - v) * t));
};
const lighten = (c, t) => mix(c, '#ffffff', t);
const darken = (c, t) => mix(c, '#1c1512', t);
const luminance = (c) => {
  const [r, g, b] = toRgb(c).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const isDark = (c) => luminance(c) < 0.25;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const SERIF = "Didot, 'Bodoni 72', 'Bodoni MT', Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

// ───────────────────────── SVG builder with scoped gradient ids
function createCtx(prefix) {
  let n = 0;
  const defs = [];
  const id = (k) => `${prefix}${k}${n++}`;
  return {
    defs,
    cyl(base, { sheen = 0.28, edge = 0.16 } = {}) {
      const gid = id('c');
      defs.push(
        `<linearGradient id="${gid}" x1="0" x2="1" y1="0" y2="0">` +
          `<stop offset="0" stop-color="${darken(base, edge)}"/>` +
          `<stop offset="0.16" stop-color="${lighten(base, sheen)}"/>` +
          `<stop offset="0.42" stop-color="${base}"/>` +
          `<stop offset="0.82" stop-color="${darken(base, edge * 0.45)}"/>` +
          `<stop offset="1" stop-color="${darken(base, edge * 1.1)}"/></linearGradient>`
      );
      return `url(#${gid})`;
    },
    linear(stops, { x1 = 0, y1 = 0, x2 = 0, y2 = 1 } = {}) {
      const gid = id('l');
      defs.push(
        `<linearGradient id="${gid}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">` +
          stops.map(([o, c, op = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${op}"/>`).join('') +
          `</linearGradient>`
      );
      return `url(#${gid})`;
    },
    radial(stops, { cx = 0.5, cy = 0.5, r = 0.5, fx, fy } = {}) {
      const gid = id('r');
      defs.push(
        `<radialGradient id="${gid}" cx="${cx}" cy="${cy}" r="${r}"${fx != null ? ` fx="${fx}" fy="${fy}"` : ''}>` +
          stops.map(([o, c, op = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${op}"/>`).join('') +
          `</radialGradient>`
      );
      return `url(#${gid})`;
    },
    blur(std) {
      const gid = id('b');
      defs.push(`<filter id="${gid}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${std}"/></filter>`);
      return `url(#${gid})`;
    },
    clip(shape) {
      const gid = id('k');
      defs.push(`<clipPath id="${gid}">${shape}</clipPath>`);
      return `url(#${gid})`;
    },
  };
}

const brandMark = (brandId) => {
  const b = brands.find((x) => x.id === brandId);
  if (!b) return 'LUMA';
  return b.id === 'br_luma' ? 'LUMA' : b.name.toUpperCase();
};

function labelBlock({ x = 0, y, brand, label, sub, color, width = 110, brandSize = 15 }) {
  const lines = [];
  const words = String(label || '').split(' ');
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > 13 && cur) {
      lines.push(cur.trim());
      cur = w;
    } else cur += ' ' + w;
  }
  if (cur.trim()) lines.push(cur.trim());
  brandSize = Math.min(brandSize, (width * 1.05) / (String(brand).length * 0.9));
  let out = `<text x="${x}" y="${y}" text-anchor="middle" font-family="${SERIF}" font-size="${brandSize}" letter-spacing="${brandSize * 0.28}" fill="${color}">${esc(brand)}</text>`;
  out += `<line x1="${x - width * 0.18}" x2="${x + width * 0.18}" y1="${y + 12}" y2="${y + 12}" stroke="${color}" stroke-opacity="0.45" stroke-width="0.8"/>`;
  lines.forEach((ln, i) => {
    out += `<text x="${x}" y="${y + 30 + i * 14}" text-anchor="middle" font-family="${SANS}" font-size="9.5" letter-spacing="1.6" fill="${color}">${esc(ln)}</text>`;
  });
  if (sub) out += `<text x="${x}" y="${y + 34 + lines.length * 14}" text-anchor="middle" font-family="${SANS}" font-size="7.5" letter-spacing="1.4" fill="${color}" fill-opacity="0.7">${esc(sub)}</text>`;
  return out;
}

// ───────────────────────── packaging shapes (origin = bottom centre, y grows downward)
const shapes = {
  dropper(ctx, a) {
    const W = 150;
    const H = 232;
    const glass = a.amber ? a.pack : a.pack;
    const txt = isDark(glass) || a.amber ? '#F7EFE6' : '#302823';
    let s = `<rect x="${-W / 2}" y="${-H}" width="${W}" height="${H}" rx="18" fill="${ctx.cyl(glass, { sheen: 0.35 })}"/>`;
    if (!a.amber) s += `<rect x="${-W / 2 + 8}" y="${-H * 0.62}" width="${W - 16}" height="${H * 0.62 - 8}" rx="12" fill="${a.accent}" fill-opacity="0.55"/>`;
    s += `<rect x="-26" y="${-H - 26}" width="52" height="30" fill="${darken(glass, 0.12)}"/>`;
    s += `<rect x="-38" y="${-H - 72}" width="76" height="50" rx="4" fill="${ctx.cyl(a.cap, { sheen: 0.3 })}"/>`;
    for (let i = -28; i <= 28; i += 8) s += `<line x1="${i}" x2="${i}" y1="${-H - 68}" y2="${-H - 26}" stroke="#000" stroke-opacity="0.07"/>`;
    s += `<path d="M-25 ${-H - 72} L-25 ${-H - 118} Q-25 ${-H - 166} 0 ${-H - 166} Q25 ${-H - 166} 25 ${-H - 118} L25 ${-H - 72} Z" fill="${ctx.cyl(darken(a.cap, 0.05), { sheen: 0.22 })}"/>`;
    s += `<rect x="${-W / 2 + 10}" y="${-H + 14}" width="9" height="${H - 34}" rx="4.5" fill="#fff" fill-opacity="0.38"/>`;
    s += `<rect x="${W / 2 - 16}" y="${-H + 24}" width="3" height="${H - 60}" fill="#fff" fill-opacity="0.22"/>`;
    s += labelBlock({ y: -H + 62, brand: a.brand, label: a.label, sub: a.sub, color: txt });
    return { svg: s, w: W, h: H + 166, labelY: -H + 80 };
  },
  pump(ctx, a) {
    const W = a.small ? 128 : 160;
    const H = a.small ? 236 : 296;
    const txt = isDark(a.pack) ? '#F7EFE6' : '#302823';
    let s = `<rect x="${-W / 2}" y="${-H}" width="${W}" height="${H}" rx="22" fill="${ctx.cyl(a.pack)}"/>`;
    s += `<rect x="-30" y="${-H - 34}" width="60" height="38" rx="3" fill="${ctx.cyl(a.cap, { sheen: 0.3 })}"/>`;
    s += `<rect x="-8" y="${-H - 64}" width="16" height="32" fill="${ctx.cyl(a.cap)}"/>`;
    s += `<path d="M-34 ${-H - 64} L44 ${-H - 64} L76 ${-H - 70} L76 ${-H - 60} L44 ${-H - 56} L44 ${-H - 52} L-34 ${-H - 52} Q-38 ${-H - 52} -38 ${-H - 58} Q-38 ${-H - 64} -34 ${-H - 64} Z" fill="${darken(a.cap, 0.05)}"/>`;
    s += `<path d="M-30 ${-H - 64} Q-30 ${-H - 86} 0 ${-H - 88} Q30 ${-H - 86} 34 ${-H - 64} Z" fill="${ctx.cyl(a.cap)}"/>`;
    s += `<rect x="${-W / 2 + 12}" y="${-H + 18}" width="10" height="${H - 44}" rx="5" fill="#fff" fill-opacity="0.32"/>`;
    s += labelBlock({ y: -H * 0.62, brand: a.brand, label: a.label, sub: a.sub, color: txt });
    return { svg: s, w: W, h: H + 88, labelY: -H * 0.55 };
  },
  jar(ctx, a, scale = 1) {
    const W = 244 * scale;
    const H = 150 * scale;
    const L = 64 * scale;
    const body = a.amberGlass ? a.pack : a.pack;
    const txt = isDark(body) ? '#F7EFE6' : '#302823';
    let s = `<rect x="${-W / 2}" y="${-H}" width="${W}" height="${H}" rx="${18 * scale}" fill="${ctx.cyl(body, { sheen: 0.3 })}"/>`;
    if (a.amberGlass) s += `<rect x="${-W / 2 + 10}" y="${-H + 18}" width="${W - 20}" height="${H - 28}" rx="12" fill="${a.accent}" fill-opacity="0.5"/>`;
    s += `<rect x="${-W / 2 - 6 * scale}" y="${-H - L}" width="${W + 12 * scale}" height="${L}" rx="${8 * scale}" fill="${ctx.cyl(a.cap, { sheen: 0.3 })}"/>`;
    s += `<rect x="${-W / 2 - 6 * scale}" y="${-H - 3}" width="${W + 12 * scale}" height="4" fill="#000" fill-opacity="0.08"/>`;
    s += `<rect x="${-W / 2 + 14 * scale}" y="${-H + 12}" width="${10 * scale}" height="${H - 26}" rx="5" fill="#fff" fill-opacity="0.3"/>`;
    s += labelBlock({ y: -H + 44 * scale, brand: a.brand, label: a.label, color: txt, brandSize: 15 * Math.max(scale, 0.8) });
    return { svg: s, w: W + 12, h: H + L, labelY: -H * 0.6 };
  },
  smalljar(ctx, a) {
    return shapes.jar(ctx, a, 0.74);
  },
  tube(ctx, a) {
    const txt = isDark(a.pack) ? '#F7EFE6' : '#302823';
    const capFill = a.metalTip
      ? ctx.linear([[0, '#8F8A85'], [0.2, '#F1EEEA'], [0.5, '#B9B2AA'], [0.8, '#8F8A85'], [1, '#6F6A66']], { x2: 1, y2: 0 })
      : ctx.cyl(a.cap);
    let s = `<rect x="-46" y="-84" width="92" height="84" rx="8" fill="${capFill}"/>`;
    s += `<path d="M-50 -82 C-54 -200 -80 -318 -82 -392 L82 -392 C80 -318 54 -200 50 -82 Z" fill="${ctx.cyl(a.pack, { sheen: 0.32 })}"/>`;
    s += `<rect x="-84" y="-414" width="168" height="26" rx="2" fill="${darken(a.pack, 0.05)}"/>`;
    for (let i = -78; i <= 78; i += 6) s += `<line x1="${i}" x2="${i}" y1="-410" y2="-392" stroke="#000" stroke-opacity="0.06"/>`;
    s += `<path d="M-64 -380 C-60 -300 -44 -180 -40 -110" stroke="#fff" stroke-opacity="0.45" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    s += labelBlock({ y: -300, brand: a.brand, label: a.label, sub: a.sub, color: txt });
    return { svg: s, w: 168, h: 414, labelY: -270 };
  },
  tin(ctx, a) {
    const W = 300;
    const H = 116;
    const txt = isDark(a.pack) ? '#F2E6D6' : '#302823';
    let s = `<rect x="${-W / 2}" y="${-H}" width="${W}" height="${H}" rx="14" fill="${ctx.cyl(a.pack, { sheen: 0.22 })}"/>`;
    s += `<rect x="${-W / 2 - 6}" y="${-H - 56}" width="${W + 12}" height="58" rx="8" fill="${ctx.cyl(a.cap, { sheen: 0.38 })}"/>`;
    s += `<rect x="${-W / 2 - 6}" y="${-H - 2}" width="${W + 12}" height="3" fill="#000" fill-opacity="0.12"/>`;
    s += labelBlock({ y: -H + 38, brand: a.brand, label: a.label, color: txt, width: 180 });
    // patches resting in front of the jar
    const crescent = (x, y, r, sc) =>
      `<g transform="translate(${x} ${y}) rotate(${r}) scale(${sc})">` +
      `<path d="M0 0 C26 -46 112 -48 140 0 C112 -20 30 -20 0 0 Z" fill="${a.accent}" fill-opacity="0.82"/>` +
      `<path d="M16 -10 C40 -32 96 -34 120 -10" stroke="#fff" stroke-opacity="0.55" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;
    s += crescent(-210, 70, -10, 1.05) + crescent(40, 86, 8, 1.05);
    return { svg: s, w: W + 12, h: H + 56, labelY: -H + 50, extraBelow: 90 };
  },
  sachet(ctx, a) {
    const txt = isDark(a.pack) ? '#F7EFE6' : '#302823';
    const foil = ctx.linear(
      [[0, darken(a.pack, 0.06)], [0.35, lighten(a.pack, 0.4)], [0.55, a.pack], [1, darken(a.pack, 0.1)]],
      { x1: 0, y1: 0, x2: 1, y2: 1 }
    );
    let s = `<g transform="rotate(-3)">`;
    s += `<rect x="-128" y="-404" width="256" height="404" rx="6" fill="${foil}"/>`;
    s += `<rect x="-128" y="-404" width="256" height="26" rx="4" fill="${darken(a.pack, 0.06)}"/>`;
    for (let i = -122; i <= 122; i += 5) s += `<line x1="${i}" x2="${i}" y1="-400" y2="-382" stroke="#000" stroke-opacity="0.07"/>`;
    s += `<rect x="-128" y="-24" width="256" height="24" fill="${darken(a.pack, 0.06)}"/>`;
    s += `<path d="M-128 -370 l8 6 l-8 6 Z M128 -370 l-8 6 l8 6 Z" fill="${darken(a.pack, 0.2)}"/>`;
    s += `<rect x="-86" y="-300" width="172" height="150" fill="none" stroke="${txt}" stroke-opacity="0.35" stroke-width="0.8"/>`;
    s += labelBlock({ y: -260, brand: a.brand, label: a.label, sub: a.sub, color: txt, width: 160, brandSize: 18 });
    s += `</g>`;
    return { svg: s, w: 256, h: 404, labelY: -230 };
  },
  stick(ctx, a) {
    const txt = isDark(a.cap) ? '#F7EFE6' : '#302823';
    // closed stick (left) and open bullet (right)
    let s = `<g transform="translate(-62 0)">`;
    s += `<rect x="-34" y="-170" width="68" height="170" rx="6" fill="${ctx.cyl(a.pack)}"/>`;
    s += `<rect x="-36" y="-322" width="72" height="156" rx="6" fill="${ctx.cyl(a.cap, { sheen: 0.32 })}"/>`;
    s += `<text transform="translate(5 -232) rotate(-90)" text-anchor="middle" font-family="${SERIF}" font-size="14" letter-spacing="4" fill="${txt}">${esc(a.brand)}</text>`;
    s += `</g><g transform="translate(66 0)">`;
    s += `<rect x="-34" y="-170" width="68" height="170" rx="6" fill="${ctx.cyl(a.pack)}"/>`;
    s += `<rect x="-26" y="-204" width="52" height="36" fill="${ctx.cyl(darken(a.pack, 0.08))}"/>`;
    s += `<path d="M-24 -204 L-24 -244 Q-24 -262 -6 -272 L24 -284 L24 -204 Z" fill="${ctx.cyl(a.accent, { sheen: 0.35 })}"/>`;
    s += `</g>`;
    return { svg: s, w: 260, h: 322, labelY: -200 };
  },
  lipoil(ctx, a) {
    const txt = isDark(a.accent) ? '#F7EFE6' : '#302823';
    let s = `<rect x="-42" y="-196" width="84" height="196" rx="14" fill="${ctx.cyl(lighten(a.accent, 0.55), { sheen: 0.4 })}" fill-opacity="0.9"/>`;
    s += `<rect x="-34" y="-176" width="68" height="168" rx="10" fill="${ctx.cyl(a.accent, { sheen: 0.3 })}" fill-opacity="0.9"/>`;
    s += `<rect x="-14" y="-212" width="28" height="20" fill="${darken(a.cap, 0.1)}"/>`;
    s += `<rect x="-24" y="-376" width="48" height="168" rx="5" fill="${ctx.cyl(a.cap, { sheen: 0.3 })}"/>`;
    s += `<rect x="-30" y="-166" width="6" height="140" rx="3" fill="#fff" fill-opacity="0.5"/>`;
    s += `<text x="0" y="-108" text-anchor="middle" font-family="${SERIF}" font-size="12" letter-spacing="3.4" fill="${txt}">${esc(a.brand)}</text>`;
    s += `<text x="0" y="-90" text-anchor="middle" font-family="${SANS}" font-size="7" letter-spacing="1.4" fill="${txt}">${esc(a.label)}</text>`;
    return { svg: s, w: 84, h: 376, labelY: -150 };
  },
  roller(ctx, a) {
    const stone = (x, y, w, h) =>
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2}" fill="${ctx.cyl(a.pack, { sheen: 0.45, edge: 0.18 })}"/>` +
      `<path d="M${x + w * 0.3} ${y + h * 0.2} C${x + w * 0.6} ${y + h * 0.4} ${x + w * 0.2} ${y + h * 0.6} ${x + w * 0.55} ${y + h * 0.85}" stroke="#fff" stroke-opacity="0.35" fill="none"/>`;
    let s = `<g transform="rotate(-22)">`;
    s += `<rect x="-210" y="-58" width="300" height="20" rx="10" fill="${ctx.cyl(a.cap, { sheen: 0.4 })}"/>`;
    s += `<path d="M90 -48 L150 -48 L150 -118 M150 -48 L150 22" stroke="${a.cap}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    s += stone(156, -132, 70, 168);
    s += `<path d="M-210 -48 L-240 -48 L-240 -86 M-240 -48 L-240 -10" stroke="${a.cap}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    s += stone(-284, -96, 40, 96);
    s += `</g>`;
    return { svg: s, w: 420, h: 220, labelY: -80, flat: true };
  },
  guasha(ctx, a) {
    const fill = ctx.radial([[0, lighten(a.pack, 0.4)], [0.7, a.pack], [1, darken(a.pack, 0.12)]], { cx: 0.38, cy: 0.35, r: 0.75 });
    let s = `<g transform="translate(0 -60) rotate(-12) scale(1.25 1.0)">`;
    s += `<path d="M-140 -10 C-140 -84 -46 -104 18 -70 C40 -84 58 -88 74 -86 C120 -80 152 -54 152 -12 C152 48 44 80 -22 62 C-92 80 -140 48 -140 -10 Z" fill="${fill}"/>`;
    s += `<path d="M-90 -40 C-50 -10 -30 -60 10 -30 S70 10 110 -20" stroke="#fff" stroke-opacity="0.32" stroke-width="1.6" fill="none"/>`;
    s += `<path d="M-100 20 C-60 0 -20 40 40 18" stroke="#fff" stroke-opacity="0.2" stroke-width="1.2" fill="none"/>`;
    s += `<ellipse cx="-60" cy="-50" rx="30" ry="9" fill="#fff" fill-opacity="0.35" transform="rotate(-20 -60 -50)"/>`;
    s += `</g>`;
    return { svg: s, w: 380, h: 170, labelY: -60, flat: true };
  },
  headband(ctx, a) {
    const fill = ctx.radial([[0.55, darken(a.pack, 0.1)], [0.8, lighten(a.pack, 0.12)], [1, darken(a.pack, 0.08)]], { cx: 0.5, cy: 0.5, r: 0.5 });
    let s = `<g transform="translate(0 -112)">`;
    s += `<path fill-rule="evenodd" d="M-190 0 A190 112 0 1 0 190 0 A190 112 0 1 0 -190 0 Z M-118 0 A118 58 0 1 1 118 0 A118 58 0 1 1 -118 0 Z" fill="${fill}"/>`;
    for (let i = 0; i < 36; i++) {
      const t = (i / 36) * Math.PI * 2;
      const x1 = Math.cos(t) * 128;
      const y1 = Math.sin(t) * 66;
      const x2 = Math.cos(t) * 180;
      const y2 = Math.sin(t) * 104;
      s += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} Q${((x1 + x2) / 2 + 6).toFixed(1)} ${((y1 + y2) / 2).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="#000" stroke-opacity="0.07" stroke-width="2" fill="none"/>`;
    }
    s += `<path d="M-150 -60 A190 112 0 0 1 120 -86" stroke="#fff" stroke-opacity="0.35" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    s += `</g>`;
    return { svg: s, w: 380, h: 224, labelY: -112, flat: true };
  },
  sleepmask(ctx, a) {
    const silk = ctx.linear([[0, darken(a.pack, 0.1)], [0.3, lighten(a.pack, 0.35)], [0.5, a.pack], [0.75, lighten(a.pack, 0.2)], [1, darken(a.pack, 0.12)]], { x1: 0, y1: 0, x2: 1, y2: 0.6 });
    let s = `<g transform="translate(0 -70)">`;
    s += `<path d="M-176 -20 C-230 -40 -250 20 -200 40 M176 -20 C230 -40 250 20 200 40" stroke="${darken(a.pack, 0.15)}" stroke-width="12" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M-180 -40 C-180 -120 -60 -130 0 -96 C60 -130 180 -120 180 -40 C180 22 112 52 62 40 C30 32 16 6 0 6 C-16 6 -30 32 -62 40 C-112 52 -180 22 -180 -40 Z" fill="${silk}"/>`;
    s += `<path d="M-160 -40 C-160 -104 -60 -112 0 -82 C60 -112 160 -104 160 -40" stroke="#fff" stroke-opacity="0.25" stroke-width="1.5" fill="none" stroke-dasharray="3 4"/>`;
    s += `</g>`;
    return { svg: s, w: 420, h: 170, labelY: -80, flat: true };
  },
  brush(ctx, a) {
    let s = `<g transform="translate(0 -60) rotate(-16)">`;
    s += `<path d="M-200 -8 L60 -14 L60 14 L-200 8 Q-210 0 -200 -8 Z" fill="${ctx.linear([[0, lighten(a.pack, 0.2)], [0.5, a.pack], [1, darken(a.pack, 0.15)]])}"/>`;
    s += `<path d="M-200 -8 C-230 -30 -290 -30 -300 0 C-290 30 -230 30 -200 8 Z" fill="${ctx.linear([[0, lighten(a.accent, 0.3)], [1, darken(a.accent, 0.1)]])}"/>`;
    s += `<rect x="58" y="-18" width="44" height="36" rx="3" fill="${ctx.linear([[0, '#E8D3A8'], [0.5, '#B08A5E'], [1, '#8C6A44']])}"/>`;
    s += `<path d="M100 -16 C140 -34 182 -30 196 -6 C200 0 200 0 196 6 C182 30 140 34 100 16 Z" fill="${ctx.linear([[0, lighten(a.cap, 0.4)], [1, darken(a.cap, 0.15)]])}"/>`;
    s += `</g>`;
    return { svg: s, w: 460, h: 160, labelY: -60, flat: true };
  },
  mirror(ctx, a) {
    let s = `<ellipse cx="0" cy="-8" rx="92" ry="14" fill="${ctx.cyl(a.cap, { sheen: 0.4 })}"/>`;
    s += `<rect x="-8" y="-110" width="16" height="104" fill="${ctx.cyl(a.cap)}"/>`;
    s += `<path d="M-160 -250 A160 160 0 0 0 160 -250" stroke="${a.cap}" stroke-width="6" fill="none"/>`;
    s += `<circle cx="0" cy="-250" r="150" fill="${ctx.cyl(a.pack, { sheen: 0.45 })}"/>`;
    s += `<circle cx="0" cy="-250" r="136" fill="${ctx.linear([[0, lighten(a.accent, 0.5)], [0.45, a.accent], [1, darken(a.accent, 0.12)]], { x1: 0, y1: 0, x2: 1, y2: 1 })}"/>`;
    s += `<path d="M-90 -340 L-20 -340 L-110 -170 L-136 -220 Z" fill="#fff" fill-opacity="0.32"/>`;
    s += `<path d="M10 -360 L40 -360 L-60 -150 L-80 -160 Z" fill="#fff" fill-opacity="0.18"/>`;
    return { svg: s, w: 300, h: 400, labelY: -250 };
  },
  pouch(ctx, a) {
    const shape = `<path d="M-176 -18 Q-182 -226 -150 -234 L150 -234 Q182 -226 176 -18 Q174 0 150 0 L-150 0 Q-174 0 -176 -18 Z"/>`;
    const clip = ctx.clip(shape);
    let s = `<g>`;
    s += shape.replace('/>', ` fill="${ctx.linear([[0, lighten(a.pack, 0.2)], [1, darken(a.pack, 0.1)]])}"/>`);
    s += `<g clip-path="${clip}">`;
    for (let i = -400; i < 400; i += 34) {
      s += `<line x1="${i}" y1="0" x2="${i + 240}" y2="-240" stroke="${darken(a.pack, 0.14)}" stroke-opacity="0.5" stroke-width="1.2"/>`;
      s += `<line x1="${i}" y1="-240" x2="${i + 240}" y2="0" stroke="${darken(a.pack, 0.14)}" stroke-opacity="0.5" stroke-width="1.2"/>`;
    }
    s += `</g>`;
    s += `<line x1="-146" x2="146" y1="-220" y2="-220" stroke="${a.cap}" stroke-width="4" stroke-dasharray="2 2"/>`;
    s += `<rect x="128" y="-226" width="12" height="40" rx="3" fill="${ctx.cyl(a.cap, { sheen: 0.4 })}"/>`;
    s += `</g>`;
    return { svg: s, w: 360, h: 234, labelY: -120 };
  },
};

// ───────────────────────── scene
function sceneSvg({ w = 800, h = 1000, bg, items, viewBox, floor = 0.76, windowLight = true, plinthTone }) {
  const ctx = createCtx('g');
  const floorY = Math.round(h * floor);
  let body = '';
  body += `<rect width="${w}" height="${h}" fill="${bg}"/>`;
  body += `<rect y="${floorY}" width="${w}" height="${h - floorY}" fill="${ctx.linear([[0, darken(bg, 0.05)], [1, darken(bg, 0.1)]])}"/>`;
  body += `<rect width="${w}" height="${floorY}" fill="${ctx.radial([[0, lighten(bg, 0.45), 0.9], [1, bg, 0]], { cx: 0.3, cy: 0.25, r: 0.75 })}"/>`;
  if (windowLight) {
    const b = ctx.blur(26);
    body += `<path d="M${w * 0.08} ${-20} L${w * 0.46} ${-20} L${w * 0.22} ${floorY} L${-w * 0.1} ${floorY} Z" fill="#fff" fill-opacity="0.22" filter="${b}"/>`;
    body += `<path d="M${w * 0.52} ${-20} L${w * 0.66} ${-20} L${w * 0.44} ${floorY} L${w * 0.3} ${floorY} Z" fill="#fff" fill-opacity="0.12" filter="${b}"/>`;
  }
  for (const it of items) {
    const shape = shapes[it.art.kind] || shapes.jar;
    const out = shape(ctx, it.art);
    const sc = it.fit ? Math.min(it.fit.h / (out.h + (out.extraBelow || 0)), it.fit.w / out.w) : it.scale ?? 1;
    const baseY = (it.y ?? floorY) - (it.plinth ? it.plinth.h : 0);
    if (it.plinth) {
      const pw = it.plinth.w;
      const tone = plinthTone || lighten(bg, 0.28);
      body += `<rect x="${it.x - pw / 2}" y="${baseY}" width="${pw}" height="${(it.y ?? floorY) - baseY + 2}" fill="${ctx.cyl(tone, { sheen: 0.2, edge: 0.08 })}"/>`;
      body += `<rect x="${it.x - pw / 2}" y="${baseY}" width="${pw}" height="2" fill="#fff" fill-opacity="0.6"/>`;
      const pb = ctx.blur(16);
      body += `<ellipse cx="${it.x + pw * 0.35}" cy="${(it.y ?? floorY) + 8}" rx="${pw * 0.7}" ry="16" fill="#302823" fill-opacity="0.14" filter="${pb}"/>`;
    }
    const sb = ctx.blur(12);
    const sw = out.w * sc;
    body += `<ellipse cx="${it.x + sw * 0.32}" cy="${baseY + 4}" rx="${sw * 0.75}" ry="${out.flat ? 22 : 14}" fill="#302823" fill-opacity="0.13" filter="${sb}"/>`;
    body += `<ellipse cx="${it.x}" cy="${baseY + 2}" rx="${sw * 0.5}" ry="7" fill="#302823" fill-opacity="0.22" filter="${ctx.blur(5)}"/>`;
    body += `<g transform="translate(${it.x} ${baseY}) scale(${sc})">${out.svg}</g>`;
    it._out = { ...out, baseY, sc };
  }
  const vb = viewBox || `0 0 ${w} ${h}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"><defs>${ctx.defs.join('')}</defs>${body}</svg>`;
}

// ───────────────────────── texture close-ups
function textureSvg(art) {
  const ctx = createCtx('t');
  const W = 800;
  const H = 1000;
  const bg = mix(art.bg, art.accent, 0.18);
  let s = `<rect width="${W}" height="${H}" fill="${bg}"/>`;
  s += `<rect width="${W}" height="${H}" fill="${ctx.radial([[0, lighten(bg, 0.35), 0.9], [1, bg, 0]], { cx: 0.3, cy: 0.3, r: 0.8 })}"/>`;
  const shadow = ctx.blur(18);
  const base = art.texture === 'stone' || art.texture === 'fabric' ? art.pack : art.accent;
  switch (art.texture) {
    case 'cream':
    case 'clay': {
      const c = art.texture === 'clay' ? art.accent : lighten(art.accent, 0.3);
      s += `<path d="M150 610 C120 470 260 380 400 400 C560 420 700 470 660 600 C630 700 470 720 360 700 C250 690 170 680 150 610 Z" fill="#302823" fill-opacity="0.12" filter="${shadow}" transform="translate(16 26)"/>`;
      s += `<path d="M150 610 C120 470 260 380 400 400 C560 420 700 470 660 600 C630 700 470 720 360 700 C250 690 170 680 150 610 Z" fill="${ctx.radial([[0, lighten(c, 0.35)], [1, darken(c, 0.06)]], { cx: 0.4, cy: 0.35 })}"/>`;
      s += `<path d="M220 560 C300 470 470 460 560 540 C470 500 330 500 250 590 Z" fill="${darken(c, 0.07)}" fill-opacity="0.6"/>`;
      s += `<path d="M260 600 C350 540 480 540 580 600" stroke="#fff" stroke-opacity="0.55" stroke-width="6" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M300 480 C380 440 470 450 520 470" stroke="#fff" stroke-opacity="0.4" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      if (art.texture === 'clay') for (let i = 0; i < 60; i++) s += `<circle cx="${200 + ((i * 97) % 440)}" cy="${430 + ((i * 53) % 250)}" r="1.4" fill="${darken(c, 0.2)}" fill-opacity="0.35"/>`;
      break;
    }
    case 'gel':
    case 'sheet': {
      const c = art.accent;
      const blobs = [
        [400, 520, 230, 150],
        [250, 330, 90, 60],
        [600, 770, 110, 70],
      ];
      for (const [cx, cy, rx, ry] of blobs) {
        s += `<ellipse cx="${cx + 14}" cy="${cy + 24}" rx="${rx}" ry="${ry}" fill="#302823" fill-opacity="0.1" filter="${shadow}"/>`;
        s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${ctx.radial([[0, lighten(c, 0.5), 0.7], [0.8, c, 0.75], [1, darken(c, 0.1), 0.85]], { cx: 0.4, cy: 0.35 })}"/>`;
        s += `<ellipse cx="${cx - rx * 0.35}" cy="${cy - ry * 0.45}" rx="${rx * 0.28}" ry="${ry * 0.14}" fill="#fff" fill-opacity="0.7" transform="rotate(-14 ${cx} ${cy})"/>`;
        s += `<circle cx="${cx + rx * 0.45}" cy="${cy + ry * 0.2}" r="${rx * 0.04}" fill="#fff" fill-opacity="0.8"/>`;
      }
      break;
    }
    case 'serum':
    case 'oil': {
      const c = art.texture === 'oil' ? art.accent : lighten(art.accent, 0.2);
      const drops = [
        [380, 500, 130],
        [580, 340, 62],
        [230, 740, 74],
        [600, 700, 40],
        [210, 330, 30],
        [470, 820, 22],
      ];
      for (const [cx, cy, r] of drops) {
        s += `<circle cx="${cx + r * 0.12}" cy="${cy + r * 0.2}" r="${r}" fill="#302823" fill-opacity="0.12" filter="${ctx.blur(r * 0.12 + 4)}"/>`;
        s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${ctx.radial([[0, lighten(c, 0.6), 0.5], [0.75, c, 0.75], [1, darken(c, 0.2), 0.9]], { cx: 0.55, cy: 0.6 })}"/>`;
        s += `<ellipse cx="${cx - r * 0.35}" cy="${cy - r * 0.38}" rx="${r * 0.26}" ry="${r * 0.14}" fill="#fff" fill-opacity="0.8" transform="rotate(-35 ${cx - r * 0.35} ${cy - r * 0.38})"/>`;
      }
      break;
    }
    case 'smear': {
      const c = art.accent;
      s += `<path d="M120 700 C220 560 400 420 640 300 C690 280 720 320 680 350 C470 480 320 620 210 760 C170 800 90 760 120 700 Z" fill="#302823" fill-opacity="0.12" filter="${shadow}" transform="translate(14 22)"/>`;
      s += `<path d="M120 700 C220 560 400 420 640 300 C690 280 720 320 680 350 C470 480 320 620 210 760 C170 800 90 760 120 700 Z" fill="${ctx.linear([[0, darken(c, 0.1)], [0.5, c], [1, lighten(c, 0.2)]], { x1: 0, y1: 1, x2: 1, y2: 0 })}"/>`;
      s += `<path d="M180 690 C300 560 440 450 620 330" stroke="#fff" stroke-opacity="0.5" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      break;
    }
    case 'stone': {
      const c = base;
      s += `<rect width="${W}" height="${H}" fill="${ctx.radial([[0, lighten(c, 0.4)], [0.7, c], [1, darken(c, 0.15)]], { cx: 0.4, cy: 0.35, r: 0.9 })}"/>`;
      for (let i = 0; i < 9; i++) {
        const y = 80 + i * 110;
        s += `<path d="M-20 ${y} C200 ${y - 60} 320 ${y + 90} 520 ${y + 10} S760 ${y - 40} 840 ${y + 30}" stroke="#fff" stroke-opacity="${0.12 + (i % 3) * 0.06}" stroke-width="${1 + (i % 2)}" fill="none"/>`;
      }
      break;
    }
    case 'fabric':
    default: {
      const c = base;
      for (let i = 0; i < 9; i++) {
        const y = -80 + i * 130;
        s += `<path d="M-40 ${y} C200 ${y - 70} 500 ${y + 90} 840 ${y - 10} L840 ${y + 160} C500 ${y + 250} 200 ${y + 80} -40 ${y + 160} Z" fill="${ctx.linear([[0, i % 2 ? darken(c, 0.08) : lighten(c, 0.18)], [1, i % 2 ? lighten(c, 0.1) : darken(c, 0.05)]])}"/>`;
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>${ctx.defs.join('')}</defs>${s}</svg>`;
}

// ───────────────────────── writers
const write = (rel, content) => {
  const file = join(ROOT, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
};

const artFor = (p, override = {}) => ({ ...p.art, ...override, brand: brandMark(p.brandId) });
const isFlat = (kind) => ['roller', 'guasha', 'headband', 'sleepmask', 'brush'].includes(kind);

function productScene(art, { detail = false } = {}) {
  const flat = isFlat(art.kind);
  const fit = art.kind === 'tin' ? { w: 500, h: 470 } : flat ? { w: 600, h: 420 } : { w: 470, h: 640 };
  const items = [{ art, x: 400, fit, plinth: flat || art.kind === 'tin' ? null : { w: 480, h: 56 } }];
  const svg = sceneSvg({ bg: art.bg, items, floor: flat ? 0.64 : art.kind === 'tin' ? 0.7 : 0.86 });
  if (!detail) return svg;
  // Detail: crop the same scene around the label area at 4:5
  const it = items[0];
  const cy = it._out.baseY + it._out.labelY * it._out.sc;
  const cw = flat ? 520 : 420;
  const ch = cw * 1.25;
  const x = 400 - cw / 2;
  const y = Math.max(0, Math.min(1000 - ch, cy - ch / 2));
  return svg.replace(/viewBox="[^"]+"/, `viewBox="${x} ${y.toFixed(0)} ${cw} ${ch}"`);
}

let count = 0;
for (const p of products) {
  const art = artFor(p);
  write(`products/${p.slug}/1.svg`, productScene(art));
  write(`products/${p.slug}/2.svg`, productScene(art, { detail: true }));
  write(`products/${p.slug}/3.svg`, textureSvg(art));
  count += 3;
  for (const v of p.variants) {
    if (!v.art) continue;
    write(`products/${p.slug}/${v.id}.svg`, productScene(artFor(p, v.art)));
    count += 1;
  }
}

// ───────────────────────── editorial compositions
const P = Object.fromEntries(products.map((p) => [p.id, (o) => artFor(p, o)]));

const editorial = {
  'hero-main': {
    w: 1200,
    h: 1400,
    bg: '#EADDCF',
    floor: 0.74,
    items: [
      { art: P.p_hyaluronic_serum(), x: 360, scale: 1.7, plinth: { w: 330, h: 220 } },
      { art: P.p_gel_cream(), x: 790, scale: 1.45, plinth: { w: 460, h: 110 } },
      { art: P.p_lip_oil({ accent: '#D98E8C' }), x: 1060, scale: 1.2 },
    ],
  },
  'hero-mobile': {
    w: 800,
    h: 1000,
    bg: '#EADDCF',
    floor: 0.78,
    items: [
      { art: P.p_hyaluronic_serum(), x: 280, scale: 1.15, plinth: { w: 250, h: 150 } },
      { art: P.p_gel_cream(), x: 580, scale: 0.95, plinth: { w: 320, h: 70 } },
    ],
  },
  'banner-eye': {
    w: 1600,
    h: 900,
    bg: '#EBD8D3',
    floor: 0.74,
    items: [
      { art: P.p_peptide_eye_cream(), x: 980, scale: 1.05, plinth: { w: 260, h: 120 } },
      { art: P.p_gold_patches(), x: 1310, scale: 0.95 },
      { art: P.p_caffeine_eye_cream(), x: 720, scale: 1.0, plinth: { w: 240, h: 50 } },
    ],
  },
  'banner-skincare': {
    w: 1600,
    h: 900,
    bg: '#E2D6C8',
    floor: 0.76,
    items: [
      { art: P.p_vitc_serum(), x: 300, scale: 1.0, plinth: { w: 240, h: 120 } },
      { art: P.p_niacinamide_serum(), x: 520, scale: 0.9, plinth: { w: 220, h: 50 } },
      { art: P.p_rose_oil(), x: 1280, scale: 0.95, plinth: { w: 240, h: 90 } },
    ],
  },
  story: {
    w: 900,
    h: 1200,
    bg: '#D9C6B4',
    floor: 0.72,
    plinthTone: '#EFE6DC',
    items: [
      { art: P.p_peptide_night(), x: 300, scale: 1.0, plinth: { w: 360, h: 200 } },
      { art: P.p_rose_oil(), x: 620, scale: 1.1, plinth: { w: 300, h: 80 } },
    ],
  },
  'category-eye-care': { bg: '#EBD8D3', items: [{ art: P.p_gold_patches(), x: 400, scale: 1.05 }] },
  'category-serums': {
    bg: '#E9E2DA',
    items: [
      { art: P.p_hyaluronic_serum(), x: 300, scale: 1.05, plinth: { w: 240, h: 110 } },
      { art: P.p_vitc_serum(), x: 540, scale: 0.9 },
    ],
  },
  'category-masks': {
    bg: '#F0DCD5',
    items: [
      { art: P.p_rice_sheet_mask(), x: 270, scale: 0.95 },
      { art: P.p_pink_clay(), x: 540, scale: 0.95, plinth: { w: 300, h: 60 } },
    ],
  },
  'category-moisturizers': {
    bg: '#E8E2DC',
    items: [
      { art: P.p_barrier_moist(), x: 290, scale: 1.0, plinth: { w: 250, h: 90 } },
      { art: P.p_gel_cream(), x: 560, scale: 0.9 },
    ],
  },
  'category-lip-care': {
    bg: '#F2DFD9',
    items: [
      { art: P.p_lip_oil({ accent: '#D98E8C' }), x: 300, scale: 1.2, plinth: { w: 200, h: 120 } },
      { art: P.p_lip_oil({ accent: '#8A4250' }), x: 450, scale: 1.2 },
      { art: P.p_lip_mask(), x: 620, scale: 0.8 },
    ],
  },
  'category-tools': { bg: '#EFE1DA', floor: 0.62, items: [{ art: P.p_quartz_roller(), x: 420, scale: 1.25 }] },
  'category-accessories': { bg: '#ECE3DA', floor: 0.62, items: [{ art: P.p_headband({ pack: '#E9C9C2' }), x: 400, scale: 1.25 }] },
  'gallery-1': { w: 800, h: 800, bg: '#EADDCF', floor: 0.8, items: [{ art: P.p_hyaluronic_serum(), x: 400, scale: 1.05, plinth: { w: 300, h: 60 } }] },
  'gallery-3': { w: 800, h: 800, bg: '#E5E4DA', floor: 0.62, items: [{ art: P.p_gua_sha(), x: 400, scale: 1.3 }] },
  'gallery-4': { w: 800, h: 800, bg: '#EBD8D3', floor: 0.7, items: [{ art: P.p_rose_patches(), x: 400, scale: 1.05 }] },
  'gallery-6': {
    w: 800,
    h: 800,
    bg: '#E9DFD5',
    floor: 0.78,
    items: [
      { art: P.p_shea_balm({ accent: '#C46F72' }), x: 280, scale: 0.95 },
      { art: P.p_lip_oil({ accent: '#EFD3BF' }), x: 560, scale: 1.0, plinth: { w: 200, h: 60 } },
    ],
  },
};

for (const [name, cfg] of Object.entries(editorial)) {
  write(`editorial/${name}.svg`, sceneSvg({ w: cfg.w || 800, h: cfg.h || 1000, ...cfg }));
  count += 1;
}

// texture-led gallery tiles
const squareTexture = (art) => textureSvg(art).replace('viewBox="0 0 800 1000" width="800" height="1000"', 'viewBox="0 100 800 800" width="800" height="800"');
write('editorial/gallery-2.svg', squareTexture(P.p_gel_cream()));
write('editorial/gallery-5.svg', squareTexture(P.p_vitc_serum()));
count += 2;

console.log(`Generated ${count} SVG files in public/images`);
