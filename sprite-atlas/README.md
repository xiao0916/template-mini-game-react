# 小图图集

`resources/images/` 中的 PNG 会在开发、测试和构建前自动筛选并生成图集。默认仅合并不超过 32KiB 的图片；超出阈值的图片继续保持独立资源请求。

## 配置

在本目录的 `config.mjs` 中调整筛选规则：

```js
export default {
  width: 2048,
  height: 2048,
  maxFileSizeBytes: 32 * 1024,
  include: ["ui/special.png"],
  exclude: ["ui/keep-standalone.png"],
};
```

`width` 与 `height` 默认均为 `4096`，可分别设为 `1` 到 `4096` 的安全整数。`include` 会强制合并大图，`exclude` 始终保持独立；两者都使用相对 `resources/images/` 的 `/` 分隔路径。

图片超过单张图集容量时会自动拆分为多张图集。每张输出图按最终 PNG 的 SHA-256 前 12 位命名为 `resources/images/sprite-atlas_<hash>.png`。生成器会更新本目录的 `manifest.ts`，不要手动修改清单或图集文件。

可手动运行 `npm run sprites` 刷新产物；开发、测试和构建前会自动执行。

## React 与 Tailwind 背景图

DOM 中显示图集帧时，使用 `createSpriteAtlasStyle` 生成静态 Tailwind 类和运行时 CSS 变量，无需在组件内手工计算背景定位与尺寸。

```tsx
import { spriteAtlas } from "../sprite-atlas";
import { createSpriteAtlasStyle } from "../src/utils/sprite-atlas-style";

const atlasStyle = createSpriteAtlasStyle(spriteAtlas.get("ui/start.png"), {
  resourceBaseUrl: options.resourceBaseUrl,
  scale: 0.5,
});

return atlasStyle ? (
  <div className={`${atlasStyle.className} shrink-0`} style={atlasStyle.style} />
) : null;
```

`scale` 默认是 `1`，必须是有限正数；图集未命中时工具返回 `undefined`，可继续使用独立图片加载逻辑。

运行时通过 React `style` 写入的 CSS 变量不会经过构建器的 PostCSS 单位转换。因此 `createSpriteAtlasStyle` 会在 `src/utils/sprite-atlas-style.ts` 中自行将设计稿 px 转为 CSS 单位，默认使用 `const unit: "rem" | "vw" = "vw"`。使用 SDK 的 rem 构建命令时，请将该常量手动改为 `"rem"`。

`src/utils/css-unit.ts` 同时提供 `px2vw`、`px2rem`、`vw2px` 与 `rem2px`。默认设计稿宽度为 `750`、rem 根值为 `75`，变更 `game-sdk.config.ts` 的 CSS 设计基准时需要同步调整这些默认值。

## 运行时查询

业务通过 `spriteAtlas.get(path)` 查询图集帧；未被合并的图片会返回 `undefined`。即使资源被分配到不同图集，返回的 `atlasPath` 也始终指向该帧所属图集。

```ts
import { spriteAtlas } from "../sprite-atlas";

const frame = spriteAtlas.get("ui/start.png");
if (frame) {
  const baseUrl = options.resourceBaseUrl ?? "./resources/";
  const atlasUrl = `${baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`}${frame.atlasPath}`;
  const u0 = frame.x / frame.atlasWidth;
  const v0 = 1 - (frame.y + frame.height) / frame.atlasHeight;
  // 使用 atlasUrl、u0、v0 与 frame 的尺寸创建 Three.js 纹理区域。
}
```
