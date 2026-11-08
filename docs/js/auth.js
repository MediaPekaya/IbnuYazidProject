import { api } from './api.js';
import { STATIC } from './mode.js';

const $ = (s, r = document) => r.querySelector(s);
const mode = document.body.dataset.mode; // 'login' | 'daftar'
const form = $('#form');
const errBox = $('#error');
const okBox = $('#notice');
const btn = $('#submit');

/* Ikon mata: tunjuk / sembunyi kata laluan */
const eye = $('#toggle-pass');
const pass = $('#password');
eye.addEventListener('click', () => {
  const show = pass.type === 'password';
  pass.type = show ? 'text' : 'password';
  eye.setAttribute('aria-pressed', String(show));
  eye.setAttribute('aria-label', show ? 'Sembunyikan kata laluan' : 'Tunjukkan kata laluan');
  eye.title = eye.getAttribute('aria-label');
  pass.focus({ preventScroll: true });
});

function showError(msg) { errBox.textContent = msg; errBox.hidden = !msg; }

/* Kekuatan kata laluan (daftar sahaja) */
const meter = $('#strength');
if (meter) {
  const score = (v) => {
    let s = 0;
    if (v.length >= 8) s++;
    if (v.length >= 12) s++;
    if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
    if (/\d/.test(v) && /[^A-Za-z0-9]/.test(v)) s++;
    return v ? Math.max(1, s) : 0;
  };
  const label = ['', 'Lemah', 'Sederhana', 'Baik', 'Kuat'];
  pass.addEventListener('input', () => {
    const s = score(pass.value);
    meter.dataset.s = String(s);
    $('#strength-text').textContent = pass.value ? `Kekuatan: ${label[s]}` : 'Sekurang-kurangnya 8 aksara.';
  });
}

if (STATIC) {
  const n = document.createElement('div');
  n.className = 'alert info';
  n.textContent = 'Edisi demo GitHub Pages: akaun dan projek disimpan dalam pelayar ini sahaja dan tidak dihantar ke mana-mana pelayan.';
  form.parentNode.insertBefore(n, form);
}

/* Mesej selepas daftar */
const params = new URLSearchParams(location.search);
if (mode === 'login') {
  if (params.get('daftar') === 'ok') {
    okBox.textContent = 'Pendaftaran berjaya! Sila log masuk dengan emel dan kata laluan anda.';
    okBox.hidden = false;
  }
  const e = params.get('emel');
  if (e) $('#email').value = e;
  if (e) pass.focus();
}

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  showError('');
  const email = $('#email').value.trim();
  const password = pass.value;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return showError('Sila masukkan alamat emel yang sah.');
  if (mode === 'daftar' && password.length < 8) return showError('Kata laluan mesti sekurang-kurangnya 8 aksara.');
  if (!password) return showError('Sila masukkan kata laluan.');
  btn.disabled = true;
  const original = btn.textContent;
  btn.textContent = 'Sila tunggu…';
  try {
    if (mode === 'daftar') {
      const r = await api('POST', 'api/register', { email, password });
      location.href = `login.html?daftar=ok&emel=${encodeURIComponent(r.email)}`;
    } else {
      await api('POST', 'api/login', { email, password });
      location.href = 'app.html';
    }
  } catch (e) {
    showError(e.message);
    btn.disabled = false;
    btn.textContent = original;
  }
});

/* Paparan templat di panel kiri (guna enjin sebenar) */
(async () => {
  const host = $('#showcase');
  if (!host) return;
  try {
    const { renderStage, scaleToBox, sizeById } = await import('./engine.js');
    const picks = [['edu-kelas-biru', 'fhd', 0, 12, 330], ['cr-vlog-oren', 'fhd', 210, 0, 300], ['gm-neon-hud', 'fhd', 120, 95, 260]];
    for (const [id, sid, x, y, w] of picks) {
      const s = sizeById(sid);
      const shot = document.createElement('div');
      shot.className = 'shot';
      shot.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${Math.round(w * s.h / s.w)}px`;
      const inner = document.createElement('div');
      shot.appendChild(inner);
      host.appendChild(shot);
      const r = renderStage(inner, { templateId: id, size: { w: s.w, h: s.h }, data: {} }, { mode: 'gallery' });
      if (r) scaleToBox(r.stage, s.w, s.h, w, w * s.h / s.w);
    }
  } catch { /* hiasan sahaja */ }
})();
