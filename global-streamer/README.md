# Global Streamer

Studio live seperti OBS, dengan template siap, efek skrin dan chat gabungan untuk **TikTok, Facebook dan YouTube**.
**Terus boleh guna tanpa daftar atau log masuk.**
Dibina dengan HTML, CSS dan JavaScript vanilla. Untuk **PC dan laptop (Windows)** sahaja.

Tema: biru hologram berkilau, bergradien bercampur merah yang sentiasa bertukar.

## Status (Fasa 1 dan 2 siap)

| Bahagian | Status |
|---|---|
| Antara muka studio (Normal / Studio), scene, sumber, sifat, seret dan ubah saiz pada kanvas | ✅ Siap, diuji dalam pelayar |
| Capture card / kamera / kongsi skrin sebagai sumber | ✅ Siap (diuji dengan peranti palsu; **belum dengan capture card sebenar**) |
| Audio mixer (meter, kelantangan, bisu, banyak input) | ✅ Siap (diuji dengan mikrofon palsu) |
| **Susun atur MENEGAK 9:16 untuk TikTok LIVE** (lalai) dan mendatar 16:9 untuk YouTube/Facebook, boleh ditukar | ✅ Siap |
| 6 template MLBB siap (3 menegak, 3 mendatar) + aliran "Sediakan Live" 4 langkah | ✅ Siap |
| Widget siaran: bar status, boss game, top like, banner promosi bermaskot, giliran mabar, label peranti, W/L, banner hadiah, draft, pemasa spell, tier list, notis item | ✅ Siap (data diisi manual; panel kawalan dalam tab Game) |
| Widget: jam, masa main, menang/kalah, logo, bar teks, bingkai | ✅ Siap |
| Efek: Kill (api), Mati (petir), Victory, Defeat, Item Penuh, Beli Item | ✅ Siap, dicetus manual atau Alt+1…6 |
| Rakaman tempatan (WebM) | ✅ Siap |
| **Dwibahasa BM / English** (antara muka dan teks overlay siaran, boleh dipilih berasingan) | ✅ Siap, diuji. Lalai BM, pilihan diingati. |
| Input Server URL + Stream Key (TikTok, Facebook, YouTube, RTMP lain) | ✅ Siap |
| Mula Live ke banyak platform serentak (app Windows) | ✅ **Diuji hujung ke hujung** dengan app Electron sebenar dan penerima RTMP sebenar tempatan: H.264 + AAC diterima serentak oleh 2 destinasi. Versi web ialah mod demo (pelayar tidak boleh hantar RTMP). |
| Status setiap platform, statistik (fps, kelajuan pengekodan, bingkai dilepaskan), amaran pengekod perlahan | ✅ Siap |
| Pengekod perkakasan NVENC / Quick Sync / AMF dengan sandaran automatik ke CPU | ✅ Logik sandaran diuji. **NVENC/QSV/AMF sebenar belum diuji (tiada GPU di persekitaran ujian).** |
| Key disulitkan pada PC (Windows DPAPI) | ⚠️ Kod siap. **Belum diuji pada Windows** (persekitaran ujian Linux tiada keyring). |
| **Siaran sebenar ke TikTok / Facebook / YouTube dengan key sebenar** | ⚠️ **Belum diuji.** Hanya diuji ke penerima RTMP tempatan. |
| Chat TikTok / Facebook / YouTube sebenar | ⏳ Fasa 3 (antara muka siap, penyambung belum) |
| **Pengesan hero draft automatik** daripada capture card (ally, enemy, ban; kalibrasi, pembetulan sekali klik, pembelajaran) | ✅ Siap dan diuji pada rakaman draft sebenar (ban tepat, pick separa, 0 salah pada 108 bingkai bukan-draft). Lihat `docs/PENGESAN-HERO.md` untuk ketepatan dan had. Belum diuji dengan capture card sebenar. |
| **Pengesan kejadian automatik**: kill, mati, multi-kill, item dibeli, item penuh, victory, defeat daripada capture card | ✅ Siap dan diuji pada rakaman gameplay sebenar (7 kill/2 mati tepat, 5 item betul, Victory/Defeat dikesan, 0 palsu pada 690 bingkai negatif). Lihat `docs/PENGESAN-KEJADIAN.md`. Templat daripada satu klien/skin UI; belum diuji dengan capture card sebenar. |
| **Tournament automatik**: penemuan tournament, perlawanan semasa daripada jadual, skor/keputusan, juara dan kelayakan, widget papan perlawanan/keputusan, nama pasukan pada draft | ✅ Siap dan diuji (jam palsu). Data daripada pengumpul pusat (Liquipedia): skor langsung lewat sehingga ~30 minit. Lihat `docs/TOURNAMENT.md`. |
| **Sambung semula destinasi terputus** (geganti FLV + pekerja FFmpeg, jeda 2-30 s, destinasi lain tidak terganggu) dan **pemilih skrin/tetingkap** | ✅ Diuji dengan RTMP dan Electron sebenar. Lihat `docs/SIARAN-CHAT-KELUARAN.md` |
| **Chat sebenar**: YouTube (API rasmi), Facebook (Graph API rasmi), TikTok (melalui geganti WebSocket kerana tiada API rasmi); alert Super Chat/gift/follow/ahli, boss dan Top Like | ✅ Diuji dengan pelayan tiruan. ⏳ Belum diuji dengan key dan siaran sebenar |
| **Laman jualan, muat turun, privasi, terma** (`/landing`, `/download`) dan **kemas kini automatik** (electron-updater) | ✅ Siap. ⏳ Pemasang tidak ditandatangani; pasang/kemas kini belum diuji pada Windows sebenar; harga belum ditetapkan |
| Analisis tournament MPL/MAL setiap 5 minit, cadangan draft | ⏳ Fasa 5 |
| Log masuk (Google / emel), profil, peranan admin, semakan lesen | ⏸ **Dimatikan lalai** (`authEnabled: false`): app terus boleh guna tanpa daftar. Kod dan peraturan Firestore sedia jika mahu dihidupkan semula. |
| Installer Windows (.exe) | ⏳ Dibina oleh GitHub Actions pada setiap push (lihat tab Actions). Belum dipasang pada PC Windows sebenar. |

| **Data MLBB sedia ada (tiada isi manual)**: 133 hero dengan peranan, spesialiti dan lane, 105 item (harga, stat, pasif, resipi), 7 set emblem (atribut, talent) | ✅ Dikumpul daripada Mobile Legends Wiki (CC-BY-SA). Hero terbaharu: Hirara. |
| **Meta tournament**: top pick, top ban, kadar menang, kehadiran, sisi biru/merah, padanan dan counter (MPL ID/MY/PH S18, MSC 2026, M7 sebagai sejarah) | ✅ Dikumpul daripada Liquipedia (CC-BY-SA). App menyemak data setiap 5 minit; **data itu sendiri dikemas kini oleh pengumpul pusat (lihat bawah)** |
| Cadangan pick / ban / ramalan menang berdasarkan meta, penapis lane, tier list daripada meta, widget "Meta Tournament" | ✅ Siap, diuji. Pengiraan statistik yang boleh dijelaskan, bukan jaminan menang. |

| **Gambar karakter hero** (panel Hero, pemilih draft, cadangan, widget Draft, Meta Tournament dan Tier List) | ✅ Dimuat pada PC pengguna daripada CDN Mobile Legends Wiki, **tidak dibundel dalam repo atau installer** (seni karya Moonton). Jika luar talian dan belum dicache, jatuh balik kepada inisial. Kanvas siaran tidak tercemar (CORS diuji). |

Lihat `docs/ANALISIS-MLBB.md` untuk laporan data (jadual peranan, lane, item, emblem dan meta). Data hero/item/emblem ialah salinan wiki pada tarikh dikumpul; jalankan semula `npm run data:mlbb` selepas patch baharu.

## Cuba versi web (setempat)

```bash
cd global-streamer
npm run web        # buka http://localhost:8123
```

Atau buka folder `renderer/` melalui mana-mana pelayan statik.
Pelayar akan minta kebenaran kamera/mikrofon. Pilih capture card pada sumber **Game**.

## Struktur folder

```
global-streamer/
├── renderer/            antara muka (juga folder yang di-deploy ke Firebase Hosting)
│   ├── index.html
│   ├── css/             theme.css, layout.css, components.css
│   ├── js/              core, audio, media, widgets, effects, compositor,
│   │                    scenes, platforms, chat, gamedock, golive, app
│   ├── data/            mlbb-static.json, meta.json (+ mlbb-data.js, meta-data.js: salinan dibundel untuk app)
│   └── games/mlbb/      heroes.js, items.js, game.js (template + efek)
├── main/                app Windows (Electron): main.js, preload.js, stream-engine.js
├── firebase/            firestore.rules, firestore.indexes.json
├── firebase.json        Hosting + Firestore
├── scripts/             serve.js (web setempat), check-syntax.js, test-engine.js (ujian siaran RTMP sebenar), test-data.js (ujian data & enjin meta)
│   └── data/            pengumpul: collect-mlbb.js (Fandom), collect-meta.js (Liquipedia), build-bundle.js, report.js, tournaments.json
└── docs/                FIREBASE.md, PELAN.md, REFERENSI-VIDEO.md, BAHASA.md
```

Tambah game baharu: salin corak `renderer/games/mlbb/` kepada folder baharu, daftar dalam `GS.gameList` dan `GS.games`.

## Keselamatan

* **Stream key tidak pernah disimpan dalam pelayan.** Web: hanya dalam memori tab. App Windows: disulitkan oleh OS (`safeStorage`).
* Panel hero/meta/draft peribadi **tidak masuk ke siaran**. Hanya kanvas Program yang dihantar; widget Draft dan Meta Tournament hanya dipaparkan jika anda menghidupkannya.
* Header CSP, Permissions-Policy dan X-Frame-Options ditetapkan dalam `firebase.json`.

## Data tournament: cara kemas kini sebenar

* App **tidak** memanggil Liquipedia terus (mereka mengehadkan kadar dan melarang polling oleh ramai klien). Pengumpul pusat (`scripts/data/collect-meta.js`) mengambil satu halaman setiap ~30 saat, menjana `renderer/data/meta.json`, dan app menyemak fail itu setiap 5 minit.
* Pengumpul dijalankan oleh GitHub Actions (`.github/workflows/meta-sync.yml`, setiap jam, pada cabang lalai) dan boleh dicetus manual. Untuk menyiarkan ke Hosting secara automatik, tambah secret `FIREBASE_SERVICE_ACCOUNT`; tanpanya data hanya di-commit dan perlu di-deploy.
* Statistik hanya berubah selepas game tamat, jadi kekerapan 5 minit hanya bermakna ketika tournament sedang berlangsung. Kelewatan sebenar = kekerapan pengumpul + kelewatan Liquipedia mengemas kini jadual mereka.
* Liquipedia memaparkan hanya 5 teratas untuk padanan/lawan setiap hero, jadi pengiraan counter/padanan separa.
* Pengesanan hero draft automatik daripada capture card belum siap (Fasa 5). Buat masa ini hero dimasukkan melalui pemilih hero (penapis peranan/lane), dan cadangan/ramalan dikira serta-merta.

## Gambar hero: nota hak cipta

Gambar hero ialah hak Moonton. Ia **tidak** disimpan dalam repo dan tidak dimasukkan dalam installer; app memuatnya terus daripada CDN wiki pada PC pengguna (`js/heroimg.js`). Sebelum menjual, dapatkan nasihat undang-undang tentang penggunaan gambar hero dalam produk berbayar dan ikuti dasar kandungan Moonton. Jika mahu mematikannya, kosongkan medan `img` dalam `renderer/data/mlbb-static.json` (paparan jatuh balik kepada inisial).

## Had yang perlu diketahui

* Pelayar tidak boleh menghantar RTMP. Itu sebab siaran sebenar memerlukan app Windows.
* Destinasi yang terputus semasa siaran **tidak disambung semula secara automatik** (ditanda merah). Sambung semula perlu mulakan siaran semula. Cadangan Fasa 2.1.
* FFmpeg yang dibundel ialah binaan **GPLv3**. Lihat `THIRD-PARTY-NOTICES.md` dan dapatkan nasihat undang-undang sebelum menjual.
* TikTok tiada API untuk mencipta siaran. Stream key perlu ditampal manual. Akaun perlu layak LIVE.
* Kelajuan lukisan 1080p60 diukur hanya pada CPU tanpa GPU (≈30 ms/bingkai). **Perlu diuji pada PC sebenar**, terutamanya untuk 4K.
