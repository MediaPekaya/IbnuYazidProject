#!/usr/bin/env python3
"""Cut + normalise one proxy per shot: 1920x1080, 30fps CFR, short GOP, audio levelled."""
import json, subprocess, sys, re, os
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "..", "src", "clips")
cfg = json.load(open(os.path.join(HERE, "shots.json")))
per = cfg["per"]
PRE, POST = 0.30, 0.30
TARGET_MEAN = -24.0   # dB mean volume we aim the original audio at
def run(sh):
    sid, clip, s0, n = sh["id"], sh["clip"], sh["s0"], sh["n"]
    pre = 0.0 if sh["enter"] == "first" else PRE
    ss = max(0.0, s0 - pre)
    dur = n * per + pre + POST
    src = os.path.join(SRC, f"VID_20261107_{clip}.mp4")
    out = os.path.join(ROOT, "assets", "shots", f"{sid}.mp4")
    gain = 0.0
    if not sh.get("mute"):
        p = subprocess.run(["ffmpeg","-hide_banner","-nostats","-ss",f"{ss:.3f}","-t",f"{dur:.3f}","-i",src,"-vn","-af","volumedetect","-f","null","-"],capture_output=True,text=True)
        m = re.search(r"mean_volume: (-?[\d.]+) dB", p.stderr)
        mean = float(m.group(1)) if m else -40
        gain = max(-6.0, min(12.0, TARGET_MEAN - mean))
    af = f"volume={gain:.1f}dB,alimiter=limit=0.89"
    cmd = ["ffmpeg","-v","error","-y","-ss",f"{ss:.3f}","-t",f"{dur:.3f}","-i",src,
           "-vf","scale=1920:1080:flags=lanczos,fps=30,format=yuv420p",
           "-c:v","libx264","-preset","veryfast","-crf","19","-g","15","-bf","0","-movflags","+faststart"]
    cmd += (["-an"] if sh.get("mute") else ["-af",af,"-c:a","aac","-b:a","192k","-ar","48000","-ac","2"])
    cmd += [out]
    subprocess.run(cmd, check=True)
    print(f"{sid} clip {clip} ss={ss:.2f} dur={dur:.2f} gain={gain:+.1f}dB", flush=True)
if __name__ == "__main__":
    only = sys.argv[1] if len(sys.argv) > 1 else None
    shots = [s for s in cfg["shots"] if only in (None, s["id"])]
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(4) as ex: list(ex.map(run, shots))
