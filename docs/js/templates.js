/**
 * Katalog templat GLOBAL STREAMER.
 * Hanya data: susun atur (layout) dan gaya (style) ditakrifkan dalam engine.js.
 * Gaya gelap/neon (gaming) hanya digunakan oleh templat kategori Gaming.
 */
export const CATEGORIES = [
  { id: 'pendidikan', name: 'Pendidikan', hint: 'Guru & pelajar' },
  { id: 'korporat', name: 'Korporat & Webinar', hint: 'Mesyuarat, latihan, jualan' },
  { id: 'creator', name: 'Content Creator', hint: 'Vlog, podcast, live jualan' },
  { id: 'berita', name: 'Berita & Ceramah', hint: 'Meja berita, forum, kuliah' },
  { id: 'gaming', name: 'Gaming', hint: 'Gaya neon untuk gamer' },
  { id: 'adegan', name: 'Adegan', hint: 'Mula, rehat, tamat' },
  { id: 'widget', name: 'Widget', hint: 'Panel sisi & bar bawah' },
];

const T = (id, name, cat, layout, style, extra = {}) => ({
  id, name, cat, layout, style, opts: {}, defaultSize: 'fhd', desc: '', defaults: {}, ...extra,
});

const EDU = {
  title: 'Matematik Tahun 5', subtitle: 'Pecahan dan Perpuluhan',
  people: 'Cikgu Aminah | Guru Matematik', tickerLabel: 'NOTA',
  ticker: 'Sediakan buku nota anda • Soalan boleh ditaip di ruang sembang • Latihan diberi di akhir sesi',
  slides: [
    { title: 'Objektif Pembelajaran', bullets: 'Memahami nilai pecahan\nMenukar pecahan kepada perpuluhan\nMenyelesaikan masalah harian', image: '' },
    { title: 'Contoh Pecahan', bullets: '1/2 = 0.5\n1/4 = 0.25\n3/4 = 0.75', image: '' },
    { title: 'Latihan Bersama', bullets: 'Tukarkan 2/5 kepada perpuluhan\nBandingkan 0.6 dan 3/5\nKongsi jawapan di sembang', image: '' },
  ],
};
const BIZ = {
  title: 'Strategi Pemasaran Digital 2027', subtitle: 'Webinar bulanan pasukan',
  people: 'Hana Rahman | Pengurus Pemasaran\nDaniel Lim | Ketua Jualan\nSiti Zahra | Analitik\nRavi Kumar | Kreatif',
  tickerLabel: 'AGENDA', ticker: 'Rakaman akan dikongsi selepas sesi • Soalan di ruang Q&A • Sila matikan mikrofon anda',
  slides: [
    { title: 'Ringkasan Suku Ini', bullets: 'Pertumbuhan jualan 18%\nPelanggan baharu 2,400\nKepuasan pelanggan 4.7/5', image: '' },
    { title: 'Strategi Utama', bullets: 'Fokus kandungan video pendek\nKerjasama dengan pengaruh mikro\nAutomasi emel susulan', image: '' },
    { title: 'Langkah Seterusnya', bullets: 'Lancar kempen bulan depan\nLatihan pasukan\nSemakan prestasi mingguan', image: '' },
  ],
};
const CREATOR = {
  title: 'Vlog Hari Ini', subtitle: 'Jom kita bual santai!',
  people: 'Aisyah Creator | @aisyah.creates\nTetamu Istimewa | Kawan baik',
  tickerLabel: 'NEWS', ticker: 'Jangan lupa subscribe & tekan loceng • Tinggalkan komen anda • Kongsi dengan rakan',
  handle: '@aisyah.creates | youtube.com/aisyah',
};
const NEWS = {
  title: 'Berita Utama Hari Ini', subtitle: 'Laporan khas dari studio',
  people: 'Nurul Huda | Pembaca Berita',
  tickerLabel: 'TERKINI', ticker: 'Cuaca cerah di seluruh negara • Pasaran saham ditutup lebih tinggi • Sukan: Pasukan kebangsaan menang 3-1',
  slides: [
    { title: 'Ekonomi', bullets: 'Kadar inflasi stabil\nEksport meningkat', image: '' },
    { title: 'Pendidikan', bullets: 'Kalendar sekolah baharu\nProgram digital sekolah', image: '' },
    { title: 'Sukan', bullets: 'Keputusan liga\nJadual perlawanan', image: '' },
  ],
};
const GAME = {
  title: 'RANKED GRIND - MALAM INI', subtitle: 'Mission: capai Grandmaster',
  people: 'KapakGamer | Streamer', tickerLabel: 'CHAT',
  ticker: 'Follow & raid kami! • !discord untuk sertai komuniti • Sub goal: 100 pengikut malam ini',
  handle: '@kapakgamer | twitch.tv/kapakgamer', topics: '#ranked, #fps, #malaysia',
  goal: { label: 'Matlamat pengikut', current: 72, target: 100 },
};

export const TEMPLATES = [
  /* ----------------------------- Pendidikan ----------------------------- */
  T('edu-kelas-biru', 'Kelas Slaid Biru', 'pendidikan', 'presenterMain', 'biru', { opts: { main: 'slide' }, defaults: EDU, desc: 'Slaid besar di kiri, kamera guru di kanan, agenda dan jam.' }),
  T('edu-kelas-hijau', 'Bilik Darjah Hijau', 'pendidikan', 'presenterMain', 'hijau', { opts: { main: 'slide' }, defaultSize: 'classic', defaults: { ...EDU, title: 'Sains Tahun 4', subtitle: 'Kitaran Air', people: 'Cikgu Faridah | Guru Sains' }, desc: 'Sesuai untuk skrin projektor 4:3 dan kelas dalam talian.' }),
  T('edu-skrin-kuning', 'Kelas Skrin Ceria', 'pendidikan', 'presenterMain', 'kuning', { opts: { main: 'screen' }, defaults: { ...EDU, title: 'Bahasa Melayu', subtitle: 'Karangan Kreatif', people: 'Cikgu Hasnah | Guru BM' }, desc: 'Kongsi skrin PowerPoint/PDF dengan kamera guru di tepi.' }),
  T('edu-papan-klasik', 'Papan Putih Klasik', 'pendidikan', 'whiteboard', 'kertas', { defaults: { ...EDU, title: 'Algebra Asas', subtitle: 'Persamaan Linear', badge: 'KELAS' }, desc: 'Ruang menulis besar dengan kamera bulat di sudut.' }),
  T('edu-papan-moden', 'Papan Putih Moden', 'pendidikan', 'whiteboard', 'slate', { defaults: { ...EDU, title: 'Fizik Tingkatan 4', subtitle: 'Daya dan Gerakan' }, desc: 'Papan tulis digital dengan reka bentuk minimal.' }),
  T('edu-tutorial-ungu', 'Tutorial Skrin + Muka', 'pendidikan', 'screenCam', 'ungu', { opts: { camShape: 'circle' }, defaults: { ...EDU, title: 'Belajar Excel Dari Sifar', subtitle: 'Formula SUM dan AVERAGE', people: 'Cikgu Zul | Jurulatih ICT' }, desc: 'Skrin penuh dengan kamera bulat untuk tunjuk cara.' }),
  T('edu-tutorial-teal', 'Tutorial Kod', 'pendidikan', 'screenCam', 'teal', { defaults: { ...EDU, title: 'Asas HTML & CSS', subtitle: 'Bina laman web pertama anda', people: 'Fiq | Jurulatih Pengaturcaraan', tickerLabel: 'KOD' }, desc: 'Editor kod besar dengan kamera segi empat.' }),
  T('edu-kuiz-kuning', 'Kuiz Pantas', 'pendidikan', 'quiz', 'kuning', { defaults: { ...EDU, title: 'KUIZ PANTAS', subtitle: 'Pengetahuan Am', badge: 'KUIZ', countdownMin: 1 }, desc: 'Soalan, empat pilihan jawapan dan pemasa kira detik.' }),
  T('edu-kuiz-biru', 'Kuiz Akademik', 'pendidikan', 'quiz', 'biru', { defaults: { ...EDU, title: 'KUIZ SAINS', badge: 'KUIZ', countdownMin: 1, quiz: { q: 'Planet manakah paling dekat dengan Matahari?', options: ['Utarid', 'Zuhrah', 'Marikh', 'Musytari'], answer: 0, reveal: false } }, desc: 'Reka bentuk formal untuk peperiksaan dan pertandingan.' }),
  T('edu-kuliah-emas', 'Kuliah Universiti', 'pendidikan', 'camFull', 'emas', { defaults: { ...EDU, title: 'Pengenalan Ekonomi', subtitle: 'Kuliah 3: Penawaran dan Permintaan', people: 'Prof. Dr. Ahmad Zaki | Pensyarah Kanan', tickerLabel: 'KULIAH' }, desc: 'Muka penuh dengan bar nama pensyarah yang rasmi.' }),
  T('edu-pelajar-langit', 'Pembentangan Pelajar', 'pendidikan', 'presenterMain', 'langit', { opts: { main: 'slide' }, defaultSize: 'classic', defaults: { ...EDU, title: 'Projek Sains Kumpulan 3', subtitle: 'Tenaga Boleh Baharu', people: 'Amir Hakim | Ketua Kumpulan', badge: 'PROJEK', tickerLabel: 'KELAS' }, desc: 'Ceria dan bersih untuk pembentangan tugasan pelajar.' }),
  T('edu-tutor-teal', 'Tutor Peribadi 1:1', 'pendidikan', 'duo', 'teal', { defaults: { ...EDU, title: 'Sesi Tutor Matematik', people: 'Cikgu Aminah | Tutor\nNur Alya | Pelajar', badge: 'TUTOR' }, desc: 'Dua kamera sebelah-menyebelah untuk guru dan murid.' }),
  T('edu-qna-hijau', 'Soal Jawab Kelas', 'pendidikan', 'camChat', 'hijau', { defaults: { ...EDU, title: 'Sesi Soal Jawab', subtitle: 'Tanya apa sahaja', badge: 'Q&A' }, desc: 'Kamera guru dengan ruang sembang untuk soalan pelajar.' }),
  T('edu-nota-pantas', 'Nota Pantas Menegak', 'pendidikan', 'presenterMain', 'pink', { opts: { main: 'slide' }, defaultSize: 'vertical', defaults: { ...EDU, title: 'Nota 1 Minit', subtitle: 'Tip belajar lebih cepat', people: 'Cikgu Aina | Pendidik' }, desc: 'Format menegak untuk TikTok, Reels dan Shorts.' }),

  /* ----------------------------- Korporat ----------------------------- */
  T('biz-webinar', 'Webinar Korporat', 'korporat', 'presenterMain', 'biru', { opts: { main: 'slide' }, defaults: BIZ, desc: 'Slaid utama, penceramah dan agenda untuk webinar.' }),
  T('biz-demo', 'Demo Produk', 'korporat', 'presenterMain', 'slate', { opts: { main: 'screen' }, defaults: { ...BIZ, title: 'Demo Produk Versi 3.0', subtitle: 'Ciri baharu dan cara guna' }, desc: 'Kongsi skrin aplikasi sambil menerangkan.' }),
  T('biz-mesyuarat', 'Mesyuarat Pasukan', 'korporat', 'grid4', 'slate', { defaults: { ...BIZ, title: 'Mesyuarat Mingguan', subtitle: 'Kemas kini projek', badge: 'REC' }, desc: 'Empat peserta dalam grid kemas.' }),
  T('biz-panel', 'Panel Forum', 'korporat', 'grid4', 'emas', { defaults: { ...BIZ, title: 'Forum Kepimpinan', subtitle: 'Cabaran industri 2027', badge: 'LIVE' }, desc: 'Panel pakar dengan nama dan jawatan.' }),
  T('biz-temubual', 'Temu Bual Eksekutif', 'korporat', 'duo', 'kertas', { defaults: { ...BIZ, title: 'Bual Bicara Eksekutif', subtitle: 'Perjalanan membina syarikat', people: 'Datuk Rashid | Pengerusi\nHana Rahman | Moderator' }, desc: 'Dua kerusi, gaya majalah klasik.' }),
  T('biz-berita-syarikat', 'Berita Syarikat', 'korporat', 'newsDesk', 'biru', { defaultSize: 'ultra', defaults: { ...BIZ, title: 'Kemas Kini Syarikat', subtitle: 'Pengumuman bulanan', people: 'Hana Rahman | Komunikasi Korporat', tickerLabel: 'UMUM' }, desc: 'Meja pengumuman dalaman dengan jam dan agenda.' }),
  T('biz-laporan', 'Laporan Prestasi', 'korporat', 'presenterMain', 'teal', { opts: { main: 'slide' }, defaults: { ...BIZ, title: 'Laporan Prestasi Suku Ke-3', subtitle: 'Ringkasan eksekutif' }, desc: 'Pembentangan angka dengan slaid besar.' }),
  T('biz-jualan', 'Pembentangan Jualan', 'korporat', 'product', 'ungu', { defaults: { ...BIZ, title: 'Pakej Langganan Premium', subtitle: 'Tawaran terhad bulan ini', price: 'RM 199', cta: 'Hubungi kami hari ini', slides: [{ title: 'Pakej Premium', bullets: 'Sokongan 24/7\nLatihan pasukan percuma\nLaporan bulanan', image: '' }] }, desc: 'Kad produk dengan harga dan ajakan bertindak.' }),
  T('biz-latihan', 'Latihan Kakitangan', 'korporat', 'camChat', 'biru', { defaults: { ...BIZ, title: 'Latihan Keselamatan Siber', subtitle: 'Sesi 2 daripada 4', badge: 'LATIHAN' }, desc: 'Jurulatih dengan ruang sembang peserta.' }),
  T('biz-pitch', 'Pitch Pelabur', 'korporat', 'screenCam', 'slate', { defaults: { ...BIZ, title: 'Pitch Deck Pusingan Benih', subtitle: 'Visi, pasaran dan pertumbuhan', people: 'Aiman Razak | Pengasas' }, desc: 'Dek pembentangan penuh dengan kamera pengasas.' }),
  T('biz-bingkai', 'Bingkai Bersih', 'korporat', 'frameOnly', 'slate', { defaults: { ...BIZ, title: 'Ucapan Pengarah Urusan', subtitle: 'Mesej tahun baharu' }, desc: 'Kamera dengan bingkai halus dan bar tajuk.' }),

  /* ----------------------------- Content Creator ----------------------------- */
  T('cr-vlog-oren', 'Vlog Cerah', 'creator', 'camFull', 'oren', { defaults: CREATOR, desc: 'Muka penuh yang ceria dengan bar nama dan teks berjalan.' }),
  T('cr-podcast-duo', 'Podcast Duo', 'creator', 'duo', 'pink', { defaults: { ...CREATOR, title: 'Podcast Santai #12', subtitle: 'Bual hal kehidupan', badge: 'REC' }, desc: 'Dua suara, dua kamera, gaya lembut.' }),
  T('cr-podcast-solo', 'Podcast Solo', 'creator', 'talkCenter', 'oren', { opts: { shape: 'circle' }, defaultSize: 'fhd', defaults: { ...CREATOR, title: 'Cerita Malam', subtitle: 'Podcast bersama Aisyah', people: 'Aisyah | Hos Podcast' }, desc: 'Kamera bulat di tengah, tajuk dan hashtag di sisi.' }),
  T('cr-review', 'Ulasan Produk', 'creator', 'product', 'pink', { defaults: { ...CREATOR, title: 'Ulasan Jujur: Earbuds Murah', subtitle: 'Berbaloi atau tidak?', price: 'RM 89', cta: 'Pautan di bio', slides: [{ title: 'Earbuds Z1', bullets: 'Bateri 30 jam\nBass mantap\nTahan percikan air', image: '' }] }, desc: 'Kad produk dengan tag harga.' }),
  T('cr-jualan', 'Live Jualan', 'creator', 'product', 'oren', { defaultSize: 'vertical', defaults: { ...CREATOR, title: 'FLASH SALE MALAM INI', subtitle: 'Stok terhad!', price: 'RM 29.90', cta: 'Tekan troli kuning', slides: [{ title: 'Tudung Instant Premium', bullets: 'Fabrik sejuk\nSaiz bebas\nPos percuma', image: '' }] }, desc: 'Menegak untuk TikTok Shop dan Shopee Live.' }),
  T('cr-qna', 'Soal Jawab Langsung', 'creator', 'camChat', 'langit', { defaults: { ...CREATOR, title: 'Tanya Apa Sahaja', subtitle: 'Sesi soal jawab langsung', badge: 'Q&A' }, desc: 'Kamera dengan panel sembang YouTube/TikTok.' }),
  T('cr-tutorial', 'Tutorial Kreatif', 'creator', 'screenCam', 'oren', { opts: { camShape: 'circle' }, defaults: { ...CREATOR, title: 'Edit Video Dengan Telefon', subtitle: 'Langkah demi langkah', people: 'Aisyah | Kreator Video' }, desc: 'Tunjuk skrin dengan kamera bulat.' }),
  T('cr-reels', 'Reels Bingkai Bulat', 'creator', 'frameOnly', 'pink', { defaultSize: 'square', defaults: { ...CREATOR, title: 'Tip Harian', subtitle: 'Ikuti untuk lagi' }, desc: 'Bingkai bersih untuk Instagram dan Facebook.' }),
  T('cr-tiktok', 'TikTok Muka Penuh', 'creator', 'camFull', 'oren', { defaultSize: 'vertical', defaults: { ...CREATOR, title: 'Live Bersama Aisyah', subtitle: '', people: 'Aisyah | @aisyah.creates' }, desc: 'Menegak 9:16 dengan zon selamat untuk antara muka TikTok.' }),
  T('cr-resipi', 'Resipi Dapur', 'creator', 'presenterMain', 'kuning', { opts: { main: 'slide' }, defaultSize: 'p45', defaults: { ...CREATOR, title: 'Nasi Lemak Sedap', subtitle: 'Resipi mudah untuk keluarga', people: 'Chef Ayu | Pencinta Masakan', slides: [{ title: 'Bahan-bahan', bullets: '2 cawan beras\n1 cawan santan\nDaun pandan & halia', image: '' }, { title: 'Cara Masak', bullets: 'Basuh beras\nCampur santan\nMasak sehingga naik', image: '' }] }, desc: 'Senarai bahan dan langkah dengan kamera chef.' }),
  T('cr-skrin-santai', 'Kongsi Skrin Santai', 'creator', 'frameOnly', 'oren', { opts: { main: 'screen' }, defaults: { ...CREATOR, title: 'Reaksi & Ulasan', subtitle: 'Tonton bersama saya' }, desc: 'Bingkai skrin untuk reaksi atau tonton bersama.' }),
  T('cr-bual-4', 'Rancangan Bual 4 Orang', 'creator', 'grid4', 'pink', { defaults: { ...CREATOR, title: 'Bual Bicara Hujung Minggu', people: 'Aisyah | Hos\nFarah | Tetamu\nImran | Tetamu\nLina | Tetamu' }, desc: 'Empat kotak untuk rancangan bual atau jemputan.' }),

  /* ----------------------------- Berita & Ceramah ----------------------------- */
  T('news-merah', 'Meja Berita Merah', 'berita', 'newsDesk', 'merah', { defaults: NEWS, desc: 'Gaya berita televisyen dengan bar tajuk dan teks berjalan.' }),
  T('news-pagi', 'Berita Pagi', 'berita', 'newsDesk', 'langit', { defaults: { ...NEWS, title: 'Selamat Pagi Malaysia', subtitle: 'Berita dan cuaca pagi ini' }, desc: 'Nada cerah untuk rancangan pagi.' }),
  T('news-ilmu', 'Majlis Ilmu', 'berita', 'talkCenter', 'emas', { opts: { shape: 'round' }, defaults: { ...NEWS, title: 'Majlis Ilmu Mingguan', subtitle: 'Kuliah Maghrib', people: 'Ustaz Azman | Penceramah', topics: '#ilmu, #kuliah, #komuniti', tickerLabel: 'INFO' }, desc: 'Formal dan tenang untuk ceramah dan kuliah umum.' }),
  T('news-forum', 'Forum Dialog', 'berita', 'duo', 'emas', { defaults: { ...NEWS, title: 'Forum Dialog Perdana', people: 'Dr. Salmah | Panel\nEncik Rizal | Moderator' }, desc: 'Dua panel dengan nama rasmi.' }),
  T('news-tazkirah', 'Tazkirah Ringkas', 'berita', 'camFull', 'hijau', { defaultSize: 'vertical', defaults: { ...NEWS, title: 'Tazkirah 3 Minit', subtitle: '', people: 'Ustazah Rohana | Penceramah', tickerLabel: 'TAZKIRAH' }, desc: 'Menegak untuk perkongsian ringkas di media sosial.' }),
  T('news-kuliah-kertas', 'Kuliah Klasik', 'berita', 'presenterMain', 'kertas', { opts: { main: 'slide' }, defaults: { ...NEWS, title: 'Sejarah Tanah Melayu', subtitle: 'Kuliah umum', people: 'Dr. Hashim | Sejarawan' }, desc: 'Nuansa kertas dan serif untuk kuliah akademik.' }),

  /* ----------------------------- Gaming (gaya gelap neon) ----------------------------- */
  T('gm-neon-hud', 'Arena Neon', 'gaming', 'gameHud', 'neon', { defaults: GAME, desc: 'Skrin permainan penuh, facecam bersudut dan bar matlamat.' }),
  T('gm-esports', 'Esports Merah', 'gaming', 'gameHud', 'esports', { defaults: { ...GAME, title: 'TURNAMEN PUBLIK - PERINGKAT AKHIR' }, desc: 'Agresif merah-hitam untuk perlawanan esports.' }),
  T('gm-pixel', 'Retro Piksel', 'gaming', 'gameSplit', 'pixel', { defaults: { ...GAME, title: 'PIXEL QUEST - LEVEL 3' }, desc: 'Gaya arked 8-bit dengan lajur facecam dan sembang.' }),
  T('gm-siber', 'Siber Hijau', 'gaming', 'gameHud', 'siber', { defaults: { ...GAME, title: 'CYBER RUN - SPEEDRUN' }, desc: 'Hijau matriks untuk permainan strategi dan speedrun.' }),
  T('gm-lava', 'Lava Oren', 'gaming', 'gameSplit', 'lava', { defaults: { ...GAME, title: 'BATTLE ROYALE - SOLO' }, desc: 'Tenaga oren-api dengan panel sembang.' }),
  T('gm-facecam-neon', 'Facecam Neon', 'gaming', 'frameOnly', 'neon', { defaultSize: 'hd', defaults: GAME, desc: 'Bingkai facecam neon yang ringkas.' }),
  T('gm-kamera-sembang', 'Kamera + Sembang Gamer', 'gaming', 'camChat', 'siber', { defaults: { ...GAME, title: 'JUST CHATTING' }, desc: 'Untuk sesi berbual dengan penonton.' }),
  T('gm-start', 'Gaming: Mula', 'gaming', 'scene', 'neon', { opts: { scene: 'start' }, defaults: { ...GAME, title: 'SIARAN BERMULA SEBENTAR LAGI', subtitle: 'Siapkan snek anda!' }, desc: 'Skrin "starting soon" dengan kira detik.' }),
  T('gm-brb', 'Gaming: Rehat', 'gaming', 'scene', 'esports', { opts: { scene: 'brb' }, defaults: { ...GAME, title: 'KEJAP, AMBIL AIR!', subtitle: 'Kembali dalam beberapa minit', countdownMin: 3 }, desc: 'Skrin "be right back".' }),
  T('gm-end', 'Gaming: Tamat', 'gaming', 'scene', 'siber', { opts: { scene: 'end' }, defaults: { ...GAME, title: 'GG, TERIMA KASIH!', subtitle: 'Jumpa lagi esok malam' }, desc: 'Skrin penutup dengan pautan sosial.' }),
  T('gm-sidebar', 'Gaming: Panel Sisi', 'gaming', 'sidebar', 'neon', { defaultSize: 'side', defaults: GAME, desc: 'Panel tegak untuk matlamat, agenda dan jam.' }),
  T('gm-bar', 'Gaming: Bar Nama', 'gaming', 'lowerThird', 'esports', { defaultSize: 'strip', defaults: GAME, desc: 'Bar nama bawah untuk momen penting.' }),

  /* ----------------------------- Adegan ----------------------------- */
  T('sc-start-biru', 'Mula Kelas (Biru)', 'adegan', 'scene', 'biru', { opts: { scene: 'start' }, defaults: { ...EDU, title: 'Kelas Bermula Sebentar Lagi', subtitle: 'Sila sediakan buku dan pen anda' }, desc: 'Skrin menunggu dengan kira detik.' }),
  T('sc-start-kuning', 'Mula Kelas (Ceria)', 'adegan', 'scene', 'kuning', { opts: { scene: 'start' }, defaults: { ...EDU, title: 'Jom Belajar!', subtitle: 'Kelas akan bermula tidak lama lagi' }, desc: 'Meriah untuk kanak-kanak dan sekolah rendah.' }),
  T('sc-start-slate', 'Mula Webinar', 'adegan', 'scene', 'slate', { opts: { scene: 'start' }, defaults: { ...BIZ, title: 'Webinar Bermula Sebentar Lagi', subtitle: 'Terima kasih kerana menyertai' }, desc: 'Minimal dan profesional.' }),
  T('sc-start-pink', 'Mula Siaran (Pink)', 'adegan', 'scene', 'pink', { opts: { scene: 'start' }, defaults: { ...CREATOR, title: 'Live Bermula Sekejap Lagi', subtitle: 'Kongsi siaran ini dengan rakan' }, desc: 'Lembut untuk kreator gaya hidup.' }),
  T('sc-brb-hijau', 'Rehat Kelas', 'adegan', 'scene', 'hijau', { opts: { scene: 'brb' }, defaults: { ...EDU, title: 'Rehat Sebentar', subtitle: 'Kita sambung selepas ini', countdownMin: 10 }, desc: 'Skrin rehat dengan pemasa.' }),
  T('sc-brb-oren', 'Rehat Siaran', 'adegan', 'scene', 'oren', { opts: { scene: 'brb' }, defaults: { ...CREATOR, title: 'Kejap Ya!', subtitle: 'Jangan pergi mana-mana', countdownMin: 5 }, desc: 'Santai untuk kreator.' }),
  T('sc-end-emas', 'Penutup Rasmi', 'adegan', 'scene', 'emas', { opts: { scene: 'end' }, defaults: { ...NEWS, title: 'Terima Kasih Atas Penyertaan Anda', subtitle: 'Jumpa lagi pada sesi akan datang' }, desc: 'Penutup majlis dan kuliah.' }),
  T('sc-end-langit', 'Penutup Kelas', 'adegan', 'scene', 'langit', { opts: { scene: 'end' }, defaults: { ...EDU, title: 'Terima Kasih, Murid-murid!', subtitle: 'Jangan lupa siapkan tugasan' }, desc: 'Penutup mesra untuk sekolah.' }),
  T('sc-end-teal', 'Penutup Webinar', 'adegan', 'scene', 'teal', { opts: { scene: 'end' }, defaults: { ...BIZ, title: 'Terima Kasih Kerana Hadir', subtitle: 'Rakaman akan dikongsi melalui emel' }, desc: 'Penutup dengan pautan hubungan.' }),

  /* ----------------------------- Widget ----------------------------- */
  T('sb-agenda-biru', 'Panel Agenda Biru', 'widget', 'sidebar', 'biru', { defaultSize: 'side', defaults: BIZ, desc: 'Agenda, jam dan pemasa dalam bar tegak.' }),
  T('sb-kelas-hijau', 'Panel Kelas Hijau', 'widget', 'sidebar', 'hijau', { defaultSize: 'side', defaults: EDU, desc: 'Untuk kelas dalam talian: topik, nama guru dan agenda.' }),
  T('sb-creator-pink', 'Panel Kreator Pink', 'widget', 'sidebar', 'pink', { defaultSize: 'side', defaults: CREATOR, desc: 'Hashtag, pautan sosial dan jam.' }),
  T('sb-slate', 'Panel Minimal', 'widget', 'sidebar', 'slate', { defaultSize: 'side', defaults: BIZ, desc: 'Gaya minimal yang sesuai untuk semua jenis siaran.' }),
  T('lt-biru', 'Bar Nama Biru', 'widget', 'lowerThird', 'biru', { defaultSize: 'strip', defaults: BIZ, desc: 'Nama dan jawatan pembentang, latar lutsinar.' }),
  T('lt-merah', 'Bar Nama Berita', 'widget', 'lowerThird', 'merah', { defaultSize: 'strip', defaults: NEWS, desc: 'Gaya stesen berita.' }),
  T('lt-emas', 'Bar Nama Rasmi', 'widget', 'lowerThird', 'emas', { defaultSize: 'strip', defaults: NEWS, desc: 'Untuk majlis dan kuliah.' }),
  T('lt-kuning', 'Bar Nama Ceria', 'widget', 'lowerThird', 'kuning', { defaultSize: 'strip', defaults: EDU, desc: 'Untuk guru dan kelas kanak-kanak.' }),
  T('lt-penuh-oren', 'Bar Nama + Tajuk', 'widget', 'lowerThird', 'oren', { defaultSize: 'fhd', defaults: CREATOR, desc: 'Letak di atas kamera OBS sendiri: tajuk, nama dan teks berjalan.' }),
];

export const TEMPLATE_COUNT = TEMPLATES.length;
