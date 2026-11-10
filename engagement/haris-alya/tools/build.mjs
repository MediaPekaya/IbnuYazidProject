// Generates index.html for the Haris & Alya engagement edit.
// Everything is timed from the music beat grid in shots.json (126.02 BPM, 1 beat = 0.4761 s).
// Audio = the song only (original clip audio muted, no SFX).  60 fps composition.
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
const FPS = 60;
const MUSIC_VOL = 0.78;
const DATE = "Sabtu, 7 November 2026";

// seeded PRNG so every build / render is identical
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = mulberry32(20261107);

// ---------- transitions: every cut is a smooth, glittering overlap (no hard cuts) ------------------
// bloom = soft dissolve with a gentle scale-in · glide = slow sideways drift · zoom = soft zoom-through · light = bloom + golden light leak + flare
const D = 0.68; // every transition lasts 0.68 s, centred on a beat
const KIND = { dissolve: "bloom", whip: "glide", push: "zoom", light: "light" };

// ---------- shot timeline ---------------------------------------------------------
let beat = 0;
const shots = cfg.shots.map((s, i) => {
  const o = { ...s, i, B: r3(beat * per), beat0: beat, kind: KIND[s.enter] };
  beat += s.n;
  return o;
});
const TOTAL = r3(beat * per);
const Bof = (id, atBeat = 0) => r3(shots.find((s) => s.id === id).B + atBeat * per);
const trDur = (s) => (s.enter === "first" ? 0 : D);
shots.forEach((s, i) => {
  const pre = s.enter === "first" ? 0 : 0.35;
  const next = shots[i + 1];
  s.vStart = r3(s.B - pre);
  s.vDur = r3(s.n * per + pre + 0.35);
  if (!next) s.vDur = r3(TOTAL - s.vStart);
  s.visStart = s.enter === "first" ? 0 : r3(s.B - trDur(s) / 2);
  s.visEnd = next ? r3(next.B + trDur(next) / 2) : TOTAL;
});

// ---------- text moments -----------------------------------------------------------
// Titles only (script lettering). Sub-lines exist only on the intro (date) and the closing card (date + prayer).
// Nothing is ever placed over the ring / hands: the hook opens clean on the ring, the title card sits on a defocused shot,
// and the ring close-up (S15) carries no text at all.
const INTRO_AT = 0.25;
const TEXTS = [
  { id: "t0", at: INTRO_AT, end: r3(Bof("S01", 0) - 0.3), pos: "intro", h: ["Haris", "&", "Alya"], date: DATE },
  { id: "t1", at: Bof("S01", 1.2), end: Bof("S01", 7.2), pos: "low", h: ["Tetamu Tersayang Tiba"] },
  { id: "t2", at: Bof("S05", 0.3), end: Bof("S05", 5.6), pos: "low", h: ["Bismillah, Majlis Bermula"] },
  { id: "t4", at: Bof("S12", 0.5), end: Bof("S12", 6.6), pos: "low", h: ["Doa Restu Berlimpah"] },
  { id: "t5", at: Bof("S14", 0.6), end: Bof("S14", 4.9), pos: "low2", h: ["Sebentuk Cincin Pengikat Kasih"] },
  { id: "t6", at: Bof("S14", 5.2), end: Bof("S14", 9.7), pos: "low2", h: ["Sebuah Janji Terpatri"], flare: [960, 790, 0.9], sweep: true, sparks: [[640, 790], [1290, 780], [960, 700]] },
  { id: "t7", at: Bof("S16", 0.5), end: Bof("S18", 3.6), pos: "low", h: ["Restu Keluarga Tercinta"] },
  { id: "t8", at: Bof("S20", 0.4), end: Bof("S20", 5.7), pos: "low", h: ["Bersama Insan Tersayang"] },
  { id: "t9", at: Bof("S25", 0.4), end: Bof("S25", 3.9), pos: "low2", h: ["Dua Hati Bertaut"] },
  { id: "t10", at: Bof("S25", 4.1), end: Bof("S25", 8.4), pos: "low2", h: ["Satu Niat Suci"], flare: [960, 760, 0.95], sweep: true, sparks: [[700, 770], [1230, 760], [960, 690]] },
  { id: "t11", at: Bof("S27", 0.4), end: Bof("S27", 4.6), pos: "low", h: ["Jamuan & Bersurai"] },
  { id: "t12", at: Bof("S31", 4.4), end: r3(TOTAL - 0.2), pos: "end", h: ["Terima", "Kasih"], date: DATE, sub: "Semoga dipermudahkan hingga ke jinjang pelamin", flare: [960, 430, 1.2], sweep: true, sparks: [[690, 380], [1250, 350], [960, 240]] },
];
TEXTS.forEach((t) => { t.at = r3(t.at); t.end = r3(t.end); });

// ---------- HTML pieces ------------------------------------------------------------
const W = 1920;
const vids = shots
  .map((s) => `    <div class="sh" id="sh_${s.id}" style="z-index:${s.i + 1}"><div class="kb" id="kb_${s.id}"><video id="v_${s.id}" class="clip" src="assets/shots/${s.id}.mp4" muted playsinline preload="auto" data-start="${s.vStart}" data-duration="${s.vDur}" data-media-start="0" data-track-index="${1 + (s.i % 2)}"></video></div></div>`)
  .join("\n");

const esc = (x) => x.replace(/&/g, "&amp;");
// per-letter spans (inline, so the cursive joins are untouched) -> letters "write on" left to right
const letters = (line) => [...line].map((ch) => (ch === " " ? " " : `<span class="c">${esc(ch)}</span>`)).join("");
const nm = (arr) => arr.map((w) => `<span class="nm">${esc(w)}</span>`).join(" ");
const ringsHtml = `<div class="rings"><i class="ring rl"></i><i class="ring rr"></i></div>`;
const ruleHtml = `<div class="rule"><i class="line ll"></i><i class="dia"></i><i class="line lr"></i></div>`;
const textHtml = TEXTS.map((t) => {
  const dateHtml = t.date ? `<div class="date">${esc(t.date)}</div>` : "";
  const subHtml = t.sub ? `<div class="sub">${esc(t.sub)}</div>` : "";
  let inner;
  if (t.pos === "intro") inner = `<div class="glow"></div><div class="h">${nm(t.h)}</div>${ruleHtml}${dateHtml}`;
  else if (t.pos === "end") inner = `<div class="glow"></div><div class="h">${nm(t.h)}</div>${ruleHtml}${dateHtml}${subHtml}`;
  else inner = `<div class="h">${t.h.map((l) => `<div class="hl">${letters(l)}</div>`).join("")}</div>`;
  return `    <div id="${t.id}" class="clip tx tx-${t.pos}" data-start="${t.at}" data-duration="${r3(t.end - t.at)}" data-track-index="5">${inner}</div>`;
}).join("\n");

// lighting events ---------------------------------------------------------------
const FLARES = [], SWEEPS = [], SPARKS = [], LEAKS = [], WASHES = [], GLITTER = [];
// title card: golden bloom flare as the names land, sparkles around the names
FLARES.push({ t: INTRO_AT + 0.35, x: 560, y: 700, s: 0.9 });
SWEEPS.push({ t: INTRO_AT + 1.3, fixed: true });
[[1000, 690, INTRO_AT + 1.0], [330, 640, INTRO_AT + 1.5], [760, 880, INTRO_AT + 1.75]].forEach(([x, y, t]) => SPARKS.push({ t, x, y, s: 1 }));
TEXTS.forEach((t) => {
  if (t.flare) FLARES.push({ t: t.at + 0.05, x: t.flare[0], y: t.flare[1], s: t.flare[2] });
  if (t.sweep) SWEEPS.push({ t: t.at + 0.05, fixed: true });
  (t.sparks || []).forEach(([x, y], i) => SPARKS.push({ t: t.at + 0.3 + i * 0.22, x, y, s: 0.85 }));
});
// transitions: glitter burst + golden wash + light sweep on EVERY cut; leak + flare on the "light" ones
const GL_POOL = 14, GL_PER = 12;
let glN = 0;
shots.forEach((s) => {
  if (s.enter === "first") return;
  const t0 = r3(s.B - D / 2);
  WASHES.push({ t: t0, kind: s.kind });
  SWEEPS.push({ t: r3(t0 - 0.08), fixed: false, dir: glN % 2 ? -1 : 1 });
  for (let k = 0; k < GL_PER; k++) {
    const p = k / (GL_PER - 1);
    const dirx = s.kind === "glide" ? 1 : glN % 2 ? -1 : 1;
    const x = Math.round(230 + (dirx > 0 ? p : 1 - p) * 1460 + (rnd() - 0.5) * 420);
    const y = Math.round(150 + rnd() * 780);
    GLITTER.push({ t: r3(t0 - 0.06 + p * (D + 0.1) + rnd() * 0.08), x, y, s: r3(0.5 + rnd() * 1.0), rot: Math.round(rnd() * 90), slot: (glN * GL_PER + k) % GL_POOL });
  }
  glN++;
  if (s.kind === "light") {
    LEAKS.push({ t: r3(s.B - 0.4), dur: 1.15 });
    FLARES.push({ t: r3(s.B - 0.2), x: 1400, y: 300, s: 0.85 });
  }
});
// keep pooled light sweeps from overlapping each other (one element, 1.4 s each)
SWEEPS.sort((a, b) => a.t - b.t);
const sweepsKept = [];
for (const sw of SWEEPS) { const last = sweepsKept[sweepsKept.length - 1]; if (!last || sw.t - last.t >= 1.5) sweepsKept.push(sw); else if (sw.fixed) { sweepsKept[sweepsKept.length - 1] = sw; } }

// bokeh – slow drifting golden orbs, seeded, subtle
const BOKEH = [];
for (let i = 0; i < 10; i++) {
  const size = Math.round(40 + rnd() * 110);
  const life = 4 + rnd() * 3.5;
  const t0 = r3(0.4 + (i / 10) * (TOTAL - 7) + rnd() * 2.2);
  BOKEH.push({ x: Math.round(60 + rnd() * 1760), y: Math.round(640 + rnd() * 480), size, t0, life: r3(life), dx: Math.round((rnd() - 0.5) * 140), dy: -Math.round(240 + rnd() * 200), peak: r3(0.16 + rnd() * 0.2) });
}

const SPARK_POOL = 4;
const flareHtml = `    <div class="flare" id="fl"><i class="wide"></i><i class="core"></i><i class="streak"></i><i class="ghost g1"></i><i class="ghost g2"></i><i class="ghost g3"></i></div>`;
const sweepHtml = `    <div class="sweep" id="sw"><i></i></div>`;
const scrimHtml = `    <div id="scrimB"></div>`;
const washHtml = `    <div class="wash" id="wash"></div>`;
const sparkHtml = Array.from({ length: SPARK_POOL }, (_, i) => `    <div class="spark" id="sp${i}"><i></i><i></i><b></b></div>`).join("\n");
const glitterHtml = Array.from({ length: GL_POOL }, (_, i) => `    <div class="gl" id="gl${i}"></div>`).join("\n");
const leakHtml = `    <div class="leak" id="lk"><i class="b1"></i><i class="b2"></i><i class="wash"></i></div>`;
const bokehHtml = BOKEH.map((b, i) => `    <div class="bk" id="bk${i}" style="left:${b.x}px;top:${b.y}px;width:${b.size}px;height:${b.size}px"></div>`).join("\n");

// ---------- GSAP script -------------------------------------------------------------
const js = [];
js.push(`const tl = gsap.timeline({ paused: true });`);
js.push(`const W = ${W};`);
shots.forEach((s) => { if (s.enter !== "first") js.push(`gsap.set("#sh_${s.id}", { opacity: 0 });`); });
// opening: the first frame is the ring itself, fading up out of a warm golden bloom (never black)
js.push(`tl.fromTo("#sh_${shots[0].id}", { filter: "brightness(1.55) blur(9px)" }, { filter: "brightness(1) blur(0px)", duration: 0.9, ease: "power2.out" }, 0);`);
// Ken Burns (inner wrapper) – slow push / pull
shots.forEach((s) => {
  if (s.frame) { // custom framing: keep a face in the upper area, clear of the lettering below
    const f = s.frame;
    js.push(`gsap.set("#kb_${s.id}", { transformOrigin: "0 0" });`);
    js.push(`tl.fromTo("#kb_${s.id}", { scale: ${f.s0}, x: ${f.x0}, y: ${f.y0} }, { scale: ${f.s1}, x: ${f.x1}, y: ${f.y1}, duration: ${r3(s.visEnd - s.visStart)}, ease: "none" }, ${s.visStart});`);
    return;
  }
  const a = s.kb === "in" ? [1.0, 1.07] : [1.07, 1.0];
  const dx = s.i % 2 ? 22 : -22;
  js.push(`tl.fromTo("#kb_${s.id}", { scale: ${a[0]}, x: ${s.kb === "in" ? 0 : dx} }, { scale: ${a[1]}, x: ${s.kb === "in" ? dx : 0}, duration: ${r3(s.visEnd - s.visStart)}, ease: "none" }, ${s.visStart});`);
});
// transitions – the outgoing shot stays opaque underneath (no dim dip), the incoming one blooms in over it
shots.forEach((s, i) => {
  if (s.enter === "first") return;
  const p = shots[i - 1];
  const t0 = r3(s.B - D / 2);
  const id = `#sh_${s.id}`, pid = `#sh_${p.id}`;
  if (s.kind === "bloom") {
    js.push(`tl.fromTo("${id}", { opacity: 0, scale: 1.07, filter: "blur(8px) brightness(1.2)" }, { opacity: 1, scale: 1, filter: "blur(0px) brightness(1)", duration: ${D}, ease: "sine.inOut" }, ${t0});`);
    js.push(`tl.to("${pid}", { scale: 1.035, filter: "blur(4px) brightness(1.1)", duration: ${D}, ease: "sine.inOut" }, ${t0});`);
  } else if (s.kind === "glide") {
    js.push(`tl.fromTo("${id}", { opacity: 0, x: 230, filter: "blur(10px) brightness(1.15)" }, { opacity: 1, x: 0, filter: "blur(0px) brightness(1)", duration: ${D}, ease: "power2.inOut" }, ${t0});`);
    js.push(`tl.to("${pid}", { x: -230, filter: "blur(10px) brightness(1.1)", duration: ${D}, ease: "power2.inOut" }, ${t0});`);
  } else if (s.kind === "zoom") {
    js.push(`tl.fromTo("${id}", { opacity: 0, scale: 1.2, filter: "blur(12px) brightness(1.2)" }, { opacity: 1, scale: 1, filter: "blur(0px) brightness(1)", duration: ${D}, ease: "power2.out" }, ${t0});`);
    js.push(`tl.to("${pid}", { scale: 1.1, filter: "blur(8px) brightness(1.1)", duration: ${D}, ease: "power2.in" }, ${t0});`);
  } else {
    js.push(`tl.fromTo("${id}", { opacity: 0, scale: 1.05, filter: "blur(6px) brightness(1.55)" }, { opacity: 1, scale: 1, filter: "blur(0px) brightness(1)", duration: ${r3(D + 0.25)}, ease: "sine.out" }, ${t0});`);
    js.push(`tl.to("${pid}", { scale: 1.03, filter: "blur(4px) brightness(1.25)", duration: ${D}, ease: "sine.inOut" }, ${t0});`);
  }
});
// intro title sequence (soft, elegant)
{
  const t = TEXTS[0], sel = "#t0", a = t.at;
  js.push(`tl.set("${sel}", { opacity: 1 }, ${a});`);
  js.push(`gsap.set("#scrimB", { opacity: 0 });`);
  js.push(`tl.fromTo("#scrimB", { opacity: 0 }, { opacity: 1, duration: 0.9, ease: "sine.out" }, ${a});`);
  js.push(`tl.to("#scrimB", { opacity: 0, duration: 0.6, ease: "sine.in" }, ${r3(t.end - 0.55)});`);
  js.push(`tl.fromTo("${sel} .glow", { opacity: 0, scale: 0.5 }, { opacity: 0.95, scale: 1.15, duration: 1.7, ease: "power2.out" }, ${a});`);
  js.push(`tl.to("${sel} .glow", { opacity: 0.5, duration: 1.2, ease: "sine.inOut" }, ${r3(a + 1.7)});`);
  js.push(`tl.fromTo("${sel} .nm", { opacity: 0, y: 36, scale: 1.07, filter: "blur(16px)" }, { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 1.1, ease: "power3.out", stagger: 0.2 }, ${r3(a + 0.25)});`);
  js.push(`tl.fromTo("${sel} .nm", { backgroundPosition: "100% 0%" }, { backgroundPosition: "0% 0%", duration: 1.6, ease: "sine.inOut", stagger: 0.12 }, ${r3(a + 1.1)});`);
  js.push(`tl.fromTo("${sel} .ll", { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: "power3.out" }, ${r3(a + 0.8)});`);
  js.push(`tl.fromTo("${sel} .lr", { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: "power3.out" }, ${r3(a + 0.8)});`);
  js.push(`tl.fromTo("${sel} .dia", { scale: 0, rotation: 0 }, { scale: 1, rotation: 45, duration: 0.7, ease: "power3.out" }, ${r3(a + 0.8)});`);
  js.push(`tl.fromTo("${sel} .date", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, ${r3(a + 0.85)});`);
  js.push(`tl.to("${sel}", { opacity: 0, y: -18, duration: 0.5, ease: "power2.in" }, ${r3(t.end - 0.5)});`);
}
// remaining text moments
TEXTS.slice(1).forEach((t) => {
  const sel = `#${t.id}`;
  js.push(`tl.set("${sel}", { opacity: 1 }, ${t.at});`);
  if (t.pos === "end") {
    js.push(`tl.fromTo("${sel} .glow", { opacity: 0, scale: 0.6 }, { opacity: 0.95, scale: 1.1, duration: 0.7, ease: "power2.out" }, ${t.at});`);
    js.push(`tl.to("${sel} .glow", { opacity: 0.45, duration: 1.3, ease: "sine.inOut" }, ${r3(t.at + 0.7)});`);
    js.push(`tl.fromTo("${sel} .nm", { opacity: 0, y: 34, scale: 1.07, filter: "blur(14px)" }, { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 1.1, ease: "power3.out", stagger: 0.2 }, ${t.at});`);
    js.push(`tl.fromTo("${sel} .nm", { backgroundPosition: "100% 0%" }, { backgroundPosition: "0% 0%", duration: 1.8, ease: "sine.inOut", stagger: 0.12 }, ${r3(t.at + 0.9)});`);
    js.push(`tl.fromTo("${sel} .ll", { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: "power3.out" }, ${r3(t.at + 0.7)});`);
    js.push(`tl.fromTo("${sel} .lr", { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: "power3.out" }, ${r3(t.at + 0.7)});`);
    js.push(`tl.fromTo("${sel} .dia", { scale: 0, rotation: 0 }, { scale: 1, rotation: 45, duration: 0.8, ease: "power3.out" }, ${r3(t.at + 0.7)});`);
    js.push(`tl.fromTo("${sel} .date", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9, ease: "power2.out" }, ${r3(t.at + 1.5)});`);
    js.push(`tl.fromTo("${sel} .sub", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.9, ease: "power2.out" }, ${r3(t.at + 2.0)});`);
  } else {
    // handwriting: letters appear left-to-right while the line settles in with a soft blur-to-sharp
    js.push(`tl.fromTo("${sel} .h", { y: 26, filter: "blur(6px)" }, { y: 0, filter: "blur(0px)", duration: 0.7, ease: "power3.out" }, ${t.at});`);
    js.push(`tl.fromTo("${sel} .c", { opacity: 0 }, { opacity: 1, duration: 0.22, ease: "none", stagger: 0.042 }, ${t.at});`);
    js.push(`tl.to("${sel}", { opacity: 0, y: -18, duration: 0.4, ease: "power2.in" }, ${r3(t.end - 0.4)});`);
  }
});
// baselines for the pooled light elements (rest state before / between events)
js.push(`gsap.set("#fl", { opacity: 0 }); gsap.set("#fl .core", { scale: 0.5 }); gsap.set("#fl .wide", { scaleX: 0.2 }); gsap.set("#fl .streak", { scaleX: 0.15, x: -90 });`);
js.push(`gsap.set("#fl .g1", { x: 0, y: 0, scale: 0.5 }); gsap.set("#fl .g2", { x: 0, y: 0, scale: 0.4 }); gsap.set("#fl .g3", { x: 0, y: 0, scale: 0.3 });`);
js.push(`gsap.set("#sw", { x: -1000, opacity: 0 }); gsap.set("#lk", { opacity: 0 }); gsap.set("#lk .b1", { x: -900 }); gsap.set("#lk .b2", { x: -1300 }); gsap.set("#lk .wash", { opacity: 0 }); gsap.set("#wash", { opacity: 0 });`);
for (let i = 0; i < GL_POOL; i++) js.push(`gsap.set("#gl${i}", { opacity: 0, scale: 0 });`);
// anamorphic flare (one pooled element, moved to each event)
FLARES.forEach((f) => {
  const t = r3(f.t), k = f.s;
  js.push(`tl.set("#fl", { x: ${f.x}, y: ${f.y} }, ${t});`);
  js.push(`tl.fromTo("#fl", { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "sine.out" }, ${t});`);
  js.push(`tl.to("#fl", { opacity: 0, duration: 1.0, ease: "sine.in" }, ${r3(t + 0.3)});`);
  js.push(`tl.fromTo("#fl .core", { scale: 0.5 }, { scale: ${r3(1.3 * k)}, duration: 1.3, ease: "power2.out" }, ${t});`);
  js.push(`tl.fromTo("#fl .wide", { scaleX: 0.2 }, { scaleX: ${r3(k)}, duration: 1.3, ease: "power3.out" }, ${t});`);
  js.push(`tl.fromTo("#fl .streak", { scaleX: 0.15, x: -90 }, { scaleX: ${r3(k)}, x: 130, duration: 1.3, ease: "power3.out" }, ${t});`);
  js.push(`tl.fromTo("#fl .g1", { x: 0, y: 0, scale: 0.5 }, { x: ${Math.round(-360 * k)}, y: ${Math.round(74 * k)}, scale: 1, duration: 1.3, ease: "power2.out" }, ${t});`);
  js.push(`tl.fromTo("#fl .g2", { x: 0, y: 0, scale: 0.4 }, { x: ${Math.round(280 * k)}, y: ${Math.round(-54 * k)}, scale: 0.9, duration: 1.3, ease: "power2.out" }, ${t});`);
  js.push(`tl.fromTo("#fl .g3", { x: 0, y: 0, scale: 0.3 }, { x: ${Math.round(520 * k)}, y: ${Math.round(96 * k)}, scale: 0.8, duration: 1.3, ease: "power2.out" }, ${t});`);
});
// light sweep (one pooled element; x and opacity use separate, non-overlapping tweens)
sweepsKept.forEach((sw) => {
  const t = r3(sw.t), rev = sw.dir === -1;
  js.push(`tl.fromTo("#sw", { x: ${rev ? 2900 : -1000} }, { x: ${rev ? -1000 : 2900}, duration: 1.3, ease: "power2.inOut" }, ${t});`);
  js.push(`tl.fromTo("#sw", { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "sine.out" }, ${t});`);
  js.push(`tl.to("#sw", { opacity: 0, duration: 0.6, ease: "sine.in" }, ${r3(t + 0.7)});`);
});
// golden wash: a soft glow that blooms across every cut
WASHES.forEach((w) => {
  js.push(`tl.fromTo("#wash", { opacity: 0 }, { opacity: ${w.kind === "light" ? 0.55 : 0.34}, duration: ${r3(D * 0.5)}, ease: "sine.out" }, ${w.t});`);
  js.push(`tl.to("#wash", { opacity: 0, duration: ${r3(D * 0.7)}, ease: "sine.in" }, ${r3(w.t + D * 0.5)});`);
});
// glitter burst (pool of 14 little four-point stars, reused) – twinkles across the frame on every cut
GLITTER.forEach((g) => {
  const id = `#gl${g.slot}`;
  js.push(`tl.set("${id}", { x: ${g.x}, y: ${g.y}, rotation: ${g.rot} }, ${r3(g.t - 0.01)});`);
  js.push(`tl.fromTo("${id}", { scale: 0, opacity: 0 }, { scale: ${g.s}, opacity: 1, duration: 0.2, ease: "power2.out" }, ${g.t});`);
  js.push(`tl.to("${id}", { scale: 0, opacity: 0, rotation: ${g.rot + 50}, duration: 0.42, ease: "power2.in" }, ${r3(g.t + 0.2)});`);
});
// sparkles around the hero text (4-point stars)
SPARKS.forEach((p, i) => {
  const t = r3(p.t), id = `#sp${i % SPARK_POOL}`;
  js.push(`tl.set("${id}", { x: ${p.x}, y: ${p.y} }, ${r3(t - 0.01)});`);
  js.push(`tl.fromTo("${id}", { scale: 0, rotation: -30, opacity: 0 }, { scale: ${p.s}, rotation: 15, opacity: 1, duration: 0.45, ease: "power2.out" }, ${t});`);
  js.push(`tl.to("${id}", { scale: 0, rotation: 60, opacity: 0, duration: 0.6, ease: "power2.in" }, ${r3(t + 0.45)});`);
});
// soft golden light leak (one pooled element) on the "light" transitions
LEAKS.forEach((l) => {
  const t = r3(l.t), d = l.dur;
  js.push(`tl.fromTo("#lk", { opacity: 0 }, { opacity: 1, duration: ${r3(d * 0.4)}, ease: "sine.out" }, ${t});`);
  js.push(`tl.to("#lk", { opacity: 0, duration: ${r3(d * 0.6)}, ease: "sine.in" }, ${r3(t + d * 0.4)});`);
  js.push(`tl.fromTo("#lk .b1", { x: -900 }, { x: 1100, duration: ${r3(d + 0.3)}, ease: "sine.inOut" }, ${t});`);
  js.push(`tl.fromTo("#lk .b2", { x: -1300 }, { x: 700, duration: ${r3(d + 0.3)}, ease: "sine.inOut" }, ${t});`);
  js.push(`tl.fromTo("#lk .wash", { opacity: 0 }, { opacity: 0.55, duration: ${r3(d * 0.4)}, ease: "sine.out" }, ${t});`);
  js.push(`tl.to("#lk .wash", { opacity: 0, duration: ${r3(d * 0.6)}, ease: "sine.in" }, ${r3(t + d * 0.4)});`);
});
// bokeh drift
BOKEH.forEach((b, i) => {
  js.push(`tl.fromTo("#bk${i}", { opacity: 0, x: 0, y: 0 }, { x: ${b.dx}, y: ${b.dy}, duration: ${b.life}, ease: "none" }, ${b.t0});`);
  js.push(`tl.to("#bk${i}", { opacity: ${b.peak}, duration: ${r3(b.life * 0.3)}, ease: "sine.inOut" }, ${b.t0});`);
  js.push(`tl.to("#bk${i}", { opacity: 0, duration: ${r3(b.life * 0.45)}, ease: "sine.inOut" }, ${r3(b.t0 + b.life * 0.55)});`);
});
// golden-hour grade drifts very slowly across the whole film
js.push(`tl.fromTo("#grade", { x: -70, y: 10 }, { x: 70, y: -10, duration: ${TOTAL}, ease: "none" }, 0);`);
// end card dim + final fade
const endT = Bof("S31", 4.4);
js.push(`tl.fromTo("#endDim", { opacity: 0 }, { opacity: 1, duration: 1.1, ease: "power2.inOut" }, ${r3(endT - 0.2)});`);
js.push(`tl.fromTo("#fadeOut", { opacity: 0 }, { opacity: 1, duration: 1.8, ease: "power1.inOut" }, ${r3(TOTAL - 1.8)});`);
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
      :root { --gold: #f6dcaa; --gold2: #e9bf7a; --cream: #fff7e8; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1920px; height: 1080px; overflow: hidden; background: #0c0705; }
      #root { position: relative; width: 1920px; height: 1080px; overflow: hidden; background: #0c0705; font-family: "Dancing Script", cursive; }
      .sh { position: absolute; inset: 0; transform-origin: 50% 50%; will-change: transform, opacity, filter; }
      .kb { position: absolute; inset: 0; transform-origin: 50% 50%; }
      video { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; object-fit: cover; }

      /* ---- lighting ---- */
      #grade { position: absolute; left: -90px; top: -30px; width: 2100px; height: 1140px; z-index: 58; pointer-events: none; mix-blend-mode: soft-light; opacity: .85;
        background: radial-gradient(ellipse at 12% 8%, rgba(255,200,130,.62), rgba(255,200,130,0) 62%), radial-gradient(ellipse at 92% 96%, rgba(255,150,165,.38), rgba(255,150,165,0) 58%); }
      #vig { position: absolute; inset: 0; z-index: 60; pointer-events: none; background: radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 56%, rgba(24,9,2,.34) 100%); }
      #endDim { position: absolute; inset: 0; z-index: 61; opacity: 0; pointer-events: none; background: radial-gradient(ellipse at 50% 45%, rgba(14,7,3,.55), rgba(14,7,3,.82)); }
      .bk { position: absolute; z-index: 62; opacity: 0; border-radius: 50%; pointer-events: none; mix-blend-mode: screen; filter: blur(1.5px);
        background: radial-gradient(circle at 38% 34%, rgba(255,244,214,.95), rgba(255,216,152,.50) 42%, rgba(255,200,130,0) 70%); box-shadow: inset 0 0 0 2px rgba(255,236,200,.22); }
      #wash { position: absolute; inset: 0; z-index: 69; opacity: 0; pointer-events: none; mix-blend-mode: screen; background: linear-gradient(120deg, rgba(255,238,200,.85), rgba(255,214,160,.45) 55%, rgba(255,190,150,.2)); }
      .leak { position: absolute; inset: 0; z-index: 70; opacity: 0; pointer-events: none; mix-blend-mode: screen; overflow: hidden; }
      .leak i { position: absolute; display: block; }
      .leak .b1 { left: 0; top: -20%; width: 1200px; height: 1400px; background: radial-gradient(ellipse, rgba(255,176,96,.80), rgba(255,150,80,.30) 45%, rgba(255,150,80,0) 70%); filter: blur(30px); }
      .leak .b2 { left: 0; top: 10%; width: 900px; height: 1100px; background: radial-gradient(ellipse, rgba(255,138,150,.62), rgba(255,138,150,.22) 45%, rgba(255,138,150,0) 70%); filter: blur(40px); }
      .leak .wash { inset: 0; opacity: 0; background: linear-gradient(115deg, rgba(255,236,196,.55), rgba(255,214,160,.28) 55%, rgba(255,190,140,.12)); }
      .sweep { position: absolute; top: -10%; left: 0; width: 700px; height: 120%; z-index: 71; opacity: 0; pointer-events: none; mix-blend-mode: screen; filter: blur(10px); }
      .sweep i { display: block; width: 100%; height: 100%; transform: skewX(-20deg); background: linear-gradient(90deg, rgba(255,232,190,0), rgba(255,236,200,.50) 45%, rgba(255,250,236,.62) 50%, rgba(255,236,200,.50) 55%, rgba(255,232,190,0)); }
      .flare { position: absolute; left: 0; top: 0; width: 0; height: 0; z-index: 72; opacity: 0; pointer-events: none; mix-blend-mode: screen; }
      .flare i { position: absolute; display: block; }
      .flare .core { width: 620px; height: 620px; margin: -310px 0 0 -310px; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,.95) 0%, rgba(255,230,180,.64) 14%, rgba(255,192,112,.22) 40%, rgba(255,170,100,0) 70%); }
      .flare .wide { width: 1700px; height: 34px; margin: -17px 0 0 -850px; border-radius: 20px; filter: blur(14px); background: linear-gradient(90deg, rgba(255,160,90,0), rgba(255,176,104,.55) 30%, rgba(255,214,160,.8) 50%, rgba(150,200,255,.45) 72%, rgba(150,200,255,0)); }
      .flare .streak { width: 1500px; height: 5px; margin: -2px 0 0 -750px; border-radius: 4px; background: linear-gradient(90deg, rgba(255,200,140,0), rgba(255,226,176,.95) 40%, rgba(255,255,255,1) 50%, rgba(200,226,255,.9) 62%, rgba(200,226,255,0)); filter: blur(.8px); }
      .flare .ghost { border-radius: 50%; }
      .flare .g1 { width: 170px; height: 170px; margin: -85px 0 0 -85px; background: radial-gradient(circle, rgba(255,200,140,.22), rgba(255,200,140,.05) 62%, rgba(255,214,160,.55) 68%, rgba(255,200,140,0) 72%); }
      .flare .g2 { width: 100px; height: 100px; margin: -50px 0 0 -50px; background: radial-gradient(circle, rgba(255,240,210,.6), rgba(255,240,210,0) 70%); }
      .flare .g3 { width: 70px; height: 70px; margin: -35px 0 0 -35px; background: radial-gradient(circle, rgba(170,210,255,.5), rgba(170,210,255,0) 70%); }
      .spark { position: absolute; left: 0; top: 0; width: 0; height: 0; z-index: 73; opacity: 0; pointer-events: none; mix-blend-mode: screen; }
      .spark i { position: absolute; left: -62px; top: -1.5px; width: 124px; height: 3px; border-radius: 2px; background: linear-gradient(90deg, rgba(255,240,210,0), #fff 50%, rgba(255,240,210,0)); box-shadow: 0 0 12px rgba(255,226,170,.9); }
      .spark i + i { transform: rotate(90deg); }
      .spark b { position: absolute; left: -16px; top: -16px; width: 32px; height: 32px; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,.95), rgba(255,226,170,0) 70%); }
      /* glitter: little four-point stars (no radial gradients / blur, so 14 of them are cheap) */
      .gl { position: absolute; left: 0; top: 0; width: 0; height: 0; z-index: 74; opacity: 0; pointer-events: none; mix-blend-mode: screen; }
      .gl::before, .gl::after { content: ""; position: absolute; left: -26px; top: -1.5px; width: 52px; height: 3px; border-radius: 2px; background: linear-gradient(90deg, rgba(255,244,214,0), #fffaf0 50%, rgba(255,244,214,0)); box-shadow: 0 0 9px 1px rgba(255,222,160,.95); }
      .gl::after { transform: rotate(90deg); }
      #fadeOut { position: absolute; inset: 0; z-index: 90; opacity: 0; background: #0c0705; pointer-events: none; }

      /* ---- lettering: script, hand-written feel, kept inside the TikTok safe zone (top 150 / bottom 230 clear) ---- */
      .tx { position: absolute; left: 50%; z-index: 80; opacity: 0; transform: translateX(-50%); text-align: center; isolation: isolate; width: 1500px; color: var(--cream); }
      .tx::before { content: ""; position: absolute; inset: -90px -140px; z-index: -2; background: radial-gradient(closest-side ellipse at 50% 55%, rgba(18,9,4,.62), rgba(18,9,4,.36) 50%, rgba(18,9,4,0) 100%); }
      .tx .glow { position: absolute; left: 50%; top: 50%; width: 1100px; height: 360px; margin: -180px 0 0 -550px; z-index: -1; border-radius: 50%; opacity: 0; mix-blend-mode: screen; background: radial-gradient(ellipse, rgba(255,205,140,.50), rgba(255,205,140,0) 68%); }
      .tx .h { font-family: "Dancing Script", cursive; font-weight: 700; line-height: 1.12; font-size: 118px; letter-spacing: 0; text-shadow: 0 0 26px rgba(255,214,150,.55), 0 3px 5px rgba(0,0,0,.55), 0 6px 22px rgba(0,0,0,.6); }
      .tx .hl { display: block; white-space: nowrap; }
      .tx .c { display: inline; }
      .tx-low { bottom: 235px; }
      .tx-low2 { bottom: 120px; }
      /* title card + closing card: Parisienne names with a gold gradient and a travelling shine */
      #scrimB { position: absolute; left: 0; right: 0; bottom: 0; height: 560px; z-index: 66; opacity: 0; pointer-events: none; background: linear-gradient(to top, rgba(14,7,3,.78), rgba(14,7,3,.42) 55%, rgba(14,7,3,0)); }
      .tx-intro, .tx-end { top: 235px; width: 1800px; }
      .tx-intro { top: 610px; left: 90px; width: 1020px; transform: none; text-align: left; }
      .tx-intro .rule { justify-content: flex-start; margin-left: 20px; }
      .tx-intro .rule .ll { display: none; }
      .tx-intro .h, .tx-end .h { font-family: "Parisienne", cursive; font-weight: 400; font-size: 260px; line-height: 1.02; white-space: nowrap; text-shadow: none; filter: drop-shadow(0 0 26px rgba(255,214,150,.45)) drop-shadow(0 5px 14px rgba(0,0,0,.6)); }
      .tx-intro .h { font-size: 150px; }
      .tx-end .h { font-size: 220px; }
      .tx-intro .date { font-size: 52px; margin-left: 24px; }
      .nm { display: inline-block; padding: .02em .08em .16em .06em; color: transparent; -webkit-background-clip: text; background-clip: text;
        background-image: linear-gradient(100deg, #e9bf7a 0%, #fff0d2 28%, #ffffff 40%, #f6dcaa 52%, #e9bf7a 70%, #fff0d2 100%); background-size: 320% 100%; background-position: 100% 0%; }
      .rings { position: relative; width: 190px; height: 84px; margin: 0 auto 6px; }
      .ring { position: absolute; top: 4px; width: 76px; height: 76px; border-radius: 50%; border: 6px solid var(--gold); box-shadow: 0 0 22px rgba(255,214,150,.75), inset 0 0 12px rgba(255,214,150,.4); opacity: 0; }
      .ring.rl { left: 36px; }
      .ring.rr { left: 78px; border-color: #fff0d2; }
      .rule { display: flex; align-items: center; justify-content: center; gap: 22px; height: 30px; margin: 2px auto 16px; }
      .rule .line { display: block; width: 230px; height: 2px; background: linear-gradient(90deg, rgba(246,220,170,0), var(--gold)); }
      .rule .ll { transform-origin: 100% 50%; }
      .rule .lr { transform-origin: 0% 50%; background: linear-gradient(90deg, var(--gold), rgba(246,220,170,0)); }
      .rule .dia { display: block; width: 14px; height: 14px; background: var(--gold); box-shadow: 0 0 14px rgba(255,214,150,.9); }
      .tx .date { font-family: "Dancing Script", cursive; font-weight: 700; font-size: 64px; color: var(--gold); margin-top: 6px; text-shadow: 0 0 20px rgba(255,214,150,.45), 0 3px 12px rgba(0,0,0,.65); opacity: 0; }
      .tx .sub { font-family: "Dancing Script", cursive; font-weight: 700; font-size: 56px; color: var(--cream); margin-top: 26px; text-shadow: 0 0 20px rgba(255,214,150,.4), 0 3px 12px rgba(0,0,0,.65); opacity: 0; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="1920" data-height="1080" data-fps="${FPS}">
${vids}
      <div id="grade" class="clip" data-start="0" data-duration="${TOTAL}" data-track-index="3"></div>
      <div id="vig" class="clip" data-start="0" data-duration="${TOTAL}" data-track-index="3"></div>
      <div id="endDim" class="clip" data-start="0" data-duration="${TOTAL}" data-track-index="3"></div>
${bokehHtml}
${scrimHtml}
${washHtml}
${leakHtml}
${sweepHtml}
${flareHtml}
${sparkHtml}
${glitterHtml}
${textHtml}
      <div id="fadeOut" class="clip" data-start="0" data-duration="${TOTAL}" data-track-index="6"></div>
      <audio id="music" src="assets/music.m4a" data-start="0" data-duration="${TOTAL}" data-volume="${MUSIC_VOL}" data-fade-in="0.6" data-fade-out="3.6" data-track-index="7"></audio>
    </div>
    <script>
${js.join("\n")}
    </script>
  </body>
</html>
`;
fs.writeFileSync(path.join(ROOT, "index.html"), page);
console.log(`index.html written · ${shots.length} shots · ${TOTAL}s (${beat} beats) · ${FPS}fps · transitions ${shots.length - 1} (glitter ${GLITTER.length}) · flares ${FLARES.length} · sweeps ${sweepsKept.length} · sparks ${SPARKS.length} · leaks ${LEAKS.length} · bokeh ${BOKEH.length}`);
