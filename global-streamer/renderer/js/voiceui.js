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
    if (v.error) return { cls: 'bad', text: v.error };
    if (v.running) {
      const last = v.last ? GS.t('Didengar: "{0}"', short(v.last.text, 40)) : GS.t('Mendengar…');
      return { cls: 'ok', text: last };
    }
    return { cls: '', text: GS.t('Mati. Tekan Hidupkan untuk kawalan suara.') };
  }

  /** Jalur dalam Audio Mixer. */
  U.strip = function () {
    const v = V();
    const s = statusText();
    return h('div', { class: 'strip voice-strip' + (v.running ? ' on' : ''), id: 'voiceStrip' },
      h('div', { class: 'strip-head' }, h('span', { class: 'strip-name', title: GS.t('Kawalan suara dan bot') }, 'Suara & Bot'), h('i', { class: 'voice-dot ' + (v.running ? 'on' : '') })),
      h('div', { class: 'strip-note voice-status ' + s.cls, id: 'voiceStripStatus' }, s.text),
      h('button', { type: 'button', class: 'btn tiny' + (v.running ? '' : ' primary'), id: 'btnVoiceToggle', onClick: async () => { const ok = await v.toggle(); if (!ok && v.error) GS.toast(v.error, 'warn'); } }, v.running ? 'Matikan' : 'Hidupkan'),
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
      const eng = v.engine === 'windows' ? GS.t('Pengecam: Windows (luar talian)') : v.engine === 'web' ? GS.t('Pengecam: pelayar (internet)') : '';
      const inf = Object.keys(v.info).map((k) => (k === 'mic' ? GS.t('Suara saya') : GS.t('Bunyi game')) + ': ' + (v.info[k].name || v.info[k].culture || '')).join(' · ');
      st.className = 'voice-status big ' + s.cls;
      st.textContent = [s.text, v.running ? eng : '', v.running ? inf : ''].filter(Boolean).join('  ·  ');
    }
    const btn = GS.$('#voiceModalToggle', card);
    if (btn) { btn.textContent = GS.t(v.running ? 'Matikan' : 'Hidupkan'); btn.classList.toggle('primary', !v.running); }
    const log = GS.$('#voiceLog', card);
    if (log) {
      log.innerHTML = '';
      v.log.slice(0, 8).forEach((e) => log.append(h('div', { class: 'vlog ' + e.kind }, h('b', null, e.kind === 'bot' ? '🤖' : e.source === 'game' ? '🎮' : '🎤'), h('span', null, e.kind === 'bot' ? e.text : '"' + short(e.text, 60) + '"' + (e.result ? '  →  ' + e.result : '')))));
      if (!log.children.length) log.append(h('div', { class: 'muted note' }, 'Belum ada. Cuba sebut sesuatu atau guna kotak Uji di atas.'));
    }
  };

  U.open = function () {
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
      testOut.textContent = r.fx ? GS.t('Dikesan: efek {0} ("{1}")', FX_LABEL[r.fx] || r.fx, r.phrase) : r.bot === 'jawab' ? GS.t('Bot menjawab: {0}', r.answer) : r.bot === 'menunggu' ? GS.t('Bot dipanggil. Sebut soalan seterusnya (uji lagi).') : r.bot === 'tiada' ? GS.t('Bot tiada jawapan untuk soalan itu (tetapkan jawapan lalai atau tambah soalan).') : GS.t('Tiada padanan ({0}).', r.ignored || '');
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
    const drawEleven = () => {
      elevenBox.innerHTML = '';
      elevenBox.hidden = t.provider !== 'eleven';
      if (elevenBox.hidden) return;
      const keyIn = h('input', { type: 'password', id: 'elevenKey', autocomplete: 'off', spellcheck: 'false', placeholder: 'sk_… / xi-api-key', value: v.elevenKey(), onChange: (e) => { v.setElevenKey(e.target.value); v.prewarm(); } });
      elevenBox.append(
        h('p', { class: 'muted note' }, 'ElevenLabs (tier percuma): daftar di elevenlabs.io, kemudian Profile > API Keys > Create, dan tampal kunci di bawah. Pelan percuma ada 10,000 aksara sebulan (jawapan yang sama tidak menggunakan kuota dua kali). Bahasa Melayu disokong oleh model multilingual.'),
        field('Kunci API ElevenLabs', keyIn, nat ? 'Disimpan disulitkan oleh Windows, bukan dalam fail tetapan.' : 'Versi web: hanya dalam memori, hilang apabila tab ditutup.'),
        h('div', { class: 'grid2' },
          field('Model', h('select', { id: 'elevenModel', onChange: (e) => { t.model = e.target.value; save(); } }, [['eleven_multilingual_v2', 'Multilingual v2 (kualiti terbaik, 1 kredit/aksara)'], ['eleven_flash_v2_5', 'Flash v2.5 (pantas, separuh kredit)']].map(([val, l]) => h('option', { value: val, selected: t.model === val }, l)))),
          h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn ghost', id: 'btnElevenQuota', onClick: async () => { keyIn.dispatchEvent(new Event('change')); quotaOut.textContent = GS.t('Menyemak…'); try { const q = await v.elevenQuota(); quotaOut.textContent = GS.t('Digunakan {0} daripada {1} aksara bulan ini.', q.used, q.limit); } catch (e) { quotaOut.textContent = String(e.message || e); } } }, 'Semak kuota'))),
        quotaOut,
        h('details', { class: 'dev-adv' }, h('summary', null, GS.t('ID suara (lanjutan)')),
          h('div', { class: 'grid2' },
            field('ID suara lelaki', h('input', { type: 'text', id: 'elevenMale', value: t.maleVoice, onInput: (e) => { t.maleVoice = e.target.value.trim(); save(); } })),
            field('ID suara perempuan', h('input', { type: 'text', id: 'elevenFemale', value: t.femaleVoice, onInput: (e) => { t.femaleVoice = e.target.value.trim(); save(); } })))));
    };
    drawEleven();
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
    const provider = h('select', { id: 'ttsProvider', onChange: (e) => { t.provider = e.target.value; save(); drawEleven(); drawAzure(); drawSysInfo(); v.prewarm(); } },
      [['system', 'Suara sistem (percuma, tanpa internet)'], ['azure', 'Microsoft Azure: suara neural Melayu (percuma 500,000 aksara/bulan, perlu kunci)'], ['eleven', 'ElevenLabs: suara AI semula jadi (percuma 10,000 aksara/bulan, perlu kunci)']].map(([val, l]) => h('option', { value: val, selected: t.provider === val }, l)));

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
    const body = h('div', { class: 'voice-modal' },
      h('div', { class: 'voice-top' }, h('div', { id: 'voiceModalStatus', class: 'voice-status big' }),
        h('button', { type: 'button', class: 'btn', id: 'voiceModalToggle', onClick: async () => { const ok = await v.toggle(); if (!ok && v.error) GS.toast(v.error, 'warn'); } }, 'Hidupkan')),
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
        field('Nama lain / ejaan sebutan', h('input', { type: 'text', value: c.bot.aliases, placeholder: 'cth jarvis, jervis', onInput: (e) => { c.bot.aliases = e.target.value; save(); } }))),
      h('h4', null, 'Suara bot'),
      h('div', { class: 'grid2' }, field('Jantina suara', gender), field('Penyedia suara', provider)),
      sysInfo,
      azureBox,
      elevenBox,
      h('div', { class: 'grid2' },
        field('Suara sistem tertentu (lanjutan)', voiceCtl),
        field('Kelajuan suara', h('input', { type: 'range', min: -5, max: 5, value: c.bot.rate, onInput: (e) => { c.bot.rate = Number(e.target.value); save(); } }))),
      h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn', id: 'btnVoiceSpeak', onClick: () => { keyBlur(); v.say(GS.t('Hai, saya {0}. Ini ujian suara saya.', c.bot.name || 'bot'), true); } }, 'Uji suara bot')),
      check('Masukkan suara bot ke dalam siaran (penonton dengar; app Windows)', () => c.bot.inStream, (x) => { c.bot.inStream = x; }, !nat),
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
