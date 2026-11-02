"""Bina preview proxy (resolusi rendah, ada suara asal user, tanpa overlay) + thumbnail dari edl.json.
Guna: python3 build_preview.py <tutor1.mp4> <tutor2.mp4> <out_dir>   (BUKAN render akhir)"""
import json, subprocess, sys, os
src = {1: sys.argv[1], 2: sys.argv[2]}; out = sys.argv[3]
edl = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "edl.json")))
c = edl["crop"]; T = edl["audio"]["tempo"]; G = edl["audio"]["gap"]
os.makedirs(out + "/seg", exist_ok=True)
def run(*a): subprocess.run(["ffmpeg", "-v", "error", "-y", *map(str, a)], check=True)
vparts, aparts, t = [], [], 0.0
for b in edl["beats"]:
    vs = b.get("voice")
    dur = (sum(e - s for _, s, e in vs) / T + G * (len(vs) - 1)) if vs else b["fixed"]
    b["start"], b["dur"] = round(t, 2), round(dur, 2)
    sp = (b["to"] - b["from"]) / dur; b["speed"] = round(sp, 2)
    v = f'{out}/seg/{b["id"]}.mp4'
    run("-ss", b["from"], "-t", b["to"] - b["from"], "-i", src[b["src"]],
        "-vf", f'crop={c["w"]}:{c["h"]}:{c["x"]}:{c["y"]},scale=360:-2,setpts=PTS/{sp},fps=15,trim=duration={dur}',
        "-an", "-c:v", "libx264", "-crf", "33", "-preset", "veryfast", "-g", "15", "-pix_fmt", "yuv420p", v)
    vparts.append(v)
    a = f'{out}/seg/{b["id"]}.wav'
    if vs:
        ins, fl = [], []
        for i, (s_, f, e) in enumerate(vs):
            ins += ["-ss", f, "-t", e - f, "-i", src[s_]]
            fl.append(f'[{i}:a]atempo={T},afade=t=in:d=0.05,afade=t=out:st={(e-f)/T-0.07:.3f}:d=0.07,aresample=44100,aformat=channel_layouts=mono[a{i}]')
            if i < len(vs) - 1: fl.append(f'aevalsrc=0:d={G}:s=44100:c=mono[g{i}]')
        order = "".join(f'[a{i}]' + (f'[g{i}]' if i < len(vs) - 1 else '') for i in range(len(vs)))
        n = len(vs) * 2 - 1
        run(*ins, "-filter_complex", ";".join(fl) + f";{order}concat=n={n}:v=0:a=1,apad=whole_dur={dur},atrim=duration={dur}[o]", "-map", "[o]", "-ar", 44100, "-ac", 1, a)
    else:
        run("-f", "lavfi", "-i", f"anullsrc=r=44100:cl=mono", "-t", dur, a)
    aparts.append(a); t += dur
open(out + "/vlist.txt", "w").write("".join(f"file '{p}'\n" for p in vparts))
open(out + "/alist.txt", "w").write("".join(f"file '{p}'\n" for p in aparts))
run("-f", "concat", "-safe", 0, "-i", out + "/vlist.txt", "-c", "copy", out + "/video_only.mp4")
run("-f", "concat", "-safe", 0, "-i", out + "/alist.txt", "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", 44100, "-ac", 1, "-c:a", "aac", "-b:a", "64k", out + "/voice.m4a")
run("-i", out + "/video_only.mp4", "-i", out + "/voice.m4a", "-c:v", "copy", "-c:a", "copy", "-shortest", "-movflags", "+faststart", out + "/preview.mp4")
edl["total"] = round(t, 2)
json.dump(edl, open(out + "/edl_timed.json", "w"), ensure_ascii=False, indent=1)
for b in edl["beats"]:
    run("-ss", b["start"] + b["dur"] * 0.55, "-i", out + "/preview.mp4", "-frames:v", 1, "-vf", "scale=200:-2", "-q:v", 6, f'{out}/th_{b["id"]}.jpg')
print("total", edl["total"])
