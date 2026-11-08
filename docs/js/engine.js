/**
 * GLOBAL STREAMER - enjin templat.
 *
 * Satu enjin dikongsi oleh galeri (lakaran kecil), studio (pratonton) dan
 * overlay.html (Browser Source dalam OBS). Setiap templat = susun atur (layout)
 * + gaya (style) + data. Susun atur menghasilkan "lubang" (slot) untuk kamera /
 * skrin / sembang: latar overlay dipotong pada lubang itu supaya sumber OBS di
 * bawahnya kelihatan dengan sudut yang kemas.
 */
import { TEMPLATES } from './templates.js';

/* ================================================================== *
 * Saiz
 * ================================================================== */
export const SIZES = [
  { id: 'fhd', name: 'Full HD', ratio: '16:9', w: 1920, h: 1080, use: 'YouTube, Zoom, Google Meet, OBS lalai' },
  { id: 'hd', name: 'HD 720p', ratio: '16:9', w: 1280, h: 720, use: 'Komputer ringan, siaran jaringan perlahan' },
  { id: 'classic', name: 'Klasik 4:3', ratio: '4:3', w: 1440, h: 1080, use: 'Projektor bilik darjah, kelas' },
  { id: 'ultra', name: 'Ultrawide', ratio: '21:9', w: 2560, h: 1080, use: 'Monitor lebar, pembentangan panorama' },
  { id: 'square', name: 'Segi empat', ratio: '1:1', w: 1080, h: 1080, use: 'Instagram, Facebook, LinkedIn' },
  { id: 'p45', name: 'Potret 4:5', ratio: '4:5', w: 1080, h: 1350, use: 'Suapan Instagram & Facebook' },
  { id: 'p34', name: 'Potret 3:4', ratio: '3:4', w: 1080, h: 1440, use: 'Pinterest, pembentangan menegak' },
  { id: 'vertical', name: 'Menegak 9:16', ratio: '9:16', w: 1080, h: 1920, use: 'TikTok, Reels, Shorts, Status' },
  { id: 'side', name: 'Panel sisi', ratio: '480×1080', w: 480, h: 1080, use: 'Bar tepi: agenda, jam, matlamat' },
  { id: 'strip', name: 'Bar bawah', ratio: '1920×300', w: 1920, h: 300, use: 'Lower third / nama pembentang' },
];
export const sizeById = (id) => SIZES.find((s) => s.id === id);
export const sizeToObj = (s) => ({ id: s.id, w: s.w, h: s.h });

/** Kelas saiz: menentukan bagaimana susun atur menyesuaikan diri. */
export function sizeClass(w, h) {
  const r = w / h;
  if (r >= 4) return 'strip';
  if (r >= 2.2) return 'ultra';
  if (r >= 1.6) return 'wide';
  if (r >= 1.2) return 'classic';
  if (r >= 0.9) return 'square';
  if (r >= 0.7) return 'port';
  if (r >= 0.5) return 'tall';
  return 'side';
}

/* ================================================================== *
 * Gaya (warna, fon, bentuk)
 * ================================================================== */
const SANS = '"Segoe UI","Helvetica Neue",Arial,"Noto Sans",system-ui,sans-serif';
const SERIF = 'Georgia,"Times New Roman","Noto Serif",serif';
const ROUND = '"Trebuchet MS","Verdana","Segoe UI",sans-serif';
const GAME = '"Arial Black","Impact","Segoe UI",sans-serif';
const MONO = '"Courier New","Lucida Console",monospace';

export const STYLES = {
  biru: { name: 'Biru Korporat', bgA: '#EAF1FF', bgB: '#FFFFFF', pattern: 'dots', pc: '#1F5FFF', panel: '#FFFFFF', ink: '#10264D', muted: '#5A6C8F', accent: '#1F5FFF', accent2: '#00B4A6', r: 1, shape: 'round', font: SANS, deco: 'blobs' },
  hijau: { name: 'Hijau Sekolah', bgA: '#E5F6EC', bgB: '#FFFFFF', pattern: 'grid', pc: '#12985B', panel: '#FFFFFF', ink: '#0F3B2A', muted: '#4F7566', accent: '#12985B', accent2: '#F5B100', r: 1, shape: 'round', font: ROUND, deco: 'corners' },
  kuning: { name: 'Kuning Ceria', bgA: '#FFF4CC', bgB: '#FFFFFF', pattern: 'confetti', pc: '#F59E0B', panel: '#FFFFFF', ink: '#3B2A05', muted: '#7A6535', accent: '#F59E0B', accent2: '#2F80ED', r: 1.4, shape: 'round', font: ROUND, deco: 'blobs' },
  ungu: { name: 'Ungu Akademik', bgA: '#EFE9FF', bgB: '#FFFFFF', pattern: 'waves', pc: '#6C47E8', panel: '#FFFFFF', ink: '#2A1B63', muted: '#6B5FA0', accent: '#6C47E8', accent2: '#FF8A3D', r: 1.1, shape: 'round', font: SANS, deco: 'blobs' },
  merah: { name: 'Berita Merah', bgA: '#F2F4F8', bgB: '#FFFFFF', pattern: 'diag', pc: '#D7263D', panel: '#FFFFFF', ink: '#0B1A33', muted: '#5C6679', accent: '#D7263D', accent2: '#0B2545', r: 0.35, shape: 'rect', font: SANS, deco: 'corners', caps: true },
  teal: { name: 'Teal Segar', bgA: '#DFF6F4', bgB: '#FFFFFF', pattern: 'rings', pc: '#0E9AA7', panel: '#FFFFFF', ink: '#0A3A40', muted: '#4B7A80', accent: '#0E9AA7', accent2: '#FF7A59', r: 1, shape: 'round', font: SANS, deco: 'blobs' },
  oren: { name: 'Oren Kreatif', bgA: '#FFEBDD', bgB: '#FFFFFF', pattern: 'dots', pc: '#FF6B2C', panel: '#FFFFFF', ink: '#3A1B08', muted: '#85593A', accent: '#FF6B2C', accent2: '#7C3AED', r: 1.5, shape: 'round', font: ROUND, deco: 'blobs' },
  kertas: { name: 'Kertas Klasik', bgA: '#F8F1DF', bgB: '#FFFDF7', pattern: 'none', pc: '#8B1E3F', panel: '#FFFDF7', ink: '#2B2118', muted: '#7A6A58', accent: '#8B1E3F', accent2: '#C79A2B', r: 0.4, shape: 'rect', font: SERIF, deco: 'frame' },
  slate: { name: 'Slate Minimal', bgA: '#F1F2F4', bgB: '#FFFFFF', pattern: 'grid', pc: '#111827', panel: '#FFFFFF', ink: '#111827', muted: '#6B7280', accent: '#111827', accent2: '#2563EB', r: 0.6, shape: 'round', font: SANS, deco: 'none' },
  pink: { name: 'Pink Lembut', bgA: '#FFE6EF', bgB: '#FFFFFF', pattern: 'dots', pc: '#E8438A', panel: '#FFFFFF', ink: '#4A1230', muted: '#8F5A74', accent: '#E8438A', accent2: '#8B5CF6', r: 1.7, shape: 'round', font: ROUND, deco: 'blobs' },
  langit: { name: 'Langit Cerah', bgA: '#CFE8FF', bgB: '#F4FAFF', pattern: 'waves', pc: '#0EA5E9', panel: '#FFFFFF', ink: '#0B3558', muted: '#4D7599', accent: '#0EA5E9', accent2: '#FBBF24', r: 1.3, shape: 'round', font: SANS, deco: 'blobs' },
  emas: { name: 'Emas Rasmi', bgA: '#F4EFE0', bgB: '#FFFFFF', pattern: 'diag', pc: '#C79A2B', panel: '#FFFFFF', ink: '#0F2342', muted: '#5C6B85', accent: '#12305F', accent2: '#C79A2B', r: 0.6, shape: 'rect', font: SERIF, deco: 'frame' },
  /* ---------- Gaming sahaja (gelap + neon) ---------- */
  neon: { name: 'Arena Neon', gaming: true, dark: true, bgA: '#0B0820', bgB: '#1B0F42', pattern: 'grid', pc: '#19E3FF', panel: '#150E36', ink: '#F4F0FF', muted: '#A79BD6', accent: '#B04BFF', accent2: '#19E3FF', r: 0.5, shape: 'chamfer', font: GAME, deco: 'blobs', caps: true },
  esports: { name: 'Esports Merah', gaming: true, dark: true, bgA: '#0D0D11', bgB: '#221015', pattern: 'stripes', pc: '#FF2E4D', panel: '#17171D', ink: '#FFFFFF', muted: '#B7A6AB', accent: '#FF2E4D', accent2: '#FFC53D', r: 0.4, shape: 'chamfer', font: GAME, deco: 'corners', caps: true },
  pixel: { name: 'Retro Piksel', gaming: true, dark: true, bgA: '#1A1838', bgB: '#2E1A4F', pattern: 'scan', pc: '#FFD23F', panel: '#231F4A', ink: '#FFF8DC', muted: '#B9B0E0', accent: '#FFD23F', accent2: '#3BCEAC', r: 0, shape: 'rect', font: MONO, deco: 'none', caps: true },
  siber: { name: 'Siber Hijau', gaming: true, dark: true, bgA: '#04120C', bgB: '#0A2C1D', pattern: 'grid', pc: '#2BFF88', panel: '#0A1F16', ink: '#E9FFF3', muted: '#86C2A3', accent: '#2BFF88', accent2: '#00D1FF', r: 0.4, shape: 'chamfer', font: GAME, deco: 'corners', caps: true },
  lava: { name: 'Lava Oren', gaming: true, dark: true, bgA: '#190905', bgB: '#3D1408', pattern: 'diag', pc: '#FF6A00', panel: '#26100A', ink: '#FFF1E6', muted: '#C9957A', accent: '#FF6A00', accent2: '#FFD000', r: 0.4, shape: 'chamfer', font: GAME, deco: 'corners', caps: true },
};
export const BRIGHT_STYLE_IDS = Object.keys(STYLES).filter((k) => !STYLES[k].gaming);
export const GAMING_STYLE_IDS = Object.keys(STYLES).filter((k) => STYLES[k].gaming);

/* ================================================================== *
 * Data lalai
 * ================================================================== */
export const BASE_DATA = {
  title: 'Tajuk Sesi Anda',
  subtitle: 'Subtajuk, kelas atau topik',
  brand: 'GLOBAL STREAMER',
  logo: '',
  people: 'Nama Anda | Pembentang\nTetamu Jemputan | Pakar Bidang\nPeserta 3 | Panel\nPeserta 4 | Panel',
  ticker: 'Selamat datang! Sertai sesi langsung kami • Tinggalkan soalan di ruang sembang • Terima kasih kerana menonton',
  tickerLabel: 'INFO',
  tickerOn: true,
  lower: true,
  badge: 'LIVE',
  handle: '@namaanda | globalstreamer',
  topics: '#belajar, #langsung, #kongsi',
  countdownMin: 5,
  countdownEnd: null,
  slides: [
    { title: 'Selamat Datang', bullets: 'Tujuan sesi hari ini\nPerkara yang akan dipelajari\nCara bertanya soalan', image: '' },
    { title: 'Isi Utama', bullets: 'Mata penting pertama\nMata penting kedua\nContoh dan latihan', image: '' },
    { title: 'Rumusan', bullets: 'Ringkasan pembelajaran\nTugasan susulan\nTerima kasih!', image: '' },
  ],
  slide: 0,
  price: 'RM 49.90',
  cta: 'Pesan sekarang',
  quiz: { q: 'Apakah ibu negara Malaysia?', options: ['Kuala Lumpur', 'Johor Bahru', 'Ipoh', 'Kuching'], answer: 0, reveal: false },
  goal: { label: 'Matlamat pengikut', current: 65, target: 100 },
  styleId: '',
  accent: '',
};

export function buildData(tpl, overrides) {
  return { ...BASE_DATA, ...(tpl.defaults || {}), ...(overrides || {}) };
}

export function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id) || null;
}

export function parsePeople(str) {
  return String(str || '').split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 8).map((l) => {
    const [name, ...rest] = l.split('|');
    return { name: (name || '').trim(), role: rest.join('|').trim() };
  });
}

export function safeUrl(u) {
  if (typeof u !== 'string') return '';
  const s = u.trim();
  if (/^data:image\/(png|jpe?g|gif|webp|svg\+xml);/i.test(s)) return s;
  if (/^https?:\/\//i.test(s)) return s;
  return '';
}

/* ================================================================== *
 * Susun atur
 * ================================================================== */
const rect = (x, y, w, h) => ({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });

function stackV(x, y, w, H, gap, items) {
  const fixed = items.reduce((a, i) => a + (i.h || 0), 0);
  const flex = items.reduce((a, i) => a + (i.f || 0), 0);
  const free = Math.max(0, H - fixed - gap * (items.length - 1));
  let cy = y;
  return items.map((i) => {
    const h = i.h != null ? i.h : flex ? (free * i.f) / flex : 0;
    const r = rect(x, cy, w, h);
    cy += h + gap;
    return r;
  });
}
function stackH(x, y, h, W, gap, items) {
  const fixed = items.reduce((a, i) => a + (i.w || 0), 0);
  const flex = items.reduce((a, i) => a + (i.f || 0), 0);
  const free = Math.max(0, W - fixed - gap * (items.length - 1));
  let cx = x;
  return items.map((i) => {
    const w = i.w != null ? i.w : flex ? (free * i.f) / flex : 0;
    const r = rect(cx, y, w, h);
    cx += w + gap;
    return r;
  });
}

function mk(W, H) {
  const cls = sizeClass(W, H);
  const m = Math.round(Math.min(W, H) * 0.035);
  return {
    W, H, cls, m, g: Math.round(m * 0.6),
    land: cls === 'wide' || cls === 'ultra' || cls === 'classic',
    port: cls === 'port' || cls === 'tall',
    sq: cls === 'square',
    safeB: cls === 'tall' ? Math.round(H * 0.09) : 0,
    tickH: Math.round(Math.max(40, H * (cls === 'wide' || cls === 'ultra' || cls === 'classic' ? 0.062 : 0.036))),
    badgeW: Math.round(Math.max(130, Math.min(W * 0.2, 240))),
  };
}
const notFixed = (c) => c.cls === 'side' || c.cls === 'strip';
const nameH = (c) => Math.round(Math.max(64, c.H * (c.land ? 0.1 : 0.062)));
const camSlot = (r, shape, media = 'cam', label = 'Kamera') => ({ ...r, kind: 'cam', media, shape, label });
const screenSlot = (r, shape, label = 'Skrin / Slaid') => ({ ...r, kind: 'screen', media: 'screen', shape, label });
const chatSlot = (r, shape) => ({ ...r, kind: 'chat', media: 'chat', shape, label: 'Sembang' });
const overlayName = (c, cell, i, wFrac = 0.8) => ({
  k: 'nameplate', i, r: rect(cell.x + c.g, cell.y + cell.h - nameH(c) - c.g, Math.min(cell.w * wFrac, c.W * 0.4), nameH(c)),
});

export const LAYOUTS = {
  /** Muka penuh (vlog, kuliah, ceramah) */
  camFull(c) {
    if (notFixed(c)) return null;
    const { W, H, m, g, land, safeB, tickH } = c;
    const i = Math.round(m * 1.5);
    const lowH = Math.round(H * (land ? 0.15 : 0.095));
    const bw = c.badgeW;
    const bh = Math.round(Math.max(40, H * (land ? 0.06 : 0.035)));
    const titleH = Math.round(H * (land ? 0.15 : 0.085));
    const tickY = H - m - i - safeB - tickH;
    return {
      slots: [camSlot(rect(m, m, W - 2 * m, H - 2 * m), 'round')],
      items: [
        { k: 'title', r: rect(i + m, i + m, land ? W * 0.46 : W - 2 * (i + m) - bw - g, titleH) },
        { k: 'badge', r: rect(W - i - m - bw, i + m, bw, bh) },
        { k: 'lower', r: rect(i + m, tickY - g - lowH, land ? W * 0.5 : W - 2 * (i + m), lowH) },
        { k: 'ticker', r: rect(i + m, tickY, W - 2 * (i + m), tickH) },
      ],
    };
  },

  /** Pembentang + slaid / skrin utama + lajur kamera */
  presenterMain(c, o) {
    if (notFixed(c)) return null;
    const { W, H, m, g, tickH, safeB } = c;
    const screen = o.main === 'screen';
    const mainItem = (r) => (screen ? { slot: screenSlot(r, 'round') } : { item: { k: 'slide', r } });
    const out = { slots: [], items: [] };
    const addMain = (r) => { const x = mainItem(r); if (x.slot) out.slots.push(x.slot); else out.items.push(x.item); };

    if (c.land) {
      const headH = Math.round(H * (c.cls === 'classic' ? 0.12 : 0.13));
      const colW = Math.round(W * (c.cls === 'ultra' ? 0.22 : c.cls === 'classic' ? 0.3 : 0.27));
      const [head, body, tick] = stackV(m, m, W - 2 * m, H - 2 * m, g, [{ h: headH }, { f: 1 }, { h: tickH }]);
      const [titleR, clockR] = stackH(head.x, head.y, head.h, head.w, g, [{ f: 1 }, { w: colW }]);
      const [mainR, col] = stackH(body.x, body.y, body.h, body.w, g, [{ f: 1 }, { w: colW }]);
      const camH = Math.min(Math.round(colW * (c.cls === 'classic' ? 0.75 : 0.5625)), Math.round(col.h * 0.55));
      const [camR, nameR, restR] = stackV(col.x, col.y, col.w, col.h, g, [{ h: camH }, { h: nameH(c) }, { f: 1 }]);
      addMain(mainR);
      out.slots.push(camSlot(camR, 'round'));
      out.items.push({ k: 'title', r: titleR }, { k: 'clock', r: clockR }, { k: 'nameplate', i: 0, r: nameR },
        { k: 'badge', r: rect(camR.x + g, camR.y + g, c.badgeW * 0.8, Math.max(36, H * 0.045)) },
        restR.h > H * 0.14 ? { k: 'agenda', r: restR } : null, { k: 'ticker', r: tick });
    } else if (c.sq) {
      const [head, mainR, row, tick] = stackV(m, m, W - 2 * m, H - 2 * m, g, [{ h: H * 0.105 }, { f: 1.25 }, { f: 1 }, { h: tickH }]);
      const [titleR, badgeR] = stackH(head.x, head.y, head.h, head.w, g, [{ f: 1 }, { w: Math.round(c.badgeW * 0.8) }]);
      const [camR, side] = stackH(row.x, row.y, row.h, row.w, g, [{ w: Math.min(row.h * 1.33, W * 0.46) }, { f: 1 }]);
      const [nameR, clockR] = stackV(side.x, side.y, side.w, side.h, g, [{ h: nameH(c) }, { f: 1 }]);
      addMain(mainR);
      out.slots.push(camSlot(camR, 'round'));
      out.items.push({ k: 'title', r: titleR }, { k: 'badge', r: rect(badgeR.x, badgeR.y + (badgeR.h - 40) / 2, badgeR.w, 40) },
        { k: 'nameplate', i: 0, r: nameR }, { k: 'clock', r: clockR }, { k: 'ticker', r: tick });
    } else {
      const headH = Math.round(H * (c.cls === 'tall' ? 0.075 : 0.09));
      const [head, mainR, camR0, nameR, rest, tick] = stackV(m, m, W - 2 * m, H - 2 * m - safeB, g, [
        { h: headH }, { f: 1.1 }, { h: Math.min(Math.round((W - 2 * m) * 0.62), H * 0.3) }, { h: nameH(c) }, { f: 0.6 }, { h: tickH }]);
      addMain(mainR);
      const camW = Math.round(camR0.h * 1.5);
      const camR = rect(camR0.x + (camR0.w - camW) / 2, camR0.y, camW, camR0.h);
      const [titleR, badgeR] = stackH(head.x, head.y, head.h, head.w, g, [{ f: 1 }, { w: Math.round(c.badgeW * 0.8) }]);
      out.slots.push(camSlot(camR, 'round'));
      out.items.push({ k: 'title', r: titleR }, { k: 'badge', r: rect(badgeR.x, badgeR.y + (badgeR.h - 40) / 2, badgeR.w, 40) },
        { k: 'nameplate', i: 0, r: nameR }, rest.h > H * 0.07 ? { k: 'agenda', r: rest } : null, { k: 'ticker', r: tick });
    }
    out.items = out.items.filter(Boolean);
    return out;
  },

  /** Tutorial: skrin penuh + kamera kecil (bulat atau segi empat) */
  screenCam(c, o) {
    if (notFixed(c)) return null;
    const { W, H, m, g, tickH, safeB } = c;
    const circle = o.camShape === 'circle';
    const shape = circle ? 'circle' : undefined;
    const out = { slots: [], items: [] };
    if (c.land) {
      const [head, body, tick] = stackV(m, m, W - 2 * m, H - 2 * m, g, [{ h: H * 0.085 }, { f: 1 }, { h: tickH }]);
      const [titleR, badgeR] = stackH(head.x, head.y, head.h, head.w, g, [{ f: 1 }, { w: c.badgeW }]);
      const camH = Math.round(H * 0.27);
      const camW = circle ? camH : Math.round(camH * (c.cls === 'classic' ? 1.333 : 1.7778));
      const camR = rect(body.x + body.w - camW - g * 1.5, body.y + body.h - camH - g * 1.5, camW, camH);
      out.slots.push(screenSlot(body, 'round'), camSlot(camR, shape || 'round'));
      out.items.push({ k: 'title', r: titleR }, { k: 'badge', r: badgeR },
        { k: 'nameplate', i: 0, r: rect(body.x + g * 1.5, body.y + body.h - nameH(c) - g * 1.5, W * 0.26, nameH(c)) },
        { k: 'ticker', r: tick });
    } else {
      const headH = Math.round(H * (c.cls === 'tall' ? 0.075 : 0.09));
      const [head, scr, row, tick] = stackV(m, m, W - 2 * m, H - 2 * m - safeB, g, [{ h: headH }, { f: 1 }, { h: Math.round(H * (c.sq ? 0.26 : 0.22)) }, { h: tickH }]);
      const camW = circle ? row.h : Math.min(Math.round(row.h * 1.333), W * 0.48);
      const [camR, side] = stackH(row.x, row.y, row.h, row.w, g, [{ w: camW }, { f: 1 }]);
      const [nameR, badgeR] = stackV(side.x, side.y, side.w, side.h, g, [{ h: nameH(c) }, { h: 44 }]);
      out.slots.push(screenSlot(scr, 'round'), camSlot(camR, shape || 'round'));
      out.items.push({ k: 'title', r: head }, { k: 'nameplate', i: 0, r: nameR }, { k: 'badge', r: rect(badgeR.x, badgeR.y, c.badgeW, 44) }, { k: 'ticker', r: tick });
    }
    return out;
  },

  /** Dua kamera (temu bual, podcast, tutor 1:1) */
  duo(c) {
    if (notFixed(c)) return null;
    const { W, H, m, g, tickH, safeB } = c;
    const headH = Math.round(H * (c.land ? 0.12 : c.cls === 'tall' ? 0.07 : 0.09));
    const [head, body, tick] = stackV(m, m, W - 2 * m, H - 2 * m - safeB, g, [{ h: headH }, { f: 1 }, { h: tickH }]);
    const [titleR, badgeR] = stackH(head.x, head.y, head.h, head.w, g, [{ f: 1 }, { w: c.badgeW }]);
    const cells = c.port
      ? stackV(body.x, body.y, body.w, body.h, g, [{ f: 1 }, { f: 1 }])
      : stackH(body.x, body.y, body.h, body.w, g, [{ f: 1 }, { f: 1 }]);
    return {
      slots: [camSlot(cells[0], 'round', 'cam', 'Kamera 1'), camSlot(cells[1], 'round', 'cam2', 'Kamera 2')],
      items: [{ k: 'title', r: titleR }, { k: 'badge', r: badgeR }, overlayName(c, cells[0], 0), overlayName(c, cells[1], 1), { k: 'ticker', r: tick }],
    };
  },

  /** Grid 2x2 (mesyuarat / panel) */
  grid4(c) {
    if (notFixed(c)) return null;
    const { W, H, m, g, tickH, safeB } = c;
    const headH = Math.round(H * (c.land ? 0.11 : c.cls === 'tall' ? 0.065 : 0.08));
    const [head, body, tick] = stackV(m, m, W - 2 * m, H - 2 * m - safeB, g, [{ h: headH }, { f: 1 }, { h: tickH }]);
    const [titleR, badgeR] = stackH(head.x, head.y, head.h, head.w, g, [{ f: 1 }, { w: c.badgeW }]);
    let cells;
    if (c.cls === 'ultra') {
      cells = stackH(body.x, body.y, body.h, body.w, g, [{ f: 1 }, { f: 1 }, { f: 1 }, { f: 1 }]);
    } else {
      const rows = stackV(body.x, body.y, body.w, body.h, g, [{ f: 1 }, { f: 1 }]);
      cells = rows.flatMap((r) => stackH(r.x, r.y, r.h, r.w, g, [{ f: 1 }, { f: 1 }]));
    }
    const small = (cell, i) => ({ k: 'nameplate', i, v: 'small', r: rect(cell.x + g, cell.y + cell.h - Math.round(nameH(c) * 0.8) - g, Math.min(cell.w * 0.86, c.W * 0.3), Math.round(nameH(c) * 0.8)) });
    return {
      slots: cells.map((r, i) => camSlot(r, 'round', 'cam' + (i ? i + 1 : ''), 'Kamera ' + (i + 1))),
      items: [{ k: 'title', r: titleR }, { k: 'badge', r: badgeR }, ...cells.map(small), { k: 'ticker', r: tick }],
    };
  },

  /** Meja berita */
  newsDesk(c) {
    if (notFixed(c)) return null;
    const { W, H, m, g, tickH, safeB } = c;
    const out = { slots: [], items: [] };
    if (c.land) {
      const sideW = Math.round(W * (c.cls === 'ultra' ? 0.24 : c.cls === 'classic' ? 0.32 : 0.3));
      const [top, headline, tick] = stackV(m, m, W - 2 * m, H - 2 * m, g, [{ f: 1 }, { h: Math.round(H * 0.15) }, { h: tickH }]);
      const [camR, side] = stackH(top.x, top.y, top.h, top.w, g, [{ f: 1 }, { w: sideW }]);
      const [clockR, badgeR, agendaR] = stackV(side.x, side.y, side.w, side.h, g, [{ h: Math.round(H * 0.13) }, { h: 48 }, { f: 1 }]);
      out.slots.push(camSlot(camR, 'round'));
      out.items.push({ k: 'clock', r: clockR }, { k: 'badge', r: badgeR }, { k: 'agenda', r: agendaR },
        overlayName(c, camR, 0, 0.6), { k: 'title', v: 'headline', r: headline }, { k: 'ticker', r: tick });
    } else {
      const [camR, headline, agendaR, tick] = stackV(m, m, W - 2 * m, H - 2 * m - safeB, g, [{ f: 1.25 }, { h: Math.round(H * 0.14) }, { f: 0.8 }, { h: tickH }]);
      out.slots.push(camSlot(camR, 'round'));
      out.items.push(overlayName(c, camR, 0, 0.7), { k: 'badge', r: rect(camR.x + g * 1.5, camR.y + g * 1.5, c.badgeW, 44) },
        { k: 'title', v: 'headline', r: headline }, { k: 'agenda', r: agendaR }, { k: 'ticker', r: tick });
    }
    return out;
  },

  /** Papan putih untuk guru: ruang menulis besar + kamera bulat di sudut */
  whiteboard(c) {
    if (notFixed(c)) return null;
    const { W, H, m, g, tickH, safeB } = c;
    const [head, board, tick] = stackV(m, m, W - 2 * m, H - 2 * m - safeB, g, [{ h: Math.round(H * (c.land ? 0.09 : 0.065)) }, { f: 1 }, { h: tickH }]);
    const [titleR, , badgeR] = stackH(head.x, head.y, head.h, head.w, g, [{ w: Math.round(W * (c.land ? 0.46 : 0.7)) }, { f: 1 }, { w: c.badgeW }]);
    const s = Math.round(Math.min(H * 0.26, W * 0.3));
    return {
      slots: [screenSlot(board, 'rect', 'Papan putih / skrin'), camSlot(rect(board.x + board.w - s - g * 1.5, board.y + g * 1.5, s, s), 'circle')],
      items: [{ k: 'title', v: 'tab', r: titleR }, { k: 'badge', r: badgeR },
        { k: 'nameplate', i: 0, r: rect(board.x + g * 1.5, board.y + board.h - nameH(c) - g * 1.5, Math.min(W * 0.3, board.w * 0.6), nameH(c)) },
        { k: 'ticker', r: tick }],
    };
  },

  /** Kuiz */
  quiz(c) {
    if (notFixed(c)) return null;
    const { W, H, m, g, tickH, safeB } = c;
    const out = { slots: [], items: [] };
    const headH = Math.round(H * (c.land ? 0.11 : 0.07));
    if (c.land) {
      const colW = Math.round(W * (c.cls === 'ultra' ? 0.22 : 0.27));
      const [head, body, tick] = stackV(m, m, W - 2 * m, H - 2 * m, g, [{ h: headH }, { f: 1 }, { h: tickH }]);
      const [titleR, badgeR] = stackH(head.x, head.y, head.h, head.w, g, [{ f: 1 }, { w: c.badgeW }]);
      const [left, col] = stackH(body.x, body.y, body.h, body.w, g, [{ f: 1 }, { w: colW }]);
      const [qR, oR] = stackV(left.x, left.y, left.w, left.h, g, [{ f: 0.42 }, { f: 0.58 }]);
      const camH = Math.min(Math.round(colW * 0.75), Math.round(col.h * 0.5));
      const [camR, timerR, nameR] = stackV(col.x, col.y, col.w, col.h, g, [{ h: camH }, { f: 1 }, { h: nameH(c) }]);
      out.slots.push(camSlot(camR, 'round'));
      out.items.push({ k: 'title', r: titleR }, { k: 'badge', r: badgeR }, { k: 'quizQ', r: qR }, { k: 'quizOpts', r: oR },
        { k: 'countdown', r: timerR }, { k: 'nameplate', i: 0, r: nameR }, { k: 'ticker', r: tick });
    } else {
      const [head, qR, oR, row, tick] = stackV(m, m, W - 2 * m, H - 2 * m - safeB, g, [{ h: headH }, { f: 0.9 }, { f: 1.2 }, { h: Math.round(H * 0.19) }, { h: tickH }]);
      const [titleR, badgeR] = stackH(head.x, head.y, head.h, head.w, g, [{ f: 1 }, { w: c.badgeW }]);
      const [camR, side] = stackH(row.x, row.y, row.h, row.w, g, [{ w: Math.round(row.h * 1.33) }, { f: 1 }]);
      const [timerR, nameR] = stackV(side.x, side.y, side.w, side.h, g, [{ f: 1 }, { h: nameH(c) }]);
      out.slots.push(camSlot(camR, 'round'));
      out.items.push({ k: 'title', r: titleR }, { k: 'badge', r: badgeR }, { k: 'quizQ', r: qR }, { k: 'quizOpts', r: oR },
        { k: 'countdown', r: timerR }, { k: 'nameplate', i: 0, r: nameR }, { k: 'ticker', r: tick });
    }
    return out;
  },

  /** Solo di tengah: podcast, ceramah, sesi bercerita */
  talkCenter(c, o) {
    if (notFixed(c)) return null;
    const { W, H, m, g, tickH, safeB } = c;
    const shape = o.shape || 'round';
    const out = { slots: [], items: [] };
    if (c.land) {
      const [body, tick] = stackV(m, m, W - 2 * m, H - 2 * m, g, [{ f: 1 }, { h: tickH }]);
      const nh = nameH(c);
      const S = Math.round(Math.min(body.h - nh - g, W * 0.4));
      const camR = rect(W / 2 - S / 2, body.y, S, S);
      const sideW = Math.round((W - S) / 2 - m - g);
      const left = rect(m, body.y, sideW, body.h);
      const right = rect(W - m - sideW, body.y, sideW, body.h);
      const [titleR, badgeR] = stackV(left.x, left.y, left.w, left.h, g, [{ h: Math.round(left.h * 0.5) }, { h: 48 }]);
      const [clockR, chipsR, handleR] = stackV(right.x, right.y, right.w, right.h, g, [{ h: Math.round(H * 0.13) }, { f: 1 }, { h: Math.round(H * 0.08) }]);
      out.slots.push(camSlot(camR, shape));
      out.items.push({ k: 'title', r: titleR }, { k: 'badge', r: rect(badgeR.x, badgeR.y, c.badgeW, 48) },
        { k: 'nameplate', i: 0, r: rect(W / 2 - Math.min(S * 0.9, 560) / 2, camR.y + S + g, Math.min(S * 0.9, 560), nh) },
        { k: 'clock', r: clockR }, { k: 'chips', r: chipsR }, { k: 'handle', r: handleR }, { k: 'ticker', r: tick });
    } else {
      const S = Math.round(Math.min(W - 2 * m, H * 0.4));
      const [camBox, titleR, nameR, chipsR, handleR, tick] = stackV(m, m, W - 2 * m, H - 2 * m - safeB, g, [
        { h: S }, { h: Math.round(H * (c.sq ? 0.17 : 0.13)) }, { h: nameH(c) }, { f: 1 }, { h: Math.round(H * 0.05) }, { h: tickH }]);
      out.slots.push(camSlot(rect(camBox.x + (camBox.w - S) / 2, camBox.y, S, S), shape));
      out.items.push({ k: 'title', r: titleR }, { k: 'badge', r: rect(camBox.x + g, camBox.y + g, c.badgeW, 44) },
        { k: 'nameplate', i: 0, r: nameR }, { k: 'chips', r: chipsR }, { k: 'handle', r: handleR }, { k: 'ticker', r: tick });
    }
    return out;
  },

  /** Lower third: bar nama sahaja, latar lutsinar */
  lowerThird(c, o) {
    if (c.cls === 'side') return null;
    const { W, H, m, g, safeB, tickH } = c;
    if (c.cls === 'strip') {
      const clockW = 330;
      return {
        bg: false, slots: [],
        items: [{ k: 'lower', v: o.v, r: rect(m, m, W - 2 * m - clockW - g, H - 2 * m) }, { k: 'clock', r: rect(W - m - clockW, m, clockW, H - 2 * m) }],
      };
    }
    const lowH = Math.round(H * (c.land ? 0.16 : 0.1));
    const block = lowH + g + tickH;
    const y0 = H - m - safeB - block;
    return {
      bg: false, slots: [],
      items: [
        { k: 'title', r: rect(m, m, c.land ? W * 0.4 : W - 2 * m - c.badgeW - g, Math.round(H * (c.land ? 0.13 : 0.08))) },
        { k: 'badge', r: rect(W - m - c.badgeW, m, c.badgeW, 46) },
        { k: 'lower', v: o.v, r: rect(m, y0, c.land ? W * 0.62 : W - 2 * m, lowH) },
        { k: 'ticker', r: rect(m, y0 + lowH + g, W - 2 * m, tickH) },
      ],
    };
  },

  /** Panel sisi (480x1080) */
  sidebar(c) {
    if (c.cls !== 'side') return null;
    const { W, H, m, g } = c;
    const x = m, w = W - 2 * m;
    const r = stackV(x, m, w, H - 2 * m, g, [{ h: H * 0.07 }, { h: H * 0.17 }, { h: H * 0.095 }, { f: 1 }, { h: H * 0.105 }, { h: H * 0.095 }, { h: H * 0.055 }]);
    return {
      slots: [],
      items: [{ k: 'logo', r: rect(r[0].x, r[0].y, r[0].w - 132 - g, r[0].h) }, { k: 'title', r: r[1] }, { k: 'nameplate', i: 0, r: r[2] }, { k: 'agenda', r: r[3] },
        { k: 'countdown', r: r[4] }, { k: 'chips', r: r[5] }, { k: 'handle', r: r[6] },
        { k: 'badge', r: rect(x + w - 132, r[0].y + (r[0].h - 38) / 2, 132, 38) }],
    };
  },

  /** Adegan skrin penuh: mula, rehat, tamat */
  scene(c, o) {
    if (notFixed(c)) return null;
    const { W, H, m, g, safeB } = c;
    const bw = c.land ? W * 0.68 : W - 2 * m;
    const bh = Math.round(H * (c.land ? 0.52 : c.sq ? 0.5 : 0.42));
    const by = Math.round((H - bh) / 2 - (c.land ? 0 : H * 0.02));
    return {
      slots: [],
      items: [
        { k: 'logo', r: rect(m * 1.5, m * 1.5, Math.max(300, W * 0.22), Math.round(H * (c.land ? 0.095 : 0.06))) },
        { k: 'badge', r: rect(W - m * 1.5 - c.badgeW, m * 1.5, c.badgeW, 46) },
        { k: 'bigscene', scene: o.scene, r: rect((W - bw) / 2, by, bw, bh) },
        { k: 'chips', r: rect(m * 2, H - m * 1.5 - safeB - Math.round(H * 0.18), W - m * 4, Math.round(H * 0.075)) },
        { k: 'handle', v: 'plain', r: rect(m * 2, H - m * 1.5 - safeB - Math.round(H * 0.085), W - m * 4, Math.round(H * 0.065)) },
      ],
    };
  },

  /** Bingkai sahaja: kamera atau skrin dengan bar tajuk */
  frameOnly(c, o) {
    if (notFixed(c)) return null;
    const { W, H, m, g, safeB } = c;
    const barH = Math.round(H * (c.land ? 0.12 : 0.085));
    const [body, bar] = stackV(m, m, W - 2 * m, H - 2 * m - safeB, g, [{ f: 1 }, { h: barH }]);
    const [titleR, handleR, logoR] = stackH(bar.x, bar.y, bar.h, bar.w, g, [{ f: 1 }, { w: c.land ? Math.round(W * 0.22) : 0 }, { w: Math.round(Math.max(260, W * 0.2)) }]);
    const slot = o.main === 'screen' ? screenSlot(body, 'round') : camSlot(body, o.shape || 'round');
    return {
      slots: [slot],
      items: [{ k: 'title', r: titleR }, handleR.w > 0 ? { k: 'handle', r: handleR } : null, { k: 'logo', r: logoR },
        { k: 'badge', r: rect(body.x + g * 1.5, body.y + g * 1.5, c.badgeW, 46) }].filter(Boolean),
    };
  },

  /** Jualan langsung / ulasan produk */
  product(c) {
    if (notFixed(c)) return null;
    const { W, H, m, g, tickH, safeB } = c;
    const out = { slots: [], items: [] };
    const headH = Math.round(H * (c.land ? 0.12 : 0.07));
    if (c.land) {
      const [head, body, tick] = stackV(m, m, W - 2 * m, H - 2 * m, g, [{ h: headH }, { f: 1 }, { h: tickH }]);
      const [titleR, badgeR] = stackH(head.x, head.y, head.h, head.w, g, [{ f: 1 }, { w: c.badgeW }]);
      const [camCol, prod] = stackH(body.x, body.y, body.h, body.w, g, [{ w: Math.round(W * (c.cls === 'classic' ? 0.36 : 0.3)) }, { f: 1 }]);
      const [camR, nameR] = stackV(camCol.x, camCol.y, camCol.w, camCol.h, g, [{ f: 1 }, { h: nameH(c) }]);
      const pw = Math.round(Math.min(prod.w * 0.5, 420));
      out.slots.push(camSlot(camR, 'round'));
      out.items.push({ k: 'title', r: titleR }, { k: 'badge', r: badgeR }, { k: 'slide', v: 'product', r: prod }, { k: 'nameplate', i: 0, r: nameR },
        { k: 'price', r: rect(prod.x + prod.w - pw - g * 1.5, prod.y + prod.h - Math.round(prod.h * 0.26) - g * 1.5, pw, Math.round(prod.h * 0.26)) }, { k: 'ticker', r: tick });
    } else {
      const [head, prod, row, tick] = stackV(m, m, W - 2 * m, H - 2 * m - safeB, g, [{ h: headH }, { f: 1 }, { h: Math.round(H * 0.24) }, { h: tickH }]);
      const [titleR, badgeR] = stackH(head.x, head.y, head.h, head.w, g, [{ f: 1 }, { w: c.badgeW }]);
      const [camR, side] = stackH(row.x, row.y, row.h, row.w, g, [{ w: Math.round(row.h * 1.1) }, { f: 1 }]);
      const [nameR, priceR] = stackV(side.x, side.y, side.w, side.h, g, [{ h: nameH(c) }, { f: 1 }]);
      out.slots.push(camSlot(camR, 'round'));
      out.items.push({ k: 'title', r: titleR }, { k: 'badge', r: badgeR }, { k: 'slide', v: 'product', r: prod },
        { k: 'nameplate', i: 0, r: nameR }, { k: 'price', r: priceR }, { k: 'ticker', r: tick });
    }
    return out;
  },

  /** Gaming: skrin permainan + facecam sudut + matlamat */
  gameHud(c) {
    if (notFixed(c)) return null;
    const { W, H, m, g, tickH, safeB } = c;
    const out = { slots: [], items: [] };
    if (c.land) {
      const [head, body, tick] = stackV(m, m, W - 2 * m, H - 2 * m, g, [{ h: Math.round(H * 0.095) }, { f: 1 }, { h: tickH }]);
      const [titleR, badgeR, clockR] = stackH(head.x, head.y, head.h, head.w, g, [{ f: 1 }, { w: c.badgeW }, { w: Math.round(W * 0.15) }]);
      const camH = Math.round(H * 0.3);
      const camR = rect(body.x + g * 1.5, body.y + body.h - camH - g * 1.5, Math.round(camH * 1.33), camH);
      const goalW = Math.round(W * 0.3);
      out.slots.push(screenSlot(body, 'chamfer', 'Permainan'), camSlot(camR, 'chamfer'));
      out.items.push({ k: 'title', r: titleR }, { k: 'badge', r: badgeR }, { k: 'clock', r: clockR },
        { k: 'nameplate', i: 0, r: rect(camR.x + camR.w + g, camR.y + camR.h - nameH(c), Math.round(W * 0.22), nameH(c)) },
        { k: 'goal', r: rect(body.x + body.w - goalW - g * 1.5, body.y + body.h - Math.round(H * 0.11) - g * 1.5, goalW, Math.round(H * 0.11)) },
        { k: 'ticker', r: tick });
    } else {
      const [head, scr, row, tick] = stackV(m, m, W - 2 * m, H - 2 * m - safeB, g, [{ h: Math.round(H * (c.cls === 'tall' ? 0.07 : 0.085)) }, { f: 1 }, { h: Math.round(H * 0.25) }, { h: tickH }]);
      const [titleR, badgeR] = stackH(head.x, head.y, head.h, head.w, g, [{ f: 1 }, { w: c.badgeW }]);
      const [camR, side] = stackH(row.x, row.y, row.h, row.w, g, [{ w: Math.min(Math.round(row.h * 1.33), Math.round(W * 0.5)) }, { f: 1 }]);
      const [nameR, goalR] = stackV(side.x, side.y, side.w, side.h, g, [{ h: nameH(c) }, { f: 1 }]);
      out.slots.push(screenSlot(scr, 'chamfer', 'Permainan'), camSlot(camR, 'chamfer'));
      out.items.push({ k: 'title', r: titleR }, { k: 'badge', r: badgeR }, { k: 'nameplate', i: 0, r: nameR }, { k: 'goal', r: goalR }, { k: 'ticker', r: tick });
    }
    return out;
  },

  /** Gaming: lajur facecam + sembang di tepi skrin permainan */
  gameSplit(c) {
    if (notFixed(c)) return null;
    const { W, H, m, g, tickH, safeB } = c;
    const out = { slots: [], items: [] };
    if (c.land) {
      const colW = Math.round(W * (c.cls === 'ultra' ? 0.18 : 0.24));
      const [head, body, tick] = stackV(m, m, W - 2 * m, H - 2 * m, g, [{ h: Math.round(H * 0.095) }, { f: 1 }, { h: tickH }]);
      const [titleR, badgeR, clockR] = stackH(head.x, head.y, head.h, head.w, g, [{ f: 1 }, { w: c.badgeW }, { w: Math.round(W * 0.15) }]);
      const [col, scr] = stackH(body.x, body.y, body.h, body.w, g, [{ w: colW }, { f: 1 }]);
      const [camR, nameR, chatR, goalR] = stackV(col.x, col.y, col.w, col.h, g, [{ h: Math.round(colW * 0.75) }, { h: nameH(c) }, { f: 1 }, { h: Math.round(H * 0.11) }]);
      out.slots.push(screenSlot(scr, 'chamfer', 'Permainan'), camSlot(camR, 'chamfer'), chatSlot(chatR, 'chamfer'));
      out.items.push({ k: 'title', r: titleR }, { k: 'badge', r: badgeR }, { k: 'clock', r: clockR }, { k: 'nameplate', i: 0, r: nameR }, { k: 'goal', r: goalR }, { k: 'ticker', r: tick });
    } else {
      const [head, scr, row, tick] = stackV(m, m, W - 2 * m, H - 2 * m - safeB, g, [{ h: Math.round(H * 0.075) }, { f: 1 }, { h: Math.round(H * 0.27) }, { h: tickH }]);
      const [titleR, badgeR] = stackH(head.x, head.y, head.h, head.w, g, [{ f: 1 }, { w: c.badgeW }]);
      const [camR, chatR] = stackH(row.x, row.y, row.h, row.w, g, [{ w: Math.min(Math.round(row.h * 1.33), Math.round(W * 0.45)) }, { f: 1 }]);
      out.slots.push(screenSlot(scr, 'chamfer', 'Permainan'), camSlot(camR, 'chamfer'), chatSlot(chatR, 'chamfer'));
      out.items.push({ k: 'title', r: titleR }, { k: 'badge', r: badgeR }, { k: 'nameplate', i: 0, r: rect(camR.x + g, camR.y + camR.h - nameH(c) - g, camR.w - 2 * g, nameH(c)) }, { k: 'ticker', r: tick });
    }
    return out;
  },

  /** Kamera + ruang sembang (webinar, soal jawab) */
  camChat(c) {
    if (notFixed(c)) return null;
    const { W, H, m, g, tickH, safeB } = c;
    const out = { slots: [], items: [] };
    const headH = Math.round(H * (c.land ? 0.12 : 0.07));
    const [head, body, tick] = stackV(m, m, W - 2 * m, H - 2 * m - safeB, g, [{ h: headH }, { f: 1 }, { h: tickH }]);
    const [titleR, badgeR] = stackH(head.x, head.y, head.h, head.w, g, [{ f: 1 }, { w: c.badgeW }]);
    const cells = c.port
      ? stackV(body.x, body.y, body.w, body.h, g, [{ f: 1.15 }, { f: 0.85 }])
      : stackH(body.x, body.y, body.h, body.w, g, [{ f: 1 }, { w: Math.round(W * (c.cls === 'ultra' ? 0.2 : c.cls === 'classic' ? 0.34 : 0.3)) }]);
    out.slots.push(camSlot(cells[0], 'round'), chatSlot(cells[1], 'round'));
    out.items.push({ k: 'title', r: titleR }, { k: 'badge', r: badgeR }, overlayName(c, cells[0], 0, 0.6), { k: 'ticker', r: tick });
    return out;
  },
};

/** Saiz yang disokong oleh sesuatu templat. */
const supportCache = new Map();
export function templateSizes(tpl) {
  if (supportCache.has(tpl.id)) return supportCache.get(tpl.id);
  const list = SIZES.filter((s) => !!LAYOUTS[tpl.layout](mk(s.w, s.h), tpl.opts || {}));
  supportCache.set(tpl.id, list);
  return list;
}
export function buildSpec(tpl, W, H) {
  const fn = LAYOUTS[tpl.layout];
  return fn ? fn(mk(W, H), tpl.opts || {}) : null;
}

/** Semak geometri (digunakan oleh ujian): senarai masalah. */
export function validateSpec(spec, W, H) {
  const issues = [];
  const check = (name, r) => {
    if (!(r.w > 4 && r.h > 4)) issues.push(`${name}: saiz terlalu kecil ${r.w}x${r.h}`);
    if (r.x < -1 || r.y < -1 || r.x + r.w > W + 1 || r.y + r.h > H + 1) issues.push(`${name}: keluar kanvas (${r.x},${r.y},${r.w},${r.h})`);
  };
  spec.slots.forEach((s, i) => check('slot' + i + ':' + s.media, s));
  spec.items.forEach((it, i) => check('item' + i + ':' + it.k, it.r));
  return issues;
}

/* ================================================================== *
 * Penyusun (renderer)
 * ================================================================== */
const SVGNS = 'http://www.w3.org/2000/svg';
const el = (tag, cls, parent) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (parent) parent.appendChild(e);
  return e;
};
const px = (n) => `${Math.round(n * 100) / 100}px`;
const place = (e, r) => { e.style.left = px(r.x); e.style.top = px(r.y); e.style.width = px(r.w); e.style.height = px(r.h); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rgba = (hex, a) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

function shapePath(r, shape, rad) {
  const { x, y, w, h } = r;
  if (shape === 'circle') {
    const s = Math.min(w, h), cx = x + w / 2, cy = y + h / 2, rr = s / 2;
    return `M${cx - rr} ${cy}a${rr} ${rr} 0 1 0 ${s} 0a${rr} ${rr} 0 1 0 ${-s} 0Z`;
  }
  if (shape === 'chamfer') {
    const c = Math.min(rad, w / 3, h / 3);
    return `M${x + c} ${y}H${x + w}V${y + h - c}L${x + w - c} ${y + h}H${x}V${y + c}Z`;
  }
  if (shape === 'rect' || rad <= 0.5) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
  const rr = Math.min(rad, w / 2, h / 2);
  return `M${x + rr} ${y}H${x + w - rr}A${rr} ${rr} 0 0 1 ${x + w} ${y + rr}V${y + h - rr}A${rr} ${rr} 0 0 1 ${x + w - rr} ${y + h}H${x + rr}A${rr} ${rr} 0 0 1 ${x} ${y + h - rr}V${y + rr}A${rr} ${rr} 0 0 1 ${x + rr} ${y}Z`;
}

/** clip-path CSS padanan dengan bentuk lubang (supaya video tidak melepasi bingkai). */
function slotClip(s, rad) {
  if (s.shape === 'circle') {
    const d = Math.min(s.w, s.h);
    return `circle(${px(d / 2)} at 50% 50%)`;
  }
  if (s.shape === 'chamfer') {
    const c = Math.min(rad, s.w / 3, s.h / 3);
    return `polygon(${px(c)} 0, 100% 0, 100% calc(100% - ${px(c)}), calc(100% - ${px(c)}) 100%, 0 100%, 0 ${px(c)})`;
  }
  if (s.shape === 'rect' || rad <= 0.5) return 'none';
  return `inset(0 round ${px(Math.min(rad, s.w / 2, s.h / 2))})`;
}

function patternLayers(st, u) {
  const c = st.pc;
  switch (st.pattern) {
    case 'dots': return [`radial-gradient(${rgba(c, 0.16)} ${px(u * 0.18)}, transparent ${px(u * 0.24)}) 0 0/${px(u * 3)} ${px(u * 3)}`];
    case 'grid': return [`linear-gradient(${rgba(c, 0.09)} 1px, transparent 1px) 0 0/${px(u * 6)} ${px(u * 6)}`, `linear-gradient(90deg, ${rgba(c, 0.09)} 1px, transparent 1px) 0 0/${px(u * 6)} ${px(u * 6)}`];
    case 'diag': return [`repeating-linear-gradient(45deg, ${rgba(c, 0.07)} 0 ${px(u * 0.25)}, transparent ${px(u * 0.25)} ${px(u * 2.2)})`];
    case 'stripes': return [`repeating-linear-gradient(115deg, ${rgba(c, 0.09)} 0 ${px(u * 1.4)}, transparent ${px(u * 1.4)} ${px(u * 4.6)})`];
    case 'rings': return [`repeating-radial-gradient(circle at 88% 12%, ${rgba(c, 0.1)} 0 ${px(u * 0.3)}, transparent ${px(u * 0.3)} ${px(u * 3.2)})`];
    case 'scan': return [`repeating-linear-gradient(0deg, rgba(0,0,0,.22) 0 2px, transparent 2px 5px)`];
    case 'waves': {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="24" viewBox="0 0 120 24"><path d="M0 12q15-12 30 0t30 0t30 0t30 0" fill="none" stroke="${c}" stroke-opacity=".13" stroke-width="2"/></svg>`;
      return [`url("data:image/svg+xml,${encodeURIComponent(svg)}") 0 0/${px(u * 8)} ${px(u * 1.6)}`];
    }
    case 'confetti': {
      const dots = [[8, 14, 0.5], [22, 82, 0.4], [41, 9, 0.35], [57, 91, 0.45], [73, 17, 0.4], [90, 76, 0.5], [95, 38, 0.35], [4, 55, 0.4], [33, 48, 0.25], [66, 55, 0.25]];
      return dots.map(([x, y, a], i) => `radial-gradient(circle at ${x}% ${y}%, ${rgba(i % 2 ? st.accent2 : st.accent, a)} 0 ${px(u * 0.7)}, transparent ${px(u * 0.8)})`);
    }
    default: return [];
  }
}

function decoLayers(st, W, H) {
  const big = Math.max(W, H);
  switch (st.deco) {
    case 'blobs': return [
      `radial-gradient(circle at 100% 0%, ${rgba(st.accent, st.dark ? 0.35 : 0.2)} 0, transparent ${px(big * 0.3)})`,
      `radial-gradient(circle at 0% 100%, ${rgba(st.accent2, st.dark ? 0.3 : 0.18)} 0, transparent ${px(big * 0.28)})`];
    case 'corners': return [
      `radial-gradient(circle at 0% 0%, ${rgba(st.accent, st.dark ? 0.3 : 0.16)} 0, transparent ${px(big * 0.22)})`,
      `radial-gradient(circle at 100% 100%, ${rgba(st.accent2, st.dark ? 0.28 : 0.16)} 0, transparent ${px(big * 0.24)})`];
    default: return [];
  }
}

const stageStates = new WeakMap();

export function stopStage(root) {
  const s = stageStates.get(root);
  if (s) { clearInterval(s.timer); stageStates.delete(root); }
}

/* ---------- Fit teks ---------- */
function fitBox(b, max, min) {
  const c = b.firstElementChild;
  if (!c || !b.clientHeight) return;
  const ok = () => c.scrollHeight <= b.clientHeight + 1 && c.scrollWidth <= b.clientWidth + 1;
  b.style.fontSize = px(max);
  if (ok()) return;
  let lo = min, hi = max;
  for (let i = 0; i < 9; i++) {
    const mid = (lo + hi) / 2;
    b.style.fontSize = px(mid);
    if (ok()) lo = mid; else hi = mid;
  }
  b.style.fontSize = px(lo);
}

function tbox(cx, parent, r, text, o = {}) {
  const b = el('div', 'tb' + (o.cls ? ' ' + o.cls : ''), parent);
  place(b, r);
  const i = el('div', 'in', b);
  i.textContent = text;
  if (o.nowrap) i.style.whiteSpace = 'nowrap';
  if (o.align) i.style.textAlign = o.align;
  if (o.justify) b.style.alignItems = o.justify;
  cx.fits.push([b, o.max || r.h * 0.8, o.min || 8]);
  return b;
}

const fmtTime = (ms) => {
  const t = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  const mm = String(m).padStart(2, '0'), ss = String(s).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

/* ---------- Widget ---------- */
function card(cx, wrap, v) {
  const c = el('div', 'gs-card' + (cx.st.shape === 'chamfer' ? ' chamfer' : '') + (v ? ' ' + v : ''), wrap);
  return c;
}

const WIDGETS = {
  title(cx, it, wrap) {
    const { r } = it, d = cx.d, u = cx.u;
    const v = it.v || 'card';
    const c = card(cx, wrap, 'title-' + v);
    const pad = u * 1.3;
    const bar = v === 'tab' ? 0 : u * 0.9;
    if (v === 'headline') {
      const lab = Math.min(r.w * 0.2, 260);
      const l = el('div', 'headline-lab', c);
      place(l, { x: 0, y: 0, w: lab, h: r.h });
      tbox(cx, l, { x: pad * 0.5, y: r.h * 0.2, w: lab - pad, h: r.h * 0.6 }, 'BERITA', { cls: 'on-accent strong center', nowrap: true, align: 'center', max: r.h * 0.34 });
      const area = { x: lab + pad, y: pad * 0.4, w: r.w - lab - pad * 2, h: r.h - pad * 0.8 };
      tbox(cx, c, { x: area.x, y: area.y, w: area.w, h: d.subtitle ? area.h * 0.66 : area.h }, d.title, { cls: 'strong head', max: r.h * 0.46 });
      if (d.subtitle) tbox(cx, c, { x: area.x, y: area.y + area.h * 0.68, w: area.w, h: area.h * 0.3 }, d.subtitle, { cls: 'muted', nowrap: true, max: r.h * 0.22 });
      return;
    }
    if (bar) { const b = el('i', 'bar', c); b.style.width = px(bar); }
    const tx = bar + pad;
    const tw = r.w - tx - pad;
    if (d.subtitle && v !== 'tab') {
      tbox(cx, c, { x: tx, y: pad * 0.5, w: tw, h: (r.h - pad) * 0.62 }, d.title, { cls: 'strong head', max: r.h * 0.46 });
      tbox(cx, c, { x: tx, y: pad * 0.5 + (r.h - pad) * 0.64, w: tw, h: (r.h - pad) * 0.34 }, d.subtitle, { cls: 'muted', nowrap: true, max: r.h * 0.24 });
    } else {
      tbox(cx, c, { x: tx, y: pad * 0.4, w: tw, h: r.h - pad * 0.8 }, d.title, { cls: 'strong head', max: r.h * 0.5 });
    }
  },

  nameplate(cx, it, wrap) {
    const p = cx.people[it.i || 0];
    if (!p || !p.name) return;
    const { r } = it, u = cx.u;
    const c = card(cx, wrap, 'nameplate' + (it.v ? ' ' + it.v : ''));
    const pad = Math.max(6, r.h * 0.14);
    const av = r.h - pad * 2;
    const a = el('div', 'avatar', c);
    place(a, { x: pad, y: pad, w: av, h: av });
    a.textContent = p.name.trim().charAt(0).toUpperCase();
    a.style.fontSize = px(av * 0.5);
    const tx = pad * 2 + av;
    const tw = r.w - tx - pad;
    if (p.role) {
      tbox(cx, c, { x: tx, y: pad * 0.6, w: tw, h: (r.h - pad) * 0.56 }, p.name, { cls: 'strong', nowrap: true, max: r.h * 0.36 });
      tbox(cx, c, { x: tx, y: pad * 0.6 + (r.h - pad) * 0.56, w: tw, h: (r.h - pad) * 0.4 }, p.role, { cls: 'muted', nowrap: true, max: r.h * 0.26 });
    } else {
      tbox(cx, c, { x: tx, y: pad, w: tw, h: r.h - pad * 2 }, p.name, { cls: 'strong', nowrap: true, max: r.h * 0.4 });
    }
  },

  lower(cx, it, wrap) {
    if (cx.d.lower === false) return;
    const p = cx.people[0] || { name: cx.d.title, role: cx.d.subtitle };
    const { r } = it, u = cx.u;
    const c = card(cx, wrap, 'lower');
    const stripe = el('i', 'bar', c);
    stripe.style.width = px(Math.max(8, r.h * 0.1));
    const pad = r.h * 0.16;
    const tx = Math.max(8, r.h * 0.1) + pad * 1.4;
    const tw = r.w - tx - pad;
    tbox(cx, c, { x: tx, y: pad * 0.6, w: tw, h: (r.h - pad) * (p.role ? 0.58 : 1) }, p.name, { cls: 'strong head', nowrap: true, max: r.h * 0.42 });
    if (p.role) tbox(cx, c, { x: tx, y: pad * 0.6 + (r.h - pad) * 0.6, w: tw, h: (r.h - pad) * 0.36 }, p.role, { cls: 'accent-t', nowrap: true, max: r.h * 0.26 });
  },

  ticker(cx, it, wrap) {
    if (cx.d.tickerOn === false || !cx.d.ticker) return;
    const { r } = it;
    const c = el('div', 'gs-card ticker' + (cx.st.shape === 'chamfer' ? ' chamfer' : ''), wrap);
    const lab = el('div', 'tick-lab', c);
    const lw = Math.min(r.w * 0.2, r.h * 3.4);
    place(lab, { x: 0, y: 0, w: lw, h: r.h });
    tbox(cx, lab, { x: r.h * 0.2, y: r.h * 0.15, w: lw - r.h * 0.4, h: r.h * 0.7 }, cx.d.tickerLabel || 'INFO', { cls: 'on-accent strong', nowrap: true, align: 'center', max: r.h * 0.5 });
    const track = el('div', 'tick-win', c);
    place(track, { x: lw + r.h * 0.3, y: 0, w: r.w - lw - r.h * 0.6, h: r.h });
    const run = el('div', 'tick-run', track);
    const text = String(cx.d.ticker);
    for (let i = 0; i < 2; i++) { const s = el('span', null, run); s.textContent = text + '      •      '; }
    run.style.fontSize = px(r.h * 0.44);
    const dur = clamp(text.length * 0.2, 14, 90);
    run.style.animationDuration = `${dur}s`;
    // fasa berterusan merentas lukisan semula; lakaran galeri bermula dari awal teks
    run.style.animationDelay = cx.mode === 'gallery' ? '0s' : `-${((Date.now() / 1000) % dur).toFixed(2)}s`;
  },

  clock(cx, it, wrap) {
    const { r } = it;
    const c = card(cx, wrap, 'clock');
    const t = tbox(cx, c, { x: r.w * 0.06, y: r.h * 0.06, w: r.w * 0.88, h: r.h * 0.58 }, '', { cls: 'strong num', nowrap: true, align: 'center', max: r.h * 0.5 });
    const dt = tbox(cx, c, { x: r.w * 0.06, y: r.h * 0.62, w: r.w * 0.88, h: r.h * 0.32 }, '', { cls: 'muted', nowrap: true, align: 'center', max: r.h * 0.2 });
    const upd = () => {
      const now = new Date();
      t.firstElementChild.textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      let ds = '';
      try { ds = now.toLocaleDateString('ms-MY', { weekday: 'short', day: 'numeric', month: 'short' }); } catch { ds = now.toDateString(); }
      dt.firstElementChild.textContent = ds;
    };
    upd();
    cx.tick.push(upd);
  },

  badge(cx, it, wrap) {
    const txt = String(cx.d.badge || '').trim();
    if (!txt) return;
    const { r } = it;
    const isRec = /rec/i.test(txt);
    const c = el('div', 'badge' + (isRec ? ' rec' : ''), wrap);
    c.style.borderRadius = cx.st.shape === 'chamfer' ? px(r.h * 0.2) : px(r.h / 2);
    const dot = el('i', 'dot', c);
    const ds = r.h * 0.34;
    dot.style.width = dot.style.height = px(ds);
    dot.style.left = px(r.h * 0.34);
    dot.style.top = px((r.h - ds) / 2);
    tbox(cx, c, { x: r.h * 0.34 + ds + r.h * 0.2, y: r.h * 0.12, w: r.w - (r.h * 0.34 + ds + r.h * 0.2) - r.h * 0.34, h: r.h * 0.76 }, txt, { cls: 'strong on-solid', nowrap: true, align: 'center', max: r.h * 0.5 });
  },

  logo(cx, it, wrap) {
    const { r } = it;
    const c = card(cx, wrap, 'logo');
    const url = safeUrl(cx.d.logo);
    const pad = r.h * 0.14;
    if (url) {
      const im = el('img', null, c);
      im.alt = '';
      im.src = url;
      place(im, { x: pad, y: pad, w: r.w - 2 * pad, h: r.h - 2 * pad });
      im.style.objectFit = 'contain';
      return;
    }
    const im = el('img', null, c);
    im.alt = '';
    im.src = new URL('../img/logo.svg', import.meta.url).href;
    if (r.w < r.h * 2.4) { // terlalu sempit untuk teks: ikon sahaja
      const s = Math.min(r.w, r.h) - 2 * pad;
      place(im, { x: (r.w - s) / 2, y: (r.h - s) / 2, w: s, h: s });
      return;
    }
    place(im, { x: pad, y: pad, w: r.h - 2 * pad, h: r.h - 2 * pad });
    tbox(cx, c, { x: r.h, y: pad, w: r.w - r.h - pad, h: r.h - 2 * pad }, cx.d.brand || 'GLOBAL STREAMER', { cls: 'strong', nowrap: true, max: r.h * 0.34 });
  },

  slide(cx, it, wrap) {
    const { r } = it, d = cx.d, u = cx.u;
    const slides = Array.isArray(d.slides) ? d.slides : [];
    const idx = clamp(Number(d.slide) || 0, 0, Math.max(0, slides.length - 1));
    const sl = slides[idx];
    const c = card(cx, wrap, 'slide' + (it.v === 'product' ? ' product' : ''));
    const pad = Math.max(u * 1.8, 14);
    const dotsH = Math.max(18, r.h * 0.045);
    if (!sl) {
      tbox(cx, c, { x: pad, y: pad, w: r.w - 2 * pad, h: r.h - 2 * pad }, 'Tambah slaid di panel Slaid', { cls: 'muted', align: 'center', max: 40 });
      return;
    }
    const img = safeUrl(sl.image);
    const inner = { x: pad, y: pad, w: r.w - 2 * pad, h: r.h - 2 * pad - dotsH - u * 0.5 };
    let textR = inner;
    if (img) {
      const wide = inner.w / inner.h >= 1.15;
      const imR = wide ? { x: inner.x + inner.w * 0.58, y: inner.y, w: inner.w * 0.42, h: inner.h } : { x: inner.x, y: inner.y + inner.h * 0.58, w: inner.w, h: inner.h * 0.42 };
      textR = wide ? { x: inner.x, y: inner.y, w: inner.w * 0.55, h: inner.h } : { x: inner.x, y: inner.y, w: inner.w, h: inner.h * 0.55 };
      const box = el('div', 'slide-img', c);
      place(box, imR);
      const im = el('img', null, box);
      im.alt = '';
      im.src = img;
    }
    const b = el('div', 'tb slide-body', c);
    place(b, textR);
    const w = el('div', 'in', b);
    const h2 = el('div', 'sl-title', w);
    h2.textContent = sl.title || '';
    const ul = el('ul', null, w);
    String(sl.bullets || '').split('\n').map((s) => s.trim().replace(/^[-•*]\s*/, '')).filter(Boolean).slice(0, 14).forEach((t) => {
      const li = el('li', null, ul);
      li.textContent = t;
    });
    b.style.alignItems = 'flex-start';
    cx.fits.push([b, clamp(textR.h * 0.17, 18, 72), 11]);
    // titik kemajuan
    const dots = el('div', 'dots', c);
    place(dots, { x: pad, y: r.h - pad * 0.6 - dotsH, w: r.w - 2 * pad, h: dotsH });
    const prog = el('i', null, dots);
    prog.style.width = `${((idx + 1) / slides.length) * 100}%`;
    const num = el('span', null, dots);
    num.textContent = `${idx + 1} / ${slides.length}`;
    num.style.fontSize = px(dotsH * 0.78);
  },

  agenda(cx, it, wrap) {
    const { r } = it, d = cx.d, u = cx.u;
    const slides = Array.isArray(d.slides) ? d.slides : [];
    const idx = clamp(Number(d.slide) || 0, 0, Math.max(0, slides.length - 1));
    const c = card(cx, wrap, 'agenda');
    const pad = Math.max(u * 1.1, 10);
    const headH = Math.min(r.h * 0.2, 44);
    tbox(cx, c, { x: pad, y: pad * 0.5, w: r.w - 2 * pad, h: headH }, 'AGENDA', { cls: 'accent-t strong', nowrap: true, max: headH * 0.7 });
    const b = el('div', 'tb agenda-body', c);
    place(b, { x: pad, y: pad * 0.5 + headH, w: r.w - 2 * pad, h: r.h - pad - headH });
    b.style.alignItems = 'flex-start';
    const w = el('div', 'in', b);
    slides.slice(0, 12).forEach((s, i) => {
      const row = el('div', 'row' + (i === idx ? ' cur' : ''), w);
      const n = el('b', null, row);
      n.textContent = String(i + 1);
      const t = el('span', null, row);
      t.textContent = s.title || '';
    });
    cx.fits.push([b, 30, 10]);
  },

  countdown(cx, it, wrap) {
    const { r } = it, d = cx.d;
    const c = card(cx, wrap, 'countdown');
    tbox(cx, c, { x: r.w * 0.06, y: r.h * 0.06, w: r.w * 0.88, h: r.h * 0.26 }, 'MASA', { cls: 'muted strong', nowrap: true, align: 'center', max: r.h * 0.2 });
    const t = tbox(cx, c, { x: r.w * 0.04, y: r.h * 0.3, w: r.w * 0.92, h: r.h * 0.62 }, '00:00', { cls: 'strong num accent-t', nowrap: true, align: 'center', max: r.h * 0.6 });
    const upd = () => {
      const left = d.countdownEnd ? Number(d.countdownEnd) - Date.now() : (Number(d.countdownMin) || 0) * 60000;
      t.firstElementChild.textContent = fmtTime(left);
    };
    upd();
    cx.tick.push(upd);
  },

  quizQ(cx, it, wrap) {
    const { r } = it, q = cx.d.quiz || {};
    const c = card(cx, wrap, 'quizq');
    const pad = Math.max(cx.u * 1.6, 12);
    tbox(cx, c, { x: pad, y: pad * 0.5, w: r.w - 2 * pad, h: Math.min(40, r.h * 0.18) }, 'SOALAN', { cls: 'accent-t strong', nowrap: true, max: 28 });
    tbox(cx, c, { x: pad, y: pad * 0.5 + Math.min(40, r.h * 0.18), w: r.w - 2 * pad, h: r.h - pad - Math.min(40, r.h * 0.18) }, q.q || '', { cls: 'strong head', max: r.h * 0.3 });
  },

  quizOpts(cx, it, wrap) {
    const { r } = it, q = cx.d.quiz || {};
    const opts = (q.options || []).slice(0, 4);
    const cols = r.w / r.h > 1.5 ? 2 : 1;
    const rows = Math.ceil(opts.length / cols);
    const g = cx.u * 1.2;
    const cw = (r.w - g * (cols - 1)) / cols, ch = (r.h - g * (rows - 1)) / rows;
    opts.forEach((o, i) => {
      const cell = { x: (i % cols) * (cw + g), y: Math.floor(i / cols) * (ch + g), w: cw, h: ch };
      const holder = el('div', 'gs-w', wrap);
      place(holder, cell);
      const correct = Number(q.answer) === i;
      const c = card(cx, holder, 'opt' + (q.reveal ? (correct ? ' right' : ' dim') : ''));
      const chip = el('div', 'letter', c);
      const cs = ch * 0.62;
      place(chip, { x: ch * 0.19, y: (ch - cs) / 2, w: cs, h: cs });
      chip.textContent = 'ABCD'[i];
      chip.style.fontSize = px(cs * 0.55);
      tbox(cx, c, { x: ch * 0.19 * 2 + cs, y: ch * 0.1, w: cw - ch * 0.19 * 3 - cs, h: ch * 0.8 }, o, { cls: 'strong', max: ch * 0.4 });
    });
  },

  handle(cx, it, wrap) {
    const parts = String(cx.d.handle || '').split(/[|,]/).map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    const { r } = it;
    const c = it.v === 'plain' ? el('div', 'handle plain', wrap) : card(cx, wrap, 'handle');
    tbox(cx, c, { x: r.h * 0.3, y: r.h * 0.1, w: r.w - r.h * 0.6, h: r.h * 0.8 }, parts.join('   •   '), { cls: 'strong', nowrap: true, align: 'center', max: r.h * 0.5 });
  },

  chips(cx, it, wrap) {
    const parts = String(cx.d.topics || '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 10);
    if (!parts.length) return;
    const { r } = it;
    const b = el('div', 'tb chips', wrap);
    place(b, { x: 0, y: 0, w: r.w, h: r.h });
    b.style.alignItems = 'flex-start';
    const w = el('div', 'in', b);
    parts.forEach((p) => { const s = el('span', null, w); s.textContent = p; });
    cx.fits.push([b, Math.min(r.h * 0.4, 40), 10]);
  },

  goal(cx, it, wrap) {
    const g = cx.d.goal || {};
    const cur = Number(g.current) || 0, tgt = Math.max(1, Number(g.target) || 1);
    const pct = clamp(cur / tgt, 0, 1);
    const { r } = it;
    const c = card(cx, wrap, 'goal');
    const pad = r.h * 0.14;
    tbox(cx, c, { x: pad * 1.4, y: pad * 0.7, w: r.w * 0.62, h: r.h * 0.34 }, g.label || 'Matlamat', { cls: 'strong', nowrap: true, max: r.h * 0.26 });
    tbox(cx, c, { x: r.w * 0.66, y: pad * 0.7, w: r.w * 0.34 - pad * 1.4, h: r.h * 0.34 }, `${cur} / ${tgt}`, { cls: 'strong accent-t', nowrap: true, align: 'right', max: r.h * 0.26 });
    const bar = el('div', 'gbar', c);
    place(bar, { x: pad * 1.4, y: r.h * 0.56, w: r.w - pad * 2.8, h: r.h * 0.26 });
    const fill = el('i', null, bar);
    fill.style.width = `${pct * 100}%`;
  },

  price(cx, it, wrap) {
    const { r } = it;
    const c = card(cx, wrap, 'price');
    tbox(cx, c, { x: r.w * 0.06, y: r.h * 0.08, w: r.w * 0.88, h: r.h * 0.56 }, cx.d.price || '', { cls: 'on-accent strong num', nowrap: true, align: 'center', max: r.h * 0.5 });
    tbox(cx, c, { x: r.w * 0.06, y: r.h * 0.64, w: r.w * 0.88, h: r.h * 0.28 }, cx.d.cta || '', { cls: 'on-accent', nowrap: true, align: 'center', max: r.h * 0.2 });
  },

  bigscene(cx, it, wrap) {
    const { r } = it, d = cx.d;
    const kind = it.scene || 'start';
    const label = { start: 'TIDAK LAMA LAGI', brb: 'REHAT SEBENTAR', end: 'TERIMA KASIH' }[kind];
    const c = card(cx, wrap, 'bigscene');
    const pad = r.h * 0.07;
    const hasTimer = kind !== 'end';
    const parts = [{ h: r.h * 0.1 }, { h: r.h * (hasTimer ? 0.3 : 0.4) }, { h: r.h * 0.12 }];
    if (hasTimer) parts.push({ h: r.h * 0.26 });
    const rows = stackV(pad, pad, r.w - 2 * pad, r.h - 2 * pad, pad * 0.5, parts.map((p, i) => (i === parts.length - 1 ? { f: 1 } : p)));
    tbox(cx, c, rows[0], label, { cls: 'accent-t strong', nowrap: true, align: 'center', max: rows[0].h * 0.8 });
    tbox(cx, c, rows[1], d.title, { cls: 'strong head', align: 'center', max: rows[1].h * 0.7 });
    tbox(cx, c, rows[2], d.subtitle, { cls: 'muted', nowrap: true, align: 'center', max: rows[2].h * 0.8 });
    if (hasTimer) {
      const pill = el('div', 'timer-pill', c);
      const tr = rows[3];
      const pw = Math.min(tr.w * 0.6, tr.h * 4.2);
      place(pill, { x: tr.x + (tr.w - pw) / 2, y: tr.y, w: pw, h: tr.h });
      const t = tbox(cx, pill, { x: tr.h * 0.2, y: tr.h * 0.08, w: pw - tr.h * 0.4, h: tr.h * 0.84 }, '00:00', { cls: 'on-accent strong num', nowrap: true, align: 'center', max: tr.h * 0.8 });
      const upd = () => {
        const left = d.countdownEnd ? Number(d.countdownEnd) - Date.now() : (Number(d.countdownMin) || 0) * 60000;
        t.firstElementChild.textContent = fmtTime(left);
      };
      upd();
      cx.tick.push(upd);
    }
  },
};

const ICONS = {
  cam: '<svg viewBox="0 0 64 64"><circle cx="32" cy="24" r="11"/><path d="M10 58c1-13 10-21 22-21s21 8 22 21z"/></svg>',
  screen: '<svg viewBox="0 0 64 64"><rect x="6" y="10" width="52" height="34" rx="4" fill="none" stroke="currentColor" stroke-width="4"/><path d="M22 54h20M32 44v10" stroke="currentColor" stroke-width="4" fill="none"/></svg>',
  chat: '<svg viewBox="0 0 64 64"><path d="M8 12h48v32H30L18 54V44H8z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M18 24h28M18 33h18" stroke="currentColor" stroke-width="4"/></svg>',
};

const mediaCache = new Map();
function videoFor(stream, fit) {
  let v = mediaCache.get(stream);
  if (!v) {
    v = document.createElement('video');
    v.muted = true; v.autoplay = true; v.playsInline = true;
    v.srcObject = stream;
    v.play().catch(() => {});
    mediaCache.set(stream, v);
  }
  v.style.objectFit = fit;
  return v;
}

/**
 * Lukis templat ke dalam `root`.
 * project: { templateId, size:{w,h}, data }
 * opts.mode: 'overlay' (OBS, lubang lutsinar) | 'studio' | 'gallery'
 * opts.media: { cam, screen } MediaStream untuk pratonton studio
 */
export function renderStage(root, project, opts = {}) {
  stopStage(root);
  const mode = opts.mode || 'overlay';
  const tpl = getTemplate(project.templateId);
  const W = project.size.w, H = project.size.h;
  // lepaskan video sedia ada supaya tidak dimusnahkan
  root.querySelectorAll('video').forEach((v) => v.remove());
  root.textContent = '';
  if (!tpl) { root.textContent = 'Templat tidak dijumpai'; return null; }
  const spec = buildSpec(tpl, W, H);

  const stage = el('div', 'gs-stage', root);
  stage.style.width = px(W);
  stage.style.height = px(H);
  if (!spec) {
    stage.textContent = 'Saiz ini tidak disokong oleh templat.';
    return { stage, W, H, spec: null };
  }

  const d = buildData(tpl, project.data);
  d.slides = Array.isArray(d.slides) ? d.slides.filter((x) => x && typeof x === 'object') : [];
  const known = typeof d.styleId === 'string' && Object.hasOwn(STYLES, d.styleId);
  const sid = known && (!STYLES[d.styleId].gaming || STYLES[tpl.style].gaming) ? d.styleId : tpl.style;
  const st = { ...STYLES[sid] };
  if (/^#[0-9a-f]{6}$/i.test(d.accent || '')) st.accent = d.accent;
  const u = Math.max(4, Math.min(W, H) / 100);
  const cx = { st, d, u, W, H, people: parsePeople(d.people), fits: [], tick: [], mode };

  stage.classList.toggle('static', mode === 'gallery');
  stage.classList.toggle('dark', !!st.dark);
  stage.classList.toggle('gaming', !!st.gaming);
  stage.classList.toggle('caps', !!st.caps);
  stage.style.setProperty('--u', px(u));
  stage.style.setProperty('--ink', st.ink);
  stage.style.setProperty('--muted', st.muted);
  stage.style.setProperty('--panel', st.panel);
  stage.style.setProperty('--accent', st.accent);
  stage.style.setProperty('--accent2', st.accent2);
  stage.style.setProperty('--on-accent', st.dark ? '#0A0A12' : '#FFFFFF');
  stage.style.setProperty('--r', String(st.r));
  stage.style.setProperty('--font', st.font);
  stage.style.setProperty('--shadow', st.dark ? 'rgba(0,0,0,.5)' : 'rgba(16,38,77,.16)');

  const radius = u * st.r * 2.6;
  const showMedia = mode !== 'overlay';

  // 0) lapisan media / placeholder
  const mediaLayer = el('div', 'gs-media', stage);
  if (spec.bg === false && showMedia) mediaLayer.classList.add('sample-backdrop');
  if (showMedia) {
    spec.slots.forEach((s) => {
      const box = el('div', 'gs-slot-ph ' + s.kind, mediaLayer);
      place(box, s);
      box.style.clipPath = slotClip(s, radius);
      const stream = opts.media && (s.media === 'cam' ? opts.media.cam : s.media === 'screen' ? opts.media.screen : null);
      if (stream) {
        box.appendChild(videoFor(stream, s.media === 'screen' ? 'contain' : 'cover'));
      } else {
        box.insertAdjacentHTML('beforeend', ICONS[s.kind] || ICONS.cam);
        const lab = el('span', null, box);
        lab.textContent = s.label || '';
        box.querySelector('svg').style.width = px(Math.min(s.w, s.h) * 0.3);
        lab.style.fontSize = px(clamp(Math.min(s.w, s.h) * 0.06, 12, 34));
      }
    });
  }

  // 1) latar bertebuk
  if (spec.bg !== false) {
    const bg = el('div', 'gs-bg', stage);
    const layers = [...decoLayers(st, W, H), ...patternLayers(st, u), `linear-gradient(135deg, ${st.bgA}, ${st.bgB})`];
    bg.style.background = layers.join(',');
    if (st.deco === 'frame') bg.style.boxShadow = `inset 0 0 0 ${px(u * 0.9)} ${st.accent2}, inset 0 0 0 ${px(u * 1.5)} ${st.panel}, inset 0 0 0 ${px(u * 1.8)} ${st.accent}`;
    if (spec.slots.length) {
      const holes = spec.slots.map((s) => `<path fill="#000" d="${shapePath(s, s.shape, radius)}"/>`).join('');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/>${holes}</mask></defs><rect width="${W}" height="${H}" fill="#000" mask="url(#m)"/></svg>`;
      const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
      bg.style.webkitMaskImage = url;
      bg.style.maskImage = url;
      bg.style.webkitMaskSize = bg.style.maskSize = '100% 100%';
      bg.style.webkitMaskRepeat = bg.style.maskRepeat = 'no-repeat';
    }
  }

  // 2) bingkai sekeliling lubang
  if (spec.slots.length) {
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('class', 'gs-frames');
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    stage.appendChild(svg);
    spec.slots.forEach((s) => {
      const p = document.createElementNS(SVGNS, 'path');
      p.setAttribute('d', shapePath(s, s.shape, radius));
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', s.kind === 'chat' ? st.accent2 : st.accent);
      p.setAttribute('stroke-width', String(Math.max(3, u * (st.gaming ? 0.5 : 0.55))));
      p.setAttribute('stroke-linejoin', 'round');
      if (s.kind === 'chat') p.setAttribute('stroke-dasharray', `${u * 1.4} ${u * 0.9}`);
      svg.appendChild(p);
    });
  }

  // 3) widget
  const items = el('div', 'gs-items', stage);
  spec.items.forEach((it) => {
    const fn = WIDGETS[it.k];
    if (!fn) return;
    const wrap = el('div', 'gs-w w-' + it.k, items);
    place(wrap, it.r);
    const before = wrap.childNodes.length;
    try {
      fn(cx, it, wrap);
    } catch (e) {
      // satu widget yang rosak (data tidak sah) tidak patut mengosongkan seluruh overlay
      console.warn(`Widget ${it.k} gagal dilukis:`, e);
      wrap.replaceChildren();
    }
    if (wrap.childNodes.length === before) wrap.remove();
  });
  stage.style.setProperty('--rad', px(radius));
  stage.style.setProperty('--chamfer', px(u * 1.6));

  // 4) fit teks setelah berada dalam DOM
  if (opts.fit !== false) cx.fits.forEach(([b, max, min]) => fitBox(b, max, min));

  // 5) pemasa (jam, kira detik)
  let timer = null;
  if (cx.tick.length) {
    timer = setInterval(() => cx.tick.forEach((f) => f()), 1000);
  }
  stageStates.set(root, { timer });
  return { stage, W, H, spec };
}

/** Skala pentas supaya muat dalam `box`; kembalikan skala. */
export function scaleToBox(stage, W, H, boxW, boxH) {
  const s = Math.min(boxW / W, boxH / H);
  stage.style.transform = `scale(${s})`;
  stage.style.transformOrigin = '0 0';
  return s;
}
