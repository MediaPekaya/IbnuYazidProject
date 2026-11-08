/**
 * Klien OBS WebSocket v5 (OBS Studio 28+, sudah terbina dalam).
 * Protokol: https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md
 * Berjalan di pelayar (atau Node 22+ untuk ujian) tanpa pergantungan luar.
 */

const OP = { Hello: 0, Identify: 1, Identified: 2, Event: 5, Request: 6, RequestResponse: 7 };
const EVENT_ALL = 2047; // semua kategori isipadu rendah

/* ---------- SHA-256 (fallback apabila crypto.subtle tiada, cth. http:// LAN) ---------- */
function sha256Fallback(bytes) {
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
  const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const len = bytes.length;
  const padded = new Uint8Array(((len + 9 + 63) >> 6) << 6);
  padded.set(bytes);
  padded[len] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 8, Math.floor((len * 8) / 0x100000000));
  dv.setUint32(padded.length - 4, (len * 8) >>> 0);
  const w = new Uint32Array(64);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
  }
  const out = new Uint8Array(32);
  const odv = new DataView(out.buffer);
  H.forEach((v, i) => odv.setUint32(i * 4, v >>> 0));
  return out;
}

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const subtle = globalThis.crypto && globalThis.crypto.subtle;
  if (subtle) return new Uint8Array(await subtle.digest('SHA-256', bytes));
  return sha256Fallback(bytes);
}
const toB64 = (u8) => { let s = ''; u8.forEach((b) => { s += String.fromCharCode(b); }); return btoa(s); };

/** Jana rentetan pengesahan obs-websocket v5. */
export async function obsAuth(password, salt, challenge) {
  const secret = toB64(await sha256(password + salt));
  return toB64(await sha256(secret + challenge));
}
export { sha256Fallback as _sha256Fallback };

const cleanName = (name) => String(name || 'Projek').replace(/[\r\n]+/g, ' ').trim().slice(0, 60) || 'Projek';
export const overlayInputName = (name) => `GS Overlay - ${cleanName(name)}`;
export const overlaySceneName = (name) => `GS - ${cleanName(name)}`;

export class ObsError extends Error {
  constructor(message, code) { super(message); this.code = code; }
}

export class ObsClient extends EventTarget {
  constructor() {
    super();
    this.ws = null;
    this.status = 'disconnected'; // disconnected | connecting | connected
    this.pending = new Map();
    this.seq = 0;
    this.state = { version: '', scenes: [], currentScene: '', streaming: false, recording: false };
  }

  #setStatus(s, detail) {
    this.status = s;
    this.dispatchEvent(new CustomEvent('status', { detail: { status: s, ...detail } }));
  }

  #emitState() { this.dispatchEvent(new CustomEvent('state', { detail: this.state })); }

  connect({ host = 'localhost', port = 4455, password = '' } = {}) {
    this.disconnect();
    this.#setStatus('connecting');
    return new Promise((resolve, reject) => {
      let settled = false;
      const fail = (err) => { if (!settled) { settled = true; reject(err); } };
      let ws;
      try {
        const h = host.includes(':') && !host.startsWith('[') ? `[${host}]` : host;
        ws = new WebSocket(`ws://${h}:${port}`, 'obswebsocket.json');
      } catch (e) {
        this.#setStatus('disconnected');
        return fail(new ObsError('Alamat OBS tidak sah.', 'bad-url'));
      }
      this.ws = ws;
      const timer = setTimeout(() => {
        fail(new ObsError('Tiada respons daripada OBS. Pastikan OBS dibuka dan WebSocket Server diaktifkan.', 'timeout'));
        try { ws.close(); } catch { /* abaikan */ }
      }, 8000);

      // Pelayar biasanya menghantar `error` kemudian `close`, tetapi sesetengah runtime tidak menghantar
      // `close` bagi sambungan yang gagal dibuka. Anggap `error` sebelum Identified sebagai kegagalan.
      ws.onerror = () => {
        if (settled || this.status === 'connected') return;
        clearTimeout(timer);
        if (this.ws === ws) this.ws = null;
        this.#setStatus('disconnected', { code: 1006, wasConnected: false });
        fail(new ObsError('Tidak dapat menyambung ke OBS. Semak alamat, port dan WebSocket Server (Tools → WebSocket Server Settings).', 'refused'));
        try { ws.close(); } catch { /* abaikan */ }
      };
      ws.onclose = (ev) => {
        clearTimeout(timer);
        const wasConnected = this.status === 'connected';
        if (this.ws !== ws && !wasConnected) return; // sudah diuruskan oleh onerror / sambungan baharu
        this.ws = null;
        for (const p of this.pending.values()) p.reject(new ObsError('Sambungan OBS terputus.', 'closed'));
        this.pending.clear();
        this.state.streaming = false;
        this.state.recording = false;
        this.#setStatus('disconnected', { code: ev.code, wasConnected });
        if (ev.code === 4009) fail(new ObsError('Kata laluan OBS WebSocket tidak betul.', 'auth'));
        else fail(new ObsError('Tidak dapat menyambung ke OBS. Semak alamat, port dan WebSocket Server (Tools → WebSocket Server Settings).', 'refused'));
      };
      ws.onmessage = async (ev) => {
        let msg;
        try { msg = JSON.parse(ev.data); } catch { return; }
        const { op, d } = msg;
        if (op === OP.Hello) {
          const identify = { rpcVersion: 1, eventSubscriptions: EVENT_ALL };
          if (d.authentication) {
            if (!password) { fail(new ObsError('OBS memerlukan kata laluan WebSocket.', 'auth')); ws.close(); return; }
            identify.authentication = await obsAuth(password, d.authentication.salt, d.authentication.challenge);
          }
          ws.send(JSON.stringify({ op: OP.Identify, d: identify }));
        } else if (op === OP.Identified) {
          clearTimeout(timer);
          settled = true;
          this.#setStatus('connected');
          this.refresh().catch(() => {}).finally(() => resolve(this.state));
        } else if (op === OP.RequestResponse) {
          const p = this.pending.get(d.requestId);
          if (!p) return;
          this.pending.delete(d.requestId);
          if (d.requestStatus && d.requestStatus.result) p.resolve(d.responseData || {});
          else p.reject(new ObsError((d.requestStatus && d.requestStatus.comment) || 'Permintaan OBS gagal.', d.requestStatus && d.requestStatus.code));
        } else if (op === OP.Event) {
          this.#onEvent(d);
        }
      };
    });
  }

  disconnect() {
    if (this.ws) { try { this.ws.close(); } catch { /* abaikan */ } this.ws = null; }
  }

  #onEvent({ eventType, eventData = {} }) {
    const s = this.state;
    switch (eventType) {
      case 'StreamStateChanged': s.streaming = !!eventData.outputActive; break;
      case 'RecordStateChanged': s.recording = !!eventData.outputActive; break;
      case 'CurrentProgramSceneChanged': s.currentScene = eventData.sceneName || s.currentScene; break;
      case 'SceneListChanged': s.scenes = (eventData.scenes || []).map((x) => x.sceneName).reverse(); break;
      default: break;
    }
    this.dispatchEvent(new CustomEvent('obs-event', { detail: { eventType, eventData } }));
    this.#emitState();
  }

  request(type, data = undefined, timeout = 10000) {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.status !== 'connected') return reject(new ObsError('Belum disambungkan ke OBS.', 'not-connected'));
      const requestId = `gs-${++this.seq}`;
      const t = setTimeout(() => { this.pending.delete(requestId); reject(new ObsError(`OBS tidak membalas (${type}).`, 'timeout')); }, timeout);
      this.pending.set(requestId, {
        resolve: (v) => { clearTimeout(t); resolve(v); },
        reject: (e) => { clearTimeout(t); reject(e); },
      });
      this.ws.send(JSON.stringify({ op: OP.Request, d: { requestType: type, requestId, ...(data ? { requestData: data } : {}) } }));
    });
  }

  async refresh() {
    const [ver, scenes, stream, rec] = await Promise.all([
      this.request('GetVersion'),
      this.request('GetSceneList'),
      this.request('GetStreamStatus'),
      this.request('GetRecordStatus'),
    ]);
    this.state = {
      version: ver.obsVersion || '',
      scenes: (scenes.scenes || []).map((x) => x.sceneName).reverse(),
      currentScene: scenes.currentProgramSceneName || '',
      streaming: !!stream.outputActive,
      recording: !!rec.outputActive,
    };
    this.#emitState();
    return this.state;
  }

  /**
   * Hantar acara ke Browser Source melalui vendor obs-browser. Dalam halaman:
   *   window.addEventListener(eventName, (e) => e.detail)
   * Pulangkan false jika OBS menolak (cth. versi lama); overlay kekal di keadaan terakhir pautannya.
   */
  async emitEvent(eventName, eventData) {
    try {
      await this.request('CallVendorRequest', { vendorName: 'obs-browser', requestType: 'emit_event', requestData: { event_name: eventName, event_data: eventData } }, 4000);
      return true;
    } catch { return false; }
  }

  /** Kemas kini URL Browser Source yang telah dipasang (memuat semula sumber). */
  async setOverlayUrl(projectName, url) {
    const inputName = overlayInputName(projectName);
    const inputs = await this.request('GetInputList', { inputKind: 'browser_source' });
    if (!(inputs.inputs || []).some((i) => i.inputName === inputName)) return false;
    await this.request('SetInputSettings', { inputName, inputSettings: { url }, overlay: true });
    return true;
  }

  startStream() { return this.request('StartStream'); }
  stopStream() { return this.request('StopStream'); }
  startRecord() { return this.request('StartRecord'); }
  async stopRecord() { return this.request('StopRecord'); }
  setScene(sceneName) { return this.request('SetCurrentProgramScene', { sceneName }); }

  /**
   * Pasang overlay: (pilihan) ubah saiz kanvas, cipta adegan + Browser Source, dan pilih adegan itu.
   * Kamera/skrin anda ditambah DI BAWAH overlay secara manual (lubang pada overlay lutsinar).
   */
  async installOverlay({ name, url, width, height, resizeCanvas = true }) {
    const result = { resized: false, resizeSkipped: '', scene: '', input: '', createdScene: false, createdInput: false };
    const sceneName = overlaySceneName(name);
    const inputName = overlayInputName(name);

    if (resizeCanvas) {
      const [stream, rec] = await Promise.all([this.request('GetStreamStatus'), this.request('GetRecordStatus')]);
      if (stream.outputActive || rec.outputActive) {
        result.resizeSkipped = 'Kanvas tidak diubah kerana siaran/rakaman sedang berjalan.';
      } else {
        const v = await this.request('GetVideoSettings');
        if (v.baseWidth !== width || v.baseHeight !== height || v.outputWidth !== width || v.outputHeight !== height) {
          await this.request('SetVideoSettings', {
            fpsNumerator: v.fpsNumerator, fpsDenominator: v.fpsDenominator,
            baseWidth: width, baseHeight: height, outputWidth: width, outputHeight: height,
          });
          result.resized = true;
        }
      }
    }

    const scenes = await this.request('GetSceneList');
    if (!(scenes.scenes || []).some((s) => s.sceneName === sceneName)) {
      await this.request('CreateScene', { sceneName });
      result.createdScene = true;
    }

    const settings = {
      url, width, height, fps: 30, fps_custom: false, shutdown: false, restart_when_active: false, reroute_audio: false,
      css: 'body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }',
    };
    const inputs = await this.request('GetInputList', { inputKind: 'browser_source' });
    const exists = (inputs.inputs || []).some((i) => i.inputName === inputName);
    if (exists) {
      await this.request('SetInputSettings', { inputName, inputSettings: settings, overlay: true });
      const items = await this.request('GetSceneItemList', { sceneName });
      if (!(items.sceneItems || []).some((i) => i.sourceName === inputName)) {
        await this.request('CreateSceneItem', { sceneName, sourceName: inputName, sceneItemEnabled: true });
      }
    } else {
      await this.request('CreateInput', { sceneName, inputName, inputKind: 'browser_source', inputSettings: settings, sceneItemEnabled: true });
      result.createdInput = true;
    }
    await this.setScene(sceneName);
    result.scene = sceneName;
    result.input = inputName;
    await this.refresh().catch(() => {});
    return result;
  }
}

export const obs = new ObsClient();

/** Terjemah mesej ralat OBS kepada Bahasa Melayu yang mesra. */
export function obsErrorMessage(e) {
  if (!e) return 'Ralat tidak diketahui.';
  if (e.code === 501) return 'Output sedang berjalan atau tidak boleh dimulakan sekarang.';
  if (e.code === 500) return 'Output sudah aktif.';
  return e.message || 'Ralat OBS.';
}
