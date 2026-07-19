/**
 * 将相对资源路径解析为可加载的资源 URL。
 */
export function resolveResourceUrl(resourceBaseUrl: string | undefined, assetPath: string): string {
  const baseUrl = resourceBaseUrl ?? "./resources/";
  return `${baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`}${assetPath}`;
}
