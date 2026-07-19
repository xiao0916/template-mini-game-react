import type { GameOrientation } from "./orientation";

export type GameDesign = {
  width: number;
  height: number;
};

export type ContainedStageLayout = {
  width: number;
  height: number;
  scale: number;
  pixelRatio: number;
};

type ContainedStageOptions = {
  design: GameDesign;
  width: number;
  height: number;
  devicePixelRatio: number;
};

/**
 * 根据设计稿尺寸推导视觉方向，避免横竖屏配置与设计比例不一致。
 */
export function getDesignOrientation({ height, width }: GameDesign): GameOrientation {
  if (width > height) return "landscape";
  if (height > width) return "portrait";
  return "any";
}

/**
 * 计算设计舞台在可用区域内完整显示时的尺寸与渲染像素比。
 * WebGL 像素比会跟随缩放变化，并限制在 2 以内以保护小游戏性能。
 */
export function getContainedStageLayout({
  design,
  devicePixelRatio,
  height,
  width,
}: ContainedStageOptions): ContainedStageLayout {
  if (design.width <= 0 || design.height <= 0) {
    throw new RangeError("设计稿宽高必须大于 0");
  }

  const scale = Math.min(Math.max(width, 0) / design.width, Math.max(height, 0) / design.height);
  return {
    height: design.height * scale,
    pixelRatio: Math.min(Math.max(devicePixelRatio * scale, 0), 2),
    scale,
    width: design.width * scale,
  };
}
