/*
 * Mobile Legends: Bang Bang - senarai item & emblem (dataset AWAL, perlu disahkan mengikut patch).
 * Kategori: attack, magic, defense, movement, potion.
 * Nama item dalam senarai ini sebahagiannya disahkan daripada rakaman rujukan (cth Glowing Wand,
 * Leather Jerkin, Vitality Crystal, Magic Potion, Oracle, Fleeting Time); selebihnya daripada pengetahuan umum.
 */
(function () {
  'use strict';
  const items = {
    attack: ['Blade of Despair', 'Blade of the Heptaseas', 'Windtalker', 'Berserker\'s Fury', 'Endless Battle',
      'Hunter Strike', 'Scarlet Phantom', 'Golden Staff', 'Malefic Roar', 'Sea Halberd', 'Corrosion Scythe',
      'Demon Hunter Sword', 'Haas\'s Claws', 'Great Dragon Spear', 'War Axe', 'Bloodlust Axe', 'Rose Gold Meteor',
      'Wind of Nature', 'Javelin', 'Ogre Tomahawk', 'Blade of the Seven Seas'],
    magic: ['Lightning Truncheon', 'Holy Crystal', 'Divine Glaive', 'Glowing Wand', 'Genius Wand', 'Blood Wings',
      'Concentrated Energy', 'Clock of Destiny', 'Feather of Heaven', 'Ice Queen Wand', 'Fleeting Time',
      'Winter Crown', 'Enchanted Talisman', 'Necklace of Durance', 'Flask of the Oasis', 'Calamity Reaper'],
    defense: ['Athena\'s Shield', 'Immortality', 'Cursed Helmet', 'Queen\'s Wings', 'Dominance Ice', 'Radiant Armor',
      'Antique Cuirass', 'Brute Force Breastplate', 'Thunder Belt', 'Oracle', 'Twilight Armor', 'Guardian Helmet',
      'Blade Armor', 'Chastise Pauldron', 'Valkyrie\'s Shield', 'Leather Jerkin', 'Vitality Crystal', 'Steel Legplates',
      'Rock Potion'],
    movement: ['Warrior Boots', 'Tough Boots', 'Rapid Boots', 'Magic Shoes', 'Arcane Boots', 'Demon Shoes'],
    potion: ['Magic Potion'],
  };
  GS.data.mlbbItems = [];
  Object.keys(items).forEach((cat) => items[cat].forEach((name) => GS.data.mlbbItems.push({ name, cat })));
  GS.data.mlbbItemCats = { attack: 'Attack', magic: 'Magic', defense: 'Defense', movement: 'Movement', potion: 'Potion' };
  GS.data.mlbbEmblems = ['Common', 'Tank', 'Fighter', 'Assassin', 'Mage', 'Marksman', 'Support', 'Custom'];
})();
