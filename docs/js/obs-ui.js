/** Panel sambungan & kawalan OBS (digunakan dalam studio dan halaman OBS). */
import { obs, obsErrorMessage } from './obs.js';
import { h, icon, toast, confirmDialog } from './ui.js';

const KEY = 'gs.obs.conn';
const loadConn = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
const saveConn = (c) => { try { localStorage.setItem(KEY, JSON.stringify({ host: c.host, port: c.port })); } catch { /* abaikan */ } };
const getPass = () => { try { return sessionStorage.getItem('gs.obs.pass') || ''; } catch { return ''; } };
const setPass = (p) => { try { sessionStorage.setItem('gs.obs.pass', p); } catch { /* abaikan */ } };

const STATUS_TEXT = { disconnected: 'Tidak bersambung', connecting: 'Menyambung…', connected: 'Bersambung' };

/**
 * @param host  elemen bekas
 * @param opts  { project, overlayUrl(): string }  (tanpa project = mod sambungan sahaja)
 */
export function mountObsPanel(host, opts = {}) {
  const conn = { host: 'localhost', port: 4455, ...loadConn() };
  let error = '';
  let busy = '';
  let installNote = null;

  const render = () => {
    host.replaceChildren(obs.status === 'connected' ? connectedView() : connectView());
  };

  const connectView = () => {
    const hostIn = h('input', { class: 'input', value: conn.host, placeholder: 'localhost', autocomplete: 'off', spellcheck: false, 'aria-label': 'Alamat OBS' });
    const portIn = h('input', { class: 'input', value: String(conn.port), inputMode: 'numeric', 'aria-label': 'Port OBS' });
    const passIn = h('input', { class: 'input', type: 'password', value: getPass(), placeholder: 'Kosongkan jika tiada', autocomplete: 'off', 'aria-label': 'Kata laluan OBS WebSocket' });
    const btn = h('button', { class: 'btn block', type: 'submit', disabled: obs.status === 'connecting' }, icon('plug'), obs.status === 'connecting' ? 'Menyambung…' : 'Sambung ke OBS');
    const form = h('form', {
      class: 'p-body', style: { padding: 0 },
      onsubmit: async (e) => {
        e.preventDefault();
        conn.host = hostIn.value.trim() || 'localhost';
        conn.port = Number(portIn.value) || 4455;
        saveConn(conn); setPass(passIn.value);
        error = '';
        render();
        try {
          await obs.connect({ ...conn, password: passIn.value });
          toast('Berjaya disambungkan ke OBS.', 'ok');
        } catch (err) { error = obsErrorMessage(err); }
        render();
      },
    },
    error ? h('div', { class: 'alert error', role: 'alert' }, error) : null,
    h('div', { class: 'row2' }, h('div', { class: 'field' }, h('label', {}, 'Alamat'), hostIn), h('div', { class: 'field' }, h('label', {}, 'Port'), portIn)),
    h('div', { class: 'field' }, h('label', {}, 'Kata laluan WebSocket'), passIn),
    btn,
    h('p', { class: 'hint' }, 'Di OBS: ', h('b', {}, 'Tools → WebSocket Server Settings'), ' → aktifkan “Enable WebSocket server”. OBS 28 ke atas sudah termasuk WebSocket.'));
    return h('div', {}, statusLine(), form);
  };

  const statusLine = () => h('div', { class: 'status-line', 'data-s': obs.status, style: { marginBottom: '10px' } }, h('i'),
    h('span', {}, STATUS_TEXT[obs.status] + (obs.status === 'connected' && obs.state.version ? ` • OBS ${obs.state.version}` : '')));

  const run = async (label, fn) => {
    busy = label; render();
    try { await fn(); } catch (e) { toast(obsErrorMessage(e), 'error', 5200); }
    busy = ''; render();
  };

  const connectedView = () => {
    const { state } = obs;
    const wrap = h('div', { class: 'p-body', style: { padding: 0 } }, statusLine());

    if (opts.project) {
      const p = opts.project;
      const resize = h('input', { type: 'checkbox', checked: true, id: 'obs-resize' });
      wrap.appendChild(h('div', { class: 'field' },
        h('button', {
          class: 'btn block', disabled: !!busy,
          onclick: () => run('install', async () => {
            const r = await obs.installOverlay({
              name: p.name, url: opts.overlayUrl(), width: p.size.w, height: p.size.h, resizeCanvas: resize.checked,
            });
            installNote = r;
            toast(`Overlay dipasang dalam adegan “${r.scene}”.`, 'ok');
          }),
        }, icon('plug'), busy === 'install' ? 'Memasang…' : 'Pasang ke OBS'),
        h('label', { class: 'switch', style: { marginTop: '6px' } }, h('span', {}, `Laraskan kanvas OBS kepada ${p.size.w}×${p.size.h}`), resize)));
      if (installNote) {
        wrap.appendChild(h('div', { class: 'alert ok' },
          h('b', {}, 'Siap! '), `Adegan “${installNote.scene}” dipilih. `,
          installNote.resized ? `Kanvas ditukar kepada ${p.size.w}×${p.size.h}. ` : '',
          installNote.resizeSkipped || '',
          h('br'), 'Langkah akhir: dalam OBS, tambah ', h('b', {}, 'Video Capture Device'), ' (kamera) dan/atau ', h('b', {}, 'Display/Window Capture'),
          ' lalu seret DI BAWAH “', installNote.input, '”.'));
      }
    }

    const sel = h('select', {
      class: 'select', 'aria-label': 'Adegan OBS',
      onchange: (e) => run('scene', () => obs.setScene(e.target.value)),
    }, (state.scenes.length ? state.scenes : [state.currentScene]).map((n) => h('option', { value: n, selected: n === state.currentScene }, n)));
    wrap.appendChild(h('div', { class: 'field' }, h('label', {}, 'Adegan semasa'), sel));

    const streamBtn = h('button', {
      class: 'btn secondary out-btn' + (state.streaming ? ' live-on' : ''), disabled: !!busy,
      onclick: async () => {
        if (state.streaming) return run('stream', () => obs.stopStream());
        const ok = await confirmDialog({
          title: 'Mula siaran langsung?',
          message: 'OBS akan mula menyiar ke platform yang telah ditetapkan di Settings → Stream. Penonton akan dapat melihat siaran anda.',
          confirmText: 'Mula siaran',
        });
        if (ok) run('stream', () => obs.startStream());
      },
    }, icon(state.streaming ? 'stop' : 'play'), state.streaming ? 'Henti siaran' : 'Mula siaran');
    const recBtn = h('button', {
      class: 'btn secondary out-btn' + (state.recording ? ' live-on' : ''), disabled: !!busy,
      onclick: () => run('rec', () => (state.recording ? obs.stopRecord() : obs.startRecord())),
    }, icon(state.recording ? 'stop' : 'rec'), state.recording ? 'Henti rakam' : 'Mula rakam');
    wrap.appendChild(h('div', { class: 'field' }, h('span', { class: 'label' }, 'Output'), h('div', { style: { display: 'flex', gap: '8px' } }, streamBtn, recBtn)));
    if (state.streaming || state.recording) {
      wrap.appendChild(h('p', { class: 'hint' }, [state.streaming ? '● Sedang menyiar. ' : '', state.recording ? '● Sedang merakam.' : '']));
    }
    wrap.appendChild(h('button', { class: 'btn ghost sm', onclick: () => { obs.disconnect(); installNote = null; } }, 'Putuskan sambungan'));
    return wrap;
  };

  const rerender = () => render();
  obs.addEventListener('status', rerender);
  obs.addEventListener('state', rerender);
  render();
  return { destroy() { obs.removeEventListener('status', rerender); obs.removeEventListener('state', rerender); } };
}

/** Halaman panduan + sambungan OBS. */
export function viewObsPage(view, { origin }) {
  const panelHost = h('div');
  const page = h('div', { class: 'page' },
    h('div', { class: 'page-head' }, h('div', {}, h('h1', {}, 'Sambungan OBS Studio'), h('p', {}, 'Sambung GLOBAL STREAMER ke OBS untuk pasang overlay, tukar adegan, siar dan rakam.'))),
    h('div', { class: 'guide' },
      h('section', { class: 'panel' },
        h('h2', {}, 'Panduan 5 langkah'),
        h('ol', { class: 'steps' },
          h('li', {}, 'Pasang ', h('b', {}, 'OBS Studio 28 atau lebih baharu'), ' (percuma di obsproject.com). WebSocket sudah terbina dalam.'),
          h('li', {}, 'Di OBS: ', h('b', {}, 'Tools → WebSocket Server Settings'), ' → tandakan ', h('b', {}, 'Enable WebSocket server'), '. Biarkan port ', h('span', { class: 'code' }, '4455'), ' dan tetapkan kata laluan.'),
          h('li', {}, 'Dalam GLOBAL STREAMER pilih templat, buka ', h('b', {}, 'Studio'), ', kemudian isi alamat dan kata laluan di panel kanan lalu tekan ', h('b', {}, 'Sambung ke OBS'), '.'),
          h('li', {}, 'Tekan ', h('b', {}, 'Pasang ke OBS'), '. Adegan dan Browser Source dicipta, dan saiz kanvas OBS disamakan dengan templat.'),
          h('li', {}, 'Di OBS tambah ', h('b', {}, 'kamera'), ' dan/atau ', h('b', {}, 'tangkap skrin'), ' lalu seret ke ', h('b', {}, 'bawah'), ' sumber overlay. Kamera akan kelihatan dalam bingkai. Tekan ', h('b', {}, 'Mula rakam'), ' atau ', h('b', {}, 'Mula siaran'), '.')),
        h('h3', {}, 'Tanpa sambungan WebSocket (manual)'),
        h('ol', { class: 'steps' },
          h('li', {}, 'Dalam Studio, salin ', h('b', {}, 'Pautan Browser Source'), '.'),
          h('li', {}, 'OBS → Sources → ', h('b', {}, '+ → Browser'), ' → tampal pautan → set Width/Height seperti yang dipaparkan → OK.'),
          h('li', {}, 'Tambah kamera/skrin dan letakkan di bawah sumber Browser tadi.')),
        h('div', { class: 'faq', style: { marginTop: '18px' } },
          h('details', {}, h('summary', {}, 'Pautan overlay tidak kelihatan / kosong di OBS'), h('p', {}, `OBS mesti dapat membuka ${origin}. Jika pelayan berjalan di komputer lain, gunakan alamat rangkaian (bukan localhost). Klik kanan Browser Source → Refresh.`)),
          h('details', {}, h('summary', {}, 'Tidak dapat menyambung ke OBS'), h('p', {}, 'Semak WebSocket Server diaktifkan, port dan kata laluan betul, dan tiada firewall menyekat port 4455. Jika OBS di komputer lain, masukkan alamat IP komputer itu.')),
          h('details', {}, h('summary', {}, 'Mengapa kamera saya tidak muncul dalam bingkai?'), h('p', {}, 'Overlay mempunyai lubang lutsinar. Sumber kamera mesti berada DI BAWAH overlay dalam senarai Sources OBS dan diletakkan pada kedudukan lubang.')),
          h('details', {}, h('summary', {}, 'Boleh guna dalam beberapa projek serentak?'), h('p', {}, 'Ya. Setiap projek ada pautan sendiri dan dipasang sebagai adegan berasingan, jadi anda boleh bertukar adegan di OBS.')))),
      h('section', { class: 'panel' }, h('h2', {}, 'Sambungan'), panelHost)));
  view.replaceChildren(page);
  const m = mountObsPanel(panelHost);
  return { destroy: () => m.destroy() };
}
