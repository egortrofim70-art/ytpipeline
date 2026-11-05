// cast.js — one signature colour per character, identical in every shot.
export const HERO = { top: 'tshirt', color: '#ffd400', head: 'none' };                                   // "tú" — the channel's hero
export const SILVANO = { top: 'hoodie', color: '#6f8a5a', head: 'none', face: 'glasses' };               // Italian patient, 1984: olive cardigan + glasses
export const LUGARESI = { top: 'labcoat', head: 'none', face: 'glasses' };                                // neurologist, Bologna 1986
export const GAMBETTI = { top: 'labcoat', head: 'curly', headColor: '#2a2018' };                          // researcher, 1992
export const RANDY = { top: 'jersey', color: '#d64a33', head: 'capBack', headColor: '#3a6ea5', number: 17 }; // the 1964 record
export const SONIA = { top: 'tshirt', color: '#8a5ad6', head: 'ponytail', headColor: '#1e1410' };        // Sonia Vallabh
export const ERIC = { top: 'hoodie', color: '#3fb950', head: 'none', face: 'glasses' };                   // her husband
export const WIFE = { top: 'dress', color: '#c0605a', head: 'bun', headColor: '#4a3a30' };               // Silvano's wife
export const VENETO = { top: 'trench', color: '#5a3a2a', head: 'fedora', headColor: '#2a1a14' };         // the Venetian doctor, 1765
export const CAST = [HERO, SILVANO, LUGARESI, GAMBETTI, RANDY, SONIA, ERIC, WIFE];

// face overrides. 'ball' eyes = white eyeball + travelling pupil; lid = heavy upper eyelid; bags = rings under the eyes.
export const F = {
  calm: { eyes: 'ball', brows: null, mouth: 'flat', lid: 0.3 },
  awake: { eyes: 'ball', brows: 'raised', mouth: 'flat', eyeSize: 1.18, pupil: 0.42 },
  tired: { eyes: 'ball', brows: 'worried', mouth: 'flat', lid: 0.4 },
  sad: { eyes: 'ball', brows: 'worried', mouth: 'frown', lid: 0.35 },
  fear: { eyes: 'ball', brows: 'worried', mouth: 'flat', eyeSize: 1.28, pupil: 0.3 },
  shock: { eyes: 'ball', brows: 'raised', mouth: 'oBig', eyeSize: 1.3, pupil: 0.3 },
  talk: { eyes: 'ball', brows: null, mouth: 'smallFlat' },
  smile: { eyes: 'ball', brows: null, mouth: 'smile' },
  think: { eyes: 'ball', brows: 'raised', mouth: 'smallFlat', look: [0.5, -0.6] },
  day1: { eyes: 'ball', brows: null, mouth: 'smallFlat', lid: 0.35, bags: 0.3 },
  day3: { eyes: 'ball', brows: 'worried', mouth: 'wavy', lid: 0.45, bags: 0.55 },
  day5: { eyes: 'ball', brows: 'worried', mouth: 'flat', lid: 0.6, bags: 0.8 },
  day7: { eyes: 'ball', brows: 'worried', mouth: 'wavy', eyeSize: 1.22, pupil: 0.26, bags: 1 },
  wreck: { eyes: 'ball', brows: 'worried', mouth: 'wavy', lid: 0.55, bags: 1, pupil: 0.24 },
  blank: { eyes: 'ball', brows: null, mouth: 'flat', lid: 0.5, bags: 1, pupil: 0.3 },
};
