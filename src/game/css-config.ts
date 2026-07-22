export type GameCssUnit = "px" | "rem" | "vw";

type GameCssConfig = Readonly<{
  designWidth: number;
  remRootValue: number;
  unit: GameCssUnit;
}>;

/**
 * 构建期与运行时共用的 CSS 尺寸配置。
 * 修改此配置会同时影响 game-sdk-builder 的 PostCSS 转换和运行时 CSS 变量。
 */
export const gameCssConfig: GameCssConfig = {
  designWidth: 1920,
  remRootValue: 192,
  unit: "rem",
} as const;
