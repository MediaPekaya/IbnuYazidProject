# Pelan kerja Global Streamer

| Fasa | Isi | Status |
|---|---|---|
| 1 | Kerangka app, tema hologram, Normal/Studio, scene/sumber, mixer, template, efek, wizard Go Live, input key | ✅ Siap |
| 2 | Siaran sebenar melalui FFmpeg (app Windows): status, statistik, pengekod GPU + sandaran, ujian RTMP sebenar | ✅ Siap dan diuji ke penerima RTMP tempatan. ⏳ Ujian dengan TikTok/Facebook/YouTube sebenar dan GPU sebenar oleh pemilik |
| 2.1 | Sambung semula destinasi terputus, pemilih skrin/tetingkap, log masuk Google dalam app Windows | ⏳ |
| 3 | Chat gabungan sebenar (YouTube, Facebook, TikTok), alert follow/gift | ⏳ |
| 4 | Susun atur menegak 9:16, widget mengikut rujukan (boss, top like, bar status, banner bermaskot, giliran mabar, draft, pemasa spell, tier list, notis item) | ✅ Siap (data manual). ⏳ Lengkapkan dan sahkan data hero/item/emblem |
| 4.5 | Data MLBB sebenar: hero/peranan/lane, item, emblem (Fandom) dan meta tournament (Liquipedia), pemilih hero, cadangan pick/ban/ramalan, widget Meta | ✅ Siap. ⏳ Penyiaran data automatik ke Hosting perlu secret Firebase (lihat README) |
| 5 | Pengesan auto (OCR + padanan imej) daripada capture card (hero draft, kill, item, victory) | ⏳ |
| 6 | Auth, lesen, laman jualan dan muat turun, kemas kini automatik | ⏳ |

## Keputusan reka bentuk
* **Electron** untuk app Windows kerana pelayar tidak boleh menghantar RTMP.
* **Satu pengekodan, banyak destinasi** (FFmpeg tee) supaya ringan.
* **Hero dan panel peribadi** tidak masuk ke kanvas Program.
* **Game sebagai plugin** (`renderer/games/<game>/`) supaya menambah game baharu tidak mengubah sistem utama.
* **Efek dilukis pada kanvas** supaya ia menjadi sebahagian daripada siaran, dan boleh dicetus daripada pengesan kelak (`GS.fx.trigger(nama, parameter)`).

## Antara muka untuk pengesan (Fasa 5)
```js
GS.fx.trigger('kill', { label: 'DOUBLE KILL' });
GS.fx.trigger('victory');                 // menambah W secara automatik
GS.fx.trigger('itembuy', { item: { name: 'Glowing Wand', cat: 'magic' } });
GS.fx.trigger('fullitem', { items: [/* 6 item */] });
```

## Cara ujian siaran sebenar (untuk pemilik)
1. Pasang app Windows (artifak `GlobalStreamer-Windows` dari GitHub Actions) atau jalankan `npm install && npm start`.
2. Sambung capture card pada sumber **Game**, pilih template, masukkan Server URL + Stream Key.
3. **Ujian pertama: gunakan satu platform sahaja, dan set siaran TikTok/Facebook/YouTube kepada peribadi atau "unlisted" jika boleh.**
4. Perhatikan chip statistik di bar atas. Jika kelajuan di bawah 1.0× atau "drop" meningkat, turunkan resolusi/FPS atau pilih pengekod GPU dalam Tetapan.
5. Lapor sebarang ralat bersama mesej yang dipaparkan (key sudah ditapis daripada mesej).
