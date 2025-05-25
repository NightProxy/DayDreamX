import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { ViteMinifyPlugin } from "vite-plugin-minify";
import { sync } from "glob";
import { resolve } from "path";
import { normalizePath } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
//@ts-expect-error
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { scramjetPath } from "@mercuryworkshop/scramjet";
import { server as wisp } from "@mercuryworkshop/wisp-js/server";

const pages: Record<string, string> = {
  index: resolve(__dirname, "index.html"),
};

const internalPages = sync("internal/**/index.html");

for (const path of internalPages) {
  const name = path.split("/")[1];
  pages[name] = resolve(__dirname, path);
}

function prettyUrlsPlugin() {
  return {
    name: "vite-plugin-pretty-urls",
    configureServer(server: any) {
      server.middlewares.use((req: any, _res: any, next: any) => {
        if (
          req.url &&
          /^\/internal\/[^/]+$/.test(req.url) &&
          !req.url.endsWith(".html")
        ) {
          req.url += "/index.html";
        }
        next();
      });
    },
  };
}

const newScramPath = "assets";
const newUVPath = "data";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    ViteMinifyPlugin(),
    prettyUrlsPlugin(),
    viteStaticCopy({
      targets: [
        { src: `${epoxyPath}/*`, dest: "epoxy" },
        { src: `${uvPath}/uv.bundle.js`, dest: newUVPath, rename: "bundle.js" },
        {
          src: `${uvPath}/uv.handler.js`,
          dest: newUVPath,
          rename: "handler.js",
        },
        { src: `${uvPath}/uv.client.js`, dest: newUVPath, rename: "client.js" },
        //      { src: `${uvPath}/uv.config.js`, dest: newUVPath, rename: 'config.js' }, dont replace the config.js
        { src: `${uvPath}/uv.sw.js`, dest: newUVPath, rename: "sww.js" },

        {
          src: `${scramjetPath}/scramjet.client.js`,
          dest: newScramPath,
          rename: "client.js",
        },
        {
          src: `${scramjetPath}/scramjet.controller.js`,
          dest: newScramPath,
          rename: "controller.js",
        },
        {
          src: `${scramjetPath}/scramjet.shared.js`,
          dest: newScramPath,
          rename: "shared.js",
        },
        {
          src: `${scramjetPath}/scramjet.sync.js`,
          dest: newScramPath,
          rename: "sync.js",
        },
        {
          src: `${scramjetPath}/scramjet.wasm.wasm`,
          dest: newScramPath,
          rename: "wasm.wasm",
        },
        {
          src: `${scramjetPath}/scramjet.worker.js`,
          dest: newScramPath,
          rename: "worker.js",
        },

        { src: `${libcurlPath}/*`, dest: "libcurl" },
        { src: `${baremuxPath}/*`, dest: "baremux" },

        {
          src: `node_modules/eruda/eruda.js`,
          dest: "core",
          rename: "inspect.js",
        },
      ],
    }),
  ],
  appType: "mpa",
  build: {
    emptyOutDir: true,
    rollupOptions: {
      input: pages,
    },
  },
});
