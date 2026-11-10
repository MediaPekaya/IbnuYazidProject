/*
 * Mobile Legends: Bang Bang - senarai hero.
 * Data dikumpul dan dibundel oleh scripts/data (sumber: Mobile Legends Wiki, CC-BY-SA 3.0) ke dalam data/mlbb-data.js.
 * Fail ini hanya menukar data itu kepada bentuk yang digunakan app. Hero dan panel peribadi TIDAK masuk ke siaran.
 */
(function () {
  'use strict';
  const GS = window.GS;
  const st = (GS.data && GS.data.static) || { heroes: [] };
  GS.data = GS.data || {};
  GS.data.mlbbRoles = ['Tank', 'Fighter', 'Assassin', 'Mage', 'Marksman', 'Support'];
  GS.data.mlbbLanes = [
    { id: 'gold', label: 'Gold Lane' },
    { id: 'mid', label: 'Mid Lane' },
    { id: 'exp', label: 'EXP Lane' },
    { id: 'jungle', label: 'Jungle' },
    { id: 'roam', label: 'Roam' },
  ];
  GS.data.mlbbHeroes = (st.heroes || []).map((x) => Object.assign({}, x, { role: (x.roles && x.roles[0]) || 'Fighter' }));
  GS.data.mlbbHeroByName = {};
  GS.data.mlbbHeroes.forEach((x) => { GS.data.mlbbHeroByName[x.name.toLowerCase()] = x; });
  /** Cari hero mengikut nama (tidak peka huruf besar/kecil). */
  GS.hero = (name) => GS.data.mlbbHeroByName[String(name || '').trim().toLowerCase()] || null;
})();
