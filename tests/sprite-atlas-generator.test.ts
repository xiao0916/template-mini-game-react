import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { generateSpriteAtlas } from "../sprite-atlas/generate.mjs";

const execFile = promisify(execFileCallback);

test("生成器只将不超过阈值的 PNG 写入图集", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "sprite-atlas-"));
  const imagesDir = join(projectRoot, "resources", "images");
  const sourcePng = await readFile(new URL("../resources/images/after-time.png", import.meta.url));

  try {
    await mkdir(imagesDir, { recursive: true });
    await writeFile(join(imagesDir, "small.png"), sourcePng);
    await writeFile(join(imagesDir, "large.png"), Buffer.concat([sourcePng, Buffer.from([0])]));

    const manifest = await generateSpriteAtlas({
      projectRoot,
      config: { maxFileSizeBytes: sourcePng.length, include: [], exclude: [] },
    });

    assert.deepEqual(Object.keys(manifest.frames), ["small.png"]);
    const [frame] = Object.values(manifest.frames);
    assert.match(frame.atlasPath, /^images\/sprite-atlas_[a-f0-9]{12}\.png$/);
    assert.equal((await stat(join(projectRoot, "resources", frame.atlasPath))).isFile(), true);
    assert.match(await readFile(join(projectRoot, "sprite-atlas", "manifest.ts"), "utf8"), /small\.png/);
  } finally {
    await rm(projectRoot, { force: true, recursive: true });
  }
});

test("命令行入口会在当前项目生成图集", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "sprite-atlas-cli-"));
  const imagesDir = join(projectRoot, "resources", "images");
  const sourcePng = await readFile(new URL("../resources/images/after-time.png", import.meta.url));

  try {
    await mkdir(imagesDir, { recursive: true });
    await writeFile(join(imagesDir, "small.png"), sourcePng);
    await mkdir(join(projectRoot, "sprite-atlas"), { recursive: true });
    await writeFile(join(projectRoot, "sprite-atlas", "config.mjs"), "export default { maxFileSizeBytes: 32768, include: [], exclude: [] };\n", "utf8");

    await execFile(process.execPath, [fileURLToPath(new URL("../sprite-atlas/generate.mjs", import.meta.url))], { cwd: projectRoot });

    const imageNames = await readdir(imagesDir);
    assert.ok(imageNames.some((name) => /^sprite-atlas_[a-f0-9]{12}\.png$/.test(name)));
  } finally {
    await rm(projectRoot, { force: true, recursive: true });
  }
});

test("生成器忽略旧图集并清理过期的图集文件", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "sprite-atlas-cleanup-"));
  const imagesDir = join(projectRoot, "resources", "images");
  const sourcePng = await readFile(new URL("../resources/images/after-time.png", import.meta.url));
  const staleAtlasName = "sprite-atlas_0123456789ab.png";

  try {
    await mkdir(imagesDir, { recursive: true });
    await writeFile(join(imagesDir, "small.png"), sourcePng);
    await writeFile(join(imagesDir, staleAtlasName), sourcePng);

    const manifest = await generateSpriteAtlas({
      projectRoot,
      config: { maxFileSizeBytes: sourcePng.length, include: [], exclude: [] },
    });

    const imageNames = await readdir(imagesDir);
    assert.ok(imageNames.includes(Object.values(manifest.frames)[0].atlasPath.replace("images/", "")));
    assert.ok(!imageNames.includes(staleAtlasName));
    assert.deepEqual(Object.keys(manifest.frames), ["small.png"]);
  } finally {
    await rm(projectRoot, { force: true, recursive: true });
  }
});

test("自定义尺寸不足时会拆分图集，并将帧关联到各自图集", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "sprite-atlas-multiple-"));
  const imagesDir = join(projectRoot, "resources", "images");
  const sourcePng = await readFile(new URL("../resources/images/after-time.png", import.meta.url));
  const secondSourcePng = await readFile(new URL("../resources/images/game-btn.png", import.meta.url));

  try {
    await mkdir(imagesDir, { recursive: true });
    await writeFile(join(imagesDir, "first.png"), sourcePng);
    await writeFile(join(imagesDir, "second.png"), secondSourcePng);

    const manifest = await generateSpriteAtlas({
      projectRoot,
      config: { exclude: [], height: 112, include: [], maxFileSizeBytes: sourcePng.length, width: 410 },
    });

    const frames = Object.values(manifest.frames);
    assert.equal(frames.length, 2);
    assert.equal(new Set(frames.map((frame) => frame.atlasPath)).size, 2);
    assert.ok(frames.every((frame) => frame.atlasWidth <= 410 && frame.atlasHeight <= 112));
    assert.ok(frames.every((frame) => /^images\/sprite-atlas_[a-f0-9]{12}\.png$/.test(frame.atlasPath)));
  } finally {
    await rm(projectRoot, { force: true, recursive: true });
  }
});

test("图集尺寸必须是 1 到 4096 的安全整数", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "sprite-atlas-size-validation-"));

  try {
    await assert.rejects(
      () => generateSpriteAtlas({ projectRoot, config: { exclude: [], height: 4097, include: [], maxFileSizeBytes: 0, width: 0 } }),
      /width.*1 到 4096|height.*1 到 4096/,
    );
  } finally {
    await rm(projectRoot, { force: true, recursive: true });
  }
});

test("include 和 exclude 会覆盖默认的体积筛选", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "sprite-atlas-overrides-"));
  const imagesDir = join(projectRoot, "resources", "images");
  const sourcePng = await readFile(new URL("../resources/images/after-time.png", import.meta.url));
  const forcedPng = await readFile(new URL("../resources/images/bailang.png", import.meta.url));

  try {
    await mkdir(imagesDir, { recursive: true });
    await writeFile(join(imagesDir, "small.png"), sourcePng);
    await writeFile(join(imagesDir, "excluded.png"), sourcePng);
    await writeFile(join(imagesDir, "forced.png"), forcedPng);

    const manifest = await generateSpriteAtlas({
      projectRoot,
      config: {
        exclude: ["excluded.png"],
        include: ["forced.png"],
        maxFileSizeBytes: sourcePng.length,
      },
    });

    assert.deepEqual(Object.keys(manifest.frames).sort(), ["forced.png", "small.png"]);
  } finally {
    await rm(projectRoot, { force: true, recursive: true });
  }
});

test("已选中的损坏 PNG 会使生成失败", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "sprite-atlas-invalid-"));
  const imagesDir = join(projectRoot, "resources", "images");

  try {
    await mkdir(imagesDir, { recursive: true });
    await writeFile(join(imagesDir, "broken.png"), "not a png", "utf8");

    await assert.rejects(
      () => generateSpriteAtlas({
        projectRoot,
        config: { maxFileSizeBytes: 32768, include: [], exclude: [] },
      }),
      /broken\.png/,
    );
  } finally {
    await rm(projectRoot, { force: true, recursive: true });
  }
});

test("没有源图目录时会生成空清单", async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), "sprite-atlas-empty-"));

  try {
    const manifest = await generateSpriteAtlas({
      projectRoot,
      config: { maxFileSizeBytes: 32768, include: [], exclude: [] },
    });

    assert.deepEqual(manifest.frames, {});
  } finally {
    await rm(projectRoot, { force: true, recursive: true });
  }
});
