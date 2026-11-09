/* Global Streamer - enjin efek skrin (kill, mati, victory, defeat, item). Dilukis pada kanvas Program. */
(function () {
  'use strict';
  const FX = (GS.fx = { active: [] });
  const TAU = Math.PI * 2;
  const clamp = GS.clamp;
  const easeOut = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
  const easeBack = (x) => { x = clamp(x, 0, 1); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* palet gaya (setiap template ada gaya efek sendiri) */
  const PAL = {
    holo: { main: '#2ea8ff', light: '#d4f1ff', accent: '#ff3b5c', glow: 'rgba(70,160,255,0.9)', band: ['#08183a', '#143a8a', '#3a1250'], fire: ['#fff6c8', '#ffb13b', '#ff3b5c'] },
    crimson: { main: '#ff3b5c', light: '#ffe1e6', accent: '#ffb13b', glow: 'rgba(255,60,90,0.9)', band: ['#3a0612', '#a3122e', '#3a0612'], fire: ['#fff1b8', '#ff8a3b', '#d6173b'] },
    gold: { main: '#ffb13b', light: '#fff2c9', accent: '#ff6a3b', glow: 'rgba(255,190,70,0.9)', band: ['#2e1c04', '#8a5a10', '#2e1c04'], fire: ['#ffffff', '#ffd36b', '#ff7a2b'] },
  };

  FX.styleNow = function () {
    const sc = GS.scenes && GS.scenes.program && GS.scenes.program();
    return (sc && sc.fxStyle) || 'holo';
  };

  GS.recordResult = function (res) {
    const wl = GS.state.winloss;
    if (res === 'win') { wl.win++; wl.streak = wl.streak > 0 ? wl.streak + 1 : 1; }
    else { wl.loss++; wl.streak = wl.streak < 0 ? wl.streak - 1 : -1; }
    GS.save();
    GS.emit('winloss:changed');
  };

  /* ---------- teks tajuk besar ---------- */
  function title(ctx, str, cx, cy, size, pal, now, o = {}) {
    ctx.save();
    ctx.font = '900 ' + size + 'px ' + GS.widgets.FONT;
    if ('letterSpacing' in ctx) ctx.letterSpacing = (o.spacing || size * 0.06) + 'px';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let tw = ctx.measureText(str).width;
    const maxW = o.maxW || 1700;
    if (tw > maxW) { size *= maxW / tw; ctx.font = '900 ' + size + 'px ' + GS.widgets.FONT; tw = ctx.measureText(str).width; }
    const g = ctx.createLinearGradient(0, cy - size / 2, 0, cy + size / 2);
    g.addColorStop(0, o.top || '#ffffff');
    g.addColorStop(0.5, o.mid || pal.light);
    g.addColorStop(1, o.bot || pal.main);
    ctx.shadowColor = o.glow || pal.glow;
    ctx.shadowBlur = Math.min(34, size * 0.22);
    ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.07;
    ctx.strokeStyle = 'rgba(4,8,20,0.9)';
    ctx.strokeText(str, cx, cy);
    ctx.fillStyle = g;
    ctx.fillText(str, cx, cy);
    ctx.shadowBlur = 0;
    // kilauan menyapu
    const sp = ((now * 0.0007) % 1.6) - 0.3;
    const sg = ctx.createLinearGradient(cx - tw / 2, 0, cx + tw / 2, 0);
    const a = clamp(sp, 0, 1);
    sg.addColorStop(0, 'rgba(255,255,255,0)');
    sg.addColorStop(clamp(a - 0.1, 0, 1), 'rgba(255,255,255,0)');
    sg.addColorStop(a, 'rgba(255,255,255,0.85)');
    sg.addColorStop(clamp(a + 0.1, 0, 1), 'rgba(255,255,255,0)');
    sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg;
    ctx.fillText(str, cx, cy);
    ctx.restore();
    return tw;
  }

  /* ---------- zarah ---------- */
  const blobCache = {};
  function blob(col) {
    if (!blobCache[col]) {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const g = c.getContext('2d');
      const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, col);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, 64, 64);
      blobCache[col] = c;
    }
    return blobCache[col];
  }
  function drawParts(ctx, parts, mode) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of parts) {
      const r = clamp(p.age / p.life, 0, 1);
      const a = (1 - r) * (p.alpha || 1);
      if (mode === 'fire') {
        const s = p.size * (1 - r * 0.7);
        const col = r < 0.35 ? p.cols[0] : r < 0.7 ? p.cols[1] : p.cols[2];
        ctx.globalAlpha = a;
        ctx.drawImage(blob(col), p.x - s, p.y - s, s * 2, s * 2);
      } else if (mode === 'spark') {
        ctx.globalAlpha = a;
        ctx.fillStyle = p.col;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.5, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (mode === 'ash') {
        ctx.globalAlpha = a * 0.7;
        ctx.fillStyle = p.col;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  function stepParts(parts, dt, grav) {
    for (const p of parts) {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (grav || 0) * dt;
      if (p.rot != null) p.rot += (p.vr || 0) * dt;
    }
    for (let i = parts.length - 1; i >= 0; i--) if (parts[i].age >= parts[i].life) parts.splice(i, 1);
  }

  /* ================== KILL (api) ================== */
  function drawKill(ctx, e, p, now, W, H, dt) {
    const pal = e.pal;
    const label = (e.params.label || 'KILL').toUpperCase();
    const inP = easeBack(p / 0.14), outP = clamp((p - 0.82) / 0.18, 0, 1);
    const alpha = 1 - outP;
    const cx = W / 2, cy = H * 0.6, bh = 170;
    // nyala di tepi skrin
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * 0.9 * clamp(p / 0.1, 0, 1);
    for (const sx of [0, W]) {
      const rad = 640 + Math.sin(now * 0.02) * 40;
      const g = ctx.createRadialGradient(sx, H, 0, sx, H, rad);
      g.addColorStop(0, 'rgba(255,170,60,0.55)');
      g.addColorStop(0.5, 'rgba(255,60,40,0.22)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(sx - rad, H - rad, rad * 2, rad); // hanya kawasan yang terkesan
    }
    ctx.restore();
    // jalur
    ctx.save();
    ctx.globalAlpha = alpha;
    const bw = W * 0.78 * clamp(inP, 0, 1.04);
    const bx = cx - bw / 2;
    const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    g.addColorStop(0, 'rgba(8,12,28,0)');
    g.addColorStop(0.15, pal.band[0] + 'ee');
    g.addColorStop(0.5, pal.band[1] + 'f2');
    g.addColorStop(0.85, pal.band[2] + 'ee');
    g.addColorStop(1, 'rgba(8,12,28,0)');
    ctx.fillStyle = g;
    ctx.fillRect(bx, cy - bh / 2, bw, bh);
    ctx.lineWidth = 3;
    ctx.strokeStyle = GS.widgets.holoGrad(ctx, bx, cy - bh / 2, bw, bh, now);
    ctx.shadowColor = pal.glow;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(bx, cy - bh / 2); ctx.lineTo(bx + bw, cy - bh / 2);
    ctx.moveTo(bx, cy + bh / 2); ctx.lineTo(bx + bw, cy + bh / 2);
    ctx.stroke();
    ctx.restore();
    // zarah api
    if (p < 0.8) {
      const n = Math.floor(rnd(2, 5) * (dt * 60));
      const half = Math.min(700, bw * 0.45);
      for (let i = 0; i < n; i++) {
        e.parts.push({ x: cx + rnd(-half, half), y: cy + bh * 0.25, vx: rnd(-40, 40), vy: -rnd(140, 420), age: 0, life: rnd(0.7, 1.4), size: rnd(22, 52), cols: pal.fire, alpha: 0.9 });
      }
    }
    stepParts(e.parts, dt, -60);
    ctx.save(); ctx.globalAlpha = alpha; drawParts(ctx, e.parts, 'fire'); ctx.restore();
    // teks
    ctx.save();
    ctx.globalAlpha = alpha;
    const sc = 1.5 - 0.5 * clamp(inP, 0, 1);
    ctx.translate(cx, cy);
    ctx.scale(sc, sc);
    title(ctx, label, 0, -4, 128, pal, now, { top: '#ffffff', mid: '#ffe7a8', bot: '#ff7a2b', glow: 'rgba(255,120,40,0.95)', maxW: bw * 0.9 / sc });
    GS.widgets.text(ctx, e.params.sub || 'MUSUH TUMBANG', 0, bh / 2 - 14, { size: 22, weight: 700, spacing: 8, align: 'center', color: pal.light });
    ctx.restore();
  }

  /* ================== MATI (petir) ================== */
  function genBolt(x0, y0, x1, y1, disp, depth, out) {
    if (depth === 0) { out.push([x1, y1]); return; }
    const mx = (x0 + x1) / 2 + rnd(-disp, disp), my = (y0 + y1) / 2 + rnd(-disp * 0.25, disp * 0.25);
    genBolt(x0, y0, mx, my, disp / 2, depth - 1, out);
    genBolt(mx, my, x1, y1, disp / 2, depth - 1, out);
  }
  function drawDeath(ctx, e, p, now, W, H, dt) {
    const pal = e.pal;
    const out = clamp((p - 0.8) / 0.2, 0, 1), alpha = 1 - out;
    // kilat putih
    const flash = p < 0.1 ? 1 - p / 0.1 : (Math.sin(now * 0.045) > 0.93 && p < 0.55 ? 0.35 : 0);
    // redup + biru
    ctx.save();
    ctx.fillStyle = 'rgba(6,10,40,' + (0.5 * alpha * easeOut(p / 0.15)).toFixed(3) + ')';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    if (flash > 0) { ctx.save(); ctx.fillStyle = 'rgba(220,240,255,' + (flash * 0.85).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    // petir (jana semula setiap ~70ms)
    if (p < 0.6 && now - (e.lastBolt || 0) > 70) {
      e.lastBolt = now;
      e.bolts = [];
      const n = 3;
      for (let i = 0; i < n; i++) {
        const x0 = W * (0.25 + 0.25 * i) + rnd(-90, 90);
        const pts = [[x0, -20]];
        genBolt(x0, -20, W / 2 + rnd(-260, 260), H * 0.52 + rnd(-40, 40), 260, 6, pts);
        e.bolts.push(pts);
        // cabang
        const k = Math.floor(rnd(pts.length * 0.3, pts.length * 0.7));
        const br = [pts[k]];
        genBolt(pts[k][0], pts[k][1], pts[k][0] + rnd(-300, 300), pts[k][1] + rnd(120, 320), 120, 4, br);
        e.bolts.push(br);
      }
    }
    if (e.bolts && p < 0.62) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineJoin = 'round';
      for (const pts of e.bolts) {
        for (const pass of [[18, pal.glow], [7, pal.main], [2.5, '#ffffff']]) {
          ctx.lineWidth = pass[0];
          ctx.strokeStyle = pass[1];
          ctx.globalAlpha = 0.6 * alpha;
          ctx.beginPath();
          pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
          ctx.stroke();
        }
      }
      ctx.restore();
    }
    // cincin elektrik
    const rp = easeOut(p / 0.5);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = (1 - rp) * alpha;
    ctx.lineWidth = 8;
    ctx.strokeStyle = pal.main;
    ctx.beginPath();
    ctx.ellipse(W / 2, H * 0.52, 80 + rp * 700, 30 + rp * 240, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
    // teks (bergetar)
    const tp = easeBack((p - 0.08) / 0.15);
    if (tp > 0) {
      ctx.save();
      ctx.globalAlpha = alpha;
      const shake = p < 0.5 ? rnd(-5, 5) : 0;
      ctx.translate(W / 2 + shake, H * 0.52 + (p < 0.5 ? rnd(-3, 3) : 0));
      ctx.scale(0.6 + 0.4 * tp, 0.6 + 0.4 * tp);
      title(ctx, (e.params.label || 'ELIMINATED').toUpperCase(), 0, 0, 150, pal, now, { top: '#ffffff', mid: '#bfe8ff', bot: pal.main, glow: pal.glow });
      GS.widgets.text(ctx, e.params.sub || 'HERO KITA TUMBANG', 0, 96, { size: 24, weight: 700, spacing: 8, align: 'center', color: '#bfe8ff' });
      ctx.restore();
    }
  }

  /* ================== VICTORY ================== */
  function drawVictory(ctx, e, p, now, W, H, dt) {
    const pal = e.pal;
    const out = clamp((p - 0.88) / 0.12, 0, 1), alpha = 1 - out;
    const cx = W / 2, cy = H * 0.46;
    ctx.save();
    ctx.fillStyle = 'rgba(2,8,28,' + (0.62 * alpha * easeOut(p / 0.12)).toFixed(3) + ')';
    ctx.fillRect(0, 0, W, H);
    // sinar berputar
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * easeOut(p / 0.2) * 0.55;
    const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 1300);
    rg.addColorStop(0, 'rgba(255,235,170,0.65)');
    rg.addColorStop(0.45, 'rgba(110,190,255,0.25)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    for (let i = 0; i < 14; i++) {
      const a = (TAU / 14) * i + now * 0.00028;
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, 1400, a, a + 0.1);
      ctx.closePath();
    }
    ctx.fill();
    ctx.restore();
    // cincin gelombang
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 3; k++) {
      const rp = (p * (e.dur / 1000) - 0.15 - k * 0.3) / 1.5;
      if (rp <= 0 || rp >= 1) continue;
      ctx.globalAlpha = (1 - rp) * 0.8 * alpha;
      ctx.lineWidth = 3 + 14 * (1 - rp);
      ctx.strokeStyle = k % 2 ? pal.main : '#ffe9a8';
      ctx.beginPath();
      ctx.arc(cx, cy, rp * 950, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    // serpihan jatuh
    if (p < 0.8) {
      const n = Math.floor(rnd(1, 4) * dt * 60);
      for (let i = 0; i < n; i++) e.parts.push({ x: rnd(0, W), y: -20, vx: rnd(-40, 40), vy: rnd(120, 340), age: 0, life: rnd(2.2, 4), size: rnd(5, 13), rot: rnd(0, TAU), vr: rnd(-3, 3), col: ['#ffe9a8', '#ffffff', pal.main][Math.floor(rnd(0, 3))], alpha: 0.9 });
    }
    stepParts(e.parts, dt, 25);
    ctx.save(); ctx.globalAlpha = alpha; drawParts(ctx, e.parts, 'spark'); ctx.restore();
    // teks
    const tp = easeBack(p / 0.2);
    ctx.save();
    ctx.globalAlpha = alpha * clamp(p / 0.06, 0, 1);
    ctx.translate(cx, cy);
    const sc = 2.2 - 1.2 * clamp(tp, 0, 1.05);
    ctx.scale(sc, sc);
    title(ctx, 'VICTORY', 0, 0, 250, pal, now, { top: '#ffffff', mid: '#ffe9a8', bot: '#ffa43b', glow: 'rgba(255,200,90,0.95)', spacing: 16 });
    ctx.restore();
    const wl = GS.state.winloss;
    ctx.save();
    ctx.globalAlpha = alpha * easeOut((p - 0.18) / 0.12);
    GS.widgets.text(ctx, 'MENANG · W' + wl.win + ' – L' + wl.loss, cx, cy + 190, { size: 40, weight: 800, spacing: 10, align: 'center', color: '#ffe9a8', shadow: 'rgba(255,200,90,.8)' });
    ctx.restore();
  }

  /* ================== DEFEAT ================== */
  function drawDefeat(ctx, e, p, now, W, H, dt) {
    const pal = e.pal;
    const out = clamp((p - 0.86) / 0.14, 0, 1), alpha = 1 - out;
    const cy = H * 0.5;
    ctx.save();
    ctx.globalAlpha = alpha * easeOut(p / 0.15);
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.95);
    v.addColorStop(0, 'rgba(10,0,6,0.35)');
    v.addColorStop(1, 'rgba(120,0,24,0.78)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    // retakan
    if (!e.cracks) {
      e.cracks = [];
      for (let i = 0; i < 9; i++) { const pts = [[W / 2, cy]]; const a = (TAU / 9) * i + rnd(-0.2, 0.2); genBolt(W / 2, cy, W / 2 + Math.cos(a) * rnd(500, 1000), cy + Math.sin(a) * rnd(300, 600), 90, 4, pts); e.cracks.push(pts); }
    }
    ctx.save();
    ctx.globalAlpha = alpha * 0.55 * easeOut((p - 0.05) / 0.2);
    ctx.strokeStyle = '#ff8a9c';
    ctx.lineWidth = 2;
    const lim = Math.floor(easeOut((p - 0.05) / 0.25) * 17) + 1;
    e.cracks.forEach((pts) => { ctx.beginPath(); pts.slice(0, lim).forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke(); });
    ctx.restore();
    // jalur merah menyapu dari kiri
    const bh = 220;
    const bp = easeOut(p / 0.16);
    ctx.save();
    ctx.globalAlpha = alpha;
    const x0 = -W + bp * W;
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, 'rgba(60,4,16,0)');
    g.addColorStop(0.12, '#4a0818');
    g.addColorStop(0.5, '#b3122e');
    g.addColorStop(0.88, '#4a0818');
    g.addColorStop(1, 'rgba(60,4,16,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x0, cy - bh / 2, W, bh);
    ctx.fillStyle = 'rgba(255,200,210,0.75)';
    ctx.fillRect(x0 + W * 0.1, cy - bh / 2, W * 0.8, 3);
    ctx.fillRect(x0 + W * 0.1, cy + bh / 2 - 3, W * 0.8, 3);
    ctx.restore();
    // teks + glitch
    const tp = easeOut((p - 0.04) / 0.16);
    if (tp > 0) {
      ctx.save();
      ctx.globalAlpha = alpha * tp;
      ctx.translate((1 - tp) * -300, 0);
      const glitch = p < 0.7 && Math.floor(now / 90) % 9 === 0;
      if (glitch) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha *= 0.6;
        title(ctx, 'DEFEAT', W / 2 - 8, cy, 190, { main: '#00e5ff', light: '#00e5ff', glow: 'rgba(0,229,255,.6)' }, now, { top: '#00e5ff', mid: '#00e5ff', bot: '#00e5ff', spacing: 24 });
        title(ctx, 'DEFEAT', W / 2 + 8, cy, 190, { main: '#ff2244', light: '#ff2244', glow: 'rgba(255,34,68,.6)' }, now, { top: '#ff2244', mid: '#ff2244', bot: '#ff2244', spacing: 24 });
        ctx.restore();
      }
      title(ctx, 'DEFEAT', W / 2, cy, 190, pal, now, { top: '#ffffff', mid: '#ffd0d8', bot: '#ff6b84', glow: 'rgba(255,40,80,0.9)', spacing: 24 });
      const wl = GS.state.winloss;
      GS.widgets.text(ctx, 'KALAH · W' + wl.win + ' – L' + wl.loss, W / 2, cy + bh / 2 + 54, { size: 36, weight: 800, spacing: 10, align: 'center', color: '#ffb3c0' });
      ctx.restore();
    }
    // abu jatuh
    if (p < 0.8) {
      const n = Math.floor(rnd(0, 3) * dt * 60);
      for (let i = 0; i < n; i++) e.parts.push({ x: rnd(0, W), y: -10, vx: rnd(-30, 10), vy: rnd(40, 140), age: 0, life: rnd(3, 5), size: rnd(2, 6), col: Math.random() > 0.5 ? '#ff6b84' : '#9aa4c0' });
    }
    stepParts(e.parts, dt, 10);
    ctx.save(); ctx.globalAlpha = alpha; drawParts(ctx, e.parts, 'ash'); ctx.restore();
  }

  /* ================== ITEM PENUH ================== */
  const catColor = { attack: '#ff6a3b', magic: '#9a7bff', defense: '#2ea8ff', movement: '#3be39a', potion: '#ffd36b' };
  function initials(name) {
    return String(name).split(/[\s'’-]+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  }
  function drawFullItem(ctx, e, p, now, W, H, dt) {
    const pal = e.pal;
    const inP = easeBack(p / 0.12), outP = clamp((p - 0.88) / 0.12, 0, 1);
    const alpha = 1 - outP;
    const items = (e.params.items && e.params.items.length ? e.params.items : defaultBuild()).slice(0, 6);
    const cw = 1240, ch = 330, cx = W / 2;
    const cy = H * 0.46 + (1 - clamp(inP, 0, 1)) * -200 - outP * 120;
    ctx.save();
    ctx.globalAlpha = alpha;
    GS.widgets.panel(ctx, cx - cw / 2, cy - ch / 2, cw, ch, now, { r: 26 });
    const filled = items.map((_, i) => easeBack((p - 0.14 - i * 0.075) / 0.09));
    const allDone = p > 0.14 + 6 * 0.075 + 0.05;
    // slot hex
    const gap = 180, x0 = cx - gap * 2.5, hy = cy + 22;
    for (let i = 0; i < 6; i++) {
      const fx = x0 + gap * i, f = clamp(filled[i] || 0, 0, 1.15);
      ctx.save();
      GS.widgets.hex(ctx, fx, hy, 70);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(160,200,255,0.35)';
      ctx.stroke();
      if (f > 0) {
        const it = items[i];
        const col = (it && catColor[it.cat]) || pal.main;
        ctx.translate(fx, hy);
        ctx.scale(f, f);
        GS.widgets.hex(ctx, 0, 0, 64);
        const g = ctx.createRadialGradient(0, -10, 6, 0, 0, 70);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.35, col);
        g.addColorStop(1, '#0a1230');
        ctx.fillStyle = g;
        ctx.shadowColor = col;
        ctx.shadowBlur = 26;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.scale(1 / f, 1 / f);
        GS.widgets.text(ctx, initials(it && it.name), 0, 12, { size: 38, weight: 800, align: 'center', color: '#0a1230' });
      }
      ctx.restore();
    }
    // tajuk
    if (allDone) {
      const pulse = 1 + 0.04 * Math.sin(now * 0.012);
      ctx.save();
      ctx.translate(cx, cy - ch / 2 + 62);
      ctx.scale(pulse, pulse);
      title(ctx, 'ITEM PENUH!', 0, 0, 92, pal, now, { top: '#ffffff', mid: '#ffe9a8', bot: '#ffa43b', glow: 'rgba(255,200,90,.9)', spacing: 8 });
      ctx.restore();
      GS.widgets.text(ctx, '6 / 6 · BUILD LENGKAP', cx, cy + ch / 2 - 26, { size: 22, weight: 700, spacing: 8, align: 'center', color: pal.light });
    } else {
      GS.widgets.text(ctx, 'MEMBINA ITEM…', cx, cy - ch / 2 + 56, { size: 36, weight: 800, spacing: 8, align: 'center', color: pal.light });
      const cnt = Math.min(6, filled.filter((f) => f > 0.3).length);
      GS.widgets.text(ctx, cnt + ' / 6', cx, cy + ch / 2 - 26, { size: 22, weight: 700, spacing: 8, align: 'center', color: pal.light });
    }
    ctx.restore();
    // kilat apabila siap
    if (allDone && !e.burst) { e.burst = true; for (let i = 0; i < 60; i++) e.parts.push({ x: cx + rnd(-500, 500), y: cy, vx: rnd(-260, 260), vy: rnd(-420, -60), age: 0, life: rnd(0.8, 1.6), size: rnd(5, 12), rot: rnd(0, TAU), vr: rnd(-6, 6), col: ['#ffe9a8', '#ffffff', pal.main][i % 3], alpha: 1 }); }
    stepParts(e.parts, dt, 520);
    ctx.save(); ctx.globalAlpha = alpha; drawParts(ctx, e.parts, 'spark'); ctx.restore();
  }
  function defaultBuild() {
    const names = ['Blade of Despair', 'Windtalker', 'Berserker\'s Fury', 'Hunter Strike', 'Immortality', 'Warrior Boots'];
    const all = GS.data.mlbbItems || [];
    return names.map((n) => all.find((i) => i.name === n) || { name: n, cat: 'attack' });
  }

  /* ================== BELI ITEM ================== */
  function drawItemBuy(ctx, e, p, now, W, H) {
    const pal = e.pal;
    const it = e.params.item || { name: 'Blade of Despair', cat: 'attack' };
    const inP = easeOut(p / 0.12), outP = easeOut((p - 0.84) / 0.14);
    const cw = 720, chh = 156;
    const x = W + 30 - (cw + 70) * inP + outP * (cw + 100), y = H * 0.2;
    ctx.save();
    GS.widgets.panel(ctx, x, y, cw, chh, now, { r: 22 });
    const col = catColor[it.cat] || pal.main;
    const hx = x + 96, hy = y + chh / 2;
    GS.widgets.hex(ctx, hx, hy, 58);
    const g = ctx.createRadialGradient(hx, hy - 12, 6, hx, hy, 66);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, col); g.addColorStop(1, '#0a1230');
    ctx.fillStyle = g; ctx.shadowColor = col; ctx.shadowBlur = 24; ctx.fill(); ctx.shadowBlur = 0;
    ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
    GS.widgets.text(ctx, initials(it.name), hx, hy + 11, { size: 34, weight: 800, align: 'center', color: '#0a1230' });
    GS.widgets.text(ctx, 'ITEM DIBELI', x + 188, y + 52, { size: 20, weight: 800, spacing: 6, color: pal.light });
    GS.widgets.text(ctx, it.name.toUpperCase(), x + 188, y + 100, { size: 44, weight: 800, maxW: cw - 220, shadow: 'rgba(80,170,255,.7)' });
    const cat = (GS.data.mlbbItemCats && GS.data.mlbbItemCats[it.cat]) || '';
    if (cat) GS.widgets.text(ctx, cat.toUpperCase(), x + 188, y + 134, { size: 18, weight: 700, spacing: 5, color: col });
    // bar masa
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x + 24, y + chh - 12, cw - 48, 4);
    ctx.fillStyle = col; ctx.fillRect(x + 24, y + chh - 12, (cw - 48) * (1 - clamp((p - 0.12) / 0.72, 0, 1)), 4);
    ctx.restore();
  }

  /* ================== NOTIS KECIL (follow / gift) ================== */
  function drawAlert(ctx, e, p, now, W) {
    const inP = easeBack(p / 0.12), outP = easeOut((p - 0.85) / 0.15);
    const w = 620, h = 84, x = W / 2 - w / 2, y = 44 - (1 - clamp(inP, 0, 1)) * 140 - outP * 140;
    ctx.save();
    GS.widgets.panel(ctx, x, y, w, h, now, { r: 42 });
    GS.widgets.text(ctx, (e.params.title || 'TERIMA KASIH').toUpperCase(), x + w / 2, y + 34, { size: 18, weight: 800, spacing: 6, align: 'center', color: e.pal.light });
    GS.widgets.text(ctx, e.params.name || '@penonton', x + w / 2, y + 66, { size: 28, weight: 800, align: 'center', maxW: w - 60 });
    ctx.restore();
  }

  const defs = {
    kill: { dur: 2900, draw: drawKill, sfx: 'kill' },
    death: { dur: 2600, draw: drawDeath, sfx: 'death' },
    victory: { dur: 6000, draw: drawVictory, sfx: 'victory' },
    defeat: { dur: 5600, draw: drawDefeat, sfx: 'defeat' },
    fullitem: { dur: 4600, draw: drawFullItem, sfx: 'fullitem' },
    itembuy: { dur: 3400, draw: drawItemBuy, sfx: 'itembuy' },
    alert: { dur: 3400, draw: drawAlert, sfx: 'alert' },
  };
  FX.names = Object.keys(defs);

  FX.trigger = function (name, params = {}) {
    const def = defs[name];
    if (!def) { console.warn('[GS] efek tidak dikenali:', name); return false; }
    if (GS.state.autoCount !== false && params.count !== false) {
      if (name === 'victory') GS.recordResult('win');
      if (name === 'defeat') GS.recordResult('loss');
    }
    const now = performance.now();
    const style = params.style || FX.styleNow();
    FX.active.push({ name, dur: def.dur, t0: now, last: now, params, pal: PAL[style] || PAL.holo, parts: [], draw: def.draw });
    if (params.sound !== false) GS.audio.sfx(def.sfx);
    GS.emit('fx:trigger', { name, params });
    return true;
  };

  FX.clear = () => { FX.active.length = 0; };

  FX.draw = function (ctx, now, W, H) {
    if (!FX.active.length) return;
    FX.active = FX.active.filter((e) => now - e.t0 < e.dur);
    for (const e of FX.active) {
      const p = clamp((now - e.t0) / e.dur, 0, 1);
      const dt = clamp((now - e.last) / 1000, 0, 0.05);
      e.last = now;
      ctx.save();
      try { e.draw(ctx, e, p, now, W, H, dt); } catch (err) { console.error('[GS] ralat efek', e.name, err); e.t0 = -1e9; }
      ctx.restore();
    }
  };
})();
