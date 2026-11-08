/** Pembantu UI kecil: h(), ikon, toast, modal, salin, muat naik imej. */

export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k in el && k !== 'list' && k !== 'form') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  const add = (c) => {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) c.forEach(add);
    else el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  };
  children.forEach(add);
  return el;
}

const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
export const ICONS = {
  grid: svg('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
  folder: svg('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
  plug: svg('<path d="M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0zM12 17v5"/>'),
  copy: svg('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>'),
  play: svg('<path d="M7 4l13 8-13 8z" fill="currentColor"/>'),
  stop: svg('<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>'),
  rec: svg('<circle cx="12" cy="12" r="6" fill="currentColor"/>'),
  trash: svg('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/>'),
  open: svg('<path d="M14 4h6v6M20 4l-9 9M18 13v6H5V6h6"/>'),
  cam: svg('<path d="M3 7h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H3z"/><path d="M16 11l5-3v8l-5-3"/>'),
  screen: svg('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 21h8M12 16v5"/>'),
  left: svg('<path d="M15 5l-7 7 7 7"/>'),
  right: svg('<path d="M9 5l7 7-7 7"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  up: svg('<path d="M6 15l6-6 6 6"/>'),
  down: svg('<path d="M6 9l6 6 6-6"/>'),
  check: svg('<path d="M5 12l5 5 9-10"/>'),
  x: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
  refresh: svg('<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>'),
  image: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  eye: svg('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
};
export const icon = (name) => { const s = document.createElement('span'); s.className = 'ico'; s.innerHTML = ICONS[name] || ''; return s; };

export function toast(msg, kind = 'info', ms = 3600) {
  let host = document.getElementById('toasts');
  if (!host) { host = h('div', { id: 'toasts', role: 'status', 'aria-live': 'polite' }); document.body.appendChild(host); }
  const t = h('div', { class: `toast ${kind}` }, msg);
  host.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, ms);
}

/** Dialog modal. Pulangkan { close, el }. */
export function modal({ title, body, actions = [], wide = false, onClose }) {
  const prev = document.activeElement;
  const close = () => {
    document.removeEventListener('keydown', onKey);
    back.remove();
    if (prev && prev.focus) prev.focus();
    if (onClose) onClose();
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const back = h('div', { class: 'modal-back', onclick: (e) => { if (e.target === back) close(); } },
    h('div', { class: 'modal' + (wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h('div', { class: 'modal-head' }, h('h2', { text: title }), h('button', { class: 'btn ghost sm', 'aria-label': 'Tutup', onclick: close }, icon('x'))),
      h('div', { class: 'modal-body' }, body),
      actions.length ? h('div', { class: 'modal-foot' }, actions) : null));
  document.body.appendChild(back);
  document.addEventListener('keydown', onKey);
  const focusable = back.querySelector('input, select, textarea, button.btn:not(.ghost)');
  if (focusable) focusable.focus({ preventScroll: true });
  return { close, el: back };
}

export function confirmDialog({ title, message, confirmText = 'Ya', danger = false }) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    const m = modal({
      title,
      body: h('p', { text: message }),
      onClose: () => finish(false),
      actions: [
        h('button', { class: 'btn secondary', onclick: () => { finish(false); m.close(); } }, 'Batal'),
        h('button', { class: 'btn' + (danger ? ' danger' : ''), onclick: () => { finish(true); m.close(); } }, confirmText),
      ],
    });
  });
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = h('textarea', { value: text, style: { position: 'fixed', opacity: '0' } });
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { /* abaikan */ }
    ta.remove();
    return ok;
  }
}

export const debounce = (fn, ms) => {
  let t;
  const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  d.flush = (...a) => { clearTimeout(t); fn(...a); };
  d.cancel = () => clearTimeout(t);
  return d;
};

/** Muat naik imej -> data URL yang dimampatkan (elak data terlalu besar). */
export async function fileToDataUrl(file, { maxDim = 1280, png = false, quality = 0.82 } = {}) {
  if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) throw new Error('Format imej tidak disokong. Guna PNG, JPG, WebP atau GIF.');
  if (file.size > 12 * 1024 * 1024) throw new Error('Imej terlalu besar (maksimum 12 MB).');
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale)), hgt = Math.max(1, Math.round(bmp.height * scale));
  const c = document.createElement('canvas');
  c.width = w; c.height = hgt;
  c.getContext('2d').drawImage(bmp, 0, 0, w, hgt);
  bmp.close && bmp.close();
  return c.toDataURL(png ? 'image/png' : 'image/jpeg', quality);
}

export const fmtDate = (ms) => new Date(ms).toLocaleString('ms-MY', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
