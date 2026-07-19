import { mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";

async function findResourceFiles(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) return findResourceFiles(entryPath);
    return entry.isFile() ? [entryPath] : [];
  }));
  return files.flat().sort();
}

function serializeManifest(resourcePaths) {
  return `export const resourceManifest = ${JSON.stringify(resourcePaths, null, 2)} as const;\n`;
}

/**
 * 扫描 resources 目录并生成运行时预加载清单。
 *
 * @param {{ excludedPaths?: string[]; projectRoot?: string }} options 项目根目录与需要排除的资源相对路径。
 * @returns {Promise<string[]>} 按相对路径排序的资源路径。
 */
export async function generateResourceManifest({ excludedPaths = [], projectRoot = process.cwd() } = {}) {
  const root = resolve(projectRoot);
  const resourcesDir = join(root, "resources");
  const excluded = new Set(excludedPaths);
  const files = await findResourceFiles(resourcesDir);
  const resourcePaths = files
    .map((filePath) => relative(resourcesDir, filePath).split(sep).join("/"))
    .filter((resourcePath) => !excluded.has(resourcePath));
  const manifestPath = join(root, "resource-preload", "manifest.ts");
  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, serializeManifest(resourcePaths), "utf8");
  return resourcePaths;
}
