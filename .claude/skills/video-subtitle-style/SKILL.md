---
name: video-subtitle-style
description: WAJIB untuk SEMUA video yang user edit/cipta (Hyperframes, Remotion, infografik, ffmpeg, apa-apa). Tetapan tetap gaya subtitle (teks yang user cakap): Poppins SemiBold, biru air cerah, perkataan Inggeris italic, teks Arab Traditional Arabic (tak bold, tak italic), DAN animasi bingkai kaca perak (iOS glass) pada setiap perkataan yang sedang disebut, meluncur lancar ke tepi ke perkataan seterusnya.
---

# Gaya subtitle tetap (jangan tukar kecuali user minta)

Terpakai pada **subtitle/kapsyen ucapan user sahaja**. Font infografik, tajuk dan grafik lain **bukan** bawah skill ini; ia ada gaya sendiri.

| Perkara | Tetapan |
|---|---|
| Font | **Poppins SemiBold** (weight 600). Bukan Bold (700). |
| Warna teks | **Biru air cerah** `#38BDF8` (sky/water blue) |
| Perkataan Inggeris | **Italic** (Poppins SemiBold Italic), contoh *actually*, *literally*, *basically*, *so* |
| Perkataan Melayu | Poppins SemiBold biasa (tegak) |
| **Perkataan/ayat Arab** | **Traditional Arabic** (regular, **bukan bold, bukan italic**), warna sama `#38BDF8` |

## Peraturan
1. Berlaku untuk setiap jenis video: Remotion, Hyperframes, ffmpeg/ASS, infografik dengan suara, apa sahaja, selagi ada teks ucapan user.
2. User bercakap campur BM + Inggeris. Semasa menjana subtitle, **tandakan setiap perkataan Inggeris** (termasuk perkataan pinjaman yang user sebut dalam Inggeris seperti *actually*) dan jadikan italic. Jangan italic-kan perkataan Melayu, nama jenama atau nama khas.
3. Kebolehbacaan: tambah outline gelap nipis (`#0B1020`, 4-6 px) atau bayang lembut supaya biru cerah jelas di atas video; kekal dalam safe zone (elak 220 px bawah, 150 px atas untuk UI TikTok).
4. **Bahasa Arab**: mana-mana perkataan/ayat Arab (doa, ayat, istilah) guna font **Traditional Arabic**, weight biasa (400), **tanpa bold dan tanpa italic**, warna biru air `#38BDF8` yang sama. Tulis dengan huruf Arab sebenar (jangan rumi) dan kekalkan harakat jika ada. Arah RTL.
5. 2-4 perkataan satu baris; susunan lain ikut `video-sound-and-captions`.
6. Font: guna Poppins (Google Fonts). Remotion: `@remotion/google-fonts/Poppins` dengan weight `600`, style `normal` dan `italic`. ffmpeg/ASS: pasang/letak fail Poppins-SemiBold dan Poppins-SemiBoldItalic, `Bold=0`.

## Remotion
Guna komponen `templates/video/remotion/Subtitle.tsx` dan pemalar `subtitle` dalam `theme.ts`. Format perkataan:
```json
[{"text":"saya","start":0.0,"end":0.3},{"text":"actually","start":0.3,"end":0.8,"en":true}]
```
`en: true` = italic Inggeris. Teks Arab dikesan automatik (julat Unicode Arab) atau tanda `"ar":true`; ia guna Traditional Arabic, tegak, weight biasa.

**Nota font Arab:** Traditional Arabic ialah font Microsoft (Windows/Office), bukan Google Font, jadi ia tiada pada mesin render Linux/cloud. Untuk render tepat, render pada mesin yang ada font itu (Windows/Office) atau pasang fail Traditional Arabic pada mesin render (sistem fon). Kalau tiada, Subtitle.tsx jatuh ke **Amiri** (Google Font, rupa naskh tradisional yang hampir sama) dan aku mesti bagitahu user fallback digunakan. Atau dalam teks biasa: `saya *actually* suka`.

## ASS (ffmpeg)
`Style: Sub,Poppins SemiBold,64,&H00F8BD38,&H00F8BD38,&H00201B0B,&H64000000,0,0,0,0,100,100,0,0,1,5,1,2,60,60,260,1`
Perkataan Inggeris: bungkus dengan `{\i1}actually{\i0}`.
Arab: `Style: Arab,Traditional Arabic,72,&H00F8BD38,&H00F8BD38,&H00201B0B,&H64000000,0,0,0,0,100,100,0,0,1,5,1,2,60,60,260,1` (Bold=0, Italic=0). (Warna ASS ialah BGR: `#38BDF8` = `&H00F8BD38`.)

## Animasi perkataan: bingkai kaca perak (WAJIB, setiap edit)
Setiap perkataan subtitle dapat **bingkai kaca** tepat pada saat user mula sebut perkataan itu (contoh: "Allah bagi kita nikmat" -> bila sebut *Allah*, bingkai pada **Allah** sahaja; bila sebut *bagi*, bingkai meluncur ke **bagi**).

| Perkara | Tetapan |
|---|---|
| Skop | **Satu perkataan, satu bingkai.** Jangan bingkai seluruh baris/semua perkataan serentak |
| Gerakan | Bingkai **meluncur ke tepi** dari perkataan sebelum ke perkataan semasa (x + lebar berubah serentak), licin macam gerakan iOS |
| Easing | `expo.out` (GSAP) / spring `damping 20, stiffness 220, mass 0.6` (Remotion); tempoh 0.25-0.38 s, tak lebih dari jarak ke perkataan seterusnya |
| Masuk baris | Bingkai muncul pada perkataan pertama: fade + scale 0.82 -> 1 (`back.out(1.6)`, 0.3 s) |
| Rupa kaca (iOS system update) | latar `linear-gradient(135deg, rgba(255,255,255,.30), rgba(220,228,240,.12) 45%, rgba(255,255,255,.06))`; border **perak** `1.5px solid rgba(226,232,240,.90)`; `backdrop-filter: blur(12px) saturate(170%)`; radius 20 px; `box-shadow: inset 0 1.5px 0 rgba(255,255,255,.7), inset 0 -1px 0 rgba(255,255,255,.18), inset 0 0 14px rgba(255,255,255,.10), 0 8px 22px rgba(0,0,0,.32)` |
| Padding | 16 px kiri/kanan, 8 px atas/bawah dari kotak perkataan |
| Lapisan | Bingkai di BELAKANG teks (teks kekal biru `#38BDF8` + outline gelap, boleh baca) |
| Arab | Frasa Arab = satu token, satu bingkai (RTL dikekalkan) |
| Kelicinan | Render 30 fps minimum; 60 fps (`--fps 60`) bila mahu lebih licin "4K". Kedudukan perkataan mesti tetap (deterministik) |

**Hyperframes:** ukur kotak setiap perkataan sekali dalam Chromium dengan font sebenar (`document.fonts.ready`, simpan `offsetLeft/Top/Width/Height` ke JSON), kemudian tulis nombor tetap ke dalam tween (`tl.to(pill,{x,width,duration,ease:"expo.out"}, masaPerkataan)`). Jangan guna nilai fungsi yang ukur layout semasa render (tak deterministik antara worker). Rujukan: `infografik/video-projects/bahasa-cinta-allah/tools/generate_index.py` + `tools/measure_words.cjs`.
**Remotion:** `templates/video/remotion/Subtitle.tsx` (prop `glass`, default `true`).

## Peraturan gaya edit: setiap video BERBEZA
Gaya subtitle di atas kekal sama. Tetapi **gaya edit/infografik setiap video baru mesti lain daripada video sebelumnya** (palet, bentuk kad, jenis transition, susun atur). Semak `STYLE-LOG.md` dalam skill ini dulu, pilih arah baru, dan tambah entri selepas edit.
