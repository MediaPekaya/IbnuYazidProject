/* Semak sintaks semua fail JavaScript: npm run check */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const base = path.join(__dirname, '..');
const dirs = ['renderer/js', 'renderer/games', 'main', 'scripts'];
let bad = 0, count = 0;
function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (f.name.endsWith('.js')) {
      count++;
      try { execFileSync(process.execPath, ['--check', p], { stdio: 'pipe' }); } catch (e) { bad++; console.error('RALAT SINTAKS:', p, '\n' + e.stderr.toString()); }
    }
  }
}
dirs.forEach((d) => walk(path.join(base, d)));
console.log(count + ' fail diperiksa, ' + bad + ' ralat.');
process.exit(bad ? 1 : 0);
