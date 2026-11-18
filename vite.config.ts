import { defineConfig as defineViteConfig } from "vite";
import { fileURLToPath } from "node:url";

import { defineConfig as defineLovableConfig } from "@lovable.dev/vite-tanstack-config";

const isElectronBuild = Boolean(process.env["ELECTRON_BUILD"]);
const lovableConfig = defineLovableConfig({
  nitro: isElectronBuild ? { preset: "node-server" } : false,
  tanstackStart: {
    server: { entry: "server" },
  },
});

export default defineViteConfig(async (environment) => {
  const config = await lovableConfig(environment);
  if (isElectronBuild) {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          "cloudflare:workers": fileURLToPath(
            new URL("./src/lib/server/node-worker-env.ts", import.meta.url),
          ),
        },
      },
    };
  }

  const { cloudflare } = await import("@cloudflare/vite-plugin");
  return {
    ...config,
    plugins: [cloudflare({ viteEnvironment: { name: "ssr" } }), ...(config.plugins ?? [])],
  };
});
