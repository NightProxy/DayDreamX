
self.__uv$config = {
  prefix: "/data/int/", 
  /*encodeUrl: function encode(str) {
    if (!str) return str;
    const base64 = btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
    return encodeURIComponent(base64);
  },
  decodeUrl: function decode(str) {
    if (!str) return str;
    const base64 = decodeURIComponent(str)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
    const padded = base64 + '==='.slice((base64.length + 3) % 4);
    return atob(padded);
},*/
  encodeUrl: function encode(str) {
    if (!str) return str;
    const base64 = btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return encodeURIComponent(base64);
  },
  decodeUrl: function decode(str) {
    if (!str) return str;
    const base64 = decodeURIComponent(str)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const padded = base64 + '==='.slice((base64.length + 3) % 4);
    return atob(padded);
  },
  handler: "/data/handler.js",
  client: "/data/client.js",
  bundle: "/data/bundle.js",
  config: "/data/config.js",
  sw: "/data/sww.js",
};
