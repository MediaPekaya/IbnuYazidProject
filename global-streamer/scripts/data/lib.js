'use strict';
/*
 * Perpustakaan kecil untuk pengumpul data (dijalankan di Node, BUKAN dalam app).
 * Sumber yang dibenarkan: MediaWiki API awam (Fandom MLBB wiki dan Liquipedia) dengan
 * User-Agent yang jelas, gzip, dan jeda antara permintaan. API tidak didokumenkan Moonton TIDAK digunakan.
 */

const UA = 'GlobalStreamer-research/0.1 (non-commercial research; contact via GitHub MediaPekaya)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Guna curl supaya proksi/CA persekitaran (HTTPS_PROXY) dihormati; curl ada pada Windows, Linux dan macOS. */
const { execFile } = require('child_process');
function get(url, { retries = 4 } = {}) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      execFile('curl', ['-sS', '--compressed', '-A', UA, '--max-time', '90', '-D', '-', '-w', '\n__STATUS__%{http_code}', url],
        { maxBuffer: 256 * 1024 * 1024, encoding: 'utf8' }, async (err, out) => {
          if (err && !out) {
            if (n < retries) { await sleep(2000 * (n + 1)); return attempt(n + 1); }
            return reject(err);
          }
          const status = Number((out.match(/__STATUS__(\d+)\s*$/) || [])[1]);
          const raw = out.replace(/\n__STATUS__\d+\s*$/, '');
          // curl -D mencetak satu blok header bagi setiap respons (termasuk CONNECT proksi): buang semuanya.
          let body = raw, head = '';
          while (/^HTTP\/[\d.]+ \d+/.test(body)) {
            const m = body.match(/\r?\n\r?\n/);
            if (!m) break;
            head = body.slice(0, m.index);
            body = body.slice(m.index + m[0].length);
          }
          if (status === 429 || status >= 500) {
            if (n < retries) {
              const ra = Number((head.match(/retry-after:\s*(\d+)/i) || [])[1]) || 30;
              const wait = ra * 1000 * (n + 1);
              console.error(`  ${status} ${url.slice(0, 90)} -> tunggu ${Math.round(wait / 1000)}s`);
              await sleep(wait);
              return attempt(n + 1);
            }
            return reject(new Error('HTTP ' + status));
          }
          if (status !== 200) return reject(new Error('HTTP ' + status + ' ' + url));
          resolve(body);
        });
    };
    attempt(0);
  });
}

/** Panggilan MediaWiki parse -> HTML. */
async function wikiParse(base, page, extra = '') {
  const url = `${base}/api.php?action=parse&page=${encodeURIComponent(page)}&prop=text&format=json&formatversion=2&disablelimitreport=1&disableeditsection=1${extra}`;
  const j = JSON.parse(await get(url));
  if (!j.parse) throw new Error('parse gagal: ' + page + ' ' + JSON.stringify(j).slice(0, 200));
  return j.parse.text;
}

const clean = (s) => String(s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
const num = (s) => { const m = String(s || '').replace(/,/g, '').match(/-?\d+(\.\d+)?/); return m ? Number(m[0]) : null; };

module.exports = { UA, sleep, get, wikiParse, clean, num };
