/**
 * 将设备像素比限制在适合小游戏的渲染范围内。
 *
 * @param value 浏览器报告的设备像素比。
 * @returns 介于 1 和 2 之间的渲染像素比。
 */
export function clampPixelRatio(value: number): number {
  return Math.min(Math.max(value, 1), 2);
}
