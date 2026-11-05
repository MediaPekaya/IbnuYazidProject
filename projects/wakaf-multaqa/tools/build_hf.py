import json, math, sys, re
S, P = sys.argv[1], sys.argv[2]
shots = json.load(open(f"{S}/shots.json"))
W, H, TOTAL, FADE = 1080, 1920, 73.0, 0.8

# ---------------- ROOT index.html ----------------
vids, tl = [], []
for i, (sid, src, off, st, d) in enumerate(shots):
    n = i + 1
    vids.append(f'''    <div class="shot" id="w{n:02d}" style="z-index:{n}">
      <video id="v{n:02d}" class="clip" src="assets/clips/{sid}.mp4" data-start="{st}" data-duration="{d}" data-track-index="{n}" muted playsinline></video>
    </div>''')
    if i == 0:
        tl.append(f'tl.fromTo("#w01", {{ opacity: 0 }}, {{ opacity: 1, duration: 1.4, ease: "sine.inOut" }}, 0);')
    else:
        tl.append(f'tl.fromTo("#w{n:02d}", {{ opacity: 0 }}, {{ opacity: 1, duration: {FADE}, ease: "sine.inOut" }}, {st});')
    if i + 1 < len(shots):
        nxt = shots[i + 1][3]
        tl.append(f'tl.set("#w{n:02d}", {{ opacity: 0 }}, {round(nxt + FADE + 0.02, 2)});')

# VO windows (absolute seconds) and ducking
vo = []
wins = [(1.5, 7.4), (16.8, 35.1), (42.8, 56.7), (59.8, 69.3)]
BASE, DUCK = 0.8, 0.3
pts = [(0, BASE)]
for a, b in wins:
    pts += [(round(a - 0.7, 2), BASE), (a, DUCK), (b, DUCK), (round(b + 1.0, 2), BASE)]
pts.append((TOTAL, BASE))
lane = json.dumps({"version": 1, "lanes": [{"target": "volume", "points": [{"t": t, "v": v} for t, v in pts]}]}).replace('"', '&quot;')

audio = [f'    <audio id="music" class="clip" src="assets/audio/music.mp3" data-start="0" data-duration="{TOTAL}" data-track-index="30" data-volume="1" data-fade-in="2" data-fade-out="4"></audio>']
for aid, f, st, d in vo:
    audio.append(f'    <audio id="{aid}" class="clip" src="assets/audio/{f}.mp3" data-start="{st}" data-duration="{d}" data-track-index="31" data-volume="1"></audio>')

index = f'''<!doctype html>
<html lang="ms">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={W}, height={H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: {W}px; height: {H}px; overflow: hidden; background: #1a1108; }}
      #root {{ position: relative; width: {W}px; height: {H}px; overflow: hidden; background: #1a1108; }}
      .shot {{ position: absolute; left: 0; top: 0; width: {W}px; height: {H}px; opacity: 0; }}
      .shot video {{ position: absolute; left: 0; top: 0; width: {W}px; height: {H}px; object-fit: cover; }}
      #flash {{ position: absolute; inset: 0; background: #fff6e2; opacity: 0; z-index: 50; }}
      #endfade {{ position: absolute; inset: 0; background: #120a02; opacity: 0; z-index: 60; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="{W}" data-height="{H}" data-fps="30">
{chr(10).join(vids)}
      <div id="leak-a" data-composition-id="leak-a" data-composition-src="compositions/leak-a.html" data-start="7.2" data-duration="3" data-width="{W}" data-height="{H}" data-track-index="40" data-track-kind="graphics" style="z-index:20"></div>
      <div id="leak-b" data-composition-id="leak-b" data-composition-src="compositions/leak-b.html" data-start="41.2" data-duration="3" data-width="{W}" data-height="{H}" data-track-index="41" data-track-kind="graphics" style="z-index:20"></div>
      <div id="ornaments" data-composition-id="ornaments" data-composition-src="compositions/ornaments.html" data-start="0" data-duration="{TOTAL}" data-width="{W}" data-height="{H}" data-track-index="42" data-track-kind="graphics" style="z-index:30"></div>
      <div id="verses" data-composition-id="verses" data-composition-src="compositions/verses.html" data-start="0" data-duration="{TOTAL}" data-width="{W}" data-height="{H}" data-track-index="43" data-track-kind="graphics" style="z-index:40"></div>
      <div id="flash"></div>
      <div id="endfade"></div>
{chr(10).join(audio)}
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      const tl = gsap.timeline({{ paused: true }});
      {chr(10).join("      "+l for l in tl).strip()}
      // fade to white at the seams into the venue (16.0) and into the end card (59.0)
      tl.set("#flash", {{ opacity: 0 }}, 0);
      tl.to("#flash", {{ opacity: 0.5, duration: 0.8, ease: "sine.in" }}, 15.3);
      tl.to("#flash", {{ opacity: 0, duration: 1.0, ease: "sine.out" }}, 16.1);
      tl.to("#flash", {{ opacity: 0.5, duration: 0.8, ease: "sine.in" }}, 58.3);
      tl.to("#flash", {{ opacity: 0, duration: 1.0, ease: "sine.out" }}, 59.1);
      tl.fromTo("#endfade", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.9, ease: "sine.inOut" }}, 72.1);
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
'''
open(f"{P}/index.html", "w").write(index)

# ---------------- ORNAMENTS ----------------
def star(cx, cy, R, rot=0):
    r = R * 0.7654
    pts = []
    for k in range(16):
        ang = math.radians(rot + k * 22.5 - 90)
        rad = R if k % 2 == 0 else r
        pts.append(f"{cx + rad*math.cos(ang):.1f},{cy + rad*math.sin(ang):.1f}")
    return f'<polygon points="{" ".join(pts)}" />'

def arch(cx, cy, w, h, flip=False):
    # pointed (ogee-style) arch outline; cy is the baseline, apex rises by h (flip: apex goes down)
    s = 1 if flip else -1
    x0, x1 = cx - w / 2, cx + w / 2
    return (f'<path d="M {x0:.1f} {cy:.1f} C {x0:.1f} {cy + s*h*0.45:.1f}, {cx - w*0.18:.1f} {cy + s*h*0.62:.1f}, {cx:.1f} {cy + s*h:.1f} '
            f'C {cx + w*0.18:.1f} {cy + s*h*0.62:.1f}, {x1:.1f} {cy + s*h*0.45:.1f}, {x1:.1f} {cy:.1f}" />')

o_frame, o_corner, o_detail = [], [], []
m1, m2 = 34, 52
o_frame.append(f'<rect x="{m1}" y="{m1}" width="{W-2*m1}" height="{H-2*m1}" rx="6" />')
o_frame.append(f'<rect x="{m2}" y="{m2}" width="{W-2*m2}" height="{H-2*m2}" rx="4" opacity="0.55" />')
# corners: khatam star + quarter arcs + dots
for (cx, cy, sx, sy) in [(m1, m1, 1, 1), (W-m1, m1, -1, 1), (m1, H-m1, 1, -1), (W-m1, H-m1, -1, -1)]:
    o_corner.append(star(cx, cy, 30, 0))
    o_corner.append(f'<circle cx="{cx}" cy="{cy}" r="9" />')
    for r in (62, 84):
        o_corner.append(f'<path d="M {cx + sx*r} {cy} A {r} {r} 0 0 {1 if sx*sy>0 else 0} {cx} {cy + sy*r}" opacity="0.6" />')
    o_corner.append(f'<circle cx="{cx + sx*100}" cy="{cy + sy*14}" r="3" class="dot" />')
    o_corner.append(f'<circle cx="{cx + sx*14}" cy="{cy + sy*100}" r="3" class="dot" />')
# edge star rows (small khatam) along all four sides, skipping corners and centres
for x in range(150, W - 140, 74):
    if abs(x - W/2) > 120:
        o_detail.append(star(x, m1, 8, 0)); o_detail.append(star(x, H - m1, 8, 0))
for y in range(170, H - 160, 74):
    if abs(y - H/2) > 90:
        o_detail.append(star(m1, y, 8, 0)); o_detail.append(star(W - m1, y, 8, 0))
# centre arches top & bottom, stars on side mid-points
o_detail.append(arch(W/2, m1 + 2, 220, 78, flip=True)); o_detail.append(arch(W/2, m1 + 2, 140, 50, flip=True))
o_detail.append(arch(W/2, H - m1 - 2, 220, 78)); o_detail.append(arch(W/2, H - m1 - 2, 140, 50))
o_detail.append(star(W/2, m1 + 22, 11, 0)); o_detail.append(star(W/2, H - m1 - 22, 11, 0))
o_detail.append(star(m1, H/2, 22, 0)); o_detail.append(star(W - m1, H/2, 22, 0))
o_detail.append(f'<circle cx="{m1}" cy="{H/2}" r="6" class="dot"/>'); o_detail.append(f'<circle cx="{W-m1}" cy="{H/2}" r="6" class="dot"/>')

ornaments = f'''<template>
  <style>
    #root {{ position: absolute; inset: 0; pointer-events: none; }}
    #root svg {{ position: absolute; inset: 0; width: 100%; height: 100%; }}
    .g {{ opacity: 0; }}
    .ln {{ fill: none; stroke: #e3c07a; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }}
    .ln polygon, .ln path, .ln circle, .ln rect {{ fill: none; stroke: #e3c07a; stroke-width: 2; }}
    .ln .dot {{ fill: #e3c07a; stroke: none; }}
    #orn-frame, #orn-corner, #orn-detail {{ filter: drop-shadow(0 0 6px rgba(20,10,0,0.55)); }}
  </style>
  <div id="root" data-composition-id="ornaments" data-width="{W}" data-height="{H}">
    <svg viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g id="orn-frame" class="g ln" data-layout-ignore>{"".join(o_frame)}</g>
      <g id="orn-corner" class="g ln" data-layout-ignore>{"".join(o_corner)}</g>
      <g id="orn-detail" class="g ln" data-layout-ignore>{"".join(o_detail)}</g>
    </svg>
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
    tl.fromTo("#orn-frame", {{ opacity: 0 }}, {{ opacity: 0.8, duration: 3.2, ease: "sine.inOut" }}, 0.8);
    tl.fromTo("#orn-corner", {{ opacity: 0 }}, {{ opacity: 0.9, duration: 3.2, ease: "sine.inOut" }}, 1.8);
    tl.fromTo("#orn-detail", {{ opacity: 0 }}, {{ opacity: 0.85, duration: 3.4, ease: "sine.inOut" }}, 2.8);
    window.__timelines["ornaments"] = tl;
  </script>
</template>
'''
open(f"{P}/compositions/ornaments.html", "w").write(ornaments)

# ---------------- VERSES / TEXT CARDS ----------------
divider = f'<svg class="div" viewBox="0 0 220 28" width="220" height="28" aria-hidden="true"><g fill="none" stroke="#e3c07a" stroke-width="1.6">{star(110,14,11,0)}<path d="M 6 14 H 84" /><path d="M 136 14 H 214" /></g></svg>'

cards = [
 # id, start, dur, kind, arabic_font, arabic, lines(translation), cite
 ("c1", 7.9, 4.6, "ayat", "q", "لَن تَنَالُوا الْبِرَّ حَتَّىٰ تُنفِقُوا مِمَّا تُحِبُّونَ", "Kamu tidak akan mencapai kebajikan yang sempurna, sehingga kamu menginfakkan sebahagian harta yang kamu cintai.", "ALI IMRAN 3:92"),
 ("c3", 34.8, 4.5, "ayat", "q", "إِنَّ ٱللَّهَ یَأۡمُرُكُمۡ أَن تُؤَدُّوا۟ ٱلۡأَمَـٰنَـٰتِ إِلَىٰۤ أَهۡلِهَا", "Sesungguhnya Allah menyuruh kamu menyampaikan amanah kepada yang berhak.", "AN-NISA’ 4:58"),
 ("h1", 46.4, 4.4, "hadith", "a", "إِذَا مَاتَ الإِنْسَانُ انْقَطَعَ عَنْهُ عَمَلُهُ إِلاَّ مِنْ ثَلاَثَةٍ", "Apabila manusia meninggal dunia, terputuslah amalnya kecuali tiga perkara:", "HADIS RIWAYAT MUSLIM"),
 ("h2", 51.2, 4.8, "hadith", "a", "إِلَّا مِنْ صَدَقَةٍ جَارِيَةٍ، أَوْ عِلْمٍ يُنْتَفَعُ بِهِ، أَوْ وَلَدٍ صَالِحٍ يَدْعُو لَهُ", "sedekah jariah, ilmu yang bermanfaat, dan anak soleh yang mendoakannya.", "HADIS RIWAYAT MUSLIM"),
]
card_html, card_js = [], []
for cid, st, d, kind, fnt, ar, tr, cite in cards:
    cls = "ar-q" if fnt == "q" else "ar-a"
    card_html.append(f'''    <div id="{cid}" class="card clip" data-start="{st}" data-duration="{d}" data-track-index="1">
      <div class="scrim"></div>
      <div class="inner">
        <p class="ar {cls}" lang="ar" dir="rtl">{ar}</p>
        {divider}
        <p class="tr">{tr}</p>
        <p class="cite">{cite}</p>
      </div>
    </div>''')
    card_js.append(f'''    tl.fromTo("#{cid} .scrim", {{ opacity: 0 }}, {{ opacity: 1, duration: 1.0, ease: "sine.out" }}, {st});
    tl.fromTo("#{cid} .inner", {{ opacity: 0, filter: "blur(10px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 1.1, ease: "power2.out" }}, {st + 0.1});
    tl.to("#{cid} .inner", {{ opacity: 0, filter: "blur(6px)", duration: 0.7, ease: "power2.in" }}, {round(st + d - 0.75, 2)});
    tl.to("#{cid} .scrim", {{ opacity: 0, duration: 0.7, ease: "sine.in" }}, {round(st + d - 0.75, 2)});''')

# title card
tst, tdur = 16.6, 5.5
card_html.append(f'''    <div id="title" class="card clip" data-start="{tst}" data-duration="{tdur}" data-track-index="2">
      <div class="scrim"></div>
      <div class="inner">
        <p class="kicker">MAJLIS MULTAQA</p>
        <p class="ttl">YB Menteri di Jabatan Perdana Menteri (Hal Ehwal Agama) bersama Mutawalli dan Nazir Khas Wakaf</p>
        {divider}
        <p class="venue">Pusat Konvensyen Antarabangsa Putrajaya (PICC)</p>
      </div>
    </div>''')
card_js.append(f'''    tl.fromTo("#title .scrim", {{ opacity: 0 }}, {{ opacity: 1, duration: 1.0, ease: "sine.out" }}, {tst});
    tl.fromTo("#title .inner", {{ opacity: 0, filter: "blur(10px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 1.2, ease: "power2.out" }}, {tst + 0.1});
    tl.to("#title .inner", {{ opacity: 0, filter: "blur(6px)", duration: 0.8, ease: "power2.in" }}, {round(tst + tdur - 0.85, 2)});
    tl.to("#title .scrim", {{ opacity: 0, duration: 0.8, ease: "sine.in" }}, {round(tst + tdur - 0.85, 2)});''')


# narrative caption cards (replace the former voice-over lines; text only)
caps = [("k1", 2.0, 4.6, "Ada kebaikan… yang tidak pernah berhenti, walau jasad telah pergi."),
        ("k3", 23.0, 5.0, "Para mutawalli dan nazir khas wakaf berhimpun… untuk menyusun langkah, menjaga harta Allah."),
        ("k4", 29.6, 4.6, "Kerana wakaf bukan sekadar tanah dan bangunan… ia adalah amanah.")]
for cid, cst, cd, ctext in caps:
    card_html.append(f'''    <div id="{cid}" class="card clip" data-start="{cst}" data-duration="{cd}" data-track-index="4">
      <div class="scrim"></div>
      <div class="inner">
        <p class="cap">{ctext}</p>
        {divider}
      </div>
    </div>''')
    card_js.append(f'''    tl.fromTo("#{cid} .scrim", {{ opacity: 0 }}, {{ opacity: 1, duration: 1.0, ease: "sine.out" }}, {cst});
    tl.fromTo("#{cid} .inner", {{ opacity: 0, filter: "blur(10px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 1.2, ease: "power2.out" }}, {cst + 0.1});
    tl.to("#{cid} .inner", {{ opacity: 0, filter: "blur(6px)", duration: 0.8, ease: "power2.in" }}, {round(cst + cd - 0.85, 2)});
    tl.to("#{cid} .scrim", {{ opacity: 0, duration: 0.8, ease: "sine.in" }}, {round(cst + cd - 0.85, 2)});''')

# end card (doa), line by line
est, edur = 59.7, 13.3
lines = [(59.9, "Ya Allah, terimalah wakaf mereka yang telah pergi,"),
         (63.6, "kuatkan amanah mereka yang menjaganya,"),
         (66.5, "dan jadikan ia pahala yang terus mengalir.")]
l_html = "\n".join(f'        <p class="doa" id="doa{k+1}">{t}</p>' for k, (s, t) in enumerate(lines))
card_html.append(f'''    <div id="endcard" class="card clip" data-start="{est}" data-duration="{edur}" data-track-index="3">
      <div class="scrim big"></div>
      <div class="inner">
{l_html}
        {divider}
        <p class="amin ar-a" lang="ar" dir="rtl" id="amin">آمِين</p>
        <p class="cite" id="aminl">AAMIIN</p>
      </div>
    </div>''')
card_js.append(f'''    tl.fromTo("#endcard .scrim", {{ opacity: 0 }}, {{ opacity: 1, duration: 1.4, ease: "sine.out" }}, {est});
    tl.set("#endcard .inner", {{ opacity: 1 }}, {est});
    tl.fromTo("#doa1", {{ opacity: 0, filter: "blur(8px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 1.4, ease: "power2.out" }}, {lines[0][0]});
    tl.fromTo("#doa2", {{ opacity: 0, filter: "blur(8px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 1.4, ease: "power2.out" }}, {lines[1][0]});
    tl.fromTo("#doa3", {{ opacity: 0, filter: "blur(8px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 1.4, ease: "power2.out" }}, {lines[2][0]});
    tl.fromTo("#endcard .div", {{ opacity: 0 }}, {{ opacity: 1, duration: 1.2, ease: "sine.out" }}, 68.4);
    tl.fromTo("#amin", {{ opacity: 0, filter: "blur(8px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 1.4, ease: "power2.out" }}, 68.8);
    tl.fromTo("#aminl", {{ opacity: 0 }}, {{ opacity: 1, duration: 1.2, ease: "sine.out" }}, 69.6);''')

verses = f'''<template>
  <style>
    @font-face {{ font-family: "Amiri Quran"; src: url("assets/fonts/AmiriQuran.woff2") format("woff2"); font-weight: 400; }}
    @font-face {{ font-family: "Amiri"; src: url("assets/fonts/Amiri.woff2") format("woff2"); font-weight: 400; }}
    @font-face {{ font-family: "Cormorant Garamond"; src: url("assets/fonts/Cormorant500.woff2") format("woff2"); font-weight: 500; font-style: normal; }}
    @font-face {{ font-family: "Cormorant Garamond"; src: url("assets/fonts/Cormorant600.woff2") format("woff2"); font-weight: 600; font-style: normal; }}
    @font-face {{ font-family: "Cormorant Garamond"; src: url("assets/fonts/Cormorant500i.woff2") format("woff2"); font-weight: 500; font-style: italic; }}
    #root {{ position: absolute; inset: 0; pointer-events: none; }}
    .card {{ position: absolute; left: 110px; right: 110px; bottom: 600px; text-align: center; color: #fff4dc; }}
    .scrim {{ position: absolute; left: -110px; right: -110px; top: -190px; bottom: -150px; opacity: 0;
      background: radial-gradient(ellipse 62% 56% at 50% 52%, rgba(18,10,2,0.62) 0%, rgba(18,10,2,0.42) 48%, rgba(18,10,2,0) 100%); }}
    .scrim.big {{ top: -260px; bottom: -200px; }}
    .inner {{ position: relative; opacity: 0; }}
    .ar {{ text-wrap: balance; color: #f7e7bf; line-height: 1.85; text-shadow: 0 2px 18px rgba(0,0,0,0.6); font-size: 66px; }}
    .ar-q {{ font-family: "Amiri Quran", "Amiri", serif; }}
    .ar-a {{ font-family: "Amiri", serif; }}
    .div {{ display: block; margin: 14px auto 18px; filter: drop-shadow(0 1px 6px rgba(0,0,0,0.6)); }}
    .tr {{ text-wrap: balance; font-family: "Cormorant Garamond", serif; font-style: italic; font-weight: 500; font-size: 44px; line-height: 1.32; color: #fff6e0; text-shadow: 0 2px 14px rgba(0,0,0,0.7); }}
    .cite {{ font-family: "Cormorant Garamond", serif; font-weight: 600; font-size: 30px; letter-spacing: 0.26em; color: #f4dca0; margin-top: 22px; text-shadow: 0 1px 10px rgba(0,0,0,0.7); }}
    .kicker {{ font-family: "Cormorant Garamond", serif; font-weight: 600; font-size: 38px; letter-spacing: 0.42em; color: #e3c07a; text-shadow: 0 1px 10px rgba(0,0,0,0.7); margin-bottom: 18px; }}
    .ttl {{ text-wrap: balance; font-family: "Cormorant Garamond", serif; font-weight: 600; font-size: 58px; line-height: 1.16; color: #fff6e0; text-shadow: 0 2px 16px rgba(0,0,0,0.75); }}
    .venue {{ font-family: "Cormorant Garamond", serif; font-style: italic; font-weight: 500; font-size: 38px; line-height: 1.3; color: #f3dca8; text-shadow: 0 2px 12px rgba(0,0,0,0.7); }}
    .cap {{ text-wrap: balance; font-family: "Cormorant Garamond", serif; font-style: italic; font-weight: 500; font-size: 52px; line-height: 1.3; color: #fff6e0; text-shadow: 0 2px 16px rgba(0,0,0,0.75); }}
    .doa {{ text-wrap: balance; font-family: "Cormorant Garamond", serif; font-style: italic; font-weight: 500; font-size: 48px; line-height: 1.28; color: #fff6e0; text-shadow: 0 2px 16px rgba(0,0,0,0.75); margin-bottom: 14px; opacity: 0; }}
    .amin {{ font-size: 84px; line-height: 1.5; color: #f7e7bf; text-shadow: 0 2px 18px rgba(0,0,0,0.6); opacity: 0; }}
    #endcard .div, #endcard .cite {{ opacity: 0; }}
  </style>
  <div id="root" data-composition-id="verses" data-width="{W}" data-height="{H}">
{chr(10).join(card_html)}
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
{chr(10).join(card_js)}
    window.__timelines["verses"] = tl;
  </script>
</template>
'''
open(f"{P}/compositions/verses.html", "w").write(verses)

# ---------------- LEAKS (golden only; derived from the registry block) ----------------
src = open(f"{P}/compositions/organic-light-leak-overlay.html").read()
for name in ("leak-a", "leak-b"):
    t = src.replace("organic-light-leak-overlay", name)
    t = t.replace("width: 1920px;", f"width: {W}px;").replace("height: 1080px;", f"height: {H}px;")
    t = t.replace('data-width="1920"', f'data-width="{W}"').replace('data-height="1080"', f'data-height="{H}"')
    t = t.replace("opacity: 0.9, duration: duration * 0.24", "opacity: 0.55, duration: duration * 0.24").replace("opacity: 0.46,", "opacity: 0.3,")
    # drop the red layer: calm golden light only
    t = re.sub(r'\s*<div class="hf-leak-layer hf-leak-red"></div>', '', t)
    open(f"{P}/compositions/{name}.html", "w").write(t)
print("built")
