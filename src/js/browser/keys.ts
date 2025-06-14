import { SettingsAPI } from "@apis/settings";
import { EventSystem } from "@apis/events";

interface keysInterface {
  keys: any;
  tabs: any;
  functions: any;
  settings: SettingsAPI;
  events: EventSystem;
}

class Keys implements keysInterface {
  keys: any;
  tabs: any;
  functions: any;
  settings: SettingsAPI;
  events: EventSystem;
  constructor(tabs: any, functions: any) {
    this.keys = [];
    this.tabs = tabs;
    this.functions = functions;
    this.settings = new SettingsAPI();
    this.events = new EventSystem();
  }

  init() {
    window.addEventListener("keydown", async (event) => {
      if (event.altKey && event.key === "t") {
        this.tabs.createTab("daydream://newtab");
      } else if (event.ctrlKey && event.key === "t") {
        event.preventDefault();
        this.tabs.createTab("daydream://newtab");
      } else if (event.altKey && event.key === "w") {
        this.tabs.closeCurrentTab();
      } else if (event.altKey && event.key === "ArrowLeft") {
        const activeIframe = document.querySelector(
          "iframe.active",
        ) as HTMLIFrameElement;
        if (activeIframe) {
          activeIframe?.contentWindow?.history.back();
        }
        // Go Next
      } else if (event.altKey && event.key === "ArrowRight") {
        const activeIframe = document.querySelector(
          "iframe.active",
        ) as HTMLIFrameElement;
        if (activeIframe) {
          activeIframe?.contentWindow?.history.forward();
        }
        // Reload page
      } else if (event.altKey && event.key === "r") {
        const activeIframe = document.querySelector(
          "iframe.active",
        ) as HTMLIFrameElement;
        if (activeIframe) {
          activeIframe?.contentWindow?.location.reload();
        }
      } else if (event.altKey && event.keyCode === 116) {
        const activeIframe = document.querySelector(
          "iframe.active",
        ) as HTMLIFrameElement;
        if (activeIframe) {
          activeIframe?.contentWindow?.location.reload();
        }
      } else if (event.altKey && event.shiftKey && event.key === "I") {
        event.preventDefault();
        const activeIframe = document.querySelector(
          "iframe.active",
        ) as HTMLIFrameElement;
        if (activeIframe) {
          this.functions.inspectElement();
        }
      } else if (event.altKey && event.key === "s") {
        const sidebar = document.querySelector(".navbar");
        const browser = document.querySelector(".surface");
        const tabs = document.querySelector(".tabs");
        const bar = document.querySelector(".under-tabs");
        const IFcontainer = document.querySelector(".viewport");
        const suggestions = document.querySelector(".suggestion-list");
        const isDisabled = sidebar!.classList.toggle("autohide");

        if (isDisabled) {
          browser!.classList.add("autohide");
          tabs!.classList.add("vertical");
          bar!.classList.add("vertical");
          IFcontainer!.classList.add("vertical");
          if (suggestions != null) {
            suggestions.classList.add("vertical");
          }
        } else {
          browser!.classList.remove("autohide");
          tabs!.classList.remove("vertical");
          bar!.classList.remove("vertical");
          IFcontainer!.classList.remove("vertical");
          if (suggestions != null) {
            suggestions.classList.remove("vertical");
          }
        }
        let val;
        if (isDisabled) {
          val = "true";
        } else {
          val = "false";
        }

        await this.settings.setItem("verticalTabs", val);
        this.events.emit("tabs:changeLayout", null);
      } else if (event.altKey && event.shiftKey && event.key === "S") {
        if ((await this.settings.getItem("verticalTabs")) === "true") {
          const tabs = document.querySelector(".tabs");
          const viewport = document.querySelector(".viewport");
          const isDisabled = tabs!.classList.toggle("hidden");

          if (isDisabled) {
            tabs!.classList.add("hidden");
            viewport!.classList.add("hidden");
          } else {
            tabs!.classList.remove("hidden");
            viewport!.classList.remove("hidden");
          }

          let val;
          if (isDisabled) {
            val = "true";
          } else {
            val = "false";
          }
          // Save the current state to this.settings
          await this.settings.setItem("verticalTabs-notshowing", val);
        } else {
          return;
        }
      }
    });
    /*const iframes = document.querySelectorAll(".iframe-container iframe");
    iframes.forEach((iframe) => {
      iframe.contentWindow.addEventListener("keydown", async (event) => {
        
      });
    });*/
  }
}

export { Keys };
