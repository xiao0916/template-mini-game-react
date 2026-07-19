export type ResourceLoadProgress = {
  failed: string[];
  loaded: number;
  progress: number;
  total: number;
};

export type ResourcePreloaderOptions = {
  fetcher?: (input: string, init?: RequestInit) => Promise<Pick<Response, "arrayBuffer" | "ok">>;
  onProgress?: (snapshot: ResourceLoadProgress) => void;
  resourceBaseUrl?: string;
  resourcePaths: readonly string[];
  signal?: AbortSignal;
};

const DEFAULT_RESOURCE_BASE_URL = "./resources/";
const MAX_CONCURRENT_REQUESTS = 6;

function resolveResourceUrl(resourceBaseUrl: string | undefined, resourcePath: string): string {
  const baseUrl = resourceBaseUrl ?? DEFAULT_RESOURCE_BASE_URL;
  return `${baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`}${resourcePath}`;
}

function createSnapshot(loaded: number, total: number, failed: string[]): ResourceLoadProgress {
  return { failed: [...failed], loaded, progress: total === 0 ? 100 : Math.round(loaded / total * 100), total };
}

/**
 * 预加载资源并按已完成文件数报告进度。请求完成后会读取完整响应体，避免仅收到响应头就视为加载完成。
 */
export async function preloadResources({ fetcher = globalThis.fetch, onProgress, resourceBaseUrl, resourcePaths, signal }: ResourcePreloaderOptions): Promise<ResourceLoadProgress> {
  const total = resourcePaths.length;
  const failed: string[] = [];
  let loaded = 0;
  let nextIndex = 0;
  const emitProgress = () => onProgress?.(createSnapshot(loaded, total, failed));

  emitProgress();
  if (total === 0) return createSnapshot(loaded, total, failed);

  const worker = async () => {
    while (nextIndex < total) {
      const resourcePath = resourcePaths[nextIndex];
      nextIndex += 1;
      try {
        const response = await fetcher(resolveResourceUrl(resourceBaseUrl, resourcePath), { signal });
        if (!response.ok) throw new Error(`资源请求失败：${resourcePath}`);
        await response.arrayBuffer();
        loaded += 1;
      } catch {
        failed.push(resourcePath);
      }
      emitProgress();
    }
  };

  await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENT_REQUESTS, total) }, worker));
  return createSnapshot(loaded, total, failed);
}
