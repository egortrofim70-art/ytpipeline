import type {Base} from '../kit/actions';

/* Characters of this video. Key = id used in <Actor who="..."/>; `sp` = speaker code in
   lines.json (default: the id in upper case). Keep the hero yellow: the audience learns
   the colour in the first seconds and finds the hero in any crowd.
   Looks: color (hoodie), outfit hoodie|suit|gown|coat|apron|tee, hair none|spiky|bun|cap|
   ponytail|grey|bob|short, hairColor, acc [headphones|mustache|glasses], shoe. */
export type CastMember = Base & {sp?: string};

export const CAST: Record<string, CastMember> = {
	hero: {color: '#f2b21c', hair: 'short', rim: '#fff0cc', rimW: 2.4},
	friend: {color: '#d94a3a', hair: 'cap', hairColor: '#2f6fd8', rim: '#ffe0c8', rimW: 2.4, shoe: '#f2f2f2'},
	mom: {color: '#7a5cc4', hair: 'bob', rim: '#ffe6c8', rimW: 2.4, shoe: '#2c2540'},
	girl: {color: '#8b5cf6', hair: 'ponytail', hairColor: '#ffd34a', acc: ['headphones'], rim: '#efe2ff', rimW: 2.4, shoe: '#efe2ff'},
	teacher: {color: '#8e3a4f', outfit: 'suit', hair: 'bun', acc: ['glasses'], rim: '#ffe6d6', rimW: 2.4, shoe: '#2b1d24'},
	guard: {color: '#3a4256', outfit: 'suit', hair: 'cap', hairColor: '#28304a', acc: ['mustache'], rim: '#e6ecff', rimW: 2.4, shoe: '#111'},
	doctor: {color: '#eef3f2', outfit: 'coat', hair: 'bob', rim: '#d8fff2', rimW: 2.4, shoe: '#2c3a40'},
	seller: {color: '#3aa37a', outfit: 'apron', hair: 'bun', rim: '#e8fff2', rimW: 2.4, shoe: '#1d2b24'},
	grandpa: {color: '#6b7f8e', outfit: 'tee', hair: 'grey', acc: ['glasses'], rim: '#eef4ff', rimW: 2.4, shoe: '#2b2f3a'},
};
