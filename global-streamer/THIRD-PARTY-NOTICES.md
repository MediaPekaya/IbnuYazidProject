# Notis perisian pihak ketiga

Global Streamer menyertakan atau menggunakan perisian pihak ketiga berikut. Notis ini mesti disertakan bersama setiap salinan yang diedarkan.

## FFmpeg (binari dibundel melalui `ffmpeg-static`)

* Digunakan untuk mengekod video/audio dan menghantar siaran RTMP. Dijalankan sebagai **proses berasingan** (baris arahan), bukan dipautkan ke kod Global Streamer.
* Binari yang dibundel ialah binaan **GNU GPL versi 3** (mengandungi libx264 dan lain-lain). Teks lesen penuh ada dalam folder aplikasi: `resources/app.asar.unpacked/node_modules/ffmpeg-static/ffmpeg.LICENSE` dan `LICENSE`.
* Kod sumber FFmpeg: https://ffmpeg.org/download.html. Kod sumber binaan yang digunakan: https://github.com/eugeneware/ffmpeg-static (pembungkus) dan pautan binaan yang tertera dalam `ffmpeg.README` di folder yang sama.
* Anda berhak mendapatkan kod sumber binaan ini. Hubungi penerbit aplikasi untuk salinan.
* FFmpeg ialah tanda dagangan Fabrice Bellard. Global Streamer tidak berkaitan dengan projek FFmpeg.

## Electron

* MIT. © GitHub Inc. dan penyumbang. Menyertakan Chromium (BSD dan lesen lain) dan Node.js (MIT). Lihat `LICENSES.chromium.html` dalam folder aplikasi.

## Firebase SDK (dimuat dari CDN Google dalam versi web)

* Apache 2.0. © Google LLC.

## Fon

* **Bangers** (c) 2010 The Bangers Project Authors, dilesenkan di bawah SIL Open Font License 1.1 (renderer/assets/fonts/OFL-Bangers.txt). Digunakan untuk gelembung bot gaya komik.

## Nota

* Penggunaan pengekod H.264 secara komersial mungkin tertakluk kepada hak paten di sesetengah negara. Dapatkan nasihat undang-undang sebelum menjual.
* Mobile Legends: Bang Bang dan nama/jenama hero, item dan lain-lain ialah milik Moonton. Global Streamer ialah alat tidak rasmi dan tiada kaitan dengan Moonton.

## Klip suara pengumum
Suara pengumum Inggeris US (build/announcer, renderer/data/announcer-clips.js) dijana dengan Piper TTS (MIT, https://github.com/rhasspy/piper) menggunakan model en_US-john-medium, dilatih daripada rakaman LibriVox domain awam. Boleh diedarkan secara komersial.

## Penapis bunyi latar rakaman
- RNNoise (Xiph.Org Foundation, BSD-3-Clause) dan @sapphi-red/web-noise-suppressor (MIT, sapphi-red), dibenamkan dalam `renderer/vendor/noise/` (lesen: `LICENSE-web-noise-suppressor.txt`).
