/* Global Streamer - kompositor: lukis scene pada kanvas (paparan logik 1920x1080) */
(function () {
  'use strict';
  const clamp = GS.clamp;
  const HANDLE = 26; // saiz pengendali (unit logik)

  class Compositor {
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: false });
      this.fx = !!opts.fx;
      this.editable = !!opts.editable;
      this.selectedId = null;
      this.transition = null;
      this.off = null;
    }

    setResolution(w, h) {
      if (this.canvas.width !== w || this.canvas.height !== h) {
        this.canvas.width = w;
        this.canvas.height = h;
        this.off = null;
      }
    }

    startTransition(from, to, type, ms) {
      this.transition = { from, to, type, ms: Math.max(1, ms), t0: performance.now() };
    }

    _offscreen() {
      if (!this.off || this.off.width !== this.canvas.width || this.off.height !== this.canvas.height) {
        this.off = document.createElement('canvas');
        this.off.width = this.canvas.width;
        this.off.height = this.canvas.height;
      }
      return this.off;
    }

    render(now, scene) {
      const LW = GS.design.w, LH = GS.design.h;
      const ctx = this.ctx;
      const k = this.canvas.width / LW;
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      const tr = this.transition;
      if (tr) {
        const p = clamp((now - tr.t0) / tr.ms, 0, 1);
        if (p >= 1) {
          this.transition = null;
          this.drawScene(ctx, tr.to, now);
        } else {
          const e = 1 - Math.pow(1 - p, 3);
          const off = this._offscreen();
          const octx = off.getContext('2d', { alpha: false });
          octx.setTransform(k, 0, 0, k, 0, 0);
          this.drawScene(octx, tr.to, now);
          if (tr.type === 'slide') {
            ctx.save();
            ctx.translate(-LW * e, 0);
            this.drawScene(ctx, tr.from, now);
            ctx.restore();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.drawImage(off, off.width * (1 - e), 0);
            ctx.setTransform(k, 0, 0, k, 0, 0);
          } else {
            this.drawScene(ctx, tr.from, now);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalAlpha = e;
            ctx.drawImage(off, 0, 0);
            ctx.globalAlpha = 1;
            ctx.setTransform(k, 0, 0, k, 0, 0);
          }
        }
      } else {
        this.drawScene(ctx, scene, now);
      }
      if (this.fx) GS.fx.draw(ctx, now, LW, LH);
      if (this.editable && this.selectedId && scene) this.drawSelection(ctx, scene);
    }

    drawScene(ctx, scene, now) {
      GS.theme.use(GS.theme.sceneTheme(scene));
      this.drawBackground(ctx, now);
      if (!scene) return;
      for (const s of scene.sources) {
        if (!s.visible) continue;
        ctx.save();
        try { this.drawSource(ctx, s, now); } catch (e) { console.error('[GS] ralat lukis sumber', s.name, e); }
        ctx.restore();
      }
    }

    drawBackground(ctx, now) {
      const LW = GS.design.w, LH = GS.design.h;
      // cahaya lembut dilukis pada kanvas kecil kemudian diregang (jauh lebih ringan, kelihatan sama)
      if (!this.bg) { this.bg = document.createElement('canvas'); this.bg.width = 320; this.bg.height = 180; }
      const b = this.bg.getContext('2d');
      b.setTransform(this.bg.width / LW, 0, 0, this.bg.height / LH, 0, 0);
      const th = GS.theme.cur;
      b.fillStyle = th.bgBase;
      b.fillRect(0, 0, LW, LH);
      const a = now * 0.0002;
      const orb = (x, y, r, c0) => {
        const g = b.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, c0);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        b.fillStyle = g;
        b.fillRect(0, 0, LW, LH);
      };
      orb(LW * (0.28 + 0.1 * Math.sin(a)), LH * 0.3, 820, th.orbs[0]);
      orb(LW * (0.78 + 0.08 * Math.cos(a * 1.3)), LH * 0.78, 760, th.orbs[1]);
      orb(LW * 0.5, LH * (0.5 + 0.1 * Math.sin(a * 0.8)), 600, th.orbs[2]);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(this.bg, 0, 0, LW, LH);
      ctx.strokeStyle = th.grid;
      ctx.lineWidth = 1;
      const off = (now * 0.012) % 80;
      ctx.beginPath();
      for (let x = -off; x < LW; x += 80) { ctx.moveTo(x, 0); ctx.lineTo(x, LH); }
      for (let y = off; y < LH; y += 80) { ctx.moveTo(0, y); ctx.lineTo(LW, y); }
      ctx.stroke();
    }

    drawSource(ctx, s, now) {
      switch (s.type) {
        case 'video': {
          const r = GS.media.videos[s.id];
          if (r && r.video.readyState >= 2 && r.video.videoWidth) this.drawFit(ctx, r.video, r.video.videoWidth, r.video.videoHeight, s);
          else this.placeholder(ctx, s, now);
          break;
        }
        case 'clip': {
          const r = GS.media.clips[s.id];
          const el = r && r.el;
          const w = el && (r.kind === 'video' ? el.videoWidth : el.naturalWidth), hh = el && (r.kind === 'video' ? el.videoHeight : el.naturalHeight);
          if (r && r.ready && w && hh && (r.kind !== 'video' || el.readyState >= 2)) this.drawFit(ctx, el, w, hh, s);
          else this.placeholder(ctx, s, now);
          break;
        }
        case 'image': {
          const im = GS.media.image(s.props.src);
          if (im) this.drawFit(ctx, im, im.naturalWidth, im.naturalHeight, s);
          else this.placeholder(ctx, s, now);
          break;
        }
        case 'text':
          GS.widgets.text(ctx, s.props.text || '', s.x, s.y + (s.props.size || 48), { size: s.props.size || 48, weight: s.props.weight || 700, color: s.props.color || '#eaf4ff', maxW: s.w, shadow: 'rgba(0,0,0,.6)', blur: 6 });
          break;
        case 'color':
          ctx.fillStyle = s.props.color || '#000';
          ctx.fillRect(s.x, s.y, s.w, s.h);
          break;
        case 'widget':
          GS.widgets.draw(ctx, s, now);
          break;
        default:
          break;
      }
    }

    drawFit(ctx, el, sw, sh, s) {
      ctx.beginPath();
      ctx.rect(s.x, s.y, s.w, s.h);
      ctx.clip();
      let dw = s.w, dh = s.h;
      if (s.fit !== 'stretch') {
        const r = s.fit === 'contain' ? Math.min(s.w / sw, s.h / sh) : Math.max(s.w / sw, s.h / sh);
        dw = sw * r;
        dh = sh * r;
      }
      ctx.drawImage(el, s.x + (s.w - dw) / 2, s.y + (s.h - dh) / 2, dw, dh);
    }

    placeholder(ctx, s, now) {
      const { x, y, w, h } = s;
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      const g = ctx.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, '#0b1a38');
      g.addColorStop(1, '#170b26');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
      // garis imbasan
      const sy = y + ((now * 0.12) % (h + 120)) - 60;
      const sg = ctx.createLinearGradient(0, sy - 60, 0, sy + 60);
      sg.addColorStop(0, 'rgba(70,160,255,0)');
      sg.addColorStop(0.5, 'rgba(70,160,255,0.14)');
      sg.addColorStop(1, 'rgba(70,160,255,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(x, sy - 60, w, 120);
      const k = Math.min(w, h);
      GS.widgets.text(ctx, GS.tov('TIADA ISYARAT'), x + w / 2, y + h / 2 - k * 0.02, { size: Math.max(14, k * 0.07), weight: 800, spacing: 6, align: 'center', color: '#8aa2c4' });
      GS.widgets.text(ctx, GS.tov(s.name), x + w / 2, y + h / 2 + k * 0.09, { size: Math.max(11, k * 0.045), weight: 600, align: 'center', color: '#5d7799', maxW: w * 0.9 });
    }

    drawSelection(ctx, scene) {
      const s = scene.sources.find((q) => q.id === this.selectedId);
      if (!s || !s.visible) return;
      ctx.save();
      ctx.setLineDash([14, 10]);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#6be6ff';
      ctx.shadowColor = 'rgba(107,230,255,.8)';
      ctx.shadowBlur = 10;
      ctx.strokeRect(s.x, s.y, s.w, s.h);
      ctx.setLineDash([]);
      ctx.fillStyle = '#04122a';
      for (const [hx, hy] of [[s.x, s.y], [s.x + s.w, s.y], [s.x, s.y + s.h], [s.x + s.w, s.y + s.h]]) {
        ctx.beginPath();
        ctx.rect(hx - HANDLE / 2, hy - HANDLE / 2, HANDLE, HANDLE);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    /* koordinat peristiwa tetikus -> unit logik */
    toLogical(ev) {
      const LW = GS.design.w, LH = GS.design.h;
      const r = this.canvas.getBoundingClientRect();
      return { x: ((ev.clientX - r.left) / r.width) * LW, y: ((ev.clientY - r.top) / r.height) * LH };
    }

    handleAt(x, y, s) {
      const hs = HANDLE * 0.9;
      const pts = { nw: [s.x, s.y], ne: [s.x + s.w, s.y], sw: [s.x, s.y + s.h], se: [s.x + s.w, s.y + s.h] };
      for (const k of Object.keys(pts)) if (Math.abs(x - pts[k][0]) <= hs && Math.abs(y - pts[k][1]) <= hs) return k;
      return null;
    }

    hitTest(x, y, scene) {
      for (let i = scene.sources.length - 1; i >= 0; i--) {
        const s = scene.sources[i];
        if (!s.visible || s.locked) continue;
        if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return s;
      }
      return null;
    }
  }

  Object.defineProperty(Compositor, 'LW', { get: () => GS.design.w });
  Object.defineProperty(Compositor, 'LH', { get: () => GS.design.h });

  /* lukis sekali (contoh pratonton template) */
  Compositor.thumb = function (canvas, sources, design, theme) {
    const prev = GS.design;
    if (design) GS.design = design;
    try {
      const c = new Compositor(canvas);
      c.setResolution(canvas.width, canvas.height);
      const ctx = c.ctx;
      const k = canvas.width / GS.design.w;
      ctx.setTransform(k, 0, 0, k, 0, 0);
      c.drawScene(ctx, { sources, theme }, 2500);
    } finally { GS.design = prev; }
  };

  GS.Compositor = Compositor;
})();
