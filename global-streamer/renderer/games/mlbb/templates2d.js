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

  // bot kecil banner promosi ialah sumber berasingan ('Bot') seperti template lain
  const botFor = (p) => widget(p.props.style === 'gift' ? 'Bot Hadiah' : 'Bot', 'bot', p.x, p.y - Math.round(p.h * 0.06), Math.round(p.h * 1.24), Math.round(p.h * 1.12), { tone: p.props.style === 'gift' ? 'gold' : 'blue' });
  const all = portrait.concat(landscape);
  all.forEach((t) => {
    const b = t.build;
    t.build = () => { const out = []; b().forEach((s) => { out.push(s); if (s.type === 'widget' && s.props.widget === 'promo') out.push(botFor(s)); }); return out; };
  });
  // semua template terdahulu ialah kategori 'gaming'
  G.templates.forEach((t) => { if (!t.category) t.category = 'gaming'; });
  G.templates.push(...all);
})();
