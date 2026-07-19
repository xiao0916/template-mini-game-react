import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { generateResourceManifest } from "../resource-preload/generate.mjs";

test("preload manifest keeps atlas outputs and excludes their source images", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "resource-preload-"));

  try {
    await mkdir(join(projectRoot, "resources", "audios"), { recursive: true });
    await mkdir(join(projectRoot, "resources", "images"), { recursive: true });
    await writeFile(join(projectRoot, "resources", "audios", "bgm.mp3"), "audio");
    await writeFile(join(projectRoot, "resources", "images", "source.png"), "source");
    await writeFile(join(projectRoot, "resources", "images", "standalone.png"), "standalone");
    await writeFile(join(projectRoot, "resources", "images", "sprite-atlas_hash.png"), "atlas");

    const manifest = await generateResourceManifest({
      excludedPaths: ["images/source.png"],
      projectRoot,
    });

    assert.deepEqual(manifest, [
      "audios/bgm.mp3",
      "images/sprite-atlas_hash.png",
      "images/standalone.png",
    ]);
    assert.match(await readFile(join(projectRoot, "resource-preload", "manifest.ts"), "utf8"), /"images\/sprite-atlas_hash\.png"/);
  } finally {
    await rm(projectRoot, { force: true, recursive: true });
  }
});
