/* Global Streamer - antara muka Suara & Bot: jalur kecil dalam Audio Mixer + tetingkap tetapan. */
(function () {
  'use strict';
  const GS = window.GS;
  const { h } = GS;
  const U = (GS.voiceui = { modal: null });
  const V = () => GS.voice;
  const cfg = () => GS.state.voice;
  const save = () => GS.save();
  const FX_LABEL = { kill: 'Kill', death: 'Mati', victory: 'Victory', defeat: 'Defeat' };

  const short = (t, n) => { t = String(t || ''); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
  function statusText() {
    const v = V();
    if (v.error) return { cls: 'bad', text: v.error, title: v.errorDetail || '' };
    if (v.running) {
      const hd = v.heard && Date.now() - v.heard.at < 30000 ? v.heard : v.last;
      const last = hd ? GS.t('Didengar: "{0}"', short(hd.text, 40)) : (v.engine === 'cloud' ? GS.t('Mendengar (Whisper)… sebut nama bot') : GS.t('Mendengar…'));
      return { cls: 'ok', text: last };
    }
    return { cls: '', text: GS.t('Mati. Tekan Hidupkan untuk kawalan suara.') };
  }

  /** Jalur dalam Audio Mixer. */
  U.strip = function () {
    const v = V();
    if (v.comingSoon) {
      return h('div', { class: 'strip voice-strip coming-soon', id: 'voiceStrip', 'aria-disabled': 'true' },
        h('div', { class: 'strip-head' }, h('span', { class: 'strip-name' }, 'Suara & Bot')),
        h('div', { class: 'cs-bar', id: 'voiceComingSoon' }, 'AKAN DATANG'),
        h('button', { type: 'button', class: 'btn tiny', id: 'btnVoiceToggle', disabled: true }, 'Hidupkan bot'),
        h('button', { type: 'button', class: 'btn tiny ghost', id: 'btnVoiceOpen', disabled: true }, 'Atur…'));
    }
    const s = statusText();
    return h('div', { class: 'strip voice-strip' + (v.running ? ' on' : ''), id: 'voiceStrip' },
      h('div', { class: 'strip-head' }, h('span', { class: 'strip-name', title: GS.t('Kawalan suara dan bot') }, 'Suara & Bot'), h('i', { class: 'voice-dot ' + (v.running ? 'on' : '') })),
      h('div', { class: 'strip-note voice-status ' + s.cls, id: 'voiceStripStatus', title: s.title || '' }, s.text),
      h('button', { type: 'button', class: 'btn tiny' + (v.running ? '' : ' primary'), id: 'btnVoiceToggle', onClick: async () => { const ok = await v.toggle(); if (!ok && v.error) GS.toast(v.error, 'warn'); } }, v.running ? 'Matikan bot' : 'Hidupkan bot'),
      h('button', { type: 'button', class: 'btn tiny ghost', id: 'btnVoiceOpen', onClick: () => U.open() }, 'Atur…'));
  };

  function refresh() {
    const el = GS.$('#voiceStrip');
    if (el) { const n = U.strip(); el.replaceWith(n); }
    if (U.modal && U.modal.card && U.modal.card.isConnected) U.drawLive();
  }

  /* ---------- tetingkap tetapan ---------- */
  const field = (label, ctl, hint) => h('label', { class: 'field' }, h('span', null, label), ctl, hint ? h('small', { class: 'muted' }, hint) : null);
  const check = (label, get, set, disabled) => h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!get(), disabled: !!disabled, onChange: (e) => { set(e.target.checked); save(); } }), label);

  function chanSelect(src) {
    const A = GS.audio;
    const opts = [['auto', GS.t('Automatik')]].concat(A.channels.filter((c) => c.kind !== 'sfx').map((c) => [c.id, c.label + (c.stream ? '' : ' · ' + GS.t('belum ada input'))]));
    return h('select', { 'data-chan': src, onChange: (e) => { cfg()[src].channel = e.target.value; save(); V().retap(); } },
      opts.map(([v, l]) => h('option', { value: v, selected: cfg()[src].channel === v }, l)));
  }

  U.drawLive = function () {
    const card = U.modal && U.modal.card;
    if (!card) return;
    const st = GS.$('#voiceModalStatus', card);
    const v = V();
    const s = statusText();
    if (st) {
      const eng = v.engine === 'cloud' ? GS.t('Pengecam: Groq Whisper (faham Melayu)') : v.engine === 'windows' ? GS.t(v.info.mic && v.info.mic.input === 'device' ? 'Pengecam: Windows (mikrofon lalai)' : 'Pengecam: Windows (luar talian)') : v.engine === 'web' ? GS.t('Pengecam: pelayar (internet)') : '';
      const inf = Object.keys(v.info).map((k) => (k === 'mic' ? GS.t('Suara saya') : GS.t('Bunyi game')) + ': ' + (v.info[k].name || v.info[k].culture || '')).join(' · ');
      st.className = 'voice-status big ' + s.cls;
      st.textContent = [s.text, v.running ? eng : '', v.running ? inf : ''].filter(Boolean).join('  ·  ');
    }
    const btn = GS.$('#voiceModalToggle', card);
    if (btn) { btn.textContent = GS.t(v.running ? 'Matikan bot' : 'Hidupkan bot'); btn.classList.toggle('primary', !v.running); }
    const log = GS.$('#voiceLog', card);
    if (log) {
      log.innerHTML = '';
      v.log.slice(0, 8).forEach((e) => log.append(h('div', { class: 'vlog ' + e.kind }, h('b', null, e.kind === 'bot' ? '🤖' : e.source === 'game' ? '🎮' : '🎤'), h('span', null, e.kind === 'bot' ? e.text : '"' + short(e.text, 60) + '"' + (e.result ? '  →  ' + e.result : '')))));
      if (!log.children.length) log.append(h('div', { class: 'muted note' }, 'Belum ada. Cuba sebut sesuatu atau guna kotak Uji di atas.'));
    }
  };

  U.open = function () {
    if (V().comingSoon) return;
    if (U.modal && U.modal.card && U.modal.card.isConnected) return;
    const v = V();
    const nat = !!(window.gsNative && window.gsNative.voice);
    const c = cfg();

    /* efek */
    const trig = h('div', { class: 'voice-trig' }, c.triggers.map((t) =>
      field(GS.t(FX_LABEL[t.fx] || t.fx), h('textarea', { rows: 2, 'data-fx': t.fx, spellcheck: 'false', onInput: (e) => { t.phrases = e.target.value; save(); } }, Array.isArray(t.phrases) ? t.phrases.join(', ') : t.phrases))));

    /* soalan & jawapan */
    const qaBox = h('div', { class: 'qa-list' });
    const drawQA = () => {
      qaBox.innerHTML = '';
      c.bot.qa.forEach((e, i) => qaBox.append(h('div', { class: 'qa-row' },
        h('input', { type: 'text', value: e.q, 'data-qa': 'q', placeholder: 'soalan (pisahkan dengan |)', 'aria-label': GS.t('Soalan'), onInput: (x) => { e.q = x.target.value; save(); } }),
        h('input', { type: 'text', value: e.a, 'data-qa': 'a', placeholder: 'jawapan', 'aria-label': GS.t('Jawapan'), onInput: (x) => { e.a = x.target.value; save(); } }),
        h('button', { type: 'button', class: 'icon-btn sm', title: 'Padam', 'aria-label': GS.t('Padam'), onClick: () => { c.bot.qa.splice(i, 1); save(); drawQA(); }, html: GS.icon('trash', 14) }))));
      qaBox.append(h('button', { type: 'button', class: 'btn ghost tiny', id: 'btnQaAdd', onClick: () => { c.bot.qa.push({ q: '', a: '' }); save(); drawQA(); } }, 'Tambah soalan'));
    };
    drawQA();

    /* ujian */
    const testIn = h('input', { type: 'text', id: 'voiceTestIn', placeholder: 'cth: double kill   atau   Jarvis siapa noob', 'aria-label': GS.t('Frasa ujian') });
    const testOut = h('div', { class: 'muted note', id: 'voiceTestOut' });
    const runTest = (source) => {
      const r = v.handleText({ source, text: testIn.value, test: true });
      testOut.textContent = r.fx ? GS.t('Dikesan: efek {0} ("{1}")', FX_LABEL[r.fx] || r.fx, r.phrase) : r.bot === 'jawab' ? GS.t('Bot menjawab: {0}', r.answer) : r.bot === 'ai' ? GS.t('Bot berfikir (AI)… jawapan akan disebut dan dipaparkan.') : r.bot === 'menunggu' ? GS.t('Bot dipanggil. Sebut soalan seterusnya (uji lagi).') : r.bot === 'tiada' ? GS.t('Bot tiada jawapan untuk soalan itu (tetapkan jawapan lalai atau tambah soalan).') : GS.t('Tiada padanan ({0}).', r.ignored || '');
      U.drawLive();
    };
    const voices = (window.speechSynthesis && speechSynthesis.getVoices ? speechSynthesis.getVoices() : []).map((x) => x.name);
    const voiceCtl = voices.length && !c.bot.inStream
      ? h('select', { onChange: (e) => { c.bot.voiceName = e.target.value; save(); } }, [h('option', { value: '' }, GS.t('Lalai sistem'))].concat(voices.map((n) => h('option', { value: n, selected: c.bot.voiceName === n }, n))))
      : h('input', { type: 'text', value: c.bot.voiceName, placeholder: 'cth Microsoft Zira Desktop (kosong = lalai)', onInput: (e) => { c.bot.voiceName = e.target.value.trim(); save(); } });

    /* suara bot: jantina + penyedia */
    const t = c.bot.tts;
    const genderBtns = [['female', 'Perempuan'], ['male', 'Lelaki']].map(([g, l]) => h('button', { type: 'button', 'data-gender': g, class: t.gender === g ? 'on' : '', role: 'radio', 'aria-checked': t.gender === g ? 'true' : 'false',
      onClick: () => { t.gender = g; save(); v.prewarm(); drawSysInfo(); genderBtns.forEach((b) => { b.classList.toggle('on', b.dataset.gender === g); b.setAttribute('aria-checked', b.dataset.gender === g ? 'true' : 'false'); }); } }, l));
    const syncGender = () => genderBtns.forEach((b) => { b.classList.toggle('on', b.dataset.gender === t.gender); b.setAttribute('aria-checked', b.dataset.gender === t.gender ? 'true' : 'false'); });
    const gender = h('div', { class: 'seg-mini voice-gender', role: 'radiogroup', 'aria-label': GS.t('Jantina suara bot') }, genderBtns);
    const elevenBox = h('div', { class: 'eleven-box', id: 'elevenBox' });
    const quotaOut = h('div', { class: 'muted note', id: 'elevenQuota' });
    const azureBox = h('div', { class: 'eleven-box', id: 'azureBox' });
    const drawAzure = () => {
      azureBox.innerHTML = '';
      azureBox.hidden = t.provider !== 'azure';
      if (azureBox.hidden) return;
      const keyIn = h('input', { type: 'password', id: 'azureKey', autocomplete: 'off', spellcheck: 'false', placeholder: 'Key 1', value: v.azureKey(), onChange: (e) => { v.setAzureKey(e.target.value); v.prewarm(); } });
      azureBox.append(
        h('p', { class: 'muted note' }, 'Microsoft Azure Speech (tier percuma F0: 500,000 aksara sebulan, suara neural Melayu lelaki Osman dan perempuan Yasmin). Langkah: portal.azure.com > Create a resource > Speech > Pricing tier "Free F0" > selepas dibuat, buka Keys and Endpoint dan salin Key 1 serta Location/Region ke bawah.'),
        h('div', { class: 'grid2' },
          field('Kunci Azure Speech (Key 1)', keyIn, nat ? 'Disimpan disulitkan oleh Windows, bukan dalam fail tetapan.' : 'Versi web: hanya dalam memori, hilang apabila tab ditutup.'),
          field('Kawasan (Region)', h('input', { type: 'text', id: 'azureRegion', value: t.azure.region, placeholder: 'southeastasia', onInput: (e) => { t.azure.region = e.target.value.trim().toLowerCase(); save(); } }), 'Cth southeastasia (Singapura), eastasia, eastus.')),
        h('details', { class: 'dev-adv' }, h('summary', null, GS.t('Nama suara (lanjutan)')),
          h('div', { class: 'grid2' },
            field('Lelaki (Melayu)', h('input', { type: 'text', value: t.azure.maleMs, onInput: (e) => { t.azure.maleMs = e.target.value.trim(); save(); } })),
            field('Perempuan (Melayu)', h('input', { type: 'text', value: t.azure.femaleMs, onInput: (e) => { t.azure.femaleMs = e.target.value.trim(); save(); } })),
            field('Lelaki (English)', h('input', { type: 'text', value: t.azure.maleEn, onInput: (e) => { t.azure.maleEn = e.target.value.trim(); save(); } })),
            field('Perempuan (English)', h('input', { type: 'text', value: t.azure.femaleEn, onInput: (e) => { t.azure.femaleEn = e.target.value.trim(); save(); } })))));
    };
    drawAzure();
    const voiceList = h('div', { class: 'eleven-voices', id: 'elevenVoices' });
    const voiceMsg = h('div', { class: 'muted note', id: 'elevenFindMsg' });
    const playPreview = (url) => { try { if (U.prev) U.prev.pause(); U.prev = new Audio(url); U.prev.play().catch(() => GS.toast(GS.t('Pratonton tidak dapat dimainkan.'), 'warn')); } catch (e) { /* abaikan */ } };
    /* hanya dua suara: Aisyah (perempuan) dan Zain (lelaki); pengguna memilih salah satu sahaja */
    const drawVoiceList = (res) => {
      voiceList.innerHTML = '';
      const P2 = v.PREFERRED;
      [['female', 'Perempuan', 'Aisyah'], ['male', 'Lelaki', 'Zain']].forEach(([g, lab, nm]) => {
        const pf = P2[g];
        const found = ((res && res[g]) || []).find((c) => c.id === pf.id) || null;
        const cur = (g === 'male' ? t.maleVoice : t.femaleVoice) || '';
        const idNow = found ? found.id : pf.id;
        const active = t.gender === g && (cur === idNow || (found && cur === found.id));
        voiceList.append(h('div', { class: 'ev-row ev-pick' + (t.gender === g ? ' on' : ''), 'data-voice': pf.id, 'data-gender': g },
          h('div', { class: 'ev-name' }, h('b', null, nm + ' · ' + lab), h('small', null, found ? GS.t('Suara game Melayu') : GS.t('Tekan "Cari suara" dahulu'))),
          found && found.preview ? h('button', { type: 'button', class: 'btn tiny ghost', 'aria-label': GS.t('Dengar'), onClick: () => playPreview(found.preview) }, '▶') : null,
          h('button', { type: 'button', class: 'btn tiny' + (active ? '' : ' primary'), 'data-use': pf.id, disabled: !found && !cur, onClick: async () => {
            voiceMsg.textContent = GS.t('Menetapkan suara…');
            try { if (found) await v.useElevenVoice(g, found); t.gender = g; save(); voiceMsg.textContent = GS.t('Suara {0} ditetapkan: {1}.', lab, nm); drawVoiceList(res); syncGender(); } catch (e) { voiceMsg.textContent = String(e.message || e); }
          } }, active ? GS.t('Digunakan') : GS.t('Guna'))));
      });
    };
    /** Cari suara Melayu lelaki + perempuan; jika auto, terus tetapkan yang terbaik (cuba seterusnya jika suara perpustakaan tidak dibenarkan oleh pelan akaun). */
    const findVoices = async (auto) => {
      voiceMsg.textContent = GS.t('Mencari suara Melayu…'); voiceList.innerHTML = '';
      const kEl = GS.$('#elevenKey'); if (kEl && kEl.value) v.setElevenKey(kEl.value);
      try {
        const res = await v.findMalayVoices();
        const chosen = [];
        if (auto) {
          for (const g of ['male', 'female']) {
            const c = (res[g] || []).find((x) => x.id === v.PREFERRED[g].id);
            if (c) { try { await v.useElevenVoice(g, c); chosen.push(c.name); } catch (e) { res.notes.push(e.message); } }
          }
        }
        U.lastRes = res; drawVoiceList(res);
        voiceMsg.textContent = (auto && chosen.length ? GS.t('Siap: suara lelaki dan perempuan ditetapkan ({0}). Tekan "Uji suara bot".', chosen.join(', ')) : GS.t('Pilih Aisyah (perempuan) atau Zain (lelaki).')) + (res.notes.length ? '  ' + res.notes.slice(0, 1).join('') : '');
      } catch (e) { voiceMsg.textContent = String(e.message || e); }
    };
    const drawEleven = () => {
      elevenBox.innerHTML = '';
      elevenBox.hidden = t.provider !== 'eleven';
      if (elevenBox.hidden) return;
      const keyIn = h('input', { type: 'password', id: 'elevenKey', autocomplete: 'off', spellcheck: 'false', placeholder: 'sk_… / xi-api-key', value: v.elevenKey(), onChange: (e) => { v.setElevenKey(e.target.value); v.prewarm(); } });
      elevenBox.append(
        h('p', { class: 'muted note' }, 'ElevenLabs (tier percuma): daftar di elevenlabs.io, kemudian Profile > API Keys > Create, dan tampal kunci di bawah. Pelan percuma ada 10,000 aksara sebulan (jawapan yang sama tidak menggunakan kuota dua kali). Bahasa Melayu disokong oleh model multilingual.'),
        h('p', { class: 'key-note', id: 'keyNote' }, GS.t('(Pilihan: ada key ElevenLabs sendiri? Masukkan untuk guna semua suara anda.)')),
        field('Kunci API ElevenLabs', keyIn, nat ? 'Disimpan disulitkan oleh Windows, bukan dalam fail tetapan.' : 'Versi web: hanya dalam memori, hilang apabila tab ditutup.'),
        h('div', { class: 'grid2' },
          field('Model', h('select', { id: 'elevenModel', onChange: (e) => { t.model = e.target.value; save(); } }, [['eleven_multilingual_v2', 'Multilingual v2 (kualiti terbaik, 1 kredit/aksara)'], ['eleven_flash_v2_5', 'Flash v2.5 (pantas, separuh kredit)']].map(([val, l]) => h('option', { value: val, selected: t.model === val }, l)))),
          h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn ghost', id: 'btnElevenClear', onClick: () => { v.setElevenKey(''); keyIn.value = ''; quotaOut.textContent = GS.t('Kunci dipadam.'); } }, 'Padam kunci'), h('button', { type: 'button', class: 'btn ghost', id: 'btnElevenQuota', onClick: async () => { keyIn.dispatchEvent(new Event('change')); quotaOut.textContent = GS.t('Menyemak…'); try { const q = await v.elevenQuota(); quotaOut.textContent = GS.t('Digunakan {0} daripada {1} aksara bulan ini.', q.used, q.limit); } catch (e) { quotaOut.textContent = String(e.message || e); } } }, 'Semak kuota'))),
        h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn primary', id: 'btnElevenFind', onClick: () => findVoices(true) }, 'Sediakan suara Melayu (Aisyah & Zain)')),
        voiceMsg, voiceList,
        quotaOut);
      drawVoiceList(U.lastRes || null);
    };
    drawEleven();
    /* sambung pantas: tampal kunci ElevenLabs sahaja, sistem terus tukar penyedia dan cari suara Melayu */
    const quick = h('div', { class: 'eleven-box eleven-quick', id: 'elevenQuick' });
    const drawQuick = () => {
      quick.innerHTML = ''; quick.hidden = t.provider === 'eleven'; if (quick.hidden) return;
      const qIn = h('input', { type: 'password', id: 'elevenQuickKey', autocomplete: 'off', spellcheck: 'false', placeholder: 'Kunci API ElevenLabs (sk_…)' });
      quick.append(h('b', null, 'Suara lebih semula jadi: sambung ElevenLabs'),
        h('p', { class: 'muted note' }, 'Tampal kunci API ElevenLabs anda (elevenlabs.io > Profile > API Keys). Sistem akan mencari suara Melayu lelaki dan perempuan dan menetapkannya secara automatik.'),
        h('p', { class: 'key-note', id: 'keyNoteQuick' }, GS.t('(Pilihan: ada key ElevenLabs sendiri? Masukkan untuk guna semua suara anda.)')),
        h('div', { class: 'key-row' }, qIn, h('button', { type: 'button', class: 'btn primary', id: 'btnElevenConnect', onClick: () => {
          if (!qIn.value.trim()) { GS.toast(GS.t('Tampal kunci API ElevenLabs dahulu.'), 'warn'); return; }
          v.setElevenKey(qIn.value.trim()); t.provider = 'eleven'; save(); provider.value = 'eleven'; drawEleven(); drawAzure(); drawSysInfo(); drawQuick();
          const k2 = GS.$('#elevenKey'); if (k2) k2.value = v.elevenKey();
          findVoices(true);
        } }, 'Sambung dan cari suara')));
    };
    const sysInfo = h('div', { class: 'sys-voice-info', id: 'sysVoiceInfo' });
    const drawSysInfo = () => {
      sysInfo.innerHTML = '';
      sysInfo.hidden = t.provider !== 'system';
      if (sysInfo.hidden) return;
      const rep = v.systemVoiceReport('ms-MY'), g = rep[t.gender];
      const gl = t.gender === 'male' ? GS.t('Lelaki') : GS.t('Perempuan');
      if (g.name && g.langOk && g.genderOk) sysInfo.append(h('p', { class: 'note ok' }, GS.t('Suara {0} Melayu pada PC ini: {1}.', gl, g.name)));
      else sysInfo.append(h('p', { class: 'note bad' }, g.name ? GS.t('PC ini tiada suara {0} Melayu (Malaysia). Suara yang digunakan: {1} ({2}), jadi Bahasa Melayu mungkin bunyi seperti sebutan Inggeris. Untuk suara Melayu Malaysia asli lelaki dan perempuan, pilih "Microsoft Azure" (percuma) di atas, atau pasang suara Melayu di Tetapan Windows > Masa & bahasa > Pertuturan.', gl, g.name, g.lang) : GS.t('PC ini tiada suara sistem. Pilih "Microsoft Azure" (percuma) untuk suara Melayu Malaysia lelaki dan perempuan.')));
    };
    drawSysInfo();
    try { if ('speechSynthesis' in window) speechSynthesis.addEventListener('voiceschanged', drawSysInfo); } catch (e) { /* abaikan */ }
    const provider = h('select', { id: 'ttsProvider', onChange: (e) => { t.provider = e.target.value; save(); drawEleven(); drawAzure(); drawSysInfo(); drawQuick(); v.prewarm(); } },
      [['system', 'Suara sistem (percuma, tanpa internet)'], ['azure', 'Microsoft Azure: suara neural Melayu (percuma 500,000 aksara/bulan, perlu kunci)'], ['eleven', 'ElevenLabs: suara AI semula jadi (percuma 10,000 aksara/bulan, perlu kunci)']].map(([val, l]) => h('option', { value: val, selected: t.provider === val }, l)));

    drawQuick();
    /* pengumum: bahasa dan teks setiap efek */
    const ANN_ORDER = ['kill', 'first blood', 'double kill', 'triple kill', 'maniac', 'savage', 'killing spree', 'legendary', 'shutdown', 'death', 'victory', 'defeat', 'fullitem'];
    const ANN_LABEL = { kill: 'Kill', 'first blood': 'First Blood', 'double kill': 'Double Kill', 'triple kill': 'Triple Kill', maniac: 'Maniac', savage: 'Savage', 'killing spree': 'Killing Spree', legendary: 'Legendary', shutdown: 'Shutdown', death: 'Mati', victory: 'Victory', defeat: 'Defeat', fullitem: 'Item Penuh' };
    const annBox = h('div', { class: 'ann-grid', id: 'annBox' });
    const drawAnn = () => {
      annBox.innerHTML = '';
      const set = c.announcer.lang === 'ms-MY' ? c.announcer.textsMs : c.announcer.textsEn;
      ANN_ORDER.forEach((k) => annBox.append(h('label', { class: 'field' }, h('span', null, GS.t(ANN_LABEL[k])), h('input', { type: 'text', 'data-ann': k, value: set[k] || '', placeholder: GS.t('(senyap)'), onInput: (e) => { set[k] = e.target.value; save(); }, onChange: () => v.prewarm() }))));
    };
    const annLang = h('select', { id: 'annLang', onChange: (e) => { c.announcer.lang = e.target.value; save(); drawAnn(); v.prewarm(); } },
      [['en-US', 'English (disyorkan: "Double kill", "Victory")'], ['ms-MY', 'Bahasa Melayu ("Bunuh dua", "Kemenangan")']].map(([val, l]) => h('option', { value: val, selected: c.announcer.lang === val }, l)));
    drawAnn();
    const sayIn = h('input', { type: 'text', id: 'voiceSayIn', placeholder: 'cth: Selamat datang ke siaran langsung saya!', 'aria-label': GS.t('Teks untuk disebut'), onKeydown: (e) => { if (e.key === 'Enter') GS.$('#btnVoiceSay').click(); } });
    const keyBlur = () => { const k = GS.$('#elevenKey'); if (k) v.setElevenKey(k.value); const z = GS.$('#azureKey'); if (z) v.setAzureKey(z.value); };
    /* otak AI: jawapan spontan tanpa skrip (kunci percuma sendiri); tanpa kunci: keperibadian luar talian */
    const aiBox = h('div', { class: 'eleven-box', id: 'aiBox' });
    const aiOut = h('div', { class: 'muted note', id: 'aiOut' });
    const drawAi = () => {
      aiBox.innerHTML = '';
      const A = v.AI, pv = c.bot.ai.provider;
      const keyIn = h('input', { type: 'password', id: 'aiKey', autocomplete: 'off', spellcheck: 'false', placeholder: 'API key', value: v.aiKey(), onChange: (e) => { v.setAiKey(e.target.value); const n = GS.$('#sttNote'); if (n) { const on = !!v.sttKey(); n.className = on ? 'muted note' : 'key-note'; n.textContent = on ? GS.t('Telinga bot: Groq Whisper aktif (faham Bahasa Melayu).') : GS.t('(Untuk bot faham Bahasa Melayu, pilih Groq dan masukkan key Groq. Tanpa itu, pengecam Windows Inggeris digunakan dan kurang tepat.)'); } } });
      aiBox.append(
        h('h4', null, 'Otak AI bot (jawapan spontan, tanpa skrip)'),
        h('p', { class: 'muted note' }, 'Dengan kunci AI percuma, bot menjawab apa-apa soalan secara spontan dan kreatif (bukan daripada senarai), dan menggunakan data game semasa (hero, K/D/A, rekod). Daftar percuma di aistudio.google.com (Google Gemini) atau console.groq.com (Groq), buat API key dan tampal di bawah. Tanpa kunci, bot guna jawapan spontan luar talian yang lebih terhad.'),
        h('p', { class: v.sttKey() ? 'muted note' : 'key-note', id: 'sttNote' }, v.sttKey() ? GS.t('Telinga bot: Groq Whisper aktif (faham Bahasa Melayu).') : GS.t('(Untuk bot faham Bahasa Melayu, pilih Groq dan masukkan key Groq. Tanpa itu, pengecam Windows Inggeris digunakan dan kurang tepat.)')),
        h('div', { class: 'grid2' },
          field('Penyedia AI', h('select', { id: 'aiProvider', onChange: (e) => { c.bot.ai.provider = e.target.value; save(); drawAi(); } }, Object.keys(A).map((k) => h('option', { value: k, selected: pv === k }, A[k].name + ' (percuma)')))),
          field('Kunci API AI', keyIn, nat ? 'Disimpan disulitkan oleh Windows, bukan dalam fail tetapan.' : 'Versi web: hanya dalam memori.')),
        h('div', { class: 'grid2' },
          field('Nama model (lanjutan, kosong = lalai)', h('input', { type: 'text', id: 'aiModel', value: c.bot.ai.model, placeholder: A[pv].model, onInput: (e) => { c.bot.ai.model = e.target.value.trim(); save(); } })),
          h('div', { class: 'btn-row' },
            h('button', { type: 'button', class: 'btn ghost', id: 'btnAiTest', onClick: async () => { keyIn.dispatchEvent(new Event('change')); aiOut.textContent = GS.t('Menyemak…'); try { const t = await v.askAI('Hai, kau siapa dan boleh makan tak?'); aiOut.textContent = GS.t('AI berfungsi. Contoh jawapan: {0}', t); v.chatMem = []; } catch (e) { aiOut.textContent = String(e.message || e); } } }, 'Uji AI'),
            h('button', { type: 'button', class: 'btn ghost', id: 'btnAiClear', onClick: () => { v.setAiKey(''); keyIn.value = ''; aiOut.textContent = GS.t('Kunci dipadam.'); } }, 'Padam kunci'))),
        aiOut,
        field('Maklumat game tambahan untuk bot (pilihan)', h('textarea', { id: 'aiExtra', rows: 3, maxlength: 600, placeholder: 'cth: Pasukan kita: Ali (jungle), Abu (gold)... Musuh: Team X. Nama streamer: nama anda.', onInput: (e) => { c.bot.ai.extra = e.target.value; save(); } }, c.bot.ai.extra || ''), 'Bot menganalisis data yang dikesan app (hero, K/D/A, item, kejadian, keputusan). Nama pemain dan pasukan perlu ditulis di sini jika mahu bot menyebutnya; bot tidak akan mereka nama.'));
    };
    drawAi();
    const body = h('div', { class: 'voice-modal' },
      h('div', { class: 'voice-top' }, h('div', { id: 'voiceModalStatus', class: 'voice-status big' }),
        h('button', { type: 'button', class: 'btn', id: 'voiceModalToggle', onClick: async () => { const ok = await v.toggle(); if (!ok && v.error) GS.toast(v.error, 'warn'); } }, 'Hidupkan bot')),
      h('p', { class: 'muted note' }, nat
        ? 'App Windows: pengecam suara Windows berjalan di PC ini tanpa internet. Mikrofon dan bunyi game (capture card) dipilih daripada saluran Audio Mixer.'
        : 'Versi web: pengecam suara pelayar (Chrome) menggunakan mikrofon lalai dan memerlukan internet. Bunyi game hanya tersedia dalam app Windows.'),

      h('h3', null, 'Sumber suara'),
      h('div', { class: 'grid2' },
        h('div', null, check('Suara saya (mikrofon)', () => c.mic.on, (x) => { c.mic.on = x; }), nat ? field('Saluran mikrofon', chanSelect('mic')) : null),
        h('div', null, check('Bunyi game (suara pengumum: "Double Kill", "Victory"…)', () => c.game.on, (x) => { c.game.on = x; }, !nat), nat ? field('Saluran bunyi game', chanSelect('game')) : h('small', { class: 'muted' }, 'Hanya app Windows'))),

      h('h3', null, 'Efek melalui suara'),
      h('p', { class: 'muted note' }, 'Tanpa papan kekunci. Sebut atau dengar frasa ini untuk mencetuskan efek. Pisahkan frasa dengan koma. Tambah ejaan sebutan jika perlu (cth untuk "mati": "mati, marty").'),
      trig,
      h('div', { class: 'grid2' },
        field('Ketepatan minimum', h('input', { type: 'range', min: 0, max: 90, value: Math.round(c.minConf * 100), onInput: (e) => { c.minConf = e.target.value / 100; save(); } }), 'Naikkan jika efek keluar sendiri; turunkan jika suara anda tidak dikesan.'),
        field('Jeda antara efek sama (saat)', h('input', { type: 'number', min: 0, max: 30, step: 1, value: Math.round(c.cooldownMs / 1000), onChange: (e) => { c.cooldownMs = GS.clamp(Number(e.target.value) || 0, 0, 30) * 1000; save(); } }))),

      h('h3', null, 'Bot suara'),
      h('div', { class: 'grid2' },
        check('Hidupkan bot', () => c.bot.enabled, (x) => { c.bot.enabled = x; }),
        check('Bot bercakap (suara)', () => c.bot.voiceOn, (x) => { c.bot.voiceOn = x; })),
      h('div', { class: 'grid2' },
        field('Nama bot (kata panggilan)', h('input', { type: 'text', id: 'botName', value: c.bot.name, maxlength: 24, onInput: (e) => { c.bot.name = e.target.value.trim(); save(); } }), 'Cth Jarvis. Sebut nama ini, kemudian soalan: "Jarvis, siapa noob?"'),
        field('Nama lain / ejaan sebutan', h('input', { type: 'text', id: 'botAliases', value: c.bot.aliases, placeholder: 'ejaan sebutan lain (pilihan)', onInput: (e) => { c.bot.aliases = e.target.value; save(); } }), 'Nama yang anda tetapkan ialah nama panggilan bot. Jika pengecam salah dengar nama anda, tekan "Latih nama" di bawah atau tulis ejaan yang didengarnya.')),
      h('div', { class: 'btn-row' },
        h('button', { type: 'button', class: 'btn', id: 'btnLearnName', onClick: () => { if (!v.running) { GS.toast(GS.t('Hidupkan bot dahulu, kemudian tekan Latih nama.'), 'warn'); return; } v.learnName(); GS.toast(GS.t('Sebut nama bot sekarang (satu kali). Sistem akan mengingati bunyi yang didengarnya.'), 'ok', 5000); } }, 'Latih nama (sebut nama bot)')),
      h('h4', null, 'Suara bot'),
      h('div', { class: 'grid2' }, field('Jantina suara', gender), field('Penyedia suara', provider)),
      quick,
      sysInfo,
      azureBox,
      elevenBox,
      h('div', { class: 'grid2' },
        field('Suara sistem tertentu (lanjutan)', voiceCtl),
        field('Kelajuan suara', h('input', { type: 'range', min: -5, max: 5, value: c.bot.rate, onInput: (e) => { c.bot.rate = Number(e.target.value); save(); } }))),
      h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn', id: 'btnVoiceSpeak', onClick: () => { keyBlur(); v.say(GS.t('Hai, saya {0}. Ini ujian suara saya.', c.bot.name || 'bot'), true); } }, 'Uji suara bot')),
      check('Masukkan suara bot ke dalam siaran (penonton dengar; app Windows)', () => c.bot.inStream, (x) => { c.bot.inStream = x; }, !nat),
      aiBox,
      h('h4', null, 'Soalan dan jawapan'),
      h('p', { class: 'muted note' }, 'Pisahkan beberapa cara bertanya dengan |. Jawapan boleh menggunakan data game: {kill} {mati} {assist} {menang} {kalah} {streak} {toppick} {topban} {nama}.'),
      qaBox,
      field('Jawapan jika tidak faham (kosong = diam)', h('input', { type: 'text', value: c.bot.fallback, onInput: (e) => { c.bot.fallback = e.target.value; save(); } })),

      h('h3', null, 'Pengumum efek (efek BERCAKAP)'),
      h('p', { class: 'muted note' }, 'Apabila efek kill, double kill, victory, defeat dan lain-lain keluar (melalui butang, pengesan skrin atau suara), pengumum menyebut perkataan itu menggunakan suara yang dipilih di atas, dan bunyi beep tidak dimainkan. Jika suara gagal, bunyi beep digunakan sebagai sandaran.'),
      h('div', { class: 'grid2' },
        check('Hidupkan pengumum (efek bercakap)', () => c.announcer.on, (x) => { c.announcer.on = x; v.prewarm(); }),
        check('Kekalkan juga bunyi beep bersama suara', () => c.announcer.keepBeep, (x) => { c.announcer.keepBeep = x; })),
      field('Bahasa pengumum', annLang),
      annBox,

      h('h3', null, 'Uji suara'),
      h('div', { class: 'voice-test' }, sayIn, h('button', { type: 'button', class: 'btn primary', id: 'btnVoiceSay', onClick: () => { keyBlur(); v.stopSpeech(); const x = sayIn.value.trim(); if (x) v.say(x, true); } }, 'Sebut sekarang')),
      h('p', { class: 'muted note' }, 'Menaip ayat dan tekan "Sebut sekarang": bot menyebut ayat itu serta-merta dengan suara pilihan anda (Melayu jika bahasa app Melayu).'),
      h('h3', null, 'Uji tanpa suara'),
      h('div', { class: 'voice-test' }, testIn,
        h('button', { type: 'button', class: 'btn', id: 'btnVoiceTest', onClick: () => runTest('mic') }, 'Uji (suara saya)'),
        h('button', { type: 'button', class: 'btn ghost', id: 'btnVoiceTestGame', onClick: () => runTest('game') }, 'Uji (bunyi game)')),
      testOut,
      h('h4', null, 'Aktiviti terkini'),
      h('div', { id: 'voiceLog', class: 'voice-log' }));
    U.modal = GS.modal({ title: 'Suara & Bot', body, wide: true, onClose: () => { U.modal = null; } });
    U.drawLive();
  };

  U.init = function () {
    GS.on('voice:status', refresh);
    GS.audio.renderMixer();
  };
})();
