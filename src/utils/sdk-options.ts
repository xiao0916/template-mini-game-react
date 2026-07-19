import type { GameSDKOptions } from "game-sdk-builder";

/**
 * 将宿主 SDK 选项加入游戏渲染参数，并保留原始 options 对象引用。
 */
export function withSdkOptions<T extends object>(props: T, options: GameSDKOptions): T & { options: GameSDKOptions } {
  return { ...props, options };
}
