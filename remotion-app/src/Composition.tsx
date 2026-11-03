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
import { Character, type Expression, type CharacterProps } from "./Character";
import insomniaBeatsData from "./insomniaBeats.json";
import painBeatsData from "./painBeats.json";
import { ThreeTest30s } from "./ThreeTest";

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
      {/* durationInFrames = 90 (lead-in) + ceil(620.88s * 30fps) + 180 (outro) ≈ 18897, padded slightly */}
      <Composition
        id="InsomniaFullES"
        component={InsomniaFullES}
        durationInFrames={18900}
        fps={30}
        width={1920}
        height={1080}
      />
      {/* durationInFrames = 90 (lead-in) + ceil(530.42s * 30fps) + 180 (outro) ≈ 16183, padded slightly */}
      <Composition
        id="PainFullES"
        component={PainFullES}
        durationInFrames={16200}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ParallaxTest30s"
        component={ParallaxTest30s}
        durationInFrames={660}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ThreeTest30s"
        component={ThreeTest30s}
        durationInFrames={660}
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

// `duration` must be passed explicitly (the enclosing Sequence's own
// durationInFrames) - useVideoConfig() returns the ROOT composition's
// duration, not the Sequence's, so interpolating against it made the
// counter barely move within any scene shorter than the whole video.
const HoursCounter: React.FC<{startHour: number; endHour: number; duration: number}> = ({
  startHour,
  endHour,
  duration,
}) => {
  const frame = useCurrentFrame();
  const hours = interpolate(frame, [0, duration], [startHour, endHour], {
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
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const FRAME_W = 1920;
const FRAME_H = 1080;

// panTo + duration turn this into an actual moving camera (drift to a second
// framing over the shot) instead of a locked-off static shot with only
// SceneFade's barely-perceptible centered Ken Burns - needed for any beat
// long enough (10s+) that a fixed frame reads as "nothing is happening",
// e.g. a 20s running shot where the character jogs in place against a
// motionless camera.
const CameraCloser: React.FC<{
  x: number;
  y: number;
  zoom: number;
  panTo?: {x: number; y: number; zoom?: number};
  duration?: number;
  children: React.ReactNode;
}> = ({x, y, zoom, panTo, duration, children}) => {
  const frame = useCurrentFrame();
  const t = panTo && duration
    ? interpolate(frame, [0, duration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.4, 0, 0.6, 1),
      })
    : 0;
  const cx = panTo ? lerp(x, panTo.x, t) : x;
  const cy = panTo ? lerp(y, panTo.y, t) : y;
  const cz = panTo ? lerp(zoom, panTo.zoom ?? zoom, t) : zoom;
  // scale() around transformOrigin pins (x,y) at its OWN screen coordinate -
  // it does not recenter it. The translate() afterward (applied in the
  // already-scaled space, i.e. second) carries that pinned point from (x,y)
  // to the actual frame centre, so the focus subject ends up centred
  // instead of stuck wherever it happened to be laid out in the scene.
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: `translate(${FRAME_W / 2 - cx}px, ${FRAME_H / 2 - cy}px) scale(${cz})`,
        transformOrigin: `${cx}px ${cy}px`,
      }}
    >
      {children}
    </div>
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
    {/* bed: headboard + frame + mattress-top highlight, so the shape reads
        clearly as a bed instead of an ambiguous colored block */}
    <div
      style={{
        position: "absolute",
        bottom: 160,
        left: 230,
        width: 40,
        height: 310,
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
        height: 230,
        background: "#232c55",
        borderRadius: 16,
      }}
    />
    <div
      style={{
        position: "absolute",
        bottom: 270,
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

// --- Components for the long-form ES documentary (InsomniaFullES) ---

// Plain dark backdrop for "direct to camera" narrator beats (hook, transition
// questions, closing CTA) - no bedroom, just the character and a soft vignette,
// so these read as distinct shot types from the bed scenes instead of reusing
// the same room for everything.
const VoidStage: React.FC<{children?: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{backgroundColor: "#0a0c16"}}>
    <div
      style={{
        position: "absolute",
        left: 960 - 500,
        top: 540 - 500,
        width: 1000,
        height: 1000,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(90,110,170,0.3) 0%, rgba(90,110,170,0.1) 45%, rgba(90,110,170,0) 72%)",
      }}
    />
    {children}
  </AbsoluteFill>
);

// Daytime park/playground - bright flat sky+grass instead of another dark
// interior, so outdoor "kid playing" beats read as a genuinely different
// place, not the same room with the lights changed.
const ParkScene: React.FC<{children?: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{backgroundColor: "#8fd0f0"}}>
    {/* sun glow */}
    <div
      style={{
        position: "absolute",
        left: 1500,
        top: 80,
        width: 220,
        height: 220,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,240,180,0.9) 0%, rgba(255,240,180,0.25) 55%, rgba(255,240,180,0) 75%)",
      }}
    />
    {/* far treeline */}
    <div style={{position: "absolute", left: 80, top: 480, width: 260, height: 260, borderRadius: "50%", background: "#4f9e5c"}} />
    <div style={{position: "absolute", left: 1480, top: 450, width: 300, height: 300, borderRadius: "50%", background: "#4a9456"}} />
    {/* ground */}
    <div style={{position: "absolute", left: 0, right: 0, bottom: 0, top: 650, backgroundColor: "#6fbf6f"}} />
    {/* slide, grounding the "parque" reading */}
    <div style={{position: "absolute", left: 1280, bottom: 90, width: 16, height: 260, background: "#d4541f", borderRadius: 6}} />
    <div style={{position: "absolute", left: 1150, bottom: 80, width: 180, height: 300, background: "#e8732f", borderRadius: "90px 90px 0 16px", transform: "rotate(18deg)", transformOrigin: "bottom right"}} />
    {children}
  </AbsoluteFill>
);

// Home kitchen - counter + stove, for the "tocó la olla hirviendo" beat.
const KitchenScene: React.FC<{children?: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{backgroundColor: "#f0ead6"}}>
    <div style={{position: "absolute", left: 0, right: 0, top: 0, height: 600, backgroundColor: "#e3dcc5"}} />
    {/* counter */}
    <div style={{position: "absolute", left: 0, right: 0, bottom: 260, height: 50, backgroundColor: "#8a6a4a"}} />
    <div style={{position: "absolute", left: 0, right: 0, bottom: 0, height: 260, backgroundColor: "#5c4530"}} />
    {/* stove top */}
    <div style={{position: "absolute", left: 680, bottom: 310, width: 320, height: 18, backgroundColor: "#2a2a2a", borderRadius: 4}} />
    {/* pot, glowing red-hot rim to sell "hirviendo" without needing steam particles */}
    <div style={{position: "absolute", left: 790, bottom: 318, width: 120, height: 90, backgroundColor: "#4a4a52", borderRadius: "10px 10px 4px 4px"}} />
    <div style={{position: "absolute", left: 790, bottom: 400, width: 120, height: 14, backgroundColor: "#ff7a3c", borderRadius: 7, boxShadow: "0 0 30px 10px rgba(255,120,50,0.5)"}} />
    {children}
  </AbsoluteFill>
);

// Bathroom mirror - for the self-inspection beats ("revisa su cuerpo frente
// al espejo"), a deliberately different framing device: the character faces
// its own reflection instead of the camera.
const MirrorScene: React.FC<{children?: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{backgroundColor: "#dce4ea"}}>
    <div style={{position: "absolute", left: 0, right: 0, bottom: 0, height: 320, backgroundColor: "#c3cdd4"}} />
    {/* mirror frame */}
    <div
      style={{
        position: "absolute",
        left: 660,
        top: 110,
        width: 600,
        height: 760,
        borderRadius: 16,
        background: "#aab8c2",
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 680,
        top: 130,
        width: 560,
        height: 720,
        borderRadius: 10,
        background: "linear-gradient(135deg, #eef5f8 0%, #d7e3e8 100%)",
      }}
    />
    {children}
  </AbsoluteFill>
);

// City sidewalk - for the adult "zapatos nuevos / vidrio roto" everyday-risk beat.
const StreetScene: React.FC<{children?: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{backgroundColor: "#cdd6e0"}}>
    <div style={{position: "absolute", left: 0, right: 0, top: 0, height: 640, backgroundColor: "#b9c4d1"}} />
    {/* building silhouettes */}
    <div style={{position: "absolute", left: 120, top: 180, width: 220, height: 460, backgroundColor: "#8f9db0"}} />
    <div style={{position: "absolute", left: 1540, top: 100, width: 260, height: 540, backgroundColor: "#8695a8"}} />
    {/* sidewalk */}
    <div style={{position: "absolute", left: 0, right: 0, bottom: 0, top: 640, backgroundColor: "#9aa3ad"}} />
    <div style={{position: "absolute", left: 0, right: 0, bottom: 300, height: 6, backgroundColor: "#848d96"}} />
    {children}
  </AbsoluteFill>
);

// Day counter, same mechanics as HoursCounter but for the multi-week time
// jumps in the documentary section (duration = the enclosing Sequence's own
// durationInFrames, never the root composition's).
const DayCounter: React.FC<{startDay: number; endDay: number; duration: number}> = ({
  startDay,
  endDay,
  duration,
}) => {
  const frame = useCurrentFrame();
  const day = interpolate(frame, [0, duration], [startDay, endDay], {
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
      <div style={{fontSize: 22, opacity: 0.75, letterSpacing: 1}}>DÍAS SIN DORMIR</div>
      <div style={{fontSize: 44, fontWeight: 900, color: "#FFD400"}}>{Math.floor(day)}</div>
    </div>
  );
};

// Flexible fact/explainer card - eyebrow label + title + optional body line,
// reused for the science/history sections instead of hand-building a unique
// layout per fact.
const InfoCard: React.FC<{eyebrow: string; title: string; body?: string}> = ({eyebrow, title, body}) => {
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
    <AbsoluteFill style={{backgroundColor: "#05060a", justifyContent: "center", alignItems: "center"}}>
      <div style={{opacity, scale, textAlign: "center", maxWidth: 1500, padding: "0 60px"}}>
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
          {eyebrow}
        </div>
        <div style={{color: "#ffffff", fontFamily: "sans-serif", fontWeight: 900, fontSize: 58, lineHeight: 1.2, whiteSpace: "pre-line"}}>
          {title}
        </div>
        {body && (
          <div style={{color: "#b8bfe0", fontFamily: "sans-serif", fontWeight: 500, fontSize: 30, marginTop: 28, lineHeight: 1.4}}>
            {body}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// Bold kinetic word-stamp that pops in over a scene, holds, then fades -
// the "НЕ ЖАЛКО"-style punctuation beat from the reference channel: a
// one-word punchline slammed over the action instead of only relying on
// spoken narration + captions to land a beat.
const StampText: React.FC<{text: string; startFrame: number; color?: string}> = ({text, startFrame, color = "#FFD400"}) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  if (local < 0 || local > 50) return null;
  const scale = interpolate(local, [0, 6, 10], [0.4, 1.15, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    output: "perceptual-scale",
  });
  const rotate = interpolate(local, [0, 6], [-8, -3], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const opacity = interpolate(local, [0, 4, 40, 50], [0, 1, 1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <AbsoluteFill style={{justifyContent: "center", alignItems: "center", pointerEvents: "none"}}>
      <div
        style={{
          opacity,
          scale,
          rotate: `${rotate}deg`,
          color,
          fontFamily: "sans-serif",
          fontWeight: 900,
          fontSize: 110,
          textTransform: "uppercase",
          textShadow: "0 6px 0 rgba(0,0,0,0.35)",
          WebkitTextStroke: "4px #05060a",
          paintOrder: "stroke fill",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

// Side-profile brain outline with the thalamus highlighted and a progressive
// "erosion" of damage dots (0 = healthy, 1 = riddled with holes) - the one
// piece of genuine medical visualization in the science section instead of
// just text cards back to back.
// `erosion` is the TARGET value reached by the end of the shot - holes
// appear progressively from 0 over `duration` instead of the whole diagram
// sitting frozen at its final state for the entire beat (which, at 20-35s
// per beat, read as a single static screenshot with a mild zoom).
const BrainDiagram: React.FC<{erosion: number; duration: number}> = ({erosion, duration}) => {
  const frame = useCurrentFrame();
  const liveErosion = interpolate(frame, [duration * 0.15, duration * 0.9], [0, erosion], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const holes = Array.from({length: 14}, (_, i) => {
    const angle = (i / 14) * Math.PI * 2;
    const r = 28 + (i % 3) * 10;
    return {
      cx: Math.cos(angle) * r,
      cy: Math.sin(angle) * r * 0.75,
      show: liveErosion > i / 14,
    };
  });
  return (
    <AbsoluteFill style={{backgroundColor: "#05060a", justifyContent: "center", alignItems: "center"}}>
      <svg width="620" height="620" viewBox="-200 -200 400 400">
        <path
          d="M -90 -20 C -95 -70 -50 -110 0 -108 C 55 -110 100 -70 95 -15
             C 115 0 112 35 90 45 C 95 70 70 90 45 82 C 35 100 5 105 -10 88
             C -40 100 -75 80 -75 50 C -100 45 -105 10 -90 -20 Z"
          fill="none"
          stroke="#6d7bd6"
          strokeWidth={5}
        />
        {/* thalamus - small highlighted core at the brain's center */}
        <ellipse cx={0} cy={-10} rx={42} ry={26} fill="#FFD400" opacity={0.85} />
        <text x={0} y={-10} textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight={900} fontFamily="sans-serif" fill="#1a1a1a">
          TÁLAMO
        </text>
        {holes.map((h, i) => (
          <circle
            key={i}
            cx={h.cx}
            cy={h.cy - 10}
            r={5}
            fill="#05060a"
            opacity={h.show ? 1 : 0}
          />
        ))}
      </svg>
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

// Single source of truth for where the character's own pillow rests behind
// his head - used by both RestPillow (the pillow he's lying on) and
// PillowCover (the same pillow, pulled onto his face), so it's visibly one
// object moving, never two pillows on screen at once.
const pillowRest = (headX: number, headY: number) => ({
  left: headX - 115,
  top: headY + 6,
  width: 230,
  height: 110,
});

// The pillow the character's head rests on - drawn behind the character so
// the head overlaps it, instead of a bed-fixed pillow that drifts out of
// sync with wherever the character is framed in a given shot.
const RestPillow: React.FC<{headX: number; headY: number}> = ({headX, headY}) => {
  const r = pillowRest(headX, headY);
  return (
    <div
      style={{
        position: "absolute",
        left: r.left,
        top: r.top,
        width: r.width,
        height: r.height,
        background: "#dfe4f5",
        borderRadius: 30,
        boxShadow: "0 6px 14px rgba(0,0,0,0.3)",
      }}
    />
  );
};

// Pillow pulled up over the face partway through the scene - starts from the
// exact resting position above (same pillow he was lying on, not a second
// one materializing out of nowhere) and ends up overlapping the face.
const PillowCover: React.FC<{startFrame: number; headX: number; headY: number}> = ({startFrame, headX, headY}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [startFrame, startFrame + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.3, 0, 0.2, 1),
  });
  const rest = pillowRest(headX, headY);
  const left = interpolate(t, [0, 1], [rest.left, headX - 95]);
  const top = interpolate(t, [0, 1], [rest.top, headY - 55]);
  const width = interpolate(t, [0, 1], [rest.width, 190]);
  const height = interpolate(t, [0, 1], [rest.height, 150]);
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
              <RestPillow headX={560} headY={718} />
              <Character x={560} y={760} scale={1.3} expression="tired" bobbing />
              <Blanket />
              <NightBadge n={1} atFrame={40} />
              </Bedroom>
          </CameraCloser>
          <HoursCounter startHour={0} endHour={0.1} duration={123} />
        </SceneFade>
      </Sequence>

      {/* 7.1s-11.7s (audio 4.12-8.72s): phone in hand, screen glow on face - still in bed */}
      <Sequence from={213} durationInFrames={139}>
        <SceneFade duration={139}>
          <CameraCloser x={640} y={680} zoom={1.75}>
            <Bedroom>
              <RestPillow headX={620} headY={698} />
              <Character x={620} y={740} scale={1.3} expression="tired" armRaise={0.95} faceTilt={-6} prop="phone" stillness />
              <Blanket />
              </Bedroom>
          </CameraCloser>
          <HoursCounter startHour={0.1} endHour={1} duration={139} />
        </SceneFade>
      </Sequence>

      {/* 11.7s-13.4s (audio 8.72-10.88s): quick time-passing beat, different angle, counter ticks visibly */}
      <Sequence from={352} durationInFrames={52}>
        <SceneFade duration={52}>
          <CameraCloser x={560} y={850} zoom={1.7}>
            <Bedroom>
              <RestPillow headX={560} headY={718} />
              <Character x={560} y={760} scale={1.3} expression="tired" bobbing />
              <Blanket />
              </Bedroom>
          </CameraCloser>
          <HoursCounter startHour={1} endHour={2} duration={52} />
        </SceneFade>
      </Sequence>

      {/* 13.4s-17.6s (audio 10.88-14.56s): tossing and turning side to side - toss drives its own
          rotation, no separate static faceTilt fighting it (that combo read as a seizure) */}
      <Sequence from={404} durationInFrames={123}>
        <SceneFade duration={123}>
          <CameraCloser x={560} y={720} zoom={1.65}>
            <Bedroom>
              <RestPillow headX={560} headY={718} />
              <Character x={560} y={760} scale={1.3} expression="angry" toss />
              <Blanket />
              </Bedroom>
          </CameraCloser>
          <HoursCounter startHour={2} endHour={3} duration={123} />
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
              </Bedroom>
          </CameraCloser>
          <HoursCounter startHour={3} endHour={4} duration={119} />
        </SceneFade>
      </Sequence>

      {/* 21.6s-22.7s (audio 18.52-19.92s): "Но сон не идёт." — still in bed, hand over face, defeated */}
      <Sequence from={646} durationInFrames={36}>
        <SceneFade duration={36}>
          <CameraCloser x={560} y={700} zoom={1.6}>
            <Bedroom>
              <RestPillow headX={560} headY={698} />
              <Character x={560} y={740} scale={1.3} expression="tired" armRaise={0.9} faceTilt={-3} stillness />
              <Blanket />
              </Bedroom>
          </CameraCloser>
          <HoursCounter startHour={4} endHour={4.5} duration={36} />
        </SceneFade>
      </Sequence>

      {/* 22.7s-23.7s (audio 19.92-20.84s): "Совсем." — sits up, out of the blanket, bridges into
          the next (standing) shot instead of freezing on the exact same frame */}
      <Sequence from={682} durationInFrames={27}>
        <SceneFade duration={27}>
          <CameraCloser x={560} y={650} zoom={1.9}>
            <Bedroom>
              <Character x={560} y={740} scale={1.3} expression="angry" faceTilt={4} stillness />
              </Bedroom>
          </CameraCloser>
          <HoursCounter startHour={4.5} endHour={5} duration={27} />
        </SceneFade>
      </Sequence>

      {/* 23.7s-27.3s (audio 20.84-24.68s): diagnosis reveal — standing, shocked, lamp flicks on */}
      <Sequence from={709} durationInFrames={109}>
        <SceneFade duration={109}>
          <CameraCloser x={480} y={680} zoom={1.85}>
            <Bedroom>
              <Character x={480} y={720} scale={1.3} expression="shocked" armRaise={1} faceTilt={5} stillness />
              <NightstandLamp onFrame={0} />
              </Bedroom>
          </CameraCloser>
          <HoursCounter startHour={5} endHour={24} duration={109} />
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

// --- InsomniaFullES: ~10min ES documentary, built from the real TTS timing ---

type InsomniaBeat = {
  para_index: number;
  text: string;
  from_sec: number;
  to_sec: number;
  cues: {fromSec: number; toSec: number; text: string}[];
};
const INSOMNIA_BEATS = insomniaBeatsData as InsomniaBeat[];
// Was 90 (3s dead idle before anything happens) - same fix as PainFullES,
// confirmed by a reviewed reference channel's retention data: viewers drop
// before second 1, so no silent lead-in, ever.
const INSOMNIA_AUDIO_START = 3;
const INSOMNIA_AUDIO_DURATION_SEC = 620.88;

// One visual treatment per script paragraph (indexed by para_index) - keeps
// 27 scenes' worth of staging in one data table instead of hand-duplicating
// Sequence/CameraCloser/Bedroom JSX 27 times.
type BeatVisual =
  | {type: "void"; expr: Expression; armRaise?: number; faceTilt?: number; stamp?: string}
  | {
      type: "bed";
      x: number;
      y: number;
      zoom: number;
      pose: Partial<CharacterProps>;
      dayRange?: [number, number];
      pillow?: boolean;
      blanket?: boolean;
      lamp?: boolean;
      panTo?: {x: number; y: number; zoom?: number};
    }
  | {type: "brain"; erosion: number}
  | {type: "info"; eyebrow: string; title: string; body?: string}
  | {type: "info-sequence"; cards: {eyebrow: string; title: string; body?: string}[]};

const INSOMNIA_VISUALS: BeatVisual[] = [
  /* 0  hook pt1 */ {type: "void", expr: "scared"},
  /* 1  hook pt2 */ {type: "void", expr: "tired"},
  /* 2  Noche uno */ {
    type: "bed", x: 560, y: 760, zoom: 1.6,
    pose: {expression: "tired", bobbing: true},
    dayRange: [0, 0.5], pillow: true, blanket: true,
  },
  /* 3  Silvano 1984 - 28s, needs camera drift, not a locked-off frame */ {
    type: "bed", x: 620, y: 740, zoom: 1.55,
    pose: {expression: "tired", armRaise: 0.3, faceTilt: -6, stillness: true},
    pillow: true, blanket: true,
    panTo: {x: 540, y: 740, zoom: 1.8},
  },
  /* 4  "la maldición" - 26s */ {
    type: "bed", x: 560, y: 720, zoom: 1.65,
    pose: {expression: "scared", stillness: true},
    pillow: true, blanket: true,
    panTo: {x: 620, y: 700, zoom: 1.85},
  },
  /* 5  Día tres */ {
    type: "bed", x: 560, y: 760, zoom: 1.6,
    pose: {expression: "tired", bobbing: true},
    dayRange: [3, 3.5], pillow: true, blanket: true,
  },
  /* 6  Día siete - 27s */ {
    type: "bed", x: 560, y: 720, zoom: 1.7,
    pose: {expression: "scared", stillness: true},
    dayRange: [7, 7.5], pillow: true, blanket: true,
    panTo: {x: 500, y: 700, zoom: 1.9},
  },
  /* 7  Día quince - 27s */ {
    type: "bed", x: 560, y: 700, zoom: 1.75,
    pose: {expression: "shocked", stillness: true},
    dayRange: [15, 15.5], pillow: true, blanket: true,
    panTo: {x: 620, y: 680, zoom: 1.95},
  },
  /* 8  Día treinta */ {
    type: "bed", x: 560, y: 760, zoom: 1.6,
    pose: {expression: "tired", armRaise: 0.2, stillness: true},
    dayRange: [30, 30.5], pillow: true, blanket: true,
  },
  /* 9  transition question */ {type: "void", expr: "scared"},
  /* 10 tálamo */ {type: "brain", erosion: 0.15},
  /* 11 "¿qué lo está destruyendo?" */ {type: "void", expr: "scared"},
  /* 12 prión explanation */ {type: "brain", erosion: 0.5},
  /* 13 vacas locas / CJD / hereditary - 33.5s, split into 2 cards */ {
    type: "info-sequence",
    cards: [
      {eyebrow: "ENFERMEDADES PRIÓNICAS", title: "La misma familia que las\nvacas locas y Creutzfeldt-Jakob", body: "Todas son enfermedades priónicas"},
      {eyebrow: "ÚNICA EN UN SENTIDO", title: "Es hereditaria", body: "50% de probabilidad · rastreada hasta 1765"},
    ],
  },
  /* 14 Lugaresi / Gambetti - 36s, split into 2 cards */ {
    type: "info-sequence",
    cards: [
      {eyebrow: "EL DESCUBRIMIENTO", title: "Bolonia, 1986", body: "Dr. Elio Lugaresi le puso nombre a la enfermedad"},
      {eyebrow: "SEIS AÑOS DESPUÉS", title: "La mutación exacta,\nidentificada en 1992", body: "Dr. Pierluigi Gambetti"},
    ],
  },
  /* 15 esporádico */ {
    type: "info",
    eyebrow: "UNA VARIANTE AÚN MÁS RARA",
    title: "Insomnio Fatal Esporádico",
    body: "Sin antecedentes familiares · aparece al azar · mismo desenlace",
  },
  /* 16 Día 45 */ {
    type: "bed", x: 560, y: 760, zoom: 1.6,
    pose: {expression: "tired", stillness: true},
    dayRange: [45, 45.5], pillow: true, blanket: true,
  },
  /* 17 coma inducido - 37s, the single worst offender, needs the most drift */ {
    type: "bed", x: 480, y: 680, zoom: 1.85,
    pose: {expression: "scared", armRaise: 0.5, stillness: true},
    pillow: false, blanket: false, lamp: true,
    panTo: {x: 560, y: 650, zoom: 2.1},
  },
  /* 18 Día 60 */ {
    type: "bed", x: 560, y: 760, zoom: 1.6,
    pose: {expression: "tired", stillness: true},
    dayRange: [60, 60.5], pillow: true, blanket: true,
  },
  /* 19 Día 90 - 27s */ {
    type: "bed", x: 560, y: 740, zoom: 1.65,
    pose: {expression: "tired", faceTilt: -4, stillness: true},
    dayRange: [90, 90.5], pillow: true, blanket: true,
    panTo: {x: 500, y: 720, zoom: 1.85},
  },
  /* 20 Día 120 - 23s */ {
    type: "bed", x: 560, y: 720, zoom: 1.7,
    pose: {expression: "tired", faceTilt: 3, stillness: true},
    dayRange: [120, 120.5], pillow: true, blanket: true,
    panTo: {x: 610, y: 700, zoom: 1.9},
  },
  /* 21 priones no son organismos vivos */ {
    type: "info",
    eyebrow: "POR QUÉ NO HAY CURA",
    title: "Los priones no son\norganismos vivos",
    body: "Nada vivo que matar · el sistema inmune no los reconoce · casi indestructibles",
  },
  /* 22 CRISPR / doxiciclina */ {
    type: "info",
    eyebrow: "INVESTIGACIÓN ACTUAL",
    title: "CRISPR y terapia génica\nexperimental",
    body: "Ensayos con doxiciclina · aún sin cura confirmada",
  },
  /* 23 7-36 meses */ {
    type: "info",
    eyebrow: "PRONÓSTICO",
    title: "7–36 meses",
    body: "desde el primer síntoma hasta la muerte",
  },
  /* 24 <100 familias */ {
    type: "info",
    eyebrow: "UNA ENFERMEDAD EXTREMADAMENTE RARA",
    title: "Menos de 100 familias",
    body: "conocidas en todo el planeta",
  },
  /* 25 closing reflection */ {type: "void", expr: "tired"},
  /* 26 CTA */ {type: "void", expr: "scared"},
];

const InsomniaBeatScene: React.FC<{visual: BeatVisual; duration: number}> = ({visual, duration}) => {
  if (visual.type === "void") {
    return (
      <SceneFade duration={duration}>
        <VoidStage>
          <Character
            x={960}
            y={620}
            scale={1.5}
            expression={visual.expr}
            armRaise={visual.armRaise ?? 0}
            faceTilt={visual.faceTilt ?? 0}
            bobbing
          />
          {visual.stamp && <StampText text={visual.stamp} startFrame={8} />}
        </VoidStage>
      </SceneFade>
    );
  }
  if (visual.type === "bed") {
    const scale = 1.3;
    const headX = visual.x;
    const headY = visual.y - 32 * scale;
    return (
      <SceneFade duration={duration}>
        <CameraCloser
          x={visual.x}
          y={visual.y - 60}
          zoom={visual.zoom}
          panTo={visual.panTo ? {x: visual.panTo.x, y: visual.panTo.y - 60, zoom: visual.panTo.zoom} : undefined}
          duration={duration}
        >
          <Bedroom>
            {visual.pillow && <RestPillow headX={headX} headY={headY} />}
            <Character x={visual.x} y={visual.y} scale={scale} {...visual.pose} />
            {visual.blanket && <Blanket />}
            {visual.lamp && <NightstandLamp onFrame={0} />}
          </Bedroom>
        </CameraCloser>
        {/* counter lives outside CameraCloser - that group is scaled/translated
            for the camera push-in, which would otherwise fling a fixed-corner
            UI element far off screen instead of keeping it pinned in place */}
        {visual.dayRange && (
          <DayCounter startDay={visual.dayRange[0]} endDay={visual.dayRange[1]} duration={duration} />
        )}
      </SceneFade>
    );
  }
  if (visual.type === "brain") {
    return (
      <SceneFade duration={duration}>
        <BrainDiagram erosion={visual.erosion} duration={duration} />
      </SceneFade>
    );
  }
  if (visual.type === "info-sequence") {
    const segDuration = Math.floor(duration / visual.cards.length);
    return (
      <>
        {visual.cards.map((card, i) => (
          <Sequence key={i} from={i * segDuration} durationInFrames={i === visual.cards.length - 1 ? duration - i * segDuration : segDuration}>
            <SceneFade duration={i === visual.cards.length - 1 ? duration - i * segDuration : segDuration}>
              <InfoCard eyebrow={card.eyebrow} title={card.title} body={card.body} />
            </SceneFade>
          </Sequence>
        ))}
      </>
    );
  }
  return (
    <SceneFade duration={duration}>
      <InfoCard eyebrow={visual.eyebrow} title={visual.title} body={visual.body} />
    </SceneFade>
  );
};

export const InsomniaFullES: React.FC = () => {
  const {fps} = useVideoConfig();
  const allCues: CaptionCue[] = INSOMNIA_BEATS.flatMap((b) => b.cues);
  const audioDurationFrames = Math.ceil(INSOMNIA_AUDIO_DURATION_SEC * fps);

  return (
    <AbsoluteFill style={{backgroundColor: "#05060a"}}>
      <Sequence from={INSOMNIA_AUDIO_START} durationInFrames={audioDurationFrames + 10}>
        <Audio src={staticFile("voice_insomnia_es.mp3")} />
      </Sequence>

      {INSOMNIA_BEATS.map((beat, i) => {
        const visual = INSOMNIA_VISUALS[beat.para_index];
        const fromFrame = INSOMNIA_AUDIO_START + Math.round(beat.from_sec * fps);
        // Each beat's shot holds through to the START of the next beat (not
        // just to its own last caption cue) so there's no silent gap/flash
        // between paragraphs during the natural pause in the narration.
        const nextFromSec =
          i + 1 < INSOMNIA_BEATS.length ? INSOMNIA_BEATS[i + 1].from_sec : INSOMNIA_AUDIO_DURATION_SEC;
        const toFrame = INSOMNIA_AUDIO_START + Math.round(nextFromSec * fps);
        const duration = Math.max(1, toFrame - fromFrame);
        return (
          <Sequence key={beat.para_index} from={fromFrame} durationInFrames={duration}>
            <InsomniaBeatScene visual={visual} duration={duration} />
          </Sequence>
        );
      })}

      <Sequence from={INSOMNIA_AUDIO_START + audioDurationFrames} durationInFrames={180}>
        <SceneFade duration={180} zoomTo={1.1}>
          <InfoCard eyebrow="INSOMNIO FAMILIAR FATAL" title="Una enfermedad real." body="Gracias por ver hasta el final." />
        </SceneFade>
      </Sequence>

      <SyncedCaptions cues={allCues} offsetFrames={INSOMNIA_AUDIO_START} />
    </AbsoluteFill>
  );
};

// --- PainFullES: ~9min ES documentary on congenital insensitivity to pain ---

type PainBeat = InsomniaBeat;
const PAIN_BEATS = painBeatsData as PainBeat[];
// Was 90 (3s of the character just idling before anything happens) - a
// reviewed reference channel's videos all start on an intriguing moment
// within the first frame, never dead air; 3 of silent idle is exactly the
// "viewers drop before second 1" killer their own retention data flagged.
const PAIN_AUDIO_START = 3;
const PAIN_AUDIO_DURATION_SEC = 530.42;

// Full-body standing anchor shared by every outdoor/indoor scene below (not
// covered by a blanket like the bed scenes, so it needs its own grounding):
// at scale 1.3 the character's foot-shadow lands ~285px below its y anchor,
// so y=640 puts feet near the bottom third of frame and the head comfortably
// in the upper-middle, instead of guessing per scene and over/under-shooting
// the ground line.
const STANDING_Y = 640;

type PainVisual =
  | {type: "void"; expr: Expression; running?: boolean; armRaise?: number; faceTilt?: number; stamp?: string}
  | {
      type: "park" | "kitchen" | "mirror" | "street";
      x: number; zoom: number; pose: Partial<CharacterProps>;
      // optional camera drift to a second framing over the shot, instead of
      // a locked-off static frame - needed once a beat runs 15s+
      panTo?: {x: number; zoom?: number};
    }
  | {
      type: "bed";
      x: number; y: number; zoom: number;
      pose: Partial<CharacterProps>;
      pillow?: boolean; blanket?: boolean; lamp?: boolean;
    }
  | {type: "info"; eyebrow: string; title: string; body?: string}
  // a long info beat (20s+) split into 2-3 cards shown in sequence instead
  // of one card sitting frozen on screen for the whole beat
  | {type: "info-sequence"; cards: {eyebrow: string; title: string; body?: string}[]};

const PAIN_VISUALS: PainVisual[] = [
  /* 0  hook */ {type: "void", expr: "scared"},
  /* 1  bicicleta, no duele */ {type: "void", expr: "happy", running: true, stamp: "CERO DOLOR"},
  /* 2  "suena como un superpoder" */ {type: "void", expr: "smug", stamp: "¿SUPERPODER?"},
  /* 3  cae del resbaladilla, sigue jugando */ {type: "park", x: 960, zoom: 1.3, pose: {expression: "happy"}},
  /* 4  toca la olla hirviendo */ {type: "kitchen", x: 820, zoom: 1.35, pose: {expression: "neutral", armRaise: 0.6, faceTilt: -4}},
  /* 5  los padres se dan cuenta */ {type: "void", expr: "scared"},
  /* 6  explicación: señales de dolor no llegan */ {
    type: "info", eyebrow: "LA CAUSA", title: "Las señales de dolor nunca\nllegan al cerebro", body: "Insensibilidad congénita al dolor",
  },
  /* 7  tobillo roto jugando al fútbol - 20s is too long for a locked-off
         frame of someone jogging in place, so the camera actually drifts
         across the scene instead of just sitting on a mild centered zoom */
  {type: "park", x: 700, zoom: 1.35, pose: {expression: "happy", running: true}, panTo: {x: 1250, zoom: 1.55}},
  /* 8  la mayoría se equivoca */ {type: "void", expr: "smug"},
  /* 9  "sin esa alarma..." */ {type: "void", expr: "scared"},
  /* 10 inspeccionar el cuerpo */ {type: "mirror", x: 960, zoom: 1.3, pose: {expression: "tired", faceTilt: -3}},
  /* 11 raspadura infectada */ {
    type: "bed", x: 560, y: 760, zoom: 1.6,
    pose: {expression: "tired", stillness: true}, pillow: true, blanket: true, lamp: true,
  },
  /* 12 Pakistán 2006 - this paragraph runs 46s, way too long to sit on one
         frozen card, so it's a sequence of 2 */
  {
    type: "info-sequence",
    cards: [
      {eyebrow: "EL CASO QUE LO CAMBIÓ TODO", title: "Pakistán, 2006", body: "Un niño de 14 años, artista callejero"},
      {eyebrow: "SIN NINGÚN DOLOR", title: "Caminaba sobre carbones\nencendidos", body: "Universidad de Cambridge · Dr. Geoffrey Woods"},
    ],
  },
  /* 13 gen SCN9A / Nature */ {type: "info", eyebrow: "EL DESCUBRIMIENTO", title: "El gen SCN9A", body: "Publicado en Nature · el primer gen ligado directamente al dolor"},
  /* 14 explicación del canal de sodio */ {
    type: "info", eyebrow: "CÓMO FUNCIONA", title: "Un canal de sodio\nroto en las neuronas", body: "Sin él, la señal de dolor nunca sale del cuerpo",
  },
  /* 15 otros sentidos funcionan bien */ {
    type: "info", eyebrow: "LO MÁS LLAMATIVO", title: "Todos los demás sentidos\nfuncionan perfectamente", body: "Frío, calor, presión, tacto — solo falta la alarma de dolor",
  },
  /* 16 no sudan / temperatura */ {
    type: "info", eyebrow: "UN RIESGO EXTRA", title: "Tampoco sudan con normalidad", body: "El mismo sistema nervioso regula la temperatura corporal",
  },
  /* 17 colapso por calor */ {type: "park", x: 960, zoom: 1.4, pose: {expression: "tired", faceTilt: 3, stillness: true}},
  /* 18 médicos enseñan miedo consciente */ {type: "void", expr: "scared"},
  /* 19 dentista */ {type: "void", expr: "tired"},
  /* 20 espejo cada mañana */ {type: "mirror", x: 960, zoom: 1.3, pose: {expression: "tired"}},
  /* 21 zapatos nuevos / vidrio */ {type: "street", x: 960, zoom: 1.3, pose: {expression: "scared", faceTilt: -2}},
  /* 22 bloquear el canal, nuevos analgésicos */ {
    type: "info", eyebrow: "EL LADO ESPERANZADOR", title: "La clave para nuevos\nanalgésicos", body: "Bloquear el mismo canal de sodio, de forma temporal y controlada",
  },
  /* 23 tan potente como la morfina */ {
    type: "info", eyebrow: "EL POTENCIAL", title: "Tan potente como la morfina,\nsin el riesgo de adicción", body: "",
  },
  /* 24 ensayos clínicos */ {type: "info", eyebrow: "AHORA MISMO", title: "Ensayos clínicos en curso", body: "Varias farmacéuticas, en este momento"},
  /* 25 reflexión final */ {type: "void", expr: "tired"},
  /* 26 CTA */ {type: "void", expr: "scared"},
];

const PainBeatScene: React.FC<{visual: PainVisual; duration: number}> = ({visual, duration}) => {
  if (visual.type === "void") {
    return (
      <SceneFade duration={duration}>
        <VoidStage>
          <Character
            x={960}
            y={620}
            scale={1.5}
            expression={visual.expr}
            running={visual.running ?? false}
            armRaise={visual.armRaise ?? 0}
            faceTilt={visual.faceTilt ?? 0}
            bobbing={!visual.running}
          />
          {visual.stamp && <StampText text={visual.stamp} startFrame={8} />}
        </VoidStage>
      </SceneFade>
    );
  }
  if (visual.type === "bed") {
    const scale = 1.3;
    const headX = visual.x;
    const headY = visual.y - 32 * scale;
    return (
      <SceneFade duration={duration}>
        <CameraCloser x={visual.x} y={visual.y - 60} zoom={visual.zoom}>
          <Bedroom>
            {visual.pillow && <RestPillow headX={headX} headY={headY} />}
            <Character x={visual.x} y={visual.y} scale={scale} {...visual.pose} />
            {visual.blanket && <Blanket />}
            {visual.lamp && <NightstandLamp onFrame={0} />}
          </Bedroom>
        </CameraCloser>
      </SceneFade>
    );
  }
  if (visual.type === "info") {
    return (
      <SceneFade duration={duration}>
        <InfoCard eyebrow={visual.eyebrow} title={visual.title} body={visual.body} />
      </SceneFade>
    );
  }
  if (visual.type === "info-sequence") {
    const segDuration = Math.floor(duration / visual.cards.length);
    return (
      <>
        {visual.cards.map((card, i) => (
          <Sequence key={i} from={i * segDuration} durationInFrames={i === visual.cards.length - 1 ? duration - i * segDuration : segDuration}>
            <SceneFade duration={i === visual.cards.length - 1 ? duration - i * segDuration : segDuration}>
              <InfoCard eyebrow={card.eyebrow} title={card.title} body={card.body} />
            </SceneFade>
          </Sequence>
        ))}
      </>
    );
  }
  // park | kitchen | mirror | street - full-body standing scenes on a light
  // background, so `glow` (the dark-backdrop rim halo) is switched off.
  const Scene = visual.type === "park" ? ParkScene : visual.type === "kitchen" ? KitchenScene : visual.type === "mirror" ? MirrorScene : StreetScene;
  return (
    <SceneFade duration={duration}>
      <CameraCloser
        x={visual.x}
        y={STANDING_Y - 40}
        zoom={visual.zoom}
        panTo={visual.panTo ? {x: visual.panTo.x, y: STANDING_Y - 40, zoom: visual.panTo.zoom} : undefined}
        duration={duration}
      >
        <Scene>
          <Character x={visual.x} y={STANDING_Y} scale={1.3} glow={false} {...visual.pose} />
        </Scene>
      </CameraCloser>
    </SceneFade>
  );
};

export const PainFullES: React.FC = () => {
  const {fps} = useVideoConfig();
  const allCues: CaptionCue[] = PAIN_BEATS.flatMap((b) => b.cues);
  const audioDurationFrames = Math.ceil(PAIN_AUDIO_DURATION_SEC * fps);

  return (
    <AbsoluteFill style={{backgroundColor: "#05060a"}}>
      <Sequence from={PAIN_AUDIO_START} durationInFrames={audioDurationFrames + 10}>
        <Audio src={staticFile("voice_pain_es.mp3")} />
      </Sequence>

      {PAIN_BEATS.map((beat, i) => {
        const visual = PAIN_VISUALS[beat.para_index];
        const fromFrame = PAIN_AUDIO_START + Math.round(beat.from_sec * fps);
        const nextFromSec = i + 1 < PAIN_BEATS.length ? PAIN_BEATS[i + 1].from_sec : PAIN_AUDIO_DURATION_SEC;
        const toFrame = PAIN_AUDIO_START + Math.round(nextFromSec * fps);
        const duration = Math.max(1, toFrame - fromFrame);
        return (
          <Sequence key={beat.para_index} from={fromFrame} durationInFrames={duration}>
            <PainBeatScene visual={visual} duration={duration} />
          </Sequence>
        );
      })}

      <Sequence from={PAIN_AUDIO_START + audioDurationFrames} durationInFrames={180}>
        <SceneFade duration={180} zoomTo={1.1}>
          <InfoCard eyebrow="INSENSIBILIDAD CONGÉNITA AL DOLOR" title="Una condición real." body="Gracias por ver hasta el final." />
        </SceneFade>
      </Sequence>

      <SyncedCaptions cues={allCues} offsetFrames={PAIN_AUDIO_START} />
    </AbsoluteFill>
  );
};

// --- ParallaxTest30s: proof-of-concept for "2D character moving through a
// continuous depth-layered world" instead of cutting between flat static
// backgrounds. No 3D engine - just several wide background layers scrolling
// at different speeds under a camera-fixed character, which is the cheap
// trick that sells "walking through a real place" (classic side-scroller
// parallax). One continuous night-city journey: rooftop ledge -> street ->
// bench, instead of 3-4 completely separate Scene components. ---

const PARALLAX_TOTAL_DIST = 3400; // px the nearest layer travels over the whole shot

// Each layer's own horizontal span must be wide enough to cover
// PARALLAX_TOTAL_DIST * speed plus one screen width, or it runs out before
// the shot ends.
const ParallaxNightCity: React.FC<{worldX: number; children?: React.ReactNode}> = ({worldX, children}) => {
  const farShift = -worldX * PARALLAX_TOTAL_DIST * 0.12;
  const midShift = -worldX * PARALLAX_TOTAL_DIST * 0.4;
  const nearShift = -worldX * PARALLAX_TOTAL_DIST * 1.0;

  const farBuildings = [60, 220, 420, 640, 900, 1150, 1400, 1700, 2000, 2300, 2600, 2950, 3300, 3650, 4000].map((left, i) => (
    <div
      key={i}
      style={{
        position: "absolute",
        left,
        bottom: 0,
        width: 90 + (i % 3) * 30,
        height: 140 + (i % 4) * 60,
        background: "#141a33",
      }}
    />
  ));

  const midBuildings = [40, 260, 520, 820, 1150, 1500, 1880, 2280, 2700, 3140].map((left, i) => (
    <div
      key={i}
      style={{
        position: "absolute",
        left,
        bottom: 0,
        width: 160 + (i % 3) * 50,
        height: 260 + (i % 5) * 90,
        background: "#1c2440",
      }}
    >
      {/* lit windows - just a handful so it reads as "building at night" */}
      {[0, 1, 2, 3, 4, 5].map((w) => (
        <div
          key={w}
          style={{
            position: "absolute",
            left: 18 + (w % 2) * 40,
            top: 30 + Math.floor(w / 2) * 50,
            width: 16,
            height: 22,
            background: w % 3 === 0 ? "#ffdd88" : "#2a3358",
          }}
        />
      ))}
    </div>
  ));

  return (
    <AbsoluteFill style={{backgroundColor: "#05060e", overflow: "hidden"}}>
      {/* stars + moon - near-static, furthest depth */}
      <div style={{position: "absolute", inset: 0, transform: `translateX(${farShift * 0.2}px)`}}>
        <div
          style={{
            position: "absolute",
            left: 1500,
            top: 90,
            width: 110,
            height: 110,
            borderRadius: "50%",
            background: "#fff6d9",
            boxShadow: "0 0 60px 14px rgba(255,246,217,0.35)",
          }}
        />
        {[100, 300, 500, 750, 980, 1250, 1600, 1850].map((l, i) => (
          <div key={i} style={{position: "absolute", left: l, top: 40 + (i % 4) * 60, width: 3, height: 3, borderRadius: "50%", background: "#cfd7ff", opacity: 0.8}} />
        ))}
      </div>

      {/* far skyline */}
      <div style={{position: "absolute", inset: 0, transform: `translateX(${farShift}px)`}}>{farBuildings}</div>

      {/* mid buildings with lit windows */}
      <div style={{position: "absolute", inset: 0, transform: `translateX(${midShift}px)`}}>{midBuildings}</div>

      {/* near layer: ground + the specific set-pieces the character passes:
          rooftop ledge near the start, a bench mid-journey, a lamppost near
          the end - this is what actually sells "he's going somewhere" */}
      <div style={{position: "absolute", inset: 0, transform: `translateX(${nearShift}px)`}}>
        {/* visibly lighter than the sky, with a lit top edge line, so the
            ground plane actually reads as a surface instead of blending
            into the background - previously both were near-black and the
            character looked like he had nothing under him */}
        <div style={{position: "absolute", left: 0, right: -5000, bottom: 0, height: 140, background: "#232a44"}} />
        <div style={{position: "absolute", left: 0, right: -5000, bottom: 138, height: 3, background: "#3a4468"}} />
        {/* rooftop ledge, screen-centered near worldX=0 */}
        <div style={{position: "absolute", left: 760, bottom: 100, width: 420, height: 24, background: "#23294a"}} />
        <div style={{position: "absolute", left: 760, bottom: 100, width: 14, height: 90, background: "#23294a"}} />
        <div style={{position: "absolute", left: 1166, bottom: 100, width: 14, height: 90, background: "#23294a"}} />
        {/* bench, screen-centered around worldX=0.45 */}
        <div style={{position: "absolute", left: 760 + PARALLAX_TOTAL_DIST * 0.45, bottom: 100, width: 220, height: 14, background: "#3a2f22"}} />
        <div style={{position: "absolute", left: 770 + PARALLAX_TOTAL_DIST * 0.45, bottom: 60, width: 14, height: 44, background: "#2a2118"}} />
        <div style={{position: "absolute", left: 950 + PARALLAX_TOTAL_DIST * 0.45, bottom: 60, width: 14, height: 44, background: "#2a2118"}} />
        {/* lamppost, screen-centered around worldX=0.85 */}
        <div style={{position: "absolute", left: 950 + PARALLAX_TOTAL_DIST * 0.85, bottom: 100, width: 8, height: 220, background: "#1a1d2e"}} />
        <div
          style={{
            position: "absolute",
            left: 900 + PARALLAX_TOTAL_DIST * 0.85,
            bottom: 300,
            width: 110,
            height: 110,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,214,140,0.55) 0%, rgba(255,214,140,0.1) 60%, rgba(255,214,140,0) 80%)",
          }}
        />
      </div>

      {children}
    </AbsoluteFill>
  );
};

type ParallaxBeat = {fromSec: number; toSec: number; expr: Expression; armRaise?: number; faceTilt?: number};
const PARALLAX_BEATS: ParallaxBeat[] = [
  {fromSec: 0, toSec: 4.0, expr: "tired"},
  {fromSec: 4.0, toSec: 6.9, expr: "scared", faceTilt: -4},
  {fromSec: 6.9, toSec: 10.3, expr: "tired", armRaise: 0.3},
  {fromSec: 10.3, toSec: 14.0, expr: "shocked", armRaise: 0.6},
  {fromSec: 14.0, toSec: 18.6, expr: "tired", faceTilt: 4},
];

const PARALLAX_CAPTIONS: CaptionCue[] = [
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

const PARALLAX_AUDIO_START = 15; // 0.5s, just enough for a clean fade-in, no dead air
const PARALLAX_AUDIO_DURATION_SEC = 18.56;

// "2D character in a 3D-feeling world": the layers themselves only ever
// slide horizontally (that's PARALLAX_TOTAL_DIST/worldX above - the walk
// forward). What was missing was a CAMERA that moves independently of that
// walk - zoom, vertical pan, dutch tilt, hard cuts - the same shot-switching
// trick used in ThreeTest's real 3D camera, done here with a single CSS
// transform wrapped around the whole parallax stack instead of a WebGL
// camera object. scale never drops below 1 (and rotated shots keep enough
// scale margin) so a tilt/zoom never exposes empty canvas at the corners.
type CameraShot = {
  fromSec: number;
  toSec: number;
  scaleFrom: number;
  scaleTo: number;
  rotateDeg: number;
  originX: string;
  originY: string;
  panX: number;
  panY: number;
};
const CAMERA_SHOTS: CameraShot[] = [
  // Shot 1 (hook): slow creeping push-in, dead center - lets the walk cycle read clean first.
  {fromSec: 0, toSec: 4.0, scaleFrom: 1.0, scaleTo: 1.08, rotateDeg: 0, originX: "50%", originY: "58%", panX: 0, panY: 0},
  // Shot 2 (hard cut): dutch tilt + push further in on "navsegda" - first jolt.
  {fromSec: 4.0, toSec: 6.9, scaleFrom: 1.18, scaleTo: 1.28, rotateDeg: -3, originX: "47%", originY: "55%", panX: -20, panY: 0},
  // Shot 3 (hard cut): pulls back out, drifts right - "days passing" reads as the camera itself drifting past him.
  {fromSec: 6.9, toSec: 10.3, scaleFrom: 1.05, scaleTo: 1.12, rotateDeg: 0, originX: "53%", originY: "60%", panX: 35, panY: -6},
  // Shot 4 (hard cut): crash-zoom on the face for the diagnosis reveal.
  {fromSec: 10.3, toSec: 14.0, scaleFrom: 1.7, scaleTo: 1.9, rotateDeg: 2, originX: "50%", originY: "49%", panX: 0, panY: -10},
  // Shot 5 (hard cut): pulls back wide again, opposite tilt, for the closing lines.
  {fromSec: 14.0, toSec: 18.6, scaleFrom: 1.08, scaleTo: 1.18, rotateDeg: 2, originX: "50%", originY: "58%", panX: -18, panY: 0},
];

export const ParallaxTest30s: React.FC = () => {
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const localFrame = frame - PARALLAX_AUDIO_START;
  const audioDurationFrames = Math.ceil(PARALLAX_AUDIO_DURATION_SEC * fps);

  const worldX = interpolate(localFrame, [0, audioDurationFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  });

  const localSec = localFrame / fps;
  const beat = PARALLAX_BEATS.find((b) => localSec >= b.fromSec && localSec < b.toSec) ?? PARALLAX_BEATS[PARALLAX_BEATS.length - 1];
  const shot = CAMERA_SHOTS.find((s) => localSec >= s.fromSec && localSec < s.toSec) ?? CAMERA_SHOTS[CAMERA_SHOTS.length - 1];
  const shotProgress = interpolate(localSec, [shot.fromSec, shot.toSec], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const camScale = interpolate(shotProgress, [0, 1], [shot.scaleFrom, shot.scaleTo], {easing: Easing.inOut(Easing.ease)});

  return (
    <AbsoluteFill style={{backgroundColor: "#05060e"}}>
      <Sequence from={PARALLAX_AUDIO_START} durationInFrames={audioDurationFrames + 10}>
        <Audio src={staticFile("voice_ru_mike.mp3")} />
      </Sequence>

      <AbsoluteFill
        style={{
          transform: `translate(${shot.panX}px, ${shot.panY}px) rotate(${shot.rotateDeg}deg) scale(${camScale})`,
          transformOrigin: `${shot.originX} ${shot.originY}`,
        }}
      >
        <ParallaxNightCity worldX={worldX}>
          <Character
            x={960}
            y={700}
            scale={1.35}
            expression={beat.expr}
            armRaise={beat.armRaise ?? 0}
            faceTilt={beat.faceTilt ?? 0}
            walking
          />
        </ParallaxNightCity>
      </AbsoluteFill>

      {localSec >= 10.3 && <StampText text="ДИАГНОЗ" startFrame={PARALLAX_AUDIO_START + Math.round(10.6 * fps)} />}

      <SyncedCaptions cues={PARALLAX_CAPTIONS} offsetFrames={PARALLAX_AUDIO_START} />
    </AbsoluteFill>
  );
};
