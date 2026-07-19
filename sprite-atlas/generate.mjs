import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { packAsync } = require("free-tex-packer-core");
const packerRequire = createRequire(require.resolve("free-tex-packer-core"));
const sharp = packerRequire("sharp");
const ATLAS_FILE_PATTERN = /^sprite-atlas_[a-f0-9]{12}\.png$/;
const DEFAULT_CONFIG = { exclude: [], height: 4096, include: [], maxFileSizeBytes: 32 * 1024, width: 4096 };

function toResourcePath(path) {
  const normalized = path.replaceAll("\\", "/").replace(/^\.\//, "");
  if (!normalized || normalized.startsWith("/") || normalized.split("/").includes("..")) {
    throw new Error(`图集配置中的路径无效：${path}`);
  }
  return normalized;
}

function validatePathList(value, fieldName) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`sprite-atlas/config.mjs 的 ${fieldName} 必须是字符串数组。`);
  }
  return value.map(toResourcePath);
}

function validateConfig(config) {
  const maxFileSizeBytes = config.maxFileSizeBytes ?? DEFAULT_CONFIG.maxFileSizeBytes;
  if (!Number.isSafeInteger(maxFileSizeBytes) || maxFileSizeBytes < 0) {
    throw new Error("sprite-atlas/config.mjs 的 maxFileSizeBytes 必须是非负安全整数。");
  }
  const width = config.width ?? DEFAULT_CONFIG.width;
  const height = config.height ?? DEFAULT_CONFIG.height;
  for (const [fieldName, value] of [["width", width], ["height", height]]) {
    if (!Number.isSafeInteger(value) || value < 1 || value > 4096) {
      throw new Error(`sprite-atlas/config.mjs 的 ${fieldName} 必须是 1 到 4096 的安全整数。`);
    }
  }
  const include = validatePathList(config.include ?? DEFAULT_CONFIG.include, "include");
  const exclude = validatePathList(config.exclude ?? DEFAULT_CONFIG.exclude, "exclude");
  const overlaps = include.filter((path) => exclude.includes(path));
  if (overlaps.length > 0) throw new Error(`图集配置中的 include 与 exclude 不能重复：${overlaps.join(", ")}`);
  return { exclude, height, include, maxFileSizeBytes, width };
}

async function findPngFiles(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) return findPngFiles(entryPath);
    return extname(entry.name).toLowerCase() === ".png" ? [entryPath] : [];
  }));
  return files.flat().sort();
}

function serializeManifest(manifest) {
  return `export type SpriteAtlasManifest = {\n  frames: Record<string, {\n    atlasPath: string;\n    atlasWidth: number;\n    atlasHeight: number;\n    x: number;\n    y: number;\n    width: number;\n    height: number;\n  }>;\n};\n\nexport const spriteAtlasManifest: SpriteAtlasManifest = ${JSON.stringify(manifest, null, 2)};\n`;
}

async function writeManifest(manifestPath, manifest) {
  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, serializeManifest(manifest), "utf8");
}

async function loadConfig(projectRoot) {
  const configPath = join(projectRoot, "sprite-atlas", "config.mjs");
  const module = await import(pathToFileURL(configPath).href);
  return validateConfig(module.default ?? {});
}

function parseAtlasMetadata(file, atlasPath) {
  const metadata = JSON.parse(file.buffer.toString("utf8"));
  if (!metadata.frames || !metadata.meta?.size) throw new Error("图集工具返回了无效的 JsonHash 数据。");
  return Object.fromEntries(Object.entries(metadata.frames).map(([path, value]) => [path, {
    atlasHeight: metadata.meta.size.h,
    atlasPath,
    atlasWidth: metadata.meta.size.w,
    height: value.frame.h,
    width: value.frame.w,
    x: value.frame.x,
    y: value.frame.y,
  }]));
}

async function validateSelectedFiles(files) {
  await Promise.all(files.map(async (file) => {
    try {
      const metadata = await sharp(file.contents).metadata();
      if (metadata.format !== "png") throw new Error("不是 PNG 文件");
    } catch {
      throw new Error(`无法读取入选图集的 PNG：${file.path}`);
    }
  }));
}

async function cleanStaleAtlases(sourceDir, retainedFileNames = new Set()) {
  let entries;
  try {
    entries = await readdir(sourceDir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  await Promise.all(entries
    .filter((entry) => entry.isFile() && ATLAS_FILE_PATTERN.test(entry.name) && !retainedFileNames.has(entry.name))
    .map((entry) => rm(join(sourceDir, entry.name), { force: true })));
}

/**
 * 将符合配置规则的 PNG 合并为图集，并同步更新运行时清单。
 *
 * @param {{ projectRoot?: string; config?: object }} options 项目根目录和测试用覆盖配置。
 * @returns {Promise<{ frames: Record<string, object> }>}
 */
export async function generateSpriteAtlas({ projectRoot = process.cwd(), config } = {}) {
  const root = resolve(projectRoot);
  const sourceDir = join(root, "resources", "images");
  const manifestPath = join(root, "sprite-atlas", "manifest.ts");
  const effectiveConfig = config ? validateConfig(config) : await loadConfig(root);
  const sourcePaths = await findPngFiles(sourceDir);
  const sourceFiles = await Promise.all(sourcePaths.map(async (filePath) => ({
    contents: await readFile(filePath),
    path: relative(sourceDir, filePath).split(sep).join("/"),
    size: (await stat(filePath)).size,
  })));
  const candidates = sourceFiles.filter((file) => !ATLAS_FILE_PATTERN.test(file.path));
  const knownPaths = new Set(candidates.map((file) => file.path));
  for (const configuredPath of [...effectiveConfig.include, ...effectiveConfig.exclude]) {
    if (!knownPaths.has(configuredPath)) throw new Error(`图集配置引用了不存在的 PNG：${configuredPath}`);
  }
  const include = new Set(effectiveConfig.include);
  const exclude = new Set(effectiveConfig.exclude);
  const selectedFiles = candidates.filter((file) => !exclude.has(file.path) && (include.has(file.path) || file.size <= effectiveConfig.maxFileSizeBytes));

  if (selectedFiles.length === 0) {
    await cleanStaleAtlases(sourceDir);
    const emptyManifest = { frames: {} };
    await writeManifest(manifestPath, emptyManifest);
    return emptyManifest;
  }
  await validateSelectedFiles(selectedFiles);
  const files = await packAsync(selectedFiles, {
    allowRotation: false, allowTrim: false, detectIdentical: false, exporter: "JsonHash", fixedSize: true,
    height: effectiveConfig.height, padding: 2, powerOfTwo: false, prependFolderName: true, removeFileExtension: false,
    textureFormat: "png", textureName: "sprite-atlas", width: effectiveConfig.width,
  });
  const imageFiles = files.filter((file) => extname(file.name).toLowerCase() === ".png");
  const metadataFiles = files.filter((file) => extname(file.name).toLowerCase() === ".json");
  if (imageFiles.length === 0 || imageFiles.length !== metadataFiles.length) {
    throw new Error("图集工具返回了不完整的图集文件。 ");
  }
  const metadataByName = new Map(metadataFiles.map((file) => [file.name.replace(/\.json$/i, ""), file]));
  const atlasFiles = imageFiles.map((imageFile) => {
    const baseName = imageFile.name.replace(/\.png$/i, "");
    const metadataFile = metadataByName.get(baseName);
    if (!metadataFile) throw new Error("图集工具返回了无法匹配的图集元数据。 ");
    const fileName = `sprite-atlas_${createHash("sha256").update(imageFile.buffer).digest("hex").slice(0, 12)}.png`;
    return { fileName, frames: parseAtlasMetadata(metadataFile, `images/${fileName}`), imageBuffer: imageFile.buffer };
  });
  const manifest = { frames: Object.assign({}, ...atlasFiles.map((atlasFile) => atlasFile.frames)) };
  await mkdir(sourceDir, { recursive: true });
  await Promise.all(atlasFiles.map((atlasFile) => writeFile(join(sourceDir, atlasFile.fileName), atlasFile.imageBuffer)));
  await cleanStaleAtlases(sourceDir, new Set(atlasFiles.map((atlasFile) => atlasFile.fileName)));
  await writeManifest(manifestPath, manifest);
  return manifest;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await generateSpriteAtlas();
}
