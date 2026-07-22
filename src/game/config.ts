import type { GameDesign } from "../utils/design-stage";
import type { GameOrientation } from "../utils/orientation";
import type { GameCssUnit } from "./css-config";

export type GameLayoutConfig =
  | {
      mode: "fullscreen";
      orientation: GameOrientation;
    }
  | {
      mode: "fixed-design";
    };

export type GameConfig = {
  design: GameDesign;
  layout: GameLayoutConfig;
};

/**
 * 校验布局模式与 CSS 尺寸单位是否兼容。
 * 固定设计稿阶段由像素坐标直接驱动，非 px 单位会导致渲染尺寸与交互坐标脱节。
 */
export function assertGameLayoutCssCompatibility(layout: GameLayoutConfig, unit: GameCssUnit): void {
  if (layout.mode === "fixed-design" && unit !== "px") {
    throw new Error("固定设计稿模式必须使用 px CSS 单位");
  }
}

/**
 * 游戏运行时布局的唯一配置入口。
 * 固定设计稿模式的视觉方向由 design 宽高自动推导，避免与手动方向配置冲突。
 */
export const gameConfig: GameConfig = {
  design: {
    height: 1080,
    width: 1920,
  },
  layout: {
    mode: "fullscreen",
    orientation: "landscape",
  },
};
