# Global Streamer

Studio live seperti OBS, dengan template siap, efek skrin dan chat gabungan untuk **TikTok, Facebook dan YouTube**.
Dibina dengan HTML, CSS dan JavaScript vanilla. Untuk **PC dan laptop (Windows)** sahaja.

Tema: biru hologram berkilau, bergradien bercampur merah yang sentiasa bertukar.

## Status (Fasa 1 siap)

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
| Mula Live ke 3 platform | ⚠️ **Mod demo sahaja di web.** Siaran sebenar memerlukan app Windows (kerangka FFmpeg ada, **belum diuji siaran sebenar**) |
| Chat TikTok / Facebook / YouTube sebenar | ⏳ Fasa 3 (antara muka siap, penyambung belum) |
| Pengesan auto kill / item / hero / victory daripada capture card | ⏳ Fasa 5 |
| Analisis tournament MPL/MAL setiap 5 minit, cadangan draft | ⏳ Fasa 5 |
| Log masuk, lesen | ⏳ Auth disediakan oleh pemilik, peraturan Firestore sudah siap |
| Installer Windows (.exe) | ⏳ Aliran GitHub Actions sudah ada, belum diuji |

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
├── scripts/             serve.js (web setempat), check-syntax.js
└── docs/                FIREBASE.md, PELAN.md, REFERENSI-VIDEO.md
```

Tambah game baharu: salin corak `renderer/games/mlbb/` kepada folder baharu, daftar dalam `GS.gameList` dan `GS.games`.

## Keselamatan

* **Stream key tidak pernah disimpan dalam pelayan.** Web: hanya dalam memori tab. App Windows: disulitkan oleh OS (`safeStorage`).
* Hero dan panel peribadi **tidak masuk ke siaran**. Hanya kanvas Program yang dihantar.
* Header CSP, Permissions-Policy dan X-Frame-Options ditetapkan dalam `firebase.json`.

## Had yang perlu diketahui

* Pelayar tidak boleh menghantar RTMP. Itu sebab siaran sebenar memerlukan app Windows.
* TikTok tiada API untuk mencipta siaran. Stream key perlu ditampal manual. Akaun perlu layak LIVE.
* Kelajuan lukisan 1080p60 diukur hanya pada CPU tanpa GPU (≈30 ms/bingkai). **Perlu diuji pada PC sebenar**, terutamanya untuk 4K.
* FFmpeg: semak lesen binari sebelum menjual (guna binaan LGPL jika boleh).
