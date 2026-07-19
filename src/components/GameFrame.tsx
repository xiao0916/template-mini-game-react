import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { GameSDKOptions } from "game-sdk-builder";

import { isElementFullscreen, toggleElementFullscreen } from "../utils/fullscreen";

export type FullscreenToggleResult = "entered" | "exited" | "failed" | "unsupported";

export type GameRenderProps = {
  isFullscreen: boolean;
  options: GameSDKOptions;
  pixelRatio: number;
  toggleFullscreen: () => Promise<FullscreenToggleResult>;
};

export type GameViewport = {
  width: number;
  height: number;
};

type GameFrameProps = {
  children: (props: Omit<GameRenderProps, "options" | "pixelRatio"> & { viewport: GameViewport }) => ReactNode;
};

export function GameFrame({ children }: GameFrameProps) {
  const gameRef = useRef<HTMLElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewport, setViewport] = useState<GameViewport>({ height: 0, width: 0 });

  useLayoutEffect(() => {
    const gameElement = gameRef.current;
    if (!gameElement) return;
    const updateViewport = () => {
      const nextViewport = { height: gameElement.clientHeight, width: gameElement.clientWidth };
      setViewport((current) => current.height === nextViewport.height && current.width === nextViewport.width ? current : nextViewport);
    };
    const observer = new ResizeObserver(updateViewport);

    observer.observe(gameElement);
    updateViewport();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const syncFullscreenState = () => setIsFullscreen(isElementFullscreen(gameRef.current));

    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  const toggleFullscreen = useCallback(async (): Promise<FullscreenToggleResult> => {
    const gameElement = gameRef.current;
    if (!gameElement || !document.fullscreenEnabled) return "unsupported";

    const wasFullscreen = isElementFullscreen(gameElement);
    try {
      await toggleElementFullscreen(gameElement);
      return wasFullscreen ? "exited" : "entered";
    } catch {
      return "failed";
    }
  }, []);

  return (
    <main
      ref={gameRef}
      className="fixed inset-0 h-[100dvh] w-screen overflow-hidden bg-[var(--game-bg)]"
      data-testid="game-shell"
      aria-label="游戏视口"
    >
      {children({ isFullscreen, toggleFullscreen, viewport })}
    </main>
  );
}
