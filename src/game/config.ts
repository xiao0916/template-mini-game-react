import type { GameDesign } from "../utils/design-stage";
import type { GameOrientation } from "../utils/orientation";

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
    orientation: "portrait",
  },
};
