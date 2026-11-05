# Wakaf Multaqa — montaj Islamik 9:16 (HyperFrames)

Montaj tenang untuk *Majlis Multaqa YB Menteri di Jabatan Perdana Menteri (Hal Ehwal Agama) bersama Mutawalli dan Nazir Khas Wakaf*, PICC.

- `index.html` — root (16 klip menegak, crossfade/fade-to-white/light leak, audio, gred `warm-daylight`).
- `compositions/ornaments.html` — border geometri Islam (bintang 8 penjuru, arch) fade-in perlahan.
- `compositions/verses.html` — teks ayat/hadis (Amiri Quran / Amiri + Cormorant Garamond), tajuk, end card doa.
- `compositions/leak-*.html` — light leak keemasan (dari registry `organic-light-leak-overlay`, lapisan merah dibuang).
- `assets/audio/v*.mp3` — voice-over BM (ElevenLabs `eleven_turbo_v2_5`, `language_code: ms`, suara premade Brian). Sebutan disemak dengan whisper `medium` (`hyperframes transcribe -m medium -l ms`); ejaan "Kerrana" dan "Terdapat kebaikan" dipilih kerana disebut betul.
- `tools/` — skrip potong klip dan jana komposisi (`finalize.sh` = bina + gred).

Bahan yang TIDAK ada dalam repo: klip sumber dan `assets/clips/*.mp4` (Google Drive), `assets/audio/music.mp3` (lagu Ittaqullah – Inteam, blok korus ~62–104s + ~136–170s, crossfade 2s).

Preview: `npx hyperframes@0.9.16 preview` · Draf: `npx hyperframes@0.9.16 render -q draft -w 4 -o preview.mp4`
