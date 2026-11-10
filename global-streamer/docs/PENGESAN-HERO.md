# Pengesan hero automatik (draft)

Membaca skrin draft MLBB daripada capture card dan mengisi ally, enemy dan ban secara automatik.
Fail: `renderer/js/detect.js` (enjin), `renderer/js/detectui.js` (panel dalam tab Game > Draft).

## Cara kerja
1. Bingkai daripada sumber **Game (capture card)** diambil setiap 0.5 / 1 / 2 saat.
2. 20 kawasan (ROI) dipotong: 5 potret ally (kiri), 5 potret enemy (kanan), 5 ban kiri, 5 ban kanan. Kawasan ditakrif dalam **unit tinggi bingkai** dan dilabuhkan pada tepi kiri/kanan kerana HUD MLBB berskala mengikut tinggi skrin; satu pratetap berfungsi untuk pelbagai nisbah aspek.
3. Setiap potongan dibandingkan dengan ikon semua 133 hero (padanan warna berpemberat tengah + histogram hue, dengan beberapa varian zoom/anjakan ikon). Sepenuhnya dalam pelayar, tiada awan, tiada model besar.
4. Setiap hero hanya boleh berada di satu slot. Slot diterima jika keyakinan melepasi ambang (ban: ambang kepekaan; pick: lebih ketat).
5. **Pintu skrin draft**: perlu sekurang-kurangnya 2 slot "kuat" (skor >= 0.72 dan margin >= 0.1) dan 3 slot diterima, supaya gameplay/skrin keputusan/video lain tidak disalah anggap sebagai draft.
6. Hasil mesti stabil beberapa imbasan (3 untuk slot kosong, 6 untuk menukar hero sedia ada) sebelum ditulis ke draft.
7. Selepas commit: widget Draft dipaparkan (pilihan), fasa dikemas kini, ramalan menang dikira daripada meta, cadangan pick/ban dikira semula.

## Pembetulan dan pembelajaran
* Setiap kad slot menunjukkan 3 cadangan teratas. Klik satu untuk membetulkan slot dan **mengajar sistem**: potongan itu disimpan sebagai templat tambahan bagi hero tersebut (terkuantiti, ~1 KB setiap templat, maks 6 setiap hero, dalam `localStorage` pada PC ini). Selepas diajar, potret yang sama dikenali dengan skor ~1.0 walaupun bingkai berskala berbeza.
* Slot yang anda isi atau betulkan sendiri **dikunci** (tidak ditimpa pengesan). "Buka kunci semua slot" atau "Draft baharu" melepaskannya.
* **Kalibrasi**: jika peranti anda berbeza, laraskan X/Y/Skala setiap kumpulan sambil melihat pratonton kotak ROI.
* **Uji dengan imej**: muatkan tangkapan skrin draft untuk menyemak tanpa game berjalan.

## Ketepatan yang diukur (rakaman rujukan sebenar `draftpick.mp4`, klien MLBB lama, 1280x588)
Diuji dengan memainkan semula rakaman melalui pengesan, dan juga melalui sumber capture card palsu secara masa nyata (Chromium `--use-file-for-fake-video-capture`):

| Ujian | Hasil |
|---|---|
| Draft dikesan daripada capture card (masa nyata) | dalam ~5 saat dari permulaan ban |
| Ban (ikon bulat, seni sama dengan ikon wiki) | 6 daripada 6 ban yang kelihatan betul: Harley, Estes, Yi Sun-shin, Ixia, Atlas, Sun (skor 0.7-0.9) |
| Pick (potret besar) | hanya 3 diterima secara automatik pada ambang lalai (Hanabi, Vexana, Johnson); pick lain tidak diterima dan ditawarkan sebagai cadangan untuk dibetulkan sekali klik |
| Bingkai bukan-draft (gameplay, keputusan, TikTok, rakaman skrin: 108 bingkai) | 0 bingkai disalah anggap draft, 0 hero palsu ditulis |
| Selepas diajar (skin Layla) | skor 1.0, kekal selepas muat semula halaman |
| Kos imbasan | ~45 ms untuk 20 slot (~4% CPU pada 1 imbasan/saat) |

### Had yang perlu diketahui
* **Potret pick dalam game ialah seni/skin yang berbeza daripada ikon wiki.** Pada rakaman rujukan (klien lama), kebanyakan pick tidak cukup yakin untuk diterima automatik. Ban lebih tepat kerana ia ikon bulat yang sama seni dengan wiki. Pada klien semasa kadar padanan mungkin berbeza; belum dapat diukur kerana tiada rakaman klien semasa.
* Ambang pick sengaja ketat (ketepatan diutamakan; hero salah di siaran lebih buruk daripada slot kosong). Naikkan "Kepekaan" jika mahu lebih banyak diterima.
* Hero yang berbeza skin boleh memerlukan diajar sekali setiap skin.
* Pratetap ROI diukur daripada satu rakaman (susun atur draft Ranked). Mod lain (Brawl, Custom, tournament) mungkin berbeza susun atur: guna kalibrasi.
* Belum diuji dengan capture card sebenar, dan belum ada pengesan kill / item / victory-defeat automatik (itu kekal Fasa 5 berikutnya).
