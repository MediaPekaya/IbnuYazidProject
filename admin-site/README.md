# Panel Admin Global Streamer (dalam talian, PWA)

- `public/admin/` ialah panel admin (letak di web host, cth Netlify pada laluan `/admin/`). Dipasang sebagai aplikasi melalui Chrome (PWA), tiada EXE.
- `public/index.html` ialah halaman muat turun (EXE, Zip, pautan admin) untuk pemilik.
- `firestore.rules` ialah peraturan Firestore penuh. Blok baharu: `config/{doc}` (baca awam, tulis admin sahaja) dan `adminConfig/{doc}` (admin sahaja).
- App membaca `config/voicebot` melalui REST (tiada log masuk). Lalai (tiada dokumen): hanya akaun admin.
