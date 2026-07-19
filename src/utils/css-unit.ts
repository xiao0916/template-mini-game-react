import { gameCssConfig } from "../game/css-config.ts";

function assertBase(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} 必须是有限正数`);
}

/**
 * 将设计稿 px 转为 rem。
 *
 * @param px 待转换的设计稿 px 值，可为负数或零。
 * @param remRootValue rem 根字号，默认使用共享 CSS 配置。
 * @returns 对应的 rem 数值。
 * @throws {RangeError} 当 `remRootValue` 不是有限正数时抛出。
 */
export function px2rem(px: number, remRootValue = gameCssConfig.remRootValue): number {
  assertBase(remRootValue, "remRootValue");
  return px / remRootValue;
}

/**
 * 将设计稿 px 转为 vw。
 *
 * @param px 待转换的设计稿 px 值，可为负数或零。
 * @param designWidth 设计稿宽度，默认使用共享 CSS 配置。
 * @returns 对应的 vw 数值。
 * @throws {RangeError} 当 `designWidth` 不是有限正数时抛出。
 */
export function px2vw(px: number, designWidth = gameCssConfig.designWidth): number {
  assertBase(designWidth, "designWidth");
  return (px / designWidth) * 100;
}

/**
 * 将设计稿 rem 转回设计稿 px。
 *
 * @param rem 待转换的 rem 值，可为负数或零。
 * @param remRootValue rem 根字号，默认使用共享 CSS 配置。
 * @returns 对应的设计稿 px 数值。
 * @throws {RangeError} 当 `remRootValue` 不是有限正数时抛出。
 */
export function rem2px(rem: number, remRootValue = gameCssConfig.remRootValue): number {
  assertBase(remRootValue, "remRootValue");
  return rem * remRootValue;
}

/**
 * 将设计稿 vw 转回设计稿 px。
 *
 * @param vw 待转换的 vw 值，可为负数或零。
 * @param designWidth 设计稿宽度，默认使用共享 CSS 配置。
 * @returns 对应的设计稿 px 数值。
 * @throws {RangeError} 当 `designWidth` 不是有限正数时抛出。
 */
export function vw2px(vw: number, designWidth = gameCssConfig.designWidth): number {
  assertBase(designWidth, "designWidth");
  return (vw / 100) * designWidth;
}
