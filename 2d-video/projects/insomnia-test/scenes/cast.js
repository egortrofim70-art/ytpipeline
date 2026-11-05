// cast.js — the channel's recurring hero: yellow tee (#FFD400), the same in every video.
export const HERO = { top: 'tshirt', color: '#ffd400', head: 'none' };
export const CAST = [HERO];
// face overrides. 'ball' eyes = white eyeball + travelling pupil; lid = heavy upper eyelid; bags = rings under the eyes.
export const F = {
  calm: { eyes: 'ball', brows: null, mouth: 'flat', lid: 0.3 },
  awake: { eyes: 'ball', brows: 'raised', mouth: 'flat', eyeSize: 1.18, pupil: 0.42 },
  tired: { eyes: 'ball', brows: 'worried', mouth: 'flat', lid: 0.4 },
  sad: { eyes: 'ball', brows: 'worried', mouth: 'frown', lid: 0.35 },
  fear: { eyes: 'ball', brows: 'worried', mouth: 'flat', eyeSize: 1.28, pupil: 0.3 },
  // the week: each day the lids get heavier and the bags darker
  day1: { eyes: 'ball', brows: null, mouth: 'smallFlat', lid: 0.35, bags: 0.3 },
  day3: { eyes: 'ball', brows: 'worried', mouth: 'wavy', lid: 0.45, bags: 0.55 },
  day5: { eyes: 'ball', brows: 'worried', mouth: 'flat', lid: 0.6, bags: 0.8 },
  day7: { eyes: 'ball', brows: 'worried', mouth: 'wavy', eyeSize: 1.22, pupil: 0.26, bags: 1 },
};
