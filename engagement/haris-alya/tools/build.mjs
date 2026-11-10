// Generates index.html for the Haris & Alya engagement edit.
// Everything is timed from the music beat grid in shots.json (126.02 BPM, 1 beat = 0.4761 s).
// Run:  node tools/build.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);
const cfg = JSON.parse(fs.readFileSync(path.join(HERE, "shots.json"), "utf8"));
const fontsCss = fs.readFileSync(path.join(ROOT, "assets/fonts/fonts.css"), "utf8");
const per = cfg.per;
const r3 = (x) => Math.round(x * 1000) / 1000;

// ---------- transition catalogue ------------------------------------------------
const TR = {
  dissolve: { d: 0.5, sfx: "whoosh_soft", vol: 0.28 },
  whip: { d: 0.4, sfx: "whoosh_fast", vol: 0.55 },
  push: { d: 0.45, sfx: "whoosh_zoom", vol: 0.5 },
  light: { d: 0.55, sfx: "whoosh_soft", vol: 0.5 },
};
const SFX_LEN = { whoosh_soft: 0.9, whoosh_fast: 0.55, whoosh_zoom: 0.7, impact: 2.0, pop: 0.22, shimmer: 1.6 };
const SFX_PEAK = { whoosh_soft: 0.405, whoosh_fast: 0.275, whoosh_zoom: 0.42, impact: 0.03, pop: 0.02, shimmer: 0.05 };

// ---------- shot timeline ---------------------------------------------------------
let beat = 0;
const shots = cfg.shots.map((s, i) => {
  const o = { ...s, i, B: r3(beat * per), beat0: beat };
  beat += s.n;
  return o;
});
const TOTAL = r3(beat * per);
const Bof = (id, atBeat = 0) => r3(shots.find((s) => s.id === id).B + atBeat * per);
const trDur = (s) => (s.enter === "first" ? 0 : TR[s.enter].d);
shots.forEach((s, i) => {
  const pre = s.enter === "first" ? 0 : 0.3;
  const next = shots[i + 1];
  s.vStart = r3(s.B - pre); // video element start (includes handle)
  s.vDur = r3(s.n * per + pre + 0.3);
  if (!next) s.vDur = r3(TOTAL - s.vStart);
  s.visStart = s.enter === "first" ? 0 : r3(s.B - trDur(s) / 2); // when it first shows
  s.visEnd = next ? r3(next.B + trDur(next) / 2) : TOTAL;
});

// ---------- text moments -----------------------------------------------------------
// pos: low (lower third, bottom edge y~850) | mid | hero
const TEXTS = [
  { id: "t0", at: 0.1, end: Bof("S01", 0) + 0.12, pos: "hero", h: ["Haris & Alya"], k: "ENGAGEMENT DAY", sfx: "impact", flare: [960, 440, 1.15], sweep: true },
  { id: "t1", at: Bof("S01", 1), end: Bof("S01", 7), pos: "low", h: ["TETAMU MULA TIBA"], sub: "dengan hantaran penuh kasih", sfx: "pop" },
  { id: "t2", at: Bof("S05", 0.3), end: Bof("S05", 5.6), pos: "low", h: ["MAJLIS BERMULA"], sub: "penuh adab dan hormat", sfx: "pop" },
  { id: "t3", at: Bof("S09", 0.4), end: Bof("S09", 5.6), pos: "low", k: "HARI YANG DINANTI", h: ["ENGAGEMENT DAY"], sfx: "pop", sweep: true, shimmer: true },
  { id: "t4", at: Bof("S12", 0.5), end: Bof("S12", 6.6), pos: "low", h: ["DOA & RESTU"], sub: "dipanjatkan dengan penuh harapan", sfx: "pop" },
  { id: "t5", at: Bof("S14", 3), end: Bof("S14", 9.6), pos: "low", h: ["SEBENTUK CINCIN"], sfx: "pop" },
  { id: "t6", at: Bof("S15", 1.5), end: Bof("S15", 10.5), pos: "low", h: ["SEBUAH JANJI"], sub: "terukir pada hari yang indah", sfx: "impact", flare: [960, 690, 0.9], sweep: true },
  { id: "t7", at: Bof("S16", 0.5), end: Bof("S18", 3.6), pos: "low", h: ["RESTU KELUARGA"], sub: "yang paling bermakna", sfx: "pop" },
  { id: "t8", at: Bof("S20", 0.4), end: Bof("S20", 5.7), pos: "low", h: ["BERSAMA", "INSAN TERSAYANG"], sfx: "pop" },
  { id: "t9", at: Bof("S25", 0.4), end: Bof("S25", 3.9), pos: "low", h: ["DUA HATI"], sfx: "pop" },
  { id: "t10", at: Bof("S25", 4.1), end: Bof("S25", 8.4), pos: "low", h: ["SATU NIAT"], sfx: "impact", flare: [960, 700, 0.95], sweep: true },
  { id: "t11", at: Bof("S27", 0.4), end: Bof("S27", 4.6), pos: "low", h: ["JAMUAN &", "GELAK TAWA"], sfx: "pop" },
  { id: "t12", at: Bof("S31", 6.2), end: TOTAL - 0.35, pos: "end", h: ["Terima Kasih"], k: "HARIS & ALYA  ·  ENGAGEMENT DAY", sub: "Semoga dipermudahkan hingga ke jinjang pelamin", sfx: "impact", flare: [960, 430, 1.2], sweep: true },
];
TEXTS.forEach((t) => { t.at = r3(t.at); t.end = r3(t.end); });

// ---------- HTML pieces ------------------------------------------------------------
const W = 1920;
let html = "";
const vids = shots
  .map((s) => {
    const audio = s.mute ? "muted" : `data-has-audio="true" data-volume="1" data-fade-in="0.3" data-fade-out="0.3"`;
    return `    <div class="sh" id="sh_${s.id}" style="z-index:${s.i + 1}"><div class="kb" id="kb_${s.id}"><video id="v_${s.id}" class="clip" src="assets/shots/${s.id}.mp4" playsinline preload="auto" data-start="${s.vStart}" data-duration="${s.vDur}" data-media-start="0" data-track-index="${1 + (s.i % 2)}" ${audio}></video></div></div>`;
  })
  .join("\n");

const esc = (x) => x.replace(/&/g, "&amp;");
const words = (line) =>
  line
    .split(" ")
    .map((w) => `<span class="w"><span class="wi">${esc(w)}</span></span>`)
    .join(" ");
const textHtml = TEXTS.map((t) => {
  const cls = `tx tx-${t.pos}`;
  const hLines = t.h.map((l) => `<div class="hl">${words(l)}</div>`).join("");
  const k = t.k ? `<div class="k">${esc(t.k)}</div>` : "";
  const sub = t.sub ? `<div class="sub">${esc(t.sub)}</div>` : "";
  const inner = t.pos === "hero" ? `<div class="glow"></div><div class="h">${hLines}</div>${k}` : t.pos === "end" ? `<div class="glow"></div><div class="h">${hLines}</div>${k}${sub}` : `<div class="glow"></div>${k}<div class="h">${hLines}</div>${sub}`;
  return `    <div id="${t.id}" class="clip ${cls}" data-start="${t.at}" data-duration="${r3(t.end - t.at)}" data-track-index="5">${inner}</div>`;
}).join("\n");

// flares: text-driven + transition-driven (light)
const FLARES = [];
const SWEEPS = [];
const FLASHES = [];
const SFX = []; // {src, t, vol}
TEXTS.forEach((t) => {
  if (t.flare) FLARES.push({ t: t.at + 0.05, x: t.flare[0], y: t.flare[1], s: t.flare[2] });
  if (t.sweep) SWEEPS.push({ t: t.at + 0.05 });
  const peak = SFX_PEAK[t.sfx];
  SFX.push({ src: t.sfx, t: Math.max(0, t.at - peak), vol: t.sfx === "impact" ? 0.9 : 0.5 });
  if (t.sweep || t.shimmer) SFX.push({ src: "shimmer", t: t.at + 0.05, vol: 0.3 });
});
shots.forEach((s) => {
  if (s.enter === "first") return;
  const tr = TR[s.enter];
  const peak = SFX_PEAK[tr.sfx];
  SFX.push({ src: tr.sfx, t: Math.max(0, s.B - peak), vol: tr.vol });
  if (s.enter === "light") {
    FLASHES.push({ t: s.B - 0.2, peak: 0.62, dur: 0.55 });
    FLARES.push({ t: s.B - 0.12, x: 1380, y: 330, s: 0.8 });
    SFX.push({ src: "shimmer", t: s.B - 0.1, vol: 0.28 });
  }
});

const flareHtml = FLARES.map((f, i) => `    <div class="flare" id="fl${i}" style="left:${f.x}px;top:${f.y}px"><i class="core"></i><i class="streak"></i><i class="ghost g1"></i><i class="ghost g2"></i></div>`).join("\n");
const sweepHtml = SWEEPS.map((_, i) => `    <div class="sweep" id="sw${i}"><i></i></div>`).join("\n");
const flashHtml = FLASHES.map((_, i) => `    <div class="flash" id="fs${i}"></div>`).join("\n");
const trackEnd = {};
const sfxHtml = SFX.sort((a, b) => a.t - b.t)
  .map((e, i) => {
    const start = r3(e.t), end = start + SFX_LEN[e.src];
    let tr = 8;
    while ((trackEnd[tr] ?? -1) > start) tr++; // first lane that is free -> no overlapping audio on one lane
    trackEnd[tr] = end;
    return `    <audio id="sfx${i}" src="assets/sfx/${e.src}.wav" data-start="${start}" data-duration="${SFX_LEN[e.src]}" data-volume="${e.vol}" data-track-index="${tr}"></audio>`;
  })
  .join("\n");

// ---------- GSAP script -------------------------------------------------------------
const js = [];
js.push(`const tl = gsap.timeline({ paused: true });`);
js.push(`const W = ${W};`);
// initial states
shots.forEach((s) => { if (s.enter !== "first") js.push(`tl.set("#sh_${s.id}", { opacity: 0 }, 0);`); });
// Ken Burns (inner wrapper) – slow, alternating push / pull
shots.forEach((s) => {
  const a = s.kb === "in" ? [1.0, 1.07] : [1.07, 1.0];
  const dx = s.i % 2 ? 22 : -22;
  js.push(`tl.fromTo("#kb_${s.id}", { scale: ${a[0]}, x: ${s.kb === "in" ? 0 : dx} }, { scale: ${a[1]}, x: ${s.kb === "in" ? dx : 0}, duration: ${r3(s.visEnd - s.visStart)}, ease: "none" }, ${s.visStart});`);
});
// transitions
shots.forEach((s, i) => {
  if (s.enter === "first") return;
  const p = shots[i - 1];
  const d = TR[s.enter].d;
  const t0 = r3(s.B - d / 2);
  const id = `#sh_${s.id}`, pid = `#sh_${p.id}`;
  if (s.enter === "dissolve" || s.enter === "light") {
    js.push(`tl.fromTo("${id}", { opacity: 0 }, { opacity: 1, duration: ${d}, ease: "sine.inOut" }, ${t0});`);
  } else if (s.enter === "whip") {
    js.push(`tl.fromTo("${id}", { opacity: 1, x: W, filter: "blur(30px)" }, { x: 0, filter: "blur(0px)", duration: ${d}, ease: "power3.inOut" }, ${t0});`);
    js.push(`tl.to("${pid}", { x: -W, filter: "blur(30px)", duration: ${d}, ease: "power3.inOut" }, ${t0});`);
  } else if (s.enter === "push") {
    js.push(`tl.fromTo("${id}", { opacity: 0, scale: 1.28, filter: "blur(16px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: ${d}, ease: "power2.out" }, ${t0});`);
    js.push(`tl.to("${pid}", { scale: 1.32, filter: "blur(16px)", opacity: 0, duration: ${d}, ease: "power2.in" }, ${t0});`);
  }
});
// text moments
TEXTS.forEach((t) => {
  const sel = `#${t.id}`;
  const hero = t.pos === "hero" || t.pos === "end";
  js.push(`tl.set("${sel}", { opacity: 1 }, ${t.at});`);
  js.push(`tl.fromTo("${sel} .glow", { opacity: 0, scale: 0.6 }, { opacity: ${hero ? 0.95 : 0.7}, scale: 1.1, duration: 0.5, ease: "power2.out" }, ${t.at});`);
  js.push(`tl.to("${sel} .glow", { opacity: ${hero ? 0.4 : 0.22}, duration: 1.2, ease: "sine.inOut" }, ${r3(t.at + 0.5)});`);
  if (hero) {
    js.push(`tl.fromTo("${sel} .wi", { yPercent: 115, scale: 1.5, opacity: 0 }, { yPercent: 0, scale: 1, opacity: 1, duration: 0.7, ease: "expo.out", stagger: 0.1 }, ${t.at});`);
  } else {
    js.push(`tl.fromTo("${sel} .wi", { yPercent: 115 }, { yPercent: 0, duration: 0.55, ease: "power4.out", stagger: 0.07 }, ${t.at});`);
  }
  if (t.k) js.push(`tl.fromTo("${sel} .k", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, ${r3(t.at + (t.pos === "end" ? 0.55 : 0.1))});`);
  if (t.sub) js.push(`tl.fromTo("${sel} .sub", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, ${r3(t.at + (t.pos === "end" ? 0.95 : 0.4))});`);
  if (t.pos !== "end") {
    js.push(`tl.to("${sel}", { opacity: 0, y: -22, duration: 0.3, ease: "power2.in" }, ${r3(t.end - 0.3)});`);
  }
});
// flares
FLARES.forEach((f, i) => {
  const t = r3(f.t), s = f.s;
  js.push(`tl.fromTo("#fl${i}", { opacity: 0 }, { opacity: 1, duration: 0.14, ease: "power2.out" }, ${t});`);
  js.push(`tl.to("#fl${i}", { opacity: 0, duration: 0.75, ease: "power2.in" }, ${r3(t + 0.16)});`);
  js.push(`tl.fromTo("#fl${i} .core", { scale: ${r3(0.5 * s)} }, { scale: ${r3(1.25 * s)}, duration: 0.9, ease: "power2.out" }, ${t});`);
  js.push(`tl.fromTo("#fl${i} .streak", { scaleX: 0.15, x: -80 }, { scaleX: ${r3(1.0 * s)}, x: 120, duration: 0.9, ease: "power3.out" }, ${t});`);
  js.push(`tl.fromTo("#fl${i} .g1", { x: 0, y: 0, scale: 0.5 }, { x: ${Math.round(-340 * s)}, y: ${Math.round(70 * s)}, scale: 1, duration: 0.9, ease: "power2.out" }, ${t});`);
  js.push(`tl.fromTo("#fl${i} .g2", { x: 0, y: 0, scale: 0.4 }, { x: ${Math.round(260 * s)}, y: ${Math.round(-50 * s)}, scale: 0.9, duration: 0.9, ease: "power2.out" }, ${t});`);
});
// light sweeps
SWEEPS.forEach((sw, i) => {
  const t = r3(sw.t);
  js.push(`tl.fromTo("#sw${i}", { x: -900, opacity: 0 }, { x: 2900, opacity: 1, duration: 1.0, ease: "power2.inOut" }, ${t});`);
  js.push(`tl.to("#sw${i}", { opacity: 0, duration: 0.25, ease: "power1.in" }, ${r3(t + 0.78)});`);
});
// flashes (light-wash transitions)
FLASHES.forEach((f, i) => {
  js.push(`tl.fromTo("#fs${i}", { opacity: 0 }, { opacity: ${f.peak}, duration: ${r3(f.dur * 0.4)}, ease: "power2.out" }, ${r3(f.t)});`);
  js.push(`tl.to("#fs${i}", { opacity: 0, duration: ${r3(f.dur * 0.6)}, ease: "power2.in" }, ${r3(f.t + f.dur * 0.4)});`);
});
// end card: dim the last clip behind the thank-you + final fade to black
const endT = Bof("S31", 6);
js.push(`tl.fromTo("#endDim", { opacity: 0 }, { opacity: 1, duration: 1.0, ease: "power2.inOut" }, ${r3(endT - 0.2)});`);
js.push(`tl.fromTo("#fadeOut", { opacity: 0 }, { opacity: 1, duration: 1.6, ease: "power1.inOut" }, ${r3(TOTAL - 1.6)});`);
js.push(`window.__timelines = window.__timelines || {};`);
js.push(`window.__timelines["main"] = tl;`);
js.push(`tl.seek(0);`);

// ---------- page ---------------------------------------------------------------------
const page = `<!doctype html>
<html lang="ms">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <title>Haris &amp; Alya – Engagement Day</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
${fontsCss}
      :root { --gold: #f6dcaa; --cream: #fff4e0; --ink: #170d08; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1920px; height: 1080px; overflow: hidden; background: #0c0705; }
      #root { position: relative; width: 1920px; height: 1080px; overflow: hidden; background: #0c0705; font-family: "Montserrat", sans-serif; }
      .sh { position: absolute; inset: 0; transform-origin: 50% 50%; will-change: transform, opacity, filter; }
      .kb { position: absolute; inset: 0; transform-origin: 50% 50%; }
      video { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; object-fit: cover; }
      /* subtle vignette keeps bright pastel footage from feeling flat */
      #vig { position: absolute; inset: 0; z-index: 60; pointer-events: none; background: radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 58%, rgba(20,8,2,.30) 100%); }
      #endDim { position: absolute; inset: 0; z-index: 61; opacity: 0; pointer-events: none; background: radial-gradient(ellipse at 50% 45%, rgba(14,7,3,.58), rgba(14,7,3,.82)); }
      /* light effects */
      .flash { position: absolute; inset: 0; z-index: 70; opacity: 0; pointer-events: none; mix-blend-mode: screen; background: radial-gradient(circle at 50% 50%, rgba(255,251,238,1), rgba(255,226,172,.85) 55%, rgba(255,196,128,.55)); }
      .sweep { position: absolute; top: -10%; left: 0; width: 520px; height: 120%; z-index: 71; opacity: 0; pointer-events: none; mix-blend-mode: screen; }
      .sweep i { display: block; width: 100%; height: 100%; transform: skewX(-20deg); background: linear-gradient(90deg, rgba(255,244,226,0), rgba(255,244,226,.55) 50%, rgba(255,244,226,0)); }
      .flare { position: absolute; width: 0; height: 0; z-index: 72; opacity: 0; pointer-events: none; mix-blend-mode: screen; }
      .flare i { position: absolute; display: block; }
      .flare .core { width: 560px; height: 560px; margin: -280px 0 0 -280px; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,.95) 0%, rgba(255,228,176,.62) 16%, rgba(255,190,112,.2) 42%, rgba(255,190,112,0) 70%); }
      .flare .streak { width: 1500px; height: 9px; margin: -4px 0 0 -750px; border-radius: 6px; background: linear-gradient(90deg, rgba(255,236,204,0), rgba(255,240,214,.95) 50%, rgba(255,236,204,0)); filter: blur(1.5px); }
      .flare .ghost { border-radius: 50%; }
      .flare .g1 { width: 150px; height: 150px; margin: -75px 0 0 -75px; background: radial-gradient(circle, rgba(255,205,150,.5), rgba(255,205,150,0) 70%); }
      .flare .g2 { width: 100px; height: 100px; margin: -50px 0 0 -50px; background: radial-gradient(circle, rgba(255,240,210,.55), rgba(255,240,210,0) 70%); }
      #fadeOut { position: absolute; inset: 0; z-index: 90; opacity: 0; background: #0c0705; pointer-events: none; }
      /* kinetic type – centred, kept inside the TikTok safe zone (top 150 / bottom 230 clear) */
      .tx { position: absolute; left: 50%; z-index: 80; opacity: 0; transform: translateX(-50%); text-align: center; isolation: isolate; width: 1500px; color: var(--cream); }
      .tx::before { content: ""; position: absolute; inset: -70px -120px; z-index: -2; background: radial-gradient(closest-side ellipse at 50% 55%, rgba(18,9,4,.74), rgba(18,9,4,.44) 50%, rgba(18,9,4,0) 100%); }
      .tx .glow { position: absolute; left: 50%; top: 50%; width: 1100px; height: 360px; margin: -180px 0 0 -550px; z-index: -1; border-radius: 50%; opacity: 0; mix-blend-mode: screen; background: radial-gradient(ellipse, rgba(255,205,140,.50), rgba(255,205,140,0) 68%); }
      .tx .h { font-weight: 900; text-transform: uppercase; letter-spacing: .03em; line-height: 1.04; font-size: 112px; text-shadow: 0 0 30px rgba(255,214,150,.42), 0 3px 6px rgba(0,0,0,.55), 0 6px 22px rgba(0,0,0,.65); }
      .tx .hl { display: block; }
      .tx .w { display: inline-block; overflow: hidden; vertical-align: top; padding: .06em .05em .1em; }
      .tx .wi { display: inline-block; }
      .tx .k { font-weight: 600; letter-spacing: .42em; font-size: 32px; color: var(--gold); text-transform: uppercase; margin: 0 0 18px; text-shadow: 0 2px 10px rgba(0,0,0,.7); padding-left: .42em; }
      .tx .sub { font-family: "Playfair Display", serif; font-style: italic; font-weight: 700; font-size: 56px; color: var(--gold); margin-top: 10px; text-shadow: 0 0 20px rgba(255,214,150,.4), 0 3px 12px rgba(0,0,0,.65); }
      .tx-low { bottom: 235px; }
      .tx-hero { top: 330px; }
      .tx-hero .h { font-family: "Playfair Display", serif; font-style: italic; font-weight: 800; text-transform: none; letter-spacing: 0; font-size: 230px; line-height: 1.05; }
      .tx-hero .k { margin: 22px 0 0; font-size: 38px; }
      .tx-end { top: 290px; }
      .tx-end .h { font-family: "Playfair Display", serif; font-style: italic; font-weight: 800; text-transform: none; letter-spacing: 0; font-size: 190px; line-height: 1.08; }
      .tx-end .k { margin: 26px 0 0; font-size: 30px; }
      .tx-end .sub { font-size: 50px; margin-top: 34px; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="1920" data-height="1080" data-fps="30">
${vids}
      <div id="vig" class="clip" data-start="0" data-duration="${TOTAL}" data-track-index="3"></div>
      <div id="endDim" class="clip" data-start="0" data-duration="${TOTAL}" data-track-index="3"></div>
${flashHtml}
${sweepHtml}
${flareHtml}
${textHtml}
      <div id="fadeOut" class="clip" data-start="0" data-duration="${TOTAL}" data-track-index="6"></div>
      <audio id="music" src="assets/music.m4a" data-start="0" data-duration="${TOTAL}" data-volume="0.22" data-fade-in="0.2" data-fade-out="3.6" data-track-index="7"></audio>
${sfxHtml}
    </div>
    <script>
${js.join("\n")}
    </script>
  </body>
</html>
`;
fs.writeFileSync(path.join(ROOT, "index.html"), page);
console.log(`index.html written · ${shots.length} shots · ${TOTAL}s (${beat} beats) · ${SFX.length} sfx · ${FLARES.length} flares · ${SWEEPS.length} sweeps · ${FLASHES.length} flashes`);
