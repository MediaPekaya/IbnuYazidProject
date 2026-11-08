import { api } from './api.js';

(async () => {
  try {
    await api('GET', 'api/me');
    const login = document.getElementById('nav-login');
    const cta = document.getElementById('nav-cta');
    login.textContent = 'Buka studio';
    login.href = 'app.html';
    cta.style.display = 'none';
    const hero = document.getElementById('hero-cta');
    hero.textContent = 'Buka studio';
    hero.href = 'app.html';
  } catch { /* belum log masuk */ }
})();

(async () => {
  const host = document.getElementById('hero-shots');
  try {
    const { renderStage, scaleToBox, sizeById } = await import('./engine.js');
    const w = Math.min(host.clientWidth || 520, 540);
    const picks = [['edu-kelas-biru', 'fhd', 0, 0, 0.78], ['cr-vlog-oren', 'vertical', 0.66, 0.1, 0.2], ['gm-neon-hud', 'fhd', 0.2, 0.5, 0.62]];
    for (const [id, sid, fx, fy, fw] of picks) {
      const s = sizeById(sid);
      const bw = Math.round(w * fw);
      const bh = Math.round((bw * s.h) / s.w);
      const shot = document.createElement('div');
      shot.className = 'shot';
      shot.style.cssText = `left:${Math.round(w * fx)}px;top:${Math.round(w * fy)}px;width:${bw}px;height:${bh}px`;
      const inner = document.createElement('div');
      shot.appendChild(inner);
      host.appendChild(shot);
      const r = renderStage(inner, { templateId: id, size: { w: s.w, h: s.h }, data: {} }, { mode: 'gallery' });
      if (r) scaleToBox(r.stage, s.w, s.h, bw, bh);
    }
    host.style.minHeight = `${Math.round(w * 0.95)}px`;
  } catch { /* hiasan sahaja */ }
})();
