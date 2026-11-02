import {
  AbsoluteFill,
  Composition,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
  staticFile,
} from "remotion";
import { Audio } from "@remotion/media";
import { Character, type Expression } from "./Character";

export const MyComposition = () => {
  return (
    <>
      <Composition
        id="CharacterTest"
        component={CharacterTest}
        durationInFrames={360}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="CharacterDemo"
        component={CharacterDemo}
        durationInFrames={330}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="SleepDemo30s"
        component={SleepDemo30s}
        durationInFrames={1000}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

const EXPR_SEQUENCE: {expr: Expression; label: string}[] = [
  {expr: "neutral", label: "neutral"},
  {expr: "happy", label: "happy"},
  {expr: "scared", label: "scared"},
  {expr: "shocked", label: "shocked"},
  {expr: "tired", label: "tired"},
  {expr: "angry", label: "angry"},
];

export const CharacterTest: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: "#0b0e1a"}}>
      {EXPR_SEQUENCE.map((item, i) => (
        <Sequence key={item.expr} from={i * 60} durationInFrames={60}>
          <AbsoluteFill>
            <div
              style={{
                position: "absolute",
                top: 60,
                left: 0,
                right: 0,
                textAlign: "center",
                color: "#ffffff",
                fontFamily: "sans-serif",
                fontSize: 40,
              }}
            >
              {item.label}
            </div>
            <Character
              x={960}
              y={700}
              scale={1.6}
              expression={item.expr}
              walking={item.expr === "neutral"}
              bobbing
            />
          </AbsoluteFill>
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const DEMO_LABEL_STYLE: React.CSSProperties = {
  position: "absolute",
  top: 60,
  left: 0,
  right: 0,
  textAlign: "center",
  color: "#ffffff",
  fontFamily: "sans-serif",
  fontSize: 40,
};

export const CharacterDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: "#0b0e1a"}}>
      <Sequence from={0} durationInFrames={60}>
        <AbsoluteFill>
          <div style={DEMO_LABEL_STYLE}>de pie</div>
          <Character x={960} y={700} scale={1.8} expression="neutral" bobbing />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={60} durationInFrames={60}>
        <AbsoluteFill>
          <div style={DEMO_LABEL_STYLE}>caminando</div>
          <Character x={960} y={700} scale={1.8} expression="neutral" walking bobbing />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={120} durationInFrames={60}>
        <AbsoluteFill>
          <div style={DEMO_LABEL_STYLE}>corriendo</div>
          <Character x={960} y={700} scale={1.8} expression="shocked" running bobbing={false} />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={180} durationInFrames={60}>
        <AbsoluteFill>
          <div style={DEMO_LABEL_STYLE}>señalando</div>
          <Character x={960} y={700} scale={1.8} expression="smug" armRaise={1} bobbing />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={240} durationInFrames={45}>
        <AbsoluteFill>
          <div style={DEMO_LABEL_STYLE}>asustado</div>
          <Character x={960} y={700} scale={1.8} expression="scared" bobbing />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={285} durationInFrames={45}>
        <AbsoluteFill>
          <div style={DEMO_LABEL_STYLE}>feliz</div>
          <Character x={960} y={700} scale={1.8} expression="happy" bobbing />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

// ---- SleepDemo30s: 30s sample scene for the fatal familial insomnia video ----

const HookText: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const opacity = interpolate(frame, [0, 0.4 * fps, 2.4 * fps, 3 * fps], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const scale = interpolate(frame, [0, 0.4 * fps], [0.9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    output: "perceptual-scale",
  });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#05060a",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          opacity,
          scale,
          color: "#ffffff",
          fontFamily: "sans-serif",
          fontWeight: 900,
          fontSize: 86,
          textAlign: "center",
          maxWidth: 1400,
          lineHeight: 1.15,
        }}
      >
        А ЧТО ЕСЛИ ТЫ<br />
        <span style={{color: "#FFD400"}}>БОЛЬШЕ НЕ СМОЖЕШЬ СПАТЬ?</span>
      </div>
    </AbsoluteFill>
  );
};

type CaptionCue = {fromSec: number; toSec: number; text: string};

const SyncedCaptions: React.FC<{cues: CaptionCue[]; offsetFrames: number}> = ({
  cues,
  offsetFrames,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const relFrame = frame - offsetFrames;
  const cue = cues.find(
    (c) => relFrame >= c.fromSec * fps && relFrame < c.toSec * fps
  );
  if (!cue) return null;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 140,
        left: 0,
        right: 0,
        textAlign: "center",
      }}
    >
      <span
        style={{
          color: "#ffffff",
          fontFamily: "sans-serif",
          fontWeight: 800,
          fontSize: 48,
          background: "rgba(0,0,0,0.55)",
          padding: "10px 28px",
          borderRadius: 14,
        }}
      >
        {cue.text}
      </span>
    </div>
  );
};

const HoursCounter: React.FC<{startHour: number; endHour: number}> = ({
  startHour,
  endHour,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const hours = interpolate(frame, [0, durationInFrames], [startHour, endHour], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        top: 50,
        right: 60,
        background: "rgba(10,10,20,0.6)",
        border: "2px solid #FFD400",
        borderRadius: 14,
        padding: "14px 24px",
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{fontSize: 22, opacity: 0.75, letterSpacing: 1}}>ЧАСОВ БЕЗ СНА</div>
      <div style={{fontSize: 44, fontWeight: 900, color: "#FFD400"}}>
        {hours.toFixed(1)}
      </div>
    </div>
  );
};

// Crossfades a scene in/out and adds a slow Ken-Burns drift, so cuts between
// Sequences read as edited shots instead of a slideshow snapping between
// frames. `duration` must be passed explicitly: useVideoConfig() returns the
// ROOT composition's duration, not the enclosing Sequence's.
const SceneFade: React.FC<{children: React.ReactNode; duration: number; zoomFrom?: number; zoomTo?: number}> = ({
  children,
  duration,
  zoomFrom = 1,
  zoomTo = 1.06,
}) => {
  const frame = useCurrentFrame();
  const fadeFrames = Math.min(10, Math.floor(duration / 4));
  const opacity = interpolate(
    frame,
    [0, fadeFrames, duration - fadeFrames, duration],
    [0, 1, 1, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"}
  );
  const scale = interpolate(frame, [0, duration], [zoomFrom, zoomTo], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    output: "perceptual-scale",
  });
  return (
    <AbsoluteFill style={{opacity, scale}}>
      {children}
    </AbsoluteFill>
  );
};

// Simulates a closer camera shot: scales the whole scene up around a fixed
// point instead of a plain "zoom the character bigger", so the framing
// actually feels like different cuts/angles between scenes.
const FRAME_W = 1920;
const FRAME_H = 1080;

const CameraCloser: React.FC<{x: number; y: number; zoom: number; children: React.ReactNode}> = ({
  x,
  y,
  zoom,
  children,
}) => (
  // scale() around transformOrigin pins (x,y) at its OWN screen coordinate -
  // it does not recenter it. The translate() afterward (applied in the
  // already-scaled space, i.e. second) carries that pinned point from (x,y)
  // to the actual frame centre, so the focus subject ends up centred
  // instead of stuck wherever it happened to be laid out in the scene.
  <div
    style={{
      position: "absolute",
      inset: 0,
      transform: `translate(${FRAME_W / 2 - x}px, ${FRAME_H / 2 - y}px) scale(${zoom})`,
      transformOrigin: `${x}px ${y}px`,
    }}
  >
    {children}
  </div>
);

const Bedroom: React.FC<{children?: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{backgroundColor: "#1c2440"}}>
    {/* soft spotlight behind the character so a dark silhouette still pops */}
    <div
      style={{
        position: "absolute",
        left: 560 - 420,
        top: 760 - 420,
        width: 840,
        height: 840,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(120,140,200,0.35) 0%, rgba(120,140,200,0.12) 45%, rgba(120,140,200,0) 72%)",
      }}
    />
    {/* window with moon */}
    <div
      style={{
        position: "absolute",
        top: 90,
        right: 180,
        width: 260,
        height: 320,
        background: "#0b1030",
        border: "10px solid #23294a",
        borderRadius: 6,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 50,
          left: 60,
          width: 90,
          height: 90,
          borderRadius: "50%",
          background: "#fff6d9",
          boxShadow: "0 0 50px 10px rgba(255,246,217,0.4)",
        }}
      />
    </div>
    {/* bed: headboard + frame + mattress-top highlight, so the shape reads
        clearly as a bed instead of an ambiguous colored block */}
    <div
      style={{
        position: "absolute",
        bottom: 160,
        left: 230,
        width: 40,
        height: 260,
        background: "#1a2147",
        borderRadius: "10px 10px 0 0",
      }}
    />
    <div
      style={{
        position: "absolute",
        bottom: 160,
        left: 260,
        width: 560,
        height: 180,
        background: "#232c55",
        borderRadius: 16,
      }}
    />
    <div
      style={{
        position: "absolute",
        bottom: 220,
        left: 268,
        width: 544,
        height: 40,
        background: "#30397a",
        borderRadius: 10,
      }}
    />
    {/* bed legs for grounding */}
    <div style={{position: "absolute", bottom: 120, left: 280, width: 14, height: 40, background: "#141a35", borderRadius: 3}} />
    <div style={{position: "absolute", bottom: 120, left: 780, width: 14, height: 40, background: "#141a35", borderRadius: 3}} />
    <div
      style={{
        position: "absolute",
        bottom: 300,
        left: 300,
        width: 160,
        height: 70,
        background: "#dfe4f5",
        borderRadius: 12,
        boxShadow: "0 6px 14px rgba(0,0,0,0.3)",
      }}
    />
    {/* nightstand + clock */}
    <div
      style={{
        position: "absolute",
        bottom: 160,
        left: 860,
        width: 110,
        height: 100,
        background: "#23294a",
        borderRadius: 8,
      }}
    />
    {children}
  </AbsoluteFill>
);

// A bedside lamp that flicks on partway through a scene - a concrete, visible
// event ("something changed") instead of the same static room across cuts.
const NightstandLamp: React.FC<{onFrame: number}> = ({onFrame}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [onFrame, onFrame + 1, onFrame + 4, onFrame + 10], [0, 1, 0.7, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <>
      <div
        style={{
          position: "absolute",
          bottom: 260,
          left: 895,
          width: 8,
          height: 50,
          background: "#3a3f5c",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 300,
          left: 865,
          width: 70,
          height: 50,
          borderRadius: "30px 30px 10px 10px",
          background: `rgba(255,214,140,${0.25 + t * 0.6})`,
          boxShadow: t > 0 ? `0 0 ${40 * t}px ${18 * t}px rgba(255,200,120,${0.5 * t})` : "none",
        }}
      />
    </>
  );
};

const FactCard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const scale = interpolate(frame, [0, 0.3 * fps], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    output: "perceptual-scale",
  });
  const opacity = interpolate(frame, [0, 0.3 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#05060a",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{opacity, scale, textAlign: "center"}}>
        <div
          style={{
            display: "inline-block",
            border: "2px solid #FFD400",
            borderRadius: 999,
            padding: "8px 24px",
            color: "#FFD400",
            fontFamily: "sans-serif",
            fontWeight: 700,
            fontSize: 24,
            marginBottom: 24,
          }}
        >
          РЕАЛЬНЫЙ ДИАГНОЗ
        </div>
        <div
          style={{
            color: "#ffffff",
            fontFamily: "sans-serif",
            fontWeight: 900,
            fontSize: 64,
          }}
        >
          ФАТАЛЬНАЯ СЕМЕЙНАЯ БЕССОННИЦА
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Timings copied verbatim from the extended "night 1 montage" order's subtitles.srt (audio-relative seconds).
const CAPTION_CUES: CaptionCue[] = [
  {fromSec: 0.0, toSec: 2.64, text: "Представь: однажды ночью ты просто"},
  {fromSec: 2.72, toSec: 4.12, text: "перестаёшь засыпать."},
  {fromSec: 4.4, toSec: 5.4, text: "Ночь первая."},
  {fromSec: 5.6, toSec: 8.0, text: "Ты листаешь телефон, просто ждёшь, когда"},
  {fromSec: 8.08, toSec: 8.72, text: "придёт сон."},
  {fromSec: 9.12, toSec: 9.76, text: "Час."},
  {fromSec: 9.92, toSec: 10.88, text: "Потом ещё один."},
  {fromSec: 11.2, toSec: 13.36, text: "Ты ворочаешься с боку на бок, пытаешься"},
  {fromSec: 13.4, toSec: 14.56, text: "устроиться удобнее."},
  {fromSec: 14.72, toSec: 17.08, text: "Хватаешь подушку, накрываешь голову —"},
  {fromSec: 17.12, toSec: 18.52, text: "лишь бы не видеть время."},
  {fromSec: 18.72, toSec: 19.92, text: "Но сон не идёт."},
  {fromSec: 20.08, toSec: 20.84, text: "Совсем."},
  {fromSec: 21.04, toSec: 23.68, text: "Это реальный диагноз: фатальная семейная"},
  {fromSec: 23.76, toSec: 24.68, text: "бессонница."},
  {fromSec: 24.88, toSec: 26.68, text: "Сегодня расскажу, что происходит с"},
  {fromSec: 26.72, toSec: 29.36, text: "мозгом, когда сон исчезает навсегда."},
];

const AUDIO_START_FRAME = 90; // 3s silent hook before the voice begins

const Blanket: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 300,
      top: 790,
      width: 480,
      height: 290,
      background: "#33407a",
      borderRadius: "40px 40px 16px 16px",
      boxShadow: "0 -4px 14px rgba(0,0,0,0.25) inset",
    }}
  />
);

const NightBadge: React.FC<{n: number; atFrame: number}> = ({n, atFrame}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [atFrame, atFrame + 10, atFrame + 55, atFrame + 65], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        left: 60,
        opacity,
        color: "#ffffff",
        fontFamily: "sans-serif",
        fontWeight: 900,
        fontSize: 40,
        letterSpacing: 2,
        textTransform: "uppercase",
      }}
    >
      Ночь {n}
    </div>
  );
};

// Pillow pulled up over the face partway through the scene - starts from the
// bed's own pillow (Bedroom: bottom 300 left 300 w160 h70, screen-space
// origin ~300,710) and actually ends up overlapping the character's face,
// instead of materializing out of nowhere and landing above the head.
const PillowCover: React.FC<{startFrame: number; headX: number; headY: number}> = ({startFrame, headX, headY}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [startFrame, startFrame + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.3, 0, 0.2, 1),
  });
  const left = interpolate(t, [0, 1], [300, headX - 95]);
  const top = interpolate(t, [0, 1], [710, headY - 55]);
  const width = interpolate(t, [0, 1], [160, 190]);
  const height = interpolate(t, [0, 1], [70, 150]);
  const rot = interpolate(t, [0, 1], [0, -8]);
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        background: "#eef1fb",
        borderRadius: 24,
        boxShadow: "0 10px 20px rgba(0,0,0,0.35)",
        transform: `rotate(${rot}deg)`,
      }}
    />
  );
};

export const SleepDemo30s: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* 0-3s: hook, no audio yet */}
      <Sequence from={0} durationInFrames={90}>
        <HookText />
      </Sequence>

      <Sequence from={AUDIO_START_FRAME} durationInFrames={881}>
        <Audio src={staticFile("voice_montage.mp3")} />
      </Sequence>

      {/* 3s-7.1s (audio 0-4.12s): tucked in bed, tired — wide establishing shot, "Ночь 1" badge appears */}
      <Sequence from={90} durationInFrames={123}>
        <SceneFade duration={123}>
          <CameraCloser x={560} y={720} zoom={1.6}>
            <Bedroom>
              <Character x={560} y={760} scale={1.3} expression="tired" bobbing />
              <Blanket />
              <NightBadge n={1} atFrame={40} />
              <HoursCounter startHour={0} endHour={0.1} />
            </Bedroom>
          </CameraCloser>
        </SceneFade>
      </Sequence>

      {/* 7.1s-11.7s (audio 4.12-8.72s): phone in hand, screen glow on face - still in bed */}
      <Sequence from={213} durationInFrames={139}>
        <SceneFade duration={139}>
          <CameraCloser x={620} y={700} zoom={1.55}>
            <Bedroom>
              <Character x={620} y={740} scale={1.3} expression="tired" armRaise={0.75} faceTilt={-6} prop="phone" stillness />
              <Blanket />
              <HoursCounter startHour={0.1} endHour={1} />
            </Bedroom>
          </CameraCloser>
        </SceneFade>
      </Sequence>

      {/* 11.7s-13.4s (audio 8.72-10.88s): quick time-passing beat, different angle, counter ticks visibly */}
      <Sequence from={352} durationInFrames={52}>
        <SceneFade duration={52}>
          <CameraCloser x={560} y={850} zoom={1.7}>
            <Bedroom>
              <Character x={560} y={760} scale={1.3} expression="tired" bobbing />
              <Blanket />
              <HoursCounter startHour={1} endHour={2} />
            </Bedroom>
          </CameraCloser>
        </SceneFade>
      </Sequence>

      {/* 13.4s-17.6s (audio 10.88-14.56s): tossing and turning side to side - toss drives its own
          rotation, no separate static faceTilt fighting it (that combo read as a seizure) */}
      <Sequence from={404} durationInFrames={123}>
        <SceneFade duration={123}>
          <CameraCloser x={560} y={720} zoom={1.65}>
            <Bedroom>
              <Character x={560} y={760} scale={1.3} expression="angry" toss />
              <Blanket />
              <HoursCounter startHour={2} endHour={3} />
            </Bedroom>
          </CameraCloser>
        </SceneFade>
      </Sequence>

      {/* 17.6s-21.6s (audio 14.56-18.52s): reaches for the bed's own pillow (not a random
          object), pulls it up and actually over the face - arm raised to sell the grab */}
      <Sequence from={527} durationInFrames={119}>
        <SceneFade duration={119}>
          <CameraCloser x={560} y={700} zoom={1.5}>
            <Bedroom>
              <Character x={560} y={760} scale={1.3} expression="tired" armRaise={0.85} faceTilt={-5} stillness />
              <Blanket />
              <PillowCover startFrame={15} headX={560} headY={718} />
              <HoursCounter startHour={3} endHour={4} />
            </Bedroom>
          </CameraCloser>
        </SceneFade>
      </Sequence>

      {/* 21.6s-22.7s (audio 18.52-19.92s): "Но сон не идёт." — still in bed, hand over face, defeated */}
      <Sequence from={646} durationInFrames={36}>
        <SceneFade duration={36}>
          <CameraCloser x={560} y={700} zoom={1.6}>
            <Bedroom>
              <Character x={560} y={740} scale={1.3} expression="tired" armRaise={0.9} faceTilt={-3} stillness />
              <Blanket />
              <HoursCounter startHour={4} endHour={4.5} />
            </Bedroom>
          </CameraCloser>
        </SceneFade>
      </Sequence>

      {/* 22.7s-23.7s (audio 19.92-20.84s): "Совсем." — sits up, out of the blanket, bridges into
          the next (standing) shot instead of freezing on the exact same frame */}
      <Sequence from={682} durationInFrames={27}>
        <SceneFade duration={27}>
          <CameraCloser x={560} y={650} zoom={1.9}>
            <Bedroom>
              <Character x={560} y={740} scale={1.3} expression="angry" faceTilt={4} stillness />
              <HoursCounter startHour={4.5} endHour={5} />
            </Bedroom>
          </CameraCloser>
        </SceneFade>
      </Sequence>

      {/* 23.7s-27.3s (audio 20.84-24.68s): diagnosis reveal — standing, shocked, lamp flicks on */}
      <Sequence from={709} durationInFrames={109}>
        <SceneFade duration={109}>
          <CameraCloser x={480} y={680} zoom={1.85}>
            <Bedroom>
              <Character x={480} y={720} scale={1.3} expression="shocked" armRaise={1} faceTilt={5} stillness />
              <NightstandLamp onFrame={0} />
              <HoursCounter startHour={5} endHour={24} />
            </Bedroom>
          </CameraCloser>
        </SceneFade>
      </Sequence>

      {/* 27.3s onward (audio 24.68s onward): fact card */}
      <Sequence from={818} durationInFrames={180}>
        <SceneFade duration={180} zoomTo={1.1}>
          <FactCard />
        </SceneFade>
      </Sequence>

      {/* captions run on top of everything, synced to the real audio timings */}
      <SyncedCaptions cues={CAPTION_CUES} offsetFrames={AUDIO_START_FRAME} />
    </AbsoluteFill>
  );
};
