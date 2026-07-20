import { useLayoutEffect, useRef } from "react";

import { gameCssConfig, type GameCssUnit } from "../game/css-config.ts";

type ResponsiveRootFontSizeOptions = Readonly<{
  height: number;
  shouldRotate: boolean;
  width: number;
}>;

type RootFontSizeEffectOptions = ResponsiveRootFontSizeOptions & Readonly<{
  enabled: boolean;
}>;

/**
 * 计算全屏游戏逻辑舞台对应的 rem 根字号。
 * 旋转后的舞台宽度映射到物理视口高度，因此同一设备横竖切换不会改变字号。
 *
 * @param options 当前物理视口及舞台旋转状态。
 * @returns 应写入根元素的 CSS px 字号。
 */
export function getResponsiveRootFontSize({ height, shouldRotate, width }: ResponsiveRootFontSizeOptions): number {
  const logicalWidth = shouldRotate ? height : width;
  return (logicalWidth / gameCssConfig.designWidth) * gameCssConfig.remRootValue;
}

/**
 * 判断 CSS 编译单位是否需要运行时管理 rem 根字号。
 *
 * @param unit 构建阶段配置的 CSS 单位。
 * @returns 仅当单位为 `rem` 时返回 `true`。
 */
export function shouldManageRootFontSize(unit: GameCssUnit): boolean {
  return unit === "rem";
}

/**
 * 在全屏 rem 模式中同步根字号，并在游戏卸载时恢复宿主原有内联字号。
 *
 * @param options 当前视口、旋转状态和是否启用根字号管理。
 */
export function useResponsiveRootFontSize({ enabled, height, shouldRotate, width }: RootFontSizeEffectOptions): void {
  const previousFontSizeRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (!enabled || previousFontSizeRef.current !== null) return;

    const root = document.documentElement;
    previousFontSizeRef.current = root.style.fontSize;
    return () => {
      root.style.fontSize = previousFontSizeRef.current ?? "";
      previousFontSizeRef.current = null;
    };
  }, [enabled]);

  useLayoutEffect(() => {
    if (!enabled || width <= 0 || height <= 0) return;

    document.documentElement.style.fontSize = `${getResponsiveRootFontSize({ height, shouldRotate, width })}px`;
  }, [enabled, height, shouldRotate, width]);
}
