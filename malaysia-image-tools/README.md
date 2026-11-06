# MALAYSIA IMAGE TOOLS

**Alat Gambar Percuma, Lengkap & Mudah Digunakan**
*“Memacu Inovasi Digital Melalui Sistem Pintar, Kreatif dan Efisien.”*
© Hak Cipta Terpelihara Genius Digital 2026

31 alat gambar yang berjalan 100% dalam browser (HTML, CSS, JavaScript vanilla). Tiada gambar dimuat naik ke server, tiada API berbayar.

## Fail

| Fail | Kegunaan |
|---|---|
| `index.html` | Laman utama + semua 31 alat (satu fail lengkap HTML/CSS/JS) |
| `logo.svg` | Logo 3D (juga terbenam dalam index.html & admin.html) |
| `hero-bg.jpg` | Gambar latar hero (letak dalam folder sama dengan index.html) |
| `admin.html` | Panel admin (Firebase Auth): pengumuman, hidup/mati alat, statistik, maklum balas |
| `firestore.rules` | Peraturan keselamatan Firestore |
| `database.rules.json` | Peraturan keselamatan Realtime Database (statistik & pelawat) |
| `src/` | Kod sumber modular yang digabungkan menjadi `index.html` |

Firebase Storage **tidak** digunakan.

## Alat

- **Image Converter:** JPG→PNG, PNG→JPG, WEBP→JPG, JPG→WEBP, PNG→WEBP, Format Converter, Image→PDF, PDF→Image
- **Image Editor:** Remove Background (AI), Compressor, Resizer (Lanczos3 + unsharp), Cropper, Rotator, Flipper, Color Picker, Brightness, Contrast, Saturation, Grayscale, Blur/Pixelate, Border
- **Image Utilities:** Metadata Viewer (EXIF/GPS + buang metadata), Dimension Checker, Palette Extractor, Favicon Generator (.ico + PWA), YouTube Thumbnail (auto < 2 MB), Passport Photo Layout (35×50 mm, 4R/A4, 300 DPI), Profile Picture, Collage, Meme, Image Comparison

## Pustaka sumber terbuka (dimuat bila perlu)

JSZip, jsPDF, pdf.js, exifr, pica, Transformers.js + model RMBG-1.4 (BRIA AI, lesen bukan komersial; model ≈44 MB dimuat sekali ke cache browser).

## Firebase (pilihan)

1. Cipta projek percuma (pelan Spark). Aktifkan Email/Password Auth, Firestore, Realtime Database.
2. Tampal `firestore.rules` dan `database.rules.json`.
3. Cipta akaun admin, kemudian dokumen Firestore `admins/{UID}` dan nod Realtime DB `admins/{UID}: true`.
4. Isi `FIREBASE_CONFIG` dalam `index.html` dan `admin.html`.

Statistik pelawat di footer: *Pelawat Hari Ini* set semula 12:00 tengah malam (waktu Malaysia), *Pelawat Bulan Ini* set semula awal bulan, *Keseluruhan* terus bertambah. Setiap browser dikira sekali sehari.

## Bina semula index.html

```bash
cat src/01-head.html src/02-core.js src/03-tools-a.js src/04-tools-b.js src/05-tools-c.js src/05b-removebg.js src/06-app.js > index.html
```

Tambah alat baharu dengan `registerTool({ id, cat, name, icon, desc, mount(root, scope) { ... } })`.
