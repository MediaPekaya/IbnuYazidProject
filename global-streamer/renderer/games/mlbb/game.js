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
    ],
    killLabels: ['KILL', 'FIRST BLOOD', 'DOUBLE KILL', 'TRIPLE KILL', 'MANIAC', 'SAVAGE', 'KILLING SPREE'],
  };
})();
