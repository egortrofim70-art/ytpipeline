import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
  staticFile,
} from "remotion";
import { Audio } from "@remotion/media";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";

// --- Real 3D proof-of-concept (@remotion/three, i.e. WebGL via Three.js,
// no Blender/external app) - same character proportions and color scheme as
// the 2D SVG rig, rebuilt from primitive 3D shapes, walking through an
// actual 3D city block with a real perspective camera doing a dolly/truck
// shot. Compare directly against ParallaxTest30s (same Russian test audio,
// same beats) to judge whether true 3D depth is worth the extra build cost
// over the parallax trick. ---

const SHIRT_YELLOW = "#FFD400";
const PANTS_DARK = "#111111";
const HEAD_BLACK = "#0a0a0a";

type Expr = "neutral" | "tired" | "scared" | "shocked";
const FACE: Record<Expr, {browAngle: number; eyeScale: number; mouthCurve: number}> = {
  neutral: {browAngle: 0, eyeScale: 1, mouthCurve: 0},
  tired: {browAngle: -4, eyeScale: 0.6, mouthCurve: -0.15},
  scared: {browAngle: 12, eyeScale: 1.15, mouthCurve: -0.3},
  shocked: {browAngle: 16, eyeScale: 1.3, mouthCurve: 0.1},
};

// Procedural 3D stickman - head/torso/limbs as primitives, same silhouette
// logic as Character.tsx (thin limbs, trapezoid-ish torso, round head) but
// using real geometry instead of flat SVG paths.
const Character3D: React.FC<{
  x: number;
  z: number;
  walkPhase: number;
  expression: Expr;
  isMoving: boolean;
}> = ({x, z, walkPhase, expression, isMoving}) => {
  const legSwing = isMoving ? Math.sin(walkPhase) * 0.5 : 0;
  const legSwing2 = isMoving ? Math.sin(walkPhase + Math.PI) * 0.5 : 0;
  const armSwing = isMoving ? Math.sin(walkPhase + Math.PI) * 0.4 : 0;
  const armSwing2 = isMoving ? Math.sin(walkPhase) * 0.4 : 0;
  const walkBob = isMoving ? Math.abs(Math.sin(walkPhase)) * 0.04 : 0;

  const face = FACE[expression];

  // Emissive baseline on every material - meshStandardMaterial goes pure
  // black wherever no light reaches it, which is exactly what made the
  // whole character vanish into the night sky. A small self-glow keeps the
  // silhouette readable regardless of how the scene lighting shakes out,
  // the same job Character.tsx's SVG "glow" halo does in 2D.
  const headMat = <meshStandardMaterial color={HEAD_BLACK} emissive="#2a2a2a" emissiveIntensity={0.5} roughness={0.4} />;
  const shirtMat = <meshStandardMaterial color={SHIRT_YELLOW} emissive={SHIRT_YELLOW} emissiveIntensity={0.25} />;
  const pantsMat = <meshStandardMaterial color={PANTS_DARK} emissive="#2a2a2a" emissiveIntensity={0.4} />;

  // The whole rig faces -Z (negative) on purpose: the camera dollies in the
  // -Z direction over the course of the shot (camZ decreases), so "forward"
  // for the character has to be -Z too, or he walks backward relative to
  // his own face - which is exactly the bug reported ("head's behind him").
  return (
    <group position={[x, walkBob, z]}>
      {/* contact shadow - a simple dark disc right at ground level under the
          feet, so grounding is never ambiguous regardless of lighting */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.32, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.4} />
      </mesh>

      {/* legs */}
      <group position={[-0.08, 0.5, 0]} rotation={[legSwing, 0, 0]}>
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.6, 10]} />
          {pantsMat}
        </mesh>
      </group>
      <group position={[0.08, 0.5, 0]} rotation={[legSwing2, 0, 0]}>
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.6, 10]} />
          {pantsMat}
        </mesh>
      </group>

      {/* torso (shirt) - a near-constant radius with rounded ends instead of
          a sharply tapered 8-sided cylinder, which read as "a cone" rather
          than a sweater */}
      <mesh position={[0, 0.78, 0]}>
        <capsuleGeometry args={[0.19, 0.38, 6, 16]} />
        {shirtMat}
      </mesh>

      {/* shoulder joints - a small sphere right where each arm attaches, so
          the arm reads as part of the body instead of a stick floating
          beside a separate torso shape */}
      <mesh position={[-0.24, 1.0, 0]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        {shirtMat}
      </mesh>
      <mesh position={[0.24, 1.0, 0]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        {shirtMat}
      </mesh>

      {/* arms */}
      <group position={[-0.24, 1.0, 0]} rotation={[armSwing, 0, 0]}>
        <mesh position={[0, -0.26, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.5, 10]} />
          {shirtMat}
        </mesh>
      </group>
      <group position={[0.24, 1.0, 0]} rotation={[armSwing2, 0, 0]}>
        <mesh position={[0, -0.26, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.5, 10]} />
          {shirtMat}
        </mesh>
      </group>

      {/* neck */}
      <mesh position={[0, 1.08, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.08, 10]} />
        {headMat}
      </mesh>

      {/* head */}
      <mesh position={[0, 1.28, 0]}>
        <sphereGeometry args={[0.22, 24, 24]} />
        {headMat}
      </mesh>
      {/* soft colored rim light BEHIND the head relative to the direction
          he's facing (+Z, since the rig now faces -Z) */}
      <pointLight position={[0, 1.28, 0.3]} color={SHIRT_YELLOW} intensity={1.4} distance={2} decay={1.5} />

      {/* eyes/brows/mouth all at NEGATIVE z - the face is on the -Z side,
          matching the direction of travel */}
      <mesh position={[-0.08, 1.3, -0.19]} scale={[1, face.eyeScale, 1]}>
        <sphereGeometry args={[0.03, 10, 10]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.08, 1.3, -0.19]} scale={[1, face.eyeScale, 1]}>
        <sphereGeometry args={[0.03, 10, 10]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* brows */}
      <mesh position={[-0.08, 1.35, -0.2]} rotation={[0, 0, (face.browAngle * Math.PI) / 180]}>
        <boxGeometry args={[0.07, 0.015, 0.01]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.08, 1.35, -0.2]} rotation={[0, 0, (-face.browAngle * Math.PI) / 180]}>
        <boxGeometry args={[0.07, 0.015, 0.01]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* mouth */}
      <mesh position={[0, 1.22 + face.mouthCurve * 0.04, -0.2]} rotation={[0, Math.PI, Math.PI]}>
        <torusGeometry args={[0.05, 0.008, 6, 12, Math.PI]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
};

// A real 3D city block: box buildings with emissive "window" strips,
// positioned along the path the camera dollies through - true parallax,
// no speed-multiplier tricks, because the camera is actually moving through
// 3D space.
const City3D: React.FC = () => {
  const buildings = React.useMemo(() => {
    const arr: {x: number; z: number; w: number; h: number; d: number; color: string}[] = [];
    for (let i = 0; i < 26; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      arr.push({
        x: side * (3.2 + (i % 3) * 0.6),
        z: -i * 2.4 - 2,
        w: 1.8 + (i % 4) * 0.4,
        h: 2.5 + (i % 5) * 1.4,
        d: 1.8,
        color: i % 3 === 0 ? "#2a3460" : "#222a4e",
      });
    }
    return arr;
  }, []);

  return (
    <group>
      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -30]}>
        <planeGeometry args={[30, 80]} />
        <meshStandardMaterial color="#2a3458" emissive="#161c38" emissiveIntensity={0.6} />
      </mesh>
      {/* moon */}
      <mesh position={[6, 6, -40]}>
        <sphereGeometry args={[1.4, 16, 16]} />
        <meshBasicMaterial color="#fff6d9" />
      </mesh>
      {buildings.map((b, i) => (
        <group key={i} position={[b.x, b.h / 2, b.z]}>
          <mesh>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial color={b.color} emissive={b.color} emissiveIntensity={0.5} />
          </mesh>
          {/* a few lit windows per building */}
          {[0, 1, 2, 3].map((w) => (
            <mesh
              key={w}
              position={[
                (w % 2 === 0 ? -1 : 1) * b.w * 0.22,
                b.h * 0.15 + Math.floor(w / 2) * 0.5,
                (b.d / 2) * (b.x < 0 ? -1 : 1) + (b.x < 0 ? -0.01 : 0.01),
              ]}
            >
              <planeGeometry args={[0.2, 0.3]} />
              <meshBasicMaterial color={w % 3 === 0 ? "#ffdd88" : "#2a3358"} />
            </mesh>
          ))}
        </group>
      ))}
      {/* a bench prop partway down the block, and a lamppost further on -
          same "set pieces along the path" idea as the parallax version,
          just placed in real 3D space instead of a scrolling layer */}
      <group position={[1.1, 0, -22]}>
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.9, 0.06, 0.3]} />
          <meshStandardMaterial color="#3a2f22" />
        </mesh>
        <mesh position={[-0.35, 0.12, 0]}>
          <boxGeometry args={[0.05, 0.24, 0.05]} />
          <meshStandardMaterial color="#2a2118" />
        </mesh>
        <mesh position={[0.35, 0.12, 0]}>
          <boxGeometry args={[0.05, 0.24, 0.05]} />
          <meshStandardMaterial color="#2a2118" />
        </mesh>
      </group>
      <group position={[-1.3, 0, -42]}>
        <mesh position={[0, 1.1, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 2.2, 8]} />
          <meshStandardMaterial color="#1a1d2e" />
        </mesh>
        <pointLight position={[0, 2.2, 0]} color="#ffd68c" intensity={1.2} distance={4} decay={2} />
        <mesh position={[0, 2.2, 0]}>
          <sphereGeometry args={[0.1, 10, 10]} />
          <meshBasicMaterial color="#ffd68c" />
        </mesh>
      </group>
    </group>
  );
};

type Beat3D = {fromSec: number; toSec: number; expr: Expr};
const BEATS_3D: Beat3D[] = [
  {fromSec: 0, toSec: 4.0, expr: "tired"},
  {fromSec: 4.0, toSec: 6.9, expr: "scared"},
  {fromSec: 6.9, toSec: 10.3, expr: "tired"},
  {fromSec: 10.3, toSec: 14.0, expr: "shocked"},
  {fromSec: 14.0, toSec: 18.6, expr: "tired"},
];

type CaptionCue3D = {fromSec: number; toSec: number; text: string};
const CAPTIONS_3D: CaptionCue3D[] = [
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

const AUDIO_START = 15;
const AUDIO_DURATION_SEC = 18.56;

const Captions3D: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const relFrame = frame - AUDIO_START;
  const cue = CAPTIONS_3D.find((c) => relFrame >= c.fromSec * fps && relFrame < c.toSec * fps);
  if (!cue) return null;
  return (
    <div style={{position: "absolute", bottom: 140, left: 0, right: 0, textAlign: "center"}}>
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

// Kinetic word-stamp overlay at the diagnosis reveal beat (shot C, the
// front crash-in) - the 2D rig's StampText trick, ported as a plain HTML
// overlay on top of the WebGL canvas. Proves 2D graphic "pop" elements
// layer over real 3D exactly the same way they do over the flat SVG rig.
const DiagnosisStamp: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame - AUDIO_START - Math.round(11 * 30);
  if (local < 0 || local > 70) return null;
  const scale = interpolate(local, [0, 6, 10], [0.4, 1.15, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    output: "perceptual-scale",
  });
  const opacity = interpolate(local, [0, 4, 60, 70], [0, 1, 1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <AbsoluteFill style={{justifyContent: "flex-start", alignItems: "center", paddingTop: 90, pointerEvents: "none"}}>
      <div
        style={{
          opacity,
          scale,
          color: "#FFD400",
          fontFamily: "sans-serif",
          fontWeight: 900,
          fontSize: 90,
          textTransform: "uppercase",
          WebkitTextStroke: "4px #05060a",
          paintOrder: "stroke fill",
        }}
      >
        ДИАГНОЗ
      </div>
    </AbsoluteFill>
  );
};

export const ThreeTest30s: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const localFrame = frame - AUDIO_START;
  const audioDurationFrames = Math.ceil(AUDIO_DURATION_SEC * fps);

  const progress = interpolate(localFrame, [0, audioDurationFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  });

  // The character's own progress through the world is continuous and
  // independent of whatever the camera is doing - he just keeps walking
  // forward at a steady pace for the whole shot, while the camera cuts
  // between completely different kinds of coverage on him (dolly, orbit,
  // front close-up, dolly again), the way an edited scene actually covers
  // one continuous action from several angles instead of one static shot.
  const charZ = 2 - progress * 40;
  const isMoving = true;
  const walkPhase = (frame / fps) * Math.PI * 2 * 1.4;

  const localSec = Math.max(0, localFrame / fps);
  const beat = BEATS_3D.find((b) => localSec >= b.fromSec && localSec < b.toSec) ?? BEATS_3D[BEATS_3D.length - 1];

  const camera = React.useMemo(
    () => new THREE.PerspectiveCamera(50, width / height, 0.1, 200),
    [width, height]
  );

  let camX: number, camY: number, camZ: number, lookX: number, lookY: number, lookZ: number;

  if (localSec < 6) {
    // Shot A: tracking dolly behind/beside him, same as the first pass.
    camX = 0.6;
    camY = 1.5;
    camZ = charZ + 4.2;
    lookX = 0;
    lookY = 1.1;
    lookZ = charZ - 3;
  } else if (localSec < 11) {
    // Shot B: low, fast orbit around him - a hard cut into a completely
    // different kind of coverage, not just a continuation of shot A's move.
    const orbitT = (localSec - 6) / 5;
    const orbitAngle = orbitT * Math.PI * 1.4;
    const radius = 2.3;
    camX = Math.sin(orbitAngle) * radius;
    camY = 0.85;
    camZ = charZ + Math.cos(orbitAngle) * radius;
    lookX = 0;
    lookY = 1.15;
    lookZ = charZ;
  } else if (localSec < 14) {
    // Shot C: hard cut to a front crash-in close-up for the diagnosis beat -
    // camera ahead of him (more negative Z, since he faces -Z) looking back
    // at his actual face instead of the back of his head.
    const t = (localSec - 11) / 3;
    camX = 0;
    camY = 1.32;
    camZ = charZ - (1.4 - t * 0.7);
    lookX = 0;
    lookY = 1.26;
    lookZ = charZ;
  } else {
    // Shot D: resumes the dolly from the opposite side for the close.
    camX = -0.6;
    camY = 1.4;
    camZ = charZ + 3.4;
    lookX = 0;
    lookY = 1.1;
    lookZ = charZ - 2.5;
  }

  camera.position.set(camX, camY, camZ);
  camera.lookAt(lookX, lookY, lookZ);
  camera.updateProjectionMatrix();

  return (
    <AbsoluteFill style={{backgroundColor: "#05060e"}}>
      <Sequence from={AUDIO_START} durationInFrames={audioDurationFrames + 10}>
        <Audio src={staticFile("voice_ru_mike.mp3")} />
      </Sequence>

      <ThreeCanvas width={width} height={height} camera={camera}>
        {/* fog fades distant buildings into the sky color instead of them
            staying hard-black silhouettes - also gives a free depth cue and
            stops the frame going to solid black past a few buildings */}
        <fog attach="fog" args={["#11162c", 6, 30]} />
        <ambientLight intensity={1.9} color="#6a7cc0" />
        <directionalLight position={[5, 10, 2]} intensity={0.7} color="#cfd7ff" />
        {/* light that travels with the camera, like a fill light on a night
            shoot - keeps whatever's in frame (character included) actually
            visible instead of relying on the moon/windows alone */}
        <pointLight position={[0.6, 2.2, charZ]} intensity={1.8} color="#aab6ff" distance={10} decay={1.5} />
        <City3D />
        <Character3D x={0} z={charZ} walkPhase={walkPhase} expression={beat.expr} isMoving={isMoving} />
      </ThreeCanvas>

      <DiagnosisStamp />
      <Captions3D />
    </AbsoluteFill>
  );
};
