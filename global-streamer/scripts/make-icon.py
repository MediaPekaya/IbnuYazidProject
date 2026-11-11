#!/usr/bin/env python3
"""Bina build/icon.ico (PNG berbilang saiz) daripada build/icon.png. Setiap saiz diturunkan terus
daripada sumber dengan LANCZOS pada alfa pra-darab (tiada halo) kemudian ditajamkan ikut saiz."""
import io, struct, sys
from PIL import Image, ImageFilter
import numpy as np
SRC = 'build/icon.png'; OUT = 'build/icon.ico'
SIZES = [16,20,24,30,32,36,40,44,48,56,60,64,72,80,96,112,128,144,160,192,224,256]
src = Image.open(SRC).convert('RGBA')
a = np.asarray(src).astype('float32')/255.0
pm = a.copy(); pm[...,:3] *= pm[...,3:4]
def resize(s):
    chans = []
    for c in range(4):
        im = Image.fromarray(pm[...,c], mode='F').resize((s,s), Image.LANCZOS)
        chans.append(np.asarray(im))
    o = np.stack(chans, -1)
    al = np.clip(o[...,3:4], 0, 1)
    rgb = np.where(al > 1e-4, o[...,:3]/np.maximum(al,1e-4), 0)
    o = np.clip(np.concatenate([rgb, al], -1), 0, 1)
    return Image.fromarray((o*255+0.5).astype('uint8'), 'RGBA')
def sharpen(im, s):
    pct = 140 if s <= 32 else 110 if s <= 64 else 80 if s <= 128 else 60
    rad = 0.5 if s <= 32 else 0.7 if s <= 64 else 0.9
    rgb = im.convert('RGB').filter(ImageFilter.UnsharpMask(radius=rad, percent=pct, threshold=0))
    rgb.putalpha(im.getchannel('A'))
    return rgb
frames = []
for s in SIZES:
    im = sharpen(resize(s), s)
    b = io.BytesIO(); im.save(b, 'PNG', optimize=True); frames.append((s, b.getvalue()))
hdr = struct.pack('<HHH', 0, 1, len(frames)); off = 6 + 16*len(frames); ent = b''; data = b''
for s, d in frames:
    ent += struct.pack('<BBBBHHII', s if s < 256 else 0, s if s < 256 else 0, 0, 0, 1, 32, len(d), off + len(data)); data += d
open(OUT, 'wb').write(hdr + ent + data)
print('ok', len(frames), 'saiz', len(hdr+ent+data), 'bait')
