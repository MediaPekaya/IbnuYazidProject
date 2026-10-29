#!/usr/bin/env python3
"""Re-cut every segment in edl.json from the raw recordings with the voice clean-up chain.

Usage: python3 tools/reencode.py <raw-dir containing qr1.mp4 qr2.mp4>
Chain: high-pass -> notch mains hum (100/200/300 Hz) and two electronic whines (~5.1/5.4 kHz)
       -> FFT denoise -> gentle expander (no pumping) -> edge fades -> loudness to -16 LUFS.
"""
import json, os, subprocess, sys
import numpy as np
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = sys.argv[1]
edl = json.load(open(f'{HERE}/edl.json'))
CLEAN = ('highpass=f=70,'
         'equalizer=f=100:t=q:w=40:g=-30,equalizer=f=200:t=q:w=40:g=-20,equalizer=f=300:t=q:w=40:g=-12,'
         'equalizer=f=5076:t=q:w=60:g=-14,equalizer=f=5409:t=q:w=60:g=-14,'
         'afftdn=nr=30:nf={NF}:tn=1,'
         'agate=threshold=0.0016:ratio=2.5:attack=12:release=250:range=0.2:knee=3,'
         'treble=g=3:f=3500:t=s')


def noise_floor(src, start, dur):
    """10th-percentile frame level (dBFS) of the raw clip = its room/mic noise floor."""
    x = np.frombuffer(subprocess.check_output(['ffmpeg', '-v', 'error', '-ss', str(start), '-t', str(dur), '-i', f'{RAW}/{src}.mp4',
                                               '-vn', '-ac', '1', '-ar', '16000', '-f', 's16le', '-']), np.int16).astype(float) / 32768
    m = len(x) // 320
    db = 20 * np.log10(np.sqrt((x[:m * 320].reshape(m, 320) ** 2).mean(1)) + 1e-9)
    return int(max(-80, min(-40, round(np.percentile(db, 10)))))

at = 0.0
for e in edl:
    d, out = e['dur'], f"{HERE}/assets/video/{e['clip']}"
    nf = noise_floor(e['src'], e['start'], d); print('  noise floor', nf, 'dB')
    af = (f'aresample=48000,{CLEAN.replace("{NF}", str(nf))},afade=t=in:d=0.02,afade=t=out:st={d-0.03:.3f}:d=0.03,'
          'loudnorm=I=-16:TP=-1.5:LRA=7,aresample=48000')
    vf = 'crop=1060:830:420:0,scale=840:658:flags=lanczos,fps=30,format=yuv420p'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(e['start']), '-t', str(d), '-i', f"{RAW}/{e['src']}.mp4",
                    '-vf', vf, '-af', af, '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-g', '30', '-keyint_min', '30',
                    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', out], check=True)
    v = float(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=duration',
                                       '-of', 'csv=p=0', out]).decode())
    e['vdur'], e['at'] = round(v, 4), round(at, 4); at += v
    print(e['label'], e['at'], e['vdur'])
json.dump(edl, open(f'{HERE}/edl.json', 'w'), indent=1); print('total', round(at, 3))
