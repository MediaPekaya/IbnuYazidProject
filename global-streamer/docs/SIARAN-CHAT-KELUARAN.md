# Fasa 2.1, 3 dan 6: sambung semula, chat sebenar, laman jualan dan kemas kini

## Fasa 2.1: sambung semula destinasi dan pemilih skrin
**Sambung semula** (`main/stream-engine.js`): pengekod utama memancar, selain RTMP ke setiap destinasi, satu salinan FLV ke geganti TCP setempat.
Apabila satu destinasi gagal (RTMP ditolak, terputus), proses FFmpeg tersendiri (`-c copy`) menyambungnya semula daripada geganti dengan jeda 2, 4, 8, 15, kemudian 30 saat.
Pekerja baharu bermula pada **bingkai kunci** (geganti menyimpan pengepala FLV, metadata dan konfigurasi video/audio). Destinasi lain tidak terganggu.
Status dihantar ke UI: `failed` -> `reconnecting` (percubaan, saat seterusnya) -> `live` (recovered). Cip platform bertukar kuning semasa menyambung semula.
Diuji (`npm run test:reconnect`, RTMP tempatan sebenar): A stabil 44 s tanpa gangguan; B dimatikan di tengah siaran lalu dihidupkan semula, menerima H.264 + AAC sah >= 30 s; C belum hidup ketika siaran bermula, disambung automatik >= 22 s; key tidak bocor; semua proses FFmpeg dibersihkan selepas stop.
Nota teknikal: geganti guna FLV, bukan MPEG-TS, kerana `ffmpeg-static` 7.0.2 terhempas (SIGSEGV) membaca MPEG-TS di Linux (diuji dengan fail sintetik).
**Pemilih skrin/tetingkap** (app Windows): tab Skrin / Tetingkap dengan gambar kecil, pilihan dihantar ke proses utama (id disahkan `^(screen|window):\d+:\d+$`), pembatalan dengan Escape. Diuji dalam Electron sebenar.
Belum dibuat: log masuk Google dalam app Windows (log masuk dimatikan atas pilihan anda; lihat docs/FIREBASE.md).

## Fasa 3: chat gabungan dan alert (`renderer/js/chat-adapters.js`)
| Platform | Kaedah | Syarat |
|---|---|---|
| YouTube | **API rasmi** Data API v3: `videos.list` -> `activeLiveChatId`, `liveChat/messages` mengikut `pollingIntervalMillis` dan `nextPageToken`. Teks, Super Chat, ahli baharu. | API key (Google Cloud Console). Kuota harian terhad; ralat kuota/tamat ditangani sebagai ralat tetap. |
| Facebook | **Graph API rasmi**: komen pada video langsung, undian setiap 4 s. | ID video langsung + token akses Halaman (token tamat tempoh). |
| TikTok | **Tiada API rasmi** untuk chat LIVE. Disokong melalui **geganti WebSocket JSON** yang anda jalankan sendiri (chat, gift, like, follow). App tidak membundel atau memanggil protokol tidak rasmi TikTok. | Alat geganti pihak ketiga, atas risiko sendiri. |
Peristiwa dinormalkan dan memicu: panel chat, alert beratur satu demi satu (follow, gift, Super Chat, ahli), serangan boss, kiraan matlamat like dan Top Like. Mesej lama (sebelum disambung) dipaparkan tanpa alert. Sambung semula automatik dengan jeda berperingkat. API key/token hanya dalam memori (web) atau disulitkan OS (Electron), tidak dalam localStorage.
Diuji (`npm run test:chat`, 40 semakan) terhadap pelayan tiruan yang meniru bentuk respons API rasmi, dan UI dengan pelayan tiruan. **Belum diuji dengan akaun, key dan siaran sebenar YouTube/Facebook/TikTok.**

## Fasa 6: laman jualan, muat turun dan kemas kini
* **Laman jualan** `/landing`, **muat turun** `/download`, **privasi** `/privacy`, **terma** `/terms` (`renderer/site/`, dwibahasa BM/EN, mudah alih, tiada skrip luar). Tidak dimasukkan dalam pakej app. Harga tidak ditetapkan ("beta"); privasi/terma ialah ringkasan awal, **dapatkan nasihat undang-undang sebelum menjual**. Tiada tangkapan skrin yang memaparkan seni hero.
* **Kemas kini automatik** (`electron-updater`): suapan `https://global-streamer.web.app/updates/` (`latest.yml` + pemasang). Semak 15 s selepas dibuka dan setiap 6 jam dalam app yang dipasang; banner "Kemas kini sedia: klik untuk pasang"; Tetapan > Kemas kini (versi, semak sekarang, matikan semakan). Diuji dalam Electron dengan suapan tiruan (versi lebih baharu dikesan, banner, status). **Muat turun dan pasang kemas kini belum diuji pada Windows sebenar.**
* **Keluaran**: tag `gs-v*` -> `build-windows.yml` membina pemasang, menjalankan `npm run release:stage` (menyalin pemasang + `latest.yml` ke `renderer/updates/` dan menjana `latest.json` dengan SHA-256), menerbitkan GitHub Release, dan deploy ke Hosting jika secret `FIREBASE_SERVICE_ACCOUNT` ada. Tanpa secret: jalankan `npm run dist && npm run release:stage` kemudian `firebase deploy --only hosting`.
* Pemasang belum ditandatangani (kod): Windows SmartScreen akan memberi amaran. Sijil tandatangan kod perlu dibeli.
* Lesen/log masuk: kod dan peraturan Firestore sedia (`requireLicense`) tetapi **dimatikan** mengikut pilihan anda (app terus boleh guna tanpa daftar). Semakan lesen sisi klien hanya menghalang penggunaan biasa (lihat docs/FIREBASE.md).
