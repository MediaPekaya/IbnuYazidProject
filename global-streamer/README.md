# Global Streamer

Studio live seperti OBS, dengan template siap, efek skrin dan chat gabungan untuk **TikTok, Facebook dan YouTube**.
Dibina dengan HTML, CSS dan JavaScript vanilla. Untuk **PC dan laptop (Windows)** sahaja.

Tema: biru hologram berkilau, bergradien bercampur merah yang sentiasa bertukar.

## Status (Fasa 1 dan 2 siap)

| Bahagian | Status |
|---|---|
| Antara muka studio (Normal / Studio), scene, sumber, sifat, seret dan ubah saiz pada kanvas | ✅ Siap, diuji dalam pelayar |
| Capture card / kamera / kongsi skrin sebagai sumber | ✅ Siap (diuji dengan peranti palsu; **belum dengan capture card sebenar**) |
| Audio mixer (meter, kelantangan, bisu, banyak input) | ✅ Siap (diuji dengan mikrofon palsu) |
| 3 template MLBB siap + aliran "Sediakan Live" 4 langkah | ✅ Siap |
| Widget: jam, masa main, menang/kalah, logo, bar teks, bingkai | ✅ Siap |
| Efek: Kill (api), Mati (petir), Victory, Defeat, Item Penuh, Beli Item | ✅ Siap, dicetus manual atau Alt+1…6 |
| Rakaman tempatan (WebM) | ✅ Siap |
| Input Server URL + Stream Key (TikTok, Facebook, YouTube, RTMP lain) | ✅ Siap |
| Mula Live ke banyak platform serentak (app Windows) | ✅ **Diuji hujung ke hujung** dengan app Electron sebenar dan penerima RTMP sebenar tempatan: H.264 + AAC diterima serentak oleh 2 destinasi. Versi web ialah mod demo (pelayar tidak boleh hantar RTMP). |
| Status setiap platform, statistik (fps, kelajuan pengekodan, bingkai dilepaskan), amaran pengekod perlahan | ✅ Siap |
| Pengekod perkakasan NVENC / Quick Sync / AMF dengan sandaran automatik ke CPU | ✅ Logik sandaran diuji. **NVENC/QSV/AMF sebenar belum diuji (tiada GPU di persekitaran ujian).** |
| Key disulitkan pada PC (Windows DPAPI) | ⚠️ Kod siap. **Belum diuji pada Windows** (persekitaran ujian Linux tiada keyring). |
| **Siaran sebenar ke TikTok / Facebook / YouTube dengan key sebenar** | ⚠️ **Belum diuji.** Hanya diuji ke penerima RTMP tempatan. |
| Chat TikTok / Facebook / YouTube sebenar | ⏳ Fasa 3 (antara muka siap, penyambung belum) |
| Pengesan auto kill / item / hero / victory daripada capture card | ⏳ Fasa 5 |
| Analisis tournament MPL/MAL setiap 5 minit, cadangan draft | ⏳ Fasa 5 |
| Log masuk (Google / emel), profil, peranan admin, semakan lesen | ✅ Siap di web (diuji dengan SDK tiruan; log masuk sebenar oleh pemilik). App Windows: emel + kata laluan sahaja buat masa ini. |
| Installer Windows (.exe) | ⏳ Dibina oleh GitHub Actions pada setiap push (lihat tab Actions). Belum dipasang pada PC Windows sebenar. |

Data hero/item/emblem MLBB ialah **dataset awal** dan perlu disahkan mengikut patch semasa.

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
│   └── games/mlbb/      heroes.js, items.js, game.js (template + efek)
├── main/                app Windows (Electron): main.js, preload.js, stream-engine.js
├── firebase/            firestore.rules, firestore.indexes.json
├── firebase.json        Hosting + Firestore
├── scripts/             serve.js (web setempat), check-syntax.js, test-engine.js (ujian siaran RTMP sebenar)
└── docs/                FIREBASE.md, PELAN.md, REFERENSI-VIDEO.md
```

Tambah game baharu: salin corak `renderer/games/mlbb/` kepada folder baharu, daftar dalam `GS.gameList` dan `GS.games`.

## Keselamatan

* **Stream key tidak pernah disimpan dalam pelayan.** Web: hanya dalam memori tab. App Windows: disulitkan oleh OS (`safeStorage`).
* Hero dan panel peribadi **tidak masuk ke siaran**. Hanya kanvas Program yang dihantar.
* Header CSP, Permissions-Policy dan X-Frame-Options ditetapkan dalam `firebase.json`.

## Had yang perlu diketahui

* Pelayar tidak boleh menghantar RTMP. Itu sebab siaran sebenar memerlukan app Windows.
* Destinasi yang terputus semasa siaran **tidak disambung semula secara automatik** (ditanda merah). Sambung semula perlu mulakan siaran semula. Cadangan Fasa 2.1.
* FFmpeg yang dibundel ialah binaan **GPLv3**. Lihat `THIRD-PARTY-NOTICES.md` dan dapatkan nasihat undang-undang sebelum menjual.
* TikTok tiada API untuk mencipta siaran. Stream key perlu ditampal manual. Akaun perlu layak LIVE.
* Kelajuan lukisan 1080p60 diukur hanya pada CPU tanpa GPU (≈30 ms/bingkai). **Perlu diuji pada PC sebenar**, terutamanya untuk 4K.
