/**
 * Pengganti API pelayan untuk edisi statik (GitHub Pages).
 * Semua data disimpan dalam localStorage pelayar ini sahaja - tiada apa-apa dihantar ke pelayan.
 * Kata laluan di-hash dengan PBKDF2-SHA256 (garam rawak) walaupun data kekal setempat.
 */
const DB_KEY = 'gs.static.db';
const SESSION_KEY = 'gs.static.session';
const MAX_PROJECTS = 40;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function load() {
  try { const d = JSON.parse(localStorage.getItem(DB_KEY)); if (d && d.users && d.projects) return d; } catch { /* kosong */ }
  return { users: {}, projects: {} };
}
function save(db) {
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch {
    throw new ApiError(507, 'Ruang simpanan pelayar penuh. Padam projek lama atau kecilkan imej.');
  }
}
const b64 = (u8) => btoa(String.fromCharCode(...u8));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const randomToken = (n = 16) => b64(crypto.getRandomValues(new Uint8Array(n))).replace(/[+/=]/g, (c) => ({ '+': '-', '/': '_', '=': '' }[c]));

async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 150000 }, key, 256);
  return b64(new Uint8Array(bits));
}

const currentEmail = () => { try { return localStorage.getItem(SESSION_KEY); } catch { return null; } };
function requireUser(db) {
  const e = currentEmail();
  if (!e || !db.users[e]) throw new ApiError(401, 'Sila log masuk.');
  return e;
}
const pub = (p) => ({ id: p.id, name: p.name, templateId: p.templateId, size: p.size, data: p.data, token: p.token, updated: p.updated, created: p.created });
const mine = (db, email) => Object.values(db.projects).filter((p) => p.uid === email);

function cleanSize(v) {
  if (!v || typeof v !== 'object') return null;
  const w = Math.round(Number(v.w)), h = Math.round(Number(v.h));
  if (!(w >= 100 && w <= 4000 && h >= 100 && h <= 4000)) return null;
  return { w, h, id: typeof v.id === 'string' ? v.id.slice(0, 24) : undefined };
}

export async function localApi(method, url, body = {}) {
  const path = '/' + String(url).replace(/^\/?api\//, '').split('?')[0];
  const db = load();

  if (method === 'POST' && path === '/register') {
    const { email, password } = body;
    if (typeof email !== 'string' || typeof password !== 'string') throw new ApiError(400, 'Emel dan kata laluan diperlukan.');
    const e = email.trim().toLowerCase();
    if (e.length > 254 || !EMAIL_RE.test(e)) throw new ApiError(400, 'Format emel tidak sah.');
    if (password.length < 8) throw new ApiError(400, 'Kata laluan mesti sekurang-kurangnya 8 aksara.');
    if (db.users[e]) throw new ApiError(409, 'Emel ini sudah didaftarkan. Sila log masuk.');
    const salt = crypto.getRandomValues(new Uint8Array(16));
    db.users[e] = { email: e, salt: b64(salt), hash: await hashPassword(password, salt), created: Date.now() };
    save(db);
    return { ok: true, email: e };
  }
  if (method === 'POST' && path === '/login') {
    const e = String(body.email || '').trim().toLowerCase();
    const u = db.users[e];
    const fail = new ApiError(401, 'Emel atau kata laluan tidak betul.');
    if (!u || typeof body.password !== 'string') throw fail;
    if ((await hashPassword(body.password, unb64(u.salt))) !== u.hash) throw fail;
    localStorage.setItem(SESSION_KEY, e);
    return { ok: true, user: { email: e } };
  }
  if (method === 'POST' && path === '/logout') { localStorage.removeItem(SESSION_KEY); return { ok: true }; }
  if (method === 'GET' && path === '/me') { const e = requireUser(db); return { email: e }; }

  const email = requireUser(db);
  if (method === 'GET' && path === '/projects') return { projects: mine(db, email).sort((a, b) => b.updated - a.updated).map(pub) };
  if (method === 'POST' && path === '/projects') {
    if (mine(db, email).length >= MAX_PROJECTS) throw new ApiError(400, `Had ${MAX_PROJECTS} projek dicapai. Padam projek lama dahulu.`);
    const { templateId, name, size, data } = body;
    if (typeof templateId !== 'string' || !/^[a-z0-9-]{1,60}$/.test(templateId)) throw new ApiError(400, 'Templat tidak sah.');
    const sz = cleanSize(size);
    if (!sz) throw new ApiError(400, 'Saiz tidak sah.');
    const now = Date.now();
    const p = { id: crypto.randomUUID(), uid: email, token: randomToken(), name: (typeof name === 'string' && name.trim().slice(0, 80)) || 'Projek baharu', templateId, size: sz, data: data && typeof data === 'object' ? data : {}, created: now, updated: now };
    db.projects[p.id] = p;
    save(db);
    return { project: pub(p) };
  }
  const m = path.match(/^\/projects\/([\w-]+)(\/rotate)?$/);
  if (m) {
    const p = db.projects[m[1]];
    if (!p || p.uid !== email) throw new ApiError(404, 'Projek tidak dijumpai.');
    if (method === 'GET') return { project: pub(p) };
    if (method === 'DELETE') { delete db.projects[p.id]; save(db); return { ok: true }; }
    if (method === 'POST' && m[2]) { p.token = randomToken(); p.updated = Date.now(); save(db); return { project: pub(p) }; }
    if (method === 'PATCH') {
      const { name, templateId, size, data } = body;
      if (typeof name === 'string') p.name = name.trim().slice(0, 80) || p.name;
      if (typeof templateId === 'string' && /^[a-z0-9-]{1,60}$/.test(templateId)) p.templateId = templateId;
      if (size !== undefined) { const sz = cleanSize(size); if (!sz) throw new ApiError(400, 'Saiz tidak sah.'); p.size = sz; }
      if (data && typeof data === 'object' && !Array.isArray(data)) p.data = { ...p.data, ...data };
      p.updated = Date.now();
      save(db);
      return { project: pub(p) };
    }
  }
  throw new ApiError(404, 'Laluan tidak dijumpai.');
}
