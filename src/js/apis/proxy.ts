import * as BareMux from "@mercuryworkshop/bare-mux";
import { Logger } from "@apis/logging";
import { SettingsAPI } from "@apis/settings";

interface ProxyInterface {
  connection: BareMux.BareMuxConnection;
  searchVar: string;
  transportVar: string;
  wispUrl: string;
  logging: Logger;
  settings: SettingsAPI;
  setTransports(): Promise<void>;
  search(input: string): string;
  registerSW(swConfig: any): Promise<void>;
  updateSW(): void;
  uninstallSW(): void;
  fetchProxyMapping(): Promise<any>;
  getDomainFromUrl(url: string): string | null;
  determineProxy(domain: string): Promise<string>;
  automatic(input: string, swConfig: Record<any, any>): Promise<any>;
  redirect(
    swConfig: Record<any, any>,
    proxySetting: string,
    url: string,
  ): Promise<void>;
  inFrame_Redirect(
    swConfig: Record<any, any>,
    proxySetting: string,
    url: string,
  ): Promise<void>;
  fetch(url: string, params?: any): Promise<string>;
  getFavicon(
    url: string,
    swConfig: Record<any, any>,
    proxySetting: string,
  ): Promise<string | null>;
}
class Proxy implements ProxyInterface {
  connection!: BareMux.BareMuxConnection;
  searchVar!: string;
  transportVar!: string;
  wispUrl!: string;
  settings!: SettingsAPI;
  logging!: Logger;

  constructor() {
    this.connection = new BareMux.BareMuxConnection("/baremux/worker.js");

    this.settings = new SettingsAPI();
    (async () => {
      this.searchVar =
        (await this.settings.getItem("search")) ||
        "https://www.duckduckgo.com/?q=%s";
      this.transportVar =
        (await this.settings.getItem("transports")) || "libcurl";
      this.wispUrl =
        (await this.settings.getItem("wisp")) ||
        (location.protocol === "https:" ? "wss" : "ws") +
          "://" +
          location.host +
          "/wisp/";
      this.logging = new Logger();
    })();
  }

  async setTransports() {
    const transports = this.transportVar;
    const transportMap: Record<any, string> = {
      epoxy: "/epoxy/index.mjs",
      libcurl: "/libcurl/index.mjs",
    };
    const transportFile = transportMap[transports] || "/libcurl/index.mjs";
    await this.connection.setTransport(transportFile, [{ wisp: this.wispUrl }]);
    this.logging.createLog(`Transport Set: ${this.connection.getTransport}`);
  }

  search(input: string) {
    input = input.trim();
    const searchTemplate = this.searchVar || "https://www.duckduckgo.com/?q=%s";
    try {
      return new URL(input).toString();
    } catch (err) {
      try {
        const url = new URL(`http://${input}`);
        if (url.hostname.includes(".")) {
          return url.toString();
        }
        throw new Error("Invalid hostname");
      } catch (err) {
        return searchTemplate.replace("%s", encodeURIComponent(input));
      }
    }
  }

  async registerSW(swConfig: Record<any, any>) {
    switch (swConfig.type) {
      case "sw":
        if ("serviceWorker" in navigator) {
          const scpe: string =
            swConfig.config.prefix.match(/^\/[^/]+\//)?.[0] || "";
          await navigator.serviceWorker.register(swConfig.file, {
            scope: scpe,
          });

          navigator.serviceWorker.ready.then(async () => {
            await this.setTransports().then(async () => {
              const transport = await this.connection.getTransport();
              if (transport == null) {
                this.setTransports();
              }
            });
            this.updateSW();
          });
        }
        break;
      case "iframe":
        console.log("iframe proxy selected");
        break;
      case "multi":
        console.log("multi proxy selected");
        break;
    }
  }

  updateSW() {
    const self = this;
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
      registrations.forEach((registration) => {
        registration.update();
        self.logging.createLog(
          `Service Worker at ${registration.scope} Updated`,
        );
      });
    });
  }

  uninstallSW() {
    const self = this;
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
      registrations.forEach((registration) => {
        registration.unregister();
        self.logging.createLog(
          `Service Worker at ${registration.scope} Unregistered`,
        );
      });
    });
  }

  async fetchProxyMapping() {
    try {
      const response = await fetch("/json/proxy.json");
      if (!response.ok) throw new Error("Failed to load proxy mappings.");
      return await response.json();
    } catch (error) {
      console.error("Error fetching proxy mappings:", error);
      return null;
    }
  }

  getDomainFromUrl(url: string) {
    try {
      return new URL(url).hostname;
    } catch (error) {
      console.error("Invalid URL format:", error);
      return null;
    }
  }

  async determineProxy(domain: string) {
    const proxyMapping = await this.fetchProxyMapping();
    if (proxyMapping) {
      return proxyMapping[domain] || proxyMapping["default"];
    }
    return "uv";
  }

  async automatic(input: string, swConfig: Record<any, any>) {
    const domain = this.getDomainFromUrl(input);
    if (domain) {
      const selectedProxy = await this.determineProxy(domain);

      var {
        type: swType,
        file: swFile,
        config: swConfigSettings,
        func: swFunction,
      } = swConfig[selectedProxy] ?? {
        type: "sw",
        file: "/data/sw.js",
        config: window.__uv$config,
        func: null,
      };

      if (swFunction) swFunction();

      await this.registerSW({
        type: swType,
        file: swFile,
        config: swConfigSettings,
      });
      await this.setTransports();

      return { type: swType, file: swFile, config: swConfigSettings };
    } else {
      return null;
    }
  }

  async redirect(swConfig: Record<any, any>, proxySetting: string, url: any) {
    this.registerSW(swConfig[proxySetting].file).then(async () => {
      await this.setTransports();
    });
    let swConfigSettings: Record<any, any> = {};
    if (proxySetting === "auto") {
      const result = await swConfig.auto.func(this.search(url)); //amplify
      swConfigSettings = result;
    } else {
      swConfigSettings = swConfig[proxySetting];
    }
    let activeIframe: HTMLIFrameElement | null;
    activeIframe = document.querySelector("iframe.active");
    if (activeIframe) {
      switch (swConfigSettings.type) {
        case "sw":
          let encodedUrl =
            swConfigSettings.config.prefix +
            window.__uv$config.encodeUrl(this.search(url));
          if (activeIframe) {
            activeIframe.src = encodedUrl;
          }
          break;
      }
    }
  }

  async inFrame_Redirect(
    swConfig: Record<any, any>,
    proxySetting: string,
    url: string,
  ) {
    this.registerSW(swConfig[proxySetting].file).then(async () => {
      await this.setTransports();
    });
    let swConfigSettings: Record<any, any>;
    if (proxySetting === "auto") {
      const result = await swConfig.auto.func(this.search(url));
      swConfigSettings = result;
    } else {
      swConfigSettings = swConfig[proxySetting];
    }
    switch (swConfigSettings.type) {
      case "sw":
        let encodedUrl =
          swConfigSettings.config.prefix +
          window.__uv$config.encodeUrl(this.search(url));
        location.href = encodedUrl;
        break;
    }
  }

  async convertURL(
    swConfig: Record<any, any>,
    proxySetting: string,
    url: string,
  ) {
    this.registerSW(swConfig[proxySetting].file).then(async () => {
      await this.setTransports();
    });
    let swConfigSettings: Record<any, any>;
    if (proxySetting === "auto") {
      const result = await swConfig.auto.func(this.search(url));
      swConfigSettings = result;
    } else {
      swConfigSettings = swConfig[proxySetting];
    }
    let encodedUrl =
      swConfigSettings.config.prefix +
      window.__uv$config.encodeUrl(this.search(url));
    return encodedUrl;
  }

  async fetch(url: any, params?: any) {
    await this.setTransports();
    const client = new BareMux.BareClient();
    let response: Response;

    if (params) {
      response = await client.fetch(url, params);
    } else {
      response = await client.fetch(url);
    }

    return await response.text();
  }

  async getFavicon(
    url: string,
    swConfig: Record<any, any>,
    proxySetting: string,
  ) {
    let page = await this.fetch(url);
    page = await page.toString();

    const parser = new DOMParser();
    const doc = parser.parseFromString(page, "text/html");

    let favicon =
      doc.querySelector("link[rel='icon']") ||
      doc.querySelector("link[rel='shortcut icon']");

    if (favicon) {
      let href: string | null;
      href = favicon.getAttribute("href");
      if (typeof href == "string") {
        if (!href.startsWith("http")) {
          let base = new URL(url);
          href = base.origin + (href.startsWith("/") ? href : "/" + href);
        }
        this.registerSW(swConfig[proxySetting].file).then(async () => {
          await this.setTransports();
        });
        let swConfigSettings = swConfig[proxySetting];
        let encodedHref =
          swConfigSettings.config.prefix + window.__uv$config.encodeUrl(href);

        return encodedHref;
      } else {
        return null;
      }
    }
    return null;
  }
}

export { Proxy };
