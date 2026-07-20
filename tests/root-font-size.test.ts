import assert from "node:assert/strict";
import test from "node:test";

import { getResponsiveRootFontSize, shouldManageRootFontSize } from "../src/utils/root-font-size.ts";

test("旋转后的逻辑舞台宽度保持 rem 根字号不变", () => {
  const portrait = getResponsiveRootFontSize({ height: 667, shouldRotate: false, width: 375 });
  const rotatedPortrait = getResponsiveRootFontSize({ height: 375, shouldRotate: true, width: 667 });

  assert.equal(portrait, 37.5);
  assert.equal(rotatedPortrait, portrait);
});

test("横版逻辑舞台在旋转前后使用相同根字号", () => {
  const landscape = getResponsiveRootFontSize({ height: 375, shouldRotate: false, width: 667 });
  const rotatedLandscape = getResponsiveRootFontSize({ height: 667, shouldRotate: true, width: 375 });

  assert.equal(landscape, 66.7);
  assert.equal(rotatedLandscape, landscape);
});

test("仅 rem 编译模式需要管理根字号", () => {
  assert.equal(shouldManageRootFontSize("rem"), true);
  assert.equal(shouldManageRootFontSize("px"), false);
  assert.equal(shouldManageRootFontSize("vw"), false);
});
