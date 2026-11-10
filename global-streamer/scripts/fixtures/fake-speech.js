/* Pengecam/sintesis palsu untuk ujian VoiceHost (meniru protokol skrip PowerShell). argv[2] = recognizer | synth | crash */
'use strict';
const fs = require('fs');
const kind = process.argv[2];
if (kind === 'synth') {
  if (process.env.GS_TEXT === 'GAGAL') { console.error('suara tiada'); process.exit(3); }
  fs.writeFileSync(process.env.GS_OUT, Buffer.concat([Buffer.from('RIFF'), Buffer.from(JSON.stringify({ t: process.env.GS_TEXT, v: process.env.GS_VOICE, c: process.env.GS_VOICE_CULTURE, r: process.env.GS_RATE }))]));
  process.exit(0);
} else if (kind === 'crash') {
  console.log(JSON.stringify({ type: 'error', code: 'no-recognizer', message: 'Tiada pengecam' }));
  process.exit(2);
} else {
  console.log(JSON.stringify({ type: 'ready', culture: process.env.GS_VOICE_CULTURE || 'en-US', name: 'Palsu' }));
  console.log('AMARAN: baris bukan JSON');
  let n = 0;
  process.stdin.on('data', (d) => {
    n += d.length;
    if (d.some((b) => b !== 0)) {
      const line = JSON.stringify({ type: 'text', text: 'double kill', conf: 0.91 });
      process.stdout.write(line.slice(0, 10)); // baris terpisah merentasi dua tulisan
      setTimeout(() => process.stdout.write(line.slice(10) + '\n'), 20);
    }
  });
  process.stdin.on('end', () => { console.log(JSON.stringify({ type: 'ended', bytes: n })); process.exit(0); });
}
