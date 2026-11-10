# Kemas kini masa nyata, format TikTok/YouTube, capture card, Game PC, panel kedua, suara dan bot

## 1. Kemas kini app (masa nyata)
Alur: anda tolak kod ke cabang `main` atau `ccr-*` -> GitHub Actions (`build-windows.yml`) membina pemasang Windows (versi automatik `0.2.<nombor run>`) -> menerbitkan **GitHub Release** (pemasang, `latest.yml`, blockmap, dan salinan `Global-Streamer-Setup.exe`) -> app yang dipasang menyemak Release terkini **setiap 5 minit**, apabila tetingkap difokus semula, dan 8 saat selepas dibuka -> memuat turun di latar -> butang di bar atas bertukar **"Kemas kini X sedia: klik untuk pasang"** -> klik: pasang senyap dan app dibuka semula (jika sedang LIVE, app bertanya dahulu).
* Butang kemas kini sentiasa kelihatan di bar atas (versi semasa; klik = semak sekarang). Tetapan > Kemas kini: semak sekarang / matikan semakan automatik.
* `firebase.json`: `/updates/*` dialihkan ke GitHub Releases (untuk app lama yang masih menyemak `global-streamer.web.app/updates`); pautan muat turun tetap: `https://global-streamer.web.app/download/windows`.
* Jarak masa dari tolak kod hingga app menawarkan kemas kini: binaan ~3 minit + semakan paling lama 5 minit.
* Versi web (`global-streamer.web.app`) dikemas kini melalui `firebase deploy --only hosting`; halaman utama tidak disimpan dalam cache pelayar.
* Pemasang belum ditandatangani (kod): SmartScreen memberi amaran. Pilih "Only for me" semasa memasang supaya kemas kini tidak meminta kata laluan admin.

## 2. Format siaran dan Template
* Bar atas: suis **TikTok (9:16)** / **YouTube · FB (16:9)**. Menukar format serta-merta; susun atur setiap format **disimpan** dan dipulihkan apabila kembali. Ditolak semasa LIVE.
* Dock **Template** (sebelah Audio Mixer): tab TikTok dan YouTube · FB; klik satu template untuk menggunakannya pada scene aktif (peranti video dikekalkan; pengesahan diminta kerana susun atur scene diganti).

## 3. Capture card dan Game PC
* **Capture Card (game)**: hanya peranti capture card (HDMI) disenaraikan. Webcam tidak disenaraikan di sini (guna sumber **Kamera / Webcam**). Pengenalan berdasarkan nama peranti (Elgato, AVerMedia, Cam Link, "USB Video", "HDMI"…). Peranti yang tidak dikenali ada di bahagian "Peranti video lain".
* **Game PC (pilih tetingkap)**: pilih tetingkap tertentu (Steam, game) seperti Window Capture OBS; hanya tetingkap itu disiarkan. Biarkan tetingkap tidak diminimumkan. Tetingkap app ini sendiri disembunyikan daripada senarai.

## 4. Panel Chat/Game/Meta ke skrin kedua
Butang ikon di penjuru tab panel kanan mengeluarkan panel ke tetingkap baharu. Tarik ke skrin/PC kedua. Chat, alert dan kawalan terus hidup. "Masukkan semula ke app", menutup tetingkap, atau butang "Kembalikan" di bar atas memulangkan panel. Saiz/kedudukan tetingkap diingati. Modal (cth Sambungan chat) dibuka dalam tetingkap yang sedang digunakan. Toast makluman muncul di tetingkap utama.

## 5. Suara dan bot (Audio Mixer > Suara & Bot)
* **Efek melalui suara** (tanpa papan kekunci): sebut, atau biarkan game menyebut ("Double Kill", "Victory", "Defeat", "You have been slain"), dan efek keluar. Frasa boleh diubah; "double kill" mengatasi "kill"; jeda 3 s per efek; ketepatan minimum boleh dilaras.
* **Bot**: nama ditetapkan sendiri (cth Jarvis). "Jarvis, siapa noob?" -> bot menjawab daripada senarai soalan/jawapan. Jawapan boleh memakai data game: `{kill} {mati} {assist} {menang} {kalah} {streak} {toppick} {topban} {nama}`. Jawapan dipaparkan pada siaran (gelembung) dan disuarakan; pilihan memasukkan suara bot ke dalam siaran (app Windows).
* Kotak **Uji tanpa suara** menaip frasa untuk memeriksa tetapan tanpa mikrofon.
* Pengecam: **app Windows** = pengecam suara Windows (System.Speech) luar talian melalui PowerShell, disuap daripada saluran Audio Mixer (mikrofon dan/atau bunyi game). Memerlukan pengecam suara Windows (lazimnya English). **Pelayar** = Web Speech API Chrome (mikrofon lalai, perlukan internet).
* Had jujur: kualiti pengecaman bergantung pada pengecam Windows yang dipasang dan bunyi (muzik/letupan game mengurangkan ketepatan). Bahasa Melayu tidak disertakan dalam Windows secara lalai: tulis ejaan sebutan Inggeris sebagai frasa tambahan. Bunyi game dan suara mikrofon yang bertindih tidak dipisahkan. Pengumuman musuh juga boleh mencetuskan efek jika frasa sama disebut.
* Diuji: logik padanan, bot, aliran PCM 16 kHz, protokol proses dan suara bot dengan pengecam/sintesis tiruan (`npm run test:voicehost` + ujian UI). **Belum diuji dengan pengecam suara Windows sebenar dan mikrofon sebenar.**
