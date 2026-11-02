import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, TRACK, appleIn, appleOut, clamp, easeInOut, lerp, norm, rnd } from "./theme";
import type { Line, Plan, Word } from "./types";

// Кинетический текст: фраза раскладывается заранее по центру, слова встают на места,
// когда звучат; буквы выезжают снизу-справа из размытия (style-guide, раздел 3)

export type Tok = { text: string; f: number; accent: boolean; line: number };
export type Phrase = { f: number; toks: Tok[]; sizes: number[] };

const STRIP = /[,«»"]/g;

// "[таймер] - создаёт напряжение": в квадратных скобках — зелёный акцент
export function parseLine(s: string): { text: string; accent: boolean }[] {
  const out: { text: string; accent: boolean }[] = [];
  const re = /\[([^\]]+)\]|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m[1]) for (const t of m[1].split(/\s+/)) out.push({ text: t, accent: true });
    else out.push({ text: m[2], accent: false });
  }
  return out;
}

// Время появления каждого слова заданного текста — по ближайшему совпадению с речью сцены
export function matchTimes(texts: string[], words: Word[], t0: number): number[] {
  let p = 0;
  let last = words.length ? words[0].s : t0;
  return texts.map((tx) => {
    const n = norm(tx);
    if (!n) return last;
    for (let k = p; k < Math.min(words.length, p + 6); k++) {
      const wn = norm(words[k].w);
      if (!wn) continue;
      const dn = n.replace(/\D/g, "");
      const dw = wn.replace(/\D/g, "");
      const digits = dn.length > 0 && dw.length > 0 && dn.slice(0, 2) === dw.slice(0, 2);
      if (wn.startsWith(n.slice(0, 4)) || n.startsWith(wn.slice(0, 4)) || digits) {
        p = k + 1;
        last = words[k].s;
        return last;
      }
    }
    return last;
  });
}

export function linesPhrase(lines: Line[], words: Word[], t0: number, fps: number, accent: Set<string>): Phrase {
  const parsed = lines.map((l) => (typeof l === "string" ? { t: l, size: 1 } : { t: l.t, size: l.size ?? 1 }));
  const toks: Tok[] = [];
  parsed.forEach((l, li) =>
    parseLine(l.t).forEach((p) => toks.push({ text: p.text, f: 0, accent: p.accent || accent.has(norm(p.text)), line: li })),
  );
  const times = matchTimes(toks.map((t) => t.text), words, t0);
  toks.forEach((t, i) => (t.f = Math.round((times[i] - t0) * fps)));
  return { f: toks.length ? Math.min(...toks.map((t) => t.f)) : 0, toks, sizes: parsed.map((l) => l.size) };
}

// Речь сцены -> фразы по 1–3 слова: новая фраза после паузы, знака препинания или переполнения
export function autoPhrases(words: Word[], t0: number, fps: number, plan: Plan, accent: Set<string>): Phrase[] {
  const mw = plan.phrase?.max_words ?? 3;
  const mc = plan.phrase?.max_chars ?? 22;
  const gap = plan.phrase?.gap ?? 0.35;
  const out: Phrase[] = [];
  let cur: Tok[] = [];
  let chars = 0;
  let prev: Word | null = null;
  for (const w of words) {
    const text = w.w.replace(STRIP, "").trim();
    if (!text) continue;
    const brk =
      cur.length > 0 &&
      (cur.length >= mw || chars + text.length > mc || (prev !== null && w.s - prev.e > gap) || (prev !== null && /[.!?:;…]$/.test(prev.w)));
    if (brk) {
      out.push({ f: cur[0].f, toks: cur, sizes: [1] });
      cur = [];
      chars = 0;
    }
    cur.push({ text, f: Math.round((w.s - t0) * fps), accent: accent.has(norm(text)), line: 0 });
    chars += text.length + 1;
    prev = w;
  }
  if (cur.length) out.push({ f: cur[0].f, toks: cur, sizes: [1] });
  // фраза короче ~0,5 с мелькает — сливаем её со следующей, если вместе помещаются в строку
  const minF = 0.5 * fps;
  for (let i = 0; i + 1 < out.length; ) {
    const a = out[i];
    const b = out[i + 1];
    const chars = [...a.toks, ...b.toks].reduce((n, t) => n + t.text.length + 1, 0);
    if (b.f - a.f < minF && a.toks.length + b.toks.length <= mw + 1 && chars <= mc + 6) {
      out.splice(i, 2, { f: a.f, toks: [...a.toks, ...b.toks], sizes: [1] });
    } else i++;
  }
  return out;
}

// Оценка ширины строки в em для SF Pro Display Bold с плотным трекингом — чтобы строка не вылезала за кадр
export const emWidth = (s: string) =>
  Array.from(s).reduce(
    (a, ch) => a + (/[А-ЯЁA-Z]/.test(ch) ? 0.66 : /[0-9]/.test(ch) ? 0.56 : /\s/.test(ch) ? 0.26 : /[.,:;!?'"-]/.test(ch) ? 0.28 : 0.54) - 0.045,
    0,
  );

type KProps = {
  phrases: Phrase[];
  size: number;
  y?: number;
  dark?: boolean;
  shadow?: boolean; // белый текст поверх видео
  slide?: boolean; // буквы едут справа сильнее — для крупного слова
  scatter?: boolean; // слова появляются вразброс и собираются в строку
  color?: string;
};

export const KText: React.FC<KProps> = ({ phrases, size, y = 0.5, dark, shadow, slide, scatter, color }) => {
  const f = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  let idx = -1;
  phrases.forEach((p, i) => {
    if (p.f <= f) idx = i;
  });
  if (idx < 0) return null;
  const ph = phrases[idx];
  const k = fps / 30;
  const st = 0.9 * k;
  const D = (slide ? 12 : 10) * k; // мягкое появление буквы, ~0,33 с
  const dx = slide ? 0.45 : 0.16;
  const dy = slide ? 0.05 : 0.3;
  const base = color ?? (dark || shadow ? C.white : C.ink);
  const glow = dark ? "0 0 22px rgba(255,255,255,0.55)" : shadow ? "0 4px 24px rgba(0,0,0,0.55)" : undefined;
  const gather = scatter ? Math.max(...ph.toks.map((t) => t.f)) + 0.3 * fps : 0;
  const lines = Array.from(new Set(ph.toks.map((t) => t.line))).sort((a, b) => a - b);

  // уход фразы: заканчивается ровно к появлению следующей, поэтому две фразы никогда не стоят друг на друге
  const nextF = idx + 1 < phrases.length ? phrases[idx + 1].f : null;
  let exitT = 0;
  if (nextF !== null) {
    const shown = Math.max(...ph.toks.map((t) => t.f + Array.from(t.text).length * st + D));
    const start = Math.max(nextF - 6 * k, Math.min(shown, nextF - 2 * k));
    exitT = nextF > start ? clamp((f - start) / (nextF - start)) : 0;
  }
  const eo = appleIn(exitT);
  const maxW = 1720;

  return (
    <div
      style={{
        opacity: 1 - eo,
        filter: eo > 0.001 ? `blur(${eo * 0.07 * size}px)` : undefined,
        position: "absolute",
        left: 0,
        right: 0,
        top: y * height,
        transform: `translateY(calc(-50% - ${eo * 0.12 * size}px))`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: FONT,
        fontWeight: 700,
        letterSpacing: TRACK,
        lineHeight: 1.0,
      }}
    >
      {lines.map((li) => {
        const fs = size * (ph.sizes[li] ?? 1);
        const est = emWidth(ph.toks.filter((t) => t.line === li).map((t) => t.text).join(" ")) * fs;
        const fit = est > maxW ? maxW / est : 1;
        return (
        <div key={li} style={{ display: "flex", whiteSpace: "nowrap", fontSize: fs * fit, marginTop: li ? "0.06em" : 0 }}>
          {ph.toks.map((t, ti) => {
            if (t.line !== li) return null;
            const off = scatter ? 1 - easeInOut((f - gather) / (0.45 * fps)) : 0;
            const ox = scatter ? (rnd(ti + 1) - 0.5) * 900 * off : 0;
            const oy = scatter ? (rnd(ti + 11) - 0.5) * 420 * off : 0;
            return (
              <span
                key={ti}
                style={{
                  display: "inline-block",
                  marginRight: "0.24em",
                  transform: `translate(${ox}px, ${oy}px)`,
                  color: t.accent ? C.accent : base,
                  textShadow: t.accent ? `0 0 18px ${C.accentGlow}, 0 0 60px ${C.accentGlow}` : glow,
                }}
              >
                {Array.from(t.text).map((ch, ci) => {
                  const p = clamp((f - t.f - ci * st) / D);
                  const e = appleOut(p);
                  return (
                    <span
                      key={ci}
                      style={{
                        display: "inline-block",
                        whiteSpace: "pre",
                        opacity: clamp(p * 1.8),
                        transform: `translate(${(1 - e) * dx}em, ${(1 - e) * dy}em)`,
                        filter: e < 0.999 ? `blur(${lerp(0, 0.085 * size, 1 - e)}px)` : undefined,
                      }}
                    >
                      {ch}
                    </span>
                  );
                })}
              </span>
            );
          })}
        </div>
        );
      })}
    </div>
  );
};
