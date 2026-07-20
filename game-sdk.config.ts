import { defineConfig } from "game-sdk-builder";

import { gameCssConfig } from "./src/game/css-config";

export default defineConfig({
  appEntry: "src/game/GameApp.tsx",
  styleEntry: "src/game/tailwind.css",
  resourcesDir: "resources",
  external: {
    "three": {
      h5Url: "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.185.1/three.module.min.js",
      sdkGlobal: "THREE",
    },
  },
  h5: {
    title: "My Game",
    outDir: "dist",
    resourceBaseUrl: "../resources",
  },
  sdk: {
    globalName: "GameSDK",
    outDir: "sdk-dist",
    fileName: "game-sdk.[unit].js",
  },
  css: gameCssConfig,
});
