const DEFAULT_DESIGN_WIDTH = 750;
const DEFAULT_REM_ROOT_VALUE = 75;

function assertBase(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} 必须是有限正数`);
}

/** 将设计稿 px 转为 rem。 */
export function px2rem(px: number, remRootValue = DEFAULT_REM_ROOT_VALUE): number {
  assertBase(remRootValue, "remRootValue");
  return px / remRootValue;
}

/** 将设计稿 px 转为 vw。 */
export function px2vw(px: number, designWidth = DEFAULT_DESIGN_WIDTH): number {
  assertBase(designWidth, "designWidth");
  return (px / designWidth) * 100;
}

/** 将设计稿 rem 转回设计稿 px。 */
export function rem2px(rem: number, remRootValue = DEFAULT_REM_ROOT_VALUE): number {
  assertBase(remRootValue, "remRootValue");
  return rem * remRootValue;
}

/** 将设计稿 vw 转回设计稿 px。 */
export function vw2px(vw: number, designWidth = DEFAULT_DESIGN_WIDTH): number {
  assertBase(designWidth, "designWidth");
  return (vw / 100) * designWidth;
}
