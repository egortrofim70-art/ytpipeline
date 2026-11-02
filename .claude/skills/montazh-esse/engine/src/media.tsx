import React from "react";
import { Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { appleOut, clamp, lerp } from "./theme";
import type { Media } from "./types";

export const isVideo = (s: string) => /\.(mp4|mov|webm|mkv|m4v)$/i.test(s);

// "emoji:🤡" — эмодзи Apple (как в образце); иначе путь внутри public (render.py кладёт туда всё нужное)
let EMOJI_STYLE: "apple" | "system" = "apple";
export const setEmojiStyle = (s?: "apple" | "system") => {
  if (s) EMOJI_STYLE = s;
};

export const emojiUrl = (e: string) => {
  const cps = Array.from(e)
    .map((c) => c.codePointAt(0)!.toString(16))
    .filter((c) => c !== "fe0f");
  return `https://cdn.jsdelivr.net/gh/iamcal/emoji-data@v15.1.2/img-apple-160/${cps.join("-")}.png`;
};

export const resolve = (src: string) => (/^https?:/.test(src) ? src : staticFile(src));

export const Pic: React.FC<{ src: string; style?: React.CSSProperties }> = ({ src, style }) => {
  if (src.startsWith("emoji:")) {
    const e = src.slice(6);
    if (EMOJI_STYLE === "system")
      return (
        <div style={{ ...style, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
          <span style={{ fontSize: "inherit" }}>{e}</span>
        </div>
      );
    return <Img src={emojiUrl(e)} style={{ objectFit: "contain", ...style }} />;
  }
  return <Img src={resolve(src)} style={{ objectFit: "contain", ...style }} />;
};

export const toMedia = (m: string | Media): Media => (typeof m === "string" ? { src: m } : m);

// Один кадр-источник с медленным наездом внутри рамки
export const MediaView: React.FC<{ m: Media; durF: number; fadeF?: number }> = ({ m, durF, fadeF = 0 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const z = m.zoom ?? [1, 1.04];
  const s = lerp(z[0], z[1], clamp(f / Math.max(1, durF)));
  const fo = m.focus ?? [0.5, 0.5];
  const fill: React.CSSProperties = { width: "100%", height: "100%", objectFit: m.fit ?? "cover" };
  const op = fadeF ? appleOut(f / fadeF) : 1; // растворение поверх предыдущего кадра
  return (
    <div style={{ position: "absolute", inset: 0, opacity: op, transform: `scale(${s})`, transformOrigin: `${fo[0] * 100}% ${fo[1] * 100}%` }}>
      {isVideo(m.src) ? (
        <OffthreadVideo src={resolve(m.src)} muted startFrom={Math.round((m.start ?? 0) * fps)} playbackRate={m.speed ?? 1} style={fill} />
      ) : (
        <Img src={resolve(m.src)} style={fill} />
      )}
    </div>
  );
};

// Время начала каждого кадра-источника в сцене: заданное "at" или поровну между соседями
export const mediaTimes = (media: Media[], t0: number, t1: number): number[] => {
  const ts: (number | undefined)[] = media.map((m, i) => (i === 0 ? m.at ?? t0 : m.at));
  for (let i = 0; i < ts.length; i++) {
    if (ts[i] !== undefined) continue;
    let j = i;
    while (j < ts.length && ts[j] === undefined) j++;
    const a = ts[i - 1]!;
    const b = j < ts.length ? ts[j]! : t1;
    for (let k = i; k < j; k++) ts[k] = a + ((b - a) * (k - i + 1)) / (j - i + 1);
  }
  return ts as number[];
};

export const activeIndex = (times: number[], t: number) => {
  let idx = 0;
  times.forEach((x, i) => {
    if (x <= t + 1e-6) idx = i;
  });
  return idx;
};

// Смена кадров внутри рамки — коротким растворением (~0,2 с); "trans": "cut" у элемента — жёстко
export const MediaTrack: React.FC<{ media: Media[]; t0: number; t1: number }> = ({ media, t0, t1 }) => {
  const { fps } = useVideoConfig();
  const ts = mediaTimes(media, t0, t1);
  const xf = Math.round(6 * (fps / 30));
  return (
    <>
      {media.map((m, i) => {
        const from = Math.round((ts[i] - t0) * fps);
        const to = Math.round(((i + 1 < media.length ? ts[i + 1] : t1 + 1) - t0) * fps);
        const fade = i > 0 && (m as any).trans !== "cut" ? xf : 0;
        return (
          <Sequence key={i} from={from} durationInFrames={Math.max(1, to - from + xf)} layout="none">
            <MediaView m={m} durF={to - from} fadeF={fade} />
          </Sequence>
        );
      })}
    </>
  );
};
