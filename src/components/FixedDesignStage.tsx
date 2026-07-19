import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { getContainedStageLayout, type ContainedStageLayout, type GameDesign } from "../utils/design-stage";

type FixedDesignStageProps = {
  design: GameDesign;
  children: (layout: ContainedStageLayout) => ReactNode;
};

type SafeArea = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

function readSafeArea(element: HTMLElement): SafeArea {
  const style = getComputedStyle(element);
  return {
    bottom: Number.parseFloat(style.paddingBottom),
    left: Number.parseFloat(style.paddingLeft),
    right: Number.parseFloat(style.paddingRight),
    top: Number.parseFloat(style.paddingTop),
  };
}

export function FixedDesignStage({ children, design }: FixedDesignStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const safeAreaProbeRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<ContainedStageLayout | null>(null);
  const [safeArea, setSafeArea] = useState<SafeArea>({ bottom: 0, left: 0, right: 0, top: 0 });

  useLayoutEffect(() => {
    const updateLayout = () => {
      const container = containerRef.current;
      const safeAreaProbe = safeAreaProbeRef.current;
      if (!container || !safeAreaProbe) return;

      const nextLayout = getContainedStageLayout({
        design,
        devicePixelRatio: window.devicePixelRatio,
        height: container.offsetHeight,
        width: container.offsetWidth,
      });
      setLayout(nextLayout);
      setSafeArea(readSafeArea(safeAreaProbe));
    };

    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(updateLayout);

    observer.observe(container);
    window.addEventListener("orientationchange", updateLayout);
    window.addEventListener("resize", updateLayout);
    updateLayout();
    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", updateLayout);
      window.removeEventListener("resize", updateLayout);
    };
  }, [design]);

  const scaledSafeArea = layout && layout.scale > 0
    ? {
        "--safe-bottom": `${safeArea.bottom / layout.scale}px`,
        "--safe-left": `${safeArea.left / layout.scale}px`,
        "--safe-right": `${safeArea.right / layout.scale}px`,
        "--safe-top": `${safeArea.top / layout.scale}px`,
      }
    : {};
  const stageStyle = layout
    ? {
        ...scaledSafeArea,
        height: `${design.height}px`,
        transform: `translate(-50%, -50%) scale(${layout.scale})`,
        width: `${design.width}px`,
      } as CSSProperties
    : undefined;

  return (
    <div ref={containerRef} className="absolute inset-0" data-testid="design-stage-container">
      <div
        ref={safeAreaProbeRef}
        className="invisible absolute"
        style={{ padding: "var(--safe-top) var(--safe-right) var(--safe-bottom) var(--safe-left)" }}
      />
      {layout && layout.scale > 0 && (
        <div
          className="absolute left-1/2 top-1/2 overflow-hidden bg-[var(--game-bg)]"
          data-testid="design-stage"
          style={stageStyle}
        >
          {children(layout)}
        </div>
      )}
    </div>
  );
}
