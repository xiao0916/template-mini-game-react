import assert from "node:assert/strict";
import test from "node:test";

import { withSdkOptions } from "../src/utils/sdk-options.ts";

test("SDK options keep their identity when added to game render props", () => {
  const options = { resourceBaseUrl: "https://cdn.example.com/game/", styleNonce: "nonce" };
  const renderProps = withSdkOptions({ isFullscreen: false, pixelRatio: 1 }, options);

  assert.strictEqual(renderProps.options, options);
  assert.equal(renderProps.pixelRatio, 1);
});
