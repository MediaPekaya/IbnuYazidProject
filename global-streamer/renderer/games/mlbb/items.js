/*
 * Mobile Legends: Bang Bang - item dan emblem.
 * Data dikumpul dan dibundel oleh scripts/data (sumber: Mobile Legends Wiki, CC-BY-SA 3.0) ke dalam data/mlbb-data.js.
 * cat: attack | magic | defense | movement | potion
 */
(function () {
  'use strict';
  const GS = window.GS;
  const st = (GS.data && GS.data.static) || { items: [], emblems: [] };
  GS.data = GS.data || {};
  const CATS = { attack: 1, magic: 1, defense: 1, movement: 1 };
  const shop = (st.items || []).filter((i) => i.price);
  GS.data.mlbbItems = shop.map((i) => {
    const first = (i.tabs && i.tabs[0]) || 'attack';
    const cat = /Potion$/i.test(i.name) ? 'potion' : (CATS[first] ? first : 'attack');
    return Object.assign({}, i, { cat });
  });
  GS.data.mlbbItemCats = { attack: 'Attack', magic: 'Magic', defense: 'Defense', movement: 'Movement', potion: 'Potion' };
  GS.data.mlbbEmblems = st.emblems || [];
  GS.data.mlbbItemByName = {};
  GS.data.mlbbItems.forEach((i) => { GS.data.mlbbItemByName[i.name.toLowerCase()] = i; });
})();
