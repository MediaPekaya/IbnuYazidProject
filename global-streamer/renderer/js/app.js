/* Global Streamer - permulaan aplikasi, gelung lukis, mod Normal/Studio, pintasan */
(function () {
  'use strict';
  const { h, $, $$ } = GS;
  const A = (GS.app = { programComp: null, previewComp: null, fps: 0 });

  A.applyResolution = function () {
    const s = GS.state.settings;
    A.programComp.setResolution(s.width, s.height);
    A.previewComp.setResolution(960, 540);
    const chip = $('#resChip');
    if (chip) chip.textContent = s.width + '×' + s.height + ' · ' + s.fps + ' fps';
  };

  A.setMode = function (mode) {
    const st = GS.state;
    st.mode = mode;
    if (mode === 'studio' && st.previewId === st.programId && st.scenes.length > 1) {
      const other = st.scenes.find((s) => s.id !== st.programId);
      st.previewId = other.id;
    }
    $('#screens').className = 'screens ' + mode;
    $$('.mode-switch button').forEach((b) => b.classList.toggle('on', b.dataset.mode === mode));
    $('.mode-switch').dataset.mode = mode;
    A.programComp.editable = mode === 'normal';
    A.previewComp.editable = mode === 'studio';
    A.programComp.selectedId = A.previewComp.selectedId = GS.scenes.selectedId();
    GS.save();
    GS.emit('scenes:changed');
  };

  function bindTopbar() {
    $$('.mode-switch button').forEach((b) => b.addEventListener('click', () => A.setMode(b.dataset.mode)));
    const hasConfig = () => GS.state.templateId && GS.platforms.enabledIds().length;
    $('#btnSetup').addEventListener('click', () => GS.live.openWizard(0));
    $('#btnLive').addEventListener('click', () => {
      GS.audio.ensure();
      if (GS.live.state === 'idle') GS.live.openWizard(hasConfig() ? 3 : 0);
      else if (confirm('Tamatkan siaran langsung sekarang?')) GS.live.stop();
    });
    $('#btnRec').addEventListener('click', () => { GS.audio.ensure(); GS.rec.toggle(); });
    $('#btnSettings').addEventListener('click', GS.live.openSettings);
    $('#btnTransition').addEventListener('click', GS.scenes.doTransition);

    const sel = $('#selTransition');
    sel.value = GS.state.settings.transition;
    sel.addEventListener('change', () => { GS.state.settings.transition = sel.value; GS.save(); });

    const gsel = $('#gameSelect');
    GS.gameList.forEach((g) => gsel.append(h('option', { value: g.id, disabled: !g.ready, selected: g.id === GS.state.game }, g.name + (g.ready ? '' : ' (akan datang)'))));
    gsel.addEventListener('change', () => { GS.state.game = gsel.value; GS.save(); });

    // tab panel kanan
    $$('.rtab').forEach((b) => b.addEventListener('click', () => {
      $$('.rtab').forEach((x) => x.classList.toggle('on', x === b));
      $$('.rpanel').forEach((p) => p.classList.toggle('on', p.id === b.dataset.panel));
    }));

    $('#envTag').textContent = GS.platforms.native() ? 'APP WINDOWS' : 'WEB DEMO';
    $('#envTag').classList.toggle('native', GS.platforms.native());
  }

  function bindHotkeys() {
    window.addEventListener('keydown', (e) => {
      if (!e.altKey || e.ctrlKey || e.metaKey) return;
      const m = /^Digit(\d)$/.exec(e.code);
      if (!m) return;
      const fx = GS.games[GS.state.game].effects.find((x) => x.hotkey === m[1]);
      if (fx) { e.preventDefault(); GS.audio.ensure(); GS.gamedock.trigger(fx.id); }
    });
    window.addEventListener('beforeunload', (e) => {
      if (GS.live.state !== 'idle' || GS.rec.active) { e.preventDefault(); e.returnValue = ''; }
    });
    document.addEventListener('pointerdown', () => GS.audio.ensure(), { once: true });
  }

  /* kekalkan nisbah 16:9 dalam ruang yang ada (tepat, supaya koordinat tetikus betul) */
  function fitCanvases() {
    $$('.screen-view').forEach((view) => {
      const cv = view.querySelector('canvas');
      const r = view.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return;
      let cw = r.width, ch = (r.width * 9) / 16;
      if (ch > r.height) { ch = r.height; cw = (r.height * 16) / 9; }
      cv.style.width = Math.floor(cw) + 'px';
      cv.style.height = Math.floor(ch) + 'px';
    });
  }
  function bindFit() {
    const ro = new ResizeObserver(fitCanvases);
    $$('.screen-view').forEach((v) => ro.observe(v));
    window.addEventListener('resize', fitCanvases);
    fitCanvases();
  }

  function loop() {
    let frames = 0, last = performance.now();
    function frame(now) {
      const sc = GS.scenes;
      try {
        A.programComp.render(now, sc.program());
        if (GS.state.mode === 'studio') A.previewComp.render(now, sc.preview());
        GS.audio.tickMeters(now);
      } catch (e) { console.error('[GS] ralat bingkai', e); }
      frames++;
      if (now - last >= 1000) {
        A.fps = Math.round((frames * 1000) / (now - last));
        frames = 0;
        last = now;
        const f = $('#fpsChip');
        if (f) f.textContent = A.fps + ' FPS';
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ikon butang statik */
  function staticIcons() {
    [['btnSettings', 'gear', 20], ['btnSceneAdd', 'plus'], ['btnSourceAdd', 'plus'], ['btnSourceUp', 'up'], ['btnSourceDown', 'down'], ['btnSourceDel', 'trash']].forEach(([id, name, size]) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = GS.icon(name, size || 18);
    });
  }

  A.init = async function () {
    staticIcons();
    GS.auth.init().catch((e) => console.error('[GS] ralat log masuk', e)); // tidak menyekat permulaan; skrin log masuk dipaparkan bila SDK sedia
    await GS.platforms.loadKeys();
    GS.audio.channelsInit();
    GS.scenes.ensureDefaults();
    A.programComp = new GS.Compositor($('#cvProgram'), { fx: true, editable: true });
    A.previewComp = new GS.Compositor($('#cvPreview'), { editable: false });
    A.applyResolution();
    GS.scenes.attachEditor(A.programComp);
    GS.scenes.attachEditor(A.previewComp);
    bindTopbar();
    GS.scenes.init();
    GS.audio.renderMixer();
    GS.chat.init();
    GS.gamedock.init();
    GS.live.render();
    A.setMode(GS.state.mode);
    bindHotkeys();
    bindFit();
    loop();
    GS.media.autoReconnect(GS.state.scenes).then(() => GS.emit('media:changed'));
    document.body.classList.add('ready');
  };

  document.addEventListener('DOMContentLoaded', () => A.init().catch((e) => { console.error(e); GS.toast('Ralat permulaan: ' + e.message, 'warn', 8000); }));
})();
