import { getDesignOrientation, type GameDesign } from "./design-stage.ts";
import type { GameOrientation } from "./orientation.ts";

export type GameLayoutMode = "fullscreen" | "fixed-design";

type FullscreenLayoutOptions = {
  mode: "fullscreen";
  fullscreenOrientation: GameOrientation;
};

type FixedDesignLayoutOptions = {
  mode: "fixed-design";
  fullscreenOrientation: GameOrientation;
  design: GameDesign;
};

/**
 * 决定当前布局模式使用的视觉方向。
 * 铺满模式使用显式配置，固定设计稿模式始终以设计稿宽高为准。
 */
export function getLayoutOrientation(options: FullscreenLayoutOptions | FixedDesignLayoutOptions): GameOrientation {
  return options.mode === "fixed-design" ? getDesignOrientation(options.design) : options.fullscreenOrientation;
}
