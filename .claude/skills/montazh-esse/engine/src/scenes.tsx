import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { KText, Phrase, autoPhrases, linesPhrase } from "./text";
import { MediaTrack, Pic, activeIndex, mediaTimes, toMedia } from "./media";
import { C, FONT, TRACK, appleOut, clamp, easeInOut, lerp, pop } from "./theme";
import type { Caption, Ctx, Media } from "./types";

// Все размеры — в пикселях кадра 1920×1080 (образец)

const SHADOW = "0 22px 55px rgba(0,0,0,0.22), 0 3px 10px rgba(0,0,0,0.08)";

// Текст сцены: заданный (lines/text) или речь сцены по фразам
export const scenePhrases = (ctx: Ctx, fps: number): Phrase[] => {
  const sc = ctx.scene;
  const lines = sc.lines ?? (sc.text ? [sc.text] : null);
  if (lines) return [linesPhrase(lines, ctx.words, ctx.t0, fps, ctx.accent)];
  if (sc.big) return [linesPhrase([ctx.words.map((w) => w.w.replace(/[,.]/g, "")).join(" ")], ctx.words, ctx.t0, fps, ctx.accent)];
  return autoPhrases(ctx.words, ctx.t0, fps, ctx.plan, ctx.accent);
};

// Текст поверх видео: под ним мягкое затемнение полосой, чтобы буквы не смешивались с картинкой и надписями в кадре
const SpeechText: React.FC<{ ctx: Ctx; size: number; y: number; dark?: boolean; shadow?: boolean }> = ({ ctx, size, y, dark, shadow }) => {
  const { fps } = useVideoConfig();
  const ph = scenePhrases(ctx, fps);
  return (
    <>
      {shadow && ph.length > 0 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 70% ${Math.round((size * 2.4 * 100) / 1080)}% at 50% ${y * 100}%, rgba(0,0,0,0.55), rgba(0,0,0,0) 100%)`,
          }}
        />
      )}
      <KText phrases={ph} size={size} y={y} dark={dark} shadow={shadow} />
    </>
  );
};

// ---------------------------------------------------------------- text
const TextScene: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const { fps } = useVideoConfig();
  const sc = ctx.scene;
  // крупное слово («НО», «ЭМОЦИИ») занимает почти всю ширину: в образце до ~540 px
  const fit = () => {
    const txt = sc.lines ? sc.lines.map((l: any) => (typeof l === "string" ? l : l.t)).join(" ") : sc.text ?? ctx.words.map((w) => w.w).join(" ");
    const em = Array.from(txt.replace(/[\[\]]/g, "")).reduce((a, ch) => a + (/[А-ЯЁA-Z0-9]/.test(ch) ? 0.68 : ch === " " ? 0.24 : 0.55), 0);
    return Math.min(520, 1500 / Math.max(1, em));
  };
  const size = sc.size ?? (sc.big ? fit() : 120);
  return (
    <KText
      phrases={scenePhrases(ctx, fps)}
      size={size}
      y={sc.y ?? 0.5}
      dark={sc.dark}
      slide={!!sc.big}
      scatter={!!sc.scatter}
    />
  );
};

// ---------------------------------------------------------------- card
const CaptionBlock: React.FC<{ c: Caption; x: number; y: number; w: number; dark?: boolean }> = ({ c, x, y, w, dark }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, fontFamily: FONT, color: dark ? C.white : C.ink }}>
    <div style={{ fontSize: 58, fontWeight: 700, letterSpacing: "-0.035em", whiteSpace: "nowrap", lineHeight: 1.05 }}>{c.title}</div>
    {(c.channel || c.views) && (
      <div style={{ display: "flex", alignItems: "center", marginTop: 26, fontSize: 44 }}>
        {c.avatar && <Pic src={c.avatar} style={{ width: 60, height: 60, borderRadius: 30, objectFit: "cover", marginRight: 14 }} />}
        <div style={{ fontWeight: 500, letterSpacing: "-0.03em" }}>{c.channel}</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontWeight: 500, fontSize: 40, color: C.gray, letterSpacing: "-0.03em" }}>{c.views}</div>
      </div>
    )}
  </div>
);

const CardScene: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = ctx.scene;
  const media: Media[] = (sc.media ?? [sc.src]).filter(Boolean).map(toMedia);
  const ts = mediaTimes(media, ctx.t0, ctx.t1);
  const cur = media[activeIndex(ts, ctx.t0 + f / fps)];
  const cap: Caption | undefined = cur?.caption ?? sc.caption;
  const hasCap = !!(sc.caption || media.some((m) => m.caption));
  const num: string | undefined = sc.num;
  const w = sc.width ? sc.width * 1920 : hasCap ? 1335 : num ? 1435 : 1600;
  const h = w / (sc.aspect ?? 16 / 9);
  const x = sc.x !== undefined ? sc.x * 1920 - w / 2 : (1920 - w) / 2 + (num ? 125 : 0);
  const y = sc.cy !== undefined ? sc.cy * 1080 - h / 2 : hasCap ? 75 : (1080 - h) / 2;
  return (
    <AbsoluteFill>
      {num && (
        <div
          style={{
            position: "absolute",
            right: 1920 - x + 22,
            top: y + h - 270,
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 330,
            letterSpacing: TRACK,
            lineHeight: "270px",
            color: sc.dark ? C.white : C.ink,
          }}
        >
          {num}
        </div>
      )}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: h,
          borderRadius: sc.radius ?? Math.round(w * 0.022),
          overflow: "hidden",
          boxShadow: sc.dark ? "none" : SHADOW,
          background: "#111",
        }}
      >
        <MediaTrack media={media} t0={ctx.t0} t1={ctx.t1} />
      </div>
      {cap && <CaptionBlock c={cap} x={x} y={y + h + 30} w={w} dark={sc.dark} />}
      {sc.say && <SpeechText ctx={ctx} size={sc.size ?? 110} y={sc.y ?? 0.5} shadow />}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- full
const FullScene: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const sc = ctx.scene;
  const media: Media[] = (sc.media ?? [sc.src]).filter(Boolean).map(toMedia);
  return (
    <AbsoluteFill>
      <MediaTrack media={media} t0={ctx.t0} t1={ctx.t1} />
      {sc.say && <SpeechText ctx={ctx} size={sc.size ?? 120} y={sc.y ?? 0.5} shadow />}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- act
const ActScene: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = ctx.scene;
  const ph = sc.title ? [linesPhrase([sc.title], ctx.words, ctx.t0, fps, ctx.accent)] : scenePhrases(ctx, fps);
  if (sc.title && sc.title_at === undefined) ph[0].toks.forEach((t, i) => (t.f = Math.round(i * 3 * (fps / 30))));
  const size = sc.size ?? 110;
  return (
    <AbsoluteFill>
      {sc.label && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 540 - size * 0.95,
            textAlign: "center",
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: 34,
            color: C.gray,
            opacity: appleOut(f / (10 * (fps / 30))),
            filter: `blur(${(1 - appleOut(f / (10 * (fps / 30)))) * 6}px)`,
          }}
        >
          {sc.label}
        </div>
      )}
      <KText phrases={ph} size={size} y={0.5} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- wall: выгнутая стена превью
const WallScene: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = ctx.scene;
  const imgs: string[] = (sc.images ?? sc.media ?? []).map((m: any) => (typeof m === "string" ? m : m.src));
  const cols = sc.cols ?? 9;
  const rows = sc.rows ?? 3;
  const tw = 560;
  const th = tw * 0.5625;
  const R = 1500;
  const step = 21;
  const dur = (ctx.t1 - ctx.t0) * fps;
  const drift = lerp(0, -(sc.drift ?? 8), f / Math.max(1, dur));
  const tiles: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      if (!imgs.length) break;
      const ang = (c - (cols - 1) / 2) * step + drift + (r % 2 ? step / 2 : 0);
      const yy = (r - (rows - 1) / 2) * (th + 40);
      tiles.push(
        <div
          key={i}
          style={{
            position: "absolute",
            left: -tw / 2,
            top: yy - th / 2,
            width: tw,
            height: th,
            transform: `rotateY(${ang}deg) translateZ(${-R}px)`,
            borderRadius: 16,
            overflow: "hidden",
            backfaceVisibility: "hidden",
          }}
        >
          <Pic src={imgs[i % imgs.length]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>,
      );
    }
  return (
    <AbsoluteFill style={{ background: "#070707" }}>
      <div style={{ position: "absolute", left: 960, top: 540, perspective: 1100, perspectiveOrigin: "0 0" }}>
        <div style={{ transformStyle: "preserve-3d", transform: `translateZ(${R - 380}px)` }}>{tiles}</div>
      </div>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.85) 100%)" }} />
      <SpeechText ctx={ctx} size={sc.size ?? 110} y={sc.y ?? 0.5} dark />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- grid: коллаж встык
const GridScene: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = ctx.scene;
  const media: Media[] = (sc.media ?? []).map(toMedia);
  const cols = sc.cols ?? 3;
  const rows = Math.ceil(media.length / cols);
  const w = 1920 / cols;
  const h = 1080 / rows;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {media.map((m, i) => {
        const p = pop(f, fps, i * 1.5 * (fps / 30));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: (i % cols) * w,
              top: Math.floor(i / cols) * h,
              width: w,
              height: h,
              overflow: "hidden",
              transform: `scale(${lerp(0.85, 1, clamp(p))})`,
              opacity: clamp(p * 2),
            }}
          >
            <MediaTrack media={[{ ...m, at: ctx.t0 }]} t0={ctx.t0} t1={ctx.t1} />
          </div>
        );
      })}
      <SpeechText ctx={ctx} size={sc.size ?? 110} y={sc.y ?? 0.5} shadow />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- objects: эмодзи, иконки, курсор
const Cursor: React.FC<{ size?: number }> = ({ size = 70 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }}>
    <path d="M5 2 L5 20 L9.5 15.5 L12.5 22 L15.5 20.7 L12.6 14.3 L19 14.3 Z" fill="#111" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);

const ObjectsScene: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = ctx.scene;
  const items: any[] = sc.items ?? [];
  return (
    <AbsoluteFill>
      {items.map((it, i) => {
        const at = it.at ?? ctx.t0 + i * 0.25;
        const lf = (at - ctx.t0) * fps;
        const p = pop(f, fps, lf);
        if (f < lf) return null;
        const size = it.size ?? 220;
        const cf = it.click !== undefined ? (it.click - ctx.t0) * fps : null;
        const press = cf !== null ? 1 - 0.07 * Math.sin(Math.PI * clamp((f - cf) / (6 * (fps / 30)))) : 1;
        const src = it.emoji ? `emoji:${it.emoji}` : it.src;
        const cx = (it.x ?? 0.5) * 1920;
        const cy = (it.y ?? 0.42) * 1080;
        return (
          <div key={i} style={{ position: "absolute", left: cx - size / 2, top: cy - size / 2, width: size }}>
            <div style={{ width: size, height: size, transform: `scale(${p * press}) rotate(${(1 - clamp(p)) * -12}deg)` }}>
              {it.text !== undefined ? (
                <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: size * 0.8, textAlign: "center", lineHeight: `${size}px`, letterSpacing: TRACK, color: sc.dark ? C.white : C.ink }}>
                  {it.text}
                </div>
              ) : (
                <Pic src={src} style={{ width: size, height: size, borderRadius: it.radius ?? 0, boxShadow: it.shadow ? SHADOW : undefined }} />
              )}
            </div>
            {it.label && (
              <div style={{ textAlign: "center", fontFamily: FONT, fontWeight: 600, fontSize: it.label_size ?? 34, marginTop: 10, letterSpacing: "-0.02em", opacity: clamp(p), color: sc.dark ? C.white : C.ink }}>
                {it.label}
              </div>
            )}
            {it.sub && (
              <div style={{ textAlign: "center", fontFamily: FONT, fontWeight: 500, fontSize: 22, color: C.gray, opacity: clamp(p) }}>{it.sub}</div>
            )}
            {cf !== null && f > cf && f < cf + 0.7 * fps && (
              // круг от точки клика
              <div
                style={{
                  position: "absolute",
                  left: size * 0.55 + 6,
                  top: size * 0.55 + 4,
                  width: 0,
                  height: 0,
                }}
              >
                {(() => {
                  const e = appleOut((f - cf) / (0.7 * fps));
                  const r = lerp(10, 150, e);
                  return (
                    <div style={{ position: "absolute", left: -r, top: -r, width: r * 2, height: r * 2, borderRadius: r, border: `${lerp(6, 2, e)}px solid ${C.accent}`, opacity: 1 - e, boxShadow: `0 0 24px ${C.accentGlow}` }} />
                  );
                })()}
              </div>
            )}
            {cf !== null && f > cf - 0.5 * fps && (
              <div
                style={{
                  position: "absolute",
                  left: size * 0.55 + lerp(160, 0, easeInOut((f - (cf - 0.5 * fps)) / (0.4 * fps))),
                  top: size * 0.55 + lerp(140, 0, easeInOut((f - (cf - 0.5 * fps)) / (0.4 * fps))),
                  transform: `scale(${press})`,
                }}
              >
                <Cursor />
              </div>
            )}
          </div>
        );
      })}
      {sc.say !== false && <SpeechText ctx={ctx} size={sc.size ?? 96} y={sc.text_y ?? 0.8} dark={sc.dark} />}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- qr: призыв
const QrScene: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = ctx.scene;
  const p = pop(f, fps, 0);
  const cw = 340;
  const cy = sc.cy ?? 0.42;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 960 - cw / 2, top: cy * 1080 - cw * 0.55, width: cw, transform: `scale(${p})` }}>
        <div style={{ position: "absolute", left: cw / 2 - 36, top: -40, width: 72, height: 72, borderRadius: 36, background: "#fff", boxShadow: SHADOW, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
          {sc.badge ? (
            <Pic src={sc.badge} style={{ width: 44, height: 44 }} />
          ) : (
            <svg width="34" height="34" viewBox="0 0 24 24">
              <path d="M7 4 L20 12 L7 20 Z" fill="#111" />
            </svg>
          )}
        </div>
        <div style={{ background: "#fff", borderRadius: 40, boxShadow: SHADOW, padding: "44px 34px 22px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Pic src={sc.src} style={{ width: cw - 68, height: cw - 68 }} />
          {sc.handle && (
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 24, marginTop: 12, color: C.purple, letterSpacing: "0.02em" }}>{sc.handle}</div>
          )}
        </div>
      </div>
      {sc.note ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: cy * 1080 + cw * 0.62,
            textAlign: "center",
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: 56,
            letterSpacing: "-0.03em",
            background: "linear-gradient(90deg, #3B2BD8, #A02BD8)",
            WebkitBackgroundClip: "text",
            color: "transparent",
            opacity: clamp(p),
          }}
        >
          {sc.note}
        </div>
      ) : (
        <SpeechText ctx={ctx} size={sc.size ?? 70} y={cy + (cw * 0.72) / 1080} />
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- stat: виджет статистики
const fmt = (n: number, dec: number) =>
  n.toLocaleString("ru-RU", { minimumFractionDigits: dec, maximumFractionDigits: dec }).replace(/ /g, ".");

const StatScene: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = ctx.scene;
  const steps: any[] = [{ at: ctx.t0, value: sc.value ?? 0, active: sc.active ?? 0 }, ...(sc.steps ?? [])];
  const t = ctx.t0 + f / fps;
  let i = 0;
  steps.forEach((s, k) => {
    if (s.at <= t) i = k;
  });
  const prev = i > 0 ? steps[i - 1].value : sc.from ?? steps[0].value;
  const k = appleOut((t - steps[i].at) / 0.6);
  const val = lerp(prev, steps[i].value, k);
  const active = steps[i].active ?? 0;
  const pills: string[] = sc.pills ?? [];
  const p = pop(f, fps, 0);
  const W = 640;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: (sc.x ?? 0.5) * 1920 - W / 2,
          top: (sc.cy ?? 0.5) * 1080 - 150,
          width: W,
          background: "#fff",
          borderRadius: 30,
          boxShadow: SHADOW,
          padding: "30px 36px",
          fontFamily: FONT,
          transform: `scale(${p})`,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <div style={{ fontWeight: 700, fontSize: 36, letterSpacing: "-0.03em" }}>{sc.title ?? "Просмотры"}</div>
          <div style={{ flex: 1 }} />
          <div style={{ fontWeight: 500, fontSize: 22, color: C.gray }}>{sc.right ?? "Статистика ›"}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", marginTop: 8, fontWeight: 700, fontSize: 64, letterSpacing: "-0.04em" }}>
          {sc.icon && <span style={{ fontSize: 40, marginRight: 12, color: "#333" }}>{sc.icon}</span>}
          {sc.prefix ?? ""}
          {fmt(val, sc.decimals ?? 0)}
          {sc.suffix ?? ""}
        </div>
        {pills.length > 0 && (
          <div style={{ display: "flex", gap: 14, marginTop: 22 }}>
            {pills.map((pl, j) => (
              <div
                key={j}
                style={{
                  padding: "10px 26px",
                  borderRadius: 40,
                  fontSize: 28,
                  fontWeight: 500,
                  background: j === active ? "#4BDA5E" : "#EFEFEF",
                  color: j === active ? "#0B3D12" : "#333",
                  boxShadow: j === active ? "0 0 24px rgba(75,218,94,0.6)" : "none",
                }}
              >
                {pl}
              </div>
            ))}
          </div>
        )}
      </div>
      {sc.say && <SpeechText ctx={ctx} size={sc.size ?? 96} y={sc.text_y ?? 0.82} />}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- chart: график удержания
const ChartScene: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = ctx.scene;
  const pts: number[] = sc.points ?? [0.9, 0.55, 0.6, 0.52, 0.56, 0.5, 0.53, 0.49, 0.52, 0.47];
  const a = ((sc.draw_at ?? ctx.t0) - ctx.t0) * fps;
  const b = ((sc.draw_to ?? ctx.t1) - ctx.t0) * fps;
  const prog = clamp((f - a) / Math.max(1, b - a));
  const W = 1100;
  const H = 300;
  const n = Math.max(2, Math.ceil(prog * (pts.length - 1)) + 1);
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * W);
  let d = "";
  for (let i = 0; i < n && i < pts.length; i++) {
    let x = xs[i];
    let y = (1 - pts[i]) * H;
    if (i === n - 1 && i > 0) {
      const seg = prog * (pts.length - 1) - (i - 1);
      x = lerp(xs[i - 1], xs[i], clamp(seg));
      y = lerp((1 - pts[i - 1]) * H, (1 - pts[i]) * H, clamp(seg));
    }
    d += `${i ? "L" : "M"}${x},${y} `;
  }
  const p = pop(f, fps, 0);
  const q = sc.question ? 1 - clamp((f - a) / (0.3 * fps)) : 0;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 960 - W / 2 - 40,
          top: (sc.cy ?? 0.5) * 1080 - 230,
          width: W + 80,
          background: "#fff",
          border: "3px solid #222",
          borderRadius: 30,
          boxShadow: SHADOW,
          padding: "22px 40px 40px",
          fontFamily: FONT,
          transform: `scale(${p})`,
        }}
      >
        <div style={{ display: "flex", gap: 40, fontSize: 30, fontWeight: 700, borderBottom: "2px solid #ddd", paddingBottom: 12 }}>
          <div>
            {sc.m1 ?? "10:42"}
            <div style={{ fontSize: 16, fontWeight: 500, color: C.gray }}>{sc.m1_label ?? "Средняя продолжительность просмотра"}</div>
          </div>
          <div style={{ borderLeft: "2px solid #ddd", paddingLeft: 30 }}>
            {sc.m2 ?? "47,7 %"}
            <div style={{ fontSize: 16, fontWeight: 500, color: C.gray }}>{sc.m2_label ?? "Средний процент просмотра"}</div>
          </div>
        </div>
        <svg width={W} height={H + 20} style={{ marginTop: 24, overflow: "visible" }}>
          <line x1={0} y1={0} x2={0} y2={H} stroke="#222" strokeWidth={3} />
          <line x1={0} y1={H} x2={W} y2={H} stroke="#222" strokeWidth={3} />
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1={0} y1={H * g} x2={W} y2={H * g} stroke="#e4e4e4" strokeWidth={2} />
          ))}
          {prog > 0 && <path d={d} fill="none" stroke="#E0312F" strokeWidth={4} strokeLinejoin="round" />}
        </svg>
        {q > 0 && (
          <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center", fontWeight: 700, fontSize: 200, color: `rgba(20,20,20,${q})` }}>?</div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- counter: крупное число с пересчётом («90%»)
const CounterScene: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = ctx.scene;
  const a = ((sc.count_at ?? ctx.t0) - ctx.t0) * fps;
  const e = appleOut((f - a) / ((sc.count_dur ?? 0.6) * fps));
  const val = lerp(sc.from ?? 0, sc.value ?? 0, e);
  const p = appleOut((f - a) / (10 * (fps / 30)));
  const size = sc.size ?? 300;
  const cy = sc.y ?? (sc.sub ? 0.42 : 0.5);
  const sub = sc.sub ? [linesPhrase([sc.sub], ctx.words, ctx.t0, fps, ctx.accent)] : [];
  return (
    <AbsoluteFill>
      {f >= a && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: cy * 1080,
            transform: `translateY(-50%) scale(${lerp(1.08, 1, p)})`,
            filter: p < 0.999 ? `blur(${(1 - p) * 20}px)` : undefined,
            opacity: clamp(p * 1.6),
            textAlign: "center",
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: size,
            lineHeight: 1,
            letterSpacing: TRACK,
            fontVariantNumeric: "tabular-nums",
            color: sc.accent === false ? C.ink : C.accent,
            textShadow: sc.accent === false ? undefined : `0 0 24px ${C.accentGlow}, 0 0 80px ${C.accentGlow}`,
          }}
        >
          {sc.prefix ?? ""}
          {fmt(val, sc.decimals ?? 0)}
          {sc.suffix ?? ""}
        </div>
      )}
      {sub.length > 0 && <KText phrases={sub} size={sc.sub_size ?? 96} y={cy + (size * 0.5 + 90) / 1080} />}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- chat: окно чата, ввод печатается, ответ серыми строками
const ChatScene: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = ctx.scene;
  const t = ctx.t0 + f / fps;
  const W = sc.w ?? 1240;
  const H = sc.h ?? 700;
  const x = 960 - W / 2;
  const y = (sc.cy ?? 0.5) * 1080 - H / 2;
  const p = pop(f, fps, 0);
  const prompt: string = sc.prompt ?? "напиши текст про…";
  const typeAt = sc.type_at ?? ctx.t0 + 0.15;
  const sendAt = sc.send_at ?? typeAt + 1;
  const replyAt = sc.reply_at ?? sendAt + 0.4;
  const typed = clamp((t - typeAt) / Math.max(0.2, (sendAt - typeAt) * 0.9));
  const sent = t >= sendAt;
  const shown = sent ? "" : Array.from(prompt).slice(0, Math.round(typed * Array.from(prompt).length)).join("");
  const caret = !sent && Math.floor(f / (8 * (fps / 30))) % 2 === 0;
  const bub = appleOut((t - sendAt) / 0.35);
  const bars: number[] = sc.bars ?? [0.94, 0.88, 0.97, 0.9, 0.58];
  const IW = W - 120;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: W,
          height: H,
          borderRadius: 30,
          background: "#fff",
          border: "1.5px solid #E7E7E7",
          boxShadow: SHADOW,
          overflow: "hidden",
          fontFamily: FONT,
          transform: `scale(${lerp(0.94, 1, clamp(p))})`,
          opacity: clamp(p * 1.5),
        }}
      >
        <div style={{ height: 70, borderBottom: "1.5px solid #EFEFEF", display: "flex", alignItems: "center", padding: "0 28px", gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 18, height: 18, borderRadius: 9, background: "#E3E3E3" }} />
          ))}
          <div style={{ flex: 1, textAlign: "center", fontSize: 26, fontWeight: 600, color: C.gray, letterSpacing: "-0.02em", marginRight: 80 }}>
            {sc.title ?? "Новый чат"}
          </div>
        </div>
        {sent && (
          <div
            style={{
              position: "absolute",
              right: 60,
              top: 110,
              padding: "22px 34px",
              borderRadius: 30,
              background: "#F1F1F1",
              fontSize: 44,
              fontWeight: 500,
              letterSpacing: "-0.03em",
              color: C.ink,
              opacity: bub,
              transform: `translateY(${(1 - bub) * 40}px) scale(${lerp(0.9, 1, bub)})`,
              transformOrigin: "100% 100%",
            }}
          >
            {prompt}
          </div>
        )}
        {t >= replyAt && (
          <div style={{ position: "absolute", left: 60, top: 230, width: IW }}>
            {bars.map((b, i) => {
              const e = appleOut((t - replyAt - i * 0.1) / 0.45);
              return <div key={i} style={{ height: 30, borderRadius: 15, background: "#ECECEC", marginBottom: 22, width: IW * b * e, opacity: clamp(e * 2) }} />;
            })}
          </div>
        )}
        <div
          style={{
            position: "absolute",
            left: 40,
            right: 40,
            bottom: 36,
            height: 92,
            borderRadius: 46,
            background: "#F5F5F5",
            border: "1.5px solid #E9E9E9",
            display: "flex",
            alignItems: "center",
            padding: "0 16px 0 40px",
            fontSize: 44,
            fontWeight: 500,
            letterSpacing: "-0.03em",
          }}
        >
          <div style={{ flex: 1, color: shown ? C.ink : "#B5B5B5", whiteSpace: "pre" }}>
            {shown || (sent ? "Ответить…" : "")}
            {caret && <span style={{ display: "inline-block", width: 3, height: 42, background: C.ink, marginLeft: 3, verticalAlign: "middle" }} />}
          </div>
          <div style={{ width: 62, height: 62, borderRadius: 31, background: typed > 0 && !sent ? C.ink : "#D6D6D6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="30" height="30" viewBox="0 0 24 24">
              <path d="M12 19 V5 M5 12 L12 5 L19 12" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- tilt: наклонные вертикальные карточки
const TiltScene: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sc = ctx.scene;
  const media: Media[] = (sc.media ?? []).map(toMedia);
  const h = 780;
  const w = h * (9 / 16);
  const xs = media.length === 1 ? [0.5] : [0.36, 0.64];
  return (
    <AbsoluteFill style={{ perspective: 1600 }}>
      {media.slice(0, 2).map((m, i) => {
        const at = m.at ?? ctx.t0 + i * 0.3;
        const lf = (at - ctx.t0) * fps;
        if (f < lf) return null;
        const p = pop(f, fps, lf);
        const ang = media.length === 1 ? 0 : i === 0 ? 22 : -22;
        const float = Math.sin((f + i * 20) / 25) * 6;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: xs[i] * 1920 - w / 2,
              top: 540 - h / 2 + float,
              width: w,
              height: h,
              borderRadius: 34,
              overflow: "hidden",
              transform: `rotateY(${ang}deg) scale(${lerp(0.8, 1, clamp(p))})`,
              opacity: clamp(p * 2),
              boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
            }}
          >
            <MediaTrack media={[{ ...m, at: ctx.t0 + Math.max(0, at - ctx.t0) }]} t0={ctx.t0} t1={ctx.t1} />
          </div>
        );
      })}
      {sc.say && <SpeechText ctx={ctx} size={sc.size ?? 110} y={sc.y ?? 0.5} dark />}
    </AbsoluteFill>
  );
};

export const KINDS: Record<string, React.FC<{ ctx: Ctx }>> = {
  text: TextScene,
  card: CardScene,
  full: FullScene,
  act: ActScene,
  wall: WallScene,
  grid: GridScene,
  objects: ObjectsScene,
  qr: QrScene,
  stat: StatScene,
  chart: ChartScene,
  tilt: TiltScene,
  counter: CounterScene,
  chat: ChatScene,
};

// Тёмный фон по умолчанию у этих видов — только там, где весь кадр занят видео.
// Текстовые сцены (text, act, objects, qr, stat, chart, counter, chat) всегда светлые: правило пользователя, см. Main.tsx
export const DARK_KINDS = new Set(["wall", "tilt", "full", "grid"]);
