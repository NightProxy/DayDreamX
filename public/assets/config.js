// this is my custom file for my setup. however it doesn't directly interfere with the actual config variable, so the init is still needed.

self.__scramjet$config = {
  prefix: "/assets/res/",
  files: {
    wasm: "/assets/wasm.wasm",
    worker: "/assets/worker.js",
    client: "/assets/client.js",
    shared: "/assets/shared.js",
    sync: "/assets/sync.js"
  },
  siteFlags: {
  },
  flags: {
    captureErrors: true,
    cleanErrors: false,
    naiiveRewriter: false,
    rewriterLogs: false,
    scramitize: false,
    serviceworkers: false,
    sourcemaps: true,
    strictRewrites: true,
    syncxhr: false
  },
  codec: {
    encode: (url) => {
      if (!url) return url;
      const base64 = btoa(url)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
      return encodeURIComponent(base64);
        },
  
    decode: (url) => {
  if (!url) return url;
  const base64 = decodeURIComponent(url)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  return atob(padded);
    },
  },
};