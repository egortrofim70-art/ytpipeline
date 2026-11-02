import React from "react";
import { Composition } from "remotion";
import { Main } from "./Main";
import type { Plan } from "./types";

// План приходит через --props (render.py собирает props.json из plan.json)
const demo: Plan = {
  fps: 30,
  duration: 3,
  words: [
    { w: "Видеоэссе", s: 0.2, e: 0.8 },
    { w: "в", s: 0.9, e: 1.0 },
    { w: "одном", s: 1.0, e: 1.3 },
    { w: "кадре", s: 1.3, e: 1.8 },
  ],
  scenes: [{ at: 0, kind: "text" }],
};

export const Root: React.FC = () => (
  <Composition
    id="Main"
    component={Main}
    defaultProps={{ plan: demo }}
    fps={30}
    width={1920}
    height={1080}
    durationInFrames={90}
    calculateMetadata={({ props }) => ({
      fps: props.plan.fps,
      durationInFrames: Math.max(1, Math.round(props.plan.duration * props.plan.fps)),
    })}
  />
);
