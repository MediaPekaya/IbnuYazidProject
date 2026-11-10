#!/usr/bin/env python3
"""Cut one silent, STABILISED proxy per shot: 1920x1080, 60 fps CFR, short GOP.
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

SCRATCH = os.environ.get("HF_SCRATCH", "/tmp/hf_stab")
os.makedirs(SCRATCH, exist_ok=True)
MARGIN = 0.6          # extra seconds either side so the smoother has context at the cut points
SMOOTH = int(os.environ.get('HF_SMOOTH', 100))          # vidstab smoothing window (frames at source rate): large = gimbal / iPhone-like glide
MAXSHIFT = int(os.environ.get('HF_MAXSHIFT', 90))   # px cap on the correction -> keeps the auto-zoom small (~<10%)
MAXANGLE = float(os.environ.get('HF_MAXANGLE', 0.035))  # rad cap on roll correction

def run(sh):
    """pass 1 vidstabdetect -> pass 2 vidstabtransform (+optimal zoom), then rate-convert to 60 fps and trim.
    Optional per-shot "speed" (<1 = slow motion) is applied after stabilisation with motion-compensated interpolation."""
    sid, clip, s0, n = sh["id"], sh["clip"], sh["s0"], sh["n"]
    sp = float(sh.get("speed", 1.0))
    pre = 0.0 if sh["enter"] == "first" else PRE
    dur = n * per + pre + POST                 # output seconds
    ss = max(0.0, s0 - pre * sp)               # source seconds
    src = os.path.join(SRC, f"VID_20261107_{clip}.mp4")
    out = os.path.join(os.environ.get("HF_OUT_DIR", os.path.join(ROOT, "assets", "shots")), f"{sid}.mp4")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    fps = src_fps(src)
    m0 = min(MARGIN, ss)                       # margin actually available before the cut (source seconds)
    seg = ["-ss", f"{ss - m0:.3f}", "-t", f"{dur * sp + m0 + MARGIN:.3f}", "-i", src]
    trf = os.path.join(SCRATCH, f"{sid}.trf")
    use_stab = sh.get("stab", True)           # "stab": false in shots.json = leave the shot untouched
    if use_stab:
        subprocess.run(["ffmpeg","-v","error","-y",*seg,"-an","-vf",f"vidstabdetect=shakiness=7:accuracy=15:result={trf}","-f","null","-"], check=True)
    smooth = sh.get('smooth', SMOOTH)   # per-shot override in shots.json (big moving subjects confuse the tracker)
    stab = f"vidstabtransform=input={trf}:smoothing={smooth}:optzoom=1:zoom=0:maxshift={sh.get('maxshift', MAXSHIFT)}:maxangle={sh.get('maxangle', MAXANGLE)}:interpol=bicubic:crop=black:relative=1"
    if sp < 0.999:
        rate = f"setpts=PTS/{sp},minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,unsharp=5:5:0.6"
    elif fps > 58: rate = "fps=60"                                                    # native 60
    elif fps > 45: rate = "framerate=fps=60:interp_start=0:interp_end=255:scene=100"  # 50 -> 60, weighted blend (no stutter)
    else:          rate = "minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1"  # 26 -> 60, motion-compensated
    grade = sh.get("grade")                    # optional ffmpeg colour filter (e.g. lift the hands on the ring shot)
    crisp = "unsharp=5:5:0.45:5:5:0" if sp >= 0.999 else ""   # slight crispness so zoomed/stabilised frames keep a "4K" bite
    post = ",".join(x for x in (grade, crisp) if x)
    vf = f"{stab + ',' if use_stab else ''}scale=1920:1080:flags=lanczos,{rate},{post + ',' if post else ''}trim=start={m0 / sp:.3f}:duration={dur:.3f},setpts=PTS-STARTPTS,format=yuv420p"
    subprocess.run(["ffmpeg","-v","error","-y",*seg,"-an","-vf",vf,
                    "-c:v","libx264","-preset","veryfast","-crf","18","-g","30","-bf","0","-movflags","+faststart",out], check=True)
    s2 = sh.get("stab2", int(os.environ.get("HF_STAB2", 40)))   # second, gentler pass removes the residual micro-jitter
    if s2 and use_stab:
        trf2 = os.path.join(SCRATCH, f"{sid}_2.trf"); tmp = out + ".p2.mp4"
        subprocess.run(["ffmpeg","-v","error","-y","-i",out,"-an","-vf",f"vidstabdetect=shakiness=5:accuracy=15:result={trf2}","-f","null","-"], check=True)
        subprocess.run(["ffmpeg","-v","error","-y","-i",out,"-an","-vf",f"vidstabtransform=input={trf2}:smoothing={int(s2)}:optzoom=1:zoom=0:maxshift=40:maxangle=0.02:interpol=bicubic:crop=black:relative=1,format=yuv420p",
                        "-c:v","libx264","-preset","veryfast","-crf","18","-g","30","-bf","0","-movflags","+faststart",tmp], check=True)
        os.replace(tmp, out)
    print(f"{sid} clip {clip} {fps:.0f}fps ss={ss:.2f} dur={dur:.2f} speed={sp} {'stabilised' if use_stab else 'raw (stab off)'}", flush=True)

if __name__ == "__main__":
    only = sys.argv[1] if len(sys.argv) > 1 else None
    shots = [s for s in cfg["shots"] if only in (None, s["id"])]
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(4) as ex: list(ex.map(run, shots))
