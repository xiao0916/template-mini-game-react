import { generateResourceManifest } from "../resource-preload/generate.mjs";
import { generateSpriteAtlas } from "../sprite-atlas/generate.mjs";

const atlas = await generateSpriteAtlas();
await generateResourceManifest({
  excludedPaths: Object.keys(atlas.frames).map((path) => `images/${path}`),
});
