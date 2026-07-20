# Fullscreen Three.js Game Starter

一个基于 `game-sdk-builder`、Three.js、React Three Fiber 和 Drei 的全屏游戏项目模板。

## 开始

```bash
npm install
npx playwright install chromium
npm run dev
```

开发服务器固定在 `http://127.0.0.1:5174`。

## 模板结构

- `src/components/FullViewportGame.tsx`：无留白的铺满视口框架容器。
- `src/components/FixedDesignGame.tsx`：固定设计稿比例的框架容器。
- `src/components/OrientationStage.tsx`、`FixedDesignStage.tsx`：方向、缩放与安全区基础能力。
- `src/business-components/`：场景、HUD、Canvas 和游戏业务组件。
- `src/game/config.ts`：设计稿尺寸、布局模式与方向的唯一运行时配置入口。
- `src/utils/*.ts`：无 React 依赖的渲染与全屏工具函数。
- `src/game/tailwind.css`：主题 CSS 变量与全局重置；组件布局使用 Tailwind utility。

替换 `src/business-components/StarterScene.tsx` 或 `DemoGame.tsx` 的内容即可开始实现你的游戏；HUD 应继续置于 Canvas 外，使其不受相机和场景缩放影响。主题色在 `tailwind.css` 的 `--game-*` 变量中维护。

## 适配约束

- 游戏根节点必须使用固定定位、`inset: 0` 与 `height: 100dvh`。
- 游戏根节点必须铺满视口；铺满模式的 Canvas 铺满视口，固定设计稿模式的 Canvas 铺满设计舞台。
- UI 使用 `env(safe-area-inset-*)` 避开刘海和底部手势区域。
- 原生浏览器全屏只能由用户点击触发；不可用时仍应保持视口铺满。

## 布局模式、设计稿尺寸与移动端方向

在 `src/game/config.ts` 中选择布局模式、全屏方向和设计稿尺寸：

```ts
export const gameConfig = {
  design: {
    width: 1920,
    height: 1080,
  },
  layout: {
    mode: "fullscreen",
    orientation: "any",
  },
};
```

`mode: "fullscreen"` 默认不旋转且不留白；将 `orientation` 设为 `"portrait"` 或 `"landscape"` 可启用视觉旋转。

固定设计稿模式只需改为以下布局配置，视觉方向始终由 `design` 的宽高推导：

```ts
layout: {
  mode: "fixed-design",
},
```

固定设计稿模式中，宽大于高自动按横屏设计处理，高大于宽自动按竖屏设计处理；正方形设计稿不旋转。用户无需额外配置横竖屏。

`game-sdk.config.ts` 中的 `css.designWidth` 用于构建阶段的 CSS 单位换算，独立于上述游戏舞台设计稿尺寸。

固定设计稿模式会以完整显示模式等比缩放设计舞台，Canvas、HUD 与按钮同步缩放；视口多余空间使用 `--game-bg` 留白，不裁切、不拉伸。WebGL 像素密度会随舞台缩放变化，最大为 2，以平衡清晰度与性能。安全区会随方向和缩放映射到逻辑边缘。方向改变不会显示提示；后续若为场景内物体增加射线点击，需要额外处理旋转后的指针坐标。

`game-sdk-builder@2` 不再管理根字号。全屏且 `css.unit` 为 `"rem"` 时，模板会按旋转后的逻辑舞台宽度设置根字号，因此同一移动设备的横竖切换不会改变 rem 尺寸；游戏卸载后会恢复 SDK 宿主原有的内联字号。`"px"` 与 `"vw"` 不会设置根字号。

固定设计稿模式建议在 `src/game/css-config.ts` 中设置 `unit: "px"`。构建器会保留原始 px，设计舞台只通过 `FixedDesignStage` 的等比 `scale()` 适配，避免根字号和舞台缩放重复生效。`css.unit` 是整个构建产物的编译选项，切换布局模式时需同步调整该配置。

SDK 宿主通过 `mount(container, options)` 传入的 `resourceBaseUrl` 与 `styleNonce` 会由 `GameApp` 原样传给业务层。`src/business-components/DemoGame.tsx` 接收的 `GameRenderProps.options` 可直接用于资源地址等业务逻辑。

## 资源预加载

启动时会先预加载运行时资源，再挂载 Canvas 和 HUD。`resource-preload/manifest.ts` 由 `npm run sprites` 在图集生成后自动更新：已进入图集的原图会被排除，仅加载图集输出；未图集化图片、音频和其他资源会保留。默认加载页显示 Loading text、进度条与按完成文件数计算的百分比；资源失败时会显示失败路径并提供重试按钮。

`GameLoading` 的 `renderLoading(snapshot)` 可替换默认界面，`snapshot` 提供 `status`、`progress`、`loaded`、`total`、`failed` 和 `retry()`。使用跨域 `resourceBaseUrl` 时，资源服务器必须允许 `fetch` 跨域访问。

## 小图图集

图集配置、生成规则和 `spriteAtlas.get()` 接入示例见 [sprite-atlas/README.md](sprite-atlas/README.md)。

## 验证

```bash
npm run test:unit
npm run test:e2e
npm run build
```

浏览器测试覆盖固定比例留白、触控设备横屏、无页面滚动及全屏进出。
