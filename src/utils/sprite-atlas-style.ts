import type { CSSProperties } from "react";

import type { SpriteAtlasFrame } from "../../sprite-atlas/index.ts";
import { gameCssConfig, type GameCssUnit } from "../game/css-config.ts";
import { px2rem, px2vw } from "./css-unit.ts";
import { resolveResourceUrl } from "./resource-url.ts";

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

function formatCssNumber(value: number): string {
  return String(Number.parseFloat((Math.round((value + Number.EPSILON) * 100000) / 100000).toFixed(5)));
}

/**
 * 将设计稿像素转换为构建配置对应的 CSS 长度。
 * `px` 模式保留原值，负数与零可用于背景定位。
 *
 * @param px 设计稿中的像素值。
 * @param unit 输出单位，默认使用共享 CSS 配置。
 * @returns 可直接写入 CSS 变量的长度字符串。
 */
export function pxToCssLength(px: number, unit: GameCssUnit = gameCssConfig.unit): string {
  const value = unit === "rem" ? px2rem(px) : unit === "vw" ? px2vw(px) : px;
  return `${formatCssNumber(value)}${unit}`;
}

function toCssLength(px: number): string {
  return pxToCssLength(px);
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
      "--sprite-atlas-height": toCssLength(frame.height * scale),
      "--sprite-atlas-image": `url(${resolveResourceUrl(options.resourceBaseUrl, frame.atlasPath)})`,
      "--sprite-atlas-position": `${toCssLength(-frame.x * scale)} ${toCssLength(-frame.y * scale)}`,
      "--sprite-atlas-size": `${toCssLength(frame.atlasWidth * scale)} ${toCssLength(frame.atlasHeight * scale)}`,
      "--sprite-atlas-width": toCssLength(frame.width * scale),
    } as CSSProperties,
  };
}
