import { Nightmare as UI } from "@libs/Nightmare/nightmare";
import { Protocols } from "@browser/protocols";
import { Utils } from "@js/utils";
import { Items } from "@browser/items";
import { Logger } from "@apis/logging";
import { SettingsAPI } from "@apis/settings";
import { EventSystem } from "@apis/events";
import { Proxy } from "@apis/proxy";
import Draggabilly from "draggabilly";

interface TabsInterface {
  render: any;
  ui: UI;
  proto: Protocols;
  utils: Utils;
  items: Items;
  logger: Logger;
  settings: SettingsAPI;
  eventsAPI: EventSystem;
  tabCount: number;
  tabs: any[];
  groups: any[];
  draggabillies: any[];
  el: HTMLDivElement;
  instanceId: number;
  styleEl: HTMLStyleElement;
  proxy: Proxy;
  swConfig: any;
  proxySetting: string;
  isDragging: boolean;
  draggabillyDragging: any;
}

class Tabs implements TabsInterface {
  render: any;
  ui: UI;
  proto: Protocols;
  utils: Utils;
  items: Items;
  logger: Logger;
  settings: SettingsAPI;
  eventsAPI: EventSystem;
  tabCount: number;
  tabs: any[];
  groups: any[];
  draggabillies: any[];
  el: HTMLDivElement;
  instanceId: number;
  styleEl: HTMLStyleElement;
  proxy: Proxy;
  swConfig: any;
  proxySetting: string;
  isDragging: boolean;
  draggabillyDragging: any;
  constructor(render: any, proto: any, swConfig: any, proxySetting: string) {
    this.render = render;
    this.ui = new UI();
    this.proto = proto;
    this.utils = new Utils();
    this.items = new Items();
    this.logger = new Logger();
    this.settings = new SettingsAPI();
    this.eventsAPI = new EventSystem();
    this.tabCount = 0;
    this.tabs = [];
    this.groups = [];
    this.draggabillies = [];
    this.el = render.container;
    this.proxy = new Proxy();
    this.swConfig = swConfig;
    this.proxySetting = proxySetting;
    this.isDragging = false;

    this.instanceId = 0;
    this.instanceId += 1;

    this.styleEl = document.createElement("style");
    this.el.appendChild(this.styleEl);

    window.addEventListener("resize", (_) => {
      this.layoutTabs();
    });

    this.eventsAPI.addEventListener("tabs:changeLayout", (_) => {
      console.log("changing layout");
      setTimeout(() => {
        this.layoutTabs();
        this.setupSortable();
      }, 200);
    });
  }

  get tabEls() {
    return Array.prototype.slice.call(this.el.querySelectorAll(".tab"));
  }

  get pinnedTabEls() {
    return Array.prototype.slice.call(this.el.querySelectorAll(".tab.pinnned"));
  }
  get unpinedTabEls() {
    return Array.prototype.slice.call(
      this.el.querySelectorAll(".tab:not(.tab.pinned)"),
    );
  }

  get tabContentWidths() {
    const numberOfTabs = this.tabEls.length;
    const tabsContentWidth =
      this.el.querySelector(".tabs-content")!.clientWidth;
    const tabsCumulativeOverlappedWidth = (numberOfTabs - 1) * 1;
    const targetWidth =
      (tabsContentWidth - 2 * 9 + tabsCumulativeOverlappedWidth) / numberOfTabs;
    const clampedTargetWidth = Math.max(24, Math.min(240, targetWidth));
    const flooredClampedTargetWidth = Math.floor(clampedTargetWidth);
    const totalTabsWidthUsingTarget =
      flooredClampedTargetWidth * numberOfTabs +
      2 * 9 -
      tabsCumulativeOverlappedWidth;
    const totalExtraWidthDueToFlooring =
      tabsContentWidth - totalTabsWidthUsingTarget;

    const widths = [];
    let extraWidthRemaining = totalExtraWidthDueToFlooring;
    for (let i = 0; i < numberOfTabs; i += 1) {
      const extraWidth =
        flooredClampedTargetWidth < 240 && extraWidthRemaining > 0 ? 1 : 0;
      widths.push(flooredClampedTargetWidth + extraWidth);
    }

    return widths;
  }

  get tabContentPositions() {
    const positions: any[] = [];
    const tabContentWidths = this.tabContentWidths;

    let position = 9;
    tabContentWidths.forEach((width, i) => {
      const offset = i * 1;
      positions.push(position + 4 - offset);
      position += width;
    });

    return positions;
  }

  get tabPositions() {
    const positions: any[] = [];

    this.tabContentPositions.forEach((contentPosition) => {
      positions.push(contentPosition);
    });

    return positions;
  }

  get tabContentHeights() {
    const numberOfTabs = this.tabEls.length;
    const tabsContentHeight =
      this.el.querySelector(".tabs-content")!.clientHeight;
    const tabsCumulativeOverlappedHeight = (numberOfTabs - 1) * 1; // Adjust for slight overlap
    const targetHeight =
      (tabsContentHeight + tabsCumulativeOverlappedHeight) / numberOfTabs;
    const clampedTargetHeight = Math.max(24, Math.min(36, targetHeight));
    const flooredClampedTargetHeight = Math.floor(clampedTargetHeight);
    const totalTabsHeightUsingTarget =
      flooredClampedTargetHeight * numberOfTabs -
      tabsCumulativeOverlappedHeight;
    const totalExtraHeightDueToFlooring =
      tabsContentHeight - totalTabsHeightUsingTarget;

    // TODO - Support tabs with different heights / e.g. "pinned" tabs
    const heights = [];
    let extraHeightRemaining = totalExtraHeightDueToFlooring;
    for (let i = 0; i < numberOfTabs; i += 1) {
      const extraHeight =
        flooredClampedTargetHeight < 36 && extraHeightRemaining > 0 ? 1 : 0;
      heights.push(flooredClampedTargetHeight + extraHeight);
    }

    return heights;
  }

  get tabContentPositionsY() {
    const positions: any[] = [];
    const tabContentHeights = this.tabContentHeights;

    let position = 9;
    tabContentHeights.forEach((height, i) => {
      const offset = i * 1; // Adjust for overlap offset
      positions.push(position + 4 - offset);
      position += height;
    });

    return positions;
  }

  get tabPositionsY() {
    const positions: any[] = [];

    this.tabContentPositionsY.forEach((contentPosition) => {
      positions.push(contentPosition);
    });

    return positions;
  }

  async createTab(url: string, prox: boolean = false) {
    this.tabCount++;
    console.log(prox);
    const id = `tab-${this.tabCount}`;
    const iframe = this.ui.createElement("iframe", {
      src: await this.proto.processUrl(url),
    });
    iframe.id = `iframe-${this.tabCount}`;
    iframe.title = `Iframe #${this.tabCount}`;

    const tab = this.ui.createElement(
      "div",
      { class: "tab", id: `tab-${this.tabCount}` },
      [
        this.ui.createElement("div", { class: "tab-background" }),
        this.ui.createElement("div", { class: "tab-content" }, [
          this.ui.createElement("div", { class: "tab-group-color" }),
          this.ui.createElement("div", { class: "tab-favicon" }),
          this.ui.createElement("div", { class: "tab-title" }, ["Untitled"]),
          this.ui.createElement("div", { class: "tab-drag-handle" }),
          this.ui.createElement(
            "button",
            {
              class: "tab-close",
              id: `close-${id}`,
            },
            [
              this.ui.createElement(
                "span",
                { class: "material-symbols-outlined" },
                ["close"],
              ),
            ],
          ),
        ]),
        this.ui.createElement("div", { class: "tab-bottom-border" }),
      ],
    );

    const updateTabTitle = () => {
      if (iframe.contentDocument) {
        const title = iframe.contentDocument.title || "Untitled";
        const tabTitleElement = tab.querySelector(".tab-title");
        if (tabTitleElement && tabTitleElement.textContent !== title) {
          tabTitleElement.textContent = title;
        }
      }
    };
    iframe.addEventListener("load", async () => {
      try {
        if (iframe.contentWindow) {
          this.pageClient(iframe);
          // this.eventsAPI.emit("tab:loaded", { url: iframe.src, iframe: iframe.id });
          updateTabTitle();
          this.setFavicon(tab, iframe);
          observer.observe(iframe.contentDocument!.head, {
            childList: true,
            subtree: true,
          });
          let check = await this.proto.getInternalURL(new URL(iframe.src).pathname);
          if (typeof check === "string" && check.startsWith("daydream://")) {
            this.items.addressBar!.value = check;
            document.querySelector(".webSecurityIcon")!.innerHTML =
              `<span class="material-symbols-outlined">lock_open</span>`;
          } else {
            let IFurl = new URL(iframe.src).pathname;
            IFurl = IFurl.replace(window.SWSettings.config.prefix, "");
            IFurl = window.__uv$config.decodeUrl(IFurl);
            this.items.addressBar!.value = IFurl;
            const fURL = new URL(IFurl);
            if (fURL.protocol == "https:") {
              document.querySelector(".webSecurityIcon")!.innerHTML =
                `<span class="material-symbols-outlined">lock</span>`;
            } else {
              document.querySelector(".webSecurityIcon")!.innerHTML =
                `<span class="material-symbols-outlined">lock_open</span>`;
            }
          }
        } else {
          console.error("Iframe contentWindow is not accessible.");
        }
      } catch (error) {
        console.error("An error occurred while loading the iframe:", error);
      }
    });

    const observer = new MutationObserver(() => {
      updateTabTitle();
      this.setFavicon(tab, iframe);
    });

    tab.addEventListener("click", () => {
      this.selectTab({ tab, iframe, url });
    });

    tab.querySelector(`#close-${id}`)!.addEventListener("click", async () => {
      await this.closeTabById(id);
    });

    this.items.tabGroupsContainer!.appendChild(tab);
    this.items.iframeContainer!.appendChild(iframe);

    this.tabs.push({ id, tab, iframe, url });

    this.selectTab({ tab, iframe, url });

    this.layoutTabs();
    this.setupSortable();
    this.logger.createLog(`Created tab: ${url}`);
  }

  updateTabAttributes() {
    const tabElements = this.items.tabGroupsContainer!.querySelectorAll(".tab");

    tabElements.forEach((element, index) => {
      element.setAttribute("tab", index.toString());
    });
  }

  async closeTabById(id: string) {
    const tabInfo = this.tabs.find((tab) => tab.id === id);
    if (tabInfo) {
      const tabPosition = parseInt(tabInfo.tab.getAttribute("tab") || "0");

      this.eventsAPI.emit("tab:closed", {
        url: tabInfo.iframe.src,
        iframe: tabInfo.iframe.id,
      });

      tabInfo.tab.remove();
      tabInfo.iframe.remove();

      this.tabs = this.tabs.filter((tab) => tab.id !== id);

      this.updateTabAttributes();

      const remainingTabs = document.querySelectorAll(".tab");
      if (remainingTabs.length > 0) {
        let nextTabToSelect: HTMLElement | null = null;

        for (const tab of remainingTabs) {
          if (parseInt(tab.getAttribute("tab") || "0") === tabPosition) {
            nextTabToSelect = tab as HTMLElement;
            break;
          }
        }

        // If no tab at same position, try the previous position
        if (!nextTabToSelect && tabPosition > 0) {
          for (const tab of remainingTabs) {
            if (parseInt(tab.getAttribute("tab") || "0") === tabPosition - 1) {
              nextTabToSelect = tab as HTMLElement;
              break;
            }
          }
        }

        if (!nextTabToSelect && remainingTabs.length > 0) {
          nextTabToSelect = remainingTabs[0] as HTMLElement;
        }


        if (nextTabToSelect) {
          const newTabInfo = this.tabs.find((tab) => tab.id === nextTabToSelect.id);
          console.log(newTabInfo);
          //document.getElementById(newTabInfo!.tab.id)!.click();

          this.tabs.forEach(({ tab, iframe }) => {
            tab.classList.remove("active");
            iframe.classList.remove("active");
          });

          newTabInfo.tab.classList.add("active");
          newTabInfo.iframe.classList.add("active");

          this.eventsAPI.emit("tab:selected", {
            url: newTabInfo.iframe.src,
            iframe: newTabInfo.iframe.id,
          });

          let check = await this.proto.getInternalURL(
            new URL(newTabInfo.iframe.src).pathname,
          );
          if (typeof check === "string" && check.startsWith("daydream://")) {
            this.items.addressBar!.value = check;
          } else {
            let url = new URL(tabInfo.iframe.src).pathname;
            url = url.replace(window.SWSettings.config.prefix, "");
            url = window.__uv$config.decodeUrl(url);
            this.items.addressBar!.value = url;
          }
        }
      } else {
        this.createTab("daydream://newtab");
      }

      this.layoutTabs();
      this.logger.createLog(`Closed tab: ${tabInfo.url}`);
    }
  }

  closeCurrentTab() {
    const activeTab = document.querySelector(".tab.active");
    const activeIFrame = document.querySelector(
      "iframe.active",
    ) as HTMLIFrameElement;

    if (!activeTab || !activeIFrame) return;

    const activeIframeUrl = activeIFrame.src;
    const tabPosition = parseInt(activeTab.getAttribute("tab") || "0");

    this.eventsAPI.emit("tab:closed", {
      url: activeIframeUrl,
      iframe: activeIFrame.id,
    });

    activeTab.remove();
    activeIFrame.remove();

    const activeTabId = activeTab.id.replace("tab-", "");
    this.tabs = this.tabs.filter((tab) => tab.id !== activeTabId);

    this.updateTabAttributes();

    const remainingTabs = document.querySelectorAll(".tab");
    if (remainingTabs.length > 0) {
      let nextTabToSelect: HTMLElement | null = null;

      for (const tab of remainingTabs) {
        if (parseInt(tab.getAttribute("tab") || "0") === tabPosition) {
          nextTabToSelect = tab as HTMLElement;
          break;
        }
      }

      if (!nextTabToSelect && tabPosition > 0) {
        for (const tab of remainingTabs) {
          if (parseInt(tab.getAttribute("tab") || "0") === tabPosition - 1) {
            nextTabToSelect = tab as HTMLElement;
            break;
          }
        }
      }

      if (!nextTabToSelect && remainingTabs.length > 0) {
        nextTabToSelect = remainingTabs[0] as HTMLElement;
      }

      if (nextTabToSelect) {
        nextTabToSelect.click();
      }
    }

    this.layoutTabs();
    this.logger.createLog(`Closed tab: ${activeIframeUrl}`);
  }

  closeAllTabs() {
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.remove();
    });
    document
      .querySelector(".iframe-container")!
      .querySelectorAll("iframe")
      .forEach((page) => {
        page.remove();
      });
    this.logger.createLog(`Closed all tabs`);
  }

  setFavicon(tabElement: HTMLElement, iframe: HTMLIFrameElement): void {
    iframe.addEventListener("load", async () => {
      try {
        if (!iframe.contentDocument) {
          console.error(
            "Unable to access iframe content due to cross-origin restrictions.",
          );
          return;
        }

        let favicon: HTMLLinkElement | null = null;
        const nodeList =
          iframe.contentDocument.querySelectorAll("link[rel~='icon']");

        for (let i = 0; i < nodeList.length; i++) {
          const relAttr = nodeList[i].getAttribute("rel");
          if (relAttr && relAttr.includes("icon")) {
            favicon = nodeList[i] as HTMLLinkElement;
            break;
          }
        }

        if (favicon) {
          let faviconUrl: string | null | undefined =
            favicon.href || favicon.getAttribute("href");
          const faviconImage = tabElement.querySelector(".tab-favicon");

          faviconUrl = await this.proxy.getFavicon(
            faviconUrl as string,
            this.swConfig,
            this.proxySetting,
          );

          if (faviconUrl && faviconImage) {
            faviconImage.setAttribute(
              "style",
              `background-image: url('${faviconUrl}');`,
            );
          } else {
            console.error("Favicon URL or favicon element is missing.");
          }
        } else {
          console.error(
            "No favicon link element found within the iframe document.",
          );
        }
      } catch (error) {
        console.error("An error occurred while setting the favicon:", error);
      }
    });
  }

  async selectTab(tabInfo: any) {
    this.tabs.forEach(({ tab, iframe }) => {
      tab.classList.remove("active");
      iframe.classList.remove("active");
    });

    tabInfo.tab.classList.add("active");
    tabInfo.iframe.classList.add("active");

    this.eventsAPI.emit("tab:selected", {
      url: tabInfo.iframe.src,
      iframe: tabInfo.iframe.id,
    });

    let check = await this.proto.getInternalURL(
      new URL(tabInfo.iframe.src).pathname,
    );
    if (typeof check === "string" && check.startsWith("daydream://")) {
      this.items.addressBar!.value = check;
    } else {
      let url = new URL(tabInfo.iframe.src).pathname;
      url = url.replace(window.SWSettings.config.prefix, "");
      url = window.__uv$config.decodeUrl(url);
      this.items.addressBar!.value = url;
    }


    this.logger.createLog(`Selected tab: ${tabInfo.url}`);
  }

  selectTabById(id: string) {
    document.getElementById(id)!.click();
    this.logger.createLog(`Selected tab: tab-${id}`);
  }

  setupSortable() {
    const tabEls = this.tabEls;
    const tabPositions = this.tabPositions;
    const tabPositionsY = this.tabPositionsY;

    if (this.isDragging) {
      this.isDragging = false;
      this.el.classList.remove("tabs-is-sorting");
      this.draggabillyDragging.element.classList.remove("tab-is-dragging");
      this.draggabillyDragging.element.style.transform = "";
      this.draggabillyDragging.dragEnd();
      this.draggabillyDragging.isDragging = false;
      this.draggabillyDragging.positionDrag = (_: any) => { }; // Prevent Draggabilly from updating tabEl.style.transform in later frames
      this.draggabillyDragging.destroy();
      this.draggabillyDragging = null;
    }

    this.draggabillies.forEach((d) => d.destroy());

    tabEls.forEach(async (tabEl, originalIndex) => {
      const originalTabPositionX = tabPositions[originalIndex];
      const originalTabPositionY = tabPositionsY[originalIndex];
      let ax: "x" | "y";
      if ((await this.settings.getItem("verticalTabs")) == "true") {
        ax = "y";
      } else {
        ax = "x";
      }
      const draggabilly = new Draggabilly(tabEl, {
        axis: ax,
        handle: ".tab-drag-handle",
        containment: this.el.querySelector(".tabs-content")!,
      });

      this.draggabillies.push(draggabilly);

      draggabilly.on("dragStart", (_) => {
        this.isDragging = true;
        this.draggabillyDragging = draggabilly;
        tabEl.classList.add("tab-is-dragging");
        this.el.classList.add("tabs-is-sorting");
        this.eventsAPI.emit("tab:dragStart", null);
      });

      draggabilly.on("dragEnd", async (_) => {
        this.isDragging = false;
        this.eventsAPI.emit("tab:dragEnd", null);
        if ((await this.settings.getItem("verticalTabs")) == "true") {
          const finalTranslateY = parseFloat(tabEl.style.top);
          tabEl.style.transform = `translate3d(0, 0, 0)`;

          requestAnimationFrame((_) => {
            tabEl.style.top = "0";
            tabEl.style.transform = `translate3d(0, ${finalTranslateY}px, 0)`;

            requestAnimationFrame((_) => {
              tabEl.classList.remove("tab-is-dragging");
              this.el.classList.remove("tabs-is-sorting");

              requestAnimationFrame((_) => {
                tabEl.style.transform = "";

                this.layoutTabs();
                this.setupSortable();
              });
            });
          });
        } else {
          const finalTranslateX = parseFloat(tabEl.style.left);
          tabEl.style.transform = `translate3d(0, 0, 0)`;

          requestAnimationFrame((_) => {
            tabEl.style.left = "0";
            tabEl.style.transform = `translate3d(${finalTranslateX}px, 0, 0)`;

            requestAnimationFrame((_) => {
              tabEl.classList.remove("tab-is-dragging");
              this.el.classList.remove("tabs-is-sorting");

              requestAnimationFrame((_) => {
                tabEl.style.transform = "";

                this.layoutTabs();
                this.setupSortable();
              });
            });
          });
        }
      });

      draggabilly.on("dragMove", async (_event, _pointer, moveVector) => {
        const tabEls = this.tabEls;
        const currentIndex = tabEls.indexOf(tabEl);
        if ((await this.settings.getItem("verticalTabs")) == "true") {
          const currentTabPositionY = originalTabPositionY + moveVector.y;
          const destinationIndexTarget = this.utils.closest(
            currentTabPositionY,
            tabPositionsY,
          );
          const destinationIndex = Math.max(
            0,
            Math.min(tabEls.length, destinationIndexTarget),
          );

          if (currentIndex !== destinationIndex) {
            this.animateTabMove(tabEl, currentIndex, destinationIndex);
          }
          const lastTab = tabEls[tabEls.length - 1];
          const lastTabPosition =
            this.tabPositions[this.tabPositions.length - 1];
          const lastTabWidth =
            this.tabContentWidths[this.tabContentWidths.length - 1];
          const translatePx =
            lastTabPosition +
            lastTabWidth +
            (tabEl === lastTab
              ? tabEl.getAttribute(
                "data-was-not-last-tab-when-started-dragging",
              )
                ? moveVector.y - this.tabContentHeights[currentIndex]
                : moveVector.y
              : 0) +
            16;
          (document.querySelector(
            "#create-tab",
          ) as HTMLElement)!.style.transform =
            `translate3d(0, min(${translatePx}px, calc(100vh - 280px)),0px), 0`;
        } else {
          const currentTabPositionX = originalTabPositionX + moveVector.x;
          const destinationIndexTarget = this.utils.closest(
            currentTabPositionX,
            tabPositions,
          );
          const destinationIndex = Math.max(
            0,
            Math.min(tabEls.length, destinationIndexTarget),
          );

          if (currentIndex !== destinationIndex) {
            this.animateTabMove(tabEl, currentIndex, destinationIndex);
          }
          const lastTab = tabEls[tabEls.length - 1];
          const lastTabPosition =
            this.tabPositions[this.tabPositions.length - 1];
          const lastTabWidth =
            this.tabContentWidths[this.tabContentWidths.length - 1];
          const translatePx =
            lastTabPosition +
            lastTabWidth +
            (tabEl === lastTab
              ? tabEl.getAttribute(
                "data-was-not-last-tab-when-started-dragging",
              )
                ? moveVector.x - this.tabContentWidths[currentIndex]
                : moveVector.x
              : 0) +
            16;
          (document.querySelector(
            "#create-tab",
          ) as HTMLElement)!.style.transform =
            `translate(min(${translatePx}px, calc(100vw - 46px)),0px)`;
        }
      });
    });
    this.logger.createLog(`Setup draggabilly successfully`);
  }

  animateTabMove(
    tabEl: HTMLElement,
    originIndex: number,
    destinationIndex: number,
  ) {
    if (destinationIndex < originIndex) {
      tabEl.parentNode!.insertBefore(tabEl, this.tabEls[destinationIndex]);
    } else {
      tabEl.parentNode!.insertBefore(tabEl, this.tabEls[destinationIndex + 1]);
    }
    this.layoutTabs();
  }

  async layoutTabs() {
    this.eventsAPI.emit("tabs:layout", null);
    document.getElementById("create-tab")!.setAttribute("style", "");
    if ((await this.settings.getItem("verticalTabs")) == "true") {
      const tabContentWidths = this.tabContentHeights;

      let cumulativeWidth = 0;
      tabContentWidths.forEach(() => {
        const tabWidth = 36;
        cumulativeWidth += tabWidth;
        return cumulativeWidth;
      });

      this.tabEls.forEach((tabEl) => {
        tabEl.style.width = null;
      });

      let styleHTML = "";
      let lastPos = 0;
      this.tabPositionsY.forEach((position, i) => {
        styleHTML += `
        .${document.querySelector(".tab")!.parentElement!.className
          } .tab:nth-child(${i + 1}) {
          transform: translate3d(0, ${position}px, 0)
        }
      `;
        lastPos = position;
      });
      this.styleEl.innerHTML = styleHTML;
      document.getElementById("create-tab")!.style.transform =
        `translate3d(0, ${lastPos + tabContentWidths[tabContentWidths.length - 1] + 20
        }px), 0`;
    } else {
      const tabContentWidths = this.tabContentWidths;

      let cumulativeWidth = 0;
      tabContentWidths.forEach((contentWidth) => {
        const tabWidth = Math.min(contentWidth + 2 * 9, 240);
        cumulativeWidth += tabWidth;
        return cumulativeWidth;
      });

      this.tabEls.forEach((tabEl, i) => {
        const contentWidth = tabContentWidths[i];
        const tabWidth = Math.min(contentWidth + 2 * 9, 240);
        tabEl.classList.remove("is-small");
        tabEl.classList.remove("is-smaller");
        tabEl.classList.remove("is-mini");

        tabEl.style.width = tabWidth + "px";
        if (contentWidth < 84) tabEl.classList.add("is-small");
        if (contentWidth < 60) tabEl.classList.add("is-smaller");
        if (contentWidth < 48) tabEl.classList.add("is-mini");
      });

      let styleHTML = "";
      let lastPos = 0;
      this.tabPositions.forEach((position, i) => {
        styleHTML += `
        .${document.querySelector(".tab")!.parentElement!.className
          } .tab:nth-child(${i + 1}) {
          transform: translate3d(${position}px, 0, 0)
        }
      `;
        lastPos = position;
      });
      this.styleEl.innerHTML = styleHTML;
      document.getElementById("create-tab")!.style.transform = `translate(${lastPos + this.tabContentWidths[this.tabContentWidths.length - 1] + 20
        }px)`;
    }
    this.updateTabAttributes();
    this.logger.createLog(`Rearranged tabs`);
  }
  pageClient(iframe: HTMLIFrameElement) {
    iframe.contentWindow!.window.open = (url?: string | URL): Window | null => {
      (async () => {
        const url2Parse = new URL(url!);
        if (url2Parse.host !== location.host) {
          const url2Encode = url2Parse.href;
          const encodedUrl = await window.parent.proxy.convertURL(
            window.parent.SWconfig,
            window.parent.ProxySettings,
            url2Encode,
          );
          window.parent.tabs.createTab(encodedUrl, false);
        } else if (
          url2Parse.pathname.startsWith("/data/") ||
          url2Parse.pathname.startsWith("/assets/")
        ) {
          window.parent.tabs.createTab(url2Parse.href, false);
        }
      })();

      return null;
    };

    iframe.contentWindow?.document.body.addEventListener("click", async () => {
      window.parent.eventsAPI.emit("ddx:page.clicked", null);
    });
  }
}

export { Tabs };
