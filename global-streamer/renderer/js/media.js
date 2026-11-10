/* Global Streamer - sumber media: capture card / kamera / skrin / imej */
(function () {
  'use strict';
  const M = (GS.media = { videos: {}, images: {} });

  const captureConstraints = (deviceId, kind) => ({
    video: {
      deviceId: deviceId ? { exact: deviceId } : undefined,
      width: { ideal: kind === 'capture' ? 1920 : 1280 },
      height: { ideal: kind === 'capture' ? 1080 : 720 },
      frameRate: { ideal: kind === 'capture' ? 60 : 30 },
    },
    audio: false,
  });

  function makeVideoEl(stream) {
    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.autoplay = true;
    v.srcObject = stream;
    v.play().catch(() => {});
    return v;
  }

  M.open = async function (sourceId, kind, deviceId, opts) {
    M.close(sourceId);
    // kongsi aliran jika peranti sama sudah dibuka (capture card biasanya hanya boleh dibuka sekali)
    if (deviceId && kind !== 'screen') {
      const shared = Object.values(M.videos).find((v) => v.deviceId === deviceId && v.kind !== 'screen' && v.stream.active);
      if (shared) {
        M.videos[sourceId] = shared;
        GS.emit('media:changed', sourceId);
        return shared;
      }
    }
    let stream;
    if (kind === 'screen') {
      // app Windows: pemilih skrin/tetingkap sendiri (pelayar web guna pemilih bawaannya)
      if (window.gsNative && window.gsNative.sources && !(opts && opts.skipPicker)) {
        const id = await M.pickScreen({ windowOnly: !!(opts && opts.windowOnly) });
        if (!id) { const e = new Error('dibatalkan'); e.name = 'NotAllowedError'; throw e; }
        await window.gsNative.sources.select(id);
      }
      const vc = { frameRate: { ideal: 60 } };
      if (opts && opts.windowOnly) vc.displaySurface = 'window'; // pelayar web: cadangkan tab "Window"
      stream = await navigator.mediaDevices.getDisplayMedia({ video: vc, audio: false });
    } else {
      try {
        stream = await navigator.mediaDevices.getUserMedia(captureConstraints(deviceId, kind));
      } catch (e) {
        // peranti baru dilepaskan (tukar sumber) atau pemacu perlukan sedikit masa: cuba sekali lagi
        if (e && e.name === 'NotReadableError') {
          await new Promise((r) => setTimeout(r, 700));
          try { stream = await navigator.mediaDevices.getUserMedia(captureConstraints(deviceId, kind)); } catch (e2) {
            // sandaran: tetapan paling ringan (sesetengah capture card menolak 1080p60)
            stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: deviceId ? { exact: deviceId } : undefined }, audio: false });
          }
        } else if (e && e.name === 'OverconstrainedError') {
          stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: deviceId ? { exact: deviceId } : undefined }, audio: false });
        } else throw e;
      }
    }
    const video = makeVideoEl(stream);
    const track = stream.getVideoTracks()[0];
    const entry = { video, stream, kind, deviceId: deviceId || track.getSettings().deviceId || '', label: track.label, settings: track.getSettings() };
    track.addEventListener('ended', () => {
      Object.keys(M.videos).forEach((k) => { if (M.videos[k] === entry) delete M.videos[k]; });
      entry.video.srcObject = null;
      GS.toast('Isyarat video terputus. Semak sambungan capture card/kamera.', 'warn');
      GS.emit('media:changed');
    });
    M.videos[sourceId] = entry;
    GS.emit('media:changed', sourceId);
    return entry;
  };

  M.close = function (sourceId) {
    const v = M.videos[sourceId];
    if (!v) return;
    delete M.videos[sourceId];
    if (Object.values(M.videos).includes(v)) return; // masih digunakan oleh sumber lain
    v.stream.getTracks().forEach((t) => t.stop());
    v.video.srcObject = null;
  };

  M.rename = function (oldId, newId) {
    if (M.videos[oldId]) {
      M.videos[newId] = M.videos[oldId];
      delete M.videos[oldId];
    }
  };

  M.listVideoDevices = async function () {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('Pelayar tidak menyokong akses peranti.');
    const list = async () => (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
    // Jika kebenaran sudah diberi, nama peranti sudah ada: TIDAK perlu membuka kamera (elak "Device in use").
    let devs = await list();
    if (devs.length && devs.every((d) => d.label)) return devs;
    // Belum ada kebenaran/nama: minta kebenaran sekali. Jika kamera lalai sedang digunakan (OBS, Zoom, tab lain, sumber lain
    // dalam app), ujian ini boleh gagal; itu BUKAN sebab untuk menolak pemilihan, jadi teruskan dengan senarai yang ada.
    try {
      const probe = await navigator.mediaDevices.getUserMedia({ video: true });
      probe.getTracks().forEach((t) => t.stop());
    } catch (e) {
      if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) throw e;
      if (!devs.length) throw e;
    }
    devs = await list();
    return devs;
  };

  /** Mesej ralat peranti yang mudah difahami. */
  M.deviceError = function (e) {
    const n = e && e.name;
    if (n === 'NotReadableError' || /in use|could not start/i.test((e && e.message) || '')) return GS.t('Peranti sedang digunakan oleh app atau tab lain (OBS, Zoom, Teams, tab pelayar lain). Tutup yang lain, atau pilih peranti yang sama pada sumber lain dalam app ini (ia akan berkongsi aliran).');
    if (n === 'NotAllowedError') return GS.t('Kebenaran kamera ditolak. Benarkan kamera untuk laman ini dalam tetapan pelayar.');
    if (n === 'NotFoundError' || n === 'OverconstrainedError') return GS.t('Peranti tidak dijumpai. Pastikan ia disambung dan cuba pilih semula.');
    return (e && (e.message || e.name)) || '';
  };

  /* pilih peranti + buka. kind: 'capture' | 'camera' | 'screen' */
  /** Pemilih skrin/tetingkap (app Windows): kisi bergambar kecil; kembalikan id sumber atau '' jika dibatalkan. */
  M.pickScreen = async function (opts) {
    const windowOnly = !!(opts && opts.windowOnly);
    const screensOnly = !!(opts && opts.screensOnly);
    let list;
    try { list = await window.gsNative.sources.list(); } catch (e) { GS.toast(GS.t('Gagal kongsi skrin: {0}', GS.t(e.message)), 'warn'); return ''; }
    if (!list.length) { GS.toast(GS.t('Tiada skrin atau tetingkap dijumpai.'), 'warn'); return ''; }
    return new Promise((resolve) => {
      let done = false;
      const finish = (id, m) => { if (done) return; done = true; if (m) m.close(); resolve(id); };
      let tab = windowOnly ? 'window' : 'screen';
      if (screensOnly) list = list.filter((x) => x.kind === 'screen');
      const grid = GS.h('div', { class: 'src-grid' });
      const draw = () => {
        grid.innerHTML = '';
        list.filter((s) => s.kind === tab).forEach((s) => grid.append(GS.h('button', { class: 'src-card', title: s.name, 'data-id': s.id, onClick: () => finish(s.id, modal) },
          s.thumb ? GS.h('img', { src: s.thumb, alt: '' }) : GS.h('div', { class: 'src-empty' }, GS.icon('monitor', 28)), GS.h('span', null, s.name))));
        if (!grid.children.length) grid.append(GS.h('div', { class: 'empty' }, GS.t('Tiada paparan.')));
      };
      const tabs = screensOnly ? GS.h('p', { class: 'muted' }, 'Pilih skrin (monitor) yang mahu dirakam. Semua aplikasi yang dibuka pada skrin itu akan dirakam.') : windowOnly ? GS.h('p', { class: 'muted' }, 'Pilih app atau game yang mahu dipaparkan (cth Steam atau game anda). Hanya tetingkap itu yang disiarkan; paparan lain tidak kelihatan. Biarkan tetingkap itu terbuka (jangan diminimumkan).') : GS.h('div', { class: 'subtabs' }, [['screen', 'Skrin'], ['window', 'Tetingkap']].map(([k, l]) =>
        GS.h('button', { class: 'subtab' + (k === tab ? ' on' : ''), 'data-tab': k, onClick: (e) => { tab = k; GS.$$('.subtab', tabs).forEach((b) => b.classList.toggle('on', b === e.currentTarget)); draw(); } }, l)));
      draw();
      const modal = GS.modal({ title: screensOnly ? 'Pilih skrin untuk dirakam' : windowOnly ? 'Pilih tetingkap game / app PC' : 'Pilih skrin atau tetingkap', body: GS.h('div', null, tabs, grid), wide: true, onClose: () => finish('', null) });
    });
  };

  /* Capture card (HDMI) vs webcam: dikenal pasti daripada nama peranti. Webcam tidak disenaraikan di bawah Capture Card. */
  const CAPTURE_RE = /(capture|hdmi|elgato|cam\s?link|avermedia|live\s?gamer|blackmagic|decklink|intensity|ultrastudio|magewell|\bms2\d{3}\b|\bms9\d{3}\b|usb\s?3(\.0)?\s?video|usb\s?video|gc\d{3}|hd60|4k60|ezcap|easycap|grabber|ripsaw|startech|j5create|atem|composite|s-?video|component|av\s?input|pcie|hd\s?pvr|game\s?(link|capture)|video\s?card)/i;
  const WEBCAM_RE = /(web\s?cam|integrated|built-?in|facetime|face\s?cam|infrared|\bir\b|\bc9\d{2}\b|\bc2\d{2}\b|\bbrio\b|stream\s?cam|lifecam|kiyo|obsbot|insta360|hd\s?camera|\bcamera\b)/i;
  M.isWebcam = (label) => !!label && (/(facecam|face\s?cam|web\s?cam|stream\s?cam|kiyo)/i.test(label) || (!CAPTURE_RE.test(label) && WEBCAM_RE.test(label)));
  M.isCaptureCard = (label) => !!label && CAPTURE_RE.test(label) && !/(facecam|face\s?cam|web\s?cam|stream\s?cam|kiyo)/i.test(label);
  /** Bahagikan peranti: capture card dikenali, lain-lain (bukan webcam), webcam. */
  M.classifyDevices = function (devs) {
    const cards = [], other = [], cams = [];
    devs.forEach((d) => (M.isCaptureCard(d.label) ? cards : M.isWebcam(d.label) ? cams : other).push(d));
    return { cards, other, cams };
  };

  M.pick = async function (source) {
    const kind = source.props.kind;
    if (kind === 'screen') {
      try {
        const e = await M.open(source.id, 'screen', null, { windowOnly: source.props.mode === 'window' });
        source.props.deviceLabel = (e && e.label) || '';
        return true;
      } catch (e) {
        if (e.name !== 'NotAllowedError') GS.toast(GS.t('Gagal kongsi skrin: {0}', GS.t(e.message)), 'warn');
        return false;
      }
    }
    let devs;
    try {
      devs = await M.listVideoDevices();
    } catch (e) {
      GS.toast(GS.t('Tiada akses ke kamera/capture card: {0}', M.deviceError(e)), 'warn');
      return false;
    }
    if (!devs.length && kind !== 'capture') {
      GS.toast('Tiada peranti video dijumpai. Pasang capture card dan cuba lagi.', 'warn');
      return false;
    }
    return new Promise((resolve) => {
      let done = false;
      const finish = (v) => { if (!done) { done = true; resolve(v); } };
      const choose = async (d) => {
        try {
          await M.open(source.id, kind, d.deviceId);
          source.props.deviceId = d.deviceId;
          source.props.deviceLabel = d.label;
          GS.save();
          m.close();
          finish(true);
        } catch (e) {
          GS.toast(GS.t('Gagal buka peranti: {0}', M.deviceError(e)), 'warn');
        }
      };
      const btn = (d, i) => GS.h('button', { class: 'device', 'data-dev': d.deviceId, onClick: () => choose(d) },
        GS.h('span', { html: GS.icon(kind === 'capture' ? 'monitor' : 'camera', 16) }), GS.h('span', null, d.label || GS.t('Peranti video {0}', i + 1)));
      const body = GS.h('div');
      const draw = () => {
        body.innerHTML = '';
        const cls = M.classifyDevices(devs);
        if (kind === 'capture') {
          // Capture card sahaja (kabel HDMI daripada konsol/PC/telefon). Webcam TIDAK disenaraikan di sini: guna sumber "Kamera".
          body.append(GS.h('p', { class: 'muted' }, 'Hanya peranti capture card (input HDMI) disenaraikan di sini. Webcam dan kamera dipilih melalui sumber "Kamera / Webcam".'));
          if (cls.cards.length) body.append(GS.h('div', { class: 'device-list', 'data-list': 'cards' }, cls.cards.map(btn)));
          else body.append(GS.h('div', { class: 'empty', 'data-empty': '1' }, GS.t('Tiada capture card dikesan. Sambungkan kabel HDMI daripada konsol/PC ke capture card, pastikan ia dipasang ke USB, kemudian tekan Segar semula.')));
          if (cls.other.length) {
            body.append(GS.h('details', { class: 'dev-adv' }, GS.h('summary', null, GS.t('Peranti video lain (jika capture card anda tiada dalam senarai)')),
              GS.h('div', { class: 'device-list', 'data-list': 'other' }, cls.other.map(btn))));
          }
          body.append(GS.h('div', { class: 'btn-row' }, GS.h('button', { class: 'btn ghost', onClick: async () => { try { devs = await M.listVideoDevices(); } catch (e) { GS.toast(M.deviceError(e), 'warn'); } draw(); } }, 'Segar semula')));
        } else {
          body.append(GS.h('p', { class: 'muted' }, 'Pilih kamera/webcam anda.'));
          body.append(GS.h('div', { class: 'device-list' }, cls.cams.concat(cls.other, cls.cards).map(btn)));
        }
      };
      draw();
      const m = GS.modal({ title: kind === 'capture' ? 'Pilih Capture Card' : 'Pilih Kamera', body, onClose: () => finish(false) });
    });
  };

  /* cuba sambung semula peranti tersimpan (senyap, jika kebenaran sudah diberi) */
  M.autoReconnect = async function (scenes) {
    for (const sc of scenes) {
      for (const s of sc.sources) {
        if (s.type === 'video' && s.props.deviceId && s.props.kind !== 'screen' && !M.videos[s.id]) {
          try { await M.open(s.id, s.props.kind, s.props.deviceId); } catch (e) { /* peranti tiada / kebenaran belum diberi */ }
        }
      }
    }
  };

  /* ---------- klip sendiri (banner imej, GIF animasi, video) untuk footer dan lain-lain ---------- */
  M.clips = {};
  const fileUrl = (p) => 'file:///' + String(p).replace(/\\/g, '/').split('/').map((x, i) => (i === 0 && /^[A-Za-z]:$/.test(x) ? x : encodeURIComponent(x))).join('/').replace(/^file:\/\/\/\//, 'file:///');
  M.clipFileUrl = fileUrl;
  /** Cipta elemen main (video atau imej) untuk sumber klip. Elemen dikekalkan dalam DOM (di luar skrin) supaya terus bergerak. */
  M.makeClip = function (id, url, kind, opts) {
    M.removeClip(id);
    opts = opts || {};
    let el;
    if (kind === 'video') {
      el = document.createElement('video');
      el.muted = true; el.loop = opts.loop !== false; el.playsInline = true; el.autoplay = true; el.preload = 'auto';
      el.src = url;
      el.play().catch(() => { /* autoplay disekat: diulang apabila ada isyarat pengguna */ });
    } else {
      el = new Image();
      el.decoding = 'sync';
      el.src = url;
    }
    el.setAttribute('aria-hidden', 'true');
    Object.assign(el.style, { position: 'fixed', left: '-9999px', top: '0', width: '4px', height: '4px', opacity: '0.01', pointerEvents: 'none' });
    document.body.append(el);
    const rec = { el, url, kind, ready: false, error: '' };
    const ok = () => { rec.ready = true; GS.emit('media:changed', id); };
    if (kind === 'video') { el.addEventListener('loadeddata', ok); } else { el.addEventListener('load', ok); }
    el.addEventListener('error', () => { rec.error = 'tidak dapat dimainkan'; GS.emit('media:changed', id); });
    M.clips[id] = rec;
    return rec;
  };
  M.removeClip = function (id) {
    const r = M.clips[id];
    if (!r) return;
    try { if (r.kind === 'video') { r.el.pause(); r.el.removeAttribute('src'); r.el.load(); } } catch (e) { /* abaikan */ }
    try { r.el.remove(); } catch (e) { /* abaikan */ }
    if (r.url && r.url.startsWith('blob:')) { try { URL.revokeObjectURL(r.url); } catch (e) { /* abaikan */ } }
    delete M.clips[id];
  };
  /** Pulihkan klip selepas app dibuka semula (laluan fail dalam app Windows; imej kecil dalam web). */
  M.restoreClips = function (scenes) {
    scenes.forEach((sc) => sc.sources.forEach((s) => {
      if (s.type !== 'clip' || M.clips[s.id]) return;
      const c = s.props || {};
      const url = c.path ? fileUrl(c.path) : c.src || '';
      if (url) M.makeClip(s.id, url, c.kind === 'video' ? 'video' : 'image', c);
    }));
  };

  M.image = function (src) {
    if (!src) return null;
    let im = M.images[src];
    if (!im) {
      im = new Image();
      im.src = src;
      M.images[src] = im;
    }
    return im.complete && im.naturalWidth ? im : null;
  };

  M.readFile = (file) => new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = () => rej(fr.error);
    fr.readAsDataURL(file);
  });

  /* kecilkan imej besar sebelum simpan (had storan) */
  M.downscale = (dataUrl, max = 512) => new Promise((res) => {
    const im = new Image();
    im.onload = () => {
      const r = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
      if (r >= 1) return res(dataUrl);
      const c = document.createElement('canvas');
      c.width = Math.round(im.naturalWidth * r);
      c.height = Math.round(im.naturalHeight * r);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      res(c.toDataURL('image/png'));
    };
    im.onerror = () => res(dataUrl);
    im.src = dataUrl;
  });
})();
