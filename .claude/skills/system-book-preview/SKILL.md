---
name: system-book-preview
description: WAJIB setiap kali pengguna membina sistem/web app (HTML/CSS/JS) — walaupun tidak diminta. Hasilkan buku preview dengan menu kiri TEPAT 5 bahagian (Paparan Preview, HTML Index, HTML Admin, Rules Database, Rules Firestore), kod HTML sebagai SATU salinan lengkap, serta piawaian sistem pengguna (BM/BI/BA, footer statistik, hak cipta Genius Digital). Use when building any system, website or web app (BM/EN).
---

# Buku Preview Sistem (piawaian tetap pengguna)

Pengguna mahu format ini digunakan **secara automatik untuk setiap sistem yang dibina, tanpa perlu diarahkan lagi**. Ikut dengan tepat. Jangan tambah, jangan asingkan, jangan ubah susunan.

## 1. Menu kiri buku — TEPAT 5 bahagian, susunan ini sahaja

| # | Bahagian | Kandungan |
|---|---|---|
| 1 | **Paparan Preview** | Tangkapan skrin sebenar sistem ikut langkah (laman utama, muat naik/guna, tetapan, hasil, bahasa BI & BA, footer, telefon, admin). Tiada kod. |
| 2 | **HTML Index** | **SATU** blok kod lengkap `index.html`: HTML + CSS + JS + UI/UX semuanya di-inline dalam satu fail, dengan butang **Salin kod**. Bila disalin & ditampal ke `index.html`, ia terus berfungsi. |
| 3 | **HTML Admin** | **SATU** blok kod lengkap `admin.html` (juga HTML + CSS + JS inline) dengan butang **Salin kod**. |
| 4 | **Rules Database** | `database.rules.json` (Firebase Realtime Database) dengan butang Salin kod. |
| 5 | **Rules Firestore** | `firestore.rules` dengan butang Salin kod. |

**DILARANG** (pengguna marah jika ini berlaku):
- Bab tambahan seperti Pengenalan, Langkah Pemasangan, Struktur Projek, senarai fail, "Salinan Lengkap" berasingan, dsb.
- Memecahkan kod kepada `css/style.css`, `js/*.js` atau fail berasingan dalam buku. Kod index/admin dalam buku MESTI satu salinan lengkap.
- Memaparkan rangka `index.html` yang memanggil `<link href="css/...">` atau `<script src="js/...">` tempatan.

## 2. Cara menjana
- Kod sumber boleh modular dalam repo, tetapi sediakan skrip binaan (cth `build.js`) yang meng-inline semua CSS/JS/logo (data URI) ke `dist/index.html` dan `dist/admin.html`, kemudian membina `book.html` daripadanya.
- Rujukan pelaksanaan: `malaysia-pdf-tools/build.js` dalam repo `mediapekaya/website-developer` (fungsi `inline()` dan `buildBook()`).
- Pastikan teks dalam blok kod buku **sama 100%** dengan `dist/index.html` / `dist/admin.html` (sahkan secara automatik).
- Buku: navigasi hash (`#preview`, `#html-index`, `#html-admin`, `#rules-database`, `#rules-firestore`), menu kiri melekit di desktop, responsif telefon, butang Salin kod guna `navigator.clipboard` dengan sandaran pilih teks.
- Terbitkan buku sebagai Artifact dan beri pautan kepada pengguna.

## 3. Piawaian sistem pengguna (guna secara lalai)
- **Bahasa:** pemilih BM · BI · BA di header, **lalai BM**. BI & BA ditulis secara manual, bahasa betul dan profesional (bukan gaya Google Translate atau bahasa budak baru belajar). BA = RTL + fon Arab + tatabahasa bilangan Arab yang betul.
- **Footer:** statistik Jumlah Pengguna, Pelawat Hari Ini (reset 12:00 tengah malam waktu Malaysia), Pelawat Bulan Ini (reset akhir bulan), Keseluruhan (terkumpul). Paparkan "—" sehingga pangkalan data disambung, jangan nombor palsu.
- **Hak cipta:** `Hak Cipta Terpelihara Genius Digital <tahun>` dan slogan **"Memacu Inovasi Digital Melalui Sistem Pintar, Kreatif dan Efisien."**
- **Admin:** halaman berasingan `admin.html`. **Tiada butang/pautan admin dalam index.** Pengguna akan membuat pangkalan data sendiri dan meminta untuk disambungkan kemudian. Sediakan konfigurasi Firebase kosong yang selamat.
- **Teknologi:** HTML5, CSS3, JavaScript vanilla, pustaka CDN percuma, Firebase (pilihan), tanpa VPS/API berbayar. Tema terang (biru/ungu + aksen Jalur Gemilang), mobile-first.
- **Kejujuran fungsi:** setiap fungsi yang dipaparkan mesti berfungsi. Jika tidak boleh, terangkan hadnya atau tanda "Akan Datang". Jangan paparkan mesej berjaya jika gagal.
