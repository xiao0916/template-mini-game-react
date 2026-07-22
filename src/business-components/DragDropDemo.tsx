import type { PointerEvent as ReactPointerEvent } from "react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Text } from "@react-three/drei";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { Plane, PlaneGeometry, Vector3 } from "three";

export type DragDemoMode = "h5" | "canvas";
export type DragDropResult = "idle" | "retry" | "success";

type DragPoint = { x: number; y: number };

type DragDemoProps = {
  result: DragDropResult;
  onResultChange: (result: DragDropResult) => void;
};

type CanvasDragDemoProps = DragDemoProps & {
  onReady: () => void;
};

type ThreePointerCaptureTarget = EventTarget & {
  releasePointerCapture: (pointerId: number) => void;
  setPointerCapture: (pointerId: number) => void;
};

const H5_START: DragPoint = { x: 0.18, y: 0.54 };
const H5_TARGET: DragPoint = { x: 0.78, y: 0.54 };
type CanvasDemoLayout = {
  boardCenter: DragPoint;
  boardSize: [number, number];
  instruction: string;
  instructionPosition: DragPoint;
  start: DragPoint;
  target: DragPoint;
  targetLabelPosition: DragPoint;
  titlePosition: DragPoint;
};

const CANVAS_LANDSCAPE_LAYOUT: CanvasDemoLayout = {
  boardCenter: { x: 0.75, y: -0.85 },
  boardSize: [6.4, 2.5],
  instruction: "→ 将核心拖到此处 →",
  instructionPosition: { x: 0.75, y: -0.48 },
  start: { x: -0.65, y: -0.85 },
  target: { x: 2.2, y: -0.85 },
  targetLabelPosition: { x: 2.2, y: -1.72 },
  titlePosition: { x: 0.75, y: 0.08 },
};

const CANVAS_PORTRAIT_LAYOUT: CanvasDemoLayout = {
  boardCenter: { x: 0, y: -0.15 },
  boardSize: [2.7, 5.3],
  instruction: "↑ 将核心拖到此处 ↑",
  instructionPosition: { x: 0, y: 0.62 },
  start: { x: 0, y: -1.3 },
  target: { x: 0, y: 1.15 },
  targetLabelPosition: { x: 0, y: 0.22 },
  titlePosition: { x: 0, y: 2.05 },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isNearTarget(point: DragPoint, target: DragPoint, radius: number) {
  return Math.hypot(point.x - target.x, point.y - target.y) <= radius;
}

export function H5DragDropDemo({ onResultChange, result }: DragDemoProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [point, setPoint] = useState(H5_START);

  useEffect(() => {
    if (draggingRef.current) return;
    setPoint(result === "success" ? H5_TARGET : H5_START);
  }, [result]);

  const readPointerPoint = (event: ReactPointerEvent<HTMLButtonElement>): DragPoint | null => {
    const stage = stageRef.current;
    if (!stage) return null;
    const rect = stage.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const physicalPoint = {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
    const rotation = stage.closest<HTMLElement>("[data-rotation]")?.dataset.rotation;
    const logicalPoint = rotation === "90"
      ? { x: physicalPoint.y, y: 1 - physicalPoint.x }
      : rotation === "-90"
        ? { x: 1 - physicalPoint.y, y: physicalPoint.x }
        : physicalPoint;

    return {
      x: clamp(logicalPoint.x, 0.08, 0.92),
      y: clamp(logicalPoint.y, 0.18, 0.82),
    };
  };

  const completeDrag = (nextPoint: DragPoint) => {
    draggingRef.current = false;
    if (isNearTarget(nextPoint, H5_TARGET, 0.14)) {
      setPoint(H5_TARGET);
      onResultChange("success");
      return;
    }
    setPoint(H5_START);
    onResultChange("retry");
  };

  return (
    <section
      ref={stageRef}
      className="pointer-events-none absolute left-[62%] top-[55%] z-10 h-[min(36vw,340px)] w-[min(74vw,720px)] min-h-[150px] min-w-[300px] -translate-x-1/2 -translate-y-1/2 select-none border-[1px] border-[color:rgb(103_232_249_/_0.3)] bg-[linear-gradient(135deg,rgb(7_17_31_/_0.74),rgb(14_116_144_/_0.22))] shadow-[0_0_44px_rgb(14_116_144_/_0.18)] touch-none"
      data-testid="h5-drag-stage"
      aria-label="普通 H5 拖放演示区"
    >
      <div className="pointer-events-none absolute inset-[12px] border-[1px] border-dashed border-[color:rgb(103_232_249_/_0.2)]" />
      <div className="pointer-events-none absolute left-[16px] top-[14px] text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--game-muted)]">H5 Pointer Capture</div>
      <div
        className="pointer-events-none absolute grid h-[22%] min-h-[58px] w-[18%] min-w-[58px] place-items-center border-[1px] border-[color:rgb(250_204_21_/_0.7)] bg-[color:rgb(250_204_21_/_0.1)] text-[10px] font-bold uppercase tracking-[0.12em] text-[#fde68a] shadow-[0_0_26px_rgb(250_204_21_/_0.18)]"
        data-testid="h5-drop-target"
        style={{ left: `${H5_TARGET.x * 100}%`, top: `${H5_TARGET.y * 100}%`, transform: "translate(-50%, -50%)" }}
      >
        能量槽
      </div>
      <button
        type="button"
        className="pointer-events-auto absolute grid h-[20%] min-h-[54px] w-[16%] min-w-[54px] cursor-grab place-items-center rounded-full border-[1px] border-[color:rgb(103_232_249_/_0.82)] bg-[radial-gradient(circle_at_35%_30%,#e0f2fe,#22d3ee_36%,#0e7490_72%)] text-[9px] font-black uppercase tracking-[0.12em] text-[#042f3a] shadow-[0_0_30px_rgb(34_211_238_/_0.72)] active:cursor-grabbing"
        data-testid="h5-drag-item"
        aria-label="可拖动的信号核心"
        style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%`, transform: "translate(-50%, -50%)" }}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          const nextPoint = readPointerPoint(event);
          if (!nextPoint) return;
          draggingRef.current = true;
          if (result === "success") onResultChange("idle");
          event.currentTarget.setPointerCapture(event.pointerId);
          setPoint(nextPoint);
        }}
        onPointerMove={(event) => {
          if (!draggingRef.current) return;
          const nextPoint = readPointerPoint(event);
          if (nextPoint) setPoint(nextPoint);
        }}
        onPointerUp={(event) => {
          if (!draggingRef.current) return;
          const nextPoint = readPointerPoint(event);
          if (!nextPoint) return;
          completeDrag(nextPoint);
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          if (!draggingRef.current) return;
          draggingRef.current = false;
          setPoint(H5_START);
          onResultChange("retry");
        }}
        onLostPointerCapture={() => {
          if (!draggingRef.current) return;
          draggingRef.current = false;
          setPoint(H5_START);
          onResultChange("retry");
        }}
      >
        核心
      </button>
    </section>
  );
}

export function CanvasDragDropDemo({ onReady, onResultChange, result }: CanvasDragDemoProps) {
  const { gl, size } = useThree();
  const draggingRef = useRef(false);
  const dragPlane = useMemo(() => new Plane(new Vector3(0, 0, 1), 0), []);
  const dragPoint = useMemo(() => new Vector3(), []);
  const layout = size.height > size.width ? CANVAS_PORTRAIT_LAYOUT : CANVAS_LANDSCAPE_LAYOUT;
  const [point, setPoint] = useState(CANVAS_LANDSCAPE_LAYOUT.start);

  useEffect(() => {
    if (draggingRef.current) return;
    setPoint(result === "success" ? layout.target : layout.start);
  }, [layout, result]);

  useEffect(() => {
    onReady();
  }, [onReady]);

  const readPointerPoint = (event: ThreeEvent<PointerEvent>): DragPoint | null => {
    const hit = event.ray.intersectPlane(dragPlane, dragPoint);
    if (!hit) return null;
    return {
      x: clamp(hit.x, -2.6, 2.6),
      y: clamp(hit.y, -1.35, 1.35),
    };
  };

  const completeDrag = (nextPoint: DragPoint) => {
    draggingRef.current = false;
    if (isNearTarget(nextPoint, layout.target, 1.1)) {
      setPoint(layout.target);
      onResultChange("success");
      return;
    }
    setPoint(layout.start);
    onResultChange("retry");
  };

  useEffect(() => {
    const resetAfterCaptureLoss = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setPoint(layout.start);
      onResultChange("retry");
    };
    const canvas = gl.domElement;

    canvas.addEventListener("lostpointercapture", resetAfterCaptureLoss);
    return () => canvas.removeEventListener("lostpointercapture", resetAfterCaptureLoss);
  }, [gl, layout, onResultChange]);

  return (
    <group>
      <mesh position={[layout.boardCenter.x, layout.boardCenter.y, -0.24]}>
        <planeGeometry args={layout.boardSize} />
        <meshBasicMaterial color="#07111f" transparent opacity={0.78} />
      </mesh>
      <lineSegments position={[layout.boardCenter.x, layout.boardCenter.y, -0.2]}>
        <edgesGeometry args={[new PlaneGeometry(...layout.boardSize)]} />
        <lineBasicMaterial color="#155e75" transparent opacity={0.9} />
      </lineSegments>
      <Suspense fallback={null}>
        <Text position={[layout.titlePosition.x, layout.titlePosition.y, -0.1]} fontSize={0.2} color="#cbd5e1" anchorX="center" anchorY="middle">Canvas Pointer Drag</Text>
        <Text position={[layout.instructionPosition.x, layout.instructionPosition.y, -0.1]} fontSize={0.25} color="#facc15" anchorX="center" anchorY="middle">{layout.instruction}</Text>
      </Suspense>
      <mesh position={[layout.target.x, layout.target.y, 0]} rotation={[0, 0, 0.24]}>
        <torusGeometry args={[0.72, 0.07, 16, 64]} />
        <meshBasicMaterial color="#facc15" transparent opacity={0.9} />
      </mesh>
      <mesh position={[layout.target.x, layout.target.y, -0.08]}>
        <circleGeometry args={[0.6, 48]} />
        <meshBasicMaterial color="#facc15" transparent opacity={0.14} />
      </mesh>
      <Suspense fallback={null}>
        <Text position={[layout.targetLabelPosition.x, layout.targetLabelPosition.y, -0.1]} fontSize={0.18} color="#fde68a" anchorX="center" anchorY="middle">能量槽</Text>
      </Suspense>
      <group
        position={[point.x, point.y, 0.12]}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.stopPropagation();
          draggingRef.current = true;
          if (result === "success") onResultChange("idle");
          (event.target as ThreePointerCaptureTarget).setPointerCapture(event.pointerId);
          const nextPoint = readPointerPoint(event);
          if (nextPoint) setPoint(nextPoint);
        }}
        onPointerMove={(event) => {
          if (!draggingRef.current) return;
          event.stopPropagation();
          const nextPoint = readPointerPoint(event);
          if (nextPoint) setPoint(nextPoint);
        }}
        onPointerUp={(event) => {
          if (!draggingRef.current) return;
          event.stopPropagation();
          const nextPoint = readPointerPoint(event);
          if (nextPoint) completeDrag(nextPoint);
          (event.target as ThreePointerCaptureTarget).releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          if (!draggingRef.current) return;
          draggingRef.current = false;
          setPoint(layout.start);
          onResultChange("retry");
        }}
      >
        <mesh>
          <sphereGeometry args={[1.1, 24, 24]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[0.64, 2]} />
          <meshStandardMaterial color="#67e8f9" emissive="#0891b2" emissiveIntensity={1.4} metalness={0.72} roughness={0.16} />
        </mesh>
      </group>
    </group>
  );
}
