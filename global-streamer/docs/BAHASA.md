# Bahasa / Languages (BM · EN)

## Untuk pengguna
* Tukar bahasa guna butang **BM | EN** di bar atas (juga di skrin log masuk), atau di **Tetapan > Bahasa**.
* **Bahasa antara muka** menukar semua menu dan butang (halaman dimuat semula). Tidak boleh ditukar semasa siaran atau rakaman.
* **Bahasa overlay siaran** menentukan bahasa teks yang penonton nampak (cth "MASA MAIN" / "PLAY TIME", teks efek). Ia boleh berbeza daripada bahasa antara muka dan berubah serta-merta.
* Mesej bar teks yang anda tulis sendiri tidak diterjemah. Mesej lalai ditukar mengikut bahasa selagi anda belum mengubahnya.

## For users
* Switch language with the **BM | EN** buttons in the top bar (also on the sign-in screen) or in **Settings > Language**.
* **Interface language** changes all menus and buttons (the page reloads). It cannot be changed while streaming or recording.
* **Stream overlay language** sets the language of text viewers see (e.g. "PLAY TIME", effect text). It can differ from the interface language and applies instantly.
* Text bar messages you write yourself are not translated. The default messages follow the language until you edit them.

## Untuk pembangun / For developers
* Teks sumber dalam kod ditulis dalam BM. Kamus English: `renderer/js/lang-en.js` (kunci = teks BM).
* `GS.t('Teks')`, `GS.t('Fail {0}', nama)` untuk antara muka; `GS.tov('TEKS')` untuk teks pada kanvas siaran.
* `GS.h()` menterjemah teks anak dan atribut (`title`, `placeholder`, `aria-label`, `alt`) secara automatik. Teks dalam `innerHTML`, `textContent`, `confirm()` dan teks yang disambung perlu dibungkus `GS.t()` secara manual.
* Mesej enjin siaran (proses utama) membawa `code` supaya antara muka boleh menterjemah (lihat `engMsg()` dalam `golive.js`).
* `npm run check:i18n` gagal jika teks dalam `GS.t()/GS.tov()` atau HTML statik tiada dalam kamus. Ia dijalankan dalam CI.
* Menambah bahasa ketiga: tambah fail kamus, daftar dalam `GS.i18n.langs` dan `setLang`.
