import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { DARK_KINDS, KINDS } from "./scenes";
import { setEmojiStyle } from "./media";
import { C, FONT, appleIn, appleOut, clamp, easeInOut, lerp, norm } from "./theme";
import type { Ctx, Plan, Scene, Sfx } from "./types";

// Переходы, кадры при 30 к/с. pre — старое содержимое уходит ДО стыка (на стыке его уже нет — текст не налезает),
// in — новое появляется после стыка; на время in старая сцена остаётся только фоном, новый фон проявляется поверх.
// push и circle — одновременные: сцены разнесены в пространстве (толчок) или новая закрывает старую (круг).
const TRANS: Record<string, { pre: number; in: number }> = {
  smooth: { pre: 6, in: 12 },
  blur: { pre: 6, in: 12 },
  zoom: { pre: 7, in: 13 },
  push: { pre: 0, in: 14 },
  circle: { pre: 0, in: 15 },
  flash: { pre: 0, in: 8 },
  cut: { pre: 0, in: 0 },
};
const SEQUENTIAL = new Set(["smooth", "blur", "zoom"]);
export const enterOf = (sc?: Scene) => (sc?.enter ?? "smooth") as string;

// Правило пользователя: сцена из одного текста (и графики) — всегда чёрным по белому, никаких тёмных плашек.
// Тёмный фон допускается только под видео (стена, коллаж, полный кадр, рилсы, карточка с dark)
const LIGHT_ONLY = new Set(["text", "act", "objects", "qr", "stat", "chart", "counter", "chat"]);
const isDark = (sc: Scene) => !LIGHT_ONLY.has(sc.kind) && (sc.dark ?? DARK_KINDS.has(sc.kind));

// Вход/выход содержимого: t — 0..1 по кривым Apple
const contentIn = (kind: string, t: number): [string, string, number] => {
  const e = appleOut(t);
  if (kind === "blur") return [`scale(${lerp(1.06, 1, e)})`, `blur(${(1 - e) * 24}px)`, e];
  if (kind === "zoom") return [`scale(${lerp(0.9, 1, e)})`, `blur(${(1 - e) * 16}px)`, e];
  return [`scale(${lerp(1.025, 1, e)}) translateY(${(1 - e) * 14}px)`, `blur(${(1 - e) * 10}px)`, e];
};
const contentOut = (kind: string, t: number): [string, string, number] => {
  const e = appleIn(t);
  if (kind === "blur") return [`scale(${lerp(1, 1.04, e)})`, `blur(${e * 16}px)`, 1 - e];
  if (kind === "zoom") return [`scale(${lerp(1, 1.12, e)})`, `blur(${e * 10}px)`, 1 - e];
  return [`scale(${lerp(1, 0.985, e)}) translateY(${-e * 10}px)`, `blur(${e * 8}px)`, 1 - e];
};

// Сцена: фон и содержимое — отдельные слои. lf — кадр от начала сцены; own — длина сцены до следующей
const SceneWrap: React.FC<{ ctx: Ctx; own: number; next?: Scene; first: boolean }> = ({ ctx, own, next, first }) => {
  const lf = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = fps / 30;
  const sc = ctx.scene;
  const Comp = KINDS[sc.kind] ?? KINDS.text;
  const enter = first && !sc.enter ? "cut" : enterOf(sc);
  const dIn = (TRANS[enter]?.in ?? 0) * k;
  const pin = dIn ? clamp(lf / dIn) : 1;
  const wrap: React.CSSProperties = { overflow: "hidden" };
  const bg: React.CSSProperties = { background: isDark(sc) ? C.black : C.white };
  const content: React.CSSProperties = {};
  const ctf: string[] = [];
  const cfl: string[] = [];
  let op = 1;

  if (SEQUENTIAL.has(enter) && pin < 1) {
    const [t, f, o] = contentIn(enter, pin);
    ctf.push(t); cfl.push(f); op *= o;
    bg.opacity = appleOut(pin * 1.6);
  }
  if (enter === "push" && pin < 1) {
    const e = easeInOut(pin);
    wrap.transform = `translateY(${(1 - e) * 100}%)`;
    wrap.filter = `blur(${Math.sin(Math.PI * e) * 12}px)`;
  }
  if (enter === "circle" && pin < 1) wrap.clipPath = `circle(${lerp(0, 1150, easeInOut(pin))}px at 50% 50%)`;

  // выход
  const nk = next ? enterOf(next) : "cut";
  const tr = TRANS[nk] ?? TRANS.cut;
  const pre = Math.min(tr.pre * k, own / 3);
  if (next && SEQUENTIAL.has(nk) && lf >= own - pre) {
    const [t, f, o] = contentOut(nk, pre ? (lf - (own - pre)) / pre : 1);
    ctf.push(t); cfl.push(f); op *= lf >= own ? 0 : o;
  }
  if (next && nk === "push" && lf >= own) {
    const e = easeInOut((lf - own) / (tr.in * k));
    wrap.transform = `translateY(${-e * 100}%)`;
    wrap.filter = `blur(${Math.sin(Math.PI * e) * 12}px)`;
  }
  if (ctf.length) content.transform = ctf.join(" ");
  if (cfl.length) content.filter = cfl.join(" ");
  content.opacity = op;
  return (
    <AbsoluteFill style={wrap}>
      <AbsoluteFill style={bg} />
      {op > 0.001 && (
        <AbsoluteFill style={content}>
          <Comp ctx={ctx} />
        </AbsoluteFill>
      )}
      {enter === "flash" && pin < 1 && <AbsoluteFill style={{ background: sc.flash ?? "#000", opacity: 1 - appleOut(pin) }} />}
    </AbsoluteFill>
  );
};

const Timer: React.FC<{ from: number; dark: boolean }> = ({ from }) => {
  const f = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const left = Math.max(0, Math.ceil(from - f / fps));
  const op = Math.min(appleOut(f / (10 * (fps / 30))), 1 - appleIn((f - (durationInFrames - 8 * (fps / 30))) / (8 * (fps / 30))));
  return (
    <div style={{ position: "absolute", right: 34, top: 26, fontFamily: FONT, fontWeight: 500, fontSize: 44, color: C.gray, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", opacity: op }}>
      {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
    </div>
  );
};

const sfxPath = (s: string) => (/[\/\\.]/.test(s) ? staticFile(s) : staticFile(`sfx/${s}.mp3`));
const SFX_FILE: Record<string, string> = { whoosh: "sfx/whoosh.mp3", pop: "sfx/pop.mp3", click: "sfx/click.mp3", hit: "sfx/hit.wav" };

// Звуки по умолчанию: whoosh на переходах, удар на крупном слове и главе, щелчок на объектах
const autoSfx = (plan: Plan): Sfx[] => {
  const out: Sfx[] = [];
  plan.scenes.forEach((sc, i) => {
    const e = sc.enter ?? "cut";
    if (i > 0 && ["push", "circle", "zoom", "blur"].includes(e)) out.push({ at: sc.at - 0.12, src: "whoosh", volume: 0.3 });
    if (sc.kind === "text" && sc.big) out.push({ at: sc.at, src: "hit", volume: 0.45 });
    if (sc.kind === "act") out.push({ at: sc.at, src: "hit", volume: 0.35 });
    if (["qr", "stat", "chart"].includes(sc.kind)) out.push({ at: sc.at, src: "pop", volume: 0.3 });
    (sc.items ?? []).forEach((it: any, j: number) => {
      out.push({ at: it.at ?? sc.at + j * 0.25, src: "pop", volume: 0.3 });
      if (it.click !== undefined) out.push({ at: it.click, src: "click", volume: 0.6 });
    });
    if (sc.sfx) out.push(...sc.sfx);
  });
  return out;
};

export const Main: React.FC<{ plan: Plan }> = ({ plan }) => {
  const { fps, durationInFrames } = useVideoConfig();
  setEmojiStyle(plan.emoji);
  const scenes = [...plan.scenes].sort((a, b) => a.at - b.at).map((sc) => ({ ...sc, dark: isDark(sc) }));
  const accent = new Set((plan.accent ?? []).map(norm));
  const k = fps / 30;
  const sv = plan.sfx_volume ?? 1;
  const sfx = [...(plan.sfx === false ? [] : autoSfx({ ...plan, scenes })), ...(plan.sfx_list ?? [])];
  const music = plan.music;

  return (
    <AbsoluteFill style={{ background: C.white }}>
      {scenes.map((sc, i) => {
        const t0 = sc.at;
        const t1 = i + 1 < scenes.length ? scenes[i + 1].at : durationInFrames / fps;
        const from = Math.round(t0 * fps);
        const own = Math.round(t1 * fps) - from;
        const next = scenes[i + 1];
        // старая сцена живёт ещё in кадров следующего перехода: фоном (под проявляющимся новым) или уезжая вверх
        const extra = next ? (TRANS[enterOf(next)] ?? TRANS.cut).in * k : 0;
        const words = plan.words.filter((w) => w.s >= t0 - 0.02 && w.s < t1 - 0.02);
        const ctx: Ctx = { plan, scene: sc, t0, t1, words, accent };
        return (
          <Sequence key={i} from={from} durationInFrames={Math.max(1, own + Math.round(extra))}>
            <SceneWrap ctx={ctx} own={own} next={next} first={i === 0} />
          </Sequence>
        );
      })}
      {(plan.overlays ?? []).map((o, i) =>
        o.kind === "timer" ? (
          <Sequence key={`o${i}`} from={Math.round(o.at * fps)} durationInFrames={Math.max(1, Math.round((o.until - o.at) * fps))}>
            <Timer from={o.from} dark={false} />
          </Sequence>
        ) : null,
      )}
      {plan.voice && <Audio src={staticFile(plan.voice)} volume={plan.voice_volume ?? 1} />}
      {music && (
        <Audio
          src={staticFile(music.src)}
          startFrom={Math.round((music.start ?? 0) * fps)}
          loop
          volume={(f) => {
            const v = music.volume ?? 0.12;
            const fin = clamp(f / (0.5 * fps));
            const fout = clamp((durationInFrames - f) / ((music.fade_out ?? 1.5) * fps));
            return v * fin * fout;
          }}
        />
      )}
      {sfx.map((s, i) => (
        <Sequence key={`s${i}`} from={Math.max(0, Math.round(s.at * fps))} durationInFrames={Math.round((s.dur ?? 2.2) * fps)}>
          <Audio src={SFX_FILE[s.src] ? staticFile(SFX_FILE[s.src]) : sfxPath(s.src)} volume={(s.volume ?? 0.4) * sv} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
