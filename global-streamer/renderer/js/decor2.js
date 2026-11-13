/* Global Streamer - lebih banyak latar hiasan bergerak: perubatan (gigi, ortopedi, pembedahan), biologi, elektrik, kejuruteraan, pembinaan, Islamik,
 * pengaturcaraan, kewangan, undang-undang, matematik, bahasa, alam sekitar dan seni. Semua dilukis sebagai vektor dengan animasi mengikut masa. */
(function () {
  'use strict';
  const D = GS.decor, { lin, rr, flower, leaf, cloud, TAU } = D.h;
  const rnd = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
  const reg = (id, label, draw, anim) => { D.styles.push([id, label]); D.DRAW[id] = draw; if (anim) D.ANIM[id] = anim; };
  const glow = (ctx, x, y, r, rgb, a) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); };
  const sparkle = (ctx, x, y, r, a, col) => { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col || '#fff'; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r); ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill(); ctx.restore(); };
  const tooth = (ctx, cx, cy, sz, fill, stroke) => {
    ctx.beginPath(); ctx.moveTo(cx - sz * 0.5, cy - sz * 0.2);
    ctx.bezierCurveTo(cx - sz * 0.5, cy - sz * 0.72, cx - sz * 0.1, cy - sz * 0.72, cx, cy - sz * 0.5); ctx.bezierCurveTo(cx + sz * 0.1, cy - sz * 0.72, cx + sz * 0.5, cy - sz * 0.72, cx + sz * 0.5, cy - sz * 0.2);
    ctx.bezierCurveTo(cx + sz * 0.5, cy + sz * 0.2, cx + sz * 0.3, cy + sz * 0.3, cx + sz * 0.27, cy + sz * 0.75); ctx.bezierCurveTo(cx + sz * 0.22, cy + sz * 0.92, cx + sz * 0.08, cy + sz * 0.86, cx + sz * 0.06, cy + sz * 0.4);
    ctx.quadraticCurveTo(cx, cy + sz * 0.3, cx - sz * 0.06, cy + sz * 0.4); ctx.bezierCurveTo(cx - sz * 0.08, cy + sz * 0.86, cx - sz * 0.22, cy + sz * 0.92, cx - sz * 0.27, cy + sz * 0.75);
    ctx.bezierCurveTo(cx - sz * 0.3, cy + sz * 0.3, cx - sz * 0.5, cy + sz * 0.2, cx - sz * 0.5, cy - sz * 0.2); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = sz * 0.05; ctx.stroke(); }
  };
  const bone = (ctx, x1, y1, x2, y2, th, col) => { const a = Math.atan2(y2 - y1, x2 - x1), len = Math.hypot(x2 - x1, y2 - y1); ctx.save(); ctx.translate(x1, y1); ctx.rotate(a); ctx.fillStyle = col; rr(ctx, 0, -th * 0.28, len, th * 0.56, th * 0.28); ctx.fill(); [[0, -1], [0, 1], [len, -1], [len, 1]].forEach(([bx, sg]) => { ctx.beginPath(); ctx.arc(bx, sg * th * 0.34, th * 0.38, 0, TAU); ctx.fill(); }); ctx.restore(); };
  const gear = (ctx, cx, cy, r, teeth, rot, col, hole) => { ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.fillStyle = col; ctx.beginPath(); for (let i = 0; i < teeth * 2; i++) { const a = (i / (teeth * 2)) * TAU, rr2 = i % 2 ? r * 0.82 : r; const a2 = a + (TAU / (teeth * 2)) * 0.5; ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); ctx.lineTo(Math.cos(a2) * rr2, Math.sin(a2) * rr2); } ctx.closePath(); ctx.fill(); ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(0, 0, r * hole, 0, TAU); ctx.fill(); ctx.restore(); };
  const bolt = (ctx, cx, cy, s2, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(cx + s2 * 0.1, cy - s2); ctx.lineTo(cx - s2 * 0.5, cy + s2 * 0.1); ctx.lineTo(cx - s2 * 0.05, cy + s2 * 0.1); ctx.lineTo(cx - s2 * 0.15, cy + s2); ctx.lineTo(cx + s2 * 0.5, cy - s2 * 0.15); ctx.lineTo(cx + s2 * 0.05, cy - s2 * 0.15); ctx.closePath(); ctx.fill(); };
  const star8 = (ctx, cx, cy, r, rot) => { ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU, rad = i % 2 ? r * 0.62 : r; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); } ctx.closePath(); ctx.restore(); };
  const along = (pts, f) => { let tot = 0; const segs = []; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(l); tot += l; } let d = f * tot; for (let i = 0; i < segs.length; i++) { if (d <= segs[i]) { const k = segs[i] ? d / segs[i] : 0; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]; } d -= segs[i]; } return pts[pts.length - 1]; };

  /* ---------------- PERUBATAN: gigi ---------------- */
  reg('dental', 'Perubatan: doktor gigi', (ctx, x, y, w, h, u) => {
    ctx.fillStyle = lin(ctx, 0, y, 0, y + h, [[0, '#eafcfb'], [1, '#c9f0ee']]); ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(0,170,170,0.13)'; ctx.beginPath(); ctx.arc(x + w, y, 360 * u, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x, y + h, 320 * u, 0, TAU); ctx.fill();
    tooth(ctx, x + 130 * u, y + 130 * u, 150 * u, '#ffffff', '#4fc3c3'); tooth(ctx, x + w - 130 * u, y + h - 130 * u, 160 * u, '#ffffff', '#4fc3c3'); tooth(ctx, x + w - 90 * u, y + 110 * u, 70 * u, 'rgba(255,255,255,0.85)', '#7dd6d6'); tooth(ctx, x + 90 * u, y + h - 100 * u, 80 * u, 'rgba(255,255,255,0.85)', '#7dd6d6');
    ctx.save(); ctx.translate(x + w * 0.5, y + h - 36 * u); ctx.fillStyle = '#4fc3c3'; rr(ctx, -150 * u, -9 * u, 300 * u, 18 * u, 9 * u); ctx.fill(); ctx.fillStyle = '#ffffff'; for (let i = 0; i < 7; i++) rr(ctx, 70 * u + i * 12 * u, -24 * u, 7 * u, 22 * u, 3 * u), ctx.fill(); ctx.restore();
  }, (ctx, x, y, w, h, u, t) => {
    [[130, 90], [w / u - 130, h / u - 190], [w / u - 90, 80], [90, h / u - 140]].forEach(([px, py], i) => sparkle(ctx, x + px * u + 40 * u, y + py * u, (14 + (i % 2) * 8) * u, 0.4 + 0.6 * Math.abs(Math.sin(t * 0.003 + i * 1.7)), '#ffffff'));
    for (let i = 0; i < 14; i++) { const bx = x + rnd(i, 1) * w, by = y + h - ((t * (0.03 + rnd(i, 2) * 0.04) + rnd(i, 3) * h) % h), r = (6 + rnd(i, 4) * 14) * u; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.fillStyle = 'rgba(120,220,230,0.18)'; ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.arc(bx + Math.sin(t * 0.002 + i) * 14 * u, by, r, 0, TAU); ctx.fill(); ctx.stroke(); }
  });
  /* ---------------- PERUBATAN: ortopedi ---------------- */
  reg('ortho', 'Perubatan: ortopedi (X-ray)', (ctx, x, y, w, h, u) => {
    ctx.fillStyle = lin(ctx, 0, y, 0, y + h, [[0, '#0a2540'], [1, '#12395e']]); ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(140,200,255,0.1)'; ctx.lineWidth = 1; for (let gx = x; gx < x + w; gx += 48 * u) { ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke(); } for (let gy = y; gy < y + h; gy += 48 * u) { ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke(); }
    const bc = 'rgba(214,236,255,0.55)';
    bone(ctx, x + 30 * u, y + 40 * u, x + 260 * u, y + 330 * u, 70 * u, bc); bone(ctx, x + 250 * u, y + 330 * u, x + 200 * u, y + 560 * u, 56 * u, bc);
    bone(ctx, x + w - 30 * u, y + h - 40 * u, x + w - 260 * u, y + h - 330 * u, 70 * u, bc); bone(ctx, x + w - 250 * u, y + h - 330 * u, x + w - 200 * u, y + h - 560 * u, 56 * u, bc);
    for (let i = 0; i < 9; i++) { ctx.fillStyle = 'rgba(214,236,255,' + (0.5 - i * 0.03) + ')'; rr(ctx, x + w - 90 * u - Math.sin(i * 0.35) * 24 * u, y + 40 * u + i * 52 * u, 66 * u, 40 * u, 14 * u); ctx.fill(); }
    ctx.strokeStyle = 'rgba(120,200,255,0.5)'; ctx.lineWidth = 2 * u; ctx.strokeRect(x + 16 * u, y + 16 * u, w - 32 * u, h - 32 * u);
  }, (ctx, x, y, w, h, u, t) => {
    const sy = y + ((t * 0.12) % (h + 200)) - 100;
    const g = ctx.createLinearGradient(0, sy - 90 * u, 0, sy + 10 * u); g.addColorStop(0, 'rgba(90,200,255,0)'); g.addColorStop(1, 'rgba(90,200,255,0.32)'); ctx.fillStyle = g; ctx.fillRect(x, sy - 90 * u, w, 100 * u);
    ctx.fillStyle = 'rgba(160,230,255,0.9)'; ctx.fillRect(x, sy + 8 * u, w, 3 * u);
  });
  /* ---------------- PERUBATAN: pembedahan / hospital ---------------- */
  reg('surgery', 'Perubatan: pembedahan / hospital', (ctx, x, y, w, h, u) => {
    ctx.fillStyle = lin(ctx, 0, y, 0, y + h, [[0, '#eef9f6'], [1, '#d3eee6']]); ctx.fillRect(x, y, w, h);
    const cross = (cx, cy, s2, col) => { ctx.fillStyle = col; rr(ctx, cx - s2 * 0.18, cy - s2 * 0.5, s2 * 0.36, s2, s2 * 0.08); ctx.fill(); rr(ctx, cx - s2 * 0.5, cy - s2 * 0.18, s2, s2 * 0.36, s2 * 0.08); ctx.fill(); };
    cross(x + 120 * u, y + 120 * u, 130 * u, 'rgba(30,160,130,0.28)'); cross(x + w - 110 * u, y + h - 150 * u, 90 * u, 'rgba(230,70,80,0.3)'); cross(x + w - 100 * u, y + 110 * u, 50 * u, 'rgba(30,160,130,0.22)');
    ctx.strokeStyle = 'rgba(30,120,110,0.5)'; ctx.lineWidth = 9 * u; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 40 * u, y + h * 0.45); ctx.bezierCurveTo(x + 40 * u, y + h * 0.82, x + 220 * u, y + h * 0.82, x + 220 * u, y + h * 0.5); ctx.stroke(); ctx.beginPath(); ctx.arc(x + 130 * u, y + h * 0.8, 20 * u, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(30,160,130,0.25)'; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.moveTo(x, y + h - 80 * u); ctx.lineTo(x + w, y + h - 80 * u); ctx.stroke();
  }, (ctx, x, y, w, h, u, t) => {
    const base = y + h - 80 * u, ph = (t * 0.00035) % 1, px = x + ph * w;
    ctx.strokeStyle = '#e63950'; ctx.lineWidth = 4 * u; ctx.lineJoin = 'round'; ctx.beginPath(); for (let sx = Math.max(x, px - 520 * u); sx <= px; sx += 4 * u) { const d = ((sx - x) / (150 * u)) % 1; let dy = 0; if (d > 0.4 && d < 0.46) dy = -30 * u; else if (d >= 0.46 && d < 0.52) dy = 90 * u * (d - 0.46) * 16 - 30 * u; else if (d >= 0.52 && d < 0.58) dy = 60 * u - (d - 0.52) * 16 * 70 * u; else if (d > 0.7 && d < 0.8) dy = -14 * u * Math.sin((d - 0.7) * 31.4); const a = 1 - (px - sx) / (520 * u); ctx.globalAlpha = Math.max(0, a); sx === Math.max(x, px - 520 * u) ? ctx.moveTo(sx, base + dy) : ctx.lineTo(sx, base + dy); } ctx.stroke(); ctx.globalAlpha = 1;
    const k = 1 + 0.18 * Math.max(0, Math.sin(t * 0.008)); ctx.save(); ctx.translate(x + w - 100 * u, y + h * 0.5); ctx.scale(k, k); ctx.fillStyle = '#e63950'; ctx.beginPath(); ctx.moveTo(0, 22 * u); ctx.bezierCurveTo(-46 * u, -10 * u, -22 * u, -44 * u, 0, -20 * u); ctx.bezierCurveTo(22 * u, -44 * u, 46 * u, -10 * u, 0, 22 * u); ctx.fill(); ctx.restore();
  });
  /* ---------------- BIOLOGI / DNA ---------------- */
  reg('dna', 'Biologi / DNA', (ctx, x, y, w, h, u) => { ctx.fillStyle = lin(ctx, 0, y, w, y + h, [[0, '#062f3a'], [1, '#0b4b52']]); ctx.fillRect(x, y, w, h); ctx.fillStyle = 'rgba(120,230,220,0.14)'; for (let i = 0; i < 60; i++) { ctx.beginPath(); ctx.arc(x + rnd(i, 1) * w, y + rnd(i, 2) * h, (2 + rnd(i, 3) * 5) * u, 0, TAU); ctx.fill(); } },
  (ctx, x, y, w, h, u, t) => {
    [[x + 60 * u, 1], [x + w - 60 * u, -1]].forEach(([cx, dir]) => { for (let yy = y; yy < y + h; yy += 22 * u) { const ph = yy * 0.012 * dir + t * 0.002, dx = Math.sin(ph) * 36 * u, dz = Math.cos(ph); ctx.strokeStyle = 'rgba(160,240,230,0.35)'; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.moveTo(cx - dx, yy); ctx.lineTo(cx + dx, yy); ctx.stroke(); ctx.fillStyle = dz > 0 ? '#5eead4' : '#2fa8a0'; ctx.beginPath(); ctx.arc(cx - dx, yy, 8 * u, 0, TAU); ctx.fill(); ctx.fillStyle = dz > 0 ? '#fda4af' : '#c75c70'; ctx.beginPath(); ctx.arc(cx + dx, yy, 8 * u, 0, TAU); ctx.fill(); } });
  });
  /* ---------------- ELEKTRIK ---------------- */
  const tracesFor = (w, h, u) => { const T = []; for (let i = 0; i < 16; i++) { const left = i % 2 === 0, ys = 40 + rnd(i, 1) * (h / u - 80), len = 160 + rnd(i, 2) * 260, x0 = left ? 0 : w / u, dir = left ? 1 : -1; const p = [[x0, ys], [x0 + dir * len * 0.5, ys], [x0 + dir * len * 0.5, ys + (rnd(i, 3) > 0.5 ? 1 : -1) * 70], [x0 + dir * len, ys + (rnd(i, 3) > 0.5 ? 1 : -1) * 70]]; T.push(p.map(([px, py]) => [px * u, py * u])); } return T; };
  reg('electrical', 'Elektrik', (ctx, x, y, w, h, u) => {
    ctx.fillStyle = lin(ctx, 0, y, 0, y + h, [[0, '#0b1424'], [1, '#101d38']]); ctx.fillRect(x, y, w, h);
    tracesFor(w, h, u).forEach((p) => { ctx.strokeStyle = 'rgba(70,170,255,0.4)'; ctx.lineWidth = 3 * u; ctx.beginPath(); p.forEach(([px, py], i) => (i ? ctx.lineTo(x + px, y + py) : ctx.moveTo(x + px, y + py))); ctx.stroke(); const e = p[p.length - 1]; ctx.fillStyle = 'rgba(70,170,255,0.7)'; ctx.beginPath(); ctx.arc(x + e[0], y + e[1], 7 * u, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(70,170,255,0.5)'; ctx.stroke(); });
    bolt(ctx, x + 90 * u, y + 90 * u, 60 * u, '#ffd23f'); bolt(ctx, x + w - 90 * u, y + h - 90 * u, 60 * u, '#ffd23f');
  }, (ctx, x, y, w, h, u, t) => {
    tracesFor(w, h, u).forEach((p, i) => { const f = ((t * 0.00025 * (0.6 + rnd(i, 5)) + rnd(i, 6)) % 1), [px, py] = along(p, f); glow(ctx, x + px, y + py, 40 * u, '255,220,90', 0.9); ctx.fillStyle = '#fff6c4'; ctx.beginPath(); ctx.arc(x + px, y + py, 5 * u, 0, TAU); ctx.fill(); });
    const fl = Math.abs(Math.sin(t * 0.004)) > 0.92 ? 1 : 0.35; glow(ctx, x + 90 * u, y + 90 * u, 130 * u, '255,210,63', 0.35 * fl); glow(ctx, x + w - 90 * u, y + h - 90 * u, 130 * u, '255,210,63', 0.35 * fl);
  });
  /* ---------------- KEJURUTERAAN (blueprint) ---------------- */
  reg('engineering', 'Kejuruteraan (blueprint)', (ctx, x, y, w, h, u) => {
    ctx.fillStyle = lin(ctx, 0, y, 0, y + h, [[0, '#0d3b8f'], [1, '#0a2d6e']]); ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1; for (let gx = x; gx < x + w; gx += 40 * u) { ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke(); } for (let gy = y; gy < y + h; gy += 40 * u) { ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2 * u; ctx.strokeRect(x + 20 * u, y + 20 * u, w - 40 * u, h - 40 * u); ctx.beginPath(); ctx.arc(x + 120 * u, y + h - 130 * u, 70 * u, 0, TAU); ctx.moveTo(x + 50 * u, y + h - 130 * u); ctx.lineTo(x + 190 * u, y + h - 130 * u); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '600 ' + 20 * u + 'px "Consolas",monospace'; ctx.fillText('SCALE 1:100   DWG-001', x + w - 330 * u, y + h - 36 * u);
  }, (ctx, x, y, w, h, u, t) => {
    gear(ctx, x + 110 * u, y + 110 * u, 78 * u, 14, t * 0.0008, 'rgba(255,255,255,0.75)', 0.35); gear(ctx, x + 232 * u, y + 188 * u, 50 * u, 10, -t * 0.0008 * 1.4 + 0.2, 'rgba(255,255,255,0.55)', 0.3);
    gear(ctx, x + w - 120 * u, y + h - 120 * u, 84 * u, 16, -t * 0.0007, 'rgba(255,255,255,0.7)', 0.35); gear(ctx, x + w - 240 * u, y + h - 200 * u, 48 * u, 9, t * 0.0007 * 1.7, 'rgba(255,200,60,0.75)', 0.3);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2 * u; ctx.setLineDash([14 * u, 10 * u]); ctx.lineDashOffset = -t * 0.04; ctx.strokeRect(x + 34 * u, y + 34 * u, w - 68 * u, h - 68 * u); ctx.setLineDash([]);
  });
  /* ---------------- PEMBINAAN ---------------- */
  reg('construction', 'Pembinaan', (ctx, x, y, w, h, u) => {
    ctx.fillStyle = lin(ctx, 0, y, 0, y + h, [[0, '#bfe6ff'], [0.75, '#fff0c4'], [1, '#ffe08a']]); ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#5a6b78'; [[0.06, 220, 70], [0.14, 300, 90], [0.8, 260, 80], [0.9, 340, 90], [0.7, 180, 70]].forEach(([fx, bh, bw]) => { ctx.fillRect(x + w * fx, y + h - bh * u, bw * u, bh * u); ctx.fillStyle = 'rgba(255,230,140,0.55)'; for (let wy = 0; wy < bh - 30; wy += 36) for (let wx = 10; wx < bw - 10; wx += 26) ctx.fillRect(x + w * fx + wx * u, y + h - bh * u + (wy + 14) * u, 12 * u, 18 * u); ctx.fillStyle = '#5a6b78'; });
    ctx.fillStyle = '#f2b705'; ctx.fillRect(x, y + h - 26 * u, w, 26 * u); ctx.fillStyle = '#222'; for (let sx = x - 40 * u; sx < x + w; sx += 60 * u) { ctx.beginPath(); ctx.moveTo(sx, y + h); ctx.lineTo(sx + 30 * u, y + h); ctx.lineTo(sx + 56 * u, y + h - 26 * u); ctx.lineTo(sx + 26 * u, y + h - 26 * u); ctx.fill(); }
    ctx.fillStyle = '#f2b705'; ctx.fillRect(x + w - 70 * u, y + 20 * u, 22 * u, h - 170 * u); ctx.strokeStyle = '#d99a00'; ctx.lineWidth = 3 * u; for (let cy = y + 40 * u; cy < y + h - 190 * u; cy += 46 * u) { ctx.beginPath(); ctx.moveTo(x + w - 70 * u, cy); ctx.lineTo(x + w - 48 * u, cy + 46 * u); ctx.stroke(); }
  }, (ctx, x, y, w, h, u, t) => {
    const jy = y + 30 * u, jx0 = x + w - 480 * u, jx1 = x + w - 38 * u; ctx.fillStyle = '#f2b705'; ctx.fillRect(jx0, jy, jx1 - jx0, 16 * u); ctx.fillStyle = '#444'; ctx.fillRect(jx1 - 10 * u, jy - 4 * u, 50 * u, 38 * u);
    const sw = Math.sin(t * 0.0018) * 26 * u, hx = jx0 + 70 * u + sw; ctx.strokeStyle = '#333'; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.moveTo(jx0 + 70 * u, jy + 16 * u); ctx.lineTo(hx, jy + 190 * u); ctx.stroke(); ctx.fillStyle = '#d63a3a'; ctx.fillRect(hx - 24 * u, jy + 190 * u, 48 * u, 34 * u);
    for (let i = 0; i < 4; i++) cloud(ctx, x + ((rnd(i, 1) * w + t * (0.01 + i * 0.004)) % (w + 400 * u)) - 200 * u, y + (80 + i * 70) * u, u * (0.7 + i * 0.1), 0.75);
  });
  /* ---------------- ISLAMIK ---------------- */
  reg('islamic', 'Islamik', (ctx, x, y, w, h, u) => {
    ctx.fillStyle = lin(ctx, 0, y, 0, y + h, [[0, '#0d4a38'], [1, '#05261d']]); ctx.fillRect(x, y, w, h);
    const sp = 120 * u; ctx.strokeStyle = 'rgba(216,178,90,0.28)'; ctx.lineWidth = 2 * u; for (let gy = y + sp / 2; gy < y + h + sp; gy += sp) for (let gx = x + sp / 2; gx < x + w + sp; gx += sp) { star8(ctx, gx, gy, sp * 0.46, 0); ctx.stroke(); star8(ctx, gx, gy, sp * 0.28, Math.PI / 16); ctx.stroke(); }
    ctx.strokeStyle = '#d8b25a'; ctx.lineWidth = 6 * u; ctx.strokeRect(x + 18 * u, y + 18 * u, w - 36 * u, h - 36 * u); ctx.lineWidth = 2 * u; ctx.strokeRect(x + 32 * u, y + 32 * u, w - 64 * u, h - 64 * u);
    ctx.fillStyle = 'rgba(2,20,15,0.92)'; const by = y + h - 40 * u; ctx.beginPath(); ctx.moveTo(x + 30 * u, by); ctx.lineTo(x + 30 * u, by - 70 * u); ctx.lineTo(x + w * 0.42, by - 70 * u); ctx.arc(x + w * 0.5, by - 70 * u, w * 0.08, Math.PI, 0); ctx.lineTo(x + w * 0.58, by - 70 * u); ctx.lineTo(x + w - 30 * u, by - 70 * u); ctx.lineTo(x + w - 30 * u, by); ctx.closePath(); ctx.fill();
    [x + 80 * u, x + w - 80 * u].forEach((mx) => { ctx.fillRect(mx - 12 * u, by - 260 * u, 24 * u, 200 * u); ctx.beginPath(); ctx.moveTo(mx - 16 * u, by - 260 * u); ctx.lineTo(mx, by - 310 * u); ctx.lineTo(mx + 16 * u, by - 260 * u); ctx.fill(); });
    ctx.fillStyle = '#d8b25a'; ctx.beginPath(); ctx.arc(x + w * 0.5, y + 96 * u, 34 * u, 0, TAU); ctx.fill(); ctx.fillStyle = '#0d4a38'; ctx.beginPath(); ctx.arc(x + w * 0.5 + 12 * u, y + 90 * u, 30 * u, 0, TAU); ctx.fill(); sparkle(ctx, x + w * 0.5 + 38 * u, y + 84 * u, 14 * u, 1, '#d8b25a');
  }, (ctx, x, y, w, h, u, t) => {
    const sp = 120 * u; for (let gy = 0; gy < 8; gy++) for (let gx = 0; gx < 16; gx++) { const k = rnd(gx + gy * 17, 9); if (k < 0.78) continue; const a = 0.5 + 0.5 * Math.sin(t * 0.0016 + k * 40); const cx = x + sp / 2 + gx * sp, cy = y + sp / 2 + gy * sp; if (cx > x + w || cy > y + h) continue; ctx.save(); ctx.globalAlpha = a * 0.7; ctx.strokeStyle = '#ffe9a8'; ctx.lineWidth = 3 * u; star8(ctx, cx, cy, sp * 0.46, 0); ctx.stroke(); ctx.restore(); }
    for (let i = 0; i < 22; i++) sparkle(ctx, x + rnd(i, 1) * w, y + rnd(i, 2) * h * 0.6, (4 + rnd(i, 3) * 6) * u, 0.3 + 0.7 * Math.abs(Math.sin(t * 0.002 + i * 2)), '#ffe9a8');
  });
  /* ---------------- SAINS KOMPUTER / PENGATURCARAAN ---------------- */
  const CODE = ['const app = createApp();', 'function sum(a, b) { return a + b; }', 'for (let i = 0; i < n; i++) {', '  if (x % 2 === 0) print(i);', '}', 'class User { name; age; }', 'SELECT * FROM students;', 'git commit -m "update"', 'import numpy as np', 'while (true) { run(); }', 'def hello(): print("Hi")', '<div class="box"></div>'];
  reg('coding', 'Sains komputer / coding', (ctx, x, y, w, h, u) => {
    ctx.fillStyle = '#0d1117'; ctx.fillRect(x, y, w, h);
    ctx.font = '500 ' + 20 * u + 'px "Consolas","Courier New",monospace'; ctx.textAlign = 'left';
    const colors = ['#79c0ff', '#ff7b72', '#7ee787', '#d2a8ff', '#ffa657'];
    for (let r = 0; r < 12; r++) { const ty = y + 60 * u + r * 30 * u; if (ty > y + h - 30 * u) break; ctx.fillStyle = 'rgba(139,148,158,0.3)'; ctx.fillText(String(r + 1), x + 24 * u, ty); ctx.fillStyle = colors[r % colors.length] + '66'; ctx.fillText(CODE[r % CODE.length], x + 64 * u, ty); const t2 = CODE[(r + 5) % CODE.length]; ctx.fillStyle = colors[(r + 2) % colors.length] + '55'; ctx.textAlign = 'right'; ctx.fillText(t2, x + w - 24 * u, y + h - 40 * u - r * 30 * u); ctx.textAlign = 'left'; }
    ctx.fillStyle = '#ff5f56'; ctx.beginPath(); ctx.arc(x + 30 * u, y + 24 * u, 7 * u, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffbd2e'; ctx.beginPath(); ctx.arc(x + 54 * u, y + 24 * u, 7 * u, 0, TAU); ctx.fill(); ctx.fillStyle = '#27c93f'; ctx.beginPath(); ctx.arc(x + 78 * u, y + 24 * u, 7 * u, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(88,166,255,0.12)'; ctx.font = '800 ' + 190 * u + 'px "Consolas",monospace'; ctx.textAlign = 'center'; ctx.fillText('</>', x + w * 0.5, y + h * 0.5 + 60 * u);
  }, (ctx, x, y, w, h, u, t) => {
    ctx.font = '700 ' + 20 * u + 'px "Consolas",monospace'; ctx.textAlign = 'center'; const chars = '01{}<>/;=+$#@ABCDEF';
    for (let c = 0; c < 28; c++) { const cx = c < 14 ? x + 14 * u + c * 22 * u : x + w - 14 * u - (c - 14) * 22 * u; if (c % 14 > 6) continue; const sp = 0.06 + rnd(c, 1) * 0.1, hy = ((t * sp + rnd(c, 2) * h) % (h + 300 * u)) - 150 * u; for (let k = 0; k < 10; k++) { const yy = y + hy - k * 24 * u; if (yy < y || yy > y + h) continue; ctx.fillStyle = k === 0 ? '#c9ffd1' : 'rgba(60,220,110,' + (0.8 - k * 0.08) + ')'; ctx.fillText(chars[Math.floor(rnd(c * 31 + k, Math.floor(t / 180)) * chars.length)], cx, yy); } }
    if (Math.floor(t / 500) % 2) { ctx.fillStyle = '#58a6ff'; ctx.fillRect(x + 64 * u, y + h - 70 * u, 14 * u, 4 * u); }
  });
  /* ---------------- KEWANGAN / PERNIAGAAN ---------------- */
  reg('finance', 'Kewangan / perniagaan', (ctx, x, y, w, h, u) => {
    ctx.fillStyle = lin(ctx, 0, y, 0, y + h, [[0, '#f4faf6'], [1, '#dfeee6']]); ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(30,120,80,0.1)'; ctx.lineWidth = 1; for (let gy = y + 60 * u; gy < y + h; gy += 60 * u) { ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke(); }
    [0.4, 0.6, 0.5, 0.75, 0.9].forEach((k, i) => { ctx.fillStyle = 'rgba(30,150,100,0.35)'; ctx.fillRect(x + 50 * u + i * 36 * u, y + h - 40 * u - k * 200 * u, 24 * u, k * 200 * u); ctx.fillRect(x + w - 240 * u + i * 36 * u, y + 40 * u, 24 * u, [0.5, 0.8, 0.6, 0.95, 0.7][i] * 180 * u); });
    ctx.fillStyle = '#f2b705'; ctx.beginPath(); ctx.arc(x + w - 100 * u, y + h - 100 * u, 44 * u, 0, TAU); ctx.fill(); ctx.fillStyle = '#c99400'; ctx.font = '900 ' + 44 * u + 'px "Segoe UI",sans-serif'; ctx.textAlign = 'center'; ctx.fillText('$', x + w - 100 * u, y + h - 84 * u);
  }, (ctx, x, y, w, h, u, t) => {
    const pts = []; for (let i = 0; i <= 14; i++) pts.push([x + w * 0.1 + i * (w * 0.8 / 14), y + h - 90 * u - (Math.sin(i * 0.7 + 1) * 0.5 + 0.5 + i * 0.05) * 90 * u]);
    const prog = ((t * 0.0003) % 1.3); const n = Math.min(pts.length, Math.floor(prog * pts.length) + 1);
    ctx.strokeStyle = '#17a673'; ctx.lineWidth = 6 * u; ctx.lineJoin = 'round'; ctx.beginPath(); pts.slice(0, n).forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.stroke(); const e = pts[n - 1]; ctx.fillStyle = '#17a673'; ctx.beginPath(); ctx.arc(e[0], e[1], 9 * u, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(x + w - 100 * u, y + h - 100 * u + Math.sin(t * 0.004) * 6 * u); ctx.scale(Math.abs(Math.cos(t * 0.003)) * 0.6 + 0.4, 1); ctx.strokeStyle = '#c99400'; ctx.lineWidth = 4 * u; ctx.beginPath(); ctx.arc(0, 0, 44 * u, 0, TAU); ctx.stroke(); ctx.restore();
  });
  /* ---------------- UNDANG-UNDANG ---------------- */
  reg('law', 'Undang-undang', (ctx, x, y, w, h, u) => {
    ctx.fillStyle = lin(ctx, 0, y, 0, y + h, [[0, '#f8f2e6'], [1, '#eadfc8']]); ctx.fillRect(x, y, w, h);
    [x + 36 * u, x + w - 96 * u].forEach((px) => { ctx.fillStyle = lin(ctx, px, 0, px + 60 * u, 0, [[0, '#d9cdb2'], [0.5, '#fffaf0'], [1, '#cdbf9f']]); ctx.fillRect(px, y + 80 * u, 60 * u, h - 170 * u); ctx.fillStyle = '#b8a47a'; ctx.fillRect(px - 8 * u, y + 66 * u, 76 * u, 14 * u); ctx.fillRect(px - 8 * u, y + h - 90 * u, 76 * u, 14 * u); });
    ctx.strokeStyle = '#1d3557'; ctx.lineWidth = 5 * u; ctx.strokeRect(x + 20 * u, y + 20 * u, w - 40 * u, h - 40 * u);
    ctx.fillStyle = '#1d3557'; ctx.save(); ctx.translate(x + w - 220 * u, y + h - 60 * u); ctx.rotate(-0.4); rr(ctx, -70 * u, -22 * u, 100 * u, 44 * u, 8 * u); ctx.fill(); ctx.fillRect(20 * u, -6 * u, 130 * u, 12 * u); ctx.restore();
  }, (ctx, x, y, w, h, u, t) => {
    const cx = x + w / 2, top = y + 56 * u, tilt = Math.sin(t * 0.0015) * 0.12; ctx.save(); ctx.translate(cx, top + 40 * u); ctx.strokeStyle = '#1d3557'; ctx.fillStyle = '#1d3557'; ctx.lineWidth = 6 * u; ctx.beginPath(); ctx.moveTo(0, -40 * u); ctx.lineTo(0, 150 * u); ctx.stroke(); ctx.fillRect(-50 * u, 150 * u, 100 * u, 12 * u); ctx.rotate(tilt); ctx.beginPath(); ctx.moveTo(-130 * u, 0); ctx.lineTo(130 * u, 0); ctx.stroke();
    [-130, 130].forEach((px) => { ctx.save(); ctx.translate(px * u, 0); ctx.rotate(-tilt); ctx.lineWidth = 2.5 * u; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-34 * u, 70 * u); ctx.moveTo(0, 0); ctx.lineTo(34 * u, 70 * u); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, 74 * u, 44 * u, 12 * u, 0, 0, Math.PI); ctx.fill(); ctx.restore(); }); ctx.restore();
  });
  /* ---------------- MATEMATIK ---------------- */
  reg('math', 'Matematik', (ctx, x, y, w, h, u) => {
    ctx.fillStyle = '#fbfdff'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = 'rgba(70,130,220,0.16)'; ctx.lineWidth = 1; for (let gx = x; gx < x + w; gx += 30 * u) { ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke(); } for (let gy = y; gy < y + h; gy += 30 * u) { ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(30,80,170,0.55)'; ctx.lineWidth = 2.5 * u; ctx.beginPath(); ctx.moveTo(x + 30 * u, y + h * 0.5); ctx.lineTo(x + w - 30 * u, y + h * 0.5); ctx.moveTo(x + w / 2, y + 30 * u); ctx.lineTo(x + w / 2, y + h - 30 * u); ctx.stroke();
    ctx.fillStyle = 'rgba(30,80,170,0.45)'; ctx.font = '700 ' + 40 * u + 'px "Georgia",serif'; ctx.textAlign = 'left'; ctx.fillText('a² + b² = c²', x + 50 * u, y + 80 * u); ctx.fillText('∫ f(x) dx', x + w - 300 * u, y + 80 * u); ctx.fillText('π ≈ 3.14159', x + 50 * u, y + h - 50 * u); ctx.fillText('Σ n = n(n+1)/2', x + w - 420 * u, y + h - 50 * u);
  }, (ctx, x, y, w, h, u, t) => {
    ctx.strokeStyle = '#e63950'; ctx.lineWidth = 4 * u; ctx.beginPath(); for (let i = 0; i <= 160; i++) { const px = x + 30 * u + (i / 160) * (w - 60 * u), py = y + h * 0.5 - Math.sin(i * 0.12 - t * 0.003) * 60 * u; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke();
    ['π', '∑', '√', '∞', '÷', '×'].forEach((sym, i) => { ctx.fillStyle = 'rgba(30,80,170,0.4)'; ctx.font = '700 ' + (46 + i * 6) * u + 'px "Georgia",serif'; ctx.textAlign = 'center'; ctx.fillText(sym, x + ((rnd(i, 1) * w + t * 0.02) % w), y + h * 0.2 + Math.sin(t * 0.0015 + i) * 30 * u + (i % 2) * h * 0.55); });
  });
  /* ---------------- BAHASA ---------------- */
  reg('language', 'Bahasa', (ctx, x, y, w, h, u) => {
    ctx.fillStyle = lin(ctx, 0, y, w, y + h, [[0, '#fff3d6'], [1, '#ffd9e4']]); ctx.fillRect(x, y, w, h);
    const bub = (bx, by, bw, txt, col) => { ctx.fillStyle = col; rr(ctx, bx, by, bw, 64 * u, 26 * u); ctx.fill(); ctx.beginPath(); ctx.moveTo(bx + 28 * u, by + 62 * u); ctx.lineTo(bx + 18 * u, by + 90 * u); ctx.lineTo(bx + 56 * u, by + 62 * u); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '800 ' + 30 * u + 'px "Segoe UI",sans-serif'; ctx.textAlign = 'center'; ctx.fillText(txt, bx + bw / 2, by + 42 * u); };
    bub(x + 40 * u, y + 40 * u, 170 * u, 'Hello!', '#ff7a8a'); bub(x + w - 230 * u, y + 40 * u, 190 * u, 'Selamat!', '#4cc9f0'); bub(x + 40 * u, y + h - 140 * u, 160 * u, '你好', '#06d6a0'); bub(x + w - 230 * u, y + h - 140 * u, 190 * u, 'مرحبا', '#9b72f2');
  }, (ctx, x, y, w, h, u, t) => { const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; for (let i = 0; i < 16; i++) { const py = y + h - ((t * (0.02 + rnd(i, 2) * 0.03) + rnd(i, 3) * h) % (h + 100 * u)) + 40 * u; ctx.save(); ctx.translate(x + rnd(i, 1) * w + Math.sin(t * 0.001 + i) * 20 * u, py); ctx.rotate(Math.sin(t * 0.001 + i) * 0.4); ctx.fillStyle = ['#ff7a8a', '#ffb703', '#06d6a0', '#4cc9f0', '#9b72f2'][i % 5] + 'cc'; ctx.font = '900 ' + (36 + rnd(i, 4) * 36) * u + 'px "Segoe UI",sans-serif'; ctx.textAlign = 'center'; ctx.fillText(L[Math.floor(rnd(i, 5) * 26)], 0, 0); ctx.restore(); } });
  /* ---------------- ALAM SEKITAR ---------------- */
  reg('eco', 'Alam sekitar', (ctx, x, y, w, h, u) => {
    ctx.fillStyle = lin(ctx, 0, y, 0, y + h, [[0, '#dff6ff'], [0.6, '#e6f8d8'], [1, '#bfe8a8']]); ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x + 130 * u, y + 110 * u, 54 * u, 0, TAU); ctx.fill();
    ctx.fillStyle = '#7ccf6a'; ctx.beginPath(); ctx.ellipse(x + w * 0.25, y + h + 50 * u, w * 0.5, 150 * u, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#5fbe55'; ctx.beginPath(); ctx.ellipse(x + w * 0.8, y + h + 60 * u, w * 0.45, 160 * u, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f5f5f5'; ctx.beginPath(); ctx.moveTo(x + w - 150 * u, y + h - 80 * u); ctx.lineTo(x + w - 138 * u, y + h - 360 * u); ctx.lineTo(x + w - 126 * u, y + h - 80 * u); ctx.fill();
    [[70, 220], [200, 180]].forEach(([tx, ty]) => { ctx.fillStyle = '#7a5230'; ctx.fillRect(x + tx * u, y + h - ty * u + 70 * u, 16 * u, 90 * u); ctx.fillStyle = '#3fae5a'; ctx.beginPath(); ctx.arc(x + tx * u + 8 * u, y + h - ty * u + 50 * u, 58 * u, 0, TAU); ctx.fill(); });
  }, (ctx, x, y, w, h, u, t) => {
    const cx = x + w - 138 * u, cy = y + h - 360 * u; ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.0022); ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#c8d0d6'; ctx.lineWidth = 2 * u; for (let i = 0; i < 3; i++) { ctx.rotate(TAU / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(10 * u, -130 * u); ctx.lineTo(-10 * u, -130 * u); ctx.closePath(); ctx.fill(); ctx.stroke(); } ctx.restore(); ctx.fillStyle = '#9aa7b0'; ctx.beginPath(); ctx.arc(cx, cy, 9 * u, 0, TAU); ctx.fill();
    for (let i = 0; i < 12; i++) leaf(ctx, x + ((rnd(i, 1) * w + t * 0.03) % w), y + ((t * 0.04 + rnd(i, 2) * h) % h), 26 * u, t * 0.002 + i, i % 2 ? '#4caf50' : '#8bc34a');
  });
  /* ---------------- SENI & REKA BENTUK ---------------- */
  reg('art', 'Seni & reka bentuk', (ctx, x, y, w, h, u) => {
    ctx.fillStyle = '#fffaf3'; ctx.fillRect(x, y, w, h);
    [[0, 0, '#ff7a8a', 220], [w, 0, '#4cc9f0', 200], [0, h, '#ffd166', 190], [w, h, '#9b72f2', 230]].forEach(([bx, by, c, r]) => { ctx.fillStyle = c + 'aa'; ctx.beginPath(); for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU, rad = (r + Math.sin(i * 2.3) * 40) * u; ctx.lineTo(x + bx + Math.cos(a) * rad, y + by + Math.sin(a) * rad); } ctx.closePath(); ctx.fill(); });
    ctx.fillStyle = '#d9a066'; ctx.beginPath(); ctx.ellipse(x + 130 * u, y + h - 120 * u, 90 * u, 64 * u, -0.3, 0, TAU); ctx.fill(); ['#e63950', '#f2b705', '#2ea8ff', '#06d6a0'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + (80 + i * 34) * u, y + h - (150 - (i % 2) * 30) * u, 12 * u, 0, TAU); ctx.fill(); });
  }, (ctx, x, y, w, h, u, t) => { for (let i = 0; i < 9; i++) { const cx = x + rnd(i, 1) * w + Math.sin(t * 0.0009 + i) * 40 * u, cy = y + rnd(i, 2) * h + Math.cos(t * 0.0011 + i * 2) * 40 * u; ctx.fillStyle = ['#ff7a8a', '#4cc9f0', '#ffd166', '#9b72f2', '#06d6a0'][i % 5] + '55'; ctx.beginPath(); ctx.arc(cx, cy, (20 + rnd(i, 3) * 40) * u, 0, TAU); ctx.fill(); } });

  /* ---------------- animasi untuk gaya sedia ada ---------------- */
  D.ANIM.school = (ctx, x, y, w, h, u, t) => { for (let i = 0; i < 30; i++) { const px = x + rnd(i, 1) * w + Math.sin(t * 0.0006 + i) * 18 * u, py = y + ((rnd(i, 2) * h + t * (0.008 + rnd(i, 3) * 0.012)) % h); ctx.fillStyle = 'rgba(255,255,255,' + (0.18 + 0.2 * rnd(i, 4)) + ')'; ctx.beginPath(); ctx.arc(px, py, (1.5 + rnd(i, 5) * 3) * u, 0, TAU); ctx.fill(); } };
  D.ANIM.library = (ctx, x, y, w, h, u, t) => { glow(ctx, x + 120 * u, y + 60 * u, 300 * u * (1 + 0.04 * Math.sin(t * 0.003)), '255,214,120', 0.3); for (let i = 0; i < 26; i++) { ctx.fillStyle = 'rgba(255,230,170,' + (0.2 + 0.3 * Math.abs(Math.sin(t * 0.0012 + i))) + ')'; ctx.beginPath(); ctx.arc(x + ((rnd(i, 1) * w + t * 0.01) % w), y + rnd(i, 2) * h * 0.8 + Math.sin(t * 0.0008 + i) * 20 * u, (1.5 + rnd(i, 3) * 2.5) * u, 0, TAU); ctx.fill(); } };
  D.ANIM.university = (ctx, x, y, w, h, u, t) => { for (let i = 0; i < 18; i++) sparkle(ctx, x + 60 * u + rnd(i, 1) * (w - 120 * u), y + 60 * u + rnd(i, 2) * (h - 120 * u), (5 + rnd(i, 3) * 8) * u, 0.15 + 0.7 * Math.abs(Math.sin(t * 0.0018 + i * 3)), '#f4d98a'); };
  D.ANIM.corporate = (ctx, x, y, w, h, u, t) => { [0.3, 0.55, 0.8, 1].forEach((k, i) => { const kk = k * (0.8 + 0.2 * Math.sin(t * 0.002 + i)); ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fillRect(x + w - 150 * u + i * 26 * u, y + 130 * u - kk * 80 * u, 16 * u, kk * 80 * u); }); const f = ((t * 0.0002) % 1); ctx.strokeStyle = 'rgba(242,183,5,0.9)'; ctx.lineWidth = 4 * u; ctx.beginPath(); ctx.moveTo(x + 40 * u, y + h - 40 * u - f * 60 * u); ctx.lineTo(x + 40 * u + f * 300 * u, y + h - 40 * u - f * 60 * u); ctx.stroke(); };
  D.ANIM.floral = (ctx, x, y, w, h, u, t) => { for (let i = 0; i < 16; i++) { const px = x + ((rnd(i, 1) * w + Math.sin(t * 0.0008 + i) * 40 * u) + w) % w, py = y + ((t * (0.02 + rnd(i, 2) * 0.03) + rnd(i, 3) * h) % h); ctx.save(); ctx.translate(px, py); ctx.rotate(t * 0.0015 + i); ctx.fillStyle = ['rgba(245,143,166,0.8)', 'rgba(255,200,215,0.9)', 'rgba(255,255,255,0.9)'][i % 3]; ctx.beginPath(); ctx.ellipse(0, 0, (10 + rnd(i, 4) * 8) * u, (6 + rnd(i, 4) * 5) * u, 0, 0, TAU); ctx.fill(); ctx.restore(); } };
  D.ANIM.notebook = (ctx, x, y, w, h, u, t) => { const f = (t * 0.0003) % 1; ctx.strokeStyle = '#4a90e2'; ctx.lineWidth = 4 * u; ctx.lineCap = 'round'; ctx.beginPath(); for (let i = 0; i <= 40 * f; i++) { const px = x + w - 520 * u + i * 8 * u, py = y + h - 160 * u + Math.sin(i * 0.9) * 10 * u; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke(); };
  D.ANIM.science = (ctx, x, y, w, h, u, t) => { [[x + 130 * u, y + 120 * u, 90 * u, '#1e64c8'], [x + w - 120 * u, y + h - 120 * u, 80 * u, '#e66e3c']].forEach(([cx, cy, r, c], k) => { for (let i = 0; i < 3; i++) { const a = t * 0.003 * (1 + i * 0.3) + i * 2; ctx.save(); ctx.translate(cx, cy); ctx.rotate(i * Math.PI / 3); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(Math.cos(a) * r, Math.sin(a) * r * 0.38, 8 * u, 0, TAU); ctx.fill(); ctx.restore(); } }); };
  D.ANIM.kids = (ctx, x, y, w, h, u, t) => { for (let i = 0; i < 3; i++) cloud(ctx, x + ((rnd(i, 1) * w + t * (0.012 + i * 0.006)) % (w + 400 * u)) - 200 * u, y + (60 + i * 90) * u, u * (0.7 + i * 0.15), 0.85); ctx.strokeStyle = 'rgba(255,216,74,0.9)'; ctx.lineWidth = 6 * u; for (let i = 0; i < 12; i++) { const a = i * TAU / 12 + t * 0.0006; ctx.beginPath(); ctx.moveTo(x + w - 130 * u + Math.cos(a) * 70 * u, y + 120 * u + Math.sin(a) * 70 * u); ctx.lineTo(x + w - 130 * u + Math.cos(a) * 104 * u, y + 120 * u + Math.sin(a) * 104 * u); ctx.stroke(); } };
  D.ANIM.geometric = (ctx, x, y, w, h, u, t) => { for (let i = 0; i < 12; i++) { const cx = x + rnd(i, 1) * w, cy = y + rnd(i, 2) * h, r = (14 + rnd(i, 3) * 26) * u; ctx.save(); ctx.translate(cx + Math.sin(t * 0.001 + i) * 30 * u, cy + Math.cos(t * 0.0012 + i) * 30 * u); ctx.rotate(t * 0.0008 * (i % 2 ? 1 : -1) + i); ctx.fillStyle = ['#ff7a8a', '#ffd166', '#06d6a0', '#4cc9f0', '#9b72f2'][i % 5] + 'aa'; if (i % 3 === 0) { ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); } else if (i % 3 === 1) ctx.fillRect(-r, -r, r * 2, r * 2); else { ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r, r); ctx.lineTo(-r, r); ctx.closePath(); ctx.fill(); } ctx.restore(); } };
})();
