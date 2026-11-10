# Firebase (pelan percuma Spark)

Hanya perkhidmatan percuma digunakan: **Hosting**, **Firestore** dan (esok) **Authentication**.
Jangan hidupkan Cloud Functions atau Cloud Storage kerana ia boleh memerlukan pelan berbayar.

## Akaun
Projek: **global-streamer** (akaun Google **mediapc2026@gmail.com**). Hosting: https://global-streamer.web.app

## Fail
| Fail | Fungsi |
|---|---|
| `firebase.json` | Hosting (`renderer/`), header keselamatan, rujukan rules Firestore |
| `firebase/firestore.rules` | Peraturan Firestore: tolak semua kecuali data milik pengguna sendiri |
| `firebase/firestore.indexes.json` | Indeks (kosong buat masa ini) |

## Model data
| Laluan | Baca | Tulis |
|---|---|---|
| `admins/{uid}` | pemilik dokumen (semak diri sendiri) | **tiada klien**: Console / Admin SDK sahaja |
| `users/{uid}` | pemilik, admin | pemilik (medan terhad dan saiz dihadkan) |
| `users/{uid}/templates/{id}` | pemilik | pemilik |
| `licenses/{uid}` | pemilik, admin | admin sahaja |
| `meta/{doc}` | pengguna log masuk | **tiada klien** |
| selain itu | tutup | tutup |

## Log masuk: DIMATIKAN buat masa ini
App terus boleh digunakan tanpa daftar atau log masuk (`authEnabled: false` dalam `renderer/js/firebase-config.js`). Tiada SDK Firebase dimuat.
Untuk menghidupkan semula, tukar `authEnabled` kepada `true`. Bahagian di bawah menerangkan cara ia berfungsi apabila dihidupkan.

## Log masuk: tiada senarai UID
Sesiapa yang berdaftar dalam Firebase Authentication boleh log masuk. **Tiada UID dikodkan** dalam kod atau rules.
Akaun baharu (daftar sendiri, Google, atau ditambah melalui Console > Authentication > Users > Add user) terus berfungsi,
dan profil `users/{uid}` dicipta automatik pada log masuk pertama.

Admin ialah **data**, bukan kod: dokumen `admins/{uid}`. Untuk menjadikan seseorang admin, tambah dokumen di Firestore Console:
koleksi `admins`, ID dokumen = UID pengguna, isi satu medan contoh `role` = `owner`.

Dasar akses diubah dalam `renderer/js/firebase-config.js`:
| Tetapan | Maksud |
|---|---|
| `requireLogin` | skrin log masuk dipaparkan sebelum app boleh digunakan |
| `allowSignup` | benarkan daftar akaun baharu (emel + kata laluan) |
| `allowGuest` | butang "Teruskan sebagai tetamu". **Matikan sebelum menjual.** |
| `requireLicense` | jika `true`, hanya pengguna dengan `licenses/{uid}.active = true` boleh guna app |

Contoh dokumen lesen (koleksi `licenses`, ID dokumen = UID pengguna). Admin boleh cipta melalui Console:
```json
{ "active": true, "plan": "pro", "expiresAt": "2027-12-31T00:00:00Z", "maxDevices": 1 }
```

## Kuota percuma (rujukan: pelan Spark)
Firestore: 50,000 bacaan, 20,000 tulisan, 20,000 padam sehari dan 1 GiB simpanan. Hosting: 10 GB simpanan dan sekitar 360 MB/hari trafik.
Nilai ini boleh berubah, semak halaman harga Firebase. Data tournament (setiap 5 minit) sebaiknya dihidang sebagai fail JSON statik di Hosting supaya tidak menggunakan bacaan Firestore.

## Authentication: syarat di Firebase Console
1. Build > Authentication > Sign-in method: hidupkan **Google** dan/atau **Email/Password**.
2. Authentication > Settings > Authorized domains: `global-streamer.web.app` dan `global-streamer.firebaseapp.com` sudah ada secara lalai. Tambah domain sendiri jika ada.
3. Google Sign-In: pilih support email apabila diminta.

Header CSP dalam `firebase.json` sudah membenarkan `www.gstatic.com`, `apis.google.com`, `*.googleapis.com` dan `*.firebaseapp.com` untuk SDK dan log masuk.
SDK dimuat dari CDN Google dengan versi dikunci (`sdkVersion` dalam konfigurasi).

**App Windows:** log masuk Google (popup) tidak berfungsi pada `file://`. Versi app hanya memaparkan emel + kata laluan buat masa ini. Log masuk Google untuk app Windows dirancang pada Fasa 6.

## Lesen: had sebenar
Tanpa Cloud Functions, semakan lesen dibuat dalam klien (membaca `licenses/{uid}`). Kod klien boleh dibongkar oleh pengguna mahir, jadi ia menghalang kegunaan biasa tetapi bukan pembajakan bersungguh-sungguh. Perlindungan lebih kuat memerlukan pelayan (Cloud Functions Blaze, atau alternatif percuma seperti Cloudflare Workers).
