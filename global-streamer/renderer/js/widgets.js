/* Global Streamer - widget yang dilukis pada kanvas (masuk dalam siaran) */
(function () {
  'use strict';
  const BASE_FONT = '"Segoe UI Variable Display","Segoe UI",system-ui,-apple-system,Roboto,"Helvetica Neue",Arial,sans-serif';
  const C = (GS.colors = { blue: '#2ea8ff', cyan: '#6be6ff', violet: '#7a5cff', red: '#ff3b5c', ink: '#050a18', panel: 'rgba(8,18,40,0.80)', text: '#eaf4ff', muted: '#8aa2c4', gold: '#ffd36b' });
  const W = (GS.widgets = {});
  Object.defineProperty(W, 'FONT', { get: () => W._cur || BASE_FONT, enumerable: true });

  /* ---------- helper lukisan ---------- */
  const rr = (W.rr = function (ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  });

  /* gradien hologram biru -> ungu -> merah yang sentiasa bertukar */
  W.holoGrad = function (ctx, x, y, w, h, t, phase = 0) {
    if (GS.theme && GS.theme.cur && GS.theme.cur.flat) return GS.theme.cur.g[0];   // tema 2D: warna rata, bukan gradien bergerak
    const a = t * 0.00035 + phase;
    const cx = x + w / 2, cy = y + h / 2, r = Math.max(w, h) / 2;
    const g = ctx.createLinearGradient(cx - Math.cos(a) * r, cy - Math.sin(a) * r, cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    const m = 0.5 + 0.22 * Math.sin(t * 0.0009 + phase);
    const th = GS.theme && GS.theme.cur;
    g.addColorStop(0, th ? th.g[0] : C.blue);
    g.addColorStop(m, th ? th.g[1] : C.violet);
    g.addColorStop(1, th ? th.g[2] : C.red);
    return g;
  };

  W.text = function (ctx, str, x, y, o = {}) {
    const size = o.size || 24;
    ctx.save();
    ctx.font = (o.weight || 600) + ' ' + size + 'px ' + W.FONT;
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.baseline || 'alphabetic';
    if ('letterSpacing' in ctx) ctx.letterSpacing = (o.spacing || 0) + 'px';
    ctx.fillStyle = o.color || C.text;
    if (o.shadow) { ctx.shadowColor = o.shadow; ctx.shadowBlur = o.blur || 14; }
    let s = String(str);
    if (o.maxW) {
      let guard = 0;
      while (ctx.measureText(s).width > o.maxW && ctx.font && guard++ < 40) {
        const px = parseFloat(ctx.font.match(/(\d+(\.\d+)?)px/)[1]) - 1;
        if (px < 8) break;
        ctx.font = (o.weight || 600) + ' ' + px + 'px ' + W.FONT;
      }
    }
    ctx.fillText(s, x, y);
    ctx.restore();
  };

  W.panel = function (ctx, x, y, w, h, t, o = {}) {
    const th = GS.theme.cur;
    const r = (o.r != null ? o.r : 16) * th.rscale;
    const a0 = th.mode === 'outline' ? (o.opaque ? 0.93 : 0.42) : th.mode === 'solid' ? 0.97 : o.opaque ? 0.99 : 0.86;
    const a1 = th.mode === 'outline' ? (o.opaque ? 0.95 : 0.5) : th.mode === 'solid' ? 0.99 : o.opaque ? 0.99 : 0.88;
    ctx.save();
    if (o.fill !== false) {
      rr(ctx, x, y, w, h, r);
      const g = ctx.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, 'rgba(' + th.panel[0] + ',' + a0 + ')');
      g.addColorStop(1, 'rgba(' + th.panel[1] + ',' + a1 + ')');
      ctx.fillStyle = g;
      ctx.fill();
    }
    // kilauan menyapu (tiada pada tema 2D)
    ctx.save();
    rr(ctx, x, y, w, h, r);
    ctx.clip();
    if (!th.flat) {
    const sweep = ((t * 0.00028 + (o.phase || 0)) % 1.8) - 0.4;
    const sx = x + sweep * w * 1.2;
    const sg = ctx.createLinearGradient(sx - w * 0.15, y, sx + w * 0.15, y + h);
    sg.addColorStop(0, 'rgba(255,255,255,0)');
    sg.addColorStop(0.5, th.sweep);
    sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(x, y, w, h);
    }
    ctx.restore();
    // sempadan bergradien
    rr(ctx, x + 1.5, y + 1.5, w - 3, h - 3, r);
    ctx.lineWidth = o.lineWidth || th.line;
    ctx.strokeStyle = W.holoGrad(ctx, x, y, w, h, t, o.phase || 0);
    ctx.shadowColor = th.glow;
    ctx.shadowBlur = 16;
    ctx.stroke();
    ctx.restore();
  };

  W.hex = function (ctx, cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 3 * i - Math.PI / 6;
      const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  };

  /* ---------- widget: bingkai ---------- */
  W.frame = function (ctx, s, t) {
    const { x, y, w, h } = s;
    const L = Math.min(46, w * 0.12, h * 0.2);
    ctx.save();
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.strokeStyle = W.holoGrad(ctx, x, y, w, h, t);
    ctx.shadowColor = GS.theme.cur.glow;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(x, y + L); ctx.lineTo(x, y); ctx.lineTo(x + L, y);
    ctx.moveTo(x + w - L, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + L);
    ctx.moveTo(x + w, y + h - L); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - L, y + h);
    ctx.moveTo(x + L, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - L);
    ctx.stroke();
    // garis nipis penuh dengan segmen bergerak
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.45;
    rr(ctx, x, y, w, h, 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    // label
    if (s.props.label) {
      const lw = Math.min(w * 0.5, 22 + s.props.label.length * 13);
      rr(ctx, x + 14, y - 16, lw, 32, 8);
      ctx.fillStyle = 'rgba(5,10,24,0.92)';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = W.holoGrad(ctx, x, y, lw, 32, t, 1);
      ctx.stroke();
      if (s.props.label === 'LIVE') {
        const pulse = 0.55 + 0.45 * Math.sin(t * 0.006);
        ctx.fillStyle = 'rgba(255,59,92,' + pulse.toFixed(2) + ')';
        ctx.beginPath();
        ctx.arc(x + 32, y, 6, 0, Math.PI * 2);
        ctx.fill();
        W.text(ctx, 'LIVE', x + 46, y + 6, { size: 17, weight: 700, spacing: 3 });
      } else {
        W.text(ctx, s.props.label, x + 14 + lw / 2, y + 6, { size: 16, weight: 700, spacing: 3, align: 'center', color: C.cyan, maxW: lw - 16 });
      }
    }
    ctx.restore();
  };

  /* ---------- widget: jam & masa main ---------- */
  W.clock = function (ctx, s, t) {
    const { x, y, w, h } = s;
    W.panel(ctx, x, y, w, h, t, { phase: 0.4 });
    const now = new Date();
    const hm = GS.pad(now.getHours()) + ':' + GS.pad(now.getMinutes());
    const sec = GS.pad(now.getSeconds());
    const meas = (str, size, wt) => { ctx.save(); ctx.font = wt + ' ' + size + 'px ' + W.FONT; const m = ctx.measureText(str).width; ctx.restore(); return m; };
    // kiri: jam + saat muat dalam 54% lebar; kanan: masa main dilaras kanan supaya tidak bertindih walau fon lebar
    let big = h * 0.5;
    const leftMax = w * 0.46;
    const need = (b) => meas(hm, b, 700) + 6 + meas(sec, b * 0.42, 600);
    if (need(big) > leftMax) big *= leftMax / need(big);
    W.text(ctx, hm, x + w * 0.05, y + h * 0.62, { size: big, weight: 700, color: C.text, shadow: 'rgba(80,170,255,.8)', blur: 18 });
    const tw = meas(hm, big, 700);
    W.text(ctx, sec, x + w * 0.05 + tw + 6, y + h * 0.62, { size: big * 0.42, weight: 600, color: C.cyan });
    const rxr = x + w * 0.95, rzone = w * 0.34;
    W.text(ctx, GS.tov('MASA MAIN'), rxr, y + h * 0.36, { size: Math.max(11, h * 0.14), weight: 700, spacing: 2.5, color: C.muted, align: 'right', maxW: rzone });
    W.text(ctx, GS.fmtDur((Date.now() - GS.state.sessionStart) / 1000), rxr, y + h * 0.68, { size: h * 0.3, weight: 700, color: C.gold, maxW: rzone, align: 'right' });
  };

  /* ---------- widget: menang / kalah ---------- */
  W.winloss = function (ctx, s, t) {
    const { x, y, w, h } = s;
    W.panel(ctx, x, y, w, h, t, { phase: 1.1 });
    const wl = GS.state.winloss;
    const total = wl.win + wl.loss;
    const wr = total ? Math.round((wl.win / total) * 100) : 0;
    let num = h * 0.5;
    const measW = (str, size) => { ctx.save(); ctx.font = '800 ' + size + 'px ' + W.FONT; const m = ctx.measureText(String(str)).width; ctx.restore(); return m; };
    const widest = Math.max(measW(wl.win, num), measW(wl.loss, num));
    if (widest > w * 0.24) num *= (w * 0.24) / widest;
    W.text(ctx, 'WIN', x + w * 0.08, y + h * 0.3, { size: Math.max(11, h * 0.15), weight: 800, spacing: 3, color: C.cyan });
    W.text(ctx, wl.win, x + w * 0.08, y + h * 0.78, { size: num, weight: 800, color: C.text, shadow: 'rgba(80,190,255,.9)', blur: 18 });
    W.text(ctx, 'LOSE', x + w * 0.92, y + h * 0.3, { size: Math.max(11, h * 0.15), weight: 800, spacing: 3, color: C.red, align: 'right' });
    W.text(ctx, wl.loss, x + w * 0.92, y + h * 0.78, { size: num, weight: 800, color: C.text, align: 'right', shadow: 'rgba(255,60,100,.9)', blur: 18 });
    // tengah: WR + streak
    const midW = Math.max(30, w - 2 * (w * 0.08 + Math.max(measW(wl.win, num), measW(wl.loss, num)) + 10));
    W.text(ctx, 'WR ' + wr + '%', x + w / 2, y + h * 0.44, { size: Math.max(12, h * 0.19), weight: 800, align: 'center', color: wr >= 50 ? C.gold : C.muted, maxW: midW });
    const st = wl.streak;
    const stTxt = st > 0 ? GS.tov('MENANG ×{0}', st) : st < 0 ? GS.tov('KALAH ×{0}', Math.abs(st)) : '—';
    W.text(ctx, stTxt, x + w / 2, y + h * 0.74, { size: Math.max(10, h * 0.13), weight: 700, spacing: 1.5, align: 'center', color: st < 0 ? C.red : C.muted, maxW: midW });
    // bar WR
    const bx = x + w * 0.3, bw = w * 0.4, by = y + h * 0.86;
    ctx.save();
    rr(ctx, bx, by, bw, 5, 3); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill();
    if (total) { rr(ctx, bx, by, Math.max(6, bw * (wl.win / total)), 5, 3); ctx.fillStyle = W.holoGrad(ctx, bx, by, bw, 5, t); ctx.fill(); }
    ctx.restore();
  };

  /* ---------- widget: logo ---------- */
  W.logo = function (ctx, s, t) {
    const { x, y, w, h } = s;
    const im = GS.state.logo && GS.media.image(GS.state.logo);
    if (im) {
      // logo PNG pengguna: tanpa bingkai/sempadan asal, hanya gambar (lutsinar dikekalkan)
      const r = Math.min(w / im.naturalWidth, h / im.naturalHeight);
      const dw = im.naturalWidth * r, dh = im.naturalHeight * r;
      ctx.drawImage(im, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
      return;
    }
    if (GS.state.logo) return; // logo sedang dimuat
    W.panel(ctx, x, y, w, h, t, { phase: 2 });
    // logo lalai (vektor asli)
    const cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) * 0.36;
    ctx.save();
    W.hex(ctx, cx, cy, r);
    ctx.lineWidth = r * 0.14;
    ctx.strokeStyle = W.holoGrad(ctx, cx - r, cy - r, r * 2, r * 2, t);
    ctx.shadowColor = 'rgba(80,160,255,.9)';
    ctx.shadowBlur = 16;
    ctx.stroke();
    ctx.restore();
    W.text(ctx, 'GS', cx, cy + r * 0.3, { size: r * 0.85, weight: 800, align: 'center', color: C.text, spacing: 1 });
  };

  /* ---------- widget: tajuk / jenama ---------- */
  W.brand = function (ctx, s, t) {
    const { x, y, w, h } = s;
    W.panel(ctx, x, y, w, h, t, { phase: 2.6 });
    const g = GS.games[GS.state.game];
    W.text(ctx, GS.tov(s.props.text || 'GLOBAL STREAMER').toUpperCase(), x + w / 2, y + h * 0.5, { size: h * 0.3, weight: 800, spacing: 3, align: 'center', color: C.text, maxW: w * 0.86, shadow: 'rgba(80,170,255,.7)' });
    W.text(ctx, (g ? g.short : '') + ' · LIVE', x + w / 2, y + h * 0.78, { size: h * 0.15, weight: 700, spacing: 4, align: 'center', color: C.cyan, maxW: w * 0.86 });
  };

  /* ---------- widget: bar teks bergerak ---------- */
  W.ticker = function (ctx, s, t) {
    const { x, y, w, h } = s, p = s.props || {};
    W.panel(ctx, x, y, w, h, t, { phase: 3.3, r: h / 2.6 });
    const msgs = (GS.state.ticker.messages || []).filter(Boolean);
    const badge = p.badge || 'left', align = p.align || 'left', sc = (p.textScale || 100) / 100;
    const chipW = badge === 'none' ? 0 : h * 1.7;
    const bx = (badge === 'right' ? x + w - chipW - 10 : x + 10) + (p.badgeDx || 0), by = y + 10 + (p.badgeDy || 0);
    if (badge !== 'none') {
      ctx.save();
      rr(ctx, bx, by, chipW, h - 20, (h - 20) / 2.4);
      ctx.fillStyle = W.holoGrad(ctx, bx, by, chipW, h - 20, t, 0.5);
      ctx.fill();
      ctx.restore();
      W.text(ctx, 'INFO', bx + chipW / 2, by + (h - 20) * 0.6, { size: h * 0.3, weight: 800, spacing: 4, align: 'center', color: '#fff' });
    }
    if (!msgs.length) return;
    const period = 4200;
    const idx = Math.floor(t / period) % msgs.length;
    const ph = (t % period) / period;
    const inP = GS.clamp(ph / 0.09, 0, 1), outP = GS.clamp((ph - 0.9) / 0.1, 0, 1);
    const ease = 1 - Math.pow(1 - inP, 3);
    // kawasan tulisan: antara butang INFO dan tepi bar
    const left = x + 24 + (badge === 'left' ? chipW + 10 : 0), right = x + w - 24 - (badge === 'right' ? chipW + 10 : 0);
    const maxW = Math.max(40, right - left);
    const tx = (align === 'center' ? (left + right) / 2 : align === 'right' ? right : left) + (p.textDx || 0);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 6, y + 4, w - 12, h - 8);
    ctx.clip();
    ctx.globalAlpha = (1 - outP) * ease;
    W.text(ctx, GS.tov(msgs[idx]).toUpperCase(), tx, y + h * 0.64 + (p.textDy || 0) + (1 - ease) * h * 0.5 - outP * h * 0.5, { size: h * 0.42 * sc, weight: 800, spacing: 2, align, maxW });
    ctx.restore();
  };

  /* dispatcher */
  W.draw = function (ctx, s, t) {
    const fn = W[s.props.widget];
    if (typeof fn === 'function' && fn !== W.draw) {
      W._cur = s.props.font && GS.fonts ? GS.fonts.css(s.props.font) : null;
      try { fn(ctx, s, t); } finally { W._cur = null; }
    }
  };
})();
