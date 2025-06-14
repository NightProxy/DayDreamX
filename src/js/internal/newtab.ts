import { Nightmare } from "@libs/Nightmare/nightmare";
import { NightmarePlugins } from "@browser/nightmarePlugins";
import { SettingsAPI } from "@apis/settings";
import { ProfilesAPI } from "@apis/profiles";
import { Proxy } from "@apis/proxy";
import { DDXGlobal } from "@js/global/index";

document.addEventListener("DOMContentLoaded", async () => {
  const nightmare = new Nightmare();

  const settingsAPI = new SettingsAPI();
  const profilesAPI = new ProfilesAPI();

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

          console.log("Scramjet Service Worker registered.");
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

  // @ts-expect-error
  const globalFunctions = new DDXGlobal();

  async function getFavicon(url: string) {
    try {
      var googleFaviconUrl = `/internal/icons/${encodeURIComponent(url)}`;
      return googleFaviconUrl;
    } catch (error) {
      console.error("Error fetching favicon as data URL:", error);
      return null;
    }
  }

  if (
    typeof swConfig[proxySetting as keyof typeof swConfig].func ===
      "function" &&
    proxySetting === "sj"
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
  const uvSearchBar = document.querySelector(
    "#newTabSearch",
  ) as HTMLInputElement;

  const engineIconElem = document.querySelector(
    ".searchEngineIcon",
  ) as HTMLImageElement | null;
  engineIconElem!.style.display = "block";
  switch (await settingsAPI.getItem("search")) {
    case "https://duckduckgo.com/?q=%s":
      engineIconElem!.src = "/res/b/ddg.webp";
      engineIconElem!.style.transform = "scale(1.35)";
      break;
    case "https://bing.com/search?q=%s":
      engineIconElem!.src = "/res/b/bing.webp";
      engineIconElem!.style.transform = "scale(1.65)";
      break;
    case "https://www.google.com/search?q=%s":
      engineIconElem!.src = "/res/b/google.webp";
      engineIconElem!.style.transform = "scale(1.2)";
      break;
    case "https://search.yahoo.com/search?p=%s":
      engineIconElem!.src = "/res/b/yahoo.webp";
      engineIconElem!.style.transform = "scale(1.5)";
      break;
    default:
      getFavicon(await settingsAPI.getItem("search")).then((dataUrl) => {
        if (dataUrl == null || dataUrl.endsWith("null")) {
          engineIconElem!.src = "/res/b/ddg.webp";
          engineIconElem!.style.transform = "scale(1.35)";
        } else {
          engineIconElem!.src = dataUrl;
          engineIconElem!.style.transform = "scale(1.2)";
        }
      });
  }

  uvSearchBar!.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      console.log("Searching...");

      const searchValue = uvSearchBar!.value.trim();

      if (searchValue.startsWith("daydream://")) {
        const url = searchValue.replace("daydream://", "/internal/");
        location.href = url;
      } else {
        if (proxySetting === "auto") {
          const result = (await proxy.automatic(
            proxy.search(searchValue),
            swConfig,
          )) as Record<string, any>;
          swConfigSettings = result;
        } else {
          swConfigSettings = swConfig[proxySetting as keyof typeof swConfig];
        }

        await proxy.registerSW(swConfigSettings);

        console.log("swConfigSettings:", swConfigSettings);
        console.log(
          "swConfigSettings.func exists:",
          typeof swConfigSettings.func === "function",
        );
        if (swConfigSettings && typeof swConfigSettings.func === "function") {
          swConfigSettings.func();
        } else {
          console.warn("No function to execute in swConfigSettings.func");
        }

        console.log(
          `Using proxy: ${proxySetting}, Settings are: ` +
            (await swConfigSettings),
        );
        console.log(swConfigSettings);

        switch (swConfigSettings.type) {
          case "sw":
            let encodedUrl =
              swConfigSettings.config.prefix +
              window.__uv$config.encodeUrl(proxy.search(searchValue));
            location.href = encodedUrl;
            break;
        }
      }
    }
  });

  const nightmarePlugins = new NightmarePlugins();

  let rightclickmenucontent = nightmare.createElement("div", {}, [
    nightmare.createElement(
      "div",
      {
        class: "menu-item",
        id: "settingsButton",
        onclick: () => {
          window.parent.tabs.createTab("daydream://settings");
        },
      },
      [
        nightmare.createElement(
          "span",
          { class: "material-symbols-outlined" },
          ["settings"],
        ),
        nightmare.createElement("span", { class: "menu-label" }, ["Settings"]),
      ],
    ),
    nightmare.createElement(
      "div",
      {
        class: "menu-item",
        id: "about-blankButton",
        onclick: () => {
          window.parent.windowing.aboutBlankWindow();
        },
      },
      [
        nightmare.createElement(
          "span",
          { class: "material-symbols-outlined" },
          ["visibility_off"],
        ),
        nightmare.createElement("span", { class: "menu-label" }, [
          "About:Blank",
        ]),
      ],
    ),
  ]);

  nightmarePlugins.rightclickmenu.attachTo(
    document.querySelector("body") as HTMLBodyElement,
    rightclickmenucontent,
  );
});
