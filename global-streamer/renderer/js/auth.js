/* Global Streamer - log masuk (Firebase Authentication) + profil + semakan lesen.
 * Tiada UID dikodkan di sini: sesiapa yang berdaftar dalam Firebase Authentication boleh log masuk.
 * Peranan admin disimpan sebagai data di Firestore (admins/{uid}), bukan dalam kod. */
(function () {
  'use strict';
  const { h, icon } = GS;
  const cfg = () => GS.config || {};
  const A = (GS.auth = { user: null, isAdmin: false, license: null, guest: false, enabled: false, sdk: null });

  const msgs = {
    'auth/operation-not-allowed': 'Kaedah log masuk ini belum dihidupkan. Firebase Console > Authentication > Sign-in method.',
    'auth/invalid-credential': 'Emel atau kata laluan salah.',
    'auth/wrong-password': 'Emel atau kata laluan salah.',
    'auth/user-not-found': 'Emel atau kata laluan salah.',
    'auth/invalid-email': 'Format emel tidak sah.',
    'auth/email-already-in-use': 'Emel ini sudah didaftarkan. Cuba log masuk.',
    'auth/weak-password': 'Kata laluan terlalu lemah (minimum 6 aksara).',
    'auth/too-many-requests': 'Terlalu banyak percubaan. Cuba lagi sebentar.',
    'auth/network-request-failed': 'Tiada sambungan internet atau pelayan tidak dapat dicapai.',
    'auth/unauthorized-domain': 'Domain ini belum dibenarkan di Firebase Console > Authentication > Settings > Authorized domains.',
    'auth/user-disabled': 'Akaun ini telah dinyahaktifkan.',
  };
  const errText = (e) => (msgs[e && e.code] ? GS.t(msgs[e.code]) : GS.t('Ralat: {0}', (e && (e.code || e.message)) || GS.t('tidak diketahui')));

  /* ---------- muat SDK (versi dikunci) ---------- */
  async function loadSdk() {
    if (A.sdk) return A.sdk;
    const base = 'https://www.gstatic.com/firebasejs/' + cfg().sdkVersion + '/';
    const [app, auth, fs] = await Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js')]);
    const fbApp = app.initializeApp(cfg().firebase);
    A.sdk = { app, auth, fs, authInst: auth.getAuth(fbApp), db: fs.getFirestore(fbApp) };
    return A.sdk;
  }

  /* ---------- lesen ---------- */
  const toDate = (v) => (!v ? null : typeof v.toDate === 'function' ? v.toDate() : new Date(v));
  A.licenseState = function () {
    const l = A.license;
    if (!l) return 'none';
    if (l.active !== true) return 'inactive';
    const exp = toDate(l.expiresAt);
    if (exp && exp.getTime() < Date.now()) return 'expired';
    return 'active';
  };
  const licenseLabel = { active: 'Lesen aktif', none: 'Tiada lesen', inactive: 'Lesen tidak aktif', expired: 'Lesen tamat' };

  /* ---------- selepas log masuk: profil, admin, lesen ---------- */
  async function afterLogin(user) {
    const { fs, db } = A.sdk;
    A.isAdmin = false;
    A.license = null;
    try {
      const ref = fs.doc(db, 'users', user.uid);
      const snap = await fs.getDoc(ref);
      if (!snap.exists()) {
        await fs.setDoc(ref, { displayName: user.displayName || '', email: user.email || '', createdAt: fs.serverTimestamp(), updatedAt: fs.serverTimestamp() });
      } else {
        await fs.updateDoc(ref, { updatedAt: fs.serverTimestamp() });
      }
    } catch (e) { console.warn('[GS] profil tidak dapat disimpan', e); }
    try { A.isAdmin = (await fs.getDoc(fs.doc(db, 'admins', user.uid))).exists(); } catch (e) { A.isAdmin = false; }
    try {
      const l = await fs.getDoc(fs.doc(db, 'licenses', user.uid));
      A.license = l.exists() ? l.data() : null;
    } catch (e) { A.license = null; }
  }

  /* ---------- UI: skrin log masuk ---------- */
  let gate = null;
  function closeGate() {
    if (!gate) return;
    const g = gate;
    gate = null;
    g.classList.remove('in');
    setTimeout(() => g.remove(), 400);
  }

  function showGate(mode) {
    // mode: 'login' | 'license'
    if (gate) gate.remove();
    const c = cfg();
    const err = h('div', { class: 'auth-err', role: 'alert' });
    const say = (m) => { err.textContent = m || ''; };
    const busy = (b) => gate.querySelectorAll('button, input').forEach((el) => (el.disabled = b));

    const body = h('div', { class: 'auth-card' },
      h('div', { class: 'auth-brand' },
        h('span', { html: '<svg class="brand-logo" viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="ag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2ea8ff"/><stop offset=".55" stop-color="#7a5cff"/><stop offset="1" stop-color="#ff3b5c"/></linearGradient></defs><path d="M24 3l18 10.5v21L24 45 6 34.5v-21z" fill="none" stroke="url(#ag)" stroke-width="3.5" stroke-linejoin="round"/><path d="M31 19a8 8 0 1 0 0 10h-7" fill="none" stroke="#eaf4ff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' }),
        h('span', { class: 'brand-name' }, 'GLOBAL STREAMER')));

    body.append(GS.i18n.switcher());
    if (mode === 'license') {
      body.append(
        h('h2', null, 'Lesen diperlukan'),
        h('p', { class: 'muted' }, GS.t('Akaun {0} tiada lesen aktif ({1}). Hubungi penjual untuk mengaktifkan lesen.', (A.user && A.user.email) || '', GS.t(licenseLabel[A.licenseState()]).toLowerCase())),
        h('div', { class: 'btn-row' }, h('button', { class: 'btn', onClick: () => A.signOut() }, 'Log keluar')));
    } else {
      const email = h('input', { type: 'email', autocomplete: 'email', placeholder: 'Emel', 'aria-label': 'Emel' });
      const pass = h('input', { type: 'password', autocomplete: 'current-password', placeholder: 'Kata laluan', 'aria-label': 'Kata laluan' });
      const run = async (fn) => { say(''); busy(true); try { await fn(); } catch (e) { if (e && e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') say(errText(e)); } finally { if (gate) busy(false); } };
      const { auth, authInst } = A.sdk;
      body.append(
        h('h2', null, 'Log masuk'),
        h('p', { class: 'muted' }, 'Gunakan akaun anda untuk meneruskan.'),
        GS.platforms && GS.platforms.native() ? null : h('button', { class: 'btn google', onClick: () => run(() => auth.signInWithPopup(authInst, new auth.GoogleAuthProvider())) }, 'Teruskan dengan Google'),
        GS.platforms && GS.platforms.native() ? null : h('div', { class: 'auth-or' }, h('span', null, 'atau')),
        h('form', { class: 'auth-form', onSubmit: (e) => { e.preventDefault(); run(() => auth.signInWithEmailAndPassword(authInst, email.value.trim(), pass.value)); } },
          email, pass,
          h('div', { class: 'btn-row' },
            h('button', { class: 'btn primary', type: 'submit' }, 'Log masuk'),
            c.allowSignup ? h('button', { class: 'btn ghost', type: 'button', onClick: () => run(() => auth.createUserWithEmailAndPassword(authInst, email.value.trim(), pass.value)) }, 'Daftar akaun') : null)),
        h('button', { class: 'link-btn', type: 'button', onClick: () => run(async () => {
          if (!email.value.trim()) { say(GS.t('Masukkan emel dahulu, kemudian tekan "Lupa kata laluan".')); return; }
          await auth.sendPasswordResetEmail(authInst, email.value.trim());
          say(GS.t('Emel tetapan semula kata laluan telah dihantar (semak juga folder spam).'));
        }) }, 'Lupa kata laluan?'),
        err,
        c.allowGuest ? h('button', { class: 'link-btn', type: 'button', onClick: () => { A.guest = true; closeGate(); renderChip(); GS.emit('auth:changed'); } }, 'Teruskan sebagai tetamu (demo)') : null);
    }
    gate = h('div', { class: 'auth-gate', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Log masuk' }, body);
    document.body.append(gate);
    requestAnimationFrame(() => gate && gate.classList.add('in'));
    const first = gate.querySelector('input');
    if (first) first.focus();
  }

  function showUnavailable(message) {
    if (gate) gate.remove();
    const body = h('div', { class: 'auth-card' }, h('h2', null, 'Log masuk tidak tersedia'), h('p', { class: 'muted' }, message),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn primary', onClick: () => location.reload() }, 'Cuba lagi'),
        cfg().allowGuest ? h('button', { class: 'btn ghost', onClick: () => { A.guest = true; closeGate(); renderChip(); GS.emit('auth:changed'); } }, 'Teruskan sebagai tetamu') : null));
    body.append(GS.i18n.switcher());
    gate = h('div', { class: 'auth-gate', role: 'alertdialog' }, body);
    document.body.append(gate);
    requestAnimationFrame(() => gate && gate.classList.add('in'));
  }

  /* ---------- UI: chip pengguna di bar atas ---------- */
  function renderChip() {
    const el = GS.$('#userChip');
    if (!el) return;
    el.innerHTML = '';
    if (!A.enabled) return;
    if (!A.user) {
      el.append(h('button', { class: 'btn ghost sm', onClick: () => showGate('login') }, A.guest ? 'Tetamu · Log masuk' : 'Log masuk'));
      return;
    }
    const st = A.licenseState();
    const name = A.user.displayName || A.user.email || GS.t('Pengguna');
    el.append(
      h('span', { class: 'avatar', 'aria-hidden': 'true' }, name.trim()[0].toUpperCase()),
      h('span', { class: 'who' }, h('b', null, name), h('small', { class: 'lic ' + st }, (A.isAdmin ? 'Admin · ' : '') + GS.t(licenseLabel[st]))),
      h('button', { class: 'icon-btn', title: 'Log keluar', 'aria-label': 'Log keluar', onClick: () => A.signOut(), html: icon('x', 16) }));
  }

  A.signOut = async function () {
    if (A.sdk) await A.sdk.auth.signOut(A.sdk.authInst);
    A.guest = false;
  };

  /* ---------- permulaan ---------- */
  A.init = async function () {
    const c = cfg();
    if (!c.authEnabled || !c.firebase || !c.firebase.apiKey) { A.enabled = false; return; }
    A.enabled = true;
    try {
      await loadSdk();
    } catch (e) {
      console.warn('[GS] SDK Firebase gagal dimuat', e);
      if (c.requireLogin) showUnavailable('Tidak dapat memuat perkhidmatan log masuk. Semak sambungan internet anda.');
      renderChip();
      return;
    }
    const { auth, authInst } = A.sdk;
    let first = true;
    await new Promise((resolve) => {
      auth.onAuthStateChanged(authInst, async (user) => {
        A.user = user || null;
        if (user) { A.guest = false; await afterLogin(user); }
        else { A.isAdmin = false; A.license = null; }
        // keputusan akses
        if (user) {
          if (c.requireLicense && A.licenseState() !== 'active') showGate('license');
          else closeGate();
        } else if (c.requireLogin && !A.guest) {
          showGate('login');
        }
        renderChip();
        GS.emit('auth:changed', { user: A.user });
        if (first) { first = false; resolve(); }
      });
    });
  };
})();
