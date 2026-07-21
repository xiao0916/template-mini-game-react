import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { Plane, Vector3 } from "three";

export type DragDemoMode = "h5" | "canvas";
export type DragDropResult = "idle" | "retry" | "success";

type DragPoint = { x: number; y: number };

type DragDemoProps = {
  result: DragDropResult;
  onResultChange: (result: DragDropResult) => void;
};

type ThreePointerCaptureTarget = EventTarget & {
  releasePointerCapture: (pointerId: number) => void;
  setPointerCapture: (pointerId: number) => void;
};

const H5_START: DragPoint = { x: 0.18, y: 0.54 };
const H5_TARGET: DragPoint = { x: 0.78, y: 0.54 };
const CANVAS_START: DragPoint = { x: 0, y: -1.15 };
const CANVAS_TARGET: DragPoint = { x: 0, y: -0.15 };

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
    setPoint(result === "success" ? H5_TARGET : H5_START);
  }, [result]);

  const readPointerPoint = (event: ReactPointerEvent<HTMLButtonElement>): DragPoint | null => {
    const stage = stageRef.current;
    if (!stage) return null;
    const rect = stage.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return {
      x: clamp((event.clientX - rect.left) / rect.width, 0.08, 0.92),
      y: clamp((event.clientY - rect.top) / rect.height, 0.18, 0.82),
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
        className="pointer-events-auto absolute grid h-[20%] min-h-[54px] w-[16%] min-w-[54px] cursor-grab place-items-center rounded-full border-[1px] border-[color:rgb(103_232_249_/_0.82)] bg-[radial-gradient(circle_at_35%_30%,#e0f2fe,#22d3ee_36%,#0e7490_72%)] text-[9px] font-black uppercase tracking-[0.12em] text-[#042f3a] shadow-[0_0_30px_rgb(34_211_238_/_0.72)] active:cursor-grabbing disabled:cursor-default"
        data-testid="h5-drag-item"
        aria-label="可拖动的信号核心"
        disabled={result === "success"}
        style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%`, transform: "translate(-50%, -50%)" }}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          const nextPoint = readPointerPoint(event);
          if (!nextPoint) return;
          draggingRef.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          setPoint(nextPoint);
          onResultChange("idle");
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

export function CanvasDragDropDemo({ onResultChange, result }: DragDemoProps) {
  const { gl } = useThree();
  const draggingRef = useRef(false);
  const dragPlane = useMemo(() => new Plane(new Vector3(0, 0, 1), 0), []);
  const dragPoint = useMemo(() => new Vector3(), []);
  const [point, setPoint] = useState(CANVAS_START);

  useEffect(() => {
    setPoint(result === "success" ? CANVAS_TARGET : CANVAS_START);
  }, [result]);

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
    if (isNearTarget(nextPoint, CANVAS_TARGET, 1.1)) {
      setPoint(CANVAS_TARGET);
      onResultChange("success");
      return;
    }
    setPoint(CANVAS_START);
    onResultChange("retry");
  };

  useEffect(() => {
    const resetAfterCaptureLoss = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setPoint(CANVAS_START);
      onResultChange("retry");
    };
    const canvas = gl.domElement;

    canvas.addEventListener("lostpointercapture", resetAfterCaptureLoss);
    return () => canvas.removeEventListener("lostpointercapture", resetAfterCaptureLoss);
  }, [gl, onResultChange]);

  return (
    <group>
      <mesh position={[CANVAS_TARGET.x, CANVAS_TARGET.y, 0]} rotation={[0, 0, 0.24]}>
        <torusGeometry args={[0.72, 0.07, 16, 64]} />
        <meshBasicMaterial color="#facc15" transparent opacity={0.9} />
      </mesh>
      <mesh position={[CANVAS_TARGET.x, CANVAS_TARGET.y, -0.08]}>
        <circleGeometry args={[0.6, 48]} />
        <meshBasicMaterial color="#facc15" transparent opacity={0.14} />
      </mesh>
      <group
        position={[point.x, point.y, 0.12]}
        onPointerDown={(event) => {
          if (result === "success" || event.button !== 0) return;
          event.stopPropagation();
          draggingRef.current = true;
          (event.target as ThreePointerCaptureTarget).setPointerCapture(event.pointerId);
          const nextPoint = readPointerPoint(event);
          if (nextPoint) setPoint(nextPoint);
          onResultChange("idle");
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
          setPoint(CANVAS_START);
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
