/**
 * 判断指定元素是否处于浏览器原生全屏状态。
 *
 * @param element 需要与当前全屏元素比较的 DOM 元素。
 * @returns 指定元素为当前全屏元素时返回 true；不存在全屏元素时返回 false。
 */
export function isElementFullscreen(element: Element | null): boolean {
  return document.fullscreenElement === element;
}

/**
 * 在指定元素的原生全屏状态之间切换。
 *
 * @param element 用户手势中触发切换的目标元素。
 * @returns 进入全屏后返回 true，退出全屏后返回 false。
 * @throws 浏览器拒绝全屏请求或不支持该 API 时抛出原始异常。
 */
export async function toggleElementFullscreen(element: HTMLElement): Promise<boolean> {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return false;
  }

  await element.requestFullscreen();
  return true;
}
