import type { PuzzlePieceDefinition } from "./usePuzzleDrag";

/** 四片拼图的共享逻辑坐标；H5 与 Canvas 适配层只负责把坐标映射到各自舞台。 */
export const PUZZLE_PIECES: readonly PuzzlePieceDefinition[] = [
  { id: "alpha", label: "A", color: "#67e8f9", start: { x: 0.16, y: 0.28 }, target: { x: 0.68, y: 0.32 } },
  { id: "beta", label: "B", color: "#facc15", start: { x: 0.34, y: 0.28 }, target: { x: 0.84, y: 0.32 } },
  { id: "gamma", label: "C", color: "#c084fc", start: { x: 0.16, y: 0.72 }, target: { x: 0.68, y: 0.68 } },
  { id: "delta", label: "D", color: "#fb7185", start: { x: 0.34, y: 0.72 }, target: { x: 0.84, y: 0.68 } },
] as const;

export const PUZZLE_TARGET_RADIUS = 0.1;
