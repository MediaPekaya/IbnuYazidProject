/** Pembalut fetch ringkas untuk API GLOBAL STREAMER. */
import { STATIC } from './mode.js';

export async function api(method, url, body) {
  if (STATIC) {
    const { localApi } = await import('./local-api.js');
    return localApi(method, url, body);
  }
  let res;
  try {
    res = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    const e = new Error('Tidak dapat menghubungi pelayan. Semak sambungan internet anda.');
    e.status = 0;
    throw e;
  }
  let data = {};
  try { data = await res.json(); } catch { /* bukan JSON */ }
  if (!res.ok) {
    const e = new Error(data.error || `Ralat ${res.status}`);
    e.status = res.status;
    throw e;
  }
  return data;
}
