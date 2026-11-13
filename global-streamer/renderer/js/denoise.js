/* Global Streamer - buang bunyi latar daripada mikrofon untuk rakaman (RNNoise + pintu bunyi).
 * Hanya suara yang bercakap dikekalkan: kipas, hujan, kenderaan dan desir senyap dibuang, dan di antara perkataan menjadi senyap sepenuhnya.
 * RNNoise memerlukan 48 kHz: jika konteks audio bukan 48 kHz, isyarat melalui konteks 48 kHz khas (dijambatani oleh MediaStream). */
(function () {
  'use strict';
  const D = (GS.denoise = { ok: false });
  const blobUrl = (src) => URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
  const unb64 = (b) => { const s = atob(b), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; };
  const loaded = new WeakMap();

  async function loadInto(ctx) {
    if (loaded.has(ctx)) return loaded.get(ctx);
    const p = (async () => {
      if (!window.GS_NOISE || !ctx.audioWorklet) throw new Error('tiada AudioWorklet');
      // cuba URL blob dahulu; jika ditolak (asal fail), guna fail dalam vendor/noise
      const add = async (src, file) => { try { await ctx.audioWorklet.addModule(blobUrl(src)); } catch (e) { await ctx.audioWorklet.addModule(new URL('vendor/noise/' + file, document.baseURI).href); } };
      await add(window.GS_NOISE.rnnoise, 'rnnoise-worklet.js');
      await add(window.GS_NOISE.gs, 'gsgate-worklet.js');
      return true;
    })();
    loaded.set(ctx, p);
    return p;
  }
  function chain(ctx) {
    const rn = new AudioWorkletNode(ctx, '@sapphi-red/web-noise-suppressor/rnnoise', { processorOptions: { maxChannels: 1, wasmBinary: unb64(window.GS_NOISE.wasm) }, channelCount: 1, channelCountMode: 'explicit', outputChannelCount: [1] });
    const gate = new AudioWorkletNode(ctx, 'gs-gate', { channelCount: 1, channelCountMode: 'explicit', outputChannelCount: [1] });
    rn.connect(gate);
    return { input: rn, output: gate, nodes: [rn, gate] };
  }

  /** Sediakan (sekali) sebelum rakaman bermula. Mengembalikan true jika penapis sedia. */
  D.prepare = async function (ctx) {
    if (GS.state.audio && GS.state.audio.recDenoise === false) return false;
    try {
      if (!D.ctx48 && ctx.sampleRate !== 48000) { D.ctx48 = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 48000 }); }
      await loadInto(ctx.sampleRate === 48000 ? ctx : D.ctx48);
      D.ok = true; return true;
    } catch (e) { console.warn('[GS] penapis bunyi tidak tersedia', e); D.ok = false; return false; }
  };

  /** Bina satu penapis mono: {input, output, destroy}. Panggil selepas prepare() berjaya. */
  D.build = function (ctx) {
    if (!D.ok) return null;
    if (ctx.sampleRate === 48000) { const c = chain(ctx); return { input: c.input, output: c.output, reset() { try { c.output.port.postMessage('learn'); } catch (e) { /* abaikan */ } }, destroy() { c.nodes.forEach((n) => { try { n.disconnect(); } catch (e) { /* abaikan */ } }); } }; }
    const c2 = D.ctx48; if (!c2) return null;
    if (c2.state === 'suspended') c2.resume();
    const c = chain(c2);
    const out48 = c2.createMediaStreamDestination(), in48 = ctx.createMediaStreamDestination();
    const src48 = c2.createMediaStreamSource(in48.stream); src48.connect(c.input); c.output.connect(out48);
    const back = ctx.createMediaStreamSource(out48.stream);
    return { input: in48, output: back, reset() { try { c.output.port.postMessage('learn'); } catch (e) { /* abaikan */ } }, destroy() { [src48, c.output, c.input, ...c.nodes].forEach((n) => { try { n.disconnect(); } catch (e) { /* abaikan */ } }); try { back.disconnect(); } catch (e) { /* abaikan */ } } };
  };
})();
