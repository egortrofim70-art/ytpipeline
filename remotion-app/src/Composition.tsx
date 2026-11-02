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
        durationInFrames={760}
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
    {/* bed */}
    <div
      style={{
        position: "absolute",
        bottom: 160,
        left: 260,
        width: 560,
        height: 180,
        background: "#2a3360",
        borderRadius: 16,
      }}
    />
    <div
      style={{
        position: "absolute",
        bottom: 300,
        left: 300,
        width: 160,
        height: 70,
        background: "#dfe4f5",
        borderRadius: 12,
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

// Timings copied verbatim from the v4 TTS order's subtitles.srt (audio-relative seconds).
const CAPTION_CUES: CaptionCue[] = [
  {fromSec: 0.0, toSec: 3.44, text: "Imagina que una noche, simplemente, dejas"},
  {fromSec: 3.48, toSec: 4.6, text: "de poder dormir."},
  {fromSec: 4.88, toSec: 6.48, text: "No es insomnio normal."},
  {fromSec: 6.72, toSec: 8.16, text: "Es algo que no se va."},
  {fromSec: 8.64, toSec: 11.04, text: "Pasan los días, y tu cuerpo nunca"},
  {fromSec: 11.12, toSec: 11.76, text: "descansa."},
  {fromSec: 12.32, toSec: 15.52, text: "Esto es real: se llama insomnio familiar"},
  {fromSec: 15.6, toSec: 18.32, text: "fatal, y hoy te voy a contar qué le pasa"},
  {fromSec: 18.4, toSec: 20.56, text: "a tu cerebro cuando el sueño desaparece"},
  {fromSec: 20.64, toSec: 21.68, text: "para siempre."},
];

const AUDIO_START_FRAME = 90; // 3s silent hook before the voice begins

export const SleepDemo30s: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* 0-3s: hook, no audio yet */}
      <Sequence from={0} durationInFrames={90}>
        <HookText />
      </Sequence>

      <Sequence from={AUDIO_START_FRAME} durationInFrames={649}>
        <Audio src={staticFile("voice_demo_v4.mp3")} />
      </Sequence>

      {/* 3s-10.6s: tucked in bed, tired (audio 0-4.6s) */}
      <Sequence from={90} durationInFrames={138}>
        <SceneFade duration={138}>
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
        </SceneFade>
      </Sequence>

      {/* 10.6s-21.2s: sits up, scared (audio 4.6-8.16s) */}
      <Sequence from={228} durationInFrames={107}>
        <SceneFade duration={107}>
          <Bedroom>
            <Character x={560} y={760} scale={1.3} expression="scared" bobbing />
            <HoursCounter startHour={1} endHour={4} />
          </Bedroom>
        </SceneFade>
      </Sequence>

      {/* 21.2s-25.3s: standing, shocked, counter accelerates (audio 8.16-12.32s) */}
      <Sequence from={335} durationInFrames={125}>
        <SceneFade duration={125}>
          <Bedroom>
            <Character x={560} y={760} scale={1.3} expression="shocked" bobbing />
            <HoursCounter startHour={4} endHour={72} />
          </Bedroom>
        </SceneFade>
      </Sequence>

      {/* 25.3s onward: fact card (audio 12.32s onward) */}
      <Sequence from={460} durationInFrames={300}>
        <SceneFade duration={300} zoomTo={1.1}>
          <FactCard />
        </SceneFade>
      </Sequence>

      {/* captions run on top of everything, synced to the real audio timings */}
      <SyncedCaptions cues={CAPTION_CUES} offsetFrames={AUDIO_START_FRAME} />
    </AbsoluteFill>
  );
};
