/* Mobile Legends - template Presentasi (mod normal sahaja, bukan gaya gaming).
 * Setiap template ada KAWASAN PERBENTANGAN (bingkai bertanda props.slot) berukuran 16:9 (slaid 1920x1080) atau A4 (kertas menegak).
 * Apabila pengguna memasukkan PDF atau PowerPoint, sumber itu diletak automatik pada kawasan tersebut, ikut saiz dan kedudukannya. */
(function () {
  'use strict';
  const G = GS.games.mlbb;
  const mk = (type, name, x, y, w, h, props) => ({ id: GS.uid('src'), type, name, visible: true, locked: false, x, y, w, h, fit: 'cover', props: props || {} });
  const wid = (name, k, x, y, w, h, props) => mk('widget', name, x, y, w, h, Object.assign({ widget: k }, props || {}));
  const cam = (x, y, w, h) => mk('video', 'Kamera', x, y, w, h, { kind: 'camera', deviceId: '' });
  const slot = (x, y, w, h) => wid('Kawasan Perbentangan', 'frame', x, y, w, h, { label: '', slot: 'present' });
  const FONTS = ['montserrat', 'poppins', 'playfair', 'oswald', 'lora', 'raleway'];
  const T16 = [['flat-navy', 'Navy'], ['flat-white', 'Putih'], ['flat-forest', 'Hutan'], ['flat-wine', 'Anggur'], ['flat-violet', 'Ungu'], ['flat-teal', 'Teal']];
  const TA4 = [['flat-white', 'Putih'], ['flat-sky', 'Langit'], ['flat-slate', 'Slate'], ['flat-coffee', 'Kopi'], ['flat-mint', 'Pudina'], ['flat-rose', 'Mawar']];
  const out = [];
  let n = 0;
  const COLORS = { Navy: 'Navy', Putih: 'White', Hutan: 'Forest', Anggur: 'Wine', Ungu: 'Violet', Teal: 'Teal', Langit: 'Sky', Slate: 'Slate', Kopi: 'Coffee', Pudina: 'Mint', Mawar: 'Rose' };
  const named = (o, kind, label, enLabel) => { const ms = 'Pembentangan ' + kind + ' · ' + label, en = 'Presentation ' + kind + ' · ' + (enLabel || COLORS[label] || label); delete o.name; Object.defineProperty(o, 'name', { get: () => (GS.state && GS.state.lang === 'ms' ? ms : en), enumerable: true, configurable: true }); return o; };
  const add = (o, build) => { const font = FONTS[(n++) % FONTS.length]; const kindOf = o.id.indexOf('-a4-') > 0 ? 'A4' : '16:9'; const lab = o.label; delete o.label; out.push(named(Object.assign({ category: 'present', fxAnchor: o.orientation === 'portrait' ? 1100 : 540 }, o, { build: () => { const items = build(); items.forEach((s) => { if (s.type === 'widget' && !s.props.font && !['logo', 'frame', 'bot', 'decor'].includes(s.props.widget)) s.props.font = font; }); return items; } }), kindOf, lab, o.enLabel)); };

  // ---- landscape 1920x1080, slaid 16:9 ----
  const L16 = [
    () => [slot(160, 56, 1600, 900), wid('Bar Teks', 'ticker', 160, 972, 1600, 84), wid('Logo', 'logo', 40, 40, 100, 90)],
    () => [slot(40, 60, 1360, 765), cam(1440, 60, 440, 248), wid('Logo', 'logo', 1440, 330, 140, 110), wid('Tajuk', 'brand', 1600, 330, 280, 110), wid('Jam', 'clock', 1440, 470, 440, 110), wid('Bar Teks', 'ticker', 40, 860, 1840, 100)],
    () => [slot(480, 50, 1400, 788), cam(40, 50, 400, 225), wid('Logo', 'logo', 40, 300, 400, 140), wid('Jam', 'clock', 40, 470, 400, 110), wid('Bar Teks', 'ticker', 480, 870, 1400, 100)],
    () => [slot(40, 40, 1360, 765), cam(1440, 600, 440, 248), wid('Logo', 'logo', 1440, 40, 440, 160), wid('Tajuk', 'brand', 1440, 220, 440, 120), wid('Bar Teks', 'ticker', 40, 850, 1840, 100)],
    () => [wid('Tajuk', 'brand', 160, 20, 1600, 100), slot(160, 130, 1520, 855), cam(1700, 130, 200, 200), wid('Bar Teks', 'ticker', 40, 1000, 1840, 70)],
    () => [slot(240, 36, 1440, 810), wid('Logo', 'logo', 40, 40, 150, 120), cam(1710, 40, 170, 170), wid('Jam', 'clock', 1520, 870, 360, 110), wid('Bar Teks', 'ticker', 240, 870, 1250, 110)],
  ];
  T16.forEach(([theme, label], i) => add({ id: 'pr-16-l-' + theme, orientation: 'landscape', theme, fxStyle: theme, label, name: '', desc: 'Masukkan PowerPoint atau PDF slaid 1920x1080: ia terus diletak di kawasan perbentangan.' }, L16[i % L16.length]));
  // ---- landscape, A4 menegak ----
  const LA4 = [
    () => [slot(600, 40, 720, 1000), wid('Logo', 'logo', 60, 60, 200, 160), wid('Tajuk', 'brand', 60, 260, 480, 140), wid('Jam', 'clock', 60, 440, 480, 110), cam(1380, 60, 480, 270), wid('Bar Teks', 'ticker', 1380, 360, 480, 100)],
    () => [slot(60, 40, 720, 1000), cam(840, 60, 1020, 574), wid('Logo', 'logo', 840, 670, 200, 150), wid('Tajuk', 'brand', 1060, 670, 800, 150), wid('Bar Teks', 'ticker', 840, 860, 1020, 110)],
    () => [slot(1140, 40, 720, 1000), cam(60, 60, 1000, 563), wid('Logo', 'logo', 60, 670, 200, 150), wid('Tajuk', 'brand', 280, 670, 780, 150), wid('Bar Teks', 'ticker', 60, 860, 1000, 110)],
  ];
  TA4.forEach(([theme, label], i) => add({ id: 'pr-a4-l-' + theme, orientation: 'landscape', theme, fxStyle: theme, label, name: '', desc: 'Masukkan PDF saiz A4: ia diletak di tengah kawasan kertas; guru boleh melaraskan saiznya.' }, LA4[i % LA4.length]));
  // ---- portrait 1080x1920, slaid 16:9 ----
  const P16 = [
    () => [wid('Tajuk', 'brand', 60, 80, 960, 130), slot(20, 260, 1040, 585), cam(240, 900, 600, 600), wid('Logo', 'logo', 440, 1540, 200, 170), wid('Bar Teks', 'ticker', 40, 1780, 1000, 100)],
    () => [cam(240, 40, 600, 600), slot(20, 700, 1040, 585), wid('Tajuk', 'brand', 60, 1330, 960, 130), wid('Jam', 'clock', 260, 1500, 560, 120), wid('Bar Teks', 'ticker', 40, 1780, 1000, 100)],
    () => [slot(20, 100, 1040, 585), wid('Logo', 'logo', 40, 740, 200, 170), cam(580, 740, 480, 480), wid('Tajuk', 'brand', 40, 940, 520, 150), wid('Bar Teks', 'ticker', 40, 1780, 1000, 100)],
    () => [slot(20, 320, 1040, 585), cam(20, 960, 500, 500), wid('Logo', 'logo', 560, 960, 240, 200), wid('Jam', 'clock', 560, 1200, 500, 120), wid('Bar Teks', 'ticker', 40, 1780, 1000, 100)],
    () => [wid('Logo', 'logo', 440, 60, 200, 170), slot(20, 280, 1040, 585), wid('Tajuk', 'brand', 60, 900, 960, 130), wid('Bar Teks', 'ticker', 40, 1780, 1000, 100)],
    () => [slot(20, 180, 1040, 585), cam(40, 820, 1000, 560), wid('Tajuk', 'brand', 60, 1420, 960, 130), wid('Bar Teks', 'ticker', 40, 1780, 1000, 100)],
  ];
  T16.forEach(([theme, label], i) => add({ id: 'pr-16-p-' + theme, orientation: 'portrait', theme, fxStyle: theme, label, name: '', desc: 'Masukkan PowerPoint atau PDF slaid 1920x1080: ia terus diletak di kawasan perbentangan.' }, P16[i % P16.length]));
  // ---- portrait, A4 ----
  const PA4 = [
    () => [slot(150, 140, 780, 1103), cam(340, 1290, 400, 400), wid('Logo', 'logo', 60, 1300, 200, 170), wid('Bar Teks', 'ticker', 40, 1780, 1000, 100)],
    () => [wid('Tajuk', 'brand', 60, 50, 960, 120), slot(150, 200, 780, 1103), cam(40, 1350, 360, 360), wid('Jam', 'clock', 440, 1350, 600, 120), wid('Bar Teks', 'ticker', 40, 1780, 1000, 100)],
    () => [slot(150, 100, 780, 1103), wid('Logo', 'logo', 60, 1260, 220, 180), cam(340, 1260, 680, 383), wid('Tajuk', 'brand', 60, 1660, 960, 100), wid('Bar Teks', 'ticker', 40, 1780, 1000, 100)],
  ];
  TA4.forEach(([theme, label], i) => add({ id: 'pr-a4-p-' + theme, orientation: 'portrait', theme, fxStyle: theme, label, name: '', desc: 'Masukkan PDF saiz A4: ia diletak di tengah kawasan kertas; guru boleh melaraskan saiznya.' }, PA4[i % PA4.length]));
  // ---- reka bentuk berhias (sekolah, perpustakaan, universiti, korporat, bunga, buku nota, sains, kanak-kanak, geometri) ----
  const DEC = [['school', 'Sekolah', 'School', 'flat-forest'], ['library', 'Perpustakaan', 'Library', 'flat-white'], ['university', 'Universiti', 'University', 'flat-navy'], ['corporate', 'Korporat', 'Corporate', 'flat-white'],
    ['floral', 'Bunga', 'Floral', 'flat-rose'], ['notebook', 'Buku Nota', 'Notebook', 'flat-sun'], ['science', 'Sains', 'Science', 'flat-sky'], ['kids', 'Kanak-kanak', 'Kids', 'flat-sky'], ['geometric', 'Geometri', 'Geometric', 'flat-mint'],
    ['dental', 'Doktor Gigi', 'Dentist', 'flat-white'], ['ortho', 'Ortopedi', 'Orthopedic', 'flat-navy'], ['surgery', 'Pembedahan', 'Surgery', 'flat-white'], ['dna', 'Biologi', 'Biology', 'flat-teal'],
    ['electrical', 'Elektrik', 'Electrical', 'flat-navy'], ['engineering', 'Kejuruteraan', 'Engineering', 'flat-indigo'], ['construction', 'Pembinaan', 'Construction', 'flat-sun'], ['islamic', 'Islamik', 'Islamic', 'flat-forest'],
    ['coding', 'Pengaturcaraan', 'Coding', 'flat-charcoal'], ['finance', 'Kewangan', 'Finance', 'flat-mint'], ['law', 'Undang-undang', 'Law', 'flat-sun'], ['math', 'Matematik', 'Math', 'flat-sky'],
    ['language', 'Bahasa', 'Language', 'flat-rose'], ['eco', 'Alam Sekitar', 'Eco', 'flat-mint'], ['art', 'Seni & Reka Bentuk', 'Art & Design', 'flat-white']];
  const layouts = { 'l-16': [L16, 1920, 1080, 'landscape', '16:9'], 'l-a4': [LA4, 1920, 1080, 'landscape', 'A4'], 'p-16': [P16, 1080, 1920, 'portrait', '16:9'], 'p-a4': [PA4, 1080, 1920, 'portrait', 'A4'] };
  Object.keys(layouts).forEach((lk) => {
    const [arr, cw, ch, orient, kind] = layouts[lk];
    DEC.forEach(([style, ms, en, theme], i) => {
      const build = arr[(i + 1) % arr.length];
      const o = { id: 'pr-deco-' + lk + '-' + style, orientation: orient, theme, fxStyle: theme, category: 'present', fxAnchor: orient === 'portrait' ? 1100 : 540, desc: 'Reka bentuk berhias (' + ms + '): masukkan ' + (kind === 'A4' ? 'PDF A4' : 'slaid 16:9') + ' dan ia terus masuk ke kawasan perbentangan.' };
      const font = FONTS[(n++) % FONTS.length];
      o.build = () => { const items = build(); items.unshift(wid('Latar hiasan', 'decor', 0, 0, cw, ch, { style })); items.forEach((s2) => { if (s2.type === 'widget' && !s2.props.font && !['logo', 'frame', 'bot', 'decor'].includes(s2.props.widget)) s2.props.font = font; }); return items; };
      out.push(named(o, kind, ms, en));
    });
  });
  G.templates.push(...out);
})();
