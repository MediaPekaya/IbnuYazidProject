# Pengesan kejadian: kill, mati, item, victory, defeat

Fail: `renderer/js/events.js` (enjin), `renderer/js/eventsui.js` (tab Game > Auto),
`renderer/data/digits.js` (templat digit HUD), `renderer/data/result-templates.js` (tandatangan skrin keputusan).
Semuanya berjalan dalam pelayar/Electron, tanpa awan dan tanpa model besar. Kos ~10 ms setiap imbasan (2 imbasan sesaat lalai).

## Cara kerja
| Kejadian | Isyarat dibaca | Kaedah |
|---|---|---|
| **Kill / Mati** | nombor K/D/A putih di HUD kanan atas | Setiap digit dipisahkan (ambang adaptif) dan dipadankan dengan templat glif 0-9. Nilai mesti sama dalam 2 imbasan sebelum diterima. Kenaikan K = kill, kenaikan D = mati. Nilai menurun (perlawanan baharu) menetapkan semula garis dasar. |
| **Multi-kill** | masa antara kill | Kill dalam tetingkap (lalai 10 s) dirantai: DOUBLE KILL, TRIPLE KILL, MANIAC, SAVAGE. 3 kill berturut-turut tanpa mati = KILLING SPREE. |
| **Item dibeli** | toast di kanan atas (ikon bulat bercincin emas + nama + harga) | Ikon dipadankan dengan ikon 87 item daripada wiki. Perlu cincin emas, skor, margin dan 3 imbasan berturut-turut. |
| **Item penuh** | pembelian item | Item yang dibeli dikira; komponen resipi digugurkan apabila item gabungan dibeli; 6 item bukan-potion = "ITEM PENUH". Ini **anggaran** (jualan item tidak kelihatan). |
| **Victory / Defeat** | skrin keputusan di tengah | Kawasan tengah dipadankan dengan tandatangan visual (vektor ciri warna, bukan gambar). Perlu 2 imbasan berturut-turut; dikunci sehingga skrin hilang. W/L bertambah automatik. |

Semua kejadian memicu efek yang sama seperti butang manual (Kill, Mati, Beli Item, Item Penuh, Victory, Defeat).
Kawasan ROI ditakrif dalam unit tinggi bingkai dan dilabuhkan kanan/tengah (HUD berskala mengikut tinggi). Kalibrasi X/Y/Skala tersedia.
Skrin keputusan boleh **diajar** (klik butang semasa skrin dipaparkan; disimpan pada PC ini).

## Ketepatan yang diukur (rakaman rujukan sebenar, klien MLBB lama)
| Ujian | Hasil |
|---|---|
| Gameplay 18 minit (1078 bingkai, 1 bingkai/saat) | **7 kill dan 2 mati**, semuanya pada masa yang betul (nilai akhir HUD K7/D2), 0 bacaan menurun, 0 kejadian palsu |
| Kebolehbacaan HUD K/D/A | 623 daripada 1078 bingkai dibaca (selebihnya HUD tersembunyi/dihalang efek; hanya imbasan itu dilangkau) |
| Toast item (disahkan secara visual) | Vitality Crystal, Expert Gloves, Black Ice Shield, Magic Resist Cloak, Vitality Crystal: semua betul, tiada nama salah. Satu toast (Oracle) terlepas pada pensampelan 1 bingkai/saat |
| Aliran 2 imbasan/saat daripada rakaman | kill ~351 s, item Expert Gloves ~384 s, kill ~386 s: tepat, tanpa pendua |
| Skrin VICTORY / DEFEAT | dikesan sebaik teks muncul (skor 0.75-0.98 berbanding negatif maksimum 0.55) |
| 690 bingkai negatif (gameplay, draft, rakaman skrin, TikTok) | 0 Victory/Defeat/item palsu |
| Capture card palsu (masa nyata) | kill, item, Victory, Defeat dikesan; efek dicetus; kiraan W/L bertambah |

## Had yang perlu diketahui
* **Templat digit dan skrin keputusan datang daripada satu klien/skin UI** (rakaman rujukan). Klien semasa, bahasa lain atau tema HUD lain mungkin berbeza. Skrin keputusan boleh diajar; digit HUD K/D/A belum ada pembelajaran (jika bacaan K/D/A tidak muncul, laporkan atau hantar tangkapan skrin).
* Kill dikesan melalui **kenaikan nombor K**, bukan pengumuman banner. K ialah kill hero anda sendiri; jenis "FIRST BLOOD" / "SHUTDOWN" tidak dikesan. Label multi-kill ialah pengiraan masa, bukan bacaan banner game.
* Kelewatan ~1 saat (2 imbasan pengesahan).
* "Item penuh" ialah anggaran daripada toast pembelian; jualan atau item yang tidak memaparkan toast tidak dikira. Boleh ditetapkan semula (Perlawanan baharu).
* Toast item hanya muncul beberapa saat; pembelian yang berlaku semasa HUD ditutup tidak dikesan.
* Belum diuji dengan capture card sebenar.
