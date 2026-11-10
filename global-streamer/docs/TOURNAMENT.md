# Tournament automatik

Fail: `scripts/data/collect-matches.js`, `collect-tournaments.js`, `collect-meta.js` (penemuan), `renderer/js/tourney.js`, `tourneyui.js`,
widget `matchboard` dan `resultsboard` (dalam `widgets2.js`), tab Game > Turnamen.
Sumber: [Liquipedia Mobile Legends](https://liquipedia.net/mobilelegends), CC-BY-SA 3.0, melalui MediaWiki API awam dengan User-Agent jelas dan jeda mengikut had kadar mereka.

## Apa yang dibuat secara automatik
| Fungsi | Cara |
|---|---|
| **Penemuan tournament** | `collect-matches.js` membaca halaman `Liquipedia:Matches` (1 panggilan) dan mengenal pasti tournament pro (MPL, MSC, M-series). Halaman statistik setiap peringkat ditemui dengan menyisip `/Statistics/` dan disahkan wujud melalui API, kemudian ditambah ke senarai meta tanpa edit tangan (cth musim S19 akan ditemui sendiri). |
| **Perlawanan semasa** | Dipilih daripada jadual mengikut jam PC: sedang berlangsung, kemudian yang bermula dalam 90 minit, kemudian yang baru tamat (3 jam). Boleh disematkan secara manual. |
| **Skor, jadual, keputusan** | Skor langsung, Bo, masa (waktu tempatan), kiraan detik, keputusan terkini. |
| **Pemenang** | `collect-tournaments.js` membaca halaman utama tournament: tarikh, hadiah, kedudukan akhir (juara, naib juara, tempat ketiga/keempat) dan pasukan yang layak ke M8. Hanya tournament yang sudah tamat dan bukan TBD dipaparkan sebagai juara. |
| **Nama pasukan pada draft** | Pilihan: widget Draft menggantikan ALLY/ENEMY dengan nama pasukan perlawanan semasa (boleh tukar sisi). |
| **Widget siaran** | "Perlawanan Tournament" (pasukan, skor, LIVE / MULA dalam / TAMAT, Bo) dan "Keputusan Tournament" (juara terkini + 5 keputusan terakhir). |
| **Statistik hero** | Tournament yang sedang berlangsung diambil semula oleh `collect-meta.js` dan masuk ke meta pick/ban/kadar menang (lihat docs/ANALISIS-MLBB.md). |

## Kekerapan kemas kini (jujur)
* App menyemak `data/matches.json` setiap **5 minit**. Fail itu hanya berubah apabila pengumpul dijalankan.
* `.github/workflows/matches-sync.yml` mengumpul perlawanan setiap **30 minit**, dan `meta-sync.yml` mengumpul statistik, maklumat tournament dan pemenang setiap **jam**. Kedua-duanya berjalan **hanya pada cabang lalai repo** dan menyiarkan ke Hosting hanya jika secret `FIREBASE_SERVICE_ACCOUNT` ditetapkan. Tanpa itu data di-commit tetapi perlu di-deploy.
* Skor langsung oleh itu lewat beberapa minit hingga 30 minit berbanding siaran sebenar. Untuk kemas kini 5 minit sebenar perlukan penjadual luar atau pelan berbayar.
* App tidak memanggil Liquipedia terus kerana had kadar mereka (satu parse setiap 30 saat) dan supaya tidak ramai klien membebankan mereka.

## Ujian
`npm run test:tourney`: penghurai perlawanan, penghurai maklumat tournament, penemuan, logik pemilihan perlawanan semasa (jam palsu), pin, penapis, countdown, label pasukan dan juara.
UI diuji dengan jam dipalsukan: 20 minit sebelum perlawanan (kad "Mula dalam", widget), perlawanan sedang berlangsung (LIVE), sematan final NAVI 3:4 BTR (TAMAT), kedua-dua bahasa.

## Had
* Tiada pengesanan nama pasukan daripada video (OCR). Perlawanan semasa datang daripada jadual, jadi jika streamer menyiarkan perlawanan lain (bukan yang dipilih automatik), sematkan perlawanan itu secara manual.
* Liquipedia mungkin mengemas kini skor dengan sedikit kelewatan dan halaman boleh berubah struktur; penghurai diuji pada struktur semasa.
* Siri bukan-pro (cth liga lain) tersedia melalui penapis "Semua tournament" tetapi tidak dimasukkan dalam statistik meta.
* Kedudukan/jadual kumpulan (standings) belum diparse; hanya keputusan perlawanan dan kedudukan akhir.
