import { Nightmare } from "@libs/Nightmare/nightmare";
import { NightmarePlugins } from "@browser/nightmarePlugins";
import { SettingsAPI } from "@apis/settings";
import { EventSystem } from "@apis/events";
import { ProfilesAPI } from "@apis/profiles";
import { Logger } from "@apis/logging";
import { Proxy } from "@apis/proxy";
import { Windowing } from "@browser/windowing";
import { Global } from "@js/global/index";
import { Render } from "@browser/render";
import { Items } from "@browser/items";
import { Protocols } from "@browser/protocols";
import { Utils } from "@js/utils";
import { Tabs } from "@browser/tabs";
import { Functions } from "@browser/functions";
import { Keys } from "@browser/keys";
import { Search } from "@browser/search";

document.addEventListener("DOMContentLoaded", async () => {
  const nightmare = new Nightmare();
  const nightmarePlugins = new NightmarePlugins();

  const settingsAPI = new SettingsAPI();
  const eventsAPI = new EventSystem();
  const profilesAPI = new ProfilesAPI();
  const loggingAPI = new Logger();

  profilesAPI.init();

  const proxy = new Proxy();

  const proxySetting = (await settingsAPI.getItem("proxy")) ?? "sj";
  let swConfigSettings: Record<string, any> = {};
  const swConfig = {
    uv: {
      type: "sw",
      file: "/data/sw.js",
      config: window.__uv$config,
      func: null,
    },
    sj: {
      type: "sw",
      file: "/assets/sw.js",
      config: window.__scramjet$config,
      func: async () => {
        if ((await settingsAPI.getItem("scramjet")) != "fixed") {
          const scramjet = new ScramjetController(window.__scramjet$config);
          scramjet.init().then(async () => {
            await proxy.setTransports();
          });
          await settingsAPI.setItem("scramjet", "fixed");
        } else {
          const scramjet = new ScramjetController(window.__scramjet$config);
          scramjet.init().then(async () => {
            await proxy.setTransports();
          });

          console.log("Scramjet Service Worker registered.");
        }
      },
    },
    auto: {
      type: "multi",
      file: null,
      config: null,
      func: null,
    },
  };
  const proto = new Protocols(swConfig, proxySetting);
  const windowing = new Windowing();
  const globalFunctions = new Global();
  const render = new Render(
    document.getElementById("browser-container") as HTMLDivElement
  );
  const items = new Items();
  const utils = new Utils();
  //const history = new History(utils, proxy, swConfig, proxySetting);
  const tabs = new Tabs(render, proto, swConfig, proxySetting);

  tabs.createTab("daydream://newtab");

  const functions = new Functions(tabs, proto);
  const keys = new Keys(tabs, functions);

  keys.init();

  if (
    proxySetting === "sj" &&
    swConfig[proxySetting as keyof typeof swConfig] &&
    typeof swConfig[proxySetting as keyof typeof swConfig].func === "function"
  ) {
    await (swConfig[proxySetting as keyof typeof swConfig].func as Function)();
  }

  proxy
    .registerSW(swConfig[proxySetting as keyof typeof swConfig])
    .then(async () => {
      await proxy.setTransports().then(async () => {
        const transport = await proxy.connection.getTransport();
        if (transport == null) {
          proxy.setTransports();
        }
      });
    });
  const uvSearchBar = items.addressBar;

  uvSearchBar!.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      console.log("Searching...");

      const searchValue = uvSearchBar!.value.trim();

      if (searchValue.startsWith("daydream://")) {
        const url = (await proto.processUrl(searchValue)) || "/internal/error/";
        const iframe = items.iframeContainer!.querySelector(
          "iframe.active"
        ) as HTMLIFrameElement | null;
        iframe!.setAttribute("src", url);
      } else {
        if (proxySetting === "auto") {
          const result = (await proxy.automatic(
            proxy.search(searchValue),
            swConfig
          )) as Record<string, any>;
          swConfigSettings = result;
          window.SWSettings = swConfigSettings;
        } else {
          swConfigSettings = swConfig[proxySetting as keyof typeof swConfig];
          window.SWSettings = swConfigSettings;
        }

        if (
          proxySetting === "sj" &&
          swConfigSettings &&
          typeof swConfigSettings.func === "function"
        ) {
          await swConfigSettings.func();
        }

        await proxy.registerSW(swConfigSettings).then(async () => {
          await proxy.setTransports();
        });

        console.log("swConfigSettings:", swConfigSettings);
        console.log(
          "swConfigSettings.func exists:",
          typeof swConfigSettings.func === "function"
        );
        if (swConfigSettings && typeof swConfigSettings.func === "function") {
          swConfigSettings.func();
        } else {
          console.warn("No function to execute in swConfigSettings.func");
        }

        console.log(
          `Using proxy: ${proxySetting}, Settings are: ` +
            (await swConfigSettings)
        );
        console.log(swConfigSettings);

        if (swConfigSettings && swConfigSettings.type) {
          switch (swConfigSettings.type) {
            case "sw":
              let encodedUrl;
              if (proxySetting == "dy") {
                encodedUrl =
                  swConfigSettings.config.prefix +
                  "route?url=" +
                  window.__uv$config.encodeUrl(proxy.search(searchValue));
              } else {
                encodedUrl =
                  swConfigSettings.config.prefix +
                  window.__uv$config.encodeUrl(proxy.search(searchValue));
              }
              const activeIframe = document.querySelector(
                "iframe.active"
              ) as HTMLIFrameElement;
              if (activeIframe) {
                activeIframe.src = encodedUrl;
              }
              if (!activeIframe) {
                tabs.createTab(location.origin + encodedUrl);
              }
              break;
          }
        }
      }
    }
  });

  functions.init();

  const searchbar = new Search(proxy, swConfig, proxySetting, proto);
  searchbar.init(items.addressBar!);

  uvSearchBar!.addEventListener("keydown", (e) => {
    if (e.key == "Enter") {
      e.preventDefault();
      setTimeout(() => {
        searchbar.clearSuggestions();
        document
          .querySelector("#suggestion-list.suggestion-list")!
          .setAttribute("style", "display:none;");
      }, 30);
    }
  });

  window.nightmare = nightmare;
  window.nightmarePlugins = nightmarePlugins;
  window.settings = settingsAPI;
  window.eventsAPI = eventsAPI;
  window.protocols = proto;
  window.proxy = proxy;
  window.logging = loggingAPI;
  window.profiles = profilesAPI;
  window.globals = globalFunctions;
  window.renderer = render;
  window.items = items;
  window.utils = utils;
  window.tabs = tabs;
  window.windowing = windowing;
  window.functions = functions;
  window.keys = keys;
  window.searchbar = searchbar;
  window.SWconfig = swConfig;
  window.ProxySettings = proxySetting;
});
