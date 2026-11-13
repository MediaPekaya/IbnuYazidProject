/* Global Streamer - latar belakang bergerak (api, kilat, peti harta, anime, neon, bintang).
 * Dilukis terus pada kanvas; tiada fail luar. Dipakai sebagai sumber "Latar bergerak" di belakang template. */
(function () {
  'use strict';
  const W = GS.widgets;
  const TAU = Math.PI * 2;
  const rnd = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
  const STYLES = [['fire', 'Api'], ['storm', 'Hujan ribut kilat'], ['lightning', 'Kilat'], ['anime', 'Anime'], ['neon', 'Neon grid'], ['stars', 'Bintang']];

  function fireFallback(ctx, x, y, w, h, t) {
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#0a0206'); g.addColorStop(0.6, '#2a0608'); g.addColorStop(1, '#5a1004');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    const gl = ctx.createRadialGradient(x + w / 2, y + h, 10, x + w / 2, y + h, Math.max(w, h) * 0.8); gl.addColorStop(0, 'rgba(255,140,30,0.55)'); gl.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.fillStyle = gl; ctx.fillRect(x, y, w, h);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.globalCompositeOperation = 'lighter';
    const N = Math.max(8, Math.round(w / 70));
    for (let layer = 0; layer < 3; layer++) {
      for (let i = 0; i < N; i++) {
        const bx = x + ((i + 0.5 + (layer % 2) * 0.35) / N) * w, ph = t * 0.004 * (1 + layer * 0.4) + rnd(i, layer) * 9;
        const fh = h * (0.16 + layer * 0.05 + 0.1 * Math.sin(ph) * 0.5 + 0.06 * rnd(i, 3));
        const fw = (w / N) * (0.75 + 0.3 * Math.sin(ph * 1.3));
        const sway = Math.sin(ph * 1.7) * fw * 0.25;
        const gg = ctx.createLinearGradient(0, y + h - fh, 0, y + h); gg.addColorStop(0, 'rgba(255,230,120,0)'); gg.addColorStop(0.5, layer === 2 ? 'rgba(255,170,40,0.5)' : 'rgba(255,90,20,0.45)'); gg.addColorStop(1, 'rgba(200,20,10,0.55)');
        ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(bx - fw / 2, y + h); ctx.quadraticCurveTo(bx - fw * 0.5 + sway, y + h - fh * 0.5, bx + sway, y + h - fh); ctx.quadraticCurveTo(bx + fw * 0.5 + sway, y + h - fh * 0.5, bx + fw / 2, y + h); ctx.closePath(); ctx.fill();
      }
    }
    for (let i = 0; i < 46; i++) { // bunga api naik
      const sp = 0.03 + rnd(i, 1) * 0.06, py = y + h - ((t * sp + rnd(i, 2) * h) % h), px = x + rnd(i, 3) * w + Math.sin(t * 0.002 + i) * 14, r = 1.5 + rnd(i, 4) * 3.5, a = 1 - (y + h - py) / h;
      ctx.fillStyle = 'rgba(255,' + Math.round(150 + rnd(i, 5) * 80) + ',60,' + (a * 0.9).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  /* api sebenar: shader WebGL (hingar fbm) dengan warna api hitam -> merah -> jingga -> kuning -> putih, bukan bentuk vektor */
  let GL = null, glc = null;
  const progs = {};
  const NOISE = 'float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }' +
    'float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1., 0.)), f.x), mix(h(i + vec2(0., 1.)), h(i + vec2(1., 1.)), f.x), f.y); }' +
    'float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 5; i++) { v += a * n(p); p = p * 2.02 + vec2(1.7, 9.2); a *= .5; } return v; }';
  const FIRE = 'void main(){ vec2 uv = gl_FragCoord.xy / R; float asp = R.x / R.y; vec2 p = vec2(uv.x * asp, uv.y); float t = T;' +
    ' vec2 q = p * vec2(2.6, 2.0); q.y -= t * 1.1; float w = fbm(q + vec2(0., t * .12));' +
    ' vec2 q2 = vec2(p.x * 4.2 + w * 2.2, p.y * 2.6 - t * 2.1); float f = fbm(q2);' +
    ' float base = pow(1. - uv.y, 1.5);' +
    ' float it = f * 1.15 * base * 1.55 - uv.y * .26 + .03;' +
    ' it += (fbm(vec2(p.x * 1.8, t * .45)) - .5) * .5 * (1. - uv.y);' +
    ' it = clamp(it, 0., 1.5);' +
    ' vec3 c = mix(vec3(.015, 0., 0.), vec3(.5, .035, 0.), smoothstep(.06, .34, it));' +
    ' c = mix(c, vec3(1., .33, .02), smoothstep(.28, .58, it));' +
    ' c = mix(c, vec3(1., .74, .14), smoothstep(.52, .84, it));' +
    ' c = mix(c, vec3(1., .95, .7), smoothstep(.95, 1.5, it));' +
    ' c += vec3(.22, .04, 0.) * pow(1. - uv.y, 3.) * .7;' +
    ' gl_FragColor = vec4(c, 1.); }';
  /* hujan ribut: awan ribut berlapis (fbm), hujan berlapis dengan serong angin, kilat dan petir bercabang yang menerangi awan */
  const STORM = 'float bwob(float y, float k, float sd){ float v = 0., a = .075, f = 2.2; for (int i = 0; i < 6; i++) { v += a * (n(vec2(y * f + sd * 13.1, k * 7.7 + float(i) * 3.1)) - .5) * 2.; f *= 2.25; a *= .55; } return v; }' +
    'void main(){ vec2 uv = gl_FragCoord.xy / R; float asp = R.x / R.y; vec2 p = vec2(uv.x * asp, uv.y); float t = T;' +
    ' float per = 3.4, k = floor(t / per), ph = (t - k * per);' +
    ' float flash = exp(-ph * 5.5) * step(ph, 1.0) + .65 * exp(-max(ph - .22, 0.) * 8.) * step(.22, ph) * step(ph, 1.0) + .015 * (n(vec2(t * 9., 1.)) - .5);' +
    ' flash = max(flash, 0.);' +
    ' float bx = .22 + .56 * h(vec2(k, 1.3));' +
    ' vec2 cq = vec2(p.x * 1.4 - t * .05, uv.y * 1.1 + t * .02);' +
    ' float cl = fbm(cq * 2.2 + fbm(cq * 3.1 + t * .04));' +
    ' float cl2 = fbm(cq * 4.0 - vec2(t * .08, 0.));' +
    ' vec3 col = mix(vec3(.02, .025, .045), vec3(.15, .18, .26), cl) * (.45 + .75 * uv.y);' +
    ' col = mix(col, col * .55, smoothstep(.2, .7, cl2) * (1. - uv.y) * .6);' +
    ' col += vec3(.5, .56, .85) * flash * (.25 + cl * 1.1) * (.35 + uv.y);' +
    // petir sebenar: laluan fraktal (hingar berbilang skala) dengan cabang yang menipis
    ' float fl = ph < 1.0 ? 1. : 0.;' +
    ' float x0 = bx * asp; float y = p.y;' +
    ' float X = x0 + bwob(y, k, 1.) * asp; float X2 = x0 + bwob(y + .004, k, 1.) * asp; float sl = (X2 - X) / .004;' +
    ' float d = abs(p.x - X) / sqrt(1. + sl * sl);' +
    ' float taper = smoothstep(.03 + .22 * h(vec2(k, 8.)), .35, y);' +
    ' float yb = .78 - .2 * h(vec2(k, 9.)); float xb = x0 + bwob(yb, k, 1.) * asp; float dir = h(vec2(k, 50.)) > .5 ? 1. : -1.;' +
    ' float Xb = xb + (yb - y) * dir * .38 * asp + bwob(y, k, 2.) * asp * .7; float Xb2 = xb + (yb - y - .004) * dir * .38 * asp + bwob(y + .004, k, 2.) * asp * .7; float slb = (Xb2 - Xb) / .004;' +
    ' float db = abs(p.x - Xb) / sqrt(1. + slb * slb); float mb = step(y, yb) * smoothstep(yb - .42, yb - .05, y);' +
    ' float yc = .5 - .12 * h(vec2(k, 11.)); float xc = x0 + bwob(yc, k, 1.) * asp; float Xc = xc + (yc - y) * -dir * .3 * asp + bwob(y, k, 3.) * asp * .6; float Xc2 = xc + (yc - y - .004) * -dir * .3 * asp + bwob(y + .004, k, 3.) * asp * .6; float slc = (Xc2 - Xc) / .004;' +
    ' float dc = abs(p.x - Xc) / sqrt(1. + slc * slc); float mc = step(y, yc) * smoothstep(yc - .3, yc - .04, y);' +
    ' float wid = .0016 * (.55 + .6 * y);' +
    ' float core = smoothstep(wid, 0., d) * taper + .6 * smoothstep(wid * .8, 0., db) * mb + .5 * smoothstep(wid * .7, 0., dc) * mc;' +
    ' float glow = (.0026 / (d + .0014)) * taper + .35 * (.0022 / (db + .0016)) * mb + .3 * (.0018 / (dc + .0016)) * mc;' +
    ' float bolt = glow * flash * fl;' +
    ' col += vec3(.75, .82, 1.) * bolt + vec3(.92, .95, 1.) * core * flash * fl * 1.2;' +
    // hujan
    ' float rain = 0.;' +
    ' for (int L = 0; L < 3; L++) { float lf = float(L); float N = 70. + lf * 55.; float S = 1.3 + lf * .6; float sp = 1.9 + lf * 1.1;' +
    '   vec2 r = vec2(p.x + p.y * .3, p.y); float cx = floor(r.x * N), fx = fract(r.x * N); float off = h(vec2(cx, lf));' +
    '   float yy = fract(r.y * S + t * sp * (.8 + off * .4) + off * 7.);' +
    '   float line = smoothstep(.07 - lf * .015, 0., abs(fx - .5));' +
    '   float streak = smoothstep(0., .1, yy) * (1. - smoothstep(.1, .42, yy));' +
    '   rain += line * streak * (.45 + .55 * off) * (.62 - lf * .12); }' +
    ' col += vec3(.68, .78, .95) * rain * (.5 + flash * 1.4);' +
    ' col += vec3(.1, .12, .18) * fbm(vec2(p.x * 2. - t * .1, uv.y * 3.)) * pow(1. - uv.y, 2.5) * .8;' +
    ' gl_FragColor = vec4(col, 1.); }';
  // kilat ungu: awan ribut dan petir bercabang tanpa hujan, lebih kerap menyambar
  const LIGHT = STORM.replace("float per = 3.4", "float per = 2.2").replace("vec3(.5, .56, .85) * flash", "vec3(.62, .45, .95) * flash").replace("col += vec3(.68, .78, .95) * rain * (.5 + flash * 1.4);", "col += vec3(.7, .6, .95) * rain * flash * 1.2;").replace("mix(vec3(.02, .025, .045), vec3(.15, .18, .26), cl)", "mix(vec3(.03, .015, .06), vec3(.2, .13, .32), cl)").replace("vec3(.75, .82, 1.) * bolt", "vec3(.8, .7, 1.) * bolt");
  const SRC = { fire: FIRE, storm: STORM, lightning: LIGHT };
  function initGL() {
    if (GL !== null) return GL;
    try {
      glc = document.createElement('canvas'); glc.width = 360; glc.height = 360;
      GL = glc.getContext('webgl', { preserveDrawingBuffer: true, antialias: false });
      if (!GL) GL = false;
    } catch (e) { GL = false; }
    return GL;
  }
  function program(key) {
    if (progs[key] !== undefined) return progs[key];
    try {
      const vs = 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0., 1.); }';
      const fs = 'precision highp float; uniform vec2 R; uniform float T;' + NOISE + SRC[key];
      const sh = (type, src) => { const o = GL.createShader(type); GL.shaderSource(o, src); GL.compileShader(o); if (!GL.getShaderParameter(o, GL.COMPILE_STATUS)) throw new Error(GL.getShaderInfoLog(o)); return o; };
      const pg = GL.createProgram(); GL.attachShader(pg, sh(GL.VERTEX_SHADER, vs)); GL.attachShader(pg, sh(GL.FRAGMENT_SHADER, fs)); GL.linkProgram(pg);
      if (!GL.getProgramParameter(pg, GL.LINK_STATUS)) throw new Error('link');
      GL.useProgram(pg);
      const buf = GL.createBuffer(); GL.bindBuffer(GL.ARRAY_BUFFER, buf); GL.bufferData(GL.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), GL.STATIC_DRAW);
      const a = GL.getAttribLocation(pg, 'a'); GL.enableVertexAttribArray(a); GL.vertexAttribPointer(a, 2, GL.FLOAT, false, 0, 0);
      progs[key] = { pg, R: GL.getUniformLocation(pg, 'R'), T: GL.getUniformLocation(pg, 'T'), buf, a };
    } catch (e) { console.warn('[GS] shader ' + key + ' gagal, guna lukisan sandaran', e); progs[key] = false; }
    return progs[key];
  }
  /** lukis shader pada kawasan; pulangkan false jika WebGL tidak tersedia */
  function glDraw(key, ctx, x, y, w, h, t) {
    if (!initGL()) return false;
    const P = program(key);
    if (!P) return false;
    const k = Math.min(1, 480 / Math.max(w, h)), pw = Math.max(64, Math.round(w * k)), ph = Math.max(64, Math.round(h * k));
    if (glc.width !== pw || glc.height !== ph) { glc.width = pw; glc.height = ph; }
    GL.useProgram(P.pg); GL.bindBuffer(GL.ARRAY_BUFFER, P.buf); GL.enableVertexAttribArray(P.a); GL.vertexAttribPointer(P.a, 2, GL.FLOAT, false, 0, 0);
    GL.viewport(0, 0, pw, ph); GL.uniform2f(P.R, pw, ph); GL.uniform1f(P.T, t * 0.001); GL.drawArrays(GL.TRIANGLE_STRIP, 0, 4);
    ctx.drawImage(glc, x, y, w, h);
    return true;
  }
  function fire(ctx, x, y, w, h, t) {
    if (!glDraw('fire', ctx, x, y, w, h, t)) { fireFallback(ctx, x, y, w, h, t); return; }
    // bunga api kecil yang naik
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 38; i++) {
      const sp = 0.035 + rnd(i, 1) * 0.07, py = y + h - ((t * sp + rnd(i, 2) * h) % h), px = x + rnd(i, 3) * w + Math.sin(t * 0.002 + i) * 18, r = 1 + rnd(i, 4) * 2.4, a = Math.max(0, 1 - (y + h - py) / (h * 0.9));
      ctx.fillStyle = 'rgba(255,' + Math.round(140 + rnd(i, 5) * 90) + ',50,' + (a * 0.95).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  function storm(ctx, x, y, w, h, t) {
    if (!glDraw('storm', ctx, x, y, w, h, t)) lightning2d(ctx, x, y, w, h, t);
  }
  function lightning(ctx, x, y, w, h, t) {
    if (!glDraw('lightning', ctx, x, y, w, h, t)) lightning2d(ctx, x, y, w, h, t);
  }
  function lightning2d(ctx, x, y, w, h, t) {
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#05061a'); g.addColorStop(1, '#1a0b3a'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    const cl = ctx.createRadialGradient(x + w / 2, y, 10, x + w / 2, y, Math.max(w, h)); cl.addColorStop(0, 'rgba(120,90,255,0.35)'); cl.addColorStop(1, 'rgba(60,40,160,0)'); ctx.fillStyle = cl; ctx.fillRect(x, y, w, h);
    const per = 1700, k = Math.floor(t / per), ph = (t % per) / per;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    if (ph < 0.35) {
      const a = 1 - ph / 0.35;
      ctx.fillStyle = 'rgba(190,200,255,' + (0.25 * a).toFixed(3) + ')'; ctx.fillRect(x, y, w, h);
      for (let b = 0; b < 2; b++) {
        let bx = x + w * (0.2 + rnd(k, b + 1) * 0.6), by = y; ctx.beginPath(); ctx.moveTo(bx, by);
        for (let s2 = 0; s2 < 14; s2++) { bx += (rnd(k * 7 + s2, b + 9) - 0.5) * w * 0.12; by += h / 13; ctx.lineTo(bx, by); }
        ctx.lineJoin = 'round'; ctx.shadowColor = '#8fb4ff'; ctx.shadowBlur = 30; ctx.strokeStyle = 'rgba(210,225,255,' + a.toFixed(2) + ')'; ctx.lineWidth = 6 - b * 2; ctx.stroke();
        ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')'; ctx.lineWidth = 2; ctx.stroke();
      }
    }
    ctx.restore();
  }
  function chest(ctx, x, y, w, h, t) {
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#1a1204'); g.addColorStop(1, '#3a2406'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    const cx = x + w / 2, cy = y + h * 0.62, R = Math.hypot(w, h);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 14; i++) { const a = t * 0.0004 + (i * TAU) / 14; ctx.save(); ctx.translate(cx, cy); ctx.rotate(a); const rg = ctx.createLinearGradient(0, 0, R, 0); rg.addColorStop(0, 'rgba(255,214,90,0.32)'); rg.addColorStop(1, 'rgba(255,214,90,0)'); ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R, -R * 0.045); ctx.lineTo(R, R * 0.045); ctx.closePath(); ctx.fill(); ctx.restore(); }
    ctx.restore();
    // peti harta (vektor)
    const cw = Math.min(w * 0.46, h * 0.3), ch = cw * 0.55, bx = cx - cw / 2, by = cy + cw * 0.05;
    ctx.save(); ctx.shadowColor = 'rgba(255,200,60,0.9)'; ctx.shadowBlur = 40; ctx.fillStyle = '#8a4b14'; W.rr(ctx, bx, by, cw, ch, cw * 0.05); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#e8b53a'; ctx.fillRect(bx, by + ch * 0.35, cw, ch * 0.12); ctx.fillRect(bx + cw * 0.46, by, cw * 0.08, ch);
    ctx.fillStyle = '#a05a1c'; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + cw * 0.08, by - ch * 0.55); ctx.lineTo(bx + cw * 0.92, by - ch * 0.55); ctx.lineTo(bx + cw, by); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8b53a'; ctx.fillRect(bx + cw * 0.46, by - ch * 0.55, cw * 0.08, ch * 0.55);
    const gl = ctx.createRadialGradient(cx, by, 5, cx, by, cw * 0.7); gl.addColorStop(0, 'rgba(255,240,170,0.95)'); gl.addColorStop(1, 'rgba(255,200,60,0)'); ctx.fillStyle = gl; ctx.fillRect(bx - cw * 0.3, by - cw * 0.7, cw * 1.6, cw * 0.9);
    for (let i = 0; i < 34; i++) { // syiling dan kilauan naik
      const sp = 0.02 + rnd(i, 1) * 0.05, py = by - ((t * sp + rnd(i, 2) * h * 0.5) % (h * 0.5)), px = cx + (rnd(i, 3) - 0.5) * cw * 1.4 + Math.sin(t * 0.003 + i) * 10;
      ctx.fillStyle = 'rgba(255,224,110,' + (0.4 + 0.6 * Math.abs(Math.sin(t * 0.006 + i))).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(px, py, 2 + rnd(i, 4) * 4, 0, TAU); ctx.fill();
    }
  }
  function anime(ctx, x, y, w, h, t) {
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#ff8ac1'); g.addColorStop(0.55, '#9a7bff'); g.addColorStop(1, '#2fd0ff'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const cx = x + w / 2, cy = y + h / 2, R = Math.hypot(w, h) / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    for (let i = 0; i < 40; i++) { const a = (i * TAU) / 40 + t * 0.0002, wd = 0.03 + rnd(i, 1) * 0.04; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R * 0.25, cy + Math.sin(a) * R * 0.25); ctx.lineTo(cx + Math.cos(a - wd) * R * 1.2, cy + Math.sin(a - wd) * R * 1.2); ctx.lineTo(cx + Math.cos(a + wd) * R * 1.2, cy + Math.sin(a + wd) * R * 1.2); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let c = 0; c < 4; c++) { const px = x + ((rnd(c, 7) * w + t * (0.01 + c * 0.004)) % (w + 400)) - 200, py = y + h * (0.12 + c * 0.2); ctx.beginPath(); ctx.arc(px, py, 38, 0, TAU); ctx.arc(px + 44, py - 14, 48, 0, TAU); ctx.arc(px + 96, py, 38, 0, TAU); ctx.fill(); }
    for (let i = 0; i < 26; i++) { // kelopak sakura jatuh
      const py = y + ((t * (0.04 + rnd(i, 1) * 0.05) + rnd(i, 2) * h) % h), px = x + rnd(i, 3) * w + Math.sin(t * 0.002 + i) * 30, r = 6 + rnd(i, 4) * 9;
      ctx.save(); ctx.translate(px, py); ctx.rotate(t * 0.002 + i); ctx.fillStyle = 'rgba(255,225,240,0.95)'; ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.55, 0, 0, TAU); ctx.fill(); ctx.restore();
    }
    for (let i = 0; i < 22; i++) { const px = x + rnd(i, 8) * w, py = y + rnd(i, 9) * h, k2 = 0.5 + 0.5 * Math.sin(t * 0.005 + i * 2), r = 5 + 9 * k2; ctx.fillStyle = 'rgba(255,255,255,' + (0.4 + 0.6 * k2).toFixed(2) + ')'; ctx.beginPath(); ctx.moveTo(px, py - r); ctx.lineTo(px + r * 0.25, py - r * 0.25); ctx.lineTo(px + r, py); ctx.lineTo(px + r * 0.25, py + r * 0.25); ctx.lineTo(px, py + r); ctx.lineTo(px - r * 0.25, py + r * 0.25); ctx.lineTo(px - r, py); ctx.lineTo(px - r * 0.25, py - r * 0.25); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
  function neon(ctx, x, y, w, h, t) {
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#12002e'); g.addColorStop(0.6, '#3a0a5e'); g.addColorStop(1, '#0a0220'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    const hz = y + h * 0.62;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const sg = ctx.createLinearGradient(0, hz - h * 0.28, 0, hz); sg.addColorStop(0, '#ffd23f'); sg.addColorStop(1, '#ff2d95'); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(x + w / 2, hz - h * 0.02, Math.min(w, h) * 0.22, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(255,60,200,0.9)'; ctx.lineWidth = 2; ctx.shadowColor = '#ff2dd5'; ctx.shadowBlur = 12;
    for (let i = -14; i <= 14; i++) { ctx.beginPath(); ctx.moveTo(x + w / 2 + i * w * 0.02, hz); ctx.lineTo(x + w / 2 + i * w * 0.2, y + h); ctx.stroke(); }
    for (let i = 0; i < 12; i++) { const k = ((i + (t * 0.0006)) % 12) / 12, yy = hz + (h - (hz - y)) * Math.pow(k, 2.2); ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke(); }
    ctx.restore();
  }
  function stars(ctx, x, y, w, h, t) {
    const g = ctx.createRadialGradient(x + w / 2, y + h / 2, 10, x + w / 2, y + h / 2, Math.max(w, h) * 0.7); g.addColorStop(0, '#16224a'); g.addColorStop(1, '#03040c'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    for (let i = 0; i < 90; i++) { const px = x + rnd(i, 1) * w, py = y + ((rnd(i, 2) * h + t * (0.01 + rnd(i, 3) * 0.03)) % h), r = 0.8 + rnd(i, 4) * 2.4; ctx.fillStyle = 'rgba(255,255,255,' + (0.4 + 0.6 * Math.abs(Math.sin(t * 0.004 + i))).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill(); }
  }
  const DRAW = { fire, storm, lightning, anime, neon, stars };
  W.bgfx = function (ctx, s, t) {
    const p = s.props || {}, fn = DRAW[p.style] || fire;
    ctx.save();
    fn(ctx, s.x, s.y, s.w, s.h, t);
    ctx.restore();
  };
  GS.bgfx = { styles: STYLES };
})();
