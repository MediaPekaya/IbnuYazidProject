# Haris & Alya – Engagement Day (HyperFrames edit)

16:9 / 1920×1080 / **60 fps** · ~85.2 s · 32 shots (31 klip asal, kronologi asal dikekalkan) · muzik 126 BPM.
Audio = lagu sahaja (audio asal klip dimute, tiada SFX).

## Struktur
- `haris-alya/index.html` – komposisi HyperFrames (dijana, jangan edit tangan; edit `tools/` lalu bina semula)
- `haris-alya/tools/shots.json` – senarai shot: klip, titik mula (`s0`), panjang dalam beat (`n`), jenis transition (`enter`)
- `haris-alya/tools/build.mjs` – kira masa daripada beat grid, jana teks kinetik, lighting dan transition
- `haris-alya/tools/make_proxies.py` – potong setiap shot ke 1080p **60 fps** tanpa audio, dengan **stabilisasi vidstab** gaya gimbal (pelicinan 100, zum terhad; `smooth` / `stab:false` per shot dalam `shots.json`) (50→60 blend, 26→60 motion-compensated) → `assets/shots/`
- `haris-alya/assets/fonts` – Montserrat + Playfair Display (OFL)

## Bina semula
```bash
# 1. letak 31 klip asal di engagement/src/clips/ (VID_20261107_HHMMSS.mp4) dan lagu di engagement/src/music.mp3
cd haris-alya
python3 -I tools/make_proxies.py
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
| Kelantangan lagu | `MUSIC_VOL` dalam `build.mjs` |

Muzik: "Satu Shaf Dibelakangku" (Arvian Dwi) – dibekalkan pengguna. Pastikan hak penggunaan sebelum siar di platform awam.

## Lighting
Grade emas (soft-light), bokeh emas perlahan, light leak pada transition `light`, flare anamorphic, light sweep & sparkle pada momen penting, intro bertema cincin bertaut. Semua elemen cahaya dikongsi (satu flare/sweep/leak) supaya render stabil.

## Teks
Tajuk sahaja sepanjang video. Sub tajuk hanya pada intro (tarikh) dan penutup (tarikh + doa).

## Hook, transition, teks (v3)
- **Hook:** wajah pengantin perempuan menghadap kamera (115040, slow-mo 0.5×), tajuk nama + tarikh rata kiri di bawah muka, tidak menindih muka mahupun tulisan banner.
- **Cincin:** hanya detik tangan dipegang dan cincin masuk (112404, 1.5–3.4s); tiada teks di atasnya.
- **Transition:** setiap pertukaran shot 0.68s: bloom / glide / zoom / light, dengan glitter 4-penjuru, wash emas dan light sweep; `light` tambah light leak + flare.
- **Teks:** fon berangkai (Parisienne untuk nama, Dancing Script untuk tajuk), huruf ditulis kiri ke kanan.
