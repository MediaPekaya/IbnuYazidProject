#!/usr/bin/env python3
"""Cut one silent proxy per shot: 1920x1080, 60 fps CFR, short GOP.
Source clips are 60 / 50 / 26 fps; everything is brought to a true 60 fps so motion stays smooth.
Original audio is dropped on purpose (the film uses the song only)."""
import json, subprocess, sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "..", "src", "clips")
cfg = json.load(open(os.path.join(HERE, "shots.json")))
per = cfg["per"]
PRE, POST = 0.35, 0.35

def src_fps(path):
    r = subprocess.run(["ffprobe","-v","error","-select_streams","v:0","-show_entries","stream=r_frame_rate","-of","csv=p=0",path],capture_output=True,text=True).stdout.strip()
    a, b = r.split("/"); return float(a) / float(b)

def run(sh):
    sid, clip, s0, n = sh["id"], sh["clip"], sh["s0"], sh["n"]
    pre = 0.0 if sh["enter"] == "first" else PRE
    ss = max(0.0, s0 - pre)
    dur = n * per + pre + POST
    src = os.path.join(SRC, f"VID_20261107_{clip}.mp4")
    out = os.path.join(ROOT, "assets", "shots", f"{sid}.mp4")
    fps = src_fps(src)
    if fps > 58:   rate = "fps=60"                                                    # native 60
    elif fps > 45: rate = "framerate=fps=60:interp_start=0:interp_end=255:scene=100"  # 50 -> 60, weighted blend (no stutter)
    else:          rate = "minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1"  # 26 -> 60, motion-compensated
    vf = f"scale=1920:1080:flags=lanczos,{rate},format=yuv420p"
    cmd = ["ffmpeg","-v","error","-y","-ss",f"{ss:.3f}","-t",f"{dur:.3f}","-i",src,"-an","-vf",vf,
           "-c:v","libx264","-preset","veryfast","-crf","18","-g","30","-bf","0","-movflags","+faststart",out]
    subprocess.run(cmd, check=True)
    print(f"{sid} clip {clip} {fps:.0f}fps ss={ss:.2f} dur={dur:.2f}", flush=True)

if __name__ == "__main__":
    only = sys.argv[1] if len(sys.argv) > 1 else None
    shots = [s for s in cfg["shots"] if only in (None, s["id"])]
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(4) as ex: list(ex.map(run, shots))
