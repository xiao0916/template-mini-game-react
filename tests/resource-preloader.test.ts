import assert from "node:assert/strict";
import test from "node:test";

import { preloadResources } from "../resource-preload/index.ts";

test("preloads every resource from the configured base URL and reports file-count progress", async () => {
  const requested: string[] = [];
  const snapshots: Array<{ failed: string[]; loaded: number; progress: number; total: number }> = [];

  const result = await preloadResources({
    fetcher: async (input) => {
      requested.push(String(input));
      return new Response("resource", { status: 200 });
    },
    onProgress: (snapshot) => snapshots.push(snapshot),
    resourceBaseUrl: "https://cdn.example.com/game",
    resourcePaths: ["images/hero.png", "audios/bgm.mp3"],
  });

  assert.deepEqual(requested, [
    "https://cdn.example.com/game/images/hero.png",
    "https://cdn.example.com/game/audios/bgm.mp3",
  ]);
  assert.deepEqual(snapshots, [
    { failed: [], loaded: 0, progress: 0, total: 2 },
    { failed: [], loaded: 1, progress: 50, total: 2 },
    { failed: [], loaded: 2, progress: 100, total: 2 },
  ]);
  assert.deepEqual(result, { failed: [], loaded: 2, progress: 100, total: 2 });
});

test("returns failed resource paths after every requested resource settles", async () => {
  const requested: string[] = [];

  const result = await preloadResources({
    fetcher: async (input) => {
      const url = String(input);
      requested.push(url);
      return new Response("missing", { status: url.endsWith("missing.png") ? 404 : 200 });
    },
    resourcePaths: ["images/ready.png", "images/missing.png"],
  });

  assert.deepEqual(requested, ["./resources/images/ready.png", "./resources/images/missing.png"]);
  assert.deepEqual(result, { failed: ["images/missing.png"], loaded: 1, progress: 50, total: 2 });
});
