import { useEffect, useState, type ReactNode } from "react";

import { resourceManifest } from "../../resource-preload/manifest";
import { preloadResources, type ResourceLoadProgress } from "../../resource-preload";

type LoadingStatus = "error" | "loading" | "ready";

export type GameLoadingSnapshot = ResourceLoadProgress & {
  retry: () => void;
  status: LoadingStatus;
};

type GameLoadingProps = {
  children: ReactNode;
  renderLoading?: (snapshot: GameLoadingSnapshot) => ReactNode;
  resourceBaseUrl?: string;
};

function getInitialProgress(): ResourceLoadProgress {
  return {
    failed: [],
    loaded: 0,
    progress: 0,
    total: resourceManifest.length,
  };
}

function DefaultLoading({ failed, loaded, progress, retry, status, total }: GameLoadingSnapshot) {
  const hasError = status === "error";
  const title = hasError ? "资源同步受阻" : "资源同步中";

  return (
    <section className="relative flex h-full w-full items-center justify-center overflow-hidden text-[var(--game-text)]" data-testid="game-loading" aria-live="polite" aria-label={hasError ? "资源加载失败" : "游戏加载中"}>
      <div className="pointer-events-none absolute inset-[0px] bg-[radial-gradient(circle_at_50%_42%,rgb(14_116_144_/_0.2),transparent_42%),linear-gradient(135deg,rgb(7_17_31_/_0.3),rgb(2_6_23_/_0.82))]" />
      <div className="relative w-[min(100%,520px)] border-[1px] border-[color:rgb(103_232_249_/_0.38)] bg-[linear-gradient(135deg,rgb(7_17_31_/_0.94),rgb(7_17_31_/_0.72))] px-[clamp(20px,5vw,36px)] py-[clamp(24px,5vw,40px)] shadow-[0_0_48px_rgb(14_116_144_/_0.2)] backdrop-blur-[14px]" data-testid="loading-brief">
        <div className="absolute inset-y-[0px] left-[0px] w-[3px] bg-[var(--game-accent)] shadow-[0_0_18px_var(--game-accent)]" />
        <div className="flex items-center justify-between gap-[16px] text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--game-accent)]">
          <span className="flex items-center gap-[8px]"><span className="h-[7px] w-[7px] rounded-full bg-[var(--game-accent)] shadow-[0_0_12px_var(--game-accent)]" />Mission bootstrap</span>
          <span className="tabular-nums">{loaded}/{total}</span>
        </div>
        <h1 className="mt-[14px] text-[clamp(28px,7vw,48px)] font-black leading-[0.94] tracking-[-0.05em]" data-testid="loading-title">{title}</h1>
        <p className="mt-[8px] text-[14px] leading-[20px] text-[var(--game-muted)]">{hasError ? "部分任务资源未能抵达，请重新发起同步。" : "正在校验场景信号与任务模块，请保持连接。"}</p>
        <div className="mt-[26px]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} data-testid="loading-progress">
          <div className="flex items-end justify-between gap-[12px]">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--game-muted)]">传输进度</span>
            <strong className="text-[clamp(28px,6vw,42px)] leading-none tabular-nums text-[var(--game-accent)]">{progress}%</strong>
          </div>
          <div className="relative mt-[9px] h-[10px] overflow-hidden border-[1px] border-[color:rgb(103_232_249_/_0.38)] bg-[color:rgb(2_6_23_/_0.72)]">
            <div className="absolute inset-y-[0px] left-[0px] bg-[linear-gradient(90deg,var(--game-accent),rgb(125_211_252))] shadow-[0_0_18px_var(--game-accent)] transition-[width] motion-reduce:transition-none" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-[8px] flex justify-between text-[11px] tracking-[0.08em] text-[var(--game-muted)]"><span>链接已建立</span><span>资源校验</span></div>
        </div>
        {hasError ? (
          <div className="mt-[22px] border-t-[1px] border-[color:rgb(103_232_249_/_0.18)] pt-[18px]">
            <p className="break-words text-[13px] leading-[19px] text-[var(--game-muted)]">{failed.join("、") || "资源加载失败"}</p>
            <button type="button" className="mt-[16px] w-full border-[1px] border-[color:var(--game-accent)] bg-[color:rgb(14_116_144_/_0.56)] px-[16px] text-[14px] font-bold text-[var(--game-text)] shadow-[0_8px_24px_rgb(14_116_144_/_0.2)] transition hover:bg-[var(--game-button-hover)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[var(--game-focus)] motion-reduce:transition-none" data-testid="loading-retry" onClick={retry} style={{ minHeight: 44 }}>重新同步资源</button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/**
 * 在资源清单完成前展示加载界面，完成后才渲染游戏主界面。
 */
export function GameLoading({ children, renderLoading, resourceBaseUrl }: GameLoadingProps) {
  const [attempt, setAttempt] = useState(0);
  const [snapshot, setSnapshot] = useState<ResourceLoadProgress>(getInitialProgress);
  const [status, setStatus] = useState<LoadingStatus>("loading");
  const retry = () => setAttempt((current) => current + 1);

  useEffect(() => {
    const controller = new AbortController();
    let isCurrent = true;
    let completionTimer: number | undefined;
    setStatus("loading");
    setSnapshot(getInitialProgress());

    void preloadResources({
      onProgress: (nextSnapshot) => {
        if (isCurrent) setSnapshot(nextSnapshot);
      },
      resourceBaseUrl,
      resourcePaths: resourceManifest,
      signal: controller.signal,
    }).then((result) => {
      if (!isCurrent) return;
      setSnapshot(result);
      if (result.failed.length > 0) {
        setStatus("error");
        return;
      }
      completionTimer = window.setTimeout(() => {
        if (isCurrent) setStatus("ready");
      }, 500);
    });

    return () => {
      isCurrent = false;
      if (completionTimer) window.clearTimeout(completionTimer);
      controller.abort();
    };
  }, [attempt, resourceBaseUrl]);

  const loadingSnapshot: GameLoadingSnapshot = { ...snapshot, retry, status };
  if (status === "ready") return <>{children}</>;
  return <>{renderLoading ? renderLoading(loadingSnapshot) : <DefaultLoading {...loadingSnapshot} />}</>;
}
