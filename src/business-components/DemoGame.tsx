import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";

import type { GameRenderProps } from "../components/GameFrame";
import { gameAudio, type GameAudioSnapshot } from "../utils/game-audio";
import { CanvasDragDropDemo, H5DragDropDemo, type DragDemoMode, type DragDropResult } from "./drag-drop";
import { GameHud } from "./GameHud";

export function DemoGame({ isFullscreen, options, pixelRatio, toggleFullscreen }: GameRenderProps) {
  const [status, setStatus] = useState("游戏已就绪");
  const [audioSettings, setAudioSettings] = useState<GameAudioSnapshot>(() => gameAudio.getSnapshot());
  const [dragMode, setDragMode] = useState<DragDemoMode>("h5");
  const [dragResults, setDragResults] = useState<Record<DragDemoMode, DragDropResult>>({ canvas: "idle", h5: "idle" });
  const [isCanvasReady, setCanvasReady] = useState(false);
  const canvasStageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStatus(isFullscreen ? "已进入全屏" : "游戏已就绪");
  }, [isFullscreen]);

  useEffect(() => {
    if (dragMode !== "canvas") return;
    const frame = window.requestAnimationFrame(() => {
      const canvas = canvasStageRef.current?.querySelector("canvas");
      if (!canvas) return;

      // R3F 内层 canvas 会保留浏览器的 300 × 150 固有 CSS 尺寸，需与舞台同步以保证射线坐标正确。
      canvas.style.height = "100%";
      canvas.style.width = "100%";
    });
    return () => window.cancelAnimationFrame(frame);
  }, [dragMode]);

  useEffect(() => {
    if (dragMode === "h5") setCanvasReady(false);
  }, [dragMode]);

  useEffect(() => {
    gameAudio.configure({ resourceBaseUrl: options.resourceBaseUrl });
    const unsubscribe = gameAudio.subscribe(setAudioSettings);
    let isUnlocking = false;
    const removeUnlockListeners = () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("touchend", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
    const unlockAudio = () => {
      if (isUnlocking) return;
      isUnlocking = true;
      void gameAudio.unlockAndPlayBgm().then((result) => {
        isUnlocking = false;
        if (result === "played") removeUnlockListeners();
      });
    };

    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("touchend", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio);
    return () => {
      unsubscribe();
      removeUnlockListeners();
    };
  }, [options.resourceBaseUrl]);

  const handleToggleFullscreen = async () => {
    void gameAudio.playSfx("ui-click");
    const result = await toggleFullscreen();
    if (result === "unsupported") setStatus("当前浏览器不支持原生全屏");
    if (result === "failed") setStatus("无法进入全屏，仍保持当前布局");
  };

  const dragResult = dragResults[dragMode];
  const setDragResult = (result: DragDropResult) => {
    setDragResults((current) => ({ ...current, [dragMode]: result }));
  };

  return (
    <>
      {dragMode === "canvas" ? (
        <div ref={canvasStageRef} className="h-full w-full">
          <Canvas
            camera={{ fov: 48, position: [0, 0.45, 7.6] }}
            className="block h-full w-full touch-none"
            data-canvas-ready={isCanvasReady ? "true" : undefined}
            data-testid="game-canvas"
            dpr={pixelRatio}
            gl={{ antialias: true, powerPreference: "high-performance" }}
            resize={{ offsetSize: true, scroll: false }}
          >
            <color attach="background" args={["#07111f"]} />
            <ambientLight intensity={0.65} />
            <directionalLight color="#e0f2fe" intensity={2.2} position={[4, 5, 4]} />
            <pointLight color="#22d3ee" intensity={22} position={[-3, 1, 3]} distance={14} />
            <CanvasDragDropDemo result={dragResult} onReady={() => setCanvasReady(true)} onResultChange={setDragResult} />
          </Canvas>
        </div>
      ) : <H5DragDropDemo result={dragResult} onResultChange={setDragResult} />}
      <GameHud
        audioSettings={audioSettings}
        dragMode={dragMode}
        dragResult={dragResult}
        isFullscreen={isFullscreen}
        onBgmVolumeChange={gameAudio.setBgmVolume}
        onDragModeChange={setDragMode}
        onPlayEffect={() => void gameAudio.playSfx("effect")}
        onResetDrag={() => setDragResult("idle")}
        onSfxVolumeChange={gameAudio.setSfxVolume}
        onToggleMute={() => gameAudio.setMuted(!gameAudio.getSnapshot().isMuted)}
        onToggleFullscreen={handleToggleFullscreen}
        resourceBaseUrl={options.resourceBaseUrl}
        status={status}
      />
    </>
  );
}
