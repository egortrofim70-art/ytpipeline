/* Story-level settings. Claude rewrites this file for every new video. */
export type CounterKeyDef = {line: string; off?: number; v: number; roll?: number};

export const STORY: {
	title: string;
	hero: string; // cast id of the main character
	counter?: {label: string; color?: string; keys: CounterKeyDef[]}; // badge over the hero (age, lives, money…)
	heroAge?: (counter: number) => number; // 0..1 body ageing driven by the counter (optional)
	heroGrow?: number; // how much bigger the hero gets at full ageing (0.07 = +7 %)
	bed: string; // sound bed in public/ (ambience + sfx, music only if the user wants it)
	musicVolume?: number; // only if the bed has music in it
	endCaption?: string[]; // last words on screen (call to action), optional
} = {
	title: 'Демо: шагомер над головой',
	hero: 'hero',
	counter: {
		label: 'ШАГИ',
		keys: [
			{line: '001', v: 0},
			{line: '002', off: 20, v: 9999, roll: 40},
			{line: '003', off: 30, v: 10000, roll: 4},
		],
	},
	bed: 'sfx/bed.wav',
	endCaption: ['А ТЫ БЫ ХОТЕЛ ТАКОЙ?', 'ПИШИ В КОММЕНТАРИЯХ'],
};
