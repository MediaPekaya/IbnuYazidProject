---
name: video-raw-infographic-layer
description: Gaya edit tetap user - raw video (user bercakap) DITINDIH layer infografik. Overlay atas footage (count-up sisi, callout garis ikut objek/muka, kad kaca 30-40%, kinetic keyword) berselang-seli dengan babak infografik SKRIN PENUH (tiada muka, suara sahaja) yang bertindak balas dengan footage. Guna untuk setiap edit video talking-head (Hyperframes/Remotion), bersama video-subtitle-style.
---

# Raw video + layer infografik (gaya edit user)

Teknik STRUKTUR ini kekal untuk setiap edit talking-head. **Rupa visual (palet, bentuk kad, transition, font infografik) mesti lain setiap video** - semak `video-subtitle-style/STYLE-LOG.md` dan tambah entri selepas edit.

## 1. Asas
- **Transkrip dulu** (timestamp per perkataan). Setiap grafik muncul TEPAT masa perkataan disebut, hilang bila ayat lepas.
- **Masa kekal raw video** kecuali user minta potong. 9:16 1080x1920, semua teks dalam safe zone (x 110-970, y 230-1500; elak 150 px atas & ~420 px bawah untuk UI TikTok/Reels; kanan > 960 = butang).
- Subtitle ucapan ikut `video-subtitle-style` (Poppins SemiBold #38BDF8, Inggeris italic, Arab Traditional Arabic, bingkai kaca perak per perkataan).
- Ayat/doa Arab yang user sebut: tulis dalam huruf Arab (semak dengan user jika ASR tak pasti).

## 2. Layer A - overlay ATAS footage (footage kekal nampak)
| Elemen | Peraturan |
|---|---|
| Nombor/fakta | Count-up kecil di sisi (kad mini), tick setiap langkah, hilang bila ayat lepas |
| Label | Teks kecil + **garis nipis (line callout)** menunjuk benda dalam frame, gaya dokumentari |
| Garisan ikut objek | Jejak muka/objek (OpenCV, sampel 0.2 s, smooth) -> hujung garis & cincin sasaran **ikut gerak** objek |
| Kad mini | Kaca separa lut sinar **30-40%**, blur latar, JANGAN tutup muka / skrin penuh |
| Keyword | Kinetic type pop dengan spring (`elastic.out(1,0.62)`), settle lembut; zon atas kepala |
| Latar | Titik/garisan kecil terapung perlahan (yoyo sine, jangan statik) |

## 3. Layer B - babak infografik SKRIN PENUH (tiada muka, suara sahaja)
- Pilih **2-4 bahagian paling sedap** sahaja (~25-35% tempoh video): contoh/kisah, senarai "bukan... tapi...", konsep/data, dalil/ayat. JANGAN jadikan semua bahagian infografik.
- Babak menutup footage sepenuhnya; suara user terus berjalan; subtitle kekal di atas.
- Isi babak: tajuk + eyebrow, ilustrasi/ikon SVG beranimasi ikut perkataan (pop, hilang, coret, carta dilukis, count-up), cip langkah, kad ayat.
- **Bertindak balas dengan raw video** (bukan sekadar tampal):
  1. ~0.25 s sebelum masuk: footage push-in (scale 1.07) + defocus blur 6 px
  2. Babak masuk dengan **wipe geometri** (clip-path serong) seiring jalur wipe + whoosh lembut
  3. Keluar: wipe ke arah sama, footage kembali scale 1 + blur 0 (`power3.out` 0.8 s)
- Latar babak: gradien gelap + grid halus + titik terapung (rupa berubah ikut STYLE-LOG).

## 4. Pencahayaan & "menyatu"
- Tiada glow/neon. Grade: contrast +5-10%, warm neutral, jangan over-saturate.
- Vignette lembut yang ikut muka (highlight subjek sahaja).
- Setiap grafik ada bayang lembut di bawah (`0 8px 22px rgba(0,0,0,.4)`) supaya "duduk" dalam scene.
- Satu accent colour, satu font family untuk infografik.

## 5. Bunyi
- Suara user: jika pecah/terlalu panas -> pemulihan (resemble-enhance) + rantaian podcast (HPF 75 Hz, hangat 180 Hz, potong 380 Hz, presence 3.2 kHz, de-ess, comp 2.5:1, -16 LUFS, limiter -2 dBFS). Sahkan sync.
- Tick halus (count-up), whoosh lembut (transition), pop kecil (teks masuk), **SATU** SFX mark untuk momen paling penting.
- Muzik ambient/lofi ~14 dB bawah suara. **Jangan stack SFX serentak** (generator mesti assert tiada overlap).

## 6. Aliran kerja (Hyperframes)
1. Transkrip -> pilih beat & 2-4 babak skrin penuh -> tulis data masa dalam `tools/generate_index.py`
2. Footage graded H.264 (dibisukan), suara sebagai `<audio>` sendiri
3. Ukur kotak perkataan subtitle dengan font sebenar (`measure_words.cjs`) -> nombor tetap dalam tween
4. `hyperframes check` -> `snapshot` -> semak frame -> **preview draft dulu, jangan render final tanpa izin**

Rujukan pelaksanaan: `infografik/video-projects/bahasa-cinta-allah/` (template.html, generate_index.py, make_audio.py, measure_words.cjs).
