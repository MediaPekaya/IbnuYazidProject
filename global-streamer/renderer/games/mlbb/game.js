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
      ],
    },
  ];
  templates.unshift(...portrait);

  GS.gameList = [
    { id: 'mlbb', name: 'Mobile Legends: Bang Bang', ready: true },
    { id: 'pubg', name: 'PUBG Mobile', ready: false },
    { id: 'ff', name: 'Free Fire', ready: false },
    { id: 'cod', name: 'Call of Duty: Mobile', ready: false },
    { id: 'hok', name: 'Honor of Kings', ready: false },
  ];

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
    ],
    killLabels: ['KILL', 'FIRST BLOOD', 'DOUBLE KILL', 'TRIPLE KILL', 'MANIAC', 'SAVAGE', 'KILLING SPREE'],
  };
})();
