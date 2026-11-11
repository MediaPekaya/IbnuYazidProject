/* Laman jualan: tukar bahasa BM/EN (data-ms / data-en), dan maklumat muat turun daripada GitHub Releases (pautan tetap /download/windows). */
(function () {
  'use strict';
  var KEY = 'gs.site.lang';
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* abaikan */ } }
  var lang = get() || ((navigator.language || 'ms').toLowerCase().indexOf('ms') === 0 ? 'ms' : 'en');
  function apply() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-ms]').forEach(function (el) { el.textContent = el.getAttribute(lang === 'en' ? 'data-en' : 'data-ms'); });
    document.querySelectorAll('.lang button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-l') === lang); });
    document.title = document.documentElement.getAttribute(lang === 'en' ? 'data-title-en' : 'data-title-ms') || document.title;
  }
  document.querySelectorAll('.lang button').forEach(function (b) { b.addEventListener('click', function () { lang = b.getAttribute('data-l'); set(lang); apply(); }); });
  apply();

  var box = document.getElementById('dl');
  if (box) {
    // pautan tetap /download/windows sentiasa menunjuk ke pemasang terkini (GitHub Releases); maklumat versi daripada API awam
    var a = box.querySelector('a.btn.primary'); a.href = '/download/windows'; a.removeAttribute('aria-disabled');
    fetch('https://api.github.com/repos/IzzulIsyraf011207/global-streamer-releases-exe-apps/releases/latest', { headers: { Accept: 'application/vnd.github+json' } }).then(function (r) { if (!r.ok) throw new Error('x'); return r.json(); }).then(function (rel) {
      var asset = (rel.assets || []).filter(function (x) { return x.name === 'Global-Streamer-Setup.exe'; })[0];
      if (!asset) throw new Error('x');
      box.querySelector('[data-f="version"]').textContent = String(rel.tag_name || '').replace(/^v/, '');
      box.querySelector('[data-f="date"]').textContent = (rel.published_at || '').slice(0, 10);
      box.querySelector('[data-f="size"]').textContent = (asset.size / 1048576).toFixed(1) + ' MB';
      box.querySelector('[data-f="sha"]').textContent = String(asset.digest || '').replace(/^sha256:/, '');
      box.classList.add('ready');
    }).catch(function () { box.classList.add('ready'); });
  }
})();
