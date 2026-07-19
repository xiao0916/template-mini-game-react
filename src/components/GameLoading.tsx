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

function DefaultLoading({ failed, progress, retry, status }: GameLoadingSnapshot) {
  const hasError = status === "error";

  return (
    <section className="flex h-full w-full flex-col items-center justify-center gap-4 px-[var(--safe-left)] pr-[var(--safe-right)] text-center text-[var(--game-text)]" data-testid="game-loading" aria-live="polite" aria-label={hasError ? "资源加载失败" : "游戏加载中"}>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--game-accent)]">{hasError ? "Loading failed" : "Loading..."}</p>
      <div className="h-3 w-full max-w-sm overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} data-testid="loading-progress">
        <div className="h-full bg-[var(--game-accent)] transition-[width] motion-reduce:transition-none" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-2xl font-bold tabular-nums">{progress}%</p>
      {hasError ? (
        <>
          <p className="max-w-sm text-sm text-[var(--game-muted)]">{failed.join("、") || "资源加载失败"}</p>
          <button type="button" className="rounded-full border border-[color:var(--game-accent)] px-5 py-2 text-sm font-bold focus-visible:outline focus-visible:outline-3 focus-visible:outline-[var(--game-focus)]" data-testid="loading-retry" onClick={retry}>重试</button>
        </>
      ) : null}
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
