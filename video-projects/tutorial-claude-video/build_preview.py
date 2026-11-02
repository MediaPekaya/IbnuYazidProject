"""Bina video proxy preview (resolusi rendah, tanpa overlay) + thumbnail dari edl.json.
Guna: python3 build_preview.py <tutor1.mp4> <tutor2.mp4> <out_dir>
Ini BUKAN render akhir."""
import json, subprocess, sys, os
t1, t2, out = sys.argv[1:4]
edl = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "edl.json")))
c = edl["crop"]; os.makedirs(out + "/seg", exist_ok=True)
parts, t = [], 0.0
for b in edl["beats"]:
    segs = b.get("segs") or [[b["from"], b["to"], b["speed"]]]
    b["start"] = round(t, 2)
    for i, (f, e, sp) in enumerate(segs):
        name = f'{out}/seg/{b["id"]}_{i}.mp4'
        vf = f'crop={c["w"]}:{c["h"]}:{c["x"]}:{c["y"]},scale=360:-2,setpts=PTS/{sp},fps=15'
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(f), "-t", str(e - f), "-i", t1 if b["src"] == 1 else t2,
                        "-vf", vf, "-an", "-c:v", "libx264", "-crf", "33", "-preset", "veryfast", "-g", "15",
                        "-pix_fmt", "yuv420p", name], check=True)
        parts.append(name); t += (e - f) / sp
    b["dur"] = round(t - b["start"], 2)
open(out + "/list.txt", "w").write("".join(f"file '{p}'\n" for p in parts))
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", out + "/list.txt", "-c", "copy", out + "/preview.mp4"], check=True)
edl["total"] = round(t, 2)
json.dump(edl, open(out + "/edl_timed.json", "w"), ensure_ascii=False, indent=1)
for b in edl["beats"]:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(b["start"] + b["dur"] * 0.55), "-i", out + "/preview.mp4",
                    "-frames:v", "1", "-vf", "scale=200:-2", "-q:v", "6", f'{out}/th_{b["id"]}.jpg'], check=True)
print("total", edl["total"])
