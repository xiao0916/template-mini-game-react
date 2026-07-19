import type { CSSProperties } from "react";

import type { SpriteAtlasFrame } from "../../sprite-atlas/index.ts";

/**
 * 图集帧转换为 CSS 背景样式时的配置。
 */
export type SpriteAtlasStyleOptions = Readonly<{
  /** 图集资源所在目录，默认使用模板的 `./resources/`。 */
  resourceBaseUrl?: string;
  /** 帧的显示缩放比例，默认值为 `1`。 */
  scale?: number;
}>;

/**
 * 可直接传入 React 元素的 Tailwind 类和运行时 CSS 变量。
 */
export type SpriteAtlasStyle = Readonly<{
  className: string;
  style: CSSProperties;
}>;

const spriteAtlasClassName = "bg-no-repeat [background-image:var(--sprite-atlas-image)] [background-position:var(--sprite-atlas-position)] [background-size:var(--sprite-atlas-size)] [width:var(--sprite-atlas-width)] [height:var(--sprite-atlas-height)]";

function resolveResourceUrl(resourceBaseUrl: string | undefined, assetPath: string): string {
  const baseUrl = resourceBaseUrl ?? "./resources/";
  return `${baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`}${assetPath}`;
}

/**
 * 将图集帧转换为可用于 DOM 背景裁切的 Tailwind 类和 CSS 变量。
 *
 * @param frame 图集查询结果；未命中时直接返回 `undefined`。
 * @param options 资源基路径和显示缩放配置。
 * @returns JSX 的 `className` 与 `style`；未命中图集时返回 `undefined`。
 * @throws {RangeError} 当 `scale` 不是有限正数时抛出。
 */
export function createSpriteAtlasStyle(frame: SpriteAtlasFrame | undefined, options: SpriteAtlasStyleOptions = {}): SpriteAtlasStyle | undefined {
  if (!frame) return undefined;

  const scale = options.scale ?? 1;
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new RangeError("图集缩放比例必须是有限正数");
  }

  return {
    className: spriteAtlasClassName,
    style: {
      "--sprite-atlas-height": `${frame.height * scale}px`,
      "--sprite-atlas-image": `url(${resolveResourceUrl(options.resourceBaseUrl, frame.atlasPath)})`,
      "--sprite-atlas-position": `-${frame.x * scale}px -${frame.y * scale}px`,
      "--sprite-atlas-size": `${frame.atlasWidth * scale}px ${frame.atlasHeight * scale}px`,
      "--sprite-atlas-width": `${frame.width * scale}px`,
    } as CSSProperties,
  };
}
