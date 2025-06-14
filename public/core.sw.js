/*importScripts("/core/events.sw.api.js");

const EventSystem = new EventSystemSW();*/

const CACHE_ID = "cache-sw-1";
const CACHE_NAME = `cache-${CACHE_ID}`;

self.addEventListener("install", (e) => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  e.respondWith(
    caches.match(e.request).then((res) => {
      if (res) return res;

      return fetch(e.request)
        .then((r) => {
          const clone = r.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          return r;
        })
        .catch(() => {
          if (navigator.onLine) {
            // runOfflineFunction();
            return new Response("Offline, no cache available", { status: 503 });
          }
          return new Response("Offline", { status: 503 });
        });
    }),
  );
});

self.addEventListener("message", (e) => {
  if (e.data === `reset`) {
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
});

function runOfflineFunction() {
  // EventSystem.emit("ddx.cache:offline", null);
}
