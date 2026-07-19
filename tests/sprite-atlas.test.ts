import assert from "node:assert/strict";
import test from "node:test";

import { createSpriteAtlasStyle } from "../src/utils/sprite-atlas-style.ts";
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
      "--sprite-atlas-height": "108px",
      "--sprite-atlas-image": "url(https://cdn.example/game/images/sprite-atlas_94d755df9054.png)",
      "--sprite-atlas-position": "-2px -2px",
      "--sprite-atlas-size": "1024px 1024px",
      "--sprite-atlas-width": "406px",
    },
  });
});

test("未命中的图集帧不会生成样式", () => {
  assert.equal(createSpriteAtlasStyle(spriteAtlas.get("dialog-bg.png")), undefined);
});

test("图集样式会按缩放比例计算背景和元素尺寸", () => {
  const atlasStyle = createSpriteAtlasStyle(spriteAtlas.get("after-time.png"), { scale: 0.5 });

  assert.equal(atlasStyle?.style["--sprite-atlas-position"], "-1px -1px");
  assert.equal(atlasStyle?.style["--sprite-atlas-size"], "512px 512px");
  assert.equal(atlasStyle?.style["--sprite-atlas-width"], "203px");
  assert.equal(atlasStyle?.style["--sprite-atlas-height"], "54px");
});

test("图集样式拒绝非法缩放比例", () => {
  assert.throws(
    () => createSpriteAtlasStyle(spriteAtlas.get("after-time.png"), { scale: 0 }),
    RangeError,
  );
});
