"""Bina PREVIEW proxy (resolusi rendah, kelajuan 1x, suara asal) + data subtitle/popup/storyboard dari edit.json.
Hanya potong bahagian tersasul/awkward/senyap panjang. TIDAK ada pecutan, dan ini BUKAN render akhir.
Guna: python3 build_full.py <tutor1.mp4> <tutor2.mp4> <out_dir>"""
import json, os, re, subprocess, sys
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = {1: sys.argv[1], 2: sys.argv[2]}
OUT = sys.argv[3]
FPS = int(os.environ.get("FPS", 12))
WID = int(os.environ.get("WIDTH", 360))
CRF = os.environ.get("CRF", "35")
cfg = json.load(open(HERE + "/edit.json"))
words = {n: [w for s in json.load(open(f"{HERE}/words_t{n}.json")) for w in s["w"]] for n in (1, 2)}
os.makedirs(OUT + "/seg", exist_ok=True)

def run(*a):
    subprocess.run(["ffmpeg", "-v", "error", "-y", *map(str, a)], check=True)

# 1. potongan: manual + senyap panjang (auto)
kept, auto_cuts = {}, []
for n in (1, 2):
    d0, d1 = cfg["domain"][str(n)]
    cuts = [(c["a"], c["b"]) for c in cfg["cuts"] if c["src"] == n]
    ws = [w for w in words[n] if d0 <= w[0] <= d1]
    for p, q in zip(ws, ws[1:]):
        if q[0] - p[1] > cfg["gap"]["max"]:
            a, b = p[1] + cfg["gap"]["keep"] / 2, q[0] - cfg["gap"]["keep"] / 2
            if not any(ca <= a and b <= cb for ca, cb in cuts):
                cuts.append((a, b)); auto_cuts.append({"src": n, "a": round(a, 2), "b": round(b, 2)})
    cuts.sort(); merged = []
    for a, b in cuts:
        if merged and a <= merged[-1][1]: merged[-1][1] = max(merged[-1][1], b)
        else: merged.append([a, b])
    pos, ivs = d0, []
    for a, b in merged + [[d1, d1]]:
        if a - pos >= 0.25:
            d = max(1, round((a - pos) * FPS)) / FPS      # kuantisasi ikut grid frame
            ivs.append([pos, pos + d])
        pos = max(pos, b)
    kept[n] = ivs

# 2. peta masa sumber -> output
offs, t = [], 0.0
for n in (1, 2):
    for iv in kept[n]:
        offs.append((n, iv[0], iv[1], t)); t += iv[1] - iv[0]
TOTAL = round(t, 2)

def tmap(n, x, end=False):
    best = None
    for (m, a, b, o) in offs:
        if m != n: continue
        if a - 0.02 <= x <= b + 0.02: return o + min(max(x, a), b) - a
        if x < a and best is None and not end: best = o
        if x > b and end: best = o + (b - a)
    return best if best is not None else TOTAL

# 3. ekstrak video + audio setiap selang (selari)
jobs = []
for i, (n, a, b, o) in enumerate(offs):
    d = b - a; N = round(d * FPS)
    c = cfg["crop"]
    v, w = f"{OUT}/seg/{i:03d}.mp4", f"{OUT}/seg/{i:03d}.wav"
    jobs.append((["-ss", a, "-t", d, "-i", SRC[n], "-vf", f'crop={c["w"]}:{c["h"]}:{c["x"]}:{c["y"]},scale={WID}:-2,fps={FPS}',
                  "-frames:v", N, "-an", "-c:v", "libx264", "-crf", CRF, "-preset", "veryfast", "-g", FPS, "-pix_fmt", "yuv420p", v],
                 ["-ss", a, "-t", d, "-i", SRC[n], "-vn", "-af",
                  f"afade=t=in:d=0.02,afade=t=out:st={max(0, d - 0.02):.3f}:d=0.02,apad=whole_dur={d},atrim=duration={d}",
                  "-ar", 44100, "-ac", 1, "-c:a", "pcm_s16le", w]))
def doit(j): run(*j[0]); run(*j[1])
with ThreadPoolExecutor(4) as ex: list(ex.map(doit, jobs))
open(OUT + "/vlist.txt", "w").write("".join(f"file '{OUT}/seg/{i:03d}.mp4'\n" for i in range(len(offs))))
open(OUT + "/alist.txt", "w").write("".join(f"file '{OUT}/seg/{i:03d}.wav'\n" for i in range(len(offs))))
run("-f", "concat", "-safe", 0, "-i", OUT + "/vlist.txt", "-c", "copy", OUT + "/video_only.mp4")
run("-f", "concat", "-safe", 0, "-i", OUT + "/alist.txt", "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", 44100, "-ac", 1,
    "-c:a", "aac", "-b:a", "48k", OUT + "/voice.m4a")
run("-i", OUT + "/video_only.mp4", "-i", OUT + "/voice.m4a", "-c:v", "copy", "-c:a", "copy", "-movflags", "+faststart", OUT + "/preview.mp4")

# 4. subtitle daripada perkataan yang kekal
rep, key = cfg["replace"], set(cfg["keywords"])
norm = lambda s: re.sub(r"[^\w:.]", "", s.lower()).strip(".")
toks = []
for n in (1, 2):
    for w in words[n]:
        mid = (w[0] + w[1]) / 2
        iv = next(((a, b, o) for (m, a, b, o) in offs if m == n and a <= mid <= b), None)
        if not iv: continue
        a, b, o = iv
        s, e = o + max(w[0], a) - a, o + min(w[1], b) - a
        txt = w[2]; core = norm(txt)
        if core in rep:
            m = re.match(r"^([^\w]*)(.*?)([^\w]*)$", txt)
            txt = m.group(1) + rep[core] + m.group(3)
            core = norm(rep[core])
        toks.append({"s": s, "e": max(e, s + 0.05), "t": txt, "k": core in key})
cues, cur = [], []
def flush():
    global cur
    if not cur: return
    text = " ".join(x["t"] for x in cur).strip().rstrip(".,")
    kcount, parts = 0, []
    for x in cur:
        tt = x["t"]
        if x["k"] and kcount < 2:
            kcount += 1; tt = "*" + tt.rstrip(".,?!") + "*" + tt[len(tt.rstrip(".,?!")):]
        parts.append(tt)
    t2 = re.sub(r" -(?=\w)", "-", " ".join(parts)).strip().rstrip(".,")
    t2 = t2[0].upper() + t2[1:] if t2 else t2
    cues.append({"s": cur[0]["s"], "e": cur[-1]["e"], "t": t2, "end": cur[-1]["t"][-1:] in ".?!"})
    cur = []
for x in toks:
    if cur and (x["s"] - cur[-1]["e"] > 0.5 or len(cur) >= 6 or sum(len(y["t"]) + 1 for y in cur) > 34
                or cur[-1]["t"][-1:] in ".?!" or (cur[-1]["t"][-1:] == "," and len(cur) >= 3)):
        flush()
    cur.append(x)
flush()
for i, c in enumerate(cues):
    nxt = cues[i + 1]["s"] if i + 1 < len(cues) else TOTAL
    c["e"] = round(min(max(c["e"] + 0.35, c["s"] + 0.8), nxt), 2); c["s"] = round(c["s"], 2)
first = next((i for i, c in enumerate(cues) if c["end"]), 0)
hook_end = cues[first]["e"]
for i, c in enumerate(cues): c["hook"] = i <= first; c.pop("end")

# 5. popup, adegan, rekod potongan
pops = []
for p in cfg["popups"]:
    s = tmap(p["src"], p["t"]); e = min(TOTAL, s + p["d"])
    pops.append({"s": round(s, 2), "e": round(e, 2), "t": p["text"]})
scenes = []
for sc in cfg["scenes"]:
    s, e = tmap(sc["src"], sc["from"]), tmap(sc["src"], sc["to"], end=True)
    scenes.append({**{k: sc[k] for k in ("id", "step", "label", "src", "from", "to")}, "s": round(s, 2), "e": round(e, 2)})
cuts = []
for c in cfg["cuts"]:
    cuts.append({**c, "out": round(tmap(c["src"], c["b"]), 2), "secs": round(c["b"] - c["a"], 1)})
for sc in scenes:
    sc["cuts"] = [c["id"] for c in cuts if c["src"] == sc["src"] and sc["from"] - 0.01 <= c["a"] < sc["to"]]
    sc["subs"] = [c["t"] for c in cues if sc["s"] <= c["s"] < sc["e"]]
    sc["pops"] = [p["t"] for p in pops if sc["s"] <= p["s"] < sc["e"]]
orig = sum(float(json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", SRC[n]]))["format"]["duration"]) for n in (1, 2))
data = {"total": TOTAL, "orig": round(orig, 1), "cues": cues, "pops": pops, "scenes": scenes, "cuts": cuts,
        "auto": {"count": len(auto_cuts), "secs": round(sum(c["b"] - c["a"] for c in auto_cuts), 1)},
        "hook_title": cfg["hook_title"], "hook_end": hook_end, "outro_title": cfg["outro_title"]}
json.dump(data, open(OUT + "/edit_timed.json", "w"), ensure_ascii=False, indent=1)
for sc in scenes:
    mid = (sc["s"] + sc["e"]) / 2
    run("-ss", mid, "-i", OUT + "/preview.mp4", "-frames:v", 1, "-vf", "scale=200:-2", "-q:v", 6, f'{OUT}/th_{sc["id"]}.jpg')
print("total", TOTAL, "asal", data["orig"], "cues", len(cues), "auto", data["auto"])
