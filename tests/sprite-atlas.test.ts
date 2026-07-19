import assert from "node:assert/strict";
import test from "node:test";

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
