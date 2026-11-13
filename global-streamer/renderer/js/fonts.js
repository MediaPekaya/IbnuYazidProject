/* Global Streamer - fon untuk template Gaming, Formal dan Sebentar Lagi (fail dalam assets/fonts, lesen SIL OFL). */
(function () {
  'use strict';
  const LIST = [
    ['orbitron', 'Orbitron', 'Orbitron.ttf', 'gaming'], ['rajdhani', 'Rajdhani', 'Rajdhani.ttf', 'gaming'], ['teko', 'Teko', 'Teko.ttf', 'gaming'],
    ['russo', 'Russo One', 'RussoOne.ttf', 'gaming'], ['chakra', 'Chakra Petch', 'ChakraPetch.ttf', 'gaming'], ['audiowide', 'Audiowide', 'Audiowide.ttf', 'gaming'],
    ['montserrat', 'Montserrat', 'Montserrat.ttf', 'formal'], ['poppins', 'Poppins', 'Poppins.ttf', 'formal'], ['playfair', 'Playfair Display', 'PlayfairDisplay.ttf', 'formal'],
    ['oswald', 'Oswald', 'Oswald.ttf', 'formal'], ['lora', 'Lora', 'Lora.ttf', 'formal'], ['raleway', 'Raleway', 'Raleway.ttf', 'formal'],
    ['bebas', 'Bebas Neue', 'BebasNeue.ttf', 'countdown'], ['anton', 'Anton', 'Anton.ttf', 'countdown'], ['righteous', 'Righteous', 'Righteous.ttf', 'countdown'],
    ['blackops', 'Black Ops One', 'BlackOpsOne.ttf', 'countdown'], ['staatliches', 'Staatliches', 'Staatliches.ttf', 'countdown'], ['bungee', 'Bungee', 'Bungee.ttf', 'countdown'],
  ];
  const F = (GS.fonts = { list: LIST.map(([key, name, file, group]) => ({ key, name, file, group })), groups: { gaming: 'Gaming', formal: 'Formal', countdown: 'Countdown' } });
  const byKey = {};
  F.list.forEach((f) => { byKey[f.key] = f; });
  F.css = (key) => { const f = byKey[key]; return f ? '"GS ' + f.name + '","Segoe UI",system-ui,sans-serif' : null; };
  F.name = (key) => (byKey[key] ? byKey[key].name : '');
  F.load = function () {
    if (!window.FontFace) return;
    F.list.forEach((f) => {
      try {
        const ff = new FontFace('GS ' + f.name, 'url(assets/fonts/' + f.file + ')', { weight: '100 900' });
        ff.load().then(() => { document.fonts.add(ff); }).catch(() => {});
      } catch (e) { /* abaikan */ }
    });
  };
  F.load();
})();
