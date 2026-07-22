import assert from "node:assert/strict";
import test from "node:test";

import { gameCssConfig } from "../src/game/css-config.ts";
import { px2rem, px2vw, rem2px, vw2px } from "../src/utils/css-unit.ts";
import { resolveResourceUrl } from "../src/utils/resource-url.ts";
import { createSpriteAtlasStyle, pxToCssLength } from "../src/utils/sprite-atlas-style.ts";
import { spriteAtlas } from "../sprite-atlas/index.ts";

test("未进入图集的资源不会返回帧信息", () => {
  assert.equal(spriteAtlas.get("dialog-bg.png"), undefined);
});

test("默认阈值内的小图会返回图集帧信息", () => {
  const frame = spriteAtlas.get("after-time.png");

  assert.ok(frame);
  assert.match(frame.atlasPath, /^images\/sprite-atlas_[a-f0-9]{12}\.png$/);
  assert.ok(frame.width > 0);
  assert.ok(frame.height > 0);
  assert.ok(frame.atlasWidth >= frame.width);
  assert.ok(frame.atlasHeight >= frame.height);
});

test("图集帧会转换为 Tailwind 类和 CSS 变量", () => {
  const atlasStyle = createSpriteAtlasStyle(spriteAtlas.get("after-time.png"), {
    resourceBaseUrl: "https://cdn.example/game",
  });

  assert.deepEqual(atlasStyle, {
    className: "bg-no-repeat [background-image:var(--sprite-atlas-image)] [background-position:var(--sprite-atlas-position)] [background-size:var(--sprite-atlas-size)] [width:var(--sprite-atlas-width)] [height:var(--sprite-atlas-height)]",
    style: {
      "--sprite-atlas-height": "0.5625rem",
      "--sprite-atlas-image": "url(https://cdn.example/game/images/sprite-atlas_94d755df9054.png)",
      "--sprite-atlas-position": "-0.01042rem -0.01042rem",
      "--sprite-atlas-size": "5.33333rem 5.33333rem",
      "--sprite-atlas-width": "2.11458rem",
    },
  });
});

test("未命中的图集帧不会生成样式", () => {
  assert.equal(createSpriteAtlasStyle(spriteAtlas.get("dialog-bg.png")), undefined);
});

test("图集样式会按缩放比例计算背景和元素尺寸", () => {
  const atlasStyle = createSpriteAtlasStyle(spriteAtlas.get("after-time.png"), { scale: 0.5 });

  assert.equal(atlasStyle?.style["--sprite-atlas-position"], "-0.00521rem -0.00521rem");
  assert.equal(atlasStyle?.style["--sprite-atlas-size"], "2.66667rem 2.66667rem");
  assert.equal(atlasStyle?.style["--sprite-atlas-width"], "1.05729rem");
  assert.equal(atlasStyle?.style["--sprite-atlas-height"], "0.28125rem");
});

test("图集样式拒绝非法缩放比例", () => {
  assert.throws(
    () => createSpriteAtlasStyle(spriteAtlas.get("after-time.png"), { scale: 0 }),
    RangeError,
  );
});

test("CSS 单位工具支持显式设计稿基准换算", () => {
  assert.equal(px2vw(375, 750), 50);
  assert.equal(vw2px(50, 750), 375);
  assert.equal(px2rem(75, 75), 1);
  assert.equal(rem2px(1, 75), 75);
  assert.equal(px2vw(-15, 750), -2);
});

test("CSS 单位工具默认使用当前共享配置", () => {
  assert.equal(px2vw(gameCssConfig.designWidth / 2), 50);
  assert.equal(vw2px(50), gameCssConfig.designWidth / 2);
  assert.equal(px2rem(gameCssConfig.remRootValue), 1);
  assert.equal(rem2px(1), gameCssConfig.remRootValue);
  assert.equal(px2vw(-15), -0.78125);
});

test("图集 CSS 长度遵循当前共享 CSS 配置", () => {
  assert.equal(pxToCssLength(375, "px"), "375px");
  assert.equal(pxToCssLength(375, "vw"), "19.53125vw");
  assert.equal(pxToCssLength(75, "rem"), "0.39063rem");
});

test("资源 URL 工具保留默认与自定义根路径语义", () => {
  assert.equal(resolveResourceUrl(undefined, "images/atlas.png"), "./resources/images/atlas.png");
  assert.equal(resolveResourceUrl("https://cdn.example/game", "images/atlas.png"), "https://cdn.example/game/images/atlas.png");
});
