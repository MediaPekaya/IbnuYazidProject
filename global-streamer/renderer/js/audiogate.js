/* Global Streamer - bunyi hanya untuk scene di PROGRAM (seperti OBS Studio).
 * Sumber yang ada bunyi (video sendiri, Browser) hanya kedengaran apabila scene-nya berada di Program. Di Pratonton ia boleh dimainkan dan dilihat, tetapi senyap.
 * Bunyi video sendiri dihantar melalui mixer (masuk siaran dan rakaman, dan streamer mendengarnya melalui Output). */
(function () {
  'use strict';
  const G = (GS.audiogate = {});
  const applied = {};   // id -> keadaan senyap terakhir yang berjaya dikenakan pada pelayar

  function programIds() {
    const sc = GS.scenes && GS.scenes.program && GS.scenes.program();
    const ids = new Set();
    if (sc) sc.sources.forEach((s) => { if (s.visible !== false) ids.add(s.id); });
    return ids;
  }
  function routeClip(rec) {
    const A = GS.audio;
    if (!rec || rec.kind !== 'video' || !A) return null;
    if (rec.ag) return rec.ag;
    try {
      A.ensure();
      if (!A.ctx || !A.voiceBus) return null;
      const node = A.ctx.createMediaElementSource(rec.el), g = A.ctx.createGain();
      g.gain.value = 0;
      node.connect(g); g.connect(A.voiceBus);
      rec.el.muted = false;
      rec.ag = g; rec.agNode = node;
      return g;
    } catch (e) { return null; }
  }
  G.update = function () {
    if (!GS.scenes || !GS.scenes.all) return;
    const prog = programIds();
    const monOn = GS.state.audio.outOn !== false;
    const nativeBr = window.gsNative && window.gsNative.browser && window.gsNative.browser.nav;
    GS.scenes.all().forEach((sc) => sc.sources.forEach((s) => {
      const inProg = prog.has(s.id);
      if (s.type === 'clip' && !(s.props && s.props.footerVideo)) {
        const rec = GS.media && GS.media.clips && GS.media.clips[s.id];
        const g = routeClip(rec);
        if (g) g.gain.value = inProg ? 1 : 0;
      } else if (s.type === 'browser' && nativeBr) {
        const mute = !(inProg && monOn);
        if (applied[s.id] !== mute) window.gsNative.browser.nav(s.id, 'mute', mute).then((ok) => { if (ok) applied[s.id] = mute; }).catch(() => {});
      }
    }));
  };
  G.init = function () {
    setInterval(G.update, 400);
    ['scenes:changed', 'audio:changed', 'audio:output'].forEach((e) => GS.on(e, G.update));
    G.update();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(G.init, 800)); else setTimeout(G.init, 800);
})();
