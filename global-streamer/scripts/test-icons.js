const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://localhost:8123';
let fails = 0; const ok = (n, c, d) => { console.log((c ? 'LULUS ' : 'GAGAL ') + n + (d ? ' :: ' + d : '')); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1600, height: 900 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const bad = []; p.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
  for (const path of ['/', '/site/index.html', '/site/download.html', '/site/privacy.html', '/site/terms.html']) {
    await p.goto(BASE + path, { waitUntil: 'load' }); await p.waitForTimeout(700);
    const links = await p.$$eval('link[rel~=icon],link[rel=apple-touch-icon],link[rel=manifest]', (a) => a.map((l) => ({ rel: l.rel, href: l.href, sizes: l.sizes && l.sizes.toString() })));
    ok(path + ': favicon ico + png 16/32 + 192 + apple-touch + manifest', links.length >= 6, links.length + ' pautan');
    const res = await Promise.all(links.map(async (l) => { const r = await p.request.get(l.href); return { l, st: r.status(), ct: r.headers()['content-type'], len: (await r.body()).length }; }));
    ok(path + ': semua pautan ikon 200', res.every((x) => x.st === 200 && x.len > 100), res.filter((x) => x.st !== 200).map((x) => x.l.href).join());
    const imgs = await p.$$eval('img', (a) => a.filter((i) => /logo/.test(i.src)).map((i) => ({ ok: i.complete && i.naturalWidth > 0, w: i.getBoundingClientRect().width })));
    ok(path + ': logo baharu dipaparkan', imgs.length >= 1 && imgs.every((i) => i.ok && i.w > 20), JSON.stringify(imgs));
  }
  const m = await (await p.request.get(BASE + '/manifest.webmanifest')).json();
  ok('manifest sah (nama, standalone, 192+512, maskable)', m.name === 'Global Streamer' && m.display === 'standalone' && ['192x192', '512x512'].every((s) => m.icons.some((i) => i.sizes === s && i.purpose === 'any')) && m.icons.some((i) => i.purpose === 'maskable'));
  for (const i of m.icons) { const r = await p.request.get(BASE + i.src); const buf = await r.body(); const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20); ok('ikon ' + i.src + ' bersaiz ' + i.sizes, r.status() === 200 && `${w}x${h}` === i.sizes, `${w}x${h}`); }
  const ico = await (await p.request.get(BASE + '/favicon.ico')).body();
  const n = ico.readUInt16LE(4); const szs = []; for (let k = 0; k < n; k++) szs.push(ico[6 + k * 16] || 256);
  ok('/favicon.ico mengandungi 16, 32, 48', [16, 32, 48].every((s) => szs.includes(s)), szs.join());
  ok('tiada 404/ralat', bad.filter((x) => !/updates\/latest|api\.github\.com/.test(x)).length === 0 && errs.length === 0, bad.concat(errs).join(' | '));
  await p.goto(BASE + '/', { waitUntil: 'load' }); await p.waitForTimeout(800);
  await p.screenshot({ path: '/tmp/logo-app.png', clip: { x: 0, y: 0, width: 800, height: 80 } });
  await p.goto(BASE + '/site/index.html', { waitUntil: 'load' }); await p.waitForTimeout(500);
  await p.screenshot({ path: '/tmp/logo-site.png', clip: { x: 0, y: 0, width: 800, height: 80 } });
  await b.close(); console.log(fails ? 'GAGAL ' + fails : 'SEMUA LULUS'); process.exit(fails ? 1 : 0);
})();
