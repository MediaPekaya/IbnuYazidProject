/* Buka pautan luaran dalam Google Chrome (bukan Edge) apabila Chrome dipasang; jika tidak, pelayar lalai sistem.
 * Hanya https:// dibenarkan. Argumen diberi sebagai tatasusunan (tiada shell), jadi URL tidak boleh menyuntik arahan. */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function chromePath(env = process.env, platform = process.platform, exists = fs.existsSync) {
  const c = [];
  if (platform === 'win32') {
    for (const base of [env['ProgramFiles'], env['ProgramFiles(x86)'], env['ProgramW6432'], env['LOCALAPPDATA']].filter(Boolean)) c.push(path.join(base, 'Google', 'Chrome', 'Application', 'chrome.exe'));
  } else if (platform === 'darwin') {
    c.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
  } else {
    c.push('/usr/bin/google-chrome-stable', '/usr/bin/google-chrome', '/opt/google/chrome/chrome');
  }
  return c.find((p) => { try { return exists(p); } catch (e) { return false; } }) || '';
}

/** @returns {'chrome'|'system'|'refused'} */
function openLink(url, shell, opts = {}) {
  let u;
  try { u = new URL(url); } catch (e) { return 'refused'; }
  if (u.protocol !== 'https:' || !u.hostname) return 'refused';
  url = u.href; // dinormalkan (aksara berbahaya seperti " dikodkan peratus)
  const exe = (opts.chromePath || chromePath)();
  if (exe) {
    try {
      const child = (opts.spawn || spawn)(exe, [url], { detached: true, stdio: 'ignore' });
      child.on && child.on('error', () => shell.openExternal(url));
      child.unref && child.unref();
      return 'chrome';
    } catch (e) { /* jatuh ke pelayar lalai */ }
  }
  shell.openExternal(url);
  return 'system';
}

module.exports = { openLink, chromePath };
