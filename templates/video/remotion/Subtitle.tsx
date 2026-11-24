import React, {useLayoutEffect, useRef, useState} from "react";
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {loadFont as loadNormal} from "@remotion/google-fonts/Poppins";
import {loadFont as loadArabic} from "@remotion/google-fonts/Amiri";
import {subtitle} from "./theme";

// Poppins SemiBold (600), tegak untuk BM, italic untuk perkataan Inggeris.
const normal = loadNormal("normal", {weights: ["600"]});
const italic = loadNormal("italic", {weights: ["600"]});
// Traditional Arabic (font Microsoft) dahulu; Amiri hanya fallback jika fail tiada.
const amiri = loadArabic("normal", {weights: ["400"], subsets: ["arabic"]});
const isArabic = (t: string) => /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/.test(t);

export type Word = {text: string; start: number; end: number; en?: boolean; ar?: boolean};

// Sokong juga penanda *word* dalam teks untuk italic.
const clean = (w: Word): Word =>
  /^\*.+\*$/.test(w.text) ? {...w, text: w.text.slice(1, -1), en: true} : w;

// Bingkai kaca perak (iOS glass): satu perkataan, satu bingkai, meluncur ke tepi. Lihat skill video-subtitle-style.
const glassStyle: React.CSSProperties = {
  position: "absolute",
  zIndex: 0,
  borderRadius: 20,
  background: "linear-gradient(135deg, rgba(255,255,255,.30) 0%, rgba(220,228,240,.12) 45%, rgba(255,255,255,.06) 100%)",
  border: "1.5px solid rgba(226,232,240,.90)",
  backdropFilter: "blur(12px) saturate(170%)",
  WebkitBackdropFilter: "blur(12px) saturate(170%)",
  boxShadow:
    "inset 0 1.5px 0 rgba(255,255,255,.70), inset 0 -1px 0 rgba(255,255,255,.18), inset 0 0 14px rgba(255,255,255,.10), 0 8px 22px rgba(0,0,0,.32)",
};
const PAD_X = 16;
const PAD_Y = 8;

type Box = {x: number; y: number; w: number; h: number};

export const Subtitle: React.FC<{words: Word[]; perLine?: number; glass?: boolean}> = ({words, perLine = 3, glass = true}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const ws = words.map(clean);
  let idx = ws.findIndex((w) => t >= w.start && t < w.end);
  if (idx < 0) idx = Math.max(0, ws.filter((w) => w.start <= t).length - 1);
  const lineStart = Math.floor(idx / perLine) * perLine;
  const line = ws.slice(lineStart, lineStart + perLine);
  const active = idx - lineStart;

  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const key = line.map((w) => w.text).join("|");
  useLayoutEffect(() => {
    setBoxes(refs.current.slice(0, line.length).map((e) => (e ? {x: e.offsetLeft, y: e.offsetTop, w: e.offsetWidth, h: e.offsetHeight} : {x: 0, y: 0, w: 0, h: 0})));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!ws.length || t > ws[ws.length - 1].end) return null;

  // pergerakan licin (spring gaya iOS) dari perkataan sebelum ke perkataan semasa
  let pill: React.ReactNode = null;
  if (glass && boxes[active]) {
    const cur = boxes[active];
    const prev = boxes[Math.max(0, active - 1)] ?? cur;
    const startF = Math.round(line[active].start * fps);
    const p = active === 0 ? 1 : spring({frame: frame - startF, fps, config: {damping: 20, stiffness: 220, mass: 0.6}});
    const lineIn = spring({frame: frame - Math.round(line[0].start * fps), fps, config: {damping: 14, stiffness: 180}});
    const x = prev.x + (cur.x - prev.x) * p;
    const w = prev.w + (cur.w - prev.w) * p;
    pill = (
      <span
        style={{
          ...glassStyle,
          left: x - PAD_X,
          top: cur.y - PAD_Y,
          width: w + PAD_X * 2,
          height: cur.h + PAD_Y * 2,
          opacity: Math.min(1, lineIn),
          transform: `scale(${0.82 + 0.18 * Math.min(1, lineIn)})`,
        }}
      />
    );
  }

  return (
    <AbsoluteFill style={{justifyContent: "flex-end", alignItems: "center", paddingBottom: subtitle.bottom}}>
      <div style={{position: "relative", textAlign: "center", padding: "0 60px", lineHeight: 1.25}}>
        {pill}
        {line.map((w, i) => {
          const ar = w.ar || isArabic(w.text);
          return (
            <span
              key={lineStart + i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              style={{
                position: "relative",
                zIndex: 1,
                fontFamily: ar ? `${subtitle.arabic.family}, ${amiri.fontFamily}, serif` : w.en ? italic.fontFamily : normal.fontFamily,
                fontWeight: ar ? subtitle.arabic.weight : subtitle.weight,
                fontStyle: ar ? "normal" : w.en ? "italic" : "normal",
                direction: ar ? "rtl" : "ltr",
                fontSize: ar ? subtitle.arabic.size : subtitle.size,
                color: subtitle.color,
                WebkitTextStroke: `${subtitle.stroke}px ${subtitle.strokeColor}`,
                paintOrder: "stroke fill",
                marginRight: 16,
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
