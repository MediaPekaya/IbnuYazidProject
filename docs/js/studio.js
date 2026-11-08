/** Studio: edit kandungan, pratonton langsung, kawalan siaran dan sambungan OBS. */
import { api } from './api.js';
import {
  renderStage, scaleToBox, getTemplate, buildData, buildSpec, templateSizes, sizeById,
  STYLES, BRIGHT_STYLE_IDS, GAMING_STYLE_IDS, safeUrl,
} from './engine.js';
import { h, icon, toast, debounce, copyText, fileToDataUrl, confirmDialog } from './ui.js';
import { mountObsPanel } from './obs-ui.js';
import { obs } from './obs.js';
import { overlayLink, liveState } from './link.js';
import { STATIC } from './mode.js';

const BADGES = ['LIVE', 'REC', 'KELAS', 'KUIZ', 'Q&A', 'WEBINAR', 'TUTOR', ''];

export async function mountStudio(view, id) {
  const { project } = await api('GET', `api/projects/${encodeURIComponent(id)}`);
  const tpl = getTemplate(project.templateId);
  if (!tpl) {
    view.replaceChildren(h('div', { class: 'empty' }, h('h3', {}, 'Templat tidak dijumpai'), h('p', {}, 'Templat untuk projek ini telah dialih keluar.'), h('a', { class: 'btn', href: '#/projek' }, 'Kembali ke projek')));
    return { destroy() {} };
  }

  /* ------------------------------ keadaan ------------------------------ */
  const media = { cam: null, screen: null };
  let obsView = false;
  const dirty = new Set();
  const dirtyMeta = {};
  let saveState = 'saved';
  let inflight = Promise.resolve();
  let destroyed = false;
  const cleanups = [];

  const eff = () => buildData(tpl, project.data);
  const overlayUrl = () => overlayLink(project).url;
  const kinds = () => {
    const spec = buildSpec(tpl, project.size.w, project.size.h);
    return new Set(spec ? [...spec.items.map((i) => i.k), ...spec.slots.map((s) => 'slot:' + s.kind)] : []);
  };

  /* ------------------------------ simpan ------------------------------ */
  const saveLabel = h('span', { class: 'saved', 'data-s': 'saved' });
  const setSave = (s) => {
    saveState = s;
    saveLabel.dataset.s = s;
    saveLabel.replaceChildren(icon(s === 'saved' ? 'check' : 'refresh'), { saved: 'Disimpan', saving: 'Menyimpan…', error: 'Gagal menyimpan' }[s]);
  };
  const doSave = () => {
    inflight = inflight.then(async () => {
      const metaBody = { ...dirtyMeta };
      const keys = [...dirty];
      const body = { ...metaBody };
      if (keys.length) body.data = Object.fromEntries(keys.map((k) => [k, project.data[k]]));
      if (!Object.keys(body).length) return;
      dirty.clear();
      Object.keys(dirtyMeta).forEach((k) => delete dirtyMeta[k]);
      try {
        await api('PATCH', `api/projects/${project.id}`, body);
        if (!dirty.size && !Object.keys(dirtyMeta).length) setSave('saved');
      } catch (e) {
        setSave('error');
        toast(e.message, 'error');
        keys.forEach((k) => dirty.add(k)); // cuba lagi pada simpanan seterusnya
        for (const [k, v] of Object.entries(metaBody)) if (!(k in dirtyMeta)) dirtyMeta[k] = v;
      }
    });
    return inflight;
  };
  const scheduleSave = debounce(doSave, 450);
  const patchData = (patch, { now = false } = {}) => {
    Object.assign(project.data, patch);
    Object.keys(patch).forEach((k) => dirty.add(k));
    setSave('saving');
    if (now) scheduleSave.flush(); else scheduleSave();
    schedulePaint();
    pushLive();
  };
  const patchMeta = (patch) => {
    Object.assign(project, patch);
    Object.assign(dirtyMeta, patch);
    setSave('saving');
    scheduleSave();
    pushLive();
  };

  /* ------------------------------ langsung (edisi statik) ------------------------------ */
  // Tanpa pelayan: keadaan dihantar ke overlay melalui BroadcastChannel (tab pratonton)
  // dan acara obs-browser (Browser Source dalam OBS).
  const channel = STATIC && 'BroadcastChannel' in window ? new BroadcastChannel('gs-live') : null;
  let pushTimer = 0;
  function pushLive() {
    if (!STATIC) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      const st = liveState(project);
      if (channel) channel.postMessage(st);
      if (obs.status === 'connected') obs.emitEvent('gs-state', st);
      refreshObsInfo();
    }, 120);
  }
  cleanups.push(() => { clearTimeout(pushTimer); if (channel) channel.close(); });

  /* ------------------------------ pratonton ------------------------------ */
  const inner = h('div');
  const frame = h('div', { class: 'stage-frame' }, inner);
  const stageWrap = h('div', { class: 'stage-wrap' }, frame);
  let raf = 0;
  const paint = () => {
    raf = 0;
    const s = project.size;
    const r = renderStage(inner, { templateId: project.templateId, size: { w: s.w, h: s.h }, data: project.data }, { mode: obsView ? 'overlay' : 'studio', media });
    fit(r);
  };
  const schedulePaint = () => { if (!raf) raf = requestAnimationFrame(paint); };
  const fit = (r) => {
    const s = project.size;
    const availW = Math.max(200, stageWrap.clientWidth - 28);
    const availH = Math.max(240, window.innerHeight - 330);
    const k = Math.min(1, availW / s.w, availH / s.h);
    frame.style.width = `${Math.round(s.w * k)}px`;
    frame.style.height = `${Math.round(s.h * k)}px`;
    const stage = r ? r.stage : inner.firstElementChild;
    if (stage) scaleToBox(stage, s.w, s.h, s.w * k, s.h * k);
  };
  const ro = new ResizeObserver(() => fit());
  ro.observe(stageWrap);
  cleanups.push(() => ro.disconnect());

  /* ------------------------------ kamera / skrin ------------------------------ */
  const camSelect = h('select', { class: 'select', style: { width: 'auto', minHeight: '34px', padding: '4px 10px', display: 'none' }, 'aria-label': 'Pilih kamera', onchange: () => startCam(camSelect.value) });
  const camBtn = h('button', { class: 'btn secondary sm', onclick: () => (media.cam ? stopMedia('cam') : startCam()) });
  const scrBtn = h('button', { class: 'btn secondary sm', onclick: () => (media.screen ? stopMedia('screen') : startScreen()) });
  const refreshMediaBtns = () => {
    camBtn.replaceChildren(icon('cam'), media.cam ? 'Matikan kamera' : 'Pratonton kamera');
    scrBtn.replaceChildren(icon('screen'), media.screen ? 'Henti kongsi skrin' : 'Pratonton skrin');
    camSelect.style.display = media.cam && camSelect.options.length > 1 ? '' : 'none';
  };
  function stopMedia(k) {
    if (media[k]) media[k].getTracks().forEach((t) => t.stop());
    media[k] = null;
    refreshMediaBtns();
    schedulePaint();
  }
  const mediaError = (e) => {
    if (!navigator.mediaDevices) return 'Kamera memerlukan sambungan selamat (https:// atau http://localhost).';
    if (e && e.name === 'NotAllowedError') return 'Kebenaran ditolak. Benarkan akses di tetapan pelayar.';
    if (e && e.name === 'NotFoundError') return 'Tiada kamera dijumpai.';
    if (e && e.name === 'NotReadableError') return 'Kamera sedang digunakan oleh aplikasi lain (cth. OBS). Tutup dahulu atau guna sumber OBS sahaja.';
    return (e && e.message) || 'Gagal mengakses media.';
  };
  async function startCam(deviceId) {
    try {
      if (!navigator.mediaDevices) throw new Error();
      if (media.cam) media.cam.getTracks().forEach((t) => t.stop());
      media.cam = await navigator.mediaDevices.getUserMedia({ video: deviceId ? { deviceId: { exact: deviceId } } : { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      const devs = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
      const cur = media.cam.getVideoTracks()[0].getSettings().deviceId;
      camSelect.replaceChildren(...devs.map((d, i) => h('option', { value: d.deviceId, selected: d.deviceId === cur }, d.label || `Kamera ${i + 1}`)));
      refreshMediaBtns();
      schedulePaint();
    } catch (e) { media.cam = null; refreshMediaBtns(); toast(mediaError(e), 'error', 5200); }
  }
  async function startScreen() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) throw new Error('Pelayar ini tidak menyokong kongsi skrin.');
      media.screen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      media.screen.getVideoTracks()[0].addEventListener('ended', () => stopMedia('screen'));
      refreshMediaBtns();
      schedulePaint();
    } catch (e) { media.screen = null; refreshMediaBtns(); if (!e || e.name !== 'NotAllowedError') toast(mediaError(e), 'error'); }
  }
  cleanups.push(() => { stopMedia('cam'); stopMedia('screen'); });

  /* ------------------------------ bina medan penyunting ------------------------------ */
  const field = (label, control, hint) => h('div', { class: 'field' }, h('label', {}, label), control, hint ? h('p', { class: 'hint' }, hint) : null);
  const textField = (label, key, { rows = 0, hint, placeholder } = {}) => {
    const c = rows
      ? h('textarea', { class: 'textarea', rows, value: eff()[key] ?? '', placeholder, oninput: (e) => patchData({ [key]: e.target.value }) })
      : h('input', { class: 'input', value: eff()[key] ?? '', placeholder, oninput: (e) => patchData({ [key]: e.target.value }) });
    return field(label, c, hint);
  };
  const toggle = (label, key) => {
    const input = h('input', { type: 'checkbox', checked: eff()[key] !== false && !!eff()[key], onchange: (e) => patchData({ [key]: e.target.checked }) });
    return h('label', { class: 'switch' }, h('span', {}, label), input);
  };
  const nested = (key, sub, value) => patchData({ [key]: { ...(eff()[key] || {}), [sub]: value } });
  // Ingat seksyen mana yang dibuka supaya binaan semula penyunting tidak menutupnya.
  const openState = new Map();
  const section = (title, body, open = true) => {
    const d = h('details', { class: 'p-sec', open: openState.has(title) ? openState.get(title) : open }, h('summary', {}, title), h('div', { class: 'p-body' }, body));
    d.addEventListener('toggle', () => openState.set(title, d.open));
    return d;
  };

  const uploadBtn = (label, onFile, opts) => {
    const input = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif', class: 'sr-only', tabIndex: -1 });
    input.addEventListener('change', async () => {
      const f = input.files && input.files[0];
      if (!f) return;
      try { onFile(await fileToDataUrl(f, opts)); } catch (e) { toast(e.message, 'error'); }
      input.value = '';
    });
    return h('span', {}, input, h('button', { class: 'btn secondary sm', type: 'button', onclick: () => input.click() }, icon('image'), label));
  };

  /* ----- editor Slaid ----- */
  function slidesEditor() {
    const wrap = h('div', { class: 'p-body', style: { padding: 0 } });
    const draw = () => {
      const d = eff();
      const slides = d.slides || [];
      const items = slides.map((s, i) => {
        const upd = (patch) => { const arr = [...(eff().slides || [])]; arr[i] = { ...arr[i], ...patch }; patchData({ slides: arr }); };
        const move = (dir) => { const arr = [...(eff().slides || [])]; const j = i + dir; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; patchData({ slides: arr, slide: j }); draw(); };
        const del = () => { const arr = [...(eff().slides || [])]; arr.splice(i, 1); patchData({ slides: arr, slide: Math.max(0, Math.min(eff().slide, arr.length - 1)) }); draw(); };
        const img = safeUrl(s.image);
        return h('div', { class: 'slide-item' + (Number(d.slide) === i ? ' cur' : '') },
          h('header', {},
            h('b', {}, `Slaid ${i + 1}`),
            h('button', { class: 'btn ghost ib', title: 'Papar slaid ini', 'aria-label': 'Papar slaid ini', onclick: () => { patchData({ slide: i }, { now: true }); draw(); } }, icon('eye')),
            h('button', { class: 'btn ghost ib', title: 'Naik', 'aria-label': 'Naikkan slaid', disabled: i === 0, onclick: () => move(-1) }, icon('up')),
            h('button', { class: 'btn ghost ib', title: 'Turun', 'aria-label': 'Turunkan slaid', disabled: i === slides.length - 1, onclick: () => move(1) }, icon('down')),
            h('button', { class: 'btn ghost ib', title: 'Padam', 'aria-label': 'Padam slaid', onclick: del }, icon('trash'))),
          h('input', { class: 'input', value: s.title || '', placeholder: 'Tajuk slaid', 'aria-label': 'Tajuk slaid', oninput: (e) => upd({ title: e.target.value }) }),
          h('textarea', { class: 'textarea', rows: 4, value: s.bullets || '', placeholder: 'Satu mata utama setiap baris', 'aria-label': 'Mata utama slaid', oninput: (e) => upd({ bullets: e.target.value }) }),
          h('div', { class: 'slide-img-row' },
            img ? h('img', { src: img, alt: '' }) : null,
            uploadBtn(img ? 'Tukar imej' : 'Tambah imej', (url) => { upd({ image: url }); draw(); }, { maxDim: 1280 }),
            img ? h('button', { class: 'btn ghost sm', onclick: () => { upd({ image: '' }); draw(); } }, 'Buang') : null));
      });
      wrap.replaceChildren(...items,
        h('button', { class: 'btn secondary', onclick: () => { patchData({ slides: [...(eff().slides || []), { title: `Slaid ${slides.length + 1}`, bullets: 'Mata utama pertama\nMata utama kedua', image: '' }], slide: slides.length }, { now: true }); draw(); } }, icon('plus'), 'Tambah slaid'));
    };
    draw();
    return wrap;
  }

  /* ----- editor Gaya ----- */
  function styleEditor() {
    const ids = STYLES[tpl.style].gaming ? GAMING_STYLE_IDS : BRIGHT_STYLE_IDS;
    const wrap = h('div', { class: 'p-body', style: { padding: 0 } });
    const draw = () => {
      const raw = eff().styleId || '';
      const cur = typeof raw === 'string' && Object.hasOwn(STYLES, raw) ? raw : '';
      const sw = [''].concat(ids).map((sid) => {
        const st = STYLES[sid || tpl.style];
        return h('button', {
          class: 'swatch', type: 'button', 'aria-pressed': String((cur || '') === sid),
          onclick: () => { patchData({ styleId: sid }, { now: true }); draw(); },
        }, h('i', { style: { background: `linear-gradient(135deg, ${st.bgA}, ${st.accent} 60%, ${st.accent2})`, border: `1px solid ${st.dark ? '#000' : 'rgba(0,0,0,.08)'}` } }), sid ? st.name : `Asal (${st.name})`);
      });
      const accent = h('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(eff().accent) ? eff().accent : STYLES[cur || tpl.style].accent, 'aria-label': 'Warna aksen', style: { width: '56px', height: '40px', border: '1px solid var(--line-2)', borderRadius: '10px', padding: '2px', background: '#fff' }, oninput: (e) => patchData({ accent: e.target.value }) });
      wrap.replaceChildren(
        h('div', { class: 'swatches' }, sw),
        h('div', { class: 'field' }, h('label', {}, 'Warna aksen tersuai'), h('div', { style: { display: 'flex', gap: '10px', alignItems: 'center' } }, accent,
          h('button', { class: 'btn ghost sm', onclick: () => { patchData({ accent: '' }, { now: true }); draw(); } }, 'Set semula'))),
        STYLES[tpl.style].gaming ? h('p', { class: 'hint' }, 'Gaya neon hanya untuk templat gaming. Templat lain menggunakan tema formal & cerah.') : null);
    };
    draw();
    return wrap;
  }

  /* ----- editor Saiz ----- */
  function sizeEditor() {
    const wrap = h('div', { class: 'p-body', style: { padding: 0 } });
    const draw = () => {
      wrap.replaceChildren(h('div', { class: 'size-grid' }, templateSizes(tpl).map((s) => {
        const k = 22 / Math.max(s.w, s.h);
        return h('button', {
          class: 'size-opt', type: 'button', 'aria-pressed': String(project.size.w === s.w && project.size.h === s.h),
          onclick: () => { patchMeta({ size: { id: s.id, w: s.w, h: s.h } }); draw(); rebuildEditor(); renderLiveBar(); refreshObsInfo(); schedulePaint(); },
        }, h('b', {}, h('span', { class: 'shape', style: { width: `${Math.max(6, Math.round(s.w * k))}px`, height: `${Math.max(6, Math.round(s.h * k))}px` } }), s.name),
        h('small', {}, `${s.ratio} • ${s.w}×${s.h}`), h('small', {}, s.use));
      })));
    };
    draw();
    return wrap;
  }

  /* ----- penyunting utama ----- */
  const editor = h('div');
  function rebuildEditor() {
    const k = kinds();
    const has = (...x) => x.some((i) => k.has(i));
    const d = eff();
    const secs = [];

    const main = [textField('Tajuk', 'title'), has('title', 'bigscene') ? textField('Subtajuk', 'subtitle') : null].filter(Boolean);
    if (has('title', 'bigscene', 'lower', 'quizQ')) secs.push(section('Teks utama', main));

    if (has('nameplate', 'lower')) {
      secs.push(section('Pembentang / peserta', [
        textField('Satu orang setiap baris', 'people', { rows: 4, hint: 'Format: Nama | Jawatan. Baris pertama ialah pembentang utama.' }),
        has('lower') ? toggle('Papar bar nama', 'lower') : null]));
    }
    if (has('ticker')) {
      secs.push(section('Teks berjalan', [
        toggle('Papar teks berjalan', 'tickerOn'), textField('Teks', 'ticker', { rows: 3 }), textField('Label', 'tickerLabel', { placeholder: 'INFO' })], false));
    }
    if (has('badge')) {
      const sel = h('select', { class: 'select', onchange: (e) => patchData({ badge: e.target.value }) }, BADGES.concat(BADGES.includes(d.badge) ? [] : [d.badge]).map((b) => h('option', { value: b, selected: b === d.badge }, b || '(tiada lencana)')));
      secs.push(section('Lencana', [field('Lencana', sel), textField('Atau teks sendiri', 'badge', { placeholder: 'LIVE' })], false));
    }
    if (has('quizQ')) {
      const q = d.quiz || {};
      secs.push(section('Kuiz', [
        field('Soalan', h('textarea', { class: 'textarea', rows: 2, value: q.q || '', oninput: (e) => nested('quiz', 'q', e.target.value) })),
        ...[0, 1, 2, 3].map((i) => h('div', { class: 'field' }, h('label', {}, `Pilihan ${'ABCD'[i]}`),
          h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } },
            h('input', { class: 'input', value: (q.options || [])[i] || '', oninput: (e) => { const o = [...((eff().quiz || {}).options || ['', '', '', ''])]; o[i] = e.target.value; nested('quiz', 'options', o); } }),
            h('input', { type: 'radio', name: 'quiz-ans', checked: Number(q.answer) === i, title: 'Jawapan betul', 'aria-label': `Jawapan betul ${'ABCD'[i]}`, onchange: () => nested('quiz', 'answer', i) })))),
        h('p', { class: 'hint' }, 'Tandakan bulatan untuk jawapan betul. Gunakan “Dedah jawapan” dalam kawalan langsung.')]));
    }
    if (has('countdown', 'bigscene')) {
      secs.push(section('Kira detik', [field('Tempoh (minit)', h('input', { class: 'input', type: 'number', min: 0, max: 600, value: d.countdownMin, oninput: (e) => patchData({ countdownMin: Number(e.target.value) || 0, countdownEnd: null }) }), 'Mula/henti kira detik di bar kawalan langsung.')], false));
    }
    if (has('goal')) {
      const g = d.goal || {};
      secs.push(section('Matlamat', [
        field('Label', h('input', { class: 'input', value: g.label || '', oninput: (e) => nested('goal', 'label', e.target.value) })),
        h('div', { class: 'row2' },
          field('Semasa', h('input', { class: 'input', type: 'number', value: g.current, oninput: (e) => nested('goal', 'current', Number(e.target.value) || 0) })),
          field('Sasaran', h('input', { class: 'input', type: 'number', value: g.target, oninput: (e) => nested('goal', 'target', Number(e.target.value) || 1) })))], false));
    }
    if (has('price')) secs.push(section('Produk', [textField('Harga', 'price'), textField('Ajakan bertindak', 'cta')]));
    if (has('slide', 'agenda')) secs.push(section('Slaid & agenda', slidesEditor()));
    if (has('chips', 'handle')) {
      secs.push(section('Sosial', [has('chips') ? textField('Hashtag (asing dengan koma)', 'topics') : null, has('handle') ? textField('Akaun sosial (asing dengan |)', 'handle') : null].filter(Boolean), false));
    }
    if (has('logo')) {
      const logoUrl = safeUrl(d.logo);
      secs.push(section('Jenama & logo', [
        textField('Nama jenama', 'brand'),
        h('div', { class: 'slide-img-row' }, logoUrl ? h('img', { src: logoUrl, alt: '' }) : null,
          uploadBtn(logoUrl ? 'Tukar logo' : 'Muat naik logo', (url) => { patchData({ logo: url }, { now: true }); rebuildEditor(); }, { maxDim: 512, png: true }),
          logoUrl ? h('button', { class: 'btn ghost sm', onclick: () => { patchData({ logo: '' }, { now: true }); rebuildEditor(); } }, 'Buang') : null)], false));
    }
    secs.push(section('Gaya & warna', styleEditor(), false));
    secs.push(section('Saiz & format', sizeEditor(), false));
    editor.replaceChildren(...secs);
  }

  /* ------------------------------ bar kawalan langsung ------------------------------ */
  const liveBar = h('div', { class: 'panel live-bar' });
  function renderLiveBar() {
    const k = kinds();
    const has = (...x) => x.some((i) => k.has(i));
    const d = eff();
    const groups = [];
    const n = (d.slides || []).length;
    const go = (delta) => { const cur = Number(eff().slide) || 0; const nx = Math.max(0, Math.min(n - 1, cur + delta)); if (nx !== cur) { patchData({ slide: nx }, { now: true }); renderLiveBar(); } };
    if (has('slide', 'agenda') && n) {
      groups.push(h('div', { class: 'group' }, h('span', { class: 'glabel' }, 'Slaid'),
        h('button', { class: 'btn secondary sm', 'aria-label': 'Slaid sebelum', onclick: () => go(-1), disabled: (Number(d.slide) || 0) <= 0 }, icon('left')),
        h('b', { style: { minWidth: '44px', textAlign: 'center' } }, `${(Number(d.slide) || 0) + 1} / ${n}`),
        h('button', { class: 'btn secondary sm', 'aria-label': 'Slaid seterusnya', onclick: () => go(1), disabled: (Number(d.slide) || 0) >= n - 1 }, icon('right'))));
    }
    const tgl = (label, key, hot) => h('button', {
      class: 'btn sm ' + (eff()[key] === false ? 'secondary' : ''), 'aria-pressed': String(eff()[key] !== false),
      onclick: () => { patchData({ [key]: eff()[key] === false }, { now: true }); renderLiveBar(); rebuildEditor(); },
    }, label, ' ', h('span', { class: 'kbd' }, hot));
    const disp = [];
    if (has('lower')) disp.push(tgl('Bar nama', 'lower', 'L'));
    if (has('ticker')) disp.push(tgl('Teks berjalan', 'tickerOn', 'T'));
    if (disp.length) groups.push(h('div', { class: 'group' }, h('span', { class: 'glabel' }, 'Papar'), disp));
    if (has('quizQ')) {
      const rv = !!(d.quiz || {}).reveal;
      groups.push(h('div', { class: 'group' }, h('span', { class: 'glabel' }, 'Kuiz'),
        h('button', { class: 'btn sm ' + (rv ? '' : 'secondary'), onclick: () => { nested('quiz', 'reveal', !rv); renderLiveBar(); } }, rv ? 'Sorok jawapan' : 'Dedah jawapan', ' ', h('span', { class: 'kbd' }, 'R'))));
    }
    if (has('countdown', 'bigscene')) {
      const running = !!d.countdownEnd && Number(d.countdownEnd) > Date.now();
      groups.push(h('div', { class: 'group' }, h('span', { class: 'glabel' }, 'Kira detik'),
        h('button', { class: 'btn sm', onclick: () => { patchData({ countdownEnd: Date.now() + (Number(eff().countdownMin) || 0) * 60000 }, { now: true }); renderLiveBar(); } }, icon('play'), 'Mula'),
        h('button', { class: 'btn secondary sm', onclick: () => { patchData({ countdownEnd: null }, { now: true }); renderLiveBar(); } }, 'Set semula'), running ? h('span', { class: 'hint' }, 'berjalan') : null));
    }
    liveBar.replaceChildren(...groups, h('span', { class: 'hint' }, groups.length ? 'Perubahan dihantar terus ke OBS.' : 'Templat ini tiada kawalan langsung.'));
  }

  const onKey = (e) => {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = kinds();
    const d = eff();
    const n = (d.slides || []).length;
    if (e.key === 'ArrowRight' && k.has('slide') && n) { e.preventDefault(); const nx = Math.min(n - 1, (Number(d.slide) || 0) + 1); if (nx !== Number(d.slide)) { patchData({ slide: nx }, { now: true }); renderLiveBar(); } }
    else if (e.key === 'ArrowLeft' && k.has('slide') && n) { e.preventDefault(); const nx = Math.max(0, (Number(d.slide) || 0) - 1); if (nx !== Number(d.slide)) { patchData({ slide: nx }, { now: true }); renderLiveBar(); } }
    else if ((e.key === 'l' || e.key === 'L') && k.has('lower')) { patchData({ lower: d.lower === false }, { now: true }); renderLiveBar(); rebuildEditor(); }
    else if ((e.key === 't' || e.key === 'T') && k.has('ticker')) { patchData({ tickerOn: d.tickerOn === false }, { now: true }); renderLiveBar(); rebuildEditor(); }
    else if ((e.key === 'r' || e.key === 'R') && k.has('quizQ')) { nested('quiz', 'reveal', !(d.quiz || {}).reveal); renderLiveBar(); }
  };
  document.addEventListener('keydown', onKey);
  cleanups.push(() => document.removeEventListener('keydown', onKey));

  /* ------------------------------ panel OBS ------------------------------ */
  let openLink = null;
  const urlInput = h('input', { class: 'input', readOnly: true, value: overlayUrl(), 'aria-label': 'Pautan Browser Source', onfocus: (e) => e.target.select() });
  const sizeInfo = h('p', { class: 'hint' });
  const sizeTag = h('span', { class: 'tag muted' });
  let warnedTrim = false;
  const refreshObsInfo = () => {
    sizeTag.textContent = `${project.size.w}×${project.size.h}`;
    const link = overlayLink(project);
    urlInput.value = link.url;
    if (openLink) openLink.href = link.url;
    if (link.trimmed && !warnedTrim) { warnedTrim = true; toast('Imej besar tidak disertakan dalam pautan overlay edisi statik. Guna imej dengan URL https:// atau pelayan penuh.', 'error', 7000); }
    sizeInfo.replaceChildren('Dalam OBS tetapkan Width ', h('b', {}, String(project.size.w)), ' dan Height ', h('b', {}, String(project.size.h)), '.');
  };
  refreshObsInfo();
  const obsHost = h('div');
  const obsPanel = mountObsPanel(obsHost, { project, overlayUrl });
  cleanups.push(() => obsPanel.destroy());

  const rightPanel = h('aside', { class: 'panel panel-right' },
    h('details', { class: 'p-sec', open: true }, h('summary', {}, '1. Pautan Browser Source'),
      h('div', { class: 'p-body' },
        h('div', { class: 'url-box' }, urlInput,
          h('button', { class: 'btn secondary sm', title: 'Salin pautan', 'aria-label': 'Salin pautan', style: { minHeight: '40px' }, onclick: async () => toast((await copyText(urlInput.value)) ? 'Pautan disalin.' : 'Gagal menyalin; pilih dan salin secara manual.', 'ok') }, icon('copy'))),
        sizeInfo,
        STATIC ? h('p', { class: 'hint' }, 'Edisi statik: pautan ini membawa keadaan projek. Apabila OBS bersambung, suntingan dihantar terus ke overlay; jika tidak, salin semula pautan selepas menyunting.') : null,
        h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
          (openLink = h('a', { class: 'btn secondary sm', href: overlayUrl(), target: '_blank', rel: 'noopener' }, icon('open'), 'Buka overlay')),
          STATIC ? null : h('button', {
            class: 'btn ghost sm',
            onclick: async () => {
              const ok = await confirmDialog({ title: 'Tukar pautan?', message: 'Pautan lama akan berhenti berfungsi. Anda perlu memasang semula overlay di OBS.', confirmText: 'Tukar pautan' });
              if (!ok) return;
              try { const r = await api('POST', `api/projects/${project.id}/rotate`, {}); project.token = r.project.token; refreshObsInfo(); toast('Pautan baharu dijana. Pasang semula di OBS.', 'ok'); } catch (e) { toast(e.message, 'error'); }
            },
          }, icon('refresh'), 'Tukar pautan')))),
    h('details', { class: 'p-sec', open: true }, h('summary', {}, '2. Sambung & kawal OBS'), h('div', { class: 'p-body' }, obsHost)),
    h('details', { class: 'p-sec' }, h('summary', {}, 'Panduan ringkas'),
      h('div', { class: 'p-body' }, h('ol', { class: 'steps' },
        h('li', {}, 'Tekan ', h('b', {}, 'Pasang ke OBS'), ' atau tambah Browser Source secara manual dengan pautan di atas.'),
        h('li', {}, 'Tambah kamera / tangkap skrin di OBS dan letak ', h('b', {}, 'di bawah'), ' overlay.'),
        h('li', {}, 'Edit teks dan slaid di sini; OBS dikemas kini serta-merta.'),
        h('li', {}, 'Tekan ', h('b', {}, 'Mula rakam'), ' atau ', h('b', {}, 'Mula siaran'), '.')),
      h('a', { href: '#/obs' }, 'Panduan penuh & penyelesaian masalah'))));

  /* ------------------------------ susun atur studio ------------------------------ */
  const nameInput = h('input', { value: project.name, 'aria-label': 'Nama projek', maxLength: 80, onchange: (e) => patchMeta({ name: e.target.value.trim() || project.name }) });
  const viewToggle = h('button', { class: 'btn secondary sm', 'aria-pressed': 'false', onclick: () => {
    obsView = !obsView;
    viewToggle.setAttribute('aria-pressed', String(obsView));
    viewToggle.replaceChildren(icon('eye'), obsView ? 'Pandangan OBS: lutsinar' : 'Pandangan studio');
    stageWrap.classList.toggle('obsview', obsView);
    schedulePaint();
  } });
  viewToggle.replaceChildren(icon('eye'), 'Pandangan studio');
  refreshMediaBtns();

  const stageCol = h('section', { class: 'stage-col' },
    h('div', { class: 'stage-bar' },
      h('div', { class: 'left' }, h('a', { class: 'btn ghost sm', href: '#/projek' }, icon('left'), 'Projek'),
        h('div', { class: 'stage-title' }, nameInput), saveLabel),
      h('div', { class: 'right' }, sizeTag, h('span', { class: 'tag' + (STYLES[tpl.style].gaming ? ' gaming' : '') }, tpl.name))),
    stageWrap,
    h('div', { class: 'stage-bar' }, h('div', { class: 'left' }, camBtn, camSelect, scrBtn), h('div', { class: 'right' }, viewToggle)),
    liveBar,
    h('p', { class: 'hint-row' }, 'Pratonton kamera/skrin hanya untuk rujukan susun atur. Dalam siaran sebenar, kamera dan skrin datang dari OBS (di bawah overlay).'));

  const layout = h('div', { class: 'studio' }, h('aside', { class: 'panel panel-left' }, editor), stageCol, rightPanel);
  view.replaceChildren(layout);
  setSave('saved');
  rebuildEditor();
  renderLiveBar();
  paint();
  // elemen belum ada saiz pada paint pertama
  requestAnimationFrame(() => fit());

  return {
    destroy() {
      destroyed = true;
      scheduleSave.cancel();
      if (STATIC && obs.status === 'connected') obs.setOverlayUrl(project.name, overlayUrl()).catch(() => {});
      cleanups.forEach((f) => { try { f(); } catch { /* abaikan */ } });
      if (dirty.size || Object.keys(dirtyMeta).length) doSave();
    },
  };
}
