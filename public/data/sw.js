importScripts("/data/bundle.js");
importScripts("/data/config.js");
importScripts(__uv$config.sw || "/data/sww.js");

const uv = new UVServiceWorker();

async function handleRequest(event) {
  if (uv.route(event)) {
    return await uv.fetch(event);
  }

  return await fetch(event.request);
}

self.addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event));
});
