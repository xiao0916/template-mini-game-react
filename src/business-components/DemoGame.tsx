import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";

import type { GameRenderProps } from "../components/GameFrame";
import { gameAudio, type GameAudioSnapshot } from "../utils/game-audio";
import { GameHud } from "./GameHud";
import { StarterScene } from "./StarterScene";

export function DemoGame({ isFullscreen, options, pixelRatio, toggleFullscreen }: GameRenderProps) {
  const [status, setStatus] = useState("游戏已就绪");
  const [audioSettings, setAudioSettings] = useState<GameAudioSnapshot>(() => gameAudio.getSnapshot());

  useEffect(() => {
    setStatus(isFullscreen ? "已进入全屏" : "游戏已就绪");
  }, [isFullscreen]);

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

  return (
    <>
      <Canvas
        className="block h-full w-full touch-none"
        data-testid="game-canvas"
        dpr={pixelRatio}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        resize={{ offsetSize: true, scroll: false }}
      >
        <StarterScene />
      </Canvas>
      <GameHud
        audioSettings={audioSettings}
        isFullscreen={isFullscreen}
        onBgmVolumeChange={gameAudio.setBgmVolume}
        onPlayEffect={() => void gameAudio.playSfx("effect")}
        onSfxVolumeChange={gameAudio.setSfxVolume}
        onToggleMute={() => gameAudio.setMuted(!gameAudio.getSnapshot().isMuted)}
        onToggleFullscreen={handleToggleFullscreen}
        resourceBaseUrl={options.resourceBaseUrl}
        status={status}
      />
    </>
  );
}
