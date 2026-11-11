# Prompt sambung kerja (akaun Claude baharu)

Salin semua di bawah garis ini dan tampal sebagai mesej pertama dalam sesi Claude Code baharu.

---

Kamu menyambung projek **Global Streamer** (app Electron untuk live streaming TikTok/Facebook/YouTube, fokus MLBB, UI Bahasa Melayu/Inggeris). Balas dalam **Bahasa Melayu**, ringkas dan terus. Jangan cipta PR melainkan diminta.

## Repo dan pautan
- Kod sumber (peribadi): https://github.com/MediaPekaya/IbnuYazidProject (folder projek: `global-streamer/`). Cabang kerja terkini: `ccr-1ea2e3ea-w1ovs5`. Baca `CLAUDE.md` di akar repo dahulu dan guna skill dalam `.claude/skills/` bila sesuai.
- Repo awam untuk muat turun pelanggan: https://github.com/GeniusDigitalDeveloper/global-streamer-releases-exe-apps
- Pautan muat turun pelanggan (tetap, sentiasa versi terbaru):
  - Pemasang (boleh kemas kini sendiri): https://github.com/GeniusDigitalDeveloper/global-streamer-releases-exe-apps/releases/latest/download/Global-Streamer-Setup.exe
  - Versi zip (tiada kemas kini automatik): https://github.com/GeniusDigitalDeveloper/global-streamer-releases-exe-apps/releases/latest/download/Global-Streamer-Portable.zip
- WhatsApp sokongan: https://wa.me/60177977935?text=GlobalStreamer...%0A(soalan%20anda%3F)
- Panduan pelanggan (HTML siap, logo, ruang video): `global-streamer/docs/panduan-pelanggan/` (`Global-Streamer-Emel-Pelanggan.html` untuk emel, `Halaman-Muat-Turun.html` halaman dengan butang Salin Pautan, `Global-Streamer-Logo.png`).

**Akses yang diperlukan:** akaun GitHub **GeniusDigitalDeveloper** mesti ada akses tulis ke `MediaPekaya/IbnuYazidProject` (jemput sebagai collaborator, atau pasang Claude GitHub App pada kedua-dua repo) dan ke repo releases. Kalau sesi tak boleh baca repo, beritahu saya langkah akses yang perlu dibuat.

## Cara kerja dan keluaran
- Setiap push ke cabang `ccr-*` atau `main` mencetuskan workflow `.github/workflows/build-windows.yml` (Windows). Ia membina pemasang NSIS dan zip, kemudian menerbitkan release ke repo awam di atas melalui secret `RELEASES_REPO_TOKEN` (token akaun GeniusDigitalDeveloper, kebenaran Contents: Read and write pada repo releases). Jangan minta atau tulis nilai token dalam chat atau repo.
- Pelanggan memasang sekali dari pautan di atas. Selepas itu kemas kini datang melalui butang kemas kini di header app (electron-updater, `build.publish` ditetapkan semasa CI ke repo awam).
- Pautan atau fail yang dilihat pelanggan **tidak boleh** menunjukkan nama akaun syarikat "MediaPekaya" atau nombor IC. Pautan muat turun sudah di akaun peribadi GeniusDigitalDeveloper.
- Commit mesti berakhir dengan baris `Co-Authored-By` dan `Claude-Session` seperti yang diberikan sesi.

## Keputusan tetap (jangan ubah tanpa diminta)
- Suara dan Bot ("Suara & Bot") dipaparkan sebagai **AKAN DATANG** (kelabu, sempang merah menyerong); kod AI/STT wujud tetapi dimatikan oleh bendera `COMING_SOON`.
- Pintasan papan kekunci Alt+1 hingga Alt+9 untuk efek kekal. Pengumum bercakap Inggeris (US) sahaja dengan klip terbina dalam (Piper, suara en_US-john). Setiap efek ada bunyi sendiri (kill seram, death "You have been slain", peti untuk fullitem/itemalert, Enemy Slain Alt+9).
- Panel Item dan Emblem bergambar ikut kategori. Senarai Meta tunjuk peratusan kuning sahaja. Sumber "Footer Video" wujud.
- Dialog pengesahan dalam app guna `GS.ask()` (confirm() asli Electron boleh menghalang menaip).
- Ikon `.ico` dijana oleh `scripts/make-icon.py` daripada `build/icon.png` (512 px); had Windows 256 px.
- Ujian: `npm run check`, `npm run check:i18n` (semua teks baharu perlu entri Inggeris dalam `renderer/js/lang-en.js`). `npm run test:tourney` ada dua kegagalan lama yang tiada kaitan ("tukar sisi", "label draft guna nama pasukan").

## Kerja belum selesai
1. **Video tutorial:** pengguna akan beri pautan video. Letakkan dalam `docs/panduan-pelanggan/Global-Streamer-Emel-Pelanggan.html` (ganti `VIDEO_LINK_DI_SINI`) dan `Halaman-Muat-Turun.html`. Halaman Artifact tak boleh membenamkan YouTube; fail mp4 boleh dibenamkan.
2. **Emel pelanggan:** draf Gmail sedia ada ada di akaun lama. Sambung Gmail akaun geniusdigitaldeveloper@gmail.com ke Claude, kemudian cipta semula draf (logo sebagai lampiran inline `cid:att0`; Gmail membuang `background:`, guna `background-color` + `bgcolor` dan butang berasaskan `<td>`).
3. **Laman web (Firebase Hosting):** belum di-deploy. `firebase.json` dan `renderer/site/site.js` sudah menunjuk ke repo awam baharu, tetapi deploy hanya berlaku jika secret `FIREBASE_SERVICE_ACCOUNT` ada, atau pengguna deploy sendiri.
4. **Pembersihan:** padam repo awam lama `MediaPekaya/global-streamer-releases-apps-files` bila pengguna setuju; semak `.claude/skills/SOURCES.md` untuk sebarang sebutan nama pengguna lama.
5. **Belum disahkan pada Windows sebenar:** ketajaman ikon, pemasangan dan kemas kini automatik dari repo baharu, tingkah laku zip. Minta pengguna cuba dan hantar tangkapan skrin.
6. Selepas setiap kemas kini yang ditolak, sahkan release baharu muncul di repo awam (`git ls-remote --tags https://github.com/GeniusDigitalDeveloper/global-streamer-releases-exe-apps`) dan pautan exe memberi 200.

## Maklumat tambahan
- Langganan Claude Pro pengguna kekal pada akaun asal; ada peringatan Google Calendar pada 27 Nov 2026 untuk membatalkannya sebelum pembaharuan 28 Nov 2026.
- Bila selesai satu kerja, ringkaskan hasil dan langkah seterusnya untuk pengguna dalam BM yang mudah.
