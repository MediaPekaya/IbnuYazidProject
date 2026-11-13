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
    const maxW = o.maxW || GS.design.w * 0.92;
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
    const sc0 = GS.scenes.program();
    const cx = W / 2, cy = (sc0 && sc0.fxAnchor) || H * 0.6, bh = 170;
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
    GS.widgets.text(ctx, GS.tov(e.params.sub || 'MUSUH TUMBANG'), 0, bh / 2 - 14, { size: 22, weight: 700, spacing: 8, align: 'center', color: pal.light });
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
      GS.widgets.text(ctx, GS.tov(e.params.sub || 'HERO KITA TUMBANG'), 0, 96, { size: 24, weight: 700, spacing: 8, align: 'center', color: '#bfe8ff' });
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
    GS.widgets.text(ctx, GS.tov('MENANG · W{0} – L{1}', wl.win, wl.loss), cx, cy + 190, { size: 40, weight: 800, spacing: 10, align: 'center', color: '#ffe9a8', shadow: 'rgba(255,200,90,.8)' });
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
      GS.widgets.text(ctx, GS.tov('KALAH · W{0} – L{1}', wl.win, wl.loss), W / 2, cy + bh / 2 + 54, { size: 36, weight: 800, spacing: 10, align: 'center', color: '#ffb3c0' });
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
    const baseY = H * 0.46;
    const cy = baseY + (1 - clamp(inP, 0, 1)) * -200 - outP * 120;
    const fitK = Math.min(1, (W - 40) / cw);
    ctx.save();
    ctx.translate(cx, baseY);
    ctx.scale(fitK, fitK);
    ctx.translate(-cx, -baseY);
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
      title(ctx, GS.tov('ITEM PENUH!'), 0, 0, 92, pal, now, { top: '#ffffff', mid: '#ffe9a8', bot: '#ffa43b', glow: 'rgba(255,200,90,.9)', spacing: 8 });
      ctx.restore();
      GS.widgets.text(ctx, GS.tov('6 / 6 · BUILD LENGKAP'), cx, cy + ch / 2 - 26, { size: 22, weight: 700, spacing: 8, align: 'center', color: pal.light });
    } else {
      GS.widgets.text(ctx, GS.tov('MEMBINA ITEM…'), cx, cy - ch / 2 + 56, { size: 36, weight: 800, spacing: 8, align: 'center', color: pal.light });
      const cnt = Math.min(6, filled.filter((f) => f > 0.3).length);
      GS.widgets.text(ctx, cnt + ' / 6', cx, cy + ch / 2 - 26, { size: 22, weight: 700, spacing: 8, align: 'center', color: pal.light });
    }
    ctx.restore();
    // kilat apabila siap
    if (allDone && !e.burst) { e.burst = true; for (let i = 0; i < 60; i++) e.parts.push({ x: cx + rnd(-500, 500), y: cy, vx: rnd(-260, 260), vy: rnd(-420, -60), age: 0, life: rnd(0.8, 1.6), size: rnd(5, 12), rot: rnd(0, TAU), vr: rnd(-6, 6), col: ['#ffe9a8', '#ffffff', pal.main][i % 3], alpha: 1 }); }
    stepParts(e.parts, dt, 520);
    ctx.save(); ctx.globalAlpha = alpha; drawParts(ctx, e.parts, 'spark'); ctx.restore();
    ctx.restore();
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
    GS.widgets.text(ctx, GS.tov('ITEM DIBELI'), x + 188, y + 52, { size: 20, weight: 800, spacing: 6, color: pal.light });
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
    GS.widgets.text(ctx, GS.tov(e.params.title || 'TERIMA KASIH').toUpperCase(), x + w / 2, y + 34, { size: 18, weight: 800, spacing: 6, align: 'center', color: e.pal.light });
    GS.widgets.text(ctx, e.params.name || '@penonton', x + w / 2, y + 66, { size: 28, weight: 800, align: 'center', maxW: w - 60 });
    ctx.restore();
  }

  /* ================== GIFT: pop-up (biasa) dan cahaya skrin penuh (gift mahal) ================== */
  function giftCard(ctx, e, p, now, W, H, big) {
    const pr = e.params, inP = clamp(easeBack(p / 0.14), 0, 1.15), outP = easeOut((p - 0.84) / 0.16);
    const w = Math.min(W - 60, big ? 860 : 700), h = big ? 190 : 130;
    const cx = W / 2, cy = (e.params.y != null ? e.params.y : H * (big ? 0.42 : 0.3)) - outP * 120;
    const k = (0.6 + 0.4 * inP) * (1 - outP * 0.3);
    ctx.save();
    ctx.globalAlpha = 1 - outP;
    ctx.translate(cx, cy); ctx.scale(k, k);
    const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    g.addColorStop(0, e.pal.band[0]); g.addColorStop(0.5, e.pal.accent); g.addColorStop(1, e.pal.band[2]);
    ctx.shadowColor = e.pal.accent; ctx.shadowBlur = big ? 60 : 30;
    ctx.fillStyle = g; GS.widgets.rr(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.stroke();
    // bulatan hadiah
    const r = h * 0.36, gx = -w / 2 + h * 0.62;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(gx, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = e.pal.accent; ctx.font = '900 ' + r * 1.2 + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', gx, 2);
    const tx = gx + r + 22, tw = w / 2 - tx - 20 + w / 2 - 10;
    GS.widgets.text(ctx, '@' + (pr.user || 'penonton'), tx, -h * 0.16, { size: h * 0.25, weight: 800, color: '#fff', maxW: tw - (pr.count > 1 ? h * 0.9 : 0) });
    GS.widgets.text(ctx, GS.tov('hantar') + ' ' + (pr.gift || 'Gift'), tx, h * 0.24, { size: h * 0.26, weight: 900, color: '#fff7c2', maxW: tw - (pr.count > 1 ? h * 0.9 : 0) });
    if (pr.count > 1) GS.widgets.text(ctx, 'x' + pr.count, w / 2 - h * 0.45, h * 0.12, { size: h * 0.5, weight: 900, align: 'center', color: '#ffe066', shadow: '#000', blur: 10 });
    ctx.restore();
  }
  function drawGift(ctx, e, p, now, W, H) { giftCard(ctx, e, p, now, W, H, false); }
  function drawGiftBig(ctx, e, p, now, W, H) {
    const a = Math.sin(clamp(p, 0, 1) * Math.PI);
    ctx.save();
    // kilat cahaya skrin penuh
    const flash = Math.max(0, 1 - p / 0.08);
    if (flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + (0.7 * flash).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
    // alur cahaya berputar
    ctx.globalCompositeOperation = 'lighter'; ctx.translate(W / 2, H * 0.42);
    const R = Math.hypot(W, H);
    for (let i = 0; i < 14; i++) {
      const ang = now * 0.0007 + (i * Math.PI * 2) / 14;
      ctx.save(); ctx.rotate(ang);
      const g = ctx.createLinearGradient(0, 0, R, 0);
      g.addColorStop(0, 'rgba(255,255,255,' + (0.38 * a).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
      if (i % 2) { ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R, -R * 0.07); ctx.lineTo(R, R * 0.07); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    }
    ctx.restore();
    // vinjet berwarna
    ctx.save();
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.6);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, e.pal.accent); ctx.globalAlpha = 0.5 * a; ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    // zarah emas
    e.parts = e.parts && e.parts.length ? e.parts : Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: H + Math.random() * 200, vy: 2 + Math.random() * 5, s: 3 + Math.random() * 7, ph: Math.random() * 6 }));
    ctx.save(); ctx.fillStyle = '#ffe066';
    e.parts.forEach((q) => { q.y -= q.vy; if (q.y < -20) q.y = H + 20; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(now * 0.01 + q.ph); ctx.beginPath(); ctx.arc(q.x, q.y, q.s, 0, Math.PI * 2); ctx.fill(); });
    ctx.restore();
    giftCard(ctx, e, p, now, W, H, true);
  }



  /* ================== DRAFT: popup pick ally/enemy dan papan ringkasan ================== */
  function heroCircle(ctx, name, cx, cy, r, ring) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = '#10182e'; ctx.fill();
    const img = GS.heroImg && GS.heroImg(name);
    if (img) { ctx.save(); ctx.clip(); ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2); ctx.restore(); }
    else GS.widgets.text(ctx, (name || '?').slice(0, 2).toUpperCase(), cx, cy + r * 0.28, { size: r * 0.8, weight: 800, align: 'center', color: '#9fb4d6' });
    ctx.lineWidth = Math.max(3, r * 0.08); ctx.strokeStyle = ring; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  /** Kawasan capture card pada Program (tempat popup draft dipaparkan, di tengah-tengahnya); jika tiada, seluruh kanvas. */
  function capRect(W, H) {
    const sc = GS.scenes && GS.scenes.program && GS.scenes.program();
    const cap = sc && sc.sources.find((x) => x.type === 'video' && x.props && x.props.kind === 'capture' && x.visible !== false);
    return cap ? { x: cap.x, y: cap.y, w: cap.w, h: cap.h } : { x: 0, y: 0, w: W, h: H };
  }
  function drawDraftPick(ctx, e, p, now, W, H) {
    const R = capRect(W, H);
    const side = e.params.side === 'enemy' ? 'enemy' : 'ally', col = side === 'enemy' ? '#ff4d5e' : '#2ea8ff', col2 = side === 'enemy' ? '#7a1020' : '#0a2f66';
    const inP = easeBack(p / 0.14), outP = easeOut((p - 0.86) / 0.14);
    const k = Math.min(1, R.w / 800), bw = Math.min(R.w * 0.92, 760 * Math.max(0.7, k)), bh = Math.min(R.h * 0.4, 150 * Math.max(0.7, k)), y = R.y + (R.h - bh) / 2;
    const dir = side === 'enemy' ? -1 : 1, off = (1 - clamp(inP, 0, 1)) * (R.w * 0.6) * -dir + outP * R.w * 0.6 * dir, x = R.x + (R.w - bw) / 2 + off;
    ctx.save(); ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip();
    const g = ctx.createLinearGradient(x, 0, x + bw, 0); g.addColorStop(0, col2); g.addColorStop(1, 'rgba(8,14,34,0.95)');
    ctx.fillStyle = g; GS.widgets.rr(ctx, x, y, bw, bh, bh * 0.19); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 24; ctx.stroke(); ctx.shadowBlur = 0;
    const r = bh * 0.39; heroCircle(ctx, e.params.hero, x + bh * 0.62, y + bh / 2, r, col);
    GS.widgets.text(ctx, GS.tov(side === 'enemy' ? 'ENEMY PICK' : 'ALLY PICK'), x + bh * 1.2, y + bh * 0.38, { size: bh * 0.19, weight: 900, spacing: 5, color: col });
    GS.widgets.text(ctx, String(e.params.hero || '').toUpperCase(), x + bh * 1.2, y + bh * 0.76, { size: bh * 0.33, weight: 900, color: '#ffffff', maxW: bw - bh * 1.35 });
    ctx.restore();
  }
  /** Papan ringkasan: di tengah capture card, ENEMY di kiri dan ALLY di kanan (lima baris setiap lajur). */
  function drawDraftBoard(ctx, e, p, now, W, H) {
    const R = capRect(W, H), a = Math.min(easeOut(p / 0.08), 1 - easeOut((p - 0.9) / 0.1));
    const pw = R.w * 0.94, ph = R.h * 0.92, px = R.x + (R.w - pw) / 2, py = R.y + (R.h - ph) / 2;
    ctx.save(); ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip(); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(4,8,20,0.86)'; GS.widgets.rr(ctx, px, py, pw, ph, ph * 0.04); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(120,170,255,0.6)'; ctx.stroke();
    const titleH = ph * 0.2;
    GS.widgets.text(ctx, GS.tov('DRAFT COMPLETE'), px + pw / 2, py + titleH * 0.46, { size: titleH * 0.34, weight: 900, spacing: 6, align: 'center', color: '#ffffff', shadow: '#2ea8ff', blur: 22, maxW: pw * 0.9 });
    const gap = pw * 0.03, colW = (pw - gap * 3) / 2, rowH = (ph - titleH - ph * 0.03) / 5, r = Math.min(rowH * 0.4, colW * 0.14);
    [['enemy', e.params.enemy || [], '#ff4d5e', 'ENEMY', px + gap], ['ally', e.params.ally || [], '#2ea8ff', 'ALLY', px + gap * 2 + colW]].forEach(([side, list, col, lab, bx], si) => {
      for (let i = 0; i < 5; i++) {
        const ry = py + titleH + i * rowH, k = clamp((p - 0.08 - i * 0.04 - si * 0.04) / 0.12, 0, 1), off = (1 - easeOut(k)) * 60 * (si === 0 ? -1 : 1);
        ctx.globalAlpha = a * k; ctx.fillStyle = 'rgba(16,26,52,0.95)'; GS.widgets.rr(ctx, bx + off, ry + 4, colW, rowH - 8, rowH * 0.2); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = col; ctx.stroke();
        heroCircle(ctx, list[i], bx + off + r + rowH * 0.12, ry + rowH / 2, r, col);
        GS.widgets.text(ctx, String(list[i] || '-').toUpperCase(), bx + off + r * 2 + rowH * 0.3, ry + rowH / 2 + rowH * 0.12, { size: rowH * 0.34, weight: 800, color: '#fff', maxW: colW - r * 2 - rowH * 0.45 });
      }
      ctx.globalAlpha = a; GS.widgets.text(ctx, GS.tov(lab), bx + colW / 2, py + titleH * 0.92, { size: titleH * 0.2, weight: 900, spacing: 6, align: 'center', color: col });
    });
    ctx.restore();
  }

  /* ================== BOT: gelembung komik (cakap) ================== */
  /* Fon komik "Bangers" (SIL OFL, dibundel dalam app: assets/fonts) untuk gelembung bot. Jika gagal dimuat: Comic Sans / sans-serif. */
  const COMIC = '"GSComic","Comic Sans MS","Comic Neue","Chalkboard SE","Segoe Print","Segoe UI",system-ui,sans-serif';
  FX.comicReady = false;
  FX.loadFonts = async function () {
    if (FX.comicReady || !window.FontFace) return FX.comicReady;
    try {
      const f = new FontFace('GSComic', 'url(assets/fonts/Bangers-Regular.ttf)');
      await f.load();
      document.fonts.add(f);
      FX.comicReady = true;
    } catch (e) { console.warn('[GS] fon komik tidak dapat dimuat, guna fon sandaran', e); }
    return FX.comicReady;
  };
  /** Bangers hanya ada satu berat (tegal); fon sandaran guna tebal. Jarak huruf sedikit longgar untuk gaya komik. */
  const cfont = (size, bold) => (FX.comicReady ? '400 ' : (bold ? '800 ' : '700 ')) + size + 'px ' + COMIC;
  const spacing = (ctx, size) => { if ('letterSpacing' in ctx) ctx.letterSpacing = (FX.comicReady ? Math.max(0.5, size * 0.045) : 0) + 'px'; };
  const area = (r) => r.w * r.h;
  const overlap = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

  /** Tempat gelembung. Kamera BESAR (cth template TikTok): di bawah, di dalam kotak kamera. Kamera KECIL: gelembung diletakkan di
   *  kotak besar (paparan game), tengah-bawah, supaya tidak menutup muka streamer. Tanpa kamera/game: jalur bawah kanvas. */
  FX.botPlacement = function (W, H) {
    const sc = GS.scenes && GS.scenes.program && GS.scenes.program();
    const vis = sc ? sc.sources.filter((x) => x.visible) : [];
    const cam = vis.find((x) => x.type === 'video' && x.props && x.props.kind === 'camera');
    const games = vis.filter((x) => x.type === 'video' && !(x.props && x.props.kind === 'camera')).sort((a, b) => area(b) - area(a));
    const host = games[0] || null;
    const camBig = cam && area(cam) / (W * H) >= 0.22;
    if (cam && (camBig || !host)) {
      const cb = { x: cam.x, y: cam.y, w: cam.w, h: cam.h };
      const obstacles = vis.filter((x) => x !== cam && x.type !== 'video' && x.w * x.h > 0 && x.w * x.h < cb.w * cb.h * 0.5).map((x) => ({ x: x.x, y: x.y, w: x.w, h: x.h }));
      return { mode: 'cam', box: cb, cam: null, obstacles };
    }
    if (host) {
      // bingkai/latar yang meliputi hampir seluruh kotak bukan halangan sebenar
      const obstacles = vis.filter((x) => x !== host && x.w * x.h > 0 && x.w * x.h < host.w * host.h * 0.5).map((x) => ({ x: x.x, y: x.y, w: x.w, h: x.h, cam: x === cam }));
      return { mode: 'game', box: { x: host.x, y: host.y, w: host.w, h: host.h }, cam: cam ? { x: cam.x, y: cam.y, w: cam.w, h: cam.h } : null, obstacles };
    }
    return { mode: 'band', box: { x: 40, y: Math.round(H * 0.62), w: W - 80, h: Math.round(H * 0.32) }, cam: null, obstacles: [] };
  };
  const MODE_OPT = {
    cam: { wRatio: 0.85, wCap: 720, hRatio: 0.22, hAbs: 0.09, sizeFactor: 0.03, sizeCap: 30 },
    band: { wRatio: 0.85, wCap: 720, hRatio: 0.22, hAbs: 0.09, sizeFactor: 0.03, sizeCap: 30 },
    game: { wRatio: 0.6, wCap: 620, hRatio: 0.2, hAbs: 0.09, sizeFactor: 0.02, sizeCap: 22 },
  };

  /** Susun atur gelembung (saiz, baris). Memanjang ke sisi dahulu sehingga lebar maksimum, kemudian ke bawah (hingga tinggi
   *  maksimum), kemudian huruf dikecilkan, akhirnya dipotong dengan "…". Kedudukan awal: tengah-bawah kotak hos. */
  FX.botLayout = function (ctx, params, box, o, canvasH) {
    o = Object.assign({}, MODE_OPT.cam, o || {});
    const m = Math.max(8, Math.min(18, Math.round(box.w * 0.03)));
    const tail = Math.max(9, Math.min(20, Math.round(Math.min(box.w, box.h) * 0.06)));
    const maxW = Math.max(60, Math.min(box.w - 2 * m, Math.min(o.wCap, box.w * o.wRatio)));
    const maxH = Math.max(34, Math.min(box.h - 2 * m - tail, box.h * o.hRatio, (canvasH || box.h) * (o.hAbs || 1))); // lebar dahulu; tinggi dihadkan
    const name = String(params.name || 'BOT').toUpperCase().slice(0, 24);
    let text = String(params.text || '').replace(/\s+/g, ' ').trim();
    if (FX.comicReady) text = text.toLocaleUpperCase(); // gaya komik: huruf besar
    const MIN = 12;
    ctx.save();
    const wrap = (size, lineW) => {
      ctx.font = cfont(size); spacing(ctx, size);
      const out = []; let cur = '';
      text.split(' ').forEach((wd) => {
        while (ctx.measureText(wd).width > lineW && wd.length > 1) {
          let k = wd.length - 1; while (k > 1 && ctx.measureText(wd.slice(0, k)).width > lineW) k--;
          if (cur) { out.push(cur); cur = ''; }
          out.push(wd.slice(0, k)); wd = wd.slice(k);
        }
        const t = cur ? cur + ' ' + wd : wd;
        if (ctx.measureText(t).width > lineW && cur) { out.push(cur); cur = wd; } else cur = t;
      });
      if (cur) out.push(cur);
      return out;
    };
    let size = Math.max(MIN, Math.min(o.sizeCap, Math.round(box.w * o.sizeFactor)));
    let lines, pad, lh, nameH;
    for (;;) {
      pad = Math.round(size * 0.55); lh = Math.round(size * 1.22); nameH = Math.round(size * 0.74);
      lines = wrap(size, maxW - 2 * pad);
      if (2 * pad + nameH + lines.length * lh <= maxH || size <= MIN) break;
      size -= 1;
    }
    const maxLines = Math.max(1, Math.floor((maxH - 2 * pad - nameH) / lh));
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      let last = lines[maxLines - 1];
      ctx.font = cfont(size); spacing(ctx, size);
      while (last.length > 1 && ctx.measureText(last + '…').width > maxW - 2 * pad) last = last.slice(0, -1);
      lines[maxLines - 1] = last + '…';
    }
    ctx.font = cfont(size); spacing(ctx, size);
    let cw = 0; lines.forEach((l) => { cw = Math.max(cw, ctx.measureText(l).width); });
    ctx.font = cfont(Math.round(size * 0.62), true); spacing(ctx, Math.round(size * 0.62));
    cw = Math.max(cw, ctx.measureText(name).width + 6);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    ctx.restore();
    const w = lines.length > 1 ? maxW : Math.min(maxW, Math.ceil(cw + 2 * pad));
    const h = 2 * pad + nameH + lines.length * lh;
    const x = Math.round(box.x + (box.w - w) / 2);
    const tw = Math.round(tail * 1.15);
    const r = Math.min(Math.round(size * 0.9), Math.floor(h / 3), Math.floor(w / 4));
    return { x, y: Math.round(box.y + box.h - m - tail - h), w, h, r, size, pad, lh, nameH, lines, name, tail, tw, m, up: false, tailX: x + Math.round(w * 0.32), tipX: 0, tipY: 0 };
  };

  /** Kedudukan akhir: dalam mod "game" gelembung dianjak ke atas sedikit demi sedikit untuk mengelak widget/kamera,
   *  dan ekor menunjuk ke arah kamera (penutur). Mengembalikan susun atur lengkap termasuk hujung ekor. */
  FX.botPlace = function (ctx, params, W, H) {
    const pl = FX.botPlacement(W, H);
    const L = FX.botLayout(ctx, params, pl.box, MODE_OPT[pl.mode], H);
    const b = pl.box;
    let camC = null;
    if (pl.mode === 'game' || pl.mode === 'cam') {
      const obs = pl.obstacles;
      // mod kamera: hanya anjak sedikit ke atas (tidak menutup muka); mod game: anjak bebas dalam kotak besar
      const maxShift = Math.max(0, Math.min(L.y - (b.y + L.m + L.tail), pl.mode === 'cam' ? Math.round(b.h * 0.2) : Infinity));
      let best = { dy: 0, ov: Infinity };
      for (let k = 0; k <= 14; k++) {
        const dy = Math.min(maxShift, Math.round(k * b.h * 0.035));
        const rect = { x: L.x, y: L.y - dy, w: L.w, h: L.h };
        const ov = obs.reduce((a, o) => a + overlap(rect, o) * (o.cam ? 4 : 1), 0);
        if (ov < best.ov) best = { dy, ov };
        if (ov === 0 || dy >= maxShift) break;
      }
      L.y -= best.dy;
      if (pl.cam) camC = { x: pl.cam.x + pl.cam.w / 2, y: pl.cam.y + pl.cam.h / 2 };
    }
    // ekor: menghala ke kamera jika ada; jika kamera di atas gelembung, ekor di sisi atas
    L.up = !!(camC && camC.y < L.y);
    const lim = (v) => Math.min(L.x + L.w - L.r - L.tw, Math.max(L.x + L.r + L.tw, v));
    L.tailX = lim(camC ? camC.x : L.x + L.w * 0.32);
    const lean = camC ? Math.max(-1, Math.min(1, (camC.x - L.tailX) / Math.max(1, L.w))) * L.tail * 0.9 : -L.tail * 0.55;
    L.tipX = Math.round(L.tailX + lean);
    L.tipY = L.up ? L.y - L.tail : L.y + L.h + L.tail;
    L.mode = pl.mode; L.box = b;
    return L;
  };

  /* ---- warna ---- */
  const parseCol = (c) => {
    c = String(c || '').trim();
    let m = /^#([0-9a-f]{6})/i.exec(c); if (m) { const v = parseInt(m[1], 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }
    m = /^#([0-9a-f]{3})$/i.exec(c); if (m) return m[1].split('').map((x) => parseInt(x + x, 16));
    m = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(c); if (m) return [+m[1], +m[2], +m[3]];
    return null;
  };
  const mixc = (a, b, t) => a.map((v, k) => Math.round(v + (b[k] - v) * t));
  const rgb = (a, al) => 'rgba(' + a[0] + ',' + a[1] + ',' + a[2] + ',' + (al == null ? 1 : al) + ')';
  const lumOf = (a) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(a[0]) + 0.7152 * f(a[1]) + 0.0722 * f(a[2]); };
  /** Warna gelembung diambil daripada tema semasa (BUKAN putih); teks hitam/putih dipilih ikut kontras. */
  FX.botColors = function (pal) {
    // tema kelabu (mono) tiada warna: ambil warna aksen; jika masih kelabu guna kuning-jingga komik
    const sat = (a) => (a ? Math.max(...a) - Math.min(...a) : -1);
    const cands = [pal && pal.main, pal && pal.accent, pal && pal.light].map(parseCol);
    const base = cands.find((a) => sat(a) >= 60) || [255, 190, 60];
    const top = mixc(base, [255, 255, 255], 0.38), bot = mixc(base, [0, 0, 0], 0.08);
    const mid = mixc(top, bot, 0.5);
    const cDark = (lumOf(mid) + 0.05) / 0.05, cLight = 1.05 / (lumOf(mid) + 0.05);
    const darkText = cDark >= cLight;
    return { top, bot, text: darkText ? '#10131c' : '#ffffff', sub: darkText ? 'rgba(16,19,28,0.72)' : 'rgba(255,255,255,0.85)', emboss: darkText ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.35)', dots: darkText ? [0, 0, 0] : [255, 255, 255], ink: '#10131c', light: parseCol(pal && pal.light) || [255, 255, 255] };
  };

  /** Animasi berasaskan MASA (ms), bukan bingkai, supaya licin pada 30/60/120 fps dan tajam pada 4K (vektor pada ruang reka bentuk):
   *  letup masuk dengan spring teredam + goyang kecil, terapung perlahan, tulisan ditaip, keluar mengecil dan pudar. */
  FX.botMotion = function (el, dur) {
    const tIn = 720, tOut = 340;
    let sc = 1, rot = 0, alpha = 1, bob = 0, burst = 0;
    if (el < tIn) {
      const u = el / tIn;
      sc = Math.max(0, 1 - Math.exp(-4.5 * u) * Math.cos(7.5 * u)); // spring teredam: melantun ~18% kemudian tenang
      rot = Math.exp(-4 * u) * Math.sin(11 * u) * 0.06;
      alpha = clamp(u * 7, 0, 1);
      burst = u;
    } else if (el > dur - tOut) {
      const u = clamp((el - (dur - tOut)) / tOut, 0, 1), k = u * u * (3 - 2 * u);
      sc = 1 - 0.22 * k; rot = -0.05 * k; alpha = 1 - k;
    }
    // bernafas perlahan; amplitud dilicinkan masuk/keluar supaya tiada lompatan antara fasa
    sc *= 1 + 0.008 * Math.sin(el / 380) * clamp((el - tIn) / 300, 0, 1) * clamp((dur - tOut - el) / 200, 0, 1);
    if (el >= tIn * 0.6) bob = Math.sin(el / 540) * 1.8 * clamp((el - tIn * 0.6) / 400, 0, 1);
    return { sc, rot, alpha, bob, burst };
  };

  function drawBotSay(ctx, e, p, now, W, H) {
    const pl = FX.botPlacement(W, H);
    const sig = pl.mode + JSON.stringify(pl.box) + JSON.stringify(pl.cam) + pl.obstacles.length;
    if (!e.lay || e.laySig !== sig) { e.lay = FX.botPlace(ctx, e.params, W, H); e.laySig = sig; e.dots = null; }
    const L = e.lay, box = L.box;
    const el = now - e.t0;
    const M = FX.botMotion(el, e.dur);
    const C = e.col || (e.col = FX.botColors(e.pal));
    ctx.save();
    ctx.beginPath(); ctx.rect(box.x, box.y, box.w, box.h); ctx.clip(); // tidak pernah keluar daripada kotak hos
    ctx.globalAlpha = clamp(M.alpha, 0, 1);
    ctx.translate(L.tipX, L.tipY + M.bob); ctx.rotate(M.rot); ctx.scale(M.sc, M.sc); ctx.translate(-L.tipX, -L.tipY); // berputar/membesar dari hujung ekor
    const path = (dx, dy) => {
      const { x, y, w, h, r } = L; const bx = x + dx, by = y + dy;
      ctx.beginPath();
      ctx.moveTo(bx + r, by);
      if (L.up) { ctx.lineTo(L.tailX - L.tw / 2 + dx, by); ctx.lineTo(L.tipX + dx, L.tipY + dy); ctx.lineTo(L.tailX + L.tw / 2 + dx, by); }
      ctx.lineTo(bx + w - r, by); ctx.arcTo(bx + w, by, bx + w, by + r, r);
      ctx.lineTo(bx + w, by + h - r); ctx.arcTo(bx + w, by + h, bx + w - r, by + h, r);
      if (!L.up) { ctx.lineTo(L.tailX + L.tw / 2 + dx, by + h); ctx.lineTo(L.tipX + dx, L.tipY + dy); ctx.lineTo(L.tailX - L.tw / 2 + dx, by + h); }
      ctx.lineTo(bx + r, by + h); ctx.arcTo(bx, by + h, bx, by + h - r, r);
      ctx.lineTo(bx, by + r); ctx.arcTo(bx, by, bx + r, by, r);
      ctx.closePath();
    };
    const off = Math.max(2, Math.round(L.size * 0.13));
    path(off, off); ctx.fillStyle = 'rgba(0,0,0,0.42)'; ctx.fill();                      // bayang keras gaya komik
    const g = ctx.createLinearGradient(0, L.y, 0, L.y + L.h);
    g.addColorStop(0, rgb(C.top)); g.addColorStop(1, rgb(C.bot));
    path(0, 0); ctx.fillStyle = g; ctx.fill();
    // tekstur titik separuh-ton (komik) dan kilauan
    ctx.save(); path(0, 0); ctx.clip();
    if (!e.dots) {
      const st = Math.max(6, Math.round(L.size * 0.4)), d = new Path2D();
      for (let yy = L.y + st / 2, row = 0; yy < L.y + L.h + st; yy += st * 0.86, row++) for (let xx = L.x + (row % 2 ? st / 2 : 0); xx < L.x + L.w + st; xx += st) {
        const t = clamp(((xx - L.x) / L.w + (yy - L.y) / L.h) / 2, 0, 1); // makin besar ke sudut bawah-kanan
        const rr = st * 0.07 + st * 0.2 * Math.pow(t, 1.6);
        d.moveTo(xx + rr, yy); d.arc(xx, yy, rr, 0, Math.PI * 2);
      }
      e.dots = d;
    }
    ctx.fillStyle = rgb(C.dots, 0.13); ctx.fill(e.dots);
    const gl = ctx.createLinearGradient(0, L.y, 0, L.y + L.h * 0.5);
    gl.addColorStop(0, 'rgba(255,255,255,0.34)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gl; ctx.fillRect(L.x, L.y, L.w, L.h * 0.5);
    ctx.restore();
    path(0, 0); ctx.lineWidth = Math.max(2.5, Math.round(L.size * 0.13)); ctx.lineJoin = 'round'; ctx.strokeStyle = C.ink; ctx.stroke();
    // garis "letupan" dari hujung ekor semasa muncul
    if (M.burst > 0 && M.burst < 1) {
      const a0 = L.up ? -Math.PI / 2 : Math.PI / 2, k = easeOut(M.burst);
      ctx.save(); ctx.globalAlpha = clamp(M.alpha, 0, 1) * (1 - M.burst); ctx.lineCap = 'round'; ctx.strokeStyle = rgb(C.light); ctx.lineWidth = Math.max(2, L.size * 0.1);
      for (let n = -3; n <= 3; n++) {
        const a = a0 + n * 0.42, r0 = L.tail * (0.5 + 0.6 * k), r1 = L.tail * (1.1 + 1.5 * k);
        ctx.beginPath(); ctx.moveTo(L.tipX + Math.cos(a) * r0, L.tipY + Math.sin(a) * r0); ctx.lineTo(L.tipX + Math.cos(a) * r1, L.tipY + Math.sin(a) * r1); ctx.stroke();
      }
      ctx.restore();
    }
    // nama dan teks (teks ditaip perlahan-lahan selepas gelembung muncul)
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    const ns = Math.round(L.size * 0.62);
    ctx.font = cfont(ns, true); spacing(ctx, ns); ctx.fillStyle = C.sub;
    ctx.fillText(L.name, L.x + L.w / 2, L.y + L.pad + L.nameH * 0.8);
    const total = L.lines.reduce((a, l) => a + l.length, 0);
    const typeMs = clamp(total * 24, 450, 1700);
    let show = Math.floor(total * clamp((el - 260) / typeMs, 0, 1));
    ctx.font = cfont(L.size); spacing(ctx, L.size);
    L.lines.forEach((ln, i) => {
      const part = ln.slice(0, Math.max(0, Math.min(ln.length, show))); show -= ln.length;
      if (!part) return;
      // lebar penuh baris dikekalkan supaya teks tidak "bergerak" semasa ditaip
      const full = ctx.measureText(ln).width;
      const tx = L.x + L.w / 2 - full / 2, ty = L.y + L.pad + L.nameH + L.lh * (i + 0.82);
      ctx.textAlign = 'left';
      if (FX.comicReady) { ctx.fillStyle = C.emboss; ctx.fillText(part, tx + Math.max(1, L.size * 0.05), ty + Math.max(1, L.size * 0.05)); } // bayang timbul gaya komik
      ctx.fillStyle = C.text; ctx.fillText(part, tx, ty); ctx.textAlign = 'center';
    });
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    ctx.restore();
  }

  /* ================== NOTIS ITEM (banner "beli sekarang") ================== */
  function drawItemAlert(ctx, e, p, now, W, H) {
    const pal = e.pal;
    const sc = GS.scenes.program();
    const it = e.params.item || null;
    const title0 = e.params.title || (it && it.name) || 'ITEM';
    const cy = sc && sc.alertY != null ? sc.alertY + 70 : H * 0.78;
    const inP = easeOut(p / 0.12), outP = easeOut((p - 0.86) / 0.14);
    const bh = 140;
    const x = (1 - inP) * W - outP * W;
    ctx.save();
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, pal.band[0]); g.addColorStop(0.5, pal.accent); g.addColorStop(1, pal.band[2]);
    ctx.fillStyle = g;
    ctx.globalAlpha = 0.96;
    ctx.fillRect(x, cy - bh / 2, W, bh);
    ctx.globalAlpha = 1;
    // garis terang atas/bawah + chevron bergerak
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(x, cy - bh / 2, W, 4);
    ctx.fillRect(x, cy + bh / 2 - 4, W, 4);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, cy - bh / 2, W, bh);
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    const off = (now * 0.12) % 80;
    for (let i = -2; i < W / 80 + 2; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * 80 + off, cy - bh / 2); ctx.lineTo(x + i * 80 + off + 40, cy - bh / 2); ctx.lineTo(x + i * 80 + off + 10, cy + bh / 2); ctx.lineTo(x + i * 80 + off - 30, cy + bh / 2);
      ctx.fill();
    }
    ctx.restore();
    // ikon item
    const hx = x + 96;
    GS.widgets.hex(ctx, hx, cy, 52);
    const col = (it && catColor[it.cat]) || '#ffffff';
    ctx.fillStyle = col; ctx.shadowColor = '#000'; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;
    ctx.lineWidth = 4; ctx.strokeStyle = '#fff'; ctx.stroke();
    GS.widgets.text(ctx, initials(title0), hx, cy + 12, { size: 38, weight: 900, align: 'center', color: '#0a1230' });
    const tx = x + 190, tw = W - 190 - 40;
    GS.widgets.text(ctx, GS.tov(title0).toUpperCase(), tx, cy - 6, { size: 56, weight: 900, color: '#fff', maxW: tw, shadow: 'rgba(0,0,0,.6)', blur: 10, spacing: 1 });
    GS.widgets.text(ctx, GS.tov(e.params.sub || 'BELI SEKARANG!'), tx, cy + 44, { size: 32, weight: 800, color: '#ffe9a8', maxW: tw, spacing: 1.5 });
    ctx.restore();
  }

  /* ================== TIER LIST (timbul) ================== */
  const TIER_COL = { S: '#ff3b5c', A: '#ffb13b', B: '#ffe45c', C: '#3be39a', D: '#2ea8ff' };
  function drawTierList(ctx, e, p, now, W, H) {
    const tiers = GS.state.tiers || {};
    const inP = easeBack(p / 0.08), outP = easeOut((p - 0.93) / 0.07);
    const alpha = 1 - outP;
    const pw = Math.min(W - 60, 1500), rows = ['S', 'A', 'B', 'C', 'D'];
    const rowH = Math.min(150, (H * 0.62) / 5), ph = rowH * 5 + 120;
    const px = (W - pw) / 2;
    const py = H * 0.5 - ph / 2 + (1 - clamp(inP, 0, 1)) * -160;
    ctx.save();
    ctx.globalAlpha = alpha;
    GS.widgets.panel(ctx, px, py, pw, ph, now, { r: 26, opaque: true });
    GS.widgets.text(ctx, GS.tov(tiers.label || 'TIER LIST').toUpperCase(), px + pw / 2, py + 70, { size: 52, weight: 900, align: 'center', spacing: 6, color: '#fff', shadow: e.pal.glow, blur: 16, maxW: pw - 80 });
    rows.forEach((r, i) => {
      const ry = py + 100 + i * rowH;
      const reveal = easeOut((p - 0.06 - i * 0.03) / 0.08);
      ctx.save();
      ctx.globalAlpha = alpha * clamp(reveal, 0, 1);
      ctx.fillStyle = TIER_COL[r];
      GS.widgets.rr(ctx, px + 20, ry + 6, rowH * 0.7, rowH - 12, 14);
      ctx.fill();
      GS.widgets.text(ctx, r, px + 20 + rowH * 0.35, ry + rowH * 0.64, { size: rowH * 0.46, weight: 900, align: 'center', color: '#07122a' });
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      GS.widgets.rr(ctx, px + 30 + rowH * 0.7, ry + 6, pw - 50 - rowH * 0.7, rowH - 12, 14);
      ctx.fill();
      // chip nama hero (teks sahaja)
      const list = tiers[r] || [];
      const fs = Math.max(16, rowH * 0.2);
      ctx.font = '700 ' + fs + 'px ' + GS.widgets.FONT;
      let cx = px + 44 + rowH * 0.7, cy = ry + 14, maxX = px + pw - 36, shown = 0;
      const chipH = fs * 1.7;
      for (const name of list) {
        const av = GS.hero && GS.hero(name) && GS.hero(name).img ? chipH * 0.8 : 0;
        const w = ctx.measureText(name).width + fs * 1.2 + av;
        if (cx + w > maxX) { cx = px + 44 + rowH * 0.7; cy += chipH + 6; }
        if (cy + chipH > ry + rowH - 4) break;
        ctx.fillStyle = 'rgba(46,168,255,0.22)';
        GS.widgets.rr(ctx, cx, cy, w, chipH, chipH / 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(107,230,255,0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        if (av) GS.widgets.heroAvatar(ctx, name, cx + chipH * 0.5, cy + chipH / 2, chipH * 0.42, '#2ea8ff');
        GS.widgets.text(ctx, name, cx + av / 2 + w / 2, cy + chipH * 0.68, { size: fs, weight: 700, align: 'center', color: '#eaf4ff' });
        cx += w + 8;
        shown++;
      }
      if (!list.length) GS.widgets.text(ctx, '—', px + 50 + rowH * 0.7, ry + rowH * 0.62, { size: fs * 1.2, weight: 700, color: 'rgba(255,255,255,0.3)' });
      ctx.restore();
    });
    ctx.restore();
  }

  const defs = {
    kill: { dur: 2900, draw: drawKill, sfx: 'kill' },
    slain: { dur: 2900, draw: drawKill, sfx: 'kill' }, // musuh dibunuh: visual kill + suara "You have slain an enemy"
    death: { dur: 2600, draw: drawDeath, sfx: 'death' },
    victory: { dur: 6000, draw: drawVictory, sfx: 'victory' },
    defeat: { dur: 5600, draw: drawDefeat, sfx: 'defeat' },
    fullitem: { dur: 4600, draw: drawFullItem, sfx: 'chest' },
    itembuy: { dur: 3400, draw: drawItemBuy, sfx: 'itembuy' },
    alert: { dur: 3400, draw: drawAlert, sfx: 'alert' },
    botsay: { dur: 5000, draw: drawBotSay, sfx: 'alert' },
    itemalert: { dur: 4400, draw: drawItemAlert, sfx: 'chest' },
    tierlist: { dur: 9000, draw: drawTierList, sfx: 'alert' },
    gift: { dur: 3600, draw: drawGift, sfx: 'alert' },
    draftpick: { dur: 3800, draw: drawDraftPick, sfx: 'alert' },
    draftboard: { dur: 5800, draw: drawDraftBoard, sfx: 'alert' },
    giftbig: { dur: 6500, draw: drawGiftBig, sfx: 'victory' },
  };
  FX.names = Object.keys(defs);
  FX.sfxName = (n) => (defs[n] ? defs[n].sfx : '');

  FX.trigger = function (name, params = {}) {
    const def = defs[name];
    if (!def) { console.warn('[GS] efek tidak dikenali:', name); return false; }
    if (GS.state.autoCount !== false && params.count !== false) {
      if (name === 'victory') GS.recordResult('win');
      if (name === 'defeat') GS.recordResult('loss');
    }
    const now = performance.now();
    const style = params.style || FX.styleNow();
    FX.active.push({ name, dur: params.dur || def.dur, t0: now, last: now, params, pal: (GS.fxPal && GS.fxPal[style]) || PAL[style] || PAL.holo, parts: [], draw: def.draw });
    // pengumum bercakap menggantikan bunyi beep (kecuali dikekalkan oleh pengguna); beep dimainkan jika suara gagal
    const spoken = GS.voice && GS.voice.suppressBeep && GS.voice.suppressBeep(name, params);
    if (params.sound !== false && !spoken) GS.audio.sfx(def.sfx);
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
