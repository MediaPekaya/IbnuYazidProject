/** Pautan overlay untuk OBS Browser Source (mod pelayan: token; mod statik: keadaan dalam pautan). */
import { STATIC } from './mode.js';

const toB64Url = (str) => {
  const bytes = new TextEncoder().encode(str);
  let s = '';
  bytes.forEach((b) => { s += String.fromCharCode(b); });
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
export const fromB64Url = (s) => {
  const pad = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(pad);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

/** Keadaan minimum yang dibawa oleh overlay (edisi statik). */
export const liveState = (p) => ({ i: p.id, t: p.templateId, z: { w: p.size.w, h: p.size.h }, d: p.data });

const MAX_URL = 120000;

/** @returns {{url:string, trimmed:boolean}} */
export function overlayLink(p) {
  const base = new URL('overlay.html', location.href);
  base.hash = '';
  if (!STATIC) { base.search = `?k=${p.token}`; return { url: base.href, trimmed: false }; }
  let trimmed = false;
  let st = liveState(p);
  let url = `${base.href}#s=${toB64Url(JSON.stringify(st))}`;
  if (url.length > MAX_URL) {
    // imej data: terlalu besar untuk dimuatkan dalam pautan - buang
    const d = { ...st.d };
    if (typeof d.logo === 'string' && d.logo.startsWith('data:')) d.logo = '';
    if (Array.isArray(d.slides)) d.slides = d.slides.map((s) => (s && typeof s.image === 'string' && s.image.startsWith('data:') ? { ...s, image: '' } : s));
    st = { ...st, d };
    url = `${base.href}#s=${toB64Url(JSON.stringify(st))}`;
    trimmed = true;
  }
  return { url, trimmed };
}
