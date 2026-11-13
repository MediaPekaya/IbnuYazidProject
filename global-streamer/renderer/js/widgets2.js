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

  /* ---------- bar status: [LIVE] | garis | masa | lagu bergerak | HEART ME (TikTok sahaja) | penonton ---------- */
  const musicTitle = () => {
    const A = GS.audio;
    const ch = A && A.channels ? A.channels.find((c) => c.kind === 'music' && c.playing && c.tracks && c.tracks[c.idx || 0]) : null;
    return ch ? ch.tracks[ch.idx || 0].name : (GS.state.status.nowPlaying || '');
  };
  W.statusbar = function (ctx, s, t) {
    const { x, y, w, h } = s;
    const st = GS.state.status;
    const live = GS.live && GS.live.state === 'live';
    const tiktok = GS.orient() === 'portrait' || !!(GS.state.platforms && GS.state.platforms.tiktok && GS.state.platforms.tiktok.enabled);
    const my = y + h / 2, fs = h * 0.44;
    // jalur gelap mendatar (sebiji rujukan: segi empat, bukan pil)
    const bg = ctx.createLinearGradient(x, y, x + w, y);
    bg.addColorStop(0, '#0a1233'); bg.addColorStop(1, '#0d1540');
    ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#2f6bff'; ctx.fillRect(x, y, w, Math.max(2, h * 0.05));
    ctx.fillStyle = 'rgba(80,130,255,0.55)'; ctx.fillRect(x, y + h - Math.max(2, h * 0.05), w, Math.max(2, h * 0.05));
    // panel biru kiri: LIVE + masa
    ctx.save(); ctx.font = '900 ' + fs + 'px ' + W.FONT; if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
    const lw = ctx.measureText('LIVE').width; ctx.font = '900 ' + fs + 'px ' + W.FONT; if ('letterSpacing' in ctx) ctx.letterSpacing = '1px';
    const tw = ctx.measureText('00:00:00').width; ctx.restore();
    const pw = h * 0.5 + lw + h * 0.45 + tw + h * 0.55;
    const pg = ctx.createLinearGradient(x, y, x + pw, y); pg.addColorStop(0, '#1b3d9c'); pg.addColorStop(1, '#2a5bd6');
    ctx.fillStyle = pg; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + pw, y); ctx.lineTo(x + pw - h * 0.28, y + h); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fill();
    // garis kuning senget
    ctx.fillStyle = '#ffc928'; ctx.beginPath(); ctx.moveTo(x + pw + h * 0.04, y); ctx.lineTo(x + pw + h * 0.16, y); ctx.lineTo(x + pw - h * 0.12, y + h); ctx.lineTo(x + pw - h * 0.24, y + h); ctx.closePath(); ctx.fill();
    const pulse = 0.5 + 0.5 * Math.sin(t * 0.006);
    ctx.fillStyle = live ? 'rgba(255,70,90,' + (0.6 + 0.4 * pulse).toFixed(2) + ')' : 'rgba(255,255,255,0.45)';
    ctx.beginPath(); ctx.arc(x + h * 0.32, my, h * 0.1, 0, Math.PI * 2); ctx.fill();
    W.text(ctx, 'LIVE', x + h * 0.5, my + fs * 0.35, { size: fs, weight: 900, spacing: 3, color: '#fff' });
    const timer = live ? GS.fmtDur((Date.now() - GS.live.startedAt) / 1000) : '00:00:00';
    W.text(ctx, timer, x + h * 0.5 + lw + h * 0.45, my + fs * 0.35, { size: fs, weight: 900, spacing: 1, color: '#fff' });
    let cx = x + pw + h * 0.45;
    // kanan: penonton dalam kotak biru, kemudian HEART ME (TikTok sahaja)
    let rx = x + w - h * 0.2;
    if (st.viewers > 0) {
      const vs = String(st.viewers);
      ctx.save(); ctx.font = '900 ' + fs * 0.9 + 'px ' + W.FONT; const vw = ctx.measureText(vs).width; ctx.restore();
      const bw = vw + h * 1.0;
      ctx.fillStyle = '#1f4fd0'; W.rr(ctx, rx - bw, y + h * 0.2, bw, h * 0.6, h * 0.1); ctx.fill();
      W.glyph(ctx, 'eye', rx - bw + h * 0.3, my, h * 0.17, '#fff');
      W.text(ctx, vs, rx - h * 0.14, my + fs * 0.32, { size: fs * 0.9, weight: 900, align: 'right', color: '#fff' });
      rx -= bw + h * 0.35;
    }
    if (tiktok) {
      const cur = st.likeCur || 0, max = Math.max(1, st.likeMax || 1), pr = clamp(cur / max, 0, 1);
      const label = T(!st.likeLabel || st.likeLabel === 'LIKE GOAL' ? 'HEART ME' : st.likeLabel);
      const nums = cur + '/' + (st.likeMax || 0);
      ctx.save(); ctx.font = '900 ' + fs * 0.85 + 'px ' + W.FONT; const nw = ctx.measureText(nums).width; ctx.font = '800 ' + fs * 0.62 + 'px ' + W.FONT; if ('letterSpacing' in ctx) ctx.letterSpacing = '2px'; const lbw = ctx.measureText(label).width; ctx.restore();
      const gw = Math.max(h * 0.9, Math.min(w * 0.08, h * 2)), tot = h * 0.7 + lbw + h * 0.2 + nw + h * 0.2 + gw;
      const lx = rx - tot;
      // ikon hati merah bulat
      ctx.fillStyle = '#ff4d5e'; ctx.beginPath(); ctx.arc(lx + h * 0.3, my, h * 0.27, 0, Math.PI * 2); ctx.fill();
      W.glyph(ctx, 'heart', lx + h * 0.3, my, h * 0.15, '#fff');
      W.text(ctx, label, lx + h * 0.7, my + fs * 0.25, { size: fs * 0.62, weight: 800, spacing: 2, color: '#cfd8f5' });
      W.text(ctx, nums, lx + h * 0.7 + lbw + h * 0.2, my + fs * 0.3, { size: fs * 0.85, weight: 900, color: '#fff' });
      const gx = lx + h * 0.7 + lbw + h * 0.2 + nw + h * 0.2;
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(gx, my - 2, gw, 4);
      ctx.fillStyle = '#ffd24a'; ctx.fillRect(gx, my - 2, Math.max(4, gw * pr), 4);
      rx = lx - h * 0.35;
    }
    // tajuk lagu bergerak ke kiri dalam bar yang sama
    const title = musicTitle(), mw = rx - cx;
    if (title && mw > h * 1.5) {
      W.glyph(ctx, 'note', cx + h * 0.12, my, h * 0.17, '#7fb0ff');
      const tx0 = cx + h * 0.45, twid = mw - h * 0.45;
      ctx.save(); ctx.beginPath(); ctx.rect(tx0, y, twid, h); ctx.clip();
      ctx.font = '700 ' + fs * 0.85 + 'px ' + W.FONT;
      const txtw = ctx.measureText(title).width, gap = Math.max(h * 1.6, twid * 0.4), per = txtw + gap;
      // sentiasa bergerak perlahan ke kiri, berulang tanpa putus
      const off = (t * 0.035) % per;
      for (let k = 0; k * per - off < twid; k++) W.text(ctx, title, tx0 - off + k * per, my + fs * 0.3, { size: fs * 0.85, weight: 700, color: '#fff' });
      // hujung kiri dan kanan kabur (pudar) mengikut warna bar
      const fw = Math.min(twid * 0.2, h * 1.1), sw = Math.max(2, h * 0.05), fy = y + sw, fh = h - sw * 2;
      const gl = ctx.createLinearGradient(tx0, 0, tx0 + fw, 0); gl.addColorStop(0, 'rgba(11,20,56,1)'); gl.addColorStop(1, 'rgba(11,20,56,0)');
      ctx.fillStyle = gl; ctx.fillRect(tx0, fy, fw, fh);
      const gr = ctx.createLinearGradient(tx0 + twid - fw, 0, tx0 + twid, 0); gr.addColorStop(0, 'rgba(11,20,56,0)'); gr.addColorStop(1, 'rgba(11,20,56,1)');
      ctx.fillStyle = gr; ctx.fillRect(tx0 + twid - fw, fy, fw, fh);
      ctx.restore();
    }
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
    // bot kecil kini sumber berasingan ('Bot' dalam senarai Sumber) supaya boleh dialih, disembunyi atau diganti dengan imej sendiri
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

  /* ---------- kira detik "Sebentar Lagi": jam / minit / saat, tulisan boleh diedit ---------- */
  const CD = (GS.countdown = {
    total: (p) => ((Number(p.hours) || 0) * 3600 + (Number(p.minutes) || 0) * 60 + (Number(p.seconds) || 0)) * 1000,
    remaining(p) {
      if (p.endAt) return Math.max(0, p.endAt - Date.now());
      if (p.pausedMs != null) return p.pausedMs;
      return CD.total(p);
    },
    running: (p) => !!(p.endAt && p.endAt > Date.now()),
    start(p) { const ms = p.pausedMs != null ? p.pausedMs : CD.total(p); if (ms <= 0) return false; p.endAt = Date.now() + ms; p.pausedMs = null; return true; },
    pause(p) { if (p.endAt) { p.pausedMs = Math.max(0, p.endAt - Date.now()); p.endAt = 0; } },
    reset(p) { p.endAt = 0; p.pausedMs = null; },
    /** kira ke jam tertentu (HH:MM); jika sudah lepas hari ini, ke esok */
    toClock(p, hhmm) {
      const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '').trim());
      if (!m) return false;
      const d = new Date(); d.setHours(Number(m[1]), Number(m[2]), 0, 0);
      if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
      p.endAt = d.getTime(); p.pausedMs = null;
      return true;
    },
    parts(ms) { const s = Math.ceil(ms / 1000); return { h: Math.floor(s / 3600), m: Math.floor(s / 60) % 60, s: s % 60 }; },
  });
  /* gaya nombor: kotak, flip, neon, api, garis, biasa */
  CD.styles = [['box', 'Kotak'], ['flip', 'Flip'], ['neon', 'Neon'], ['fire', 'Api'], ['outline', 'Garis'], ['plain', 'Biasa']];
  function drawDigits(ctx, str, cx, cy, size, style, t) {
    ctx.save();
    ctx.font = '900 ' + size + 'px ' + W.FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    const y = cy + size * 0.36;
    if (style === 'fire') {
      const g = ctx.createLinearGradient(0, cy - size * 0.5, 0, cy + size * 0.5); g.addColorStop(0, '#fff3b0'); g.addColorStop(0.35, '#ffb62e'); g.addColorStop(0.75, '#ff5a1f'); g.addColorStop(1, '#c1121f');
      ctx.shadowColor = 'rgba(255,110,20,' + (0.75 + 0.25 * Math.sin(t * 0.02)).toFixed(2) + ')'; ctx.shadowBlur = size * 0.35; ctx.fillStyle = g; ctx.fillText(str, cx, y);
    } else if (style === 'neon') {
      ctx.shadowColor = '#18e2ff'; ctx.shadowBlur = size * 0.4; ctx.lineWidth = Math.max(2, size * 0.03); ctx.strokeStyle = '#7ff3ff'; ctx.strokeText(str, cx, y); ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fillText(str, cx, y);
    } else if (style === 'outline') {
      ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, size * 0.07); ctx.strokeStyle = '#ffffff'; ctx.strokeText(str, cx, y); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillText(str, cx, y);
    } else if (style === 'plain') {
      ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = size * 0.15; ctx.shadowOffsetY = size * 0.05; ctx.fillStyle = '#fff'; ctx.fillText(str, cx, y);
    } else { ctx.fillStyle = C.text; ctx.fillText(str, cx, y); }
    ctx.restore();
  }
  W.countdown = function (ctx, s, t) {
    const p = s.props, { x, y, w, h } = s, style = p.numStyle || 'box', noPanel = !!p.noPanel;
    const ms = CD.remaining(p), started = !!(p.endAt || p.pausedMs != null), done = ms <= 0 && started;
    const pt = CD.parts(ms), show3 = p.showHours !== false;
    const title = GS.tov ? GS.tov(p.title || 'SEBENTAR LAGI') : (p.title || 'SEBENTAR LAGI');
    const sec = Math.ceil(ms / 1000);
    // 5 saat terakhir: hanya nombor besar di tengah (tanpa kotak), kemudian START
    if (started && (done || (ms > 0 && sec <= 5))) {
      if (!noPanel) W.panel(ctx, x, y, w, h, t, { phase: 5.1, r: 26, opaque: true }); // latar sama seperti kiraan detik, bukan warna plain
      const cx = x + w / 2, cy = y + h / 2;
      const txt = done ? (p.endText || 'MULA SEKARANG!') : String(sec);
      const frac = done ? 0 : 1 - ((ms % 1000) / 1000), pop = done ? 1 : 1 + 0.35 * Math.pow(1 - frac, 2);
      const size = Math.min(h * (done ? 0.28 : 0.78), w * (done ? 0.14 : 0.5)) * pop;
      if (!done) { ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,' + (0.5 * (1 - frac)).toFixed(2) + ')'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, size * (0.62 + frac * 0.5), 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
      drawDigits(ctx, txt, cx, cy, done ? Math.min(size, w * 0.9 / Math.max(3, txt.length) * 1.6) : size, style === 'box' || style === 'flip' ? 'neon' : style, t);
      return;
    }
    if (!noPanel) W.panel(ctx, x, y, w, h, t, { phase: 5.1, r: 26, opaque: true });
    W.text(ctx, title, x + w / 2, y + h * 0.2, { size: Math.min(h * 0.14, w * 0.075), weight: 900, align: 'center', color: C.text, spacing: 6, maxW: w * 0.9, shadow: noPanel ? '#000' : C.cyan, blur: 18 });
    const units = show3 ? [[pt.h, 'JAM'], [pt.m, 'MINIT'], [pt.s, 'SAAT']] : [[pt.m + pt.h * 60, 'MINIT'], [pt.s, 'SAAT']];
    const n = units.length, gap = w * 0.03, tw = (w * 0.86 - gap * (n - 1)) / n, th = h * 0.42, ty = y + h * 0.3, tx0 = x + (w - (tw * n + gap * (n - 1))) / 2;
    const tiles = style === 'box' || style === 'flip';
    // tanpa kotak: ukur lebar nombor sebenar (fon berbeza lebar berbeza) supaya nombor dan titik bertindih tidak berlaku
    let dsize = Math.min(th * 0.78, tw * 0.62), dcx = null;
    if (!tiles) {
      const meas = (str, sz) => { ctx.save(); ctx.font = '900 ' + sz + 'px ' + W.FONT; if ('letterSpacing' in ctx) ctx.letterSpacing = '0px'; const m = ctx.measureText(str).width; ctx.restore(); return m; };
      const colonOf = (sz) => sz * 0.5;
      const total = (sz) => units.reduce((a2, u) => a2 + Math.max(meas(String(u[0]).padStart(2, '0'), sz), meas('00', sz)), 0) + (n - 1) * (colonOf(sz) + sz * 0.16);
      dsize = Math.min(th * 0.8, h * 0.36);
      if (total(dsize) > w * 0.9) dsize *= (w * 0.9) / total(dsize);
      let cx0 = x + (w - total(dsize)) / 2; dcx = [];
      units.forEach((u) => { const wd = Math.max(meas(String(u[0]).padStart(2, '0'), dsize), meas('00', dsize)); dcx.push([cx0 + wd / 2, wd]); cx0 += wd + colonOf(dsize) + dsize * 0.16; });
    }
    units.forEach(([v, lab], i) => {
      const tx = tx0 + i * (tw + gap), vs = String(v).padStart(2, '0');
      if (style === 'box' || style === 'flip') {
        ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.28)'; W.rr(ctx, tx, ty, tw, th, th * 0.14); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = W.holoGrad(ctx, tx, ty, tw, th, t, i); ctx.stroke();
        if (style === 'flip') { ctx.fillStyle = 'rgba(255,255,255,0.08)'; W.rr(ctx, tx, ty, tw, th / 2, th * 0.14); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(tx, ty + th / 2 - 2, tw, 4); }
        ctx.restore();
      }
      const cxn = tiles ? tx + tw / 2 : dcx[i][0];
      drawDigits(ctx, vs, cxn, ty + th / 2, tiles ? Math.min(th * 0.78, tw * 0.62) : dsize, tiles ? 'box' : style, t);
      if (!tiles && i < n - 1) W.text(ctx, ':', dcx[i][0] + dcx[i][1] / 2 + (dsize * 0.66) / 2, ty + th / 2 + dsize * 0.3, { size: dsize * 0.8, weight: 900, align: 'center', color: 'rgba(255,255,255,0.85)' });
      W.text(ctx, GS.tov ? GS.tov(lab) : lab, cxn, ty + th + h * 0.075, { size: Math.min(h * 0.055, tw * 0.13), weight: 800, align: 'center', color: noPanel ? '#fff' : C.muted, spacing: 3, shadow: noPanel ? '#000' : undefined, blur: 8 });
    });
    W.text(ctx, p.subtitle || 'MOBILE LEGENDS', x + w / 2, y + h * 0.93, { size: Math.min(h * 0.075, w * 0.045), weight: 800, align: 'center', color: noPanel ? '#fff' : C.cyan, spacing: 4, maxW: w * 0.9, shadow: noPanel ? '#000' : undefined, blur: 10 });
  };

  /* bunyi masa untuk countdown yang sedang berjalan di PROGRAM (apa yang penonton nampak) */
  const cdLast = new WeakMap();
  setInterval(() => {
    try {
      const sc = GS.scenes && GS.scenes.program && GS.scenes.program();
      if (!sc) return;
      sc.sources.forEach((src) => {
        if (src.type !== 'widget' || !src.props || src.props.widget !== 'countdown' || src.visible === false) return;
        const p = src.props;
        if (!p.endAt) return;
        const ms = CD.remaining(p), sec = Math.ceil(ms / 1000), last = cdLast.get(p);
        if (last === sec) return;
        cdLast.set(p, sec);
        if (!GS.audio || !GS.audio.sfx) return;
        if (ms <= 0) GS.audio.sfx('go'); else if (sec <= 5) GS.audio.sfx('beep'); else GS.audio.sfx('tick');
      });
    } catch (e) { /* abaikan */ }
  }, 120);

  /* ---------- bot kecil (sumber berasingan di sebelah banner promosi) ---------- */
  W.bot = function (ctx, s, t) {
    // gambar sendiri (anime, kartun, haiwan, foto, apa sahaja) menggantikan bot asal; muat dalam kotak tanpa dipotong
    const own = s.props.img && GS.media.image(s.props.img);
    if (own && own.naturalWidth) {
      const r = Math.min(s.w / own.naturalWidth, s.h / own.naturalHeight);
      const dw = own.naturalWidth * r, dh = own.naturalHeight * r;
      ctx.drawImage(own, s.x + (s.w - dw) / 2, s.y + (s.h - dh) / 2 + Math.sin(t * 0.004) * s.h * 0.02, dw, dh);
      return;
    }
    // bot lalai = gambar watak GS (assets/default-bot.png). Pengguna boleh menggantikannya dengan gambar sendiri (Tukar gambar bot).
    const dflt = GS.media && GS.media.image('assets/default-bot.png');
    if (dflt && dflt.naturalWidth) {
      const r = Math.min(s.w / dflt.naturalWidth, s.h / dflt.naturalHeight);
      const dw = dflt.naturalWidth * r, dh = dflt.naturalHeight * r;
      ctx.drawImage(dflt, s.x + (s.w - dw) / 2, s.y + (s.h - dh) / 2 + Math.sin(t * 0.004) * s.h * 0.02, dw, dh);
      return;
    }
    const size = Math.min(s.w / 1.24, s.h / 1.12) * 0.62;
    W.mascot(ctx, s.x + s.w / 2, s.y + s.h / 2, size, t, s.props.tone === 'gold' ? 'gold' : 'blue');
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
        // peratusan berselang merah dan kuning (baris 1 merah, baris 2 kuning, dan seterusnya)
        const alt = i % 2 === 0 ? '#ff4b5c' : '#ffd24a';
        W.text(ctx, txt(r), cx + cw, ry + rh * 0.55, { size: rh * 0.4, weight: 800, color: alt, align: 'right' });
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(cx, ry + rh * 0.76, cw, 3);
        ctx.fillStyle = alt;
        ctx.fillRect(cx, ry + rh * 0.76, cw * (val(r) / maxv), 3);
        // garis pemisah kelabu antara baris, dari nombor hero hingga hujung peratusan (tidak terlalu terang)
        if (i < rows.length - 1) { ctx.fillStyle = 'rgba(150,158,176,0.55)'; ctx.fillRect(cx, ry + rh - 1, cw, 1.5); }
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
