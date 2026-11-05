<script>
/* =====================================================================
   KUALITI TINGGI: pica (Lanczos + unsharp mask) & AI Remove Background
   ===================================================================== */
LIBS.pica = 'https://cdnjs.cloudflare.com/ajax/libs/pica/9.0.1/pica.min.js';
LIBS.transformers = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2';
let PICA = null;
/* Ubah saiz kualiti studio (Lanczos3 + unsharp). Jatuh balik ke resample() jika pustaka gagal. */
async function hqResize(src, w, h, sharpen = true) {
  w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
  try {
    await loadScript(LIBS.pica);
    PICA = PICA || window.pica({ features: ['js', 'wasm', 'ww'] });
    const from = src instanceof HTMLCanvasElement ? src : toCanvas(src);
    const to = makeCanvas(w, h);
    const down = w < from.width;
    await PICA.resize(from, to, { filter: 'lanczos3', unsharpAmount: sharpen && down ? 70 : 0, unsharpRadius: 0.6, unsharpThreshold: 2 });
    return to;
  } catch (e) { console.warn('pica gagal, guna kanvas:', e); return resample(src, w, h); }
}

/* ---------- AI model (RMBG-1.4 oleh BRIA AI, ONNX) ---------- */
const RMBG = { T: null, model: null, proc: null, dtype: null };
async function loadRmbg(dtype, onProgress) {
  if (RMBG.model && RMBG.dtype === dtype) return RMBG;
  const T = RMBG.T || await import(LIBS.transformers);
  RMBG.T = T; T.env.allowLocalModels = false;
  const files = {};
  const progress_callback = p => {
    if (p.status === 'progress' && p.file) { files[p.file] = [p.loaded || 0, p.total || 0]; const v = Object.values(files); const l = v.reduce((a, b) => a + b[0], 0), t = v.reduce((a, b) => a + b[1], 0); onProgress && onProgress(t ? l / t : 0, l, t); }
  };
  let device = 'wasm';
  if (navigator.gpu) { try { const a = await navigator.gpu.requestAdapter(); if (a) device = 'webgpu'; } catch { } }
  const opts = { config: { model_type: 'custom' }, dtype, progress_callback };
  try { RMBG.model = await T.AutoModel.from_pretrained('briaai/RMBG-1.4', { ...opts, device }); }
  catch (e) { if (device === 'wasm') throw e; console.warn('WebGPU gagal, guna WASM', e); device = 'wasm'; RMBG.model = await T.AutoModel.from_pretrained('briaai/RMBG-1.4', { ...opts, device }); }
  RMBG.proc = RMBG.proc || await T.AutoProcessor.from_pretrained('briaai/RMBG-1.4', { config: { do_normalize: true, do_pad: false, do_rescale: true, do_resize: true, image_mean: [0.5, 0.5, 0.5], feature_extractor_type: 'ImageFeatureExtractor', image_std: [1, 1, 1], resample: 2, rescale_factor: 0.00392156862745098, size: { width: 1024, height: 1024 } } });
  RMBG.dtype = dtype; RMBG.device = device;
  return RMBG;
}
/* Kembalikan topeng (mask) kelabu 0..255 sebagai kanvas pada resolusi model */
async function predictMask(file) {
  const { T, model, proc } = RMBG;
  const image = await T.RawImage.fromBlob(file);
  const { pixel_values } = await proc(image);
  const { output } = await model({ input: pixel_values });
  const m = await T.RawImage.fromTensor(output[0].mul(255).to('uint8'));
  const c = makeCanvas(m.width, m.height), x = c.getContext('2d'), id = x.createImageData(m.width, m.height);
  const ch = m.channels || 1;
  for (let i = 0, j = 0; j < m.width * m.height; j++, i += ch) { const v = m.data[i]; id.data[j * 4] = id.data[j * 4 + 1] = id.data[j * 4 + 2] = v; id.data[j * 4 + 3] = 255; }
  x.putImageData(id, 0, 0);
  return c;
}

registerTool({
  id: 'remove-background', cat: 'edit', name: 'Remove Background (AI)', icon: 'magic', popular: true,
  desc: 'Buang latar belakang secara automatik dengan AI dalam browser. Hasil PNG lutsinar resolusi penuh, atau tukar latar ke warna, kabur atau gambar lain.',
  mount(root, scope) {
    let img = null, file = null, mask = null, bgImg = null;
    const v = { quality: 'q8', bg: 'none', color: '#ffffff', blur: 18, hard: 35, feather: 1, shadow: false, fmt: 'image/png' };
    root.innerHTML = `<div class="note" style="margin-bottom:12px">${icon('info')} Model AI <b>RMBG-1.4</b> (sumber terbuka, BRIA AI) dimuat turun <b>sekali sahaja</b> ke browser anda (≈44 MB standard / ≈176 MB maksimum) dan disimpan dalam cache. Gambar anda <b>tidak</b> dihantar ke mana-mana pelayan. Lesen model: kegunaan bukan komersial.</div>
      <div data-r="dz"></div>
      <div class="ws" data-r="ws" hidden>
        <div class="card"><div class="stage-bar"><span class="chip" data-r="info"></span><span class="sp"></span><div class="seg" data-r="view"><button type="button" data-m="res" class="on">Hasil</button><button type="button" data-m="cmp">Sebelum/Selepas</button><button type="button" data-m="mask">Topeng</button></div><button class="btn sm" data-r="change" type="button">${icon('upload')}Tukar gambar</button></div><div class="stage" data-r="stage"><canvas data-r="cv"></canvas></div></div>
        <aside class="card ws-panel"><div class="ctrls" data-r="ctrls"></div><hr class="sep"><div class="ctrls" data-r="exp"></div>
          <button class="btn primary block" data-r="dl" type="button">${icon('download')}Muat Turun Resolusi Penuh</button></aside>
      </div>`;
    const R = k => $(`[data-r="${k}"]`, root);
    const dz = dropzone({ accept: 'image/jpeg,image/png,image/webp', title: 'Seret & lepas gambar untuk buang latar', hint: 'Orang, produk, haiwan, kenderaan · JPG, PNG, WEBP', onFiles: load });
    R('dz').appendChild(dz); R('change').addEventListener('click', () => $('input', dz).click());
    let viewMode = 'res';
    R('view').addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (!b) return; viewMode = b.dataset.m; $$('[data-m]', R('view')).forEach(x => x.classList.toggle('on', x === b)); draw(); });
    const bgInput = document.createElement('input'); bgInput.type = 'file'; bgInput.accept = 'image/*';
    bgInput.addEventListener('change', async () => { const [f] = checkFiles(bgInput.files, { max: 1 }); bgInput.value = ''; if (!f) return; try { bgImg = await loadImage(f); scope.urls.push(bgImg._url); v.bg = 'image'; ctrls(); draw(); } catch (e) { toast(e.message, 'error'); } });
    function ctrls() {
      renderControls(R('ctrls'), [
        { type: 'seg', key: 'quality', label: 'Kualiti AI', options: [['q8', 'Standard (pantas)'], ['fp32', 'Maksimum']] },
        { type: 'seg', key: 'bg', label: 'Latar baharu', options: [['none', 'Lutsinar'], ['color', 'Warna'], ['blur', 'Kabur asal'], ['image', 'Gambar']] },
        { type: 'color', key: 'color', label: 'Warna latar', show: v => v.bg === 'color' },
        { type: 'range', key: 'blur', label: 'Kekuatan kabur', min: 4, max: 60, unit: ' px', show: v => v.bg === 'blur' },
        { type: 'buttons', label: 'Gambar latar', show: v => v.bg === 'image', buttons: [{ label: bgImg ? 'Tukar gambar latar' : 'Pilih gambar latar', run: () => bgInput.click() }] },
        { type: 'range', key: 'hard', label: 'Ketajaman tepi', min: 0, max: 90, unit: '%' },
        { type: 'range', key: 'feather', label: 'Kelembutan tepi', min: 0, max: 8, unit: ' px' },
        { type: 'check', key: 'shadow', label: 'Bayang lembut di bawah subjek' }
      ], v, k => { if (k === 'quality') rerun(); else draw(); });
      renderControls(R('exp'), [{ type: 'seg', key: 'fmt', label: 'Format', options: [['image/png', 'PNG (lutsinar)'], ['image/webp', 'WEBP'], ['image/jpeg', 'JPG']] },
        { type: 'note', html: 'JPG tidak menyokong lutsinar. Latar putih akan digunakan jika latar "Lutsinar".', show: v => v.fmt === 'image/jpeg' }], v, () => { });
    }
    async function runModel() {
      busy(true, 'Memuatkan model AI...');
      try {
        await loadRmbg(v.quality, (p, l, t) => { setProgress(p); $('#busyText').textContent = `Memuat turun model AI ${Math.round(p * 100)}% (${fmtBytes(l)} / ${fmtBytes(t)})`; });
        $('#busyText').textContent = 'AI sedang mengasingkan subjek...'; await sleep(30);
        const t0 = performance.now(); mask = await predictMask(file);
        R('info').textContent = `${img.naturalWidth}×${img.naturalHeight} px · AI ${((performance.now() - t0) / 1000).toFixed(1)} s · ${RMBG.device === 'webgpu' ? 'GPU' : 'CPU'}`;
        toast('Latar belakang berjaya dibuang.', 'success');
      } catch (e) {
        console.error(e); mask = null;
        toast(IN_FRAME ? 'Model AI tidak dapat dimuat turun dalam pratonton ini. Hos index.html sendiri untuk guna alat ini.' : 'Gagal memuatkan model AI: ' + (e.message || e), 'error', 8000);
      } finally { busy(false); }
    }
    async function load(files) {
      const [f] = checkFiles(files, { types: ['image/jpeg', 'image/png', 'image/webp'], max: 1 }); if (!f) return;
      try { img = await loadImage(f); scope.urls.push(img._url); file = f; R('dz').hidden = true; R('ws').hidden = false; ctrls(); await runModel(); draw(); }
      catch (e) { toast(e.message, 'error'); }
    }
    const rerun = async () => { if (!file) return; await runModel(); draw(); };
    /* Gabung: alpha = topeng (skala penuh, lengkung ketajaman, feather) */
    function cutout(W, H) {
      const s = W / img.naturalWidth;
      const m = makeCanvas(W, H), mx = ctx2d(m); mx.drawImage(mask, 0, 0, W, H);
      if (v.feather > 0) boxBlur(m, v.feather * Math.max(s, .5));
      const md = mx.getImageData(0, 0, W, H).data;
      const out = makeCanvas(W, H), ox = ctx2d(out); ox.drawImage(img, 0, 0, W, H);
      const im = ox.getImageData(0, 0, W, H), d = im.data;
      const k = v.hard / 100, lo = k * 0.5 * 255, hi = 255 - k * 0.5 * 255;
      for (let i = 0; i < d.length; i += 4) { let a = (md[i] - lo) / (hi - lo); a = a < 0 ? 0 : a > 1 ? 1 : a; a = a * a * (3 - 2 * a) * (k > 0 ? 1 : 0) + (k > 0 ? 0 : md[i] / 255); d[i + 3] = d[i + 3] * a; }
      ox.putImageData(im, 0, 0); return out;
    }
    function compose(W, H, forJpg) {
      const fg = cutout(W, H), c = makeCanvas(W, H), x = ctx2d(c);
      if (v.bg === 'color' || (forJpg && v.bg === 'none')) { x.fillStyle = v.bg === 'color' ? v.color : '#ffffff'; x.fillRect(0, 0, W, H); }
      if (v.bg === 'blur') { const sm = Math.min(1, 600 / Math.max(W, H)); const t = makeCanvas(W * sm, H * sm); ctx2d(t).drawImage(img, 0, 0, t.width, t.height); boxBlur(t, v.blur * sm); x.drawImage(t, 0, 0, W, H); }
      if (v.bg === 'image' && bgImg) drawCover(x, bgImg, 0, 0, W, H);
      if (v.shadow) { x.save(); x.filter = `blur(${Math.round(W / 60)}px)`; x.globalAlpha = .35; const sh = makeCanvas(W, H), sx = sh.getContext('2d'); sx.drawImage(fg, 0, 0); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = '#000'; sx.fillRect(0, 0, W, H); x.drawImage(sh, W * .012, H * .02); x.restore(); }
      x.drawImage(fg, 0, 0); return c;
    }
    const draw = rafThrottle(() => {
      if (!img || !mask) return;
      const s = Math.min(1, CONFIG.previewMax / Math.max(img.naturalWidth, img.naturalHeight)), W = Math.round(img.naturalWidth * s), H = Math.round(img.naturalHeight * s);
      const st = R('stage');
      if (viewMode === 'cmp') {
        const c = compose(W, H); c.toBlob(b => { const u = URL.createObjectURL(b); scope.urls.push(u); st.innerHTML = ''; st.appendChild(compareView(img._url, u)); });
        return;
      }
      let cv = R('cv'); if (!cv) { st.innerHTML = '<canvas data-r="cv"></canvas>'; cv = R('cv'); }
      const c = viewMode === 'mask' ? (() => { const m = makeCanvas(W, H); ctx2d(m).drawImage(mask, 0, 0, W, H); return m; })() : compose(W, H);
      cv.width = W; cv.height = H; const x = cv.getContext('2d'); x.clearRect(0, 0, W, H); x.drawImage(c, 0, 0);
    });
    R('dl').addEventListener('click', () => withBusy('Menghasilkan resolusi penuh...', async () => {
      if (!mask) throw new Error('Topeng AI belum tersedia. Muat naik semula gambar.');
      await sleep(30); const c = compose(img.naturalWidth, img.naturalHeight, v.fmt === 'image/jpeg');
      const blob = await encode(c, v.fmt, .95); saveBlob(blob, `${baseName(file.name)}-tanpa-latar.${EXT[blob.type]}`, 'remove-background');
    }));
  }
});
</script>
