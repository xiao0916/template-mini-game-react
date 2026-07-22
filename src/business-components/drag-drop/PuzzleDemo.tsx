import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { Text } from "@react-three/drei";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { Plane, PlaneGeometry, Vector3 } from "three";

import { clampDragValue, getRotatedStagePointerPoint, type DragPoint } from "./drag-point";
import type { PuzzleDragController, PuzzlePieceState } from "./usePuzzleDrag";

export type PuzzleDemoProps = {
  controller: PuzzleDragController;
  onReady?: () => void;
};

type ThreePointerCaptureTarget = EventTarget & {
  releasePointerCapture: (pointerId: number) => void;
  setPointerCapture: (pointerId: number) => void;
};

const H5_BOUNDS = { x: [0.08, 0.92] as [number, number], y: [0.14, 0.86] as [number, number] };
const BOARD_WIDTH = 6.4;
const BOARD_HEIGHT = 3.6;

function getPieceStyle(piece: PuzzlePieceState) {
  return {
    left: `${piece.point.x * 100}%`,
    top: `${piece.point.y * 100}%`,
    backgroundColor: piece.color,
  };
}

function getCanvasPoint(point: DragPoint): [number, number] {
  return [(point.x - 0.5) * BOARD_WIDTH, (0.5 - point.y) * BOARD_HEIGHT];
}

function readCanvasPoint(event: ThreeEvent<PointerEvent>, plane: Plane, target: Vector3): DragPoint | null {
  const hit = event.ray.intersectPlane(plane, target);
  if (!hit) return null;
  return {
    x: clampDragValue(hit.x / BOARD_WIDTH + 0.5, H5_BOUNDS.x[0], H5_BOUNDS.x[1]),
    y: clampDragValue(0.5 - hit.y / BOARD_HEIGHT, H5_BOUNDS.y[0], H5_BOUNDS.y[1]),
  };
}

function PuzzlePieceButton({ controller, piece, stageRef }: { controller: PuzzleDragController; piece: PuzzlePieceState; stageRef: RefObject<HTMLDivElement> }) {
  const readPointerPoint = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const stage = stageRef.current;
    if (!stage) return null;
    const rotationValue = stage.closest<HTMLElement>("[data-rotation]")?.dataset.rotation;
    const rotation = rotationValue === "90" ? 90 : rotationValue === "-90" ? -90 : 0;
    return getRotatedStagePointerPoint({ bounds: H5_BOUNDS, clientX: event.clientX, clientY: event.clientY, rect: stage.getBoundingClientRect(), rotation });
  };

  return (
    <button
      type="button"
      className={`pointer-events-auto absolute grid h-[15%] min-h-[48px] w-[13%] min-w-[48px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[12px] border-[2px] border-white/70 text-[18px] font-black text-[#07111f] shadow-[0_0_26px_rgb(255_255_255_/_0.24)] ${piece.status === "dragging" ? "z-20 scale-110 cursor-grabbing" : "cursor-grab"} ${piece.status === "placed" ? "pointer-events-none opacity-90" : ""}`}
      data-puzzle-piece={piece.id}
      data-testid={`puzzle-h5-piece-${piece.id}`}
      aria-label={`拼片 ${piece.label}`}
      disabled={piece.status === "placed"}
      style={getPieceStyle(piece)}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        const point = readPointerPoint(event);
        if (!point || !controller.begin(piece.id, point)) return;
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const point = readPointerPoint(event);
        if (!point || !controller.move(piece.id, point)) return;
        event.stopPropagation();
      }}
      onPointerUp={(event) => {
        const point = readPointerPoint(event);
        if (!point) return;
        const outcome = controller.end(piece.id, point);
        if (outcome === "ignored") return;
        event.stopPropagation();
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={(event) => {
        if (controller.cancel(piece.id)) event.stopPropagation();
      }}
      onLostPointerCapture={() => controller.cancel(piece.id)}
    >
      {piece.label}
    </button>
  );
}

export function PuzzleH5Demo({ controller }: PuzzleDemoProps) {
  const stageRef = useRef<HTMLDivElement>(null);

  return (
    <section
      ref={stageRef}
      className="pointer-events-none absolute left-[62%] top-[55%] z-10 h-[min(42vw,390px)] w-[min(76vw,760px)] min-h-[230px] min-w-[320px] -translate-x-1/2 -translate-y-1/2 select-none border-[1px] border-[color:rgb(103_232_249_/_0.3)] bg-[linear-gradient(135deg,rgb(7_17_31_/_0.9),rgb(14_116_144_/_0.22))] shadow-[0_0_44px_rgb(14_116_144_/_0.18)] touch-none"
      data-testid="puzzle-h5-stage"
      aria-label="普通 H5 拼图演示区"
    >
      <div className="pointer-events-none absolute inset-[12px] border-[1px] border-dashed border-[color:rgb(103_232_249_/_0.2)]" />
      <div className="pointer-events-none absolute left-[16px] top-[14px] text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--game-muted)]">H5 Puzzle Board</div>
      <div className="pointer-events-none absolute left-[8%] top-[14%] text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--game-muted)]">拼片区</div>
      <div className="pointer-events-none absolute left-[57%] top-[14%] text-[10px] font-bold uppercase tracking-[0.12em] text-[#fde68a]">目标槽</div>
      {controller.pieces.map((piece) => (
        <div
          key={`target-${piece.id}`}
          className="pointer-events-none absolute grid h-[18%] min-h-[54px] w-[16%] min-w-[54px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[12px] border-[2px] border-dashed text-[14px] font-black opacity-80"
          data-testid={`puzzle-h5-target-${piece.id}`}
          style={{ left: `${piece.target.x * 100}%`, top: `${piece.target.y * 100}%`, backgroundColor: `${piece.color}22`, borderColor: piece.color, color: piece.color }}
        >
          {piece.label}
        </div>
      ))}
      {controller.pieces.map((piece) => <PuzzlePieceButton key={piece.id} controller={controller} piece={piece} stageRef={stageRef} />)}
      <div className="pointer-events-none absolute bottom-[12px] left-[16px] text-[12px] font-bold text-[#fde68a]" data-testid="puzzle-h5-progress">已归位 {controller.placedCount}/{controller.pieces.length}</div>
    </section>
  );
}

function PuzzleCanvasPiece({ controller, piece, plane, target }: { controller: PuzzleDragController; piece: PuzzlePieceState; plane: Plane; target: Vector3 }) {
  const [x, y] = getCanvasPoint(piece.point);
  const [targetX, targetY] = getCanvasPoint(piece.target);
  const targetOutlineGeometry = useMemo(() => new PlaneGeometry(0.95, 0.95), []);

  useEffect(() => {
    // 边框几何体传给 edgesGeometry 后仍由此处持有，组件卸载时需主动释放源几何体。
    return () => targetOutlineGeometry.dispose();
  }, [targetOutlineGeometry]);

  return (
    <>
      <mesh position={[targetX, targetY, -0.05]}>
        <planeGeometry args={[0.95, 0.95]} />
        <meshBasicMaterial color={piece.color} transparent opacity={0.12} />
      </mesh>
      <lineSegments position={[targetX, targetY, -0.02]}>
        <edgesGeometry args={[targetOutlineGeometry]} />
        <lineBasicMaterial color={piece.color} transparent opacity={0.9} />
      </lineSegments>
      <group
        position={[x, y, piece.status === "dragging" ? 0.25 : 0.12]}
        onPointerDown={(event) => {
          if (event.button !== 0 || piece.status === "placed") return;
          const point = readCanvasPoint(event, plane, target);
          if (!point || !controller.begin(piece.id, point)) return;
          event.stopPropagation();
          (event.target as ThreePointerCaptureTarget).setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const point = readCanvasPoint(event, plane, target);
          if (!point || !controller.move(piece.id, point)) return;
          event.stopPropagation();
        }}
        onPointerUp={(event) => {
          const point = readCanvasPoint(event, plane, target);
          if (!point) return;
          const outcome = controller.end(piece.id, point);
          if (outcome === "ignored") return;
          event.stopPropagation();
          (event.target as ThreePointerCaptureTarget).releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => controller.cancel(piece.id)}
      >
        <mesh>
          <planeGeometry args={[1.2, 1.2]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.8, 0.8, 0.12]} />
          <meshStandardMaterial color={piece.color} emissive={piece.color} emissiveIntensity={piece.status === "dragging" ? 0.55 : 0.18} metalness={0.35} roughness={0.25} />
        </mesh>
        <Suspense fallback={null}>
          <Text position={[0, 0, 0.1]} fontSize={0.28} color="#07111f" anchorX="center" anchorY="middle">{piece.label}</Text>
        </Suspense>
      </group>
    </>
  );
}

export function PuzzleCanvasDemo({ controller, onReady }: PuzzleDemoProps) {
  const { gl } = useThree();
  const plane = useMemo(() => new Plane(new Vector3(0, 0, 1), 0), []);
  const target = useMemo(() => new Vector3(), []);
  const boardOutlineGeometry = useMemo(() => new PlaneGeometry(BOARD_WIDTH, BOARD_HEIGHT), []);

  useEffect(() => {
    // boardOutlineGeometry 由组件创建且供 edgesGeometry 读取，卸载时必须释放。
    return () => boardOutlineGeometry.dispose();
  }, [boardOutlineGeometry]);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  useEffect(() => {
    const cancelCurrent = () => {
      if (controller.draggingPieceId) controller.cancel(controller.draggingPieceId);
    };
    gl.domElement.addEventListener("lostpointercapture", cancelCurrent);
    return () => gl.domElement.removeEventListener("lostpointercapture", cancelCurrent);
  }, [controller, gl]);

  return (
    <group>
      <mesh position={[0, 0, -0.3]}>
        <planeGeometry args={[BOARD_WIDTH, BOARD_HEIGHT]} />
        <meshBasicMaterial color="#07111f" transparent opacity={0.82} />
      </mesh>
      <lineSegments position={[0, 0, -0.25]}>
        <edgesGeometry args={[boardOutlineGeometry]} />
        <lineBasicMaterial color="#155e75" transparent opacity={0.9} />
      </lineSegments>
      <Suspense fallback={null}>
        <Text position={[-2.1, 1.35, -0.1]} fontSize={0.2} color="#cbd5e1" anchorX="center" anchorY="middle">Canvas Puzzle Board</Text>
        <Text position={[0, -1.42, -0.1]} fontSize={0.2} color="#fde68a" anchorX="center" anchorY="middle">拖动拼片至对应目标槽</Text>
      </Suspense>
      {controller.pieces.map((piece) => <PuzzleCanvasPiece key={piece.id} controller={controller} piece={piece} plane={plane} target={target} />)}
    </group>
  );
}
