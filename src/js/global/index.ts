import { SettingsAPI } from "@apis/settings";
import { Themeing } from "@js/global/theming";
import { Windowing } from "@browser/windowing";
import { EventSystem } from "@apis/events";

interface DDXGlobalInterface {
  settings: SettingsAPI;
  events: EventSystem;
  theming: Themeing;
  windowing: Windowing;
  init: () => Promise<void>;
}

class DDXGlobal implements DDXGlobalInterface {
  settings: SettingsAPI;
  events: EventSystem;
  theming: Themeing;
  windowing: Windowing;
  constructor() {
    this.settings = new SettingsAPI();
    this.events = new EventSystem();
    this.theming = new Themeing();
    this.windowing = new Windowing();
    this.init();
  }
  async init() {
    /*if ("serviceWorker" in navigator) {
      await navigator.serviceWorker.register("/core.sw.js", { scope: "/" });
      this.events.addEventListener("ddx.cache:reset", () => {
        navigator.serviceWorker.getRegistration("/").then((reg) => {
          reg?.active?.postMessage("reset");
        });
      });
      this.events.addEventListener("ddx.cache:offline", () => {
        console.log("We are offline")
      })
    }*/
    this.theming.init();
    if (
      window === window.top &&
      this.windowing != null &&
      (await this.settings.getItem("autoCloak")) === "true"
    ) {
      switch (await this.settings.getItem("URL_Cloak")) {
        case "a:b":
          this.windowing.aboutBlank();
          break;
        case "blob":
          this.windowing.BlobWindow();
          break;
        case "off":
          break;
        default:
          break;
      }
    }
  }
}
export { DDXGlobal };
