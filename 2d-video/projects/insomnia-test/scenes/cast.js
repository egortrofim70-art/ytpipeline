// cast.js — the channel's recurring hero: yellow tee (#FFD400), the same in every video.
export const HERO = { top: 'tshirt', color: '#ffd400', head: 'none' };
export const CAST = [HERO];
// face overrides (eyes/brows/mouth) — the kit's "neutral" smiles, which is wrong for a sleepless night
export const F = {
  calm: { eyes: 'dot', brows: null, mouth: 'flat' },
  awake: { eyes: 'ring', brows: null, mouth: 'flat' },
  tired: { eyes: 'dot', brows: 'worried', mouth: 'flat' },
  sad: { eyes: 'dot', brows: 'worried', mouth: 'frown' },
  fear: { eyes: 'wide', brows: 'worried', mouth: 'flat' },
  dread: { eyes: 'wide', brows: 'worried', mouth: 'wavy' },
};
