"""Satukan video_only + suara + overlay (hook, langkah, subtitle, popup) menjadi satu mp4 PREVIEW 720x1280.
Guna: python3 make_mp4.py <out_dir_dari_build_full> <fail_output.mp4> [saat_ujian]
(Preview 720p untuk semak, BUKAN render akhir 1080x1920.)"""
import json, os, subprocess, sys, textwrap
import numpy as np
from PIL import Image, ImageDraw

OUT, DEST = sys.argv[1], sys.argv[2]
TEST = float(sys.argv[3]) if len(sys.argv) > 3 else None
D = json.load(open(OUT + "/edit_timed.json"))
TOTAL = D["total"]; W, H = 720, 1280
VW, VH = 360, 760                       # saiz video telefon (selepas crop)
BORD = 8; PX, PY = (W - VW - 2 * BORD) // 2, 240   # kedudukan frame telefon

# ---- aset gambar ----
yy, xx = np.mgrid[0:H, 0:W]
r = np.sqrt(((xx - W / 2) / 600) ** 2 + ((yy - 110) / 470) ** 2).clip(0, 1)
c1, c2 = np.array([0x1B, 0x1E, 0x27]), np.array([0x0B, 0x0C, 0x10])
Image.fromarray((c1 * (1 - r[..., None]) + c2 * r[..., None]).astype("uint8")).save(OUT + "/bg.png")
S = 4
def rrect(w, h, rad, fill, size=None):
    im = Image.new("L", (w * S, h * S), 0); ImageDraw.Draw(im).rounded_rectangle([0, 0, w * S - 1, h * S - 1], rad * S, fill=255)
    return im.resize((w, h), Image.LANCZOS)
rrect(VW, VH, 30, 255).save(OUT + "/mask.png")
ow, oh = VW + 2 * BORD, VH + 2 * BORD
outer, inner = rrect(ow, oh, 38, 255), Image.new("L", (ow, oh), 0)
inner.paste(rrect(VW, VH, 30, 255), (BORD, BORD))
alpha = np.clip(np.array(outer, dtype=int) - np.array(inner, dtype=int), 0, 255).astype("uint8")
ring = np.zeros((oh, ow, 4), "uint8"); ring[..., 0], ring[..., 1], ring[..., 2], ring[..., 3] = 0x2B, 0x2E, 0x38, alpha
Image.fromarray(ring, "RGBA").save(OUT + "/ring.png")

# ---- ASS ----
HOOK, CYAN, WHITE = "&H3FD2FF&", "&HFFDC3D&", "&HFFFFFF&"
def ts(t):
    t = max(0, t); h, m, s = int(t // 3600), int(t % 3600 // 60), t % 60
    return f"{h}:{m:02d}:{s:05.2f}"
def kwmark(text, hook):
    out, i = "", 0
    parts = text.split("*")
    for k, p in enumerate(parts):
        if k % 2 == 1:
            out += ("{\\c" + WHITE + "\\u1}" + p + "{\\u0\\c" + HOOK + "}") if hook else ("{\\c" + CYAN + "}" + p + "{\\c" + WHITE + "}")
        else: out += p
    return out
def wrap(text, n): return "\\N".join(textwrap.wrap(text, n))
head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Sub,Carlito,47,&H00FFFFFF,&H00FFFFFF,&H00000000,&H90000000,-1,0,0,0,100,100,0,0,1,3.5,1.5,5,40,40,0,1
Style: HookTitle,Carlito,56,&H003FD2FF,&H003FD2FF,&H00000000,&H90000000,-1,0,0,0,100,100,0,0,1,3.5,1.5,8,40,40,0,1
Style: Chip,Carlito,26,&H00100C0B,&H00100C0B,&H00FFDC3D,&H00000000,-1,0,0,0,100,100,2,0,3,7,0,8,40,40,0,1
Style: Label,Carlito,40,&H00FFFFFF,&H00FFFFFF,&H00000000,&H90000000,-1,0,0,0,100,100,0,0,1,3,1.5,8,40,40,0,1
Style: Pop,Carlito,31,&H00181412,&H00181412,&H003FD2FF,&H80000000,-1,0,0,0,100,100,0,0,3,14,5,5,90,90,0,1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
"""
ev = []
def add(layer, s, e, style, text, pos=None, extra=""):
    if TEST and s >= TEST: return
    p = f"\\pos({pos[0]},{pos[1]})" if pos else ""
    ev.append(f"Dialogue: {layer},{ts(s)},{ts(e)},{style},,0,0,0,,{{{p}{extra}}}{text}")
HE = D["hook_end"] + 0.4
add(1, 0, HE, "HookTitle", kwmark(D["hook_title"].replace("! ", "!\\N").replace(", ", ",\\N", 1), True), (W // 2, 70), "\\fad(0,200)")
for sc in D["scenes"]:
    s, e = max(sc["s"], HE), min(sc["e"], TOTAL - 5)
    if e - s > 0.05:
        add(1, s, e, "Chip", sc["step"].upper(), (W // 2, 78), "\\fad(150,0)")
        add(1, s, e, "Label", wrap(sc["label"], 26), (W // 2, 128), "\\fad(150,0)")
add(1, TOTAL - 5, TOTAL, "HookTitle", kwmark(D["outro_title"].replace("? ", "?\\N"), True), (W // 2, 70), "\\fad(250,0)")
for p in D["pops"] + [{"s": TOTAL - 4.5, "e": TOTAL, "t": "Simpan video ni, kongsi pada kawan"}]:
    add(2, p["s"], p["e"], "Pop", wrap(p["t"], 24), (W // 2, 905), "\\fad(180,180)")
for c in D["cues"]:
    add(3, c["s"], c["e"], "Sub", kwmark(c["t"], c["hook"]), (W // 2, 1088), "\\c" + (HOOK if c["hook"] else WHITE))
open(OUT + "/sub.ass", "w", encoding="utf-8").write(head + "\n".join(ev) + "\n")

# ---- gabung ----
dur = TEST or TOTAL
fc = (f"[1:v]format=yuva420p[v];[2:v]format=gray[m];[v][m]alphamerge[vr];"
      f"[0:v][vr]overlay={PX + BORD}:{PY + BORD}[a];[a][3:v]overlay={PX}:{PY}[b];[b]ass=sub.ass[out]")
cmd = ["ffmpeg", "-v", "error", "-y",
       "-loop", "1", "-framerate", "24", "-t", str(dur), "-i", "bg.png", "-i", "video_only.mp4",
       "-loop", "1", "-framerate", "24", "-t", str(dur), "-i", "mask.png",
       "-loop", "1", "-framerate", "24", "-t", str(dur), "-i", "ring.png", "-i", "voice.m4a",
       "-filter_complex", fc, "-map", "[out]", "-map", "4:a", "-c:v", "libx264", "-crf", "26", "-preset", "veryfast",
       "-pix_fmt", "yuv420p", "-r", "24", "-c:a", "copy", "-t", str(dur), "-movflags", "+faststart", os.path.abspath(DEST)]
subprocess.run(cmd, cwd=OUT, check=True)
print("siap", DEST, dur)
