/** Shell aplikasi: penghala, galeri templat, projek saya. */
import { api } from './api.js';
import {
  SIZES, sizeById, getTemplate, templateSizes, renderStage, scaleToBox, STYLES,
} from './engine.js';
import { TEMPLATES, CATEGORIES } from './templates.js';
import { h, icon, toast, modal, confirmDialog, copyText, fmtDate } from './ui.js';
import { obs } from './obs.js';
import { overlayLink } from './link.js';
import { STATIC } from './mode.js';
import { mountStudio } from './studio.js';
import { viewObsPage } from './obs-ui.js';

const view = document.getElementById('view');
let current = null; // paparan aktif { destroy }
let user = null;

/* ------------------------------ lakaran kecil ------------------------------ */
const io = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { io.unobserve(e.target); e.target.__render && e.target.__render(); }
    }
  }, { rootMargin: '200px' })
  : null;

/** Cipta kotak lakaran kecil yang dilukis secara malas. */
function thumb(project, boxW, boxH, onClick) {
  const frame = h('div', { class: 'thumb-frame' });
  const box = h('div', { class: 'thumb', role: onClick ? 'button' : undefined, tabIndex: onClick ? 0 : undefined, 'aria-label': onClick ? 'Pratonton' : undefined },
    frame, h('div', { class: 'skeleton' }));
  const { w, h: hh } = project.size;
  const k = Math.min(boxW / w, boxH / hh);
  frame.style.width = `${Math.round(w * k)}px`;
  frame.style.height = `${Math.round(hh * k)}px`;
  const inner = h('div');
  frame.appendChild(inner);
  box.__render = () => {
    const r = renderStage(inner, project, { mode: 'gallery' });
    if (r) scaleToBox(r.stage, w, hh, w * k, hh * k);
    const sk = box.querySelector('.skeleton');
    if (sk) sk.remove();
  };
  if (io) io.observe(box); else box.__render();
  if (onClick) {
    box.addEventListener('click', onClick);
    box.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } });
  }
  return box;
}

const shapeIcon = (s) => {
  const k = 14 / Math.max(s.w, s.h);
  return h('span', { class: 'shape', style: { width: `${Math.max(5, Math.round(s.w * k))}px`, height: `${Math.max(5, Math.round(s.h * k))}px` } });
};

/* ------------------------------ galeri templat ------------------------------ */
function viewGallery() {
  const st = { cat: 'all', size: 'all', q: '' };
  const grid = h('div', { class: 'grid', role: 'list' });
  const count = h('p', { class: 'result-count', 'aria-live': 'polite' });
  const catRow = h('div', { class: 'chips-row' });
  const sizeRow = h('div', { class: 'chips-row' });

  const drawFilters = () => {
    catRow.replaceChildren(h('span', { class: 'lbl' }, 'Kategori'),
      chip('Semua', st.cat === 'all', () => { st.cat = 'all'; refresh(); }, TEMPLATES.length),
      ...CATEGORIES.map((c) => chip(c.name, st.cat === c.id, () => { st.cat = c.id; refresh(); }, TEMPLATES.filter((t) => t.cat === c.id).length, c.id === 'gaming')));
    // bilangan mengikut kategori & carian semasa
    const base = TEMPLATES.filter((t) => (st.cat === 'all' || t.cat === st.cat) && matchesQuery(t));
    const label = (s) => (s.id === 'fhd' || s.id === 'hd' || s.ratio.includes('×') ? s.name : s.ratio);
    sizeRow.replaceChildren(h('span', { class: 'lbl' }, 'Saiz'),
      chip('Semua saiz', st.size === 'all', () => { st.size = 'all'; refresh(); }),
      ...SIZES.map((s) => chip(h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '8px' } }, shapeIcon(s), label(s)), st.size === s.id, () => { st.size = s.id; refresh(); },
        base.filter((t) => templateSizes(t).some((x) => x.id === s.id)).length)));
  };
  const matchesQuery = (t) => { const q = st.q.trim().toLowerCase(); return !q || `${t.name} ${t.desc} ${t.cat}`.toLowerCase().includes(q); };
  const chip = (label, on, fn, n, gaming) => h('button', { class: 'chip' + (gaming ? ' gaming' : ''), 'aria-pressed': String(on), onclick: fn, title: typeof label === 'string' ? label : undefined }, label, n !== undefined ? h('small', {}, String(n)) : null);

  const refresh = () => {
    drawFilters();
    const list = TEMPLATES.filter((t) => (st.cat === 'all' || t.cat === st.cat)
      && (st.size === 'all' || templateSizes(t).some((s) => s.id === st.size))
      && matchesQuery(t));
    count.textContent = `${list.length} templat`;
    if (!list.length) { grid.replaceChildren(h('div', { class: 'empty', style: { gridColumn: '1 / -1' } }, h('h3', {}, 'Tiada templat sepadan'), h('p', {}, 'Cuba kategori, saiz atau kata carian yang lain.'))); return; }
    grid.replaceChildren(...list.map(card));
  };

  const card = (t) => {
    const sizes = templateSizes(t);
    const sid = st.size !== 'all' && sizes.some((s) => s.id === st.size) ? st.size : t.defaultSize;
    const s = sizeById(sid);
    const catName = CATEGORIES.find((c) => c.id === t.cat).name;
    const gaming = STYLES[t.style].gaming;
    const open = () => openPicker(t, sid);
    return h('article', { class: 'card', role: 'listitem' },
      thumb({ templateId: t.id, size: { w: s.w, h: s.h }, data: {} }, 260, 176, open),
      h('div', { class: 'card-body' },
        h('h3', {}, t.name),
        h('p', {}, t.desc),
        h('div', { class: 'tags' }, h('span', { class: 'tag muted' }, catName), gaming ? h('span', { class: 'tag gaming' }, 'Gaya gaming') : null, h('span', { class: 'tag' }, s.id === 'fhd' ? 'Full HD 16:9' : s.id === 'hd' ? 'HD 16:9' : s.ratio.includes('×') ? s.name : s.ratio)),
        h('div', { class: 'card-foot' }, h('span', { class: 'sizes' }, `${sizes.length} saiz`), h('button', { class: 'btn sm', onclick: open }, 'Guna templat'))));
  };

  const search = h('input', { class: 'input', type: 'search', placeholder: 'Cari templat: kelas, podcast, kuiz, gaming…', 'aria-label': 'Cari templat', oninput: (e) => { st.q = e.target.value; refresh(); } });
  const page = h('div', { class: 'page' },
    h('div', { class: 'hero-strip' },
      h('div', {}, h('h1', {}, 'Pilih templat siaran anda'), h('p', {}, 'Untuk guru, pelajar, content creator, perniagaan dan gamer. Semua boleh disambung ke OBS Studio.')),
      h('div', { class: 'stat-row' }, h('div', {}, h('b', {}, String(TEMPLATES.length)), h('span', {}, 'Templat')), h('div', {}, h('b', {}, String(SIZES.length)), h('span', {}, 'Saiz')), h('div', {}, h('b', {}, String(CATEGORIES.length)), h('span', {}, 'Kategori')))),
    h('div', { class: 'filters' }, h('div', { class: 'search' }, icon('search'), search), catRow, sizeRow),
    count, grid);
  view.replaceChildren(page);
  refresh();
  return { destroy() {} };
}

/** Dialog pilih saiz + nama sebelum mencipta projek. */
function openPicker(t, initialSize) {
  const sizes = templateSizes(t);
  let sid = initialSize;
  const preview = h('div', { class: 'pick-preview' });
  const sizeBox = h('div', { class: 'size-grid' });
  const nameIn = h('input', { class: 'input', value: t.name, maxLength: 80, 'aria-label': 'Nama projek' });
  const draw = () => {
    const s = sizeById(sid);
    const k = Math.min(520 / s.w, 252 / s.h);
    const frame = h('div', { class: 'thumb-frame', style: { width: `${Math.round(s.w * k)}px`, height: `${Math.round(s.h * k)}px` } });
    const inner = h('div');
    frame.appendChild(inner);
    preview.replaceChildren(frame);
    const r = renderStage(inner, { templateId: t.id, size: { w: s.w, h: s.h }, data: {} }, { mode: 'gallery' });
    if (r) scaleToBox(r.stage, s.w, s.h, s.w * k, s.h * k);
    sizeBox.replaceChildren(...sizes.map((x) => h('button', { class: 'size-opt', type: 'button', 'aria-pressed': String(x.id === sid), onclick: () => { sid = x.id; draw(); } },
      h('b', {}, shapeIcon(x), x.name), h('small', {}, `${x.ratio} • ${x.w}×${x.h}`), h('small', {}, x.use))));
  };
  const create = async (btn) => {
    btn.disabled = true;
    try {
      const s = sizeById(sid);
      const { project } = await api('POST', 'api/projects', { templateId: t.id, name: nameIn.value.trim() || t.name, size: { id: s.id, w: s.w, h: s.h }, data: {} });
      m.close();
      location.hash = `#/studio/${project.id}`;
    } catch (e) { toast(e.message, 'error'); btn.disabled = false; }
  };
  const btn = h('button', { class: 'btn', onclick: () => create(btn) }, 'Cipta & buka studio');
  const m = modal({
    title: t.name, wide: true,
    body: [h('p', { style: { color: 'var(--muted)' } }, t.desc), preview, h('div', { class: 'field' }, h('span', { class: 'label' }, 'Pilih saiz'), sizeBox), h('div', { class: 'field' }, h('label', {}, 'Nama projek'), nameIn)],
    actions: [h('button', { class: 'btn secondary', onclick: () => m.close() }, 'Batal'), btn],
  });
  draw();
}

/* ------------------------------ projek saya ------------------------------ */
async function viewProjects() {
  view.replaceChildren(h('div', { class: 'page' }, h('div', { class: 'loading' }, 'Memuatkan projek…')));
  let projects;
  try { ({ projects } = await api('GET', 'api/projects')); } catch (e) { view.replaceChildren(h('div', { class: 'page' }, h('div', { class: 'alert error' }, e.message))); return { destroy() {} }; }
  const grid = h('div', { class: 'grid' });
  const page = h('div', { class: 'page' },
    h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, 'Projek saya'), h('p', {}, `${projects.length} projek disimpan. Setiap projek ada pautan OBS sendiri.`)), h('a', { class: 'btn', href: '#/templat' }, icon('plus'), 'Projek baharu')),
    grid);
  const draw = () => {
    if (!projects.length) {
      grid.replaceChildren(h('div', { class: 'empty', style: { gridColumn: '1 / -1' } }, h('h3', {}, 'Belum ada projek'), h('p', {}, 'Pilih templat untuk bermula. Projek anda disimpan secara automatik.'), h('a', { class: 'btn', href: '#/templat' }, 'Lihat templat')));
      return;
    }
    grid.replaceChildren(...projects.map((p) => {
      const t = getTemplate(p.templateId);
      const url = overlayLink(p).url;
      return h('article', { class: 'card project-card' },
        t ? thumb(p, 260, 160, () => { location.hash = `#/studio/${p.id}`; }) : h('div', { class: 'thumb' }, 'Templat tiada'),
        h('div', { class: 'card-body' },
          h('h3', {}, p.name),
          h('div', { class: 'tags' }, h('span', { class: 'tag muted' }, t ? t.name : p.templateId), h('span', { class: 'tag' }, `${p.size.w}×${p.size.h}`)),
          h('p', { class: 'meta', style: { minHeight: 0 } }, `Dikemas kini ${fmtDate(p.updated)}`),
          h('div', { class: 'actions' },
            h('a', { class: 'btn sm', href: `#/studio/${p.id}` }, 'Buka studio'),
            h('button', { class: 'btn secondary sm', onclick: async () => toast((await copyText(url)) ? 'Pautan OBS disalin.' : 'Gagal menyalin.', 'ok') }, icon('copy'), 'Salin pautan OBS'),
            h('button', { class: 'btn danger secondary sm', 'aria-label': `Padam ${p.name}`, onclick: async () => {
              const ok = await confirmDialog({ title: 'Padam projek?', message: `“${p.name}” dan pautan OBS-nya akan dipadam secara kekal.`, confirmText: 'Padam', danger: true });
              if (!ok) return;
              try { await api('DELETE', `api/projects/${p.id}`); projects = projects.filter((x) => x.id !== p.id); draw(); toast('Projek dipadam.', 'ok'); } catch (e) { toast(e.message, 'error'); }
            } }, icon('trash')))));
    }));
  };
  view.replaceChildren(page);
  draw();
  return { destroy() {} };
}

/* ------------------------------ penghala ------------------------------ */
const NAV = [
  { href: '#/templat', label: 'Templat', icon: 'grid', match: /^#\/(templat)?$/ },
  { href: '#/projek', label: 'Projek saya', icon: 'folder', match: /^#\/projek/ },
  { href: '#/obs', label: 'Sambungan OBS', icon: 'plug', match: /^#\/obs/ },
];
function drawNav() {
  const hash = location.hash || '#/templat';
  const nav = document.getElementById('nav');
  nav.replaceChildren(...NAV.map((n) => h('a', { href: n.href, 'aria-current': n.match.test(hash) ? 'page' : undefined }, icon(n.icon), h('span', { class: 't' }, n.label))));
}

async function route() {
  if (current) { try { current.destroy(); } catch { /* abaikan */ } current = null; }
  drawNav();
  window.scrollTo(0, 0);
  const hash = location.hash || '#/templat';
  const studio = hash.match(/^#\/studio\/([\w-]+)/);
  try {
    if (studio) {
      view.replaceChildren(h('div', { class: 'loading' }, 'Membuka studio…'));
      const c = await mountStudio(view, studio[1]);
      current = c;
    } else if (/^#\/projek/.test(hash)) current = await viewProjects();
    else if (/^#\/obs/.test(hash)) current = viewObsPage(view, { origin: new URL('./', location.href).href });
    else current = viewGallery();
    document.title = (studio ? 'Studio' : /^#\/projek/.test(hash) ? 'Projek saya' : /^#\/obs/.test(hash) ? 'Sambungan OBS' : 'Templat') + ' - GLOBAL STREAMER';
  } catch (e) {
    if (e.status === 401) { location.href = 'login.html'; return; }
    view.replaceChildren(h('div', { class: 'page' }, h('div', { class: 'empty' }, h('h3', {}, e.status === 404 ? 'Projek tidak dijumpai' : 'Ralat'), h('p', {}, e.message), h('a', { class: 'btn', href: '#/projek' }, 'Kembali ke projek'))));
  }
}

async function init() {
  try {
    user = await api('GET', 'api/me');
  } catch { location.href = 'login.html'; return; }
  document.getElementById('user-email').textContent = user.email;
  if (STATIC) document.querySelector('.appbar .brand').after(h('span', { class: 'tag muted', title: 'Edisi demo: data disimpan dalam pelayar ini sahaja' }, 'Edisi statik'));
  document.getElementById('logout').addEventListener('click', async () => {
    try { await api('POST', 'api/logout', {}); } catch { /* abaikan */ }
    location.href = 'login.html';
  });
  const pill = document.getElementById('obs-pill');
  const upd = () => {
    pill.dataset.s = obs.status;
    pill.querySelector('span').textContent = obs.status === 'connected' ? 'OBS: bersambung' : obs.status === 'connecting' ? 'OBS: menyambung…' : 'OBS: tidak bersambung';
  };
  obs.addEventListener('status', upd);
  upd();
  window.addEventListener('hashchange', route);
  route();
}
init();
