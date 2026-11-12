/* Mobile Legends: Bang Bang - template FORMAL (2D): latar plain, warna rata, tanpa cahaya hologram.
 * Setiap template mempunyai senarai sumber sendiri. Kategori 'formal' (lawan 'gaming') dipaparkan dalam dock Template. */
(function () {
  'use strict';
  const G = GS.games && GS.games.mlbb;
  if (!G) return;
  const S = (type, name, x, y, w, h, props = {}, extra = {}) => Object.assign({ id: GS.uid('src'), type, name, visible: true, locked: false, x, y, w, h, fit: 'cover', props }, extra);
  const video = (name, kind, x, y, w, h) => S('video', name, x, y, w, h, { kind, deviceId: '' });
  const widget = (name, widgetType, x, y, w, h, props = {}) => S('widget', name, x, y, w, h, Object.assign({ widget: widgetType }, props));
  const handcam = (x, y, w, h) => S('video', 'Handcam', x, y, w, h, { kind: 'camera', deviceId: '' }, { visible: false });
  const game = (x, y, w, h) => [video('Game (Capture Card)', 'capture', x, y, w, h), widget('Bingkai Game', 'frame', x, y, w, h, { label: 'MOBILE LEGENDS' })];

  const P = (o) => Object.assign({ orientation: 'portrait', category: 'formal', fxStyle: 'mono', fxAnchor: 1180, alertY: 1500 }, o);
  const L = (o) => Object.assign({ orientation: 'landscape', category: 'formal', fxStyle: 'mono' }, o);

  const portrait = [
    P({
      id: '2d-navy-bersih', theme: 'flat-navy', fxStyle: 'flat-navy', name: '2D Navy · Bersih',
      desc: 'Rekaan formal: latar navy plain, kamera di atas dan game di bawah. Sumber ringkas dan kemas.',
      build: () => [
        video('Kamera', 'camera', 0, 0, 1080, 860),
        widget('Logo', 'logo', 24, 24, 112, 100),
        widget('Tajuk', 'brand', 152, 28, 560, 96),
        widget('Bar Status', 'statusbar', 0, 860, 1080, 56),
        ...game(40, 950, 1000, 562),
        widget('Jam & Masa Main', 'clock', 40, 1544, 500, 118),
        widget('Menang / Kalah', 'winloss', 560, 1544, 480, 118),
        widget('Bar Teks', 'ticker', 40, 1700, 1000, 96),
      ],
    }),
    P({
      id: '2d-putih-kemas', theme: 'flat-white', fxStyle: 'flat-white', name: '2D Putih · Kemas',
      desc: 'Latar putih bersih. Game di atas, kamera besar di tengah, giliran mabar dan banner di bawah.',
      build: () => [
        ...game(24, 24, 1032, 580),
        widget('Boss', 'boss', 40, 40, 400, 200),
        video('Kamera', 'camera', 24, 640, 1032, 700),
        widget('Logo', 'logo', 928, 656, 112, 100),
        widget('Giliran Mabar', 'queue', 24, 1370, 520, 184),
        widget('Label Peranti', 'label', 564, 1370, 492, 52, { bind: 'device' }),
        widget('Menang / Kalah', 'winloss', 564, 1432, 492, 122),
        handcam(564, 1370, 492, 184),
        widget('Banner Promosi', 'promo', 0, 1580, 1080, 140, { style: 'info' }),
        widget('Banner Hadiah', 'promo', 20, 1740, 1040, 76, { style: 'gift' }),
        widget('Bar Teks', 'ticker', 24, 1830, 1032, 64),
      ],
    }),
    P({
      id: '2d-hutan-mabar', theme: 'flat-forest', fxStyle: 'flat-forest', name: '2D Hijau · Mabar',
      desc: 'Kamera besar di atas, game di bawah. Sesuai untuk mabar bersama penonton: giliran, menang/kalah dan top like.',
      build: () => [
        video('Kamera', 'camera', 0, 0, 1080, 1100),
        widget('Top Like', 'toplike', 24, 24, 400, 170),
        widget('Boss', 'boss', 24, 210, 400, 200),
        widget('Logo', 'logo', 944, 24, 112, 100),
        widget('Bar Status', 'statusbar', 0, 1100, 1080, 56),
        ...game(40, 1190, 640, 360),
        widget('Menang / Kalah', 'winloss', 700, 1190, 340, 128),
        widget('Label Peranti', 'label', 700, 1334, 340, 52, { bind: 'device' }),
        handcam(700, 1190, 340, 200),
        widget('Giliran Mabar', 'queue', 40, 1580, 560, 184),
        widget('Banner Hadiah', 'promo', 20, 1790, 1040, 76, { style: 'gift' }),
      ],
    }),
    P({
      id: '2d-anggur-analisis', theme: 'flat-wine', fxStyle: 'flat-wine', name: '2D Anggur · Analisis',
      desc: 'Game besar di atas dengan statistik Meta dan Draft di bawah. Sesuai untuk komentar dan analisis.',
      build: () => [
        ...game(0, 0, 1080, 760),
        widget('Logo', 'logo', 944, 24, 112, 100),
        widget('Bar Status', 'statusbar', 0, 760, 1080, 56),
        widget('Meta Tournament', 'metaboard', 40, 840, 640, 300),
        video('Kamera', 'camera', 700, 840, 340, 300),
        widget('Draft', 'draft', 20, 1160, 1040, 340),
        widget('Bar Teks', 'ticker', 20, 1520, 1040, 84),
        widget('Giliran Mabar', 'queue', 20, 1630, 560, 184),
        widget('Menang / Kalah', 'winloss', 600, 1630, 460, 122),
      ],
    }),
    P({
      id: '2d-ungu-santai', theme: 'flat-violet', fxStyle: 'flat-violet', name: '2D Ungu · Santai',
      desc: 'Untuk sembang dan jualan: kamera berbentuk segi empat sama di tengah, tajuk di atas dan banner di bawah.',
      build: () => [
        widget('Tajuk', 'brand', 40, 40, 800, 130, { text: 'LIVE SEKARANG' }),
        widget('Logo', 'logo', 880, 54, 160, 110),
        video('Kamera', 'camera', 40, 200, 1000, 1000),
        widget('Jam & Masa Main', 'clock', 40, 1230, 500, 118),
        widget('Menang / Kalah', 'winloss', 560, 1230, 480, 118),
        widget('Banner Promosi', 'promo', 0, 1380, 1080, 140, { style: 'info' }),
        widget('Giliran Mabar', 'queue', 40, 1560, 520, 184),
        widget('Bar Teks', 'ticker', 40, 1790, 1000, 96),
      ],
    }),
  ];

  const landscape = [
    L({
      id: '2d-navy-pentas', theme: 'flat-navy', fxStyle: 'flat-navy', name: '2D Navy · Pentas',
      desc: 'Latar navy plain: game besar di kiri, kamera dan statistik di kanan, bar teks di bawah.',
      build: () => [
        ...game(40, 40, 1280, 720),
        video('Kamera', 'camera', 1360, 40, 520, 292),
        widget('Bingkai Kamera', 'frame', 1360, 40, 520, 292, { label: 'LIVE' }),
        widget('Jam & Masa Main', 'clock', 1360, 360, 520, 118),
        widget('Menang / Kalah', 'winloss', 1360, 502, 520, 118),
        widget('Logo', 'logo', 1360, 644, 170, 116),
        widget('Tajuk', 'brand', 1550, 644, 330, 116),
        widget('Bar Teks', 'ticker', 40, 800, 1840, 96),
      ],
    }),
    L({
      id: '2d-putih-studio', theme: 'flat-white', fxStyle: 'flat-white', name: '2D Putih · Studio',
      desc: 'Studio putih bersih: kamera dan game bersebelahan, tajuk di atas dan jam di bawah.',
      build: () => [
        widget('Tajuk', 'brand', 40, 16, 700, 64),
        widget('Logo', 'logo', 1750, 8, 130, 76),
        video('Kamera', 'camera', 40, 100, 900, 506),
        ...game(980, 100, 900, 506),
        widget('Jam & Masa Main', 'clock', 40, 640, 440, 118),
        widget('Menang / Kalah', 'winloss', 500, 640, 440, 118),
        widget('Giliran Mabar', 'queue', 980, 640, 520, 168),
        widget('Bar Teks', 'ticker', 40, 880, 1840, 96),
      ],
    }),
    L({
      id: '2d-arang-esport', theme: 'flat-charcoal', fxStyle: 'flat-charcoal', name: '2D Arang · Esport',
      desc: 'Game memenuhi skrin di atas latar arang. Boss, top like dan Meta di penjuru; kamera boleh dipaparkan.',
      build: () => [
        video('Game (Capture Card)', 'capture', 0, 0, 1920, 1080),
        handcam(1560, 300, 336, 189),
        widget('Boss', 'boss', 24, 24, 400, 200),
        widget('Top Like', 'toplike', 24, 240, 400, 170),
        widget('Meta Tournament', 'metaboard', 1420, 24, 480, 250),
        widget('Jam & Masa Main', 'clock', 24, 950, 360, 100),
        widget('Menang / Kalah', 'winloss', 408, 950, 360, 100),
        widget('Logo', 'logo', 792, 950, 120, 100),
        widget('Bar Teks', 'ticker', 940, 960, 960, 84),
      ],
    }),
    L({
      id: '2d-langit-cerah', theme: 'flat-sky', fxStyle: 'flat-sky', name: '2D Langit · Cerah',
      desc: 'Latar biru langit: kamera besar di kiri, game dan giliran mabar di kanan, banner promosi di bawah.',
      build: () => [
        video('Kamera', 'camera', 40, 40, 1100, 619),
        ...game(1180, 40, 700, 394),
        widget('Giliran Mabar', 'queue', 1180, 470, 560, 184),
        widget('Menang / Kalah', 'winloss', 1180, 680, 700, 118),
        widget('Logo', 'logo', 40, 680, 170, 116),
        widget('Tajuk', 'brand', 230, 680, 600, 116),
        widget('Banner Promosi', 'promo', 40, 850, 1840, 140, { style: 'info' }),
      ],
    }),
    L({
      id: '2d-matahari-santai', theme: 'flat-sun', fxStyle: 'flat-sun', name: '2D Matahari · Santai',
      desc: 'Latar kuning lembut untuk sembang: kamera di tengah, jam dan menang/kalah di kiri, giliran di kanan.',
      build: () => [
        widget('Tajuk', 'brand', 40, 16, 900, 70, { text: 'LIVE SEKARANG' }),
        video('Kamera', 'camera', 480, 100, 960, 540),
        widget('Jam & Masa Main', 'clock', 40, 200, 400, 118),
        widget('Menang / Kalah', 'winloss', 40, 340, 400, 118),
        widget('Giliran Mabar', 'queue', 1480, 200, 400, 184),
        widget('Logo', 'logo', 1480, 410, 170, 116),
        widget('Bar Teks', 'ticker', 40, 690, 1840, 96),
        widget('Banner Promosi', 'promo', 40, 820, 1840, 140, { style: 'info' }),
        widget('Banner Hadiah', 'promo', 40, 980, 1840, 76, { style: 'gift' }),
      ],
    }),
  ];


  /* ---- set kedua: lebih banyak warna dan susun atur (bukan putih sahaja) ---- */
  const portrait2 = [
    P({
      id: '2d-teal-jualan', theme: 'flat-teal', fxStyle: 'flat-teal', name: '2D Teal · Jualan',
      desc: 'Untuk live jualan: kamera di atas, banner promosi dan hadiah besar di bawah, giliran dan jam.',
      build: () => [
        video('Kamera', 'camera', 0, 0, 1080, 760),
        widget('Logo', 'logo', 24, 24, 112, 100),
        widget('Tajuk', 'brand', 152, 28, 600, 96, { text: 'LIVE JUALAN' }),
        widget('Banner Promosi', 'promo', 0, 790, 1080, 140, { style: 'info' }),
        widget('Banner Hadiah', 'promo', 20, 960, 1040, 76, { style: 'gift' }),
        widget('Giliran Mabar', 'queue', 20, 1070, 520, 184),
        widget('Jam & Masa Main', 'clock', 560, 1070, 500, 118),
        widget('Menang / Kalah', 'winloss', 560, 1204, 500, 118),
        widget('Bar Teks', 'ticker', 20, 1360, 1040, 96),
      ],
    }),
    P({
      id: '2d-indigo-kuiz', theme: 'flat-indigo', fxStyle: 'flat-indigo', name: '2D Indigo · Kuiz',
      desc: 'Tajuk besar di atas, kamera dan game berturutan. Sesuai untuk kuiz, kelas dan komentar.',
      build: () => [
        widget('Tajuk', 'brand', 40, 40, 1000, 130, { text: 'KUIZ LIVE' }),
        video('Kamera', 'camera', 40, 190, 1000, 562),
        ...game(40, 780, 1000, 562),
        widget('Jam & Masa Main', 'clock', 40, 1370, 500, 118),
        widget('Menang / Kalah', 'winloss', 560, 1370, 480, 118),
        widget('Bar Teks', 'ticker', 40, 1520, 1000, 96),
      ],
    }),
    P({
      id: '2d-slate-pro', theme: 'flat-slate', fxStyle: 'flat-slate', name: '2D Slate · Pro',
      desc: 'Game besar di atas, kamera kecil di penjuru. Draft, Meta dan bar status untuk siaran profesional.',
      build: () => [
        ...game(0, 0, 1080, 700),
        video('Kamera', 'camera', 720, 520, 320, 320),
        widget('Logo', 'logo', 944, 24, 112, 100),
        widget('Bar Status', 'statusbar', 0, 700, 1080, 56),
        widget('Meta Tournament', 'metaboard', 40, 780, 640, 300),
        widget('Draft', 'draft', 20, 1110, 1040, 340),
        widget('Pemasa Spell', 'spelltimer', 40, 1480, 340, 200),
        widget('Menang / Kalah', 'winloss', 400, 1480, 640, 122),
      ],
    }),
    P({
      id: '2d-kopi-santai', theme: 'flat-coffee', fxStyle: 'flat-coffee', name: '2D Kopi · Bual',
      desc: 'Rekaan hangat untuk sembang: kamera di tengah, jam dan top like, bar teks di bawah.',
      build: () => [
        widget('Tajuk', 'brand', 60, 50, 960, 110, { text: 'BUAL SANTAI' }),
        video('Kamera', 'camera', 60, 190, 960, 1100),
        widget('Top Like', 'toplike', 80, 210, 400, 170),
        widget('Jam & Masa Main', 'clock', 60, 1320, 480, 118),
        widget('Logo', 'logo', 880, 1330, 140, 110),
        widget('Banner Hadiah', 'promo', 20, 1480, 1040, 76, { style: 'gift' }),
        widget('Bar Teks', 'ticker', 60, 1600, 960, 96),
      ],
    }),
    P({
      id: '2d-emas-mewah', theme: 'flat-gold', fxStyle: 'flat-gold', name: '2D Hitam Emas · Mewah',
      desc: 'Latar hitam dengan penanda emas. Kamera besar di atas dan game di bawah, kemas dan mewah.',
      build: () => [
        video('Kamera', 'camera', 0, 0, 1080, 900),
        widget('Logo', 'logo', 24, 24, 112, 100),
        widget('Boss', 'boss', 24, 140, 400, 200),
        widget('Top Like', 'toplike', 656, 24, 400, 170),
        widget('Bar Status', 'statusbar', 0, 900, 1080, 56),
        ...game(40, 980, 1000, 562),
        widget('Menang / Kalah', 'winloss', 40, 1570, 480, 118),
        widget('Jam & Masa Main', 'clock', 560, 1570, 480, 118),
        widget('Banner Hadiah', 'promo', 20, 1720, 1040, 76, { style: 'gift' }),
        widget('Bar Teks', 'ticker', 40, 1820, 1000, 80),
      ],
    }),
    P({
      id: '2d-lautan-duet', theme: 'flat-ocean', fxStyle: 'flat-ocean', name: '2D Lautan · Duet',
      desc: 'Dua kamera bersusun (streamer dan tetamu atau game) dengan giliran mabar dan menang/kalah.',
      build: () => [
        video('Kamera', 'camera', 40, 40, 1000, 700),
        widget('Logo', 'logo', 928, 56, 100, 90),
        video('Kamera Tetamu', 'camera', 40, 780, 1000, 700),
        widget('Giliran Mabar', 'queue', 40, 1510, 520, 184),
        widget('Menang / Kalah', 'winloss', 580, 1510, 460, 122),
        widget('Label Peranti', 'label', 580, 1650, 460, 52, { bind: 'device' }),
        widget('Bar Teks', 'ticker', 40, 1740, 1000, 96),
      ],
    }),
    P({
      id: '2d-mawar-comel', theme: 'flat-rose', fxStyle: 'flat-rose', name: '2D Mawar · Comel',
      desc: 'Latar merah jambu lembut dengan panel putih. Sesuai untuk live santai, jualan dan kecantikan.',
      build: () => [
        widget('Tajuk', 'brand', 40, 40, 1000, 120, { text: 'LIVE HARI INI' }),
        video('Kamera', 'camera', 40, 190, 1000, 1000),
        widget('Logo', 'logo', 900, 1210, 140, 110),
        widget('Jam & Masa Main', 'clock', 40, 1220, 500, 118),
        widget('Banner Promosi', 'promo', 0, 1380, 1080, 140, { style: 'info' }),
        widget('Giliran Mabar', 'queue', 40, 1560, 520, 184),
        widget('Bar Teks', 'ticker', 40, 1790, 1000, 96),
      ],
    }),
  ];

  const landscape2 = [
    L({
      id: '2d-teal-pentas', theme: 'flat-teal', fxStyle: 'flat-teal', name: '2D Teal · Pentas',
      desc: 'Kamera besar di kiri, game dan giliran mabar di kanan, banner promosi di bawah.',
      build: () => [
        video('Kamera', 'camera', 40, 40, 1160, 653),
        ...game(1240, 40, 640, 360),
        widget('Giliran Mabar', 'queue', 1240, 430, 560, 184),
        widget('Menang / Kalah', 'winloss', 1240, 640, 640, 118),
        widget('Logo', 'logo', 40, 720, 170, 116),
        widget('Tajuk', 'brand', 230, 720, 600, 116),
        widget('Banner Promosi', 'promo', 40, 880, 1840, 140, { style: 'info' }),
      ],
    }),
    L({
      id: '2d-indigo-kuiz-ls', theme: 'flat-indigo', fxStyle: 'flat-indigo', name: '2D Indigo · Kuiz',
      desc: 'Game di tengah dengan jam dan menang/kalah di kiri, giliran dan logo di kanan. Sesuai untuk kuiz dan kelas.',
      build: () => [
        widget('Tajuk', 'brand', 40, 16, 800, 70, { text: 'KUIZ LIVE' }),
        ...game(360, 100, 1200, 675),
        widget('Jam & Masa Main', 'clock', 40, 140, 300, 118),
        widget('Menang / Kalah', 'winloss', 40, 280, 300, 118),
        video('Kamera', 'camera', 40, 430, 300, 169),
        widget('Giliran Mabar', 'queue', 1580, 140, 300, 184),
        widget('Logo', 'logo', 1580, 350, 170, 116),
        widget('Bar Teks', 'ticker', 40, 820, 1840, 96),
      ],
    }),
    L({
      id: '2d-slate-meta', theme: 'flat-slate', fxStyle: 'flat-slate', name: '2D Slate · Meta',
      desc: 'Game di kiri, statistik Meta dan Draft di kanan, kamera kecil dan bar teks di bawah.',
      build: () => [
        ...game(40, 40, 1100, 619),
        widget('Meta Tournament', 'metaboard', 1180, 40, 700, 370),
        widget('Draft', 'draft', 1180, 430, 700, 300),
        video('Kamera', 'camera', 40, 690, 400, 225),
        widget('Menang / Kalah', 'winloss', 470, 690, 400, 118),
        widget('Jam & Masa Main', 'clock', 470, 830, 400, 118),
        widget('Bar Teks', 'ticker', 900, 780, 980, 96),
      ],
    }),
    L({
      id: '2d-kopi-bual', theme: 'flat-coffee', fxStyle: 'flat-coffee', name: '2D Kopi · Bual',
      desc: 'Kamera di tengah untuk sembang: jam dan top like di kiri, menang/kalah di kanan, hadiah di bawah.',
      build: () => [
        widget('Tajuk', 'brand', 40, 16, 800, 70, { text: 'BUAL SANTAI' }),
        video('Kamera', 'camera', 360, 100, 1200, 675),
        widget('Jam & Masa Main', 'clock', 40, 140, 300, 118),
        widget('Top Like', 'toplike', 40, 280, 300, 170),
        widget('Menang / Kalah', 'winloss', 1580, 140, 300, 118),
        widget('Logo', 'logo', 1580, 280, 170, 116),
        widget('Banner Hadiah', 'promo', 40, 830, 1840, 76, { style: 'gift' }),
        widget('Bar Teks', 'ticker', 40, 950, 1840, 90),
      ],
    }),
    L({
      id: '2d-emas-mewah-ls', theme: 'flat-gold', fxStyle: 'flat-gold', name: '2D Hitam Emas · Mewah',
      desc: 'Game memenuhi skrin dengan kamera kecil di sudut. Boss, jam dan menang/kalah berpenanda emas.',
      build: () => [
        video('Game (Capture Card)', 'capture', 0, 0, 1920, 1080),
        video('Kamera', 'camera', 1500, 640, 380, 214),
        widget('Bingkai Kamera', 'frame', 1500, 640, 380, 214, { label: 'LIVE' }),
        widget('Boss', 'boss', 24, 24, 400, 200),
        widget('Logo', 'logo', 1760, 24, 120, 100),
        widget('Jam & Masa Main', 'clock', 24, 950, 360, 100),
        widget('Menang / Kalah', 'winloss', 408, 950, 360, 100),
        widget('Bar Teks', 'ticker', 792, 960, 1088, 84),
      ],
    }),
    L({
      id: '2d-lautan-studio', theme: 'flat-ocean', fxStyle: 'flat-ocean', name: '2D Lautan · Studio',
      desc: 'Dua kamera bersebelahan untuk temu bual atau duet, dengan jam, menang/kalah dan bar teks.',
      build: () => [
        widget('Tajuk', 'brand', 40, 16, 800, 70, { text: 'TEMU BUAL' }),
        video('Kamera', 'camera', 40, 100, 920, 518),
        video('Kamera Tetamu', 'camera', 980, 100, 900, 506),
        widget('Jam & Masa Main', 'clock', 40, 650, 440, 118),
        widget('Menang / Kalah', 'winloss', 500, 650, 440, 118),
        widget('Giliran Mabar', 'queue', 980, 640, 520, 168),
        widget('Bar Teks', 'ticker', 40, 880, 1840, 96),
      ],
    }),
    L({
      id: '2d-pudina-segar', theme: 'flat-mint', fxStyle: 'flat-mint', name: '2D Pudina · Segar',
      desc: 'Latar hijau pudina yang segar: kamera dan game bersebelahan dengan banner promosi di bawah.',
      build: () => [
        widget('Logo', 'logo', 40, 8, 130, 76),
        widget('Tajuk', 'brand', 190, 16, 700, 64),
        video('Kamera', 'camera', 40, 100, 900, 506),
        ...game(980, 100, 900, 506),
        widget('Menang / Kalah', 'winloss', 40, 640, 440, 118),
        widget('Jam & Masa Main', 'clock', 500, 640, 440, 118),
        widget('Banner Promosi', 'promo', 40, 800, 1840, 140, { style: 'info' }),
        widget('Bar Teks', 'ticker', 40, 960, 1840, 90),
      ],
    }),
  ];


  /* ---- template "Sebentar Lagi" (kira detik): dipaparkan di bawah jenis Sebentar Lagi ---- */
  const countdown = (x, y, w, h, extra) => widget('Kira Detik', 'countdown', x, y, w, h, Object.assign({ hours: 0, minutes: 10, seconds: 0, title: 'SEBENTAR LAGI', subtitle: 'MOBILE LEGENDS', endText: 'MULA SEKARANG!' }, extra || {}));
  const SP = (o) => Object.assign({ orientation: 'portrait', category: 'soon', fxStyle: 'holo', fxAnchor: 1180, alertY: 1500 }, o);
  const SL = (o) => Object.assign({ orientation: 'landscape', category: 'soon', fxStyle: 'holo' }, o);
  const soonP = [
    SP({ id: 'sl-holo-portrait', theme: 'holo', fxStyle: 'holo', name: 'Sebentar Lagi · Hologram', desc: 'Kira detik besar berlatar hologram biru dengan logo dan bar teks. Tetapkan jam, minit dan saat dalam Sifat.',
      build: () => [
        widget('Logo', 'logo', 440, 240, 200, 170),
        countdown(60, 520, 960, 560),
        handcam(340, 1130, 400, 400),
        widget('Bar Teks', 'ticker', 40, 1560, 1000, 96),
      ] }),
    SP({ id: 'sl-navy-portrait', theme: 'flat-navy', fxStyle: 'flat-navy', name: 'Sebentar Lagi · Navy', desc: 'Formal 2D latar navy plain: kira detik, logo dan bar teks.',
      build: () => [
        widget('Tajuk', 'brand', 140, 180, 800, 140, { text: 'MOBILE LEGENDS' }),
        countdown(60, 480, 960, 560, { subtitle: 'LIVE AKAN BERMULA' }),
        widget('Logo', 'logo', 440, 1120, 200, 170),
        widget('Bar Teks', 'ticker', 40, 1560, 1000, 96),
      ] }),
    SP({ id: 'sl-wine-portrait', theme: 'flat-wine', fxStyle: 'flat-wine', name: 'Sebentar Lagi · Anggur', desc: 'Formal 2D latar merah anggur: kira detik besar dan banner promosi.',
      build: () => [
        widget('Logo', 'logo', 440, 200, 200, 170),
        countdown(60, 480, 960, 560, { subtitle: 'JANGAN KETINGGALAN' }),
        widget('Banner Promosi', 'promo', 0, 1120, 1080, 140, { style: 'info' }),
        widget('Bar Teks', 'ticker', 40, 1560, 1000, 96),
      ] }),
  ];
  const soonL = [
    SL({ id: 'sl-holo-land', theme: 'holo', fxStyle: 'holo', name: 'Sebentar Lagi · Hologram', desc: 'Kira detik besar berlatar hologram dengan logo dan bar teks.',
      build: () => [
        widget('Logo', 'logo', 880, 60, 160, 120),
        countdown(300, 220, 1320, 560),
        handcam(1500, 640, 360, 203),
        widget('Bar Teks', 'ticker', 40, 860, 1840, 96),
      ] }),
    SL({ id: 'sl-navy-land', theme: 'flat-navy', fxStyle: 'flat-navy', name: 'Sebentar Lagi · Navy', desc: 'Formal 2D latar navy plain dengan kira detik di tengah.',
      build: () => [
        widget('Tajuk', 'brand', 560, 40, 800, 120, { text: 'MOBILE LEGENDS' }),
        countdown(300, 220, 1320, 560, { subtitle: 'LIVE AKAN BERMULA' }),
        widget('Logo', 'logo', 60, 40, 160, 120),
        widget('Bar Teks', 'ticker', 40, 860, 1840, 96),
      ] }),
    SL({ id: 'sl-forest-land', theme: 'flat-forest', fxStyle: 'flat-forest', name: 'Sebentar Lagi · Hutan', desc: 'Formal 2D latar hijau hutan: kira detik, logo dan banner promosi.',
      build: () => [
        widget('Logo', 'logo', 880, 40, 160, 120),
        countdown(300, 200, 1320, 520),
        widget('Banner Promosi', 'promo', 40, 760, 1840, 140, { style: 'info' }),
        widget('Bar Teks', 'ticker', 40, 940, 1840, 90),
      ] }),
  ];

  // bot kecil banner promosi ialah sumber berasingan ('Bot') seperti template lain
  const botFor = (p) => widget(p.props.style === 'gift' ? 'Bot Hadiah' : 'Bot', 'bot', p.x, p.y - Math.round(p.h * 0.06), Math.round(p.h * 1.24), Math.round(p.h * 1.12), { tone: p.props.style === 'gift' ? 'gold' : 'blue' });
  const all = portrait.concat(landscape, portrait2, landscape2, soonP, soonL);
  all.forEach((t) => {
    const b = t.build;
    t.build = () => { const out = []; b().forEach((s) => { out.push(s); if (s.type === 'widget' && s.props.widget === 'promo') out.push(botFor(s)); }); return out; };
  });
  // semua template terdahulu ialah kategori 'gaming'
  G.templates.forEach((t) => { if (!t.category) t.category = 'gaming'; });
  G.templates.push(...all);
})();
