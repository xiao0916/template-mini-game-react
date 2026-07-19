import { useState } from "react";

import type { GameAudioSnapshot } from "../utils/game-audio";
import { createSpriteAtlasStyle } from "../utils/sprite-atlas-style";
import { spriteAtlas } from "../../sprite-atlas/index";

type GameHudProps = {
  audioSettings: GameAudioSnapshot;
  isFullscreen: boolean;
  onBgmVolumeChange: (volume: number) => void;
  onPlayEffect: () => void;
  onSfxVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  resourceBaseUrl?: string;
  status: string;
};

export function GameHud({ audioSettings, isFullscreen, onBgmVolumeChange, onPlayEffect, onSfxVolumeChange, onToggleMute, onToggleFullscreen, resourceBaseUrl, status }: GameHudProps) {
  const [isAudioPanelOpen, setIsAudioPanelOpen] = useState(false);
  const atlasFrame = spriteAtlas.get("after-time.png");
  const atlasPreview = createSpriteAtlasStyle(atlasFrame, { resourceBaseUrl, scale: 0.42 });

  return (
    <section
      className="pointer-events-none absolute inset-0 flex flex-col items-start gap-4 pt-[var(--safe-top)] pr-[var(--safe-right)] pb-[var(--safe-bottom)] pl-[var(--safe-left)]"
      data-testid="game-hud"
      aria-label="游戏控制"
    >
      <div className="self-start text-[var(--game-text)] uppercase tracking-[0.08em]">
        <span className="text-[0.68rem] font-bold text-[var(--game-accent)]">THREE GAME STARTER</span>
        <strong className="mt-0.5 block text-[clamp(1.5rem,5vw,3rem)] leading-none">全屏场景</strong>
        <p className="mt-2 text-[0.78rem] normal-case tracking-normal text-[var(--game-muted)]" aria-live="polite">
          {status}
        </p>
        {atlasFrame && atlasPreview ? (
          <div className="mt-3 flex items-center gap-3 normal-case tracking-normal">
            <div data-testid="sprite-atlas-demo" aria-label="图集小图预览" className={`${atlasPreview.className} shrink-0 rounded border border-[color:var(--game-accent)] bg-[var(--game-bg)] shadow-[0_0_18px_color-mix(in_srgb,var(--game-accent)_28%,transparent)]`} style={atlasPreview.style} />
            <p className="max-w-44 text-[0.65rem] leading-relaxed text-[var(--game-muted)]">
              <code className="text-[var(--game-accent)]">spriteAtlas.get("after-time.png")</code>
              <br />
              {atlasFrame.x}, {atlasFrame.y} · {atlasFrame.width} × {atlasFrame.height}
            </p>
          </div>
        ) : null}
        <p data-testid="sprite-atlas-miss" className="mt-2 text-[0.65rem] normal-case tracking-normal text-[var(--game-muted)]">
          spriteAtlas.get("dialog-bg.png")：未合并，继续独立加载
        </p>
      </div>
      <div className="pointer-events-auto flex self-start items-end gap-2">
        <div className="relative">
          <button
            type="button"
            className="rounded-full border border-[color:var(--game-accent)] bg-[var(--game-button)] px-4 py-2.5 text-[0.82rem] font-bold text-[var(--game-text)] transition hover:-translate-y-px hover:bg-[var(--game-button-hover)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--game-focus)] motion-reduce:transition-none"
            data-testid="audio-settings-control"
            aria-controls="audio-settings-panel"
            aria-expanded={isAudioPanelOpen}
            onClick={() => setIsAudioPanelOpen((open) => !open)}
          >
            音频
          </button>
          {isAudioPanelOpen ? (
            <section id="audio-settings-panel" data-testid="audio-settings-panel" className="absolute bottom-full right-0 mb-2 w-56 rounded-xl border border-[color:var(--game-accent)] bg-[var(--game-bg)] p-3 text-sm text-[var(--game-text)] shadow-xl" aria-label="音频设置">
              <div className="flex items-center justify-between gap-3">
                <span>总静音</span>
                <button type="button" data-testid="audio-mute-control" onClick={onToggleMute} className="rounded border border-[color:var(--game-accent)] px-2 py-1">
                  {audioSettings.isMuted ? "已静音" : "开启"}
                </button>
              </div>
              <label className="mt-3 block">背景音乐<input data-testid="bgm-volume-control" className="mt-1 block w-full" type="range" min="0" max="1" step="0.05" value={audioSettings.bgmVolume} onChange={(event) => onBgmVolumeChange(Number(event.target.value))} /></label>
              <label className="mt-3 block">效果音<input data-testid="sfx-volume-control" className="mt-1 block w-full" type="range" min="0" max="1" step="0.05" value={audioSettings.sfxVolume} onChange={(event) => onSfxVolumeChange(Number(event.target.value))} /></label>
              <button type="button" data-testid="effect-control" onClick={onPlayEffect} className="mt-3 w-full rounded border border-[color:var(--game-accent)] px-2 py-1 text-left">播放效果音</button>
            </section>
          ) : null}
        </div>
        <button type="button" className="rounded-full border border-[color:var(--game-accent)] bg-[var(--game-button)] px-4 py-2.5 text-[0.82rem] font-bold text-[var(--game-text)] transition hover:-translate-y-px hover:bg-[var(--game-button-hover)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--game-focus)] motion-reduce:transition-none" data-testid="fullscreen-control" onClick={onToggleFullscreen}>
          {isFullscreen ? "退出全屏" : "进入全屏"}
        </button>
      </div>
    </section>
  );
}
