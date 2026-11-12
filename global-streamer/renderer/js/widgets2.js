/* Global Streamer - widget siaran lanjutan (susun atur menegak 9:16 untuk TikTok LIVE).
 * Reka bentuk ASAL: maskot "GS-Bot", ikon dan gaya hologram sendiri. Hanya fungsi yang dipinjam daripada
 * rujukan (bar status, boss like, top like, banner promosi, giliran mabar, W/L, draft, pemasa spell). */
(function () {
  'use strict';
  const W = GS.widgets, C = GS.colors, clamp = GS.clamp;
  const T = (s, ...a) => GS.tov(s, ...a);

  const fmtK = (n) => {
    n = Number(n) || 0;
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(Math.round(n));
  };
  W.fmtK = fmtK;
  const initials = (name) => String(name || '').split(/[\s'’.-]+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

  /* ---------- ikon vektor kecil ---------- */
  W.glyph = function (ctx, name, cx, cy, r, color) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = color || '#fff';
    ctx.strokeStyle = color || '#fff';
    ctx.lineWidth = Math.max(2, r * 0.16);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    switch (name) {
      case 'heart':
        ctx.moveTo(0, r * 0.8);
        ctx.bezierCurveTo(-r * 1.4, -r * 0.1, -r * 0.7, -r * 1.0, 0, -r * 0.35);
        ctx.bezierCurveTo(r * 0.7, -r * 1.0, r * 1.4, -r * 0.1, 0, r * 0.8);
        ctx.fill();
        break;
      case 'bag':
        ctx.rect(-r * 0.75, -r * 0.35, r * 1.5, r * 1.1);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, -r * 0.35, r * 0.4, Math.PI, 0);
        ctx.stroke();
        break;
      case 'crown':
        ctx.moveTo(-r, r * 0.6); ctx.lineTo(-r, -r * 0.5); ctx.lineTo(-r * 0.45, 0); ctx.lineTo(0, -r * 0.8); ctx.lineTo(r * 0.45, 0); ctx.lineTo(r, -r * 0.5); ctx.lineTo(r, r * 0.6);
        ctx.closePath();
        ctx.fill();
        break;
      case 'gift':
        ctx.rect(-r * 0.8, -r * 0.1, r * 1.6, r * 0.9);
        ctx.fill();
        ctx.beginPath();
        ctx.rect(-r * 0.9, -r * 0.5, r * 1.8, r * 0.4);
        ctx.fill();
        ctx.fillStyle = '#07122a';
        ctx.fillRect(-r * 0.08, -r * 0.5, r * 0.16, r * 1.3);
        break;
      case 'diamond':
        ctx.moveTo(0, -r); ctx.lineTo(r * 0.8, -r * 0.1); ctx.lineTo(0, r); ctx.lineTo(-r * 0.8, -r * 0.1);
        ctx.closePath();
        ctx.fill();
        break;
      case 'bolt':
        ctx.moveTo(r * 0.3, -r); ctx.lineTo(-r * 0.7, r * 0.15); ctx.lineTo(-r * 0.05, r * 0.15); ctx.lineTo(-r * 0.3, r); ctx.lineTo(r * 0.7, -r * 0.2); ctx.lineTo(r * 0.05, -r * 0.2);
        ctx.closePath();
        ctx.fill();
        break;
      case 'note':
        ctx.arc(-r * 0.35, r * 0.55, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-r * 0.0, r * 0.55); ctx.lineTo(-r * 0.0, -r * 0.8); ctx.lineTo(r * 0.7, -r * 0.5);
        ctx.stroke();
        break;
      case 'eye':
        ctx.ellipse(0, 0, r, r * 0.6, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
        ctx.fill();
        break;
      default: // star
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + (Math.PI / 5) * i, rr_ = i % 2 ? r * 0.45 : r;
          i ? ctx.lineTo(Math.cos(a) * rr_, Math.sin(a) * rr_) : ctx.moveTo(Math.cos(a) * rr_, Math.sin(a) * rr_);
        }
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
  };

  /* ---------- maskot asli "GS-Bot" ---------- */
  W.mascot = function (ctx, cx, cy, size, t, tone) {
    const bob = Math.sin(t * 0.004) * size * 0.03;
    const main = tone === 'gold' ? '#ffb13b' : C.blue, acc = tone === 'gold' ? '#ff6a3b' : C.red;
    ctx.save();
    ctx.translate(cx, cy + bob);
    const hw = size * 0.9, hh = size * 0.74;
    // bahu
    ctx.fillStyle = '#10244a';
    W.rr(ctx, -hw * 0.55, hh * 0.35, hw * 1.1, size * 0.34, size * 0.14);
    ctx.fill();
    ctx.strokeStyle = main;
    ctx.lineWidth = size * 0.04;
    ctx.stroke();
    // antena
    ctx.strokeStyle = '#8fb4e8';
    ctx.lineWidth = size * 0.04;
    ctx.beginPath();
    ctx.moveTo(0, -hh / 2);
    ctx.lineTo(0, -hh / 2 - size * 0.16);
    ctx.stroke();
    ctx.fillStyle = acc;
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 0.008);
    ctx.beginPath();
    ctx.arc(0, -hh / 2 - size * 0.2, size * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // kepala
    const g = ctx.createLinearGradient(0, -hh / 2, 0, hh / 2);
    g.addColorStop(0, '#2a4f9a');
    g.addColorStop(1, '#0f2350');
    ctx.fillStyle = g;
    W.rr(ctx, -hw / 2, -hh / 2, hw, hh, size * 0.24);
    ctx.fill();
    ctx.lineWidth = size * 0.05;
    ctx.strokeStyle = main;
    ctx.shadowColor = main;
    ctx.shadowBlur = size * 0.12;
    ctx.stroke();
    ctx.shadowBlur = 0;
    // pelindung muka
    ctx.fillStyle = '#050c20';
    W.rr(ctx, -hw * 0.38, -hh * 0.3, hw * 0.76, hh * 0.56, size * 0.14);
    ctx.fill();
    // mata (berkelip)
    const blink = (t % 3600) > 3450 ? 0.15 : 1;
    ctx.fillStyle = C.cyan;
    ctx.shadowColor = C.cyan;
    ctx.shadowBlur = size * 0.1;
    for (const ex of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(ex * hw * 0.16, -hh * 0.06, size * 0.075, size * 0.1 * blink, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    // senyum
    ctx.strokeStyle = C.cyan;
    ctx.lineWidth = size * 0.035;
    ctx.beginPath();
    ctx.arc(0, hh * 0.02, size * 0.13, 0.25 * Math.PI, 0.75 * Math.PI);
    ctx.stroke();
    // fon kepala
    ctx.fillStyle = acc;
    for (const sx of [-1, 1]) {
      W.rr(ctx, sx * hw * 0.5 - size * 0.07, -hh * 0.18, size * 0.14, size * 0.36, size * 0.06);
      ctx.fill();
    }
    ctx.strokeStyle = acc;
    ctx.lineWidth = size * 0.05;
    ctx.beginPath();
    ctx.arc(0, -hh * 0.02, hw * 0.5, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
    ctx.restore();
  };

  const hexSlot = (ctx, cx, cy, r, name, col, filled) => {
    W.hex(ctx, cx, cy, r);
    ctx.fillStyle = filled ? col : 'rgba(255,255,255,0.05)';
    ctx.globalAlpha = filled ? 0.9 : 1;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = Math.max(2, r * 0.08);
    ctx.strokeStyle = filled ? '#fff' : 'rgba(160,200,255,0.35)';
    ctx.stroke();
    if (name) {
      W.hex(ctx, cx, cy, r * 0.94);
      if (GS.drawHeroInPath(ctx, name, cx, cy, r)) {
        W.hex(ctx, cx, cy, r);
        ctx.lineWidth = Math.max(2, r * 0.08);
        ctx.strokeStyle = '#fff';
        ctx.stroke();
      } else {
        ctx.beginPath();
        W.text(ctx, initials(name), cx, cy + r * 0.2, { size: r * 0.62, weight: 800, align: 'center', color: '#07122a' });
      }
    }
  };

  /** Avatar bulat: gambar hero, atau inisial jika gambar belum ada. */
  W.heroAvatar = function (ctx, name, cx, cy, r, col) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = col || '#2ea8ff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    if (!GS.drawHeroInPath(ctx, name, cx, cy, r)) {
      ctx.beginPath();
      W.text(ctx, initials(name), cx, cy + r * 0.3, { size: r * 0.9, weight: 800, align: 'center', color: '#07122a' });
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.lineWidth = Math.max(1.5, r * 0.1);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.stroke();
  };

  /* ---------- bar status ---------- */
  W.statusbar = function (ctx, s, t) {
    const { x, y, w, h } = s;
    const st = GS.state.status;
    ctx.save();
    const bg = ctx.createLinearGradient(x, y, x + w, y);
    bg.addColorStop(0, 'rgba(4,9,24,0.95)');
    bg.addColorStop(1, 'rgba(26,6,22,0.95)');
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = W.holoGrad(ctx, x, y + h - 4, w, 4, t);
    ctx.fillRect(x, y + h - 4, w, 4);
    ctx.fillStyle = W.holoGrad(ctx, x, y, w, 2, t, 1.2);
    ctx.globalAlpha = 0.5;
    ctx.fillRect(x, y, w, 2);
    ctx.globalAlpha = 1;
    const live = GS.live && GS.live.state === 'live';
    const pulse = 0.5 + 0.5 * Math.sin(t * 0.006);
    ctx.fillStyle = live ? 'rgba(255,59,92,' + (0.55 + 0.45 * pulse).toFixed(2) + ')' : 'rgba(150,170,200,0.5)';
    ctx.beginPath();
    ctx.arc(x + 22, y + h / 2 - 1, h * 0.14, 0, Math.PI * 2);
    ctx.fill();
    W.text(ctx, 'LIVE', x + 40, y + h * 0.66, { size: h * 0.4, weight: 800, spacing: 2, color: live ? C.red : C.muted });
    const timer = live ? GS.fmtDur((Date.now() - GS.live.startedAt) / 1000) : '00:00:00';
    W.text(ctx, timer, x + 40 + h * 1.5, y + h * 0.66, { size: h * 0.4, weight: 700, color: C.text });
    // lagu / catatan
    let cx = x + h * 4.7;
    if (st.nowPlaying) {
      W.glyph(ctx, 'note', cx + 8, y + h * 0.5, h * 0.2, C.cyan);
      W.text(ctx, st.nowPlaying, cx + h * 0.5, y + h * 0.66, { size: h * 0.36, weight: 600, color: C.text, maxW: w * 0.28 });
    }
    // matlamat like
    const gx = x + w * 0.56, gw = w * 0.26;
    W.glyph(ctx, 'heart', gx - h * 0.2, y + h * 0.5, h * 0.2, C.red);
    W.text(ctx, T(st.likeLabel || 'LIKE GOAL'), gx + 8, y + h * 0.5, { size: h * 0.28, weight: 800, spacing: 1.5, color: C.muted, baseline: 'middle', maxW: gw * 0.6 });
    const pr = clamp((st.likeCur || 0) / Math.max(1, st.likeMax || 1), 0, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    W.rr(ctx, gx + gw * 0.52, y + h * 0.36, gw * 0.48, h * 0.26, h * 0.13);
    ctx.fill();
    if (pr > 0) { ctx.fillStyle = W.holoGrad(ctx, gx, y, gw, h, t); W.rr(ctx, gx + gw * 0.52, y + h * 0.36, Math.max(h * 0.26, gw * 0.48 * pr), h * 0.26, h * 0.13); ctx.fill(); }
    W.text(ctx, (st.likeCur || 0) + '/' + (st.likeMax || 0), gx + gw + 14, y + h * 0.66, { size: h * 0.36, weight: 800, color: C.text });
    // penonton
    if (st.viewers > 0) {
      W.glyph(ctx, 'eye', x + w - h * 1.5, y + h * 0.5, h * 0.2, C.cyan);
      W.text(ctx, String(st.viewers), x + w - h * 1.15, y + h * 0.66, { size: h * 0.38, weight: 800, color: C.text });
    }
    ctx.restore();
  };

  /* ---------- boss (permainan like/gift) ---------- */
  W.boss = function (ctx, s, t) {
    const b = GS.state.boss;
    if (!b.enabled) return;
    const { x, y, w, h } = s;
    W.panel(ctx, x, y, w, h, t, { phase: 0.9, r: 18 });
    const pad = w * 0.06;
    // tajuk
    const chipW = w * 0.37;
    ctx.fillStyle = W.holoGrad(ctx, x + pad, y + pad, chipW, h * 0.16, t, 0.3);
    W.rr(ctx, x + pad, y + h * 0.07, chipW, h * 0.16, h * 0.04);
    ctx.fill();
    W.text(ctx, 'BOSS LV ' + b.level, x + pad + chipW / 2, y + h * 0.195, { size: h * 0.1, weight: 800, align: 'center', color: '#fff', spacing: 1 });
    W.text(ctx, b.name, x + pad + chipW + 12, y + h * 0.2, { size: h * 0.125, weight: 800, color: C.text, maxW: w - chipW - pad * 2 - 12 });
    // HP
    const bx = x + pad, bw = w - pad * 2, by = y + h * 0.3, bh = h * 0.14;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    W.rr(ctx, bx, by, bw, bh, bh / 2);
    ctx.fill();
    const hp = clamp(b.hp / Math.max(1, b.max), 0, 1);
    if (hp > 0) {
      const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
      g.addColorStop(0, '#ff3b5c'); g.addColorStop(1, '#ff9a3b');
      ctx.fillStyle = g;
      W.rr(ctx, bx, by, Math.max(bh, bw * hp), bh, bh / 2);
      ctx.fill();
    }
    W.text(ctx, fmtK(b.hp) + ' / ' + fmtK(b.max), bx + bw / 2, by + bh * 0.76, { size: bh * 0.7, weight: 800, align: 'center', color: '#fff', shadow: 'rgba(0,0,0,.8)', blur: 4 });
    W.text(ctx, 'Last hit = MVP!', bx, y + h * 0.6, { size: h * 0.1, weight: 700, color: C.gold });
    W.text(ctx, 'Tap LIKE to attack!', bx, y + h * 0.72, { size: h * 0.1, weight: 700, color: C.cyan });
    // perisai / bar kedua
    const sy = y + h * 0.8;
    W.text(ctx, b.shieldName, bx, sy + h * 0.045, { size: h * 0.075, weight: 800, spacing: 1.5, color: C.muted, baseline: 'middle', maxW: bw * 0.45 });
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    W.rr(ctx, bx, sy + h * 0.1, bw, h * 0.055, h * 0.03);
    ctx.fill();
    const sp = clamp(b.shield / Math.max(1, b.shieldMax), 0, 1);
    if (sp > 0) { ctx.fillStyle = W.holoGrad(ctx, bx, sy, bw, h * 0.06, t); W.rr(ctx, bx, sy + h * 0.1, Math.max(h * 0.055, bw * sp), h * 0.055, h * 0.03); ctx.fill(); }
    W.text(ctx, fmtK(b.shield) + ' / ' + fmtK(b.shieldMax), x + w - pad, sy + h * 0.045, { size: h * 0.075, weight: 700, align: 'right', color: C.text, baseline: 'middle' });
  };

  /* ---------- top like ---------- */
  W.toplike = function (ctx, s, t) {
    const { x, y, w, h } = s;
    const rows = (GS.state.toplike || []).slice(0, 5);
    W.panel(ctx, x, y, w, h, t, { phase: 1.7, r: 18 });
    W.glyph(ctx, 'heart', x + w * 0.09, y + h * 0.15, h * 0.075, C.red);
    W.text(ctx, 'TOP LIKE', x + w * 0.17, y + h * 0.2, { size: h * 0.12, weight: 800, spacing: 2, color: C.text });
    const rh = (h * 0.74) / Math.max(3, rows.length);
    rows.forEach((r, i) => {
      const ry = y + h * 0.28 + i * rh;
      ctx.fillStyle = i === 0 ? C.gold : i === 1 ? '#c9d6ea' : '#d99a6c';
      ctx.beginPath();
      ctx.arc(x + w * 0.1, ry + rh * 0.45, rh * 0.32, 0, Math.PI * 2);
      ctx.fill();
      W.text(ctx, i + 1, x + w * 0.1, ry + rh * 0.58, { size: rh * 0.4, weight: 800, align: 'center', color: '#07122a' });
      W.text(ctx, GS.tov(r.name || '—'), x + w * 0.2, ry + rh * 0.62, { size: rh * 0.44, weight: 700, color: C.text, maxW: w * 0.46 });
      W.text(ctx, (r.n || 0).toLocaleString('en-US'), x + w - w * 0.06, ry + rh * 0.62, { size: rh * 0.42, weight: 800, align: 'right', color: C.cyan });
    });
  };

  /* ---------- banner promosi dengan maskot ---------- */
  W.promo = function (ctx, s, t) {
    const { x, y, w, h } = s;
    const gift = s.props.style === 'gift';
    const items = (gift ? GS.state.promo.gift : GS.state.promo.items) || [];
    W.panel(ctx, x, y, w, h, t, { phase: gift ? 4.2 : 3.6, r: Math.min(22, h * 0.3) });
    const tone = gift ? 'gold' : 'blue';
    // bot / karakter sendiri (PNG lutsinar) menggantikan GS-Bot asal; bergerak naik-turun perlahan seperti bot asal
    const own = s.props.mascot && GS.media.image(s.props.mascot);
    if (own && own.naturalWidth) {
      const box = h * 1.1, bob = Math.sin(t * 0.004) * h * 0.02;
      const r = Math.min(box / own.naturalWidth, box / own.naturalHeight);
      const dw = own.naturalWidth * r, dh = own.naturalHeight * r;
      ctx.drawImage(own, x + h * 0.62 - dw / 2, y + h * 0.56 - dh / 2 + bob, dw, dh);
    } else W.mascot(ctx, x + h * 0.62, y + h * 0.56, h * 0.62, t, tone);
    if (!items.length) return;
    const period = 4600;
    const idx = Math.floor(t / period) % items.length;
    const ph = (t % period) / period;
    const inP = clamp(ph / 0.1, 0, 1), outP = clamp((ph - 0.9) / 0.1, 0, 1);
    const e = 1 - Math.pow(1 - inP, 3);
    const it = items[idx];
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + h * 1.2, y + 4, w - h * 1.3, h - 8);
    ctx.clip();
    ctx.globalAlpha = (1 - outP) * e;
    const off = (1 - e) * h * 0.5 - outP * h * 0.4;
    const hx = x + h * 1.65;
    W.hex(ctx, hx, y + h * 0.5 + off, h * 0.27);
    ctx.fillStyle = gift ? 'rgba(255,177,59,0.25)' : 'rgba(46,168,255,0.25)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = gift ? '#ffb13b' : C.cyan;
    ctx.stroke();
    W.glyph(ctx, it.icon, hx, y + h * 0.5 + off, h * 0.15, gift ? '#ffd36b' : '#fff');
    const tx = hx + h * 0.42;
    W.text(ctx, T(it.title || '').toUpperCase(), tx, y + h * 0.48 + off, { size: h * 0.3, weight: 800, color: C.text, maxW: x + w - tx - 24, shadow: 'rgba(80,170,255,.6)', blur: 10 });
    W.text(ctx, T(it.sub || ''), tx, y + h * 0.78 + off, { size: h * 0.19, weight: 600, color: gift ? C.gold : C.cyan, maxW: x + w - tx - 24 });
    ctx.restore();
  };

  /* ---------- giliran mabar ---------- */
  W.queue = function (ctx, s, t) {
    const q = GS.state.queue;
    const { x, y, w, h } = s;
    W.panel(ctx, x, y, w, h, t, { phase: 2.4, r: 18 });
    W.text(ctx, GS.tov(q.title || 'MABAR VIP'), x + w * 0.05, y + h * 0.18, { size: h * 0.115, weight: 800, spacing: 2, color: C.text, maxW: w * 0.5 });
    const bt = q.open ? (q.badgeOpen || 'OPEN') : (q.badgeClosed || 'CLOSED');
    const bw = w * 0.3;
    ctx.fillStyle = q.open ? 'rgba(59,227,154,0.22)' : 'rgba(255,59,92,0.22)';
    W.rr(ctx, x + w - bw - w * 0.05, y + h * 0.06, bw, h * 0.16, h * 0.04);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = q.open ? C.green : C.red;
    ctx.stroke();
    W.text(ctx, bt, x + w - bw / 2 - w * 0.05, y + h * 0.18, { size: h * 0.1, weight: 800, spacing: 2, align: 'center', color: q.open ? C.green : '#ff8da1' });
    const rows = (q.rows || []).slice(0, 4);
    const top = y + h * 0.28, rh = (h * 0.54) / 4;
    if (!rows.length) W.text(ctx, T('Tiada giliran'), x + w / 2, y + h * 0.55, { size: h * 0.1, weight: 600, align: 'center', color: C.muted });
    rows.forEach((r, i) => {
      const ry = top + i * rh;
      ctx.fillStyle = i === 0 ? 'rgba(46,168,255,0.2)' : 'rgba(255,255,255,0.05)';
      W.rr(ctx, x + w * 0.04, ry + 2, w * 0.92, rh - 4, rh * 0.25);
      ctx.fill();
      W.text(ctx, i + 1, x + w * 0.09, ry + rh * 0.68, { size: rh * 0.5, weight: 800, align: 'center', color: i === 0 ? C.cyan : C.muted });
      W.text(ctx, GS.tov(r.name || '—'), x + w * 0.15, ry + rh * 0.68, { size: rh * 0.5, weight: 700, color: C.text, maxW: w * 0.5 });
      W.text(ctx, (r.games || 0) + ' ' + T('GAME'), x + w * 0.93, ry + rh * 0.68, { size: rh * 0.44, weight: 800, align: 'right', color: C.gold });
    });
    if (q.note) W.text(ctx, q.note, x + w / 2, y + h * 0.94, { size: h * 0.075, weight: 700, align: 'center', color: C.muted, maxW: w * 0.9 });
  };

  /* ---------- label (peranti, dll.) ---------- */
  W.label = function (ctx, s, t) {
    const { x, y, w, h } = s;
    W.panel(ctx, x, y, w, h, t, { phase: 5, r: h / 2.4 });
    const txt = s.props.bind === 'device' ? GS.state.deviceLabel : s.props.text;
    W.text(ctx, GS.tov(txt || ''), x + w / 2, y + h * 0.64, { size: h * 0.42, weight: 800, spacing: 1.5, align: 'center', color: C.text, maxW: w * 0.9 });
  };

  /* ---------- draft pick / ban ---------- */
  W.draft = function (ctx, s, t) {
    const d = GS.state.draft;
    if (!d.show) return;
    const { x, y, w, h } = s;
    W.panel(ctx, x, y, w, h, t, { phase: 6, r: 20, opaque: true });
    W.text(ctx, 'DRAFT', x + w * 0.04, y + h * 0.13, { size: h * 0.09, weight: 800, spacing: 3, color: C.text });
    const pw = w * 0.34;
    ctx.fillStyle = W.holoGrad(ctx, x + w * 0.19, y + h * 0.04, pw, h * 0.1, t);
    W.rr(ctx, x + w * 0.19, y + h * 0.04, pw, h * 0.1, h * 0.03);
    ctx.fill();
    W.text(ctx, GS.tov(d.phase || 'DRAFT PICK'), x + w * 0.19 + pw / 2, y + h * 0.115, { size: h * 0.065, weight: 800, align: 'center', color: '#fff', spacing: 1.5 });
    const rowY = [y + h * 0.35, y + h * 0.63];
    const TL = (GS.tourney && GS.tourney.labels()) || { ally: 'ALLY', enemy: 'ENEMY' };
    [[TL.ally, d.ally, d.banAlly, C.blue], [TL.enemy, d.enemy, d.banEnemy, C.red]].forEach(([lbl, arr, ban, col], r) => {
      W.text(ctx, lbl, x + w * 0.04, rowY[r] + h * 0.02, { size: h * 0.065, weight: 800, spacing: 2, color: col });
      const hr = Math.min(h * 0.085, w * 0.052);
      for (let i = 0; i < 5; i++) {
        const cx = x + w * 0.2 + i * hr * 2.35;
        hexSlot(ctx, cx, rowY[r], hr, arr[i], col, !!arr[i]);
        if (arr[i]) W.text(ctx, arr[i], cx, rowY[r] + hr * 1.55, { size: hr * 0.42, weight: 700, align: 'center', color: C.text, maxW: hr * 2.2 });
      }
      if (ban) {
        const names = String(ban).split(/[,;]/).map((q) => q.trim()).filter(Boolean).slice(0, 5);
        const known = names.every((q) => GS.hero && GS.hero(q));
        if (known) {
          W.text(ctx, 'BAN', x + w * 0.2 - hr * 0.2, rowY[r] + hr * 2.38, { size: hr * 0.4, weight: 800, color: C.muted, spacing: 1, align: 'right' });
          names.forEach((q, i) => {
            const ax = x + w * 0.2 + hr * 0.45 + i * hr * 1.25, ay = rowY[r] + hr * 2.25;
            ctx.save();
            ctx.globalAlpha = 0.85;
            W.heroAvatar(ctx, q, ax, ay, hr * 0.5, '#444c60');
            ctx.restore();
            ctx.beginPath(); ctx.arc(ax, ay, hr * 0.5, 0, Math.PI * 2); ctx.lineWidth = Math.max(2, hr * 0.07); ctx.strokeStyle = C.red; ctx.stroke();
            ctx.beginPath(); ctx.moveTo(ax - hr * 0.35, ay + hr * 0.35); ctx.lineTo(ax + hr * 0.35, ay - hr * 0.35); ctx.stroke();
          });
        } else W.text(ctx, 'BAN: ' + ban, x + w * 0.2, rowY[r] + hr * 2.25, { size: hr * 0.42, weight: 600, color: C.muted, maxW: w * 0.5 });
      }
    });
    // ramalan menang
    const px = x + w * 0.7, pw2 = w * 0.26;
    const win = clamp(Number(d.winPct) || 50, 0, 100);
    W.text(ctx, T('RAMALAN MENANG'), px + pw2 / 2, y + h * 0.15, { size: h * 0.06, weight: 800, spacing: 1.5, align: 'center', color: C.muted, maxW: pw2 + 20 });
    W.text(ctx, win + '%', px, y + h * 0.4, { size: h * 0.14, weight: 800, color: C.cyan });
    W.text(ctx, (100 - win) + '%', px + pw2, y + h * 0.4, { size: h * 0.14, weight: 800, color: '#ff8da1', align: 'right' });
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    W.rr(ctx, px, y + h * 0.48, pw2, h * 0.05, h * 0.025);
    ctx.fill();
    ctx.fillStyle = W.holoGrad(ctx, px, y, pw2, h * 0.05, t);
    W.rr(ctx, px, y + h * 0.48, Math.max(h * 0.05, pw2 * (win / 100)), h * 0.05, h * 0.025);
    ctx.fill();
    W.text(ctx, TL.ally, px, y + h * 0.62, { size: h * 0.055, weight: 700, color: C.blue, maxW: pw2 * 0.46 });
    W.text(ctx, TL.enemy, px + pw2, y + h * 0.62, { size: h * 0.055, weight: 700, color: C.red, align: 'right', maxW: pw2 * 0.46 });
    if (d.suggest !== false && GS.draftSuggest) {
      const now = Date.now();
      if (!W._sug || now - W._sug.t > 1500) W._sug = { t: now, v: GS.draftSuggest(3) };
      const sv = W._sug.v;
      if (sv.pick.length || sv.ban.length) {
        W.text(ctx, 'PICK  ' + sv.pick.map((r) => r.name).join(', '), px, y + h * 0.76, { size: h * 0.056, weight: 700, color: C.green, maxW: pw2 + 30 });
        W.text(ctx, 'BAN  ' + sv.ban.map((r) => r.name).join(', '), px, y + h * 0.86, { size: h * 0.056, weight: 700, color: C.red, maxW: pw2 + 30 });
      }
    }
    if (d.note) W.text(ctx, d.note, x + w * 0.04, y + h * 0.94, { size: h * 0.062, weight: 600, color: C.gold, maxW: w * 0.92 });
  };

  /* ---------- pemasa spell musuh ---------- */
  W.spelltimer = function (ctx, s, t) {
    const list = (GS.state.spells || []).filter((r) => r.hero);
    if (!list.length) return;
    const { x, y, w, h } = s;
    const rh = h / 5;
    const hh = list.length * rh * 0.82 + 38;
    W.panel(ctx, x, y, w, hh, t, { phase: 7, r: 16 });
    W.text(ctx, 'ENEMY SPELL', x + 18, y + 26, { size: 17, weight: 800, spacing: 2, color: C.muted });
    const now = Date.now();
    list.forEach((r, i) => {
      const ry = y + 38 + i * rh * 0.82;
      const left = Math.max(0, Math.ceil(((r.until || 0) - now) / 1000));
      hexSlot(ctx, x + 36, ry + rh * 0.36, rh * 0.3, r.hero, C.red, true);
      W.text(ctx, r.hero, x + 76, ry + rh * 0.3, { size: rh * 0.32, weight: 700, color: C.text, maxW: w * 0.4 });
      W.text(ctx, r.spell, x + 76, ry + rh * 0.62, { size: rh * 0.26, weight: 600, color: C.muted, maxW: w * 0.4 });
      const txt = left > 0 ? GS.pad(Math.floor(left / 60)) + ':' + GS.pad(left % 60) : 'READY';
      W.text(ctx, txt, x + w - 18, ry + rh * 0.5, { size: rh * 0.42, weight: 800, align: 'right', color: left > 0 ? C.gold : C.green });
    });
  };

  /* ---------- meta board: top pick / top ban tournament ---------- */
  W.metaboard = function (ctx, s, t) {
    const M = GS.meta;
    if (!M || !M.data) return;
    const { x, y, w, h } = s;
    W.panel(ctx, x, y, w, h, t, { phase: 8, r: 18, opaque: true });
    const a = M.aggregate();
    W.text(ctx, GS.tov('META TOURNAMENT'), x + 18, y + h * 0.1, { size: Math.min(h * 0.07, 22), weight: 800, spacing: 2.5, color: C.text });
    W.text(ctx, a.games + ' game', x + w - 18, y + h * 0.1, { size: Math.min(h * 0.055, 17), weight: 700, color: C.muted, align: 'right' });
    const cols = [['TOP PICK', M.top('pick', { n: 5 }), (r) => r.p, (r) => Math.round(r.pickRate * 100) + '%', C.cyan], ['TOP BAN', M.top('ban', { n: 5 }), (r) => r.b, (r) => Math.round(r.banRate * 100) + '%', C.red]];
    const cw = (w - 54) / 2;
    cols.forEach(([title, rows, val, txt, col], ci) => {
      const cx = x + 18 + ci * (cw + 18);
      W.text(ctx, GS.tov(title), cx, y + h * 0.22, { size: Math.min(h * 0.06, 19), weight: 800, spacing: 2, color: col });
      const maxv = Math.max(1, ...rows.map(val));
      const rh = (h * 0.62) / 5;
      rows.forEach((r, i) => {
        const ry = y + h * 0.27 + i * rh;
        W.text(ctx, (i + 1) + '', cx, ry + rh * 0.55, { size: rh * 0.4, weight: 800, color: C.muted });
        W.heroAvatar(ctx, r.name, cx + rh * 0.85, ry + rh * 0.42, rh * 0.36, col);
        W.text(ctx, r.name, cx + rh * 1.35, ry + rh * 0.55, { size: rh * 0.4, weight: 700, color: C.text, maxW: cw * 0.5 - rh });
        W.text(ctx, txt(r), cx + cw, ry + rh * 0.55, { size: rh * 0.4, weight: 800, color: col, align: 'right' });
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(cx, ry + rh * 0.76, cw, 3);
        ctx.fillStyle = col;
        ctx.fillRect(cx, ry + rh * 0.76, cw * (val(r) / maxv), 3);
      });
    });
    W.text(ctx, 'Data: Liquipedia · CC-BY-SA', x + 18, y + h - 12, { size: Math.min(h * 0.04, 13), weight: 600, color: C.muted });
  };

  /* ---------- papan perlawanan tournament ---------- */
  const clipTxt = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
  W.matchboard = function (ctx, s, t) {
    const T = GS.tourney;
    if (!T) return;
    const { x, y, w, h } = s;
    W.panel(ctx, x, y, w, h, t, { phase: 9, r: 20, opaque: true });
    const m = T.current();
    if (!m) {
      W.text(ctx, GS.tov('TIADA PERLAWANAN'), x + w / 2, y + h / 2 + h * 0.04, { size: h * 0.12, weight: 800, align: 'center', color: C.muted, spacing: 2, maxW: w * 0.9 });
      return;
    }
    const tm = m.tournament;
    W.text(ctx, clipTxt((tm.name || '').toUpperCase(), 46), x + w / 2, y + h * 0.15, { size: h * 0.075, weight: 800, align: 'center', color: C.text, spacing: 2, maxW: w * 0.9 });
    // lencana status
    const st = m.state;
    const label = st === 'live' ? 'LIVE' : st === 'finished' ? GS.tov('TAMAT') : (T.countdown(m) ? GS.tov('MULA') + ' ' + T.countdown(m) : GS.tov('SEBENTAR LAGI'));
    const col = st === 'live' ? C.red : st === 'finished' ? C.muted : C.gold;
    ctx.font = '800 ' + h * 0.06 + 'px ' + W.FONT;
    const bw = ctx.measureText(label).width + h * 0.14;
    ctx.fillStyle = col;
    ctx.globalAlpha = st === 'live' ? 0.55 + 0.45 * Math.abs(Math.sin(t * 0.004)) : 0.9;
    W.rr(ctx, x + w / 2 - bw / 2, y + h * 0.215, bw, h * 0.095, h * 0.045);
    ctx.fill();
    ctx.globalAlpha = 1;
    W.text(ctx, label, x + w / 2, y + h * 0.285, { size: h * 0.06, weight: 800, align: 'center', color: '#050a18', spacing: 1.5 });
    // pasukan dan skor
    const a = m.teams[0], b = m.teams[1];
    const sc = (v) => (v == null ? '' : String(v));
    const sideW = w * 0.36;
    const winA = m.done && m.winner === 0, winB = m.done && m.winner === 1;
    W.text(ctx, a.short.toUpperCase(), x + w * 0.04 + sideW / 2, y + h * 0.58, { size: h * 0.17, weight: 900, align: 'center', color: m.done && !winA ? C.muted : C.text, maxW: sideW, shadow: winA ? C.gold : '' });
    W.text(ctx, b.short.toUpperCase(), x + w * 0.96 - sideW / 2, y + h * 0.58, { size: h * 0.17, weight: 900, align: 'center', color: m.done && !winB ? C.muted : C.text, maxW: sideW, shadow: winB ? C.gold : '' });
    const mid = a.score == null ? 'VS' : sc(a.score) + ' : ' + sc(b.score);
    W.text(ctx, mid, x + w / 2, y + h * 0.6, { size: h * 0.22, weight: 900, align: 'center', color: C.cyan, maxW: w * 0.26 });
    W.text(ctx, clipTxt(a.name, 24), x + w * 0.04 + sideW / 2, y + h * 0.74, { size: h * 0.06, weight: 600, align: 'center', color: C.muted, maxW: sideW });
    W.text(ctx, clipTxt(b.name, 24), x + w * 0.96 - sideW / 2, y + h * 0.74, { size: h * 0.06, weight: 600, align: 'center', color: C.muted, maxW: sideW });
    const stage = [tm.group && tm.group !== 'Playoffs' ? tm.group : '', m.bo ? 'Bo' + m.bo : ''].filter(Boolean).join(' · ');
    W.text(ctx, stage, x + w / 2, y + h * 0.9, { size: h * 0.06, weight: 700, align: 'center', color: C.muted, spacing: 1.5 });
  };

  W.resultsboard = function (ctx, s, t) {
    const T = GS.tourney;
    if (!T) return;
    const { x, y, w, h } = s;
    W.panel(ctx, x, y, w, h, t, { phase: 10, r: 18, opaque: true });
    W.text(ctx, GS.tov('KEPUTUSAN TERKINI'), x + 18, y + h * 0.1, { size: Math.min(h * 0.065, 22), weight: 800, spacing: 2.5, color: C.text });
    const ch = T.champions()[0];
    let top = y + h * 0.14;
    if (ch && ch.champion) {
      ctx.fillStyle = 'rgba(255,211,107,0.14)';
      W.rr(ctx, x + 12, top, w - 24, h * 0.16, 10);
      ctx.fill();
      W.text(ctx, GS.tov('JUARA') + ' · ' + clipTxt(ch.name, 26), x + 24, top + h * 0.065, { size: h * 0.045, weight: 700, color: C.gold, maxW: w - 48 });
      W.text(ctx, ch.champion, x + 24, top + h * 0.135, { size: h * 0.075, weight: 900, color: C.text, maxW: w - 48 });
      top += h * 0.19;
    }
    const rows = T.recent(5);
    const rh = (y + h - top - 10) / Math.max(1, 5);
    rows.forEach((m, i) => {
      const ry = top + i * rh;
      const a = m.teams[0], b = m.teams[1];
      const wa = m.winner === 0;
      W.text(ctx, a.short, x + 20, ry + rh * 0.66, { size: rh * 0.42, weight: wa ? 900 : 600, color: wa ? C.text : C.muted, maxW: w * 0.3 });
      W.text(ctx, a.score + ' : ' + b.score, x + w / 2, ry + rh * 0.66, { size: rh * 0.45, weight: 900, align: 'center', color: C.cyan });
      W.text(ctx, b.short, x + w - 20, ry + rh * 0.66, { size: rh * 0.42, weight: wa ? 600 : 900, align: 'right', color: wa ? C.muted : C.text, maxW: w * 0.3 });
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(x + 16, ry + rh * 0.9, w - 32, 1.5);
    });
    if (!rows.length) W.text(ctx, GS.tov('BELUM ADA KEPUTUSAN'), x + w / 2, y + h * 0.55, { size: h * 0.07, weight: 700, align: 'center', color: C.muted });
  };
})();
