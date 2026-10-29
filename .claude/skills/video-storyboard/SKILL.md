---
name: video-storyboard
description: Tukar skrip atau transkrip suara user kepada storyboard beat demi beat (visual, teks skrin, animasi, transition, bunyi) sebelum dibina dalam Remotion. Guna selepas ada skrip/suara.
---

# Storyboard

1. Pecahkan transkrip (dengan cap masa perkataan jika ada) kepada beat 3-8 saat.
2. Untuk setiap beat isi jadual dalam `templates/video/docs/storyboard-template.md`:
   beat | masa | ayat | metafora visual | teks skrin | animasi | transition | bunyi.
3. Padankan jenis visual dengan isi ayat (pilih yang sesuai sahaja):
   - nombor/peratus -> `Counter`
   - langkah/proses -> `StepsDiagram`
   - perbandingan -> `Comparison`
   - ayat emosi/penegasan -> `KineticText`
   - kata nama konkrit -> ikon/objek (2D atau 3D)
4. Hadkan 1-2 jenis transition sepanjang video; ulang gaya yang sama untuk konsisten.
5. Pastikan ada "ruang bernafas" (beat ringkas tanpa kesan berat) setiap 3-4 beat.
6. Simpan output sebagai `beats.json` (lihat `templates/video/remotion/beats.example.json`).
