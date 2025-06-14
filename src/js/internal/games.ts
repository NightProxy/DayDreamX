import { Nightmare } from "@libs/Nightmare/nightmare";
import { SettingsAPI } from "@apis/settings";
import { DDXGlobal } from "@js/global";
import { Proxy } from "@apis/proxy";

(async () => {
  const nightmare = new Nightmare();

  const settingsAPI = new SettingsAPI();

  // @ts-expect-error
  const global = new DDXGlobal();

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

  // Simplified Rendering System based on the one I wrote for Light. (Im Lazy)
  let appsData: any[];

  function getAppElement(app: any) {
    const appElement = nightmare.createElement(
      "div",
      {
        class: "app",
        onclick: () => {
          launch(app.link);
        },
      },
      [
        nightmare.createElement("div", { class: "img-container" }, [
          nightmare.createElement("img", { src: app.image }),
          nightmare.createElement("p", {}, [app.name]),
        ]),
      ],
    );

    return appElement;
  }

  function renderApps(filteredApps: any[] = []) {
    const appsGrid = document.getElementById("gamesGrid");
    appsGrid!.innerHTML = "";

    filteredApps.sort((a: any, b: any) => a.name.localeCompare(b.name));

    filteredApps.forEach((app) => {
      const appElement = getAppElement(app);
      appsGrid!.appendChild(appElement);
    });
  }

  async function fetchAppData() {
    try {
      const response = await fetch("/json/g.json");
      appsData = await response.json();
      return appsData;
    } catch (error) {
      console.error("Error fetching JSON data:", error);
      return [];
    }
  }

  async function initializePage() {
    await fetchAppData();
    renderApps(appsData);
  }

  initializePage();

  async function launch(link: string) {
    if (proxySetting === "auto") {
      const result = (await proxy.automatic(
        proxy.search(link),
        swConfig,
      )) as Record<string, any>;
      swConfigSettings = result;
    } else {
      swConfigSettings = swConfig[proxySetting as keyof typeof swConfig];
    }

    await proxy.registerSW(swConfigSettings).then(async () => {
      await proxy.setTransports();
    });

    let encodedUrl =
      swConfigSettings.config.prefix +
      window.__uv$config.encodeUrl(proxy.search(link));
    location.href = encodedUrl;
  }
})();
