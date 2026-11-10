# Haris & Alya – Engagement Day (HyperFrames edit)

16:9 / 1920×1080 / 30 fps · ~88.6 s · 34 shots (31 klip asal, kronologi asal dikekalkan) · muzik 126 BPM.

## Struktur
- `haris-alya/index.html` – komposisi HyperFrames (dijana, jangan edit tangan; edit `tools/` lalu bina semula)
- `haris-alya/tools/shots.json` – senarai shot: klip, titik mula (`s0`), panjang dalam beat (`n`), jenis transition (`enter`)
- `haris-alya/tools/build.mjs` – kira masa daripada beat grid, jana teks kinetik, lighting, transition & SFX
- `haris-alya/tools/make_proxies.py` – potong + normalkan audio setiap shot (`assets/shots/`)
- `haris-alya/tools/make_sfx.py` – sintesis SFX (whoosh/impact/pop/shimmer) – bebas royalti
- `haris-alya/assets/fonts` – Montserrat + Playfair Display (OFL)

## Bina semula
```bash
# 1. letak 31 klip asal di engagement/src/clips/ (VID_20261107_HHMMSS.mp4) dan lagu di engagement/src/music.mp3
cd haris-alya
python3 -I tools/make_proxies.py && python3 -I tools/make_sfx.py
ffmpeg -y -ss 28.264 -t 90.5 -i ../src/music.mp3 -c:a aac -b:a 192k -ar 48000 assets/music.m4a
node tools/build.mjs
npx hyperframes check
npx hyperframes preview          # Studio preview
```

## Pelarasan biasa
| Nak ubah | Edit |
|---|---|
| Panjang / bahagian klip | `tools/shots.json` → `s0`, `n` |
| Jenis transition | `enter`: `dissolve` · `whip` · `push` · `light` |
| Teks / masa teks | `TEXTS` dalam `tools/build.mjs` |
| Kelantangan muzik | `data-volume="0.22"` pada `#music` |
| Lagu dalam audio asal | `TARGET_MEAN` dalam `make_proxies.py` |

Muzik: "Satu Shaf Dibelakangku" (Arvian Dwi) – dibekalkan pengguna. Pastikan hak penggunaan sebelum siar di platform awam.
