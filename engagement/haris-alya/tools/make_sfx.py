#!/usr/bin/env python3
"""Synthesise the SFX set (whoosh / impact / pop / shimmer) -> assets/sfx/*.wav. Royalty-free by construction."""
import numpy as np, wave, os
SR = 48000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "sfx"); os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)  # fixed seed -> identical files every run

def save(name, x, peak=0.89):
    x = x / (np.abs(x).max() + 1e-9) * peak
    st = np.stack([x, x], 1)
    with wave.open(os.path.join(OUT, name + ".wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())

def sweep_lp(noise, f0, f1, f2, n):
    """time-varying one-pole lowpass: cutoff goes f0 -> f1 (peak) -> f2"""
    t = np.linspace(0, 1, n)
    f = np.where(t < 0.5, f0 + (f1 - f0) * np.sin(t / 0.5 * np.pi / 2) ** 2, f1 + (f2 - f1) * (1 - np.cos((t - 0.5) / 0.5 * np.pi / 2)))
    a = 1 - np.exp(-2 * np.pi * f / SR)
    y = np.zeros(n); s = 0.0
    for i in range(n):
        s += a[i] * (noise[i] - s); y[i] = s
    return y

def hp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.zeros_like(x); px = 0.0; py = 0.0
    for i in range(len(x)):
        py = a * (py + x[i] - px); px = x[i]; y[i] = py
    return y

def whoosh(dur, f0, f1, f2, hpf, peak_at=0.45, power=1.8):
    n = int(SR * dur); noise = rng.standard_normal(n)
    y = hp(sweep_lp(noise, f0, f1, f2, n), hpf)
    t = np.linspace(0, 1, n)
    env = np.where(t < peak_at, (t / peak_at) ** power, ((1 - t) / (1 - peak_at)) ** 1.4)
    return y * env

# soft whoosh: dissolves
save("whoosh_soft", whoosh(0.9, 300, 2600, 500, 120))
# fast whoosh: whip pans
save("whoosh_fast", whoosh(0.55, 700, 7500, 900, 250, 0.5, 2.2))
# zoom-through whoosh: push
w = whoosh(0.7, 250, 5200, 700, 180, 0.6, 2.4); save("whoosh_zoom", w)
# impact: sub thump + noise crack + tail
n = int(SR * 2.0); t = np.arange(n) / SR
f = 45 + 60 * np.exp(-t * 14); ph = 2 * np.pi * np.cumsum(f) / SR
sub = np.sin(ph) * np.exp(-t * 2.6)
crack = hp(sweep_lp(rng.standard_normal(n), 6000, 6000, 1200, n), 300) * np.exp(-t * 22)
tail = np.convolve(rng.standard_normal(n), np.exp(-np.arange(int(SR * 0.9)) / (SR * 0.25)), "same")[:n]
tail = sweep_lp(tail, 1800, 1800, 600, n) * np.exp(-t * 2.2) * 0.18
save("impact", sub * 1.0 + crack * 0.55 + tail)
# pop: soft text tick
n = int(SR * 0.22); t = np.arange(n) / SR
f = 520 + 520 * np.exp(-t * 40); pop = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 26)
pop += 0.25 * hp(rng.standard_normal(n), 3000) * np.exp(-t * 120)
save("pop", pop)
# shimmer: light-sweep glint
n = int(SR * 1.6); t = np.arange(n) / SR; sh = np.zeros(n)
for k, fr in enumerate([1568, 2349, 3136, 4699, 6272]):
    d = 0.02 * k
    sh += np.sin(2 * np.pi * fr * (t + 0.0002 * np.sin(5 * t)) ) * np.clip((t - d) / 0.03, 0, 1) * np.exp(-(t - d) * (2.2 + k * 0.6)) / (1 + k * 0.4)
save("shimmer", sh)
print("sfx ok:", sorted(os.listdir(OUT)))
