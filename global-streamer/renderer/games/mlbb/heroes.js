/*
 * Mobile Legends: Bang Bang - senarai hero (dataset AWAL).
 * Hanya untuk panel peribadi streamer (TIDAK dipaparkan kepada penonton).
 * PENTING: peranan utama ditulis dari pengetahuan umum dan perlu disahkan mengikut patch semasa
 * (hero baharu mungkin belum ada). Pengemaskinian automatik dirancang pada Fasa 5.
 * Format: [nama, peranan utama, peranan kedua (pilihan)]
 */
(function () {
  'use strict';
  const T = 'Tank', F = 'Fighter', A = 'Assassin', M = 'Mage', K = 'Marksman', S = 'Support';
  const raw = [
    ['Aamon', A], ['Akai', T], ['Aldous', F], ['Alice', M, T], ['Alpha', F], ['Alucard', F, A], ['Angela', S, M],
    ['Argus', F], ['Arlott', F], ['Atlas', T], ['Aulus', F], ['Aurora', M], ['Badang', F], ['Balmond', F],
    ['Bane', F], ['Barats', T, F], ['Baxia', T], ['Beatrix', K], ['Belerick', T], ['Benedetta', A],
    ['Brody', K], ['Bruno', K], ['Carmilla', S, T], ['Cecilion', M], ['Chang\'e', M], ['Chip', S, T],
    ['Chou', F], ['Cici', F], ['Claude', K, A], ['Clint', K], ['Cyclops', M], ['Diggie', S], ['Dyrroth', F],
    ['Edith', T, K], ['Esmeralda', M, T], ['Estes', S], ['Eudora', M], ['Fanny', A], ['Faramis', M, S],
    ['Floryn', S], ['Franco', T], ['Fredrinn', F, T], ['Freya', F], ['Gatotkaca', T, F], ['Gloo', T],
    ['Gord', M], ['Granger', K], ['Grock', T, F], ['Guinevere', F, M], ['Gusion', A], ['Hanabi', K],
    ['Hanzo', A], ['Harith', M], ['Harley', M, A], ['Hayabusa', A], ['Helcurt', A], ['Hilda', F, T],
    ['Hylos', T], ['Irithel', K], ['Ixia', K], ['Jawhead', F], ['Johnson', T], ['Joy', A], ['Julian', F, A],
    ['Kadita', M], ['Kagura', M], ['Kaja', S, F], ['Kalea', S, F], ['Karina', A], ['Karrie', K],
    ['Khaleed', F], ['Khufra', T], ['Kimmy', K, M], ['Lancelot', A], ['Lapu-Lapu', F], ['Layla', K],
    ['Leomord', F], ['Lesley', K], ['Ling', A], ['Lolita', T, S], ['Lukas', F], ['Lunox', M],
    ['Luo Yi', M], ['Lylia', M], ['Martis', F], ['Masha', F, T], ['Mathilda', S, A], ['Melissa', K],
    ['Minotaur', T, S], ['Minsitthar', T, F], ['Miya', K], ['Moskov', K], ['Nana', M, S], ['Natalia', A],
    ['Natan', K, M], ['Nolan', A], ['Novaria', M], ['Obsidia', K, M], ['Odette', M], ['Paquito', F],
    ['Pharsa', M], ['Phoveus', F], ['Popol and Kupa', K], ['Rafaela', S], ['Roger', F, K], ['Ruby', F, T],
    ['Saber', A], ['Selena', A, M], ['Silvanna', F], ['Sun', F], ['Suyou', F, A], ['Terizla', F],
    ['Thamuz', F], ['Tigreal', T], ['Uranus', T], ['Vale', M], ['Valentina', M], ['Valir', M],
    ['Vexana', M], ['Wanwan', K], ['X.Borg', F], ['Xavier', M], ['Yin', F], ['Yi Sun-shin', K, A],
    ['Yu Zhong', F], ['Yve', M], ['Zhask', M], ['Zetian', M], ['Zhuxin', M], ['Zilong', F],
    ['Marcel', S, T],
  ];
  GS.data = GS.data || {};
  GS.data.mlbbHeroes = raw.map(([name, role, role2]) => ({ name, role, roles: role2 ? [role, role2] : [role] }));
  GS.data.mlbbRoles = [T, F, A, M, K, S];
})();
