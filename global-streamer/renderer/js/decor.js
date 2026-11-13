/* Global Streamer - latar hiasan untuk template Presentation (sekolah, perpustakaan, universiti, korporat, bunga, buku nota, sains, kanak-kanak, geometri).
 * Dilukis terus pada kanvas (vektor); hiasan berada di tepi supaya kawasan perbentangan di tengah kekal bersih. */
(function () {
  'use strict';
  const W = GS.widgets;
  const TAU = Math.PI * 2;
  const STYLES = [['school', 'Sekolah (papan hitam)'], ['library', 'Perpustakaan (buku)'], ['university', 'Universiti'], ['corporate', 'Korporat'], ['floral', 'Bunga'], ['notebook', 'Buku nota'], ['science', 'Sains'], ['kids', 'Kanak-kanak'], ['geometric', 'Geometri']];
  const lin = (ctx, x0, y0, x1, y1, stops) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  const flower = (ctx, x, y, r, petal, center) => { ctx.save(); ctx.translate(x, y); ctx.fillStyle = petal; for (let i = 0; i < 6; i++) { ctx.rotate(TAU / 6); ctx.beginPath(); ctx.ellipse(r * 0.55, 0, r * 0.5, r * 0.28, 0, 0, TAU); ctx.fill(); } ctx.fillStyle = center; ctx.beginPath(); ctx.arc(0, 0, r * 0.28, 0, TAU); ctx.fill(); ctx.restore(); };
  const leaf = (ctx, x, y, l, a, col) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(l * 0.5, -l * 0.32, l, 0); ctx.quadraticCurveTo(l * 0.5, l * 0.32, 0, 0); ctx.fill(); ctx.restore(); };
  const cloud = (ctx, x, y, u, a) => { ctx.fillStyle = 'rgba(255,255,255,' + (a || 0.95) + ')'; ctx.beginPath(); ctx.arc(x, y, 34 * u, 0, TAU); ctx.arc(x + 42 * u, y - 14 * u, 44 * u, 0, TAU); ctx.arc(x + 90 * u, y, 34 * u, 0, TAU); ctx.fill(); ctx.fillRect(x, y, 90 * u, 34 * u); };
  const book = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; rr(ctx, x, y, w, h, Math.min(4, w / 4)); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + w * 0.2, y + h * 0.15, w * 0.12, h * 0.7); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x, y + h * 0.1, w, h * 0.06); ctx.fillRect(x, y + h * 0.84, w, h * 0.06); };
  const cap = (ctx, x, y, u, col, tassel) => { ctx.save(); ctx.translate(x, y); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-60 * u, 0); ctx.lineTo(0, -28 * u); ctx.lineTo(60 * u, 0); ctx.lineTo(0, 28 * u); ctx.closePath(); ctx.fill(); ctx.fillRect(-32 * u, 14 * u, 64 * u, 26 * u); ctx.strokeStyle = tassel; ctx.lineWidth = 4 * u; ctx.beginPath(); ctx.moveTo(52 * u, 2 * u); ctx.lineTo(52 * u, 40 * u); ctx.stroke(); ctx.fillStyle = tassel; ctx.beginPath(); ctx.arc(52 * u, 44 * u, 6 * u, 0, TAU); ctx.fill(); ctx.restore(); };
  const pencil = (ctx, x, y, len, ang, u) => { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = '#f4c542'; ctx.fillRect(0, -9 * u, len, 18 * u); ctx.fillStyle = '#e8a33d'; ctx.fillRect(0, -9 * u, len, 5 * u); ctx.fillStyle = '#f2d2a8'; ctx.beginPath(); ctx.moveTo(len, -9 * u); ctx.lineTo(len + 30 * u, 0); ctx.lineTo(len, 9 * u); ctx.fill(); ctx.fillStyle = '#333'; ctx.beginPath(); ctx.moveTo(len + 22 * u, -3 * u); ctx.lineTo(len + 30 * u, 0); ctx.lineTo(len + 22 * u, 3 * u); ctx.fill(); ctx.fillStyle = '#e66'; ctx.fillRect(-18 * u, -9 * u, 18 * u, 18 * u); ctx.restore(); };

  const DRAW = {
    school(ctx, x, y, w, h, u) {
      ctx.fillStyle = lin(ctx, 0, y, 0, y + h, [[0, '#2c5a44'], [1, '#1d4030']]); ctx.fillRect(x, y, w, h);
      for (let i = 0; i < 90; i++) { ctx.fillStyle = 'rgba(255,255,255,' + (0.012 + (i % 5) * 0.004) + ')'; ctx.beginPath(); ctx.ellipse(x + ((i * 193) % 1000) / 1000 * w, y + ((i * 337) % 1000) / 1000 * h, 90 * u, 20 * u, i, 0, TAU); ctx.fill(); }
      const f = 26 * u; ctx.strokeStyle = lin(ctx, 0, y, 0, y + h, [[0, '#a9743f'], [1, '#7a4a22']]); ctx.lineWidth = f * 2; ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = '#8c5a2b'; ctx.fillRect(x + f, y + h - 54 * u, w - 2 * f, 28 * u); ctx.fillStyle = '#f4f4ef'; rr(ctx, x + w * 0.62, y + h - 60 * u, 80 * u, 14 * u, 6 * u); ctx.fill(); ctx.fillStyle = '#f7c948'; rr(ctx, x + w * 0.62 + 100 * u, y + h - 58 * u, 50 * u, 12 * u, 5 * u); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '700 ' + 46 * u + 'px "Segoe Print","Comic Sans MS",cursive'; ctx.textAlign = 'left';
      ctx.fillText('A B C', x + 52 * u, y + 90 * u); ctx.fillText('1 + 1 = 2', x + w - 330 * u, y + 90 * u); ctx.font = '700 ' + 34 * u + 'px "Segoe Print","Comic Sans MS",cursive'; ctx.fillText('a² + b² = c²', x + 52 * u, y + h - 84 * u);
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 3 * u; ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU * 0.4; const px = x + w - 120 * u + Math.cos(a) * 30 * u, py = y + h - 130 * u + Math.sin(a) * 30 * u; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath(); ctx.stroke();
      ctx.fillStyle = '#e24b4b'; ctx.beginPath(); ctx.arc(x + w - 70 * u, y + h - 78 * u, 22 * u, 0, TAU); ctx.fill(); leaf(ctx, x + w - 70 * u, y + h - 98 * u, 22 * u, -0.8, '#4caf50');
    },
    library(ctx, x, y, w, h, u) {
      ctx.fillStyle = lin(ctx, 0, y, 0, y + h, [[0, '#f8efdc'], [1, '#efe0c2']]); ctx.fillRect(x, y, w, h);
      const lamp = ctx.createRadialGradient(x + 120 * u, y + 60 * u, 10, x + 120 * u, y + 60 * u, 420 * u); lamp.addColorStop(0, 'rgba(255,214,120,0.55)'); lamp.addColorStop(1, 'rgba(255,214,120,0)'); ctx.fillStyle = lamp; ctx.fillRect(x, y, w, h);
      const cols = ['#b5483a', '#2f6f8f', '#e0a63a', '#4f8f5a', '#7a4a8f', '#c46a2f', '#2c4a7a', '#a33a5a'];
      ctx.fillStyle = '#7a4a22'; ctx.fillRect(x, y + h - 14 * u, w, 14 * u);
      let bx = x + 8 * u, i = 0; while (bx < x + w - 20 * u) { const bw = (26 + (i * 7) % 22) * u, bh = (90 + (i * 29) % 70) * u; if (bx > x + w * 0.18 && bx < x + w * 0.82 && i % 3) { bx += bw + 2 * u; i++; continue; } book(ctx, bx, y + h - 14 * u - bh, bw, bh, cols[i % cols.length]); bx += bw + 2 * u; i++; }
      ctx.fillStyle = '#7a4a22'; ctx.fillRect(x, y, w, 12 * u); let tx = x + 12 * u; i = 3; while (tx < x + w * 0.2) { const bw = (24 + (i * 5) % 16) * u, bh = (70 + (i * 31) % 40) * u; book(ctx, tx, y + 12 * u, bw, bh, cols[i % cols.length]); tx += bw + 2 * u; i++; }
      tx = x + w * 0.8; while (tx < x + w - 14 * u) { const bw = (24 + (i * 5) % 16) * u, bh = (70 + (i * 31) % 40) * u; book(ctx, tx, y + 12 * u, bw, bh, cols[i % cols.length]); tx += bw + 2 * u; i++; }
    },
    university(ctx, x, y, w, h, u) {
      ctx.fillStyle = lin(ctx, 0, y, 0, y + h, [[0, '#183560'], [1, '#0f2445']]); ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#d8b25a'; ctx.lineWidth = 4 * u; ctx.strokeRect(x + 14 * u, y + 14 * u, w - 28 * u, h - 28 * u); ctx.lineWidth = 1.5 * u; ctx.strokeRect(x + 24 * u, y + 24 * u, w - 48 * u, h - 48 * u);
      [x + 40 * u, x + w - 100 * u].forEach((px) => { ctx.fillStyle = lin(ctx, px, 0, px + 60 * u, 0, [[0, '#e9dcc0'], [0.5, '#fbf3df'], [1, '#d2c3a2']]); ctx.fillRect(px, y + 90 * u, 60 * u, h - 190 * u); ctx.fillStyle = '#d8b25a'; ctx.fillRect(px - 8 * u, y + 76 * u, 76 * u, 16 * u); ctx.fillRect(px - 8 * u, y + h - 100 * u, 76 * u, 16 * u); ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 2 * u; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(px + i * 15 * u, y + 92 * u); ctx.lineTo(px + i * 15 * u, y + h - 100 * u); ctx.stroke(); } });
      cap(ctx, x + w / 2, y + 62 * u, 1.1 * u, '#d8b25a', '#fff'); ctx.fillStyle = 'rgba(216,178,90,0.9)'; ctx.font = '700 ' + 24 * u + 'px "Georgia",serif'; ctx.textAlign = 'center'; ctx.fillText('★  ★  ★', x + w / 2, y + h - 44 * u);
    },
    corporate(ctx, x, y, w, h, u) {
      ctx.fillStyle = '#f5f7fb'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = lin(ctx, x + w, y, x + w - 400 * u, y + 300 * u, [[0, '#1d4fd8'], [1, '#4f86ff']]); ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x + w - 420 * u, y); ctx.lineTo(x + w, y + 300 * u); ctx.fill();
      ctx.fillStyle = 'rgba(29,79,216,0.14)'; ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x + w - 560 * u, y); ctx.lineTo(x + w, y + 400 * u); ctx.fill();
      ctx.fillStyle = lin(ctx, x, y + h, x + 400 * u, y + h - 300 * u, [[0, '#0b2a6f'], [1, '#2c63e0']]); ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + 380 * u, y + h); ctx.lineTo(x, y + h - 260 * u); ctx.fill();
      ctx.fillStyle = '#f2b705'; ctx.beginPath(); ctx.moveTo(x, y + h - 270 * u); ctx.lineTo(x, y + h - 296 * u); ctx.lineTo(x + 40 * u, y + h - 262 * u); ctx.fill();
      ctx.strokeStyle = 'rgba(29,79,216,0.07)'; ctx.lineWidth = 1; for (let gx = x; gx < x + w; gx += 60 * u) { ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke(); } for (let gy = y; gy < y + h; gy += 60 * u) { ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; [0.3, 0.55, 0.8, 1].forEach((k, i) => ctx.fillRect(x + w - 150 * u + i * 26 * u, y + 130 * u - k * 80 * u, 16 * u, k * 80 * u));
    },
    floral(ctx, x, y, w, h, u) {
      ctx.fillStyle = lin(ctx, 0, y, 0, y + h, [[0, '#fff3f1'], [1, '#fde4e8']]); ctx.fillRect(x, y, w, h);
      const corner = (cx, cy, sx, sy) => { ctx.save(); ctx.translate(cx, cy); ctx.scale(sx, sy); for (let i = 0; i < 6; i++) leaf(ctx, 0, 0, (150 + i * 24) * u, 0.15 + i * 0.26, i % 2 ? '#8dc58f' : '#6fb07a'); flower(ctx, 80 * u, 60 * u, 52 * u, '#f58fa6', '#ffd36a'); flower(ctx, 170 * u, 120 * u, 36 * u, '#ffb27a', '#fff3a0'); flower(ctx, 40 * u, 170 * u, 42 * u, '#c58ef0', '#ffe27a'); flower(ctx, 150 * u, 30 * u, 26 * u, '#ff7da0', '#ffe27a'); ctx.restore(); };
      corner(x, y, 1, 1); corner(x + w, y, -1, 1); corner(x, y + h, 1, -1); corner(x + w, y + h, -1, -1);
      ctx.strokeStyle = 'rgba(245,143,166,0.5)'; ctx.lineWidth = 3 * u; ctx.strokeRect(x + 36 * u, y + 36 * u, w - 72 * u, h - 72 * u);
    },
    notebook(ctx, x, y, w, h, u) {
      ctx.fillStyle = '#fdf8e8'; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(90,150,220,0.45)'; ctx.lineWidth = 2 * u; for (let ly = y + 60 * u; ly < y + h; ly += 54 * u) { ctx.beginPath(); ctx.moveTo(x, ly); ctx.lineTo(x + w, ly); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(230,80,90,0.7)'; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.moveTo(x + 120 * u, y); ctx.lineTo(x + 120 * u, y + h); ctx.stroke();
      for (let ly = y + 60 * u; ly < y + h - 40 * u; ly += 120 * u) { ctx.fillStyle = '#c9ccd3'; ctx.beginPath(); ctx.arc(x + 44 * u, ly, 16 * u, 0, TAU); ctx.fill(); ctx.strokeStyle = '#8a8f9a'; ctx.lineWidth = 8 * u; ctx.beginPath(); ctx.moveTo(x + 12 * u, ly); ctx.lineTo(x + 100 * u, ly); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,230,90,0.7)'; ctx.fillRect(x + w - 330 * u, y + 40 * u, 250 * u, 30 * u); pencil(ctx, x + w - 360 * u, y + h - 70 * u, 280 * u, -0.08, u); ctx.strokeStyle = '#4a90e2'; ctx.lineWidth = 4 * u; ctx.beginPath(); ctx.moveTo(x + w - 300 * u, y + 120 * u); ctx.quadraticCurveTo(x + w - 260 * u, y + 90 * u, x + w - 220 * u, y + 120 * u); ctx.stroke();
    },
    science(ctx, x, y, w, h, u) {
      ctx.fillStyle = lin(ctx, 0, y, 0, y + h, [[0, '#e8f4ff'], [1, '#cfe7fb']]); ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(40,120,200,0.12)'; for (let gx = x + 30 * u; gx < x + w; gx += 60 * u) for (let gy = y + 30 * u; gy < y + h; gy += 60 * u) { ctx.beginPath(); ctx.arc(gx, gy, 2.5 * u, 0, TAU); ctx.fill(); }
      const atom = (cx, cy, r, col) => { ctx.strokeStyle = col; ctx.lineWidth = 4 * u; for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(i * Math.PI / 3); ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.38, 0, 0, TAU); ctx.stroke(); ctx.restore(); } ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx, cy, r * 0.14, 0, TAU); ctx.fill(); };
      atom(x + 130 * u, y + 120 * u, 90 * u, 'rgba(30,100,200,0.65)'); atom(x + w - 120 * u, y + h - 120 * u, 80 * u, 'rgba(230,110,60,0.65)');
      const flask = (fx, fy, col) => { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.moveTo(fx - 14 * u, fy - 60 * u); ctx.lineTo(fx + 14 * u, fy - 60 * u); ctx.lineTo(fx + 14 * u, fy - 20 * u); ctx.lineTo(fx + 48 * u, fy + 40 * u); ctx.lineTo(fx - 48 * u, fy + 40 * u); ctx.lineTo(fx - 14 * u, fy - 20 * u); ctx.closePath(); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(fx - 28 * u, fy + 8 * u); ctx.lineTo(fx + 28 * u, fy + 8 * u); ctx.lineTo(fx + 48 * u, fy + 40 * u); ctx.lineTo(fx - 48 * u, fy + 40 * u); ctx.fill(); ctx.strokeStyle = 'rgba(30,100,200,0.6)'; ctx.lineWidth = 3 * u; ctx.stroke(); };
      flask(x + w - 140 * u, y + 110 * u, '#5ec8a0'); flask(x + 140 * u, y + h - 90 * u, '#f08aa0');
      ctx.fillStyle = 'rgba(30,100,200,0.5)'; ctx.font = '700 ' + 34 * u + 'px "Georgia",serif'; ctx.textAlign = 'left'; ctx.fillText('E = mc²', x + w * 0.5 - 70 * u, y + 56 * u); ctx.fillText('H₂O', x + 60 * u, y + h * 0.5);
    },
    kids(ctx, x, y, w, h, u) {
      ctx.fillStyle = lin(ctx, 0, y, 0, y + h, [[0, '#7fd3ff'], [0.7, '#cdeeff'], [1, '#e8fbff']]); ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x + w - 130 * u, y + 120 * u, 58 * u, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,216,74,0.7)'; ctx.lineWidth = 6 * u; for (let i = 0; i < 12; i++) { const a = i * TAU / 12; ctx.beginPath(); ctx.moveTo(x + w - 130 * u + Math.cos(a) * 74 * u, y + 120 * u + Math.sin(a) * 74 * u); ctx.lineTo(x + w - 130 * u + Math.cos(a) * 98 * u, y + 120 * u + Math.sin(a) * 98 * u); ctx.stroke(); }
      cloud(ctx, x + 80 * u, y + 110 * u, u * 1.2); cloud(ctx, x + w * 0.45, y + 70 * u, u * 0.9, 0.9);
      ['#ff5a5f', '#ff9f43', '#ffd84a', '#4cd964', '#4aa8ff', '#9b6bff'].forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 12 * u; ctx.beginPath(); ctx.arc(x + 160 * u, y + h - 40 * u, (150 - i * 12) * u, Math.PI, TAU); ctx.stroke(); });
      ctx.fillStyle = '#6fd36f'; ctx.beginPath(); ctx.ellipse(x + w * 0.3, y + h + 40 * u, w * 0.5, 120 * u, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#4fc04f'; ctx.beginPath(); ctx.ellipse(x + w * 0.85, y + h + 50 * u, w * 0.45, 130 * u, 0, 0, TAU); ctx.fill();
      book(ctx, x + w - 250 * u, y + h - 80 * u, 60 * u, 46 * u, '#ff5a5f'); book(ctx, x + w - 184 * u, y + h - 96 * u, 60 * u, 62 * u, '#4aa8ff'); pencil(ctx, x + 40 * u, y + h - 50 * u, 160 * u, -0.5, u);
    },
    geometric(ctx, x, y, w, h, u) {
      ctx.fillStyle = '#fbfbf7'; ctx.fillRect(x, y, w, h);
      const cols = ['#ff7a8a', '#ffd166', '#06d6a0', '#4cc9f0', '#9b72f2'];
      const shapes = [[0.04, 0.08, 'c', 70], [0.95, 0.12, 't', 80], [0.07, 0.9, 't', 90], [0.93, 0.88, 'c', 80], [0.5, 0.04, 's', 50], [0.5, 0.97, 's', 54], [0.02, 0.5, 'q', 50], [0.98, 0.5, 'q', 50], [0.2, 0.05, 'c', 22], [0.8, 0.95, 'c', 24]];
      shapes.forEach(([fx, fy, k, s2], i) => { const cx = x + w * fx, cy = y + h * fy, r = s2 * u; ctx.fillStyle = cols[i % cols.length]; ctx.save(); ctx.translate(cx, cy); ctx.rotate(i); ctx.beginPath(); if (k === 'c') ctx.arc(0, 0, r, 0, TAU); else if (k === 't') { ctx.moveTo(0, -r); ctx.lineTo(r, r * 0.8); ctx.lineTo(-r, r * 0.8); ctx.closePath(); } else if (k === 's') ctx.rect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4); else { ctx.moveTo(-r, 0); for (let q = 0; q < 5; q++) ctx.quadraticCurveTo(-r + q * r * 0.4 + r * 0.2, (q % 2 ? 1 : -1) * r * 0.5, -r + (q + 1) * r * 0.4, 0); ctx.lineWidth = 8 * u; ctx.strokeStyle = cols[i % cols.length]; ctx.stroke(); ctx.restore(); return; } ctx.fill(); ctx.restore(); });
    },
  };
  const ANIM = {};
  const cache = {};
  /** Lapisan statik dilukis sekali pada kanvas luar-skrin (cepat); lapisan animasi dilukis setiap bingkai (vektor, tajam pada sebarang resolusi). */
  W.decor = function (ctx, s, t) {
    const p = s.props || {}, style = DRAW[p.style] ? p.style : 'corporate';
    const w = Math.round(s.w), h = Math.round(s.h), key = style + '|' + w + 'x' + h;
    let c = cache[key];
    if (!c) {
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const u = Math.max(0.5, Math.min(w, h) / 1080);
      DRAW[style](cv.getContext('2d'), 0, 0, w, h, u);
      c = cache[key] = cv;
      const keys = Object.keys(cache); if (keys.length > 14) delete cache[keys[0]];
    }
    ctx.drawImage(c, s.x, s.y, s.w, s.h);
    const fn = ANIM[style];
    if (fn) { const u = Math.max(0.5, Math.min(s.w, s.h) / 1080); ctx.save(); ctx.beginPath(); ctx.rect(s.x, s.y, s.w, s.h); ctx.clip(); fn(ctx, s.x, s.y, s.w, s.h, u, t || 0); ctx.restore(); }
  };
  GS.decor = { styles: STYLES, DRAW, ANIM, h: { lin, rr, flower, leaf, cloud, book, cap, pencil, TAU } };
})();
