import { spriteAtlasManifest } from "./manifest.ts";

export type SpriteAtlasFrame = Readonly<{
  atlasPath: string;
  x: number;
  y: number;
  width: number;
  height: number;
  atlasWidth: number;
  atlasHeight: number;
}>;

function normalizePath(path: string): string | undefined {
  const normalized = path.replace(/\\/g, "/").replace(/^\.\//, "");
  if (!normalized || normalized.startsWith("/") || normalized.split("/").includes("..")) return undefined;
  return normalized;
}

/**
 * 图集资源查询接口。
 */
export const spriteAtlas = {
  /**
   * 获取已进入图集的图片帧信息。
   *
   * @param path 相对 `resources/images` 的图片路径。
   * @returns 图集帧信息；未打包或路径非法时返回 `undefined`。
   */
  get(path: string): SpriteAtlasFrame | undefined {
    const normalized = normalizePath(path);
    if (!normalized) return undefined;

    const frame = spriteAtlasManifest.frames[normalized];
    return frame;
  },
};
