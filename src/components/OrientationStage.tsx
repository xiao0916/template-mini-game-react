import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import {
  getOrientationStageLayout,
  type GameOrientation,
  type RotationStrategy,
} from "../utils/orientation";
import { useResponsiveRootFontSize } from "../utils/root-font-size";
import type { GameViewport } from "./GameFrame";

type OrientationStageProps = {
  children: ReactNode;
  manageRootFontSize?: boolean;
  target?: GameOrientation;
  rotationStrategy?: RotationStrategy;
  viewport: GameViewport;
};

function getViewportLayout(viewport: GameViewport, target: GameOrientation, rotationStrategy: RotationStrategy, screenAngle?: number) {
  return getOrientationStageLayout({
    height: viewport.height,
    isTouchDevice: navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches,
    rotationStrategy,
    screenAngle,
    target,
    width: viewport.width,
  });
}

export function OrientationStage({ children, manageRootFontSize = false, rotationStrategy = "auto", target = "portrait", viewport }: OrientationStageProps) {
  const [screenAngle, setScreenAngle] = useState(() => screen.orientation?.angle);

  useEffect(() => {
    const orientation = screen.orientation;
    const updateScreenAngle = () => setScreenAngle(orientation?.angle);

    window.addEventListener("orientationchange", updateScreenAngle);
    orientation?.addEventListener("change", updateScreenAngle);
    return () => {
      window.removeEventListener("orientationchange", updateScreenAngle);
      orientation?.removeEventListener("change", updateScreenAngle);
    };
  }, []);

  const layout = getViewportLayout(viewport, target, rotationStrategy, screenAngle);
  useResponsiveRootFontSize({
    enabled: manageRootFontSize,
    height: viewport.height,
    shouldRotate: layout.shouldRotate,
    width: viewport.width,
  });

  const safeArea = Object.fromEntries(
    Object.entries(layout.safeArea).flatMap(([edge, physicalEdge]) => [
      [`--orientation-safe-${edge}`, `var(--physical-safe-${physicalEdge})`],
      [`--safe-${edge}`, `var(--physical-safe-${physicalEdge})`],
    ]),
  );
  const style = {
    ...safeArea,
    height: layout.height,
    transform: `translate(-50%, -50%) rotate(${layout.rotation}deg)`,
    width: layout.width,
  } as CSSProperties;

  return (
    <div
      className="absolute left-1/2 top-1/2 overflow-hidden bg-[var(--game-bg)]"
      data-rotation={layout.rotation}
      data-testid="game-stage"
      style={style}
    >
      {children}
    </div>
  );
}
