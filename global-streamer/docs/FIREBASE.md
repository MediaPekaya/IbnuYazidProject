# Firebase (pelan percuma Spark)

Hanya perkhidmatan percuma digunakan: **Hosting**, **Firestore** dan (esok) **Authentication**.
Jangan hidupkan Cloud Functions atau Cloud Storage kerana ia boleh memerlukan pelan berbayar.

## Akaun
Projek dicipta di bawah akaun Google **mediapc2026@gmail.com**.

## Fail
| Fail | Fungsi |
|---|---|
| `firebase.json` | Hosting (`renderer/`), header keselamatan, rujukan rules Firestore |
| `firebase/firestore.rules` | Peraturan Firestore: tolak semua kecuali data milik pengguna sendiri |
| `firebase/firestore.indexes.json` | Indeks (kosong buat masa ini) |

## Model data
| Laluan | Baca | Tulis |
|---|---|---|
| `users/{uid}` | pemilik | pemilik (medan terhad dan saiz dihadkan) |
| `users/{uid}/templates/{id}` | pemilik | pemilik |
| `licenses/{uid}` | pemilik | **tiada klien**: pentadbir sahaja (Console / Admin SDK) |
| `meta/{doc}` | pengguna log masuk | **tiada klien**: pentadbir sahaja |
| selain itu | tutup | tutup |

Contoh dokumen lesen (cipta melalui Firebase Console, koleksi `licenses`, ID dokumen = UID pengguna):

```json
{ "active": true, "plan": "pro", "expiresAt": "2027-12-31T00:00:00Z", "maxDevices": 1 }
```

## Kuota percuma (rujukan: pelan Spark)
Firestore: 50,000 bacaan, 20,000 tulisan, 20,000 padam sehari dan 1 GiB simpanan. Hosting: 10 GB simpanan dan sekitar 360 MB/hari trafik.
Nilai ini boleh berubah, semak halaman harga Firebase. Data tournament (setiap 5 minit) sebaiknya dihidang sebagai fail JSON statik di Hosting supaya tidak menggunakan bacaan Firestore.

## Esok: menghidupkan Authentication
1. Firebase Console > Build > Authentication > Get started.
2. Hidupkan **Google** (dan Email/Password jika mahu).
3. Authentication > Settings > Authorized domains: pastikan domain Hosting ada.
4. Salin config web app (Project settings > Your apps > Web) dan hantar kepada saya untuk disambungkan ke antara muka.

Header CSP dalam `firebase.json` sudah membenarkan `www.gstatic.com`, `*.googleapis.com` dan `*.firebaseapp.com` untuk SDK dan log masuk.

## Lesen: had sebenar
Tanpa Cloud Functions, semakan lesen dibuat dalam klien (membaca `licenses/{uid}`). Kod klien boleh dibongkar oleh pengguna mahir, jadi ia menghalang kegunaan biasa tetapi bukan pembajakan bersungguh-sungguh. Perlindungan lebih kuat memerlukan pelayan (Cloud Functions Blaze, atau alternatif percuma seperti Cloudflare Workers).
