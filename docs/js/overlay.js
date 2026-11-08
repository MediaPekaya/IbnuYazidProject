/**
 * Halaman overlay untuk OBS Browser Source.
 * Mod pelayan: menerima keadaan melalui SSE (?k=token).
 * Mod statik (GitHub Pages): keadaan dibawa dalam pautan (#s=...) dan dikemas kini melalui
 * acara obs-browser ("gs-state") atau BroadcastChannel.
 * Lubang kamera/skrin lutsinar supaya sumber OBS di bawahnya kelihatan.
 */
import { renderStage, scaleToBox } from './engine.js';
import { STATIC } from './mode.js';
import { fromB64Url } from './link.js';

const params = new URLSearchParams(location.search);
const root = document.getElementById('root');
const msg = document.getElementById('msg');
const inObs = typeof window.obsstudio !== 'undefined';
if (!inObs) document.body.classList.add('preview');

let current = null;
let raf = 0;

function say(text) {
  msg.textContent = text;
  msg.style.display = text ? 'flex' : 'none';
}

function paint() {
  raf = 0;
  if (!current) return;
  const { size } = current;
  const r = renderStage(root, { templateId: current.templateId, size, data: current.data }, { mode: 'overlay' });
  if (!r) { say('Templat tidak dijumpai.'); return; }
  say('');
  const s = Math.min(window.innerWidth / size.w, window.innerHeight / size.h);
  if (Math.abs(s - 1) > 0.001) scaleToBox(r.stage, size.w, size.h, window.innerWidth, window.innerHeight);
}
const schedule = () => { if (!raf) raf = requestAnimationFrame(paint); };
window.addEventListener('resize', schedule);

function startServerMode() {
  const token = params.get('k');
  if (!token) { say('Pautan overlay tidak lengkap. Salin pautan Browser Source dari studio GLOBAL STREAMER.'); return; }
  let everConnected = false;
  const es = new EventSource(`api/live/${encodeURIComponent(token)}`);
  es.addEventListener('state', (e) => {
    everConnected = true;
    try { current = JSON.parse(e.data); } catch { return; }
    schedule();
  });
  es.onerror = async () => {
    if (everConnected) return; // EventSource menyambung semula sendiri
    try {
      const r = await fetch(`api/live/${encodeURIComponent(token)}/state`);
      if (r.status === 404) { es.close(); say('Pautan overlay tidak sah atau telah ditukar. Salin pautan baharu dari studio.'); }
    } catch { /* tunggu sambung semula */ }
  };
}

function startStaticMode() {
  let projectId = null;
  const apply = (st) => {
    if (!st || typeof st !== 'object' || !st.t || !st.z) return;
    if (projectId && st.i && st.i !== projectId) return; // bukan projek ini
    projectId = projectId || st.i || null;
    current = { templateId: st.t, size: st.z, data: st.d || {} };
    schedule();
  };
  const m = location.hash.match(/^#s=([\w-]+)$/);
  if (!m) { say('Pautan overlay tidak lengkap. Salin pautan Browser Source dari studio GLOBAL STREAMER.'); return; }
  try { apply(JSON.parse(fromB64Url(m[1]))); } catch { say('Pautan overlay rosak. Salin semula dari studio.'); return; }
  // OBS: vendor obs-browser -> window.dispatchEvent(new CustomEvent('gs-state', { detail }))
  window.addEventListener('gs-state', (e) => apply(e.detail));
  if ('BroadcastChannel' in window) new BroadcastChannel('gs-live').onmessage = (e) => apply(e.data);
}

if (STATIC) startStaticMode(); else startServerMode();
