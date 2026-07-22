import { useState } from "react";

import { spriteAtlas } from "../../sprite-atlas/index";
import type { GameAudioSnapshot } from "../utils/game-audio";
import { createSpriteAtlasStyle } from "../utils/sprite-atlas-style";
import type { DragDemoKind, DragDemoMode, DragDropResult, PuzzleDropOutcome } from "./drag-drop";

type PuzzleProgress = {
  isComplete: boolean;
  lastOutcome: PuzzleDropOutcome;
  placedCount: number;
  total: number;
};

type GameHudProps = {
  audioSettings: GameAudioSnapshot;
  dragKind: DragDemoKind;
  dragMode: DragDemoMode;
  dragResult: DragDropResult;
  puzzleProgress: PuzzleProgress;
  isFullscreen: boolean;
  onBgmVolumeChange: (volume: number) => void;
  onDragKindChange: (kind: DragDemoKind) => void;
  onDragModeChange: (mode: DragDemoMode) => void;
  onPlayEffect: () => void;
  onResetDrag: () => void;
  onSfxVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  resourceBaseUrl?: string;
  status: string;
};

function getDragStatus(result: DragDropResult, dragKind: DragDemoKind, puzzleProgress: PuzzleProgress) {
  if (dragKind === "puzzle") {
    if (puzzleProgress.isComplete) return "拼图完成";
    if (puzzleProgress.lastOutcome === "retry") return `上一片未命中，请继续拼图（${puzzleProgress.placedCount}/${puzzleProgress.total}）`;
    return `拖动拼片至对应目标槽（${puzzleProgress.placedCount}/${puzzleProgress.total}）`;
  }
  if (result === "success") return "投放成功";
  if (result === "retry") return "未命中目标，请重试";
  return "拖动信号核心至能量槽";
}

export function GameHud({ audioSettings, dragKind, dragMode, dragResult, puzzleProgress, isFullscreen, onBgmVolumeChange, onDragKindChange, onDragModeChange, onPlayEffect, onResetDrag, onSfxVolumeChange, onToggleMute, onToggleFullscreen, resourceBaseUrl, status }: GameHudProps) {
  const [isAudioPanelOpen, setIsAudioPanelOpen] = useState(false);
  const atlasFrame = spriteAtlas.get("after-time.png");
  const atlasPreview = createSpriteAtlasStyle(atlasFrame, { resourceBaseUrl, scale: 0.42 });
  const primaryControlStyle = { minHeight: 44 };

  return (
    <section
      className="pointer-events-none absolute inset-[0px] box-border flex h-full flex-col justify-between pt-[var(--safe-top)] pr-[var(--safe-right)] pb-[var(--safe-bottom)] pl-[var(--safe-left)]"
      data-testid="game-hud"
      aria-label="游戏控制"
    >
      <div
        className="pointer-events-none relative w-[min(100%,540px)] overflow-hidden border-[1px] border-[color:rgb(103_232_249_/_0.38)] bg-[linear-gradient(135deg,rgb(7_17_31_/_0.92),rgb(7_17_31_/_0.64))] px-[18px] py-[16px] shadow-[0_0_40px_rgb(14_116_144_/_0.18)] backdrop-blur-[12px]"
        data-testid="mission-brief"
      >
        <div className="absolute inset-y-[0px] left-[0px] w-[3px] bg-[var(--game-accent)] shadow-[0_0_18px_var(--game-accent)]" />
        <div className="flex items-center gap-[8px] text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--game-accent)]">
          <span className="h-[7px] w-[7px] rounded-full bg-[var(--game-accent)] shadow-[0_0_12px_var(--game-accent)]" />
          Sector 07 // System Online
        </div>
        <h1 className="mt-[10px] text-[clamp(44px,8vw,112px)] font-black leading-[0.86] tracking-[-0.06em] text-[var(--game-text)]">全屏场景</h1>
        <div className="mt-[14px] flex flex-wrap items-center gap-x-[12px] gap-y-[6px] text-[13px] leading-[18px] text-[var(--game-muted)]">
          <span className="rounded-full border-[1px] border-[color:rgb(103_232_249_/_0.28)] bg-[color:rgb(103_232_249_/_0.08)] px-[9px] py-[3px] font-bold text-[var(--game-accent)]" data-testid="mission-status">资源已同步</span>
          <span aria-live="polite">{status}</span>
        </div>
        <div className="mt-[16px] flex items-center gap-[12px] border-t-[1px] border-[color:rgb(103_232_249_/_0.16)] pt-[14px]">
          {atlasFrame && atlasPreview ? (
            <div data-testid="sprite-atlas-demo" aria-label="任务信号预览" className={`${atlasPreview.className} shrink-0 border-[1px] border-[color:rgb(103_232_249_/_0.45)] bg-[var(--game-bg)] p-[3px] shadow-[0_0_18px_rgb(14_116_144_/_0.28)]`} style={atlasPreview.style} />
          ) : null}
          <div className="min-w-[0px] text-[13px] leading-[18px] text-[var(--game-muted)]">
            <p className="font-bold uppercase tracking-[0.12em] text-[var(--game-accent)]">信号档案</p>
            <p className="mt-[2px] truncate">{atlasFrame ? `${atlasFrame.width} × ${atlasFrame.height} · 通讯模块` : "通讯模块待命"}</p>
            <p className="mt-[2px] text-[11px]" data-testid="asset-readiness">独立资源已就绪</p>
          </div>
        </div>
        <section className="pointer-events-auto mt-[16px] border-t-[1px] border-[color:rgb(103_232_249_/_0.16)] pt-[14px]" aria-label="拖拽演示控制">
          <div className="flex flex-wrap items-center justify-between gap-[10px]">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--game-accent)]">拖拽演示</div>
            <button type="button" data-testid="drag-reset-control" onClick={onResetDrag} className="h-[32px] border-[1px] border-[color:rgb(103_232_249_/_0.42)] px-[10px] text-[12px] font-bold text-[var(--game-text)]">
              重置当前模式
            </button>
          </div>
          <div className="mt-[10px] grid grid-cols-2 gap-[6px]" role="group" aria-label="演示类型">
            <button type="button" data-testid="drag-demo-single" aria-pressed={dragKind === "single"} onClick={() => onDragKindChange("single")} className={`h-[36px] border-[1px] px-[10px] text-[12px] font-bold ${dragKind === "single" ? "border-[var(--game-accent)] bg-[color:rgb(34_211_238_/_0.14)] text-[var(--game-accent)]" : "border-[color:rgb(103_232_249_/_0.28)] text-[var(--game-muted)]"}`}>
              单物体
            </button>
            <button type="button" data-testid="drag-demo-puzzle" aria-pressed={dragKind === "puzzle"} onClick={() => onDragKindChange("puzzle")} className={`h-[36px] border-[1px] px-[10px] text-[12px] font-bold ${dragKind === "puzzle" ? "border-[var(--game-accent)] bg-[color:rgb(34_211_238_/_0.14)] text-[var(--game-accent)]" : "border-[color:rgb(103_232_249_/_0.28)] text-[var(--game-muted)]"}`}>
              拼图
            </button>
          </div>
          <div className="mt-[6px] grid grid-cols-2 gap-[6px]" role="group" aria-label="拖拽渲染模式">
            <button type="button" data-testid="drag-mode-h5" aria-pressed={dragMode === "h5"} onClick={() => onDragModeChange("h5")} className={`h-[36px] border-[1px] px-[10px] text-[12px] font-bold ${dragMode === "h5" ? "border-[var(--game-accent)] bg-[color:rgb(34_211_238_/_0.14)] text-[var(--game-accent)]" : "border-[color:rgb(103_232_249_/_0.28)] text-[var(--game-muted)]"}`}>
              普通 H5
            </button>
            <button type="button" data-testid="drag-mode-canvas" aria-pressed={dragMode === "canvas"} onClick={() => onDragModeChange("canvas")} className={`h-[36px] border-[1px] px-[10px] text-[12px] font-bold ${dragMode === "canvas" ? "border-[var(--game-accent)] bg-[color:rgb(34_211_238_/_0.14)] text-[var(--game-accent)]" : "border-[color:rgb(103_232_249_/_0.28)] text-[var(--game-muted)]"}`}>
              Canvas
            </button>
          </div>
          <p className="mt-[9px] text-[12px] font-bold text-[#fde68a]" data-testid="drag-status" role="status" aria-live="polite">{getDragStatus(dragResult, dragKind, puzzleProgress)}</p>
        </section>
      </div>

      <div className="pointer-events-none flex items-end gap-[10px]" data-testid="mission-controls">
        <div className="pointer-events-auto relative">
          <button
            type="button"
            className="h-[46px] rounded-full border-[1px] border-[color:var(--game-accent)] bg-[color:rgb(14_116_144_/_0.82)] px-[18px] text-[14px] font-bold text-[var(--game-text)] shadow-[0_8px_24px_rgb(14_116_144_/_0.28)] transition hover:-translate-y-px hover:bg-[var(--game-button-hover)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[var(--game-focus)] motion-reduce:transition-none"
            data-testid="audio-settings-control"
            aria-controls="audio-settings-panel"
            aria-expanded={isAudioPanelOpen}
            onClick={() => setIsAudioPanelOpen((open) => !open)}
            style={primaryControlStyle}
          >
            音频控制
          </button>
          {isAudioPanelOpen ? (
            <section id="audio-settings-panel" data-testid="audio-settings-panel" className="absolute bottom-full left-[0px] mb-[10px] w-[280px] border-[1px] border-[color:rgb(103_232_249_/_0.45)] bg-[color:rgb(7_17_31_/_0.94)] p-[16px] text-[14px] text-[var(--game-text)] shadow-[0_20px_40px_rgb(0_0_0_/_0.36)] backdrop-blur-[14px]" aria-label="音频设置">
              <div className="flex items-center justify-between gap-[12px]">
                <span className="font-bold">总静音</span>
                <button type="button" data-testid="audio-mute-control" onClick={onToggleMute} className="h-[34px] rounded-[4px] border-[1px] border-[color:var(--game-accent)] px-[10px] text-[13px]">
                  {audioSettings.isMuted ? "已静音" : "开启"}
                </button>
              </div>
              <label className="mt-[14px] block text-[13px] text-[var(--game-muted)]">背景音乐<input data-testid="bgm-volume-control" className="mt-[6px] block w-full accent-[var(--game-accent)]" type="range" min="0" max="1" step="0.05" value={audioSettings.bgmVolume} onChange={(event) => onBgmVolumeChange(Number(event.target.value))} /></label>
              <label className="mt-[14px] block text-[13px] text-[var(--game-muted)]">效果音<input data-testid="sfx-volume-control" className="mt-[6px] block w-full accent-[var(--game-accent)]" type="range" min="0" max="1" step="0.05" value={audioSettings.sfxVolume} onChange={(event) => onSfxVolumeChange(Number(event.target.value))} /></label>
              <button type="button" data-testid="effect-control" onClick={onPlayEffect} className="mt-[16px] h-[38px] w-full border-[1px] border-[color:var(--game-accent)] bg-[color:rgb(103_232_249_/_0.08)] px-[10px] text-left text-[13px] font-bold text-[var(--game-accent)]">播放信号音</button>
            </section>
          ) : null}
        </div>
        <button type="button" className="pointer-events-auto h-[46px] rounded-full border-[1px] border-[color:rgb(224_242_254_/_0.42)] bg-[color:rgb(7_17_31_/_0.74)] px-[18px] text-[14px] font-bold text-[var(--game-text)] shadow-[0_8px_24px_rgb(0_0_0_/_0.2)] transition hover:-translate-y-px hover:border-[var(--game-accent)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[var(--game-focus)] motion-reduce:transition-none" data-testid="fullscreen-control" onClick={onToggleFullscreen} style={primaryControlStyle}>
          {isFullscreen ? "退出全屏" : "进入全屏"}
        </button>
      </div>
    </section>
  );
}
