# Pelan kerja Global Streamer

| Fasa | Isi | Status |
|---|---|---|
| 1 | Kerangka app, tema hologram, Normal/Studio, scene/sumber, mixer, template, efek, wizard Go Live, input key | ✅ Siap |
| 2 | Siaran sebenar ke 3 platform melalui FFmpeg (app Windows), installer .exe | ⏳ Kerangka ada, perlu ujian dengan PC dan key sebenar |
| 3 | Chat gabungan sebenar (YouTube, Facebook, TikTok), alert follow/gift | ⏳ |
| 4 | Lengkapkan data MLBB (hero, item, emblem), efek mengikut rujukan video, widget tambahan (boss game, giliran mabar, tier list) | ⏳ |
| 5 | Pengesan auto (OCR + padanan imej) daripada capture card, tournament setiap 5 minit, cadangan draft | ⏳ |
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
