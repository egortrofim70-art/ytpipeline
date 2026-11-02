// Время в плане — секунды итогового ролика (как в words_out.json после prep.py)
export type Word = { w: string; s: number; e: number };

export type Media = {
  src: string;
  at?: number;
  start?: number; // с какой секунды видео
  speed?: number;
  zoom?: [number, number]; // наезд внутри кадра, по умолчанию [1, 1.06]
  focus?: [number, number];
  fit?: "cover" | "contain";
  trans?: "fade" | "cut"; // смена на этот кадр внутри рамки: растворение (по умолчанию) или склейка
  caption?: Caption;
};

export type Caption = { title: string; channel?: string; avatar?: string; views?: string };

export type Line = string | { t: string; size?: number };

export type Scene = {
  at: number;
  kind: string;
  enter?: "cut" | "push" | "circle" | "blur" | "flash" | "zoom";
  dark?: boolean;
  lines?: Line[];
  text?: string;
  size?: number;
  y?: number;
  [k: string]: any;
};

export type Overlay = { kind: "timer"; at: number; until: number; from: number };

export type Sfx = { at: number; src: string; volume?: number; dur?: number };

export type Plan = {
  fps: number;
  duration: number;
  voice?: string;
  voice_volume?: number;
  words: Word[];
  music?: { src: string; volume?: number; start?: number; fade_out?: number };
  sfx?: boolean;
  sfx_volume?: number;
  sfx_list?: Sfx[];
  accent?: string[];
  emoji?: "apple" | "system";
  overlays?: Overlay[];
  phrase?: { max_words?: number; max_chars?: number; gap?: number };
  scenes: Scene[];
};

export type Ctx = {
  plan: Plan;
  scene: Scene;
  t0: number; // начало сцены, с
  t1: number; // конец сцены, с
  words: Word[]; // слова, звучащие в сцене
  accent: Set<string>;
};
