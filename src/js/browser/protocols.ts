import { Logger } from "@apis/logging";
import { SettingsAPI } from "@apis/settings";
import { Items } from "@browser/items";
import { Proxy } from "@apis/proxy";

interface RouteEntry {
  url: string;
  proxy: boolean;
}

interface ProtoInterface {
  logging: Logger;
  settings: SettingsAPI;
  items: Items;
  proxy: Proxy;
  register(proto: string, path: string, url: string, proxy: boolean): void;
  processUrl(url: string): Promise<string | void>;
  getInternalURL(url: string): Promise<string | void>;
  navigate(url: string): void;
}

class Protocols implements ProtoInterface {
  logging: Logger;
  settings: SettingsAPI;
  items: Items;
  proxy: Proxy;
  private routes: Map<string, Map<string, RouteEntry>>;
  private swConfig: Record<any, any>;
  private proxySetting: string;

  constructor(swConfig: Record<any, any>, proxySetting: string) {
    this.logging = new Logger();
    this.settings = new SettingsAPI();
    this.items = new Items();
    this.proxy = new Proxy();
    this.routes = new Map();
    this.swConfig = swConfig;
    this.proxySetting = proxySetting;
    this.register("daydream", "*", "/internal", false);
  }

  register(proto: string, path: string, url: string, proxy: boolean): void {
    const cleanProto = proto.toLowerCase();
    if (!this.routes.has(cleanProto)) {
      this.routes.set(cleanProto, new Map());
    }
    this.routes.get(cleanProto)!.set(path, { url, proxy });
  }

  processUrl(url: string): Promise<string | void> {
    if (url.startsWith("javascript:")) {
      const js = url.slice("javascript:".length);
      const iframe = document.querySelector(
        "iframe.active",
      ) as HTMLIFrameElement | null;
      if (iframe?.contentWindow) {
        (iframe.contentWindow as any).eval(js);
      }
    }

    const match = url.match(/^([a-zA-Z0-9+.-]+):\/\/(.+)/);
    if (match) {
      const proto = match[1].toLowerCase();
      const path = match[2];
      const protoRoutes = this.routes.get(proto);

      if (protoRoutes) {
        let resolved: RouteEntry | undefined;

        if (protoRoutes.has(path)) {
          resolved = protoRoutes.get(path);
        } else if (protoRoutes.has("*")) {
          const wildcard = protoRoutes.get("*");
          if (wildcard) {
            const fullUrl = this.joinURL(wildcard.url, path);
            return Promise.resolve(
              wildcard.proxy
                ? this.proxy.convertURL(
                    this.swConfig,
                    this.proxySetting,
                    fullUrl,
                  )
                : fullUrl,
            );
          }
        }

        if (resolved) {
          return Promise.resolve(
            resolved.proxy
              ? this.proxy.convertURL(
                  this.swConfig,
                  this.proxySetting,
                  resolved.url,
                )
              : resolved.url,
          );
        }
      }
    }

    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("/") ||
      url.startsWith("data:")
    ) {
      return Promise.resolve(url);
    }

    return Promise.resolve("/internal/" + url);
  }

  getInternalURL(url: string): Promise<string | void> {
    for (const [proto, pathMap] of this.routes.entries()) {
      for (const [pathKey, { url: baseUrl }] of pathMap.entries()) {
        if (pathKey === "*") {
          if (url.startsWith(baseUrl)) {
            const remainingPath = url.slice(baseUrl.length).replace(/^\/+/, "");
            return Promise.resolve(`${proto}://${remainingPath}`);
          }
        } else {
          if (url === baseUrl) {
            return Promise.resolve(`${proto}://${pathKey}`);
          }
        }
      }
    }

    if (url.startsWith("/internal/")) {
      return Promise.resolve("daydream://" + url.slice("/internal/".length));
    }

    return Promise.resolve(url);
  }

  async navigate(url: string): Promise<void> {
    const processedUrl = (await this.processUrl(url)) || "/internal/error/";
    if (!this.items.iframeContainer) {
      this.logging.createLog("iframeContainer is not available.");
      return;
    }
    const iframe = this.items.iframeContainer!.querySelector(
      "iframe.active",
    ) as HTMLIFrameElement | null;
    iframe!.setAttribute("src", processedUrl);
    this.logging.createLog(`Navigated to: ${processedUrl}`);
  }

  private joinURL(base: string, path: string): string {
    const endsWithSlash = base.endsWith("/");
    const startsWithSlash = path.startsWith("/");
    if (endsWithSlash && startsWithSlash) {
      return base + path.slice(1);
    } else if (!endsWithSlash && !startsWithSlash) {
      return base + "/" + path;
    }
    return base + path;
  }
}

export { Protocols };
