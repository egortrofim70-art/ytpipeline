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
        durationInFrames={680}
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

// Timings copied verbatim from the Mike-voice RU order's subtitles.srt (audio-relative seconds).
const CAPTION_CUES: CaptionCue[] = [
  {fromSec: 0.0, toSec: 2.56, text: "Представь: однажды ночью ты просто"},
  {fromSec: 2.6, toSec: 3.88, text: "перестаёшь засыпать."},
  {fromSec: 4.08, toSec: 6.76, text: "Не бессонница на одну ночь — навсегда."},
  {fromSec: 6.96, toSec: 9.36, text: "Проходят дни, а тело ни на секунду не"},
  {fromSec: 9.44, toSec: 10.32, text: "отдыхает."},
  {fromSec: 10.4, toSec: 12.96, text: "Это реальный диагноз: фатальная семейная"},
  {fromSec: 13.04, toSec: 13.96, text: "бессонница."},
  {fromSec: 14.16, toSec: 15.92, text: "Сегодня расскажу, что происходит с"},
  {fromSec: 15.96, toSec: 18.56, text: "мозгом, когда сон исчезает навсегда."},
];

const AUDIO_START_FRAME = 90; // 3s silent hook before the voice begins

export const SleepDemo30s: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* 0-3s: hook, no audio yet */}
      <Sequence from={0} durationInFrames={90}>
        <HookText />
      </Sequence>

      <Sequence from={AUDIO_START_FRAME} durationInFrames={557}>
        <Audio src={staticFile("voice_ru_mike.mp3")} />
      </Sequence>

      {/* 3s-6.9s: tucked in bed, tired (audio 0-3.88s) — wide establishing shot */}
      <Sequence from={90} durationInFrames={116}>
        <SceneFade duration={116}>
          <CameraCloser x={560} y={720} zoom={1.6}>
            <Bedroom>
              <Character x={560} y={760} scale={1.3} expression="tired" bobbing />
              {/* blanket tucked up to the chin so the "lying in bed" read doesn't need a broken body rotation */}
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
              <HoursCounter startHour={0} endHour={1} />
            </Bedroom>
          </CameraCloser>
        </SceneFade>
      </Sequence>

      {/* 6.9s-13.3s: sits up, scared — camera pushes in closer, hands up near face,
          bedside lamp flicks on partway through for a visible "something changed" beat */}
      <Sequence from={206} durationInFrames={194}>
        <SceneFade duration={194}>
          <CameraCloser x={620} y={700} zoom={1.55}>
            <Bedroom>
              <Character x={620} y={740} scale={1.3} expression="scared" armRaise={0.6} faceTilt={-4} stillness />
              <NightstandLamp onFrame={40} />
              <HoursCounter startHour={1} endHour={4} />
            </Bedroom>
          </CameraCloser>
        </SceneFade>
      </Sequence>

      {/* 13.3s-17s: standing, shocked, counter accelerates — tightest, off-center shot */}
      <Sequence from={400} durationInFrames={109}>
        <SceneFade duration={109}>
          <CameraCloser x={480} y={680} zoom={1.85}>
            <Bedroom>
              <Character x={480} y={720} scale={1.3} expression="shocked" armRaise={1} faceTilt={5} stillness />
              <NightstandLamp onFrame={0} />
              <HoursCounter startHour={4} endHour={72} />
            </Bedroom>
          </CameraCloser>
        </SceneFade>
      </Sequence>

      {/* 17s onward: fact card (audio 13.96s onward) */}
      <Sequence from={509} durationInFrames={168}>
        <SceneFade duration={168} zoomTo={1.1}>
          <FactCard />
        </SceneFade>
      </Sequence>

      {/* captions run on top of everything, synced to the real audio timings */}
      <SyncedCaptions cues={CAPTION_CUES} offsetFrames={AUDIO_START_FRAME} />
    </AbsoluteFill>
  );
};
