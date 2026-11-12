/* Mobile Legends: Bang Bang - definisi game, template siap & gaya efek */
(function () {
  'use strict';
  const W = 1920, H = 1080;

  /* helper bina sumber */
  const S = (type, name, x, y, w, h, props = {}, extra = {}) => Object.assign({ id: GS.uid('src'), type, name, visible: true, locked: false, x, y, w, h, fit: 'cover', props }, extra);
  const video = (name, kind, x, y, w, h) => S('video', name, x, y, w, h, { kind, deviceId: '' });
  const widget = (name, widgetType, x, y, w, h, props = {}) => S('widget', name, x, y, w, h, Object.assign({ widget: widgetType }, props));

  const templates = [
    {
      id: 'holo-pro',
      orientation: 'landscape',
      name: 'Hologram Pro',
      desc: 'Game besar di kiri, kamera dan statistik di kanan, bar teks di bawah.',
      fxStyle: 'holo',
      build: () => [
        video('Game (Capture Card)', 'capture', 40, 90, 1280, 720),
        widget('Bingkai Game', 'frame', 40, 90, 1280, 720, { label: 'MOBILE LEGENDS' }),
        video('Kamera', 'camera', 1360, 90, 520, 292),
        widget('Bingkai Kamera', 'frame', 1360, 90, 520, 292, { label: 'LIVE' }),
        widget('Jam & Masa Main', 'clock', 1360, 410, 520, 118),
        widget('Menang / Kalah', 'winloss', 1360, 552, 520, 118),
        widget('Logo', 'logo', 1360, 694, 170, 116),
        widget('Tajuk', 'brand', 1550, 694, 330, 116),
        widget('Bar Teks', 'ticker', 40, 846, 1840, 96),
        widget('Meta Tournament', 'metaboard', 830, 100, 480, 250),
      ],
    },
    {
      id: 'cam-besar',
      orientation: 'landscape',
      name: 'Kamera Besar',
      desc: 'Muka streamer lebih besar, game di sebelah. Sesuai untuk sembang dan joki.',
      fxStyle: 'crimson',
      build: () => [
        video('Game (Capture Card)', 'capture', 40, 90, 1120, 630),
        widget('Bingkai Game', 'frame', 40, 90, 1120, 630, { label: 'MOBILE LEGENDS' }),
        video('Kamera', 'camera', 1200, 90, 680, 383),
        widget('Bingkai Kamera', 'frame', 1200, 90, 680, 383, { label: 'LIVE' }),
        widget('Jam & Masa Main', 'clock', 1200, 497, 330, 118),
        widget('Menang / Kalah', 'winloss', 1550, 497, 330, 118),
        widget('Logo', 'logo', 1200, 640, 170, 116),
        widget('Tajuk', 'brand', 1394, 640, 486, 116),
        widget('Bar Teks', 'ticker', 40, 846, 1840, 96),
        widget('Meta Tournament', 'metaboard', 660, 100, 490, 250),
      ],
    },
    {
      id: 'game-penuh',
      orientation: 'landscape',
      name: 'Game Penuh',
      desc: 'Game memenuhi skrin, widget kecil di penjuru. Kamera tersembunyi.',
      fxStyle: 'gold',
      build: () => [
        video('Game (Capture Card)', 'capture', 0, 0, W, H),
        S('video', 'Kamera', 1560, 24, 336, 189, { kind: 'camera', deviceId: '' }, { visible: false }),
        widget('Jam & Masa Main', 'clock', 24, 24, 360, 100),
        widget('Menang / Kalah', 'winloss', 408, 24, 360, 100),
        widget('Logo', 'logo', 792, 24, 120, 100),
        widget('Bar Teks', 'ticker', 360, 960, 1200, 84),
        widget('Meta Tournament', 'metaboard', 1060, 24, 480, 250),
      ],
    },
  ];


  /* ---------- template MENEGAK 9:16 (TikTok LIVE). Susun atur mengikut struktur rujukan, seni asli. ---------- */
  const common = (extra) => extra;
  const portrait = [
    {
      id: 'holo-portrait',
      orientation: 'portrait',
      name: 'Hologram Menegak',
      desc: 'Kamera di atas, bar status, game di tengah, banner bermaskot, giliran mabar dan W/L di bawah. Susun atur penuh untuk TikTok LIVE.',
      fxStyle: 'holo',
      fxAnchor: 1180,
      alertY: 1484,
      build: () => [
        video('Kamera', 'camera', 0, 0, 1080, 820),
        widget('Boss', 'boss', 24, 24, 400, 200),
        widget('Top Like', 'toplike', 24, 240, 400, 170),
        widget('Logo', 'logo', 944, 24, 112, 100),
        widget('Bar Status', 'statusbar', 0, 820, 1080, 56),
        video('Game (Capture Card)', 'capture', 0, 876, 1080, 608),
        widget('Bingkai Game', 'frame', 0, 876, 1080, 608, { label: 'MOBILE LEGENDS' }),
        widget('Pemasa Spell', 'spelltimer', 24, 900, 340, 200),
        widget('Banner Promosi', 'promo', 0, 1484, 1080, 140, { style: 'info' }),
        widget('Giliran Mabar', 'queue', 20, 1636, 560, 184),
        widget('Label Peranti', 'label', 600, 1636, 460, 52, { bind: 'device' }),
        widget('Menang / Kalah', 'winloss', 600, 1698, 460, 122),
        S('video', 'Handcam', 600, 1636, 460, 184, { kind: 'camera', deviceId: '' }, { visible: false }),
        widget('Banner Hadiah', 'promo', 20, 1832, 1040, 76, { style: 'gift' }),
        widget('Draft', 'draft', 20, 1484, 1040, 340),
        widget('Meta Tournament', 'metaboard', 470, 30, 470, 260),
      ],
    },
    {
      id: 'portrait-game',
      orientation: 'portrait',
      name: 'Menegak · Fokus Game',
      desc: 'Game besar memenuhi tengah skrin, kamera kecil di atas. Sesuai untuk gameplay dan joki.',
      fxStyle: 'crimson',
      fxAnchor: 980,
      alertY: 1476,
      build: () => [
        video('Kamera', 'camera', 0, 0, 1080, 380),
        widget('Bar Status', 'statusbar', 0, 380, 1080, 56),
        video('Game (Capture Card)', 'capture', 0, 436, 1080, 1040),
        widget('Bingkai Game', 'frame', 0, 436, 1080, 1040, { label: 'MOBILE LEGENDS' }),
        widget('Boss', 'boss', 24, 456, 380, 190),
        widget('Pemasa Spell', 'spelltimer', 700, 456, 340, 200),
        widget('Banner Promosi', 'promo', 0, 1476, 1080, 140, { style: 'info' }),
        widget('Giliran Mabar', 'queue', 20, 1628, 560, 190),
        widget('Label Peranti', 'label', 600, 1628, 460, 52, { bind: 'device' }),
        widget('Menang / Kalah', 'winloss', 600, 1690, 460, 128),
        widget('Banner Hadiah', 'promo', 20, 1832, 1040, 76, { style: 'gift' }),
        widget('Draft', 'draft', 20, 1476, 1040, 340),
        widget('Meta Tournament', 'metaboard', 470, 20, 470, 250),
      ],
    },
    {
      id: 'portrait-cam',
      orientation: 'portrait',
      name: 'Menegak · Kamera Penuh',
      desc: 'Muka streamer memenuhi skrin, game dalam tetingkap kecil. Sesuai untuk sembang, mabar dan jualan.',
      fxStyle: 'gold',
      fxAnchor: 1150,
      alertY: 1650,
      build: () => [
        video('Kamera', 'camera', 0, 0, 1080, 1920),
        widget('Bar Status', 'statusbar', 0, 0, 1080, 56),
        widget('Boss', 'boss', 24, 110, 400, 200),
        widget('Top Like', 'toplike', 24, 326, 400, 170),
        widget('Logo', 'logo', 944, 80, 112, 100),
        video('Game (Capture Card)', 'capture', 24, 1000, 520, 293),
        widget('Bingkai Game', 'frame', 24, 1000, 520, 293, { label: 'MOBILE LEGENDS' }),
        widget('Giliran Mabar', 'queue', 560, 1000, 496, 293),
        widget('Pemasa Spell', 'spelltimer', 24, 1320, 340, 200),
        widget('Banner Promosi', 'promo', 0, 1650, 1080, 140, { style: 'info' }),
        widget('Menang / Kalah', 'winloss', 20, 1804, 520, 100),
        widget('Label Peranti', 'label', 560, 1804, 496, 100, { bind: 'device' }),
        widget('Draft', 'draft', 20, 1480, 1040, 340),
        widget('Meta Tournament', 'metaboard', 480, 150, 456, 250),
      ],
    },
  ];

  /* ---------- template tambahan: tema warna dan rekaan berbeza ---------- */
  const portraitMore = [
    {
      id: 'neon-duel',
      orientation: 'portrait',
      theme: 'neon',
      fxStyle: 'neon',
      name: 'Neon · Game Atas',
      desc: 'Game besar di atas, kamera di bawah. Panel tajam bergaya neon hijau-biru. Sesuai untuk analisis dan komentar.',
      fxAnchor: 380,
      alertY: 1420,
      build: () => [
        video('Game (Capture Card)', 'capture', 0, 0, 1080, 720),
        widget('Bingkai Game', 'frame', 0, 0, 1080, 720, { label: 'MOBILE LEGENDS' }),
        widget('Boss', 'boss', 24, 24, 400, 200),
        widget('Top Like', 'toplike', 24, 240, 400, 170),
        widget('Pemasa Spell', 'spelltimer', 716, 24, 340, 200),
        widget('Bar Status', 'statusbar', 0, 720, 1080, 56),
        video('Kamera', 'camera', 0, 776, 1080, 640),
        widget('Logo', 'logo', 944, 790, 112, 100),
        widget('Banner Promosi', 'promo', 0, 1416, 1080, 140, { style: 'info' }),
        widget('Giliran Mabar', 'queue', 20, 1570, 560, 184),
        widget('Label Peranti', 'label', 600, 1570, 460, 52, { bind: 'device' }),
        widget('Menang / Kalah', 'winloss', 600, 1632, 460, 122),
        S('video', 'Handcam', 600, 1570, 460, 184, { kind: 'camera', deviceId: '' }, { visible: false }),
        widget('Banner Hadiah', 'promo', 20, 1772, 1040, 76, { style: 'gift' }),
        widget('Draft', 'draft', 20, 1416, 1040, 340),
        widget('Meta Tournament', 'metaboard', 440, 800, 490, 260),
      ],
    },
    {
      id: 'galaxy-mabar',
      orientation: 'portrait',
      theme: 'galaxy',
      fxStyle: 'galaxy',
      name: 'Galaksi · Kamera Besar',
      desc: 'Kamera besar di atas, game di bawah, giliran mabar jelas. Panel bulat lembut bertema ungu-merah jambu.',
      fxAnchor: 1260,
      alertY: 1470,
      build: () => [
        video('Kamera', 'camera', 0, 0, 1080, 1000),
        widget('Boss', 'boss', 24, 24, 400, 200),
        widget('Top Like', 'toplike', 24, 240, 400, 170),
        widget('Logo', 'logo', 944, 24, 112, 100),
        widget('Banner Hadiah', 'promo', 20, 900, 1040, 76, { style: 'gift' }),
        widget('Bar Status', 'statusbar', 0, 1000, 1080, 56),
        video('Game (Capture Card)', 'capture', 24, 1076, 640, 360),
        widget('Bingkai Game', 'frame', 24, 1076, 640, 360, { label: 'MOBILE LEGENDS' }),
        widget('Pemasa Spell', 'spelltimer', 36, 1090, 340, 200),
        widget('Menang / Kalah', 'winloss', 684, 1076, 372, 128),
        widget('Label Peranti', 'label', 684, 1216, 372, 52, { bind: 'device' }),
        S('video', 'Handcam', 684, 1284, 372, 152, { kind: 'camera', deviceId: '' }, { visible: false }),
        widget('Banner Promosi', 'promo', 0, 1450, 1080, 140, { style: 'info' }),
        widget('Giliran Mabar', 'queue', 20, 1610, 560, 184),
        widget('Bar Teks', 'ticker', 20, 1820, 1040, 84),
        widget('Draft', 'draft', 20, 1450, 1040, 340),
        widget('Meta Tournament', 'metaboard', 460, 60, 470, 260),
      ],
    },
    {
      id: 'mono-bersih',
      orientation: 'portrait',
      theme: 'mono',
      fxStyle: 'mono',
      name: 'Monokrom · Bersih',
      desc: 'Rekaan minimal berbingkai garis nipis, hitam-putih. Widget sedikit supaya game dan muka lebih jelas.',
      fxAnchor: 1100,
      alertY: 1460,
      build: () => [
        video('Kamera', 'camera', 0, 0, 1080, 760),
        widget('Bar Status', 'statusbar', 0, 760, 1080, 56),
        video('Game (Capture Card)', 'capture', 0, 816, 1080, 608),
        widget('Bingkai Game', 'frame', 0, 816, 1080, 608, { label: 'MOBILE LEGENDS' }),
        widget('Logo', 'logo', 944, 24, 112, 100),
        widget('Pemasa Spell', 'spelltimer', 24, 840, 340, 200),
        widget('Bar Teks', 'ticker', 20, 1444, 1040, 84),
        widget('Menang / Kalah', 'winloss', 20, 1548, 500, 120),
        widget('Label Peranti', 'label', 540, 1548, 520, 52, { bind: 'device' }),
        widget('Giliran Mabar', 'queue', 20, 1690, 560, 184),
        widget('Draft', 'draft', 20, 1444, 1040, 340),
        widget('Meta Tournament', 'metaboard', 460, 40, 470, 260),
      ],
    },
  ];

  const landscapeMore = [
    {
      id: 'neon-arena',
      orientation: 'landscape',
      theme: 'neon',
      fxStyle: 'neon',
      name: 'Neon Arena',
      desc: 'Game paling besar, kamera dan statistik di sisi kanan. Panel tajam neon hijau-biru.',
      build: () => [
        video('Game (Capture Card)', 'capture', 0, 0, 1440, 810),
        widget('Bingkai Game', 'frame', 0, 0, 1440, 810, { label: 'MOBILE LEGENDS' }),
        video('Kamera', 'camera', 1456, 16, 448, 252),
        widget('Bingkai Kamera', 'frame', 1456, 16, 448, 252, { label: 'LIVE' }),
        widget('Jam & Masa Main', 'clock', 1456, 292, 448, 104),
        widget('Menang / Kalah', 'winloss', 1456, 412, 448, 104),
        widget('Logo', 'logo', 1456, 532, 150, 104),
        widget('Tajuk', 'brand', 1620, 532, 284, 104),
        widget('Bar Teks', 'ticker', 16, 840, 1888, 90),
        widget('Meta Tournament', 'metaboard', 940, 16, 490, 250),
      ],
    },
    {
      id: 'galaxy-kamera',
      orientation: 'landscape',
      theme: 'galaxy',
      fxStyle: 'galaxy',
      name: 'Galaksi · Dua Skrin',
      desc: 'Game dan kamera sama saiz bersebelahan. Panel bulat lembut bertema ungu-merah jambu.',
      build: () => [
        video('Game (Capture Card)', 'capture', 40, 80, 900, 506),
        widget('Bingkai Game', 'frame', 40, 80, 900, 506, { label: 'MOBILE LEGENDS' }),
        video('Kamera', 'camera', 980, 80, 900, 506),
        widget('Bingkai Kamera', 'frame', 980, 80, 900, 506, { label: 'LIVE' }),
        widget('Jam & Masa Main', 'clock', 40, 620, 440, 110),
        widget('Menang / Kalah', 'winloss', 500, 620, 440, 110),
        widget('Logo', 'logo', 980, 620, 170, 110),
        widget('Tajuk', 'brand', 1170, 620, 710, 110),
        widget('Bar Teks', 'ticker', 40, 780, 1840, 100),
        widget('Meta Tournament', 'metaboard', 440, 90, 490, 230),
      ],
    },
    {
      id: 'mono-skrin',
      orientation: 'landscape',
      theme: 'mono',
      fxStyle: 'mono',
      name: 'Monokrom · Skrin Penuh',
      desc: 'Game memenuhi skrin dengan penanda minimal berbingkai garis nipis. Kamera tersembunyi.',
      build: () => [
        video('Game (Capture Card)', 'capture', 0, 0, W, H),
        S('video', 'Kamera', 1560, 130, 336, 189, { kind: 'camera', deviceId: '' }, { visible: false }),
        widget('Jam & Masa Main', 'clock', 24, 24, 340, 90),
        widget('Menang / Kalah', 'winloss', 380, 24, 340, 90),
        widget('Logo', 'logo', 1780, 24, 116, 90),
        widget('Bar Teks', 'ticker', 24, 980, 1872, 76),
        widget('Meta Tournament', 'metaboard', 1260, 24, 500, 240),
      ],
    },
  ];

  templates.unshift(...portrait, ...portraitMore);
  templates.push(...landscapeMore);

  GS.gameList = [
    { id: 'mlbb', name: 'Mobile Legends: Bang Bang', ready: true },
    { id: 'pubg', name: 'PUBG Mobile', ready: false },
    { id: 'ff', name: 'Free Fire', ready: false },
    { id: 'cod', name: 'Call of Duty: Mobile', ready: false },
    { id: 'hok', name: 'Honor of Kings', ready: false },
  ];

  /* bot kecil di sebelah banner promosi ialah sumber berasingan ('Bot') dalam semua template */
  const botFor = (p) => widget(p.props.style === 'gift' ? 'Bot Hadiah' : 'Bot', 'bot', p.x, p.y - Math.round(p.h * 0.06), Math.round(p.h * 1.24), Math.round(p.h * 1.12), { tone: p.props.style === 'gift' ? 'gold' : 'blue' });
  templates.forEach((t) => {
    const b = t.build;
    t.build = () => { const out = []; b().forEach((s) => { out.push(s); if (s.type === 'widget' && s.props.widget === 'promo') out.push(botFor(s)); }); return out; };
  });

  GS.games.mlbb = {
    id: 'mlbb',
    name: 'Mobile Legends: Bang Bang',
    short: 'MOBILE LEGENDS',
    templates,
    /* efek yang boleh dicetus (manual / hotkey / pengesan masa depan) */
    effects: [
      { id: 'kill', label: 'Kill', icon: 'flame', hotkey: '1', params: { label: 'KILL' } },
      { id: 'death', label: 'Mati', icon: 'bolt', hotkey: '2' },
      { id: 'victory', label: 'Victory', icon: 'trophy', hotkey: '3' },
      { id: 'defeat', label: 'Defeat', icon: 'shield', hotkey: '4' },
      { id: 'fullitem', label: 'Item Penuh', icon: 'layers', hotkey: '5' },
      { id: 'itembuy', label: 'Beli Item', icon: 'plus', hotkey: '6' },
      { id: 'itemalert', label: 'Notis Item', icon: 'bolt', hotkey: '7' },
      { id: 'tierlist', label: 'Tier List', icon: 'trophy', hotkey: '8' },
      { id: 'slain', label: 'Enemy Slain', icon: 'flame', hotkey: '9', params: { label: 'ENEMY SLAIN' } },
    ],
    killLabels: ['KILL', 'FIRST BLOOD', 'DOUBLE KILL', 'TRIPLE KILL', 'MANIAC', 'SAVAGE', 'KILLING SPREE'],
  };
})();
