import { Nightmare } from "@libs/Nightmare/nightmare";
import { Logger } from "@apis/logging";
import { SettingsAPI } from "@apis/settings";
import { EventSystem } from "@apis/events";
import { createIcons, icons } from "lucide";

interface renderInterface {
  container: HTMLDivElement;
  nightmare: Nightmare;
  logger: Logger;
  settings: SettingsAPI;
  events: EventSystem;
}

class Render implements renderInterface {
  container: HTMLDivElement;
  nightmare: Nightmare;
  logger: Logger;
  settings: SettingsAPI;
  events: EventSystem;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.nightmare = new Nightmare();
    this.logger = new Logger();
    this.settings = new SettingsAPI();
    this.events = new EventSystem();
    this.init();
  }

  async init() {
    const HTMLcode = this.nightmare.createElement("div", { class: "surface" }, [
      this.nightmare.createElement("div", { class: "top-bar" }, [
        this.nightmare.createElement(
          "button",
          { id: "profilesButton", class: "profiles-box" },
          [
            this.nightmare.createElement(
              "img",
              { class: "profile-picture", src: "/res/default-profile.png" },
              [],
            ),
          ],
        ),
        this.nightmare.createElement(
          "div",
          { class: "tabs", style: "--tab-content-margin: 9px" },
          [
            this.nightmare.createElement("div", { class: "bottom-buttons" }, [
              this.nightmare.createElement(
                "div",
                { class: "bottom-button", id: "settings" },
                [
                  this.nightmare.createElement(
                    "span",
                    { class: "material-symbols-outlined" },
                    ["construction"],
                  ),
                ],
              ),
              this.nightmare.createElement(
                "div",
                { class: "bottom-button", id: "closeAllTabs" },
                [
                  this.nightmare.createElement(
                    "span",
                    { class: "material-symbols-outlined" },
                    ["tab_close"],
                  ),
                ],
              ),
            ]),
            this.nightmare.createElement("div", {
              class: "tabs-content",
              id: "tab-groups",
            }),
            this.nightmare.createElement(
              "div",
              { class: "browser-button", id: "create-tab" },
              [
                this.nightmare.createElement(
                  "i",
                  { "data-lucide": "plus" },
                  [],
                ),
                this.nightmare.createElement("span", { class: "title" }, [
                  "New Tab",
                ]),
              ],
            ),
          ],
        ),
      ]),
      this.nightmare.createElement("div", { class: "under-tabs" }, [
        this.nightmare.createElement("div", { class: "tabs-bottom-bar" }),
        this.nightmare.createElement("ul", { class: "utility" }, [
          this.nightmare.createElement("li", {}, [
            this.nightmare.createElement(
              "div",
              { class: "utilityIcon", id: "toggleTabs" },
              [
                this.nightmare.createElement(
                  "span",
                  { class: "material-symbols-outlined" },
                  ["thumbnail_bar"],
                ),
              ],
            ),
          ]),
          this.nightmare.createElement("li", {}, [
            this.nightmare.createElement(
              "div",
              { class: "utilityIcon", id: "backward" },
              [
                this.nightmare.createElement(
                  "i",
                  { class: "backButton", "data-lucide": "arrow-left" },
                  [],
                ),
              ],
            ),
          ]),
          this.nightmare.createElement("li", {}, [
            this.nightmare.createElement(
              "div",
              { class: "utilityIcon", id: "reload" },
              [
                this.nightmare.createElement(
                  "i",
                  { class: "refreshButton", "data-lucide": "rotate-cw" },
                  [],
                ),
              ],
            ),
          ]),
          this.nightmare.createElement("li", {}, [
            this.nightmare.createElement(
              "div",
              { class: "utilityIcon", id: "forward" },
              [
                this.nightmare.createElement(
                  "i",
                  { class: "forwardButton", "data-lucide": "arrow-right" },
                  [],
                ),
              ],
            ),
          ]),
          this.nightmare.createElement("li", {}, [
            this.nightmare.createElement(
              "div",
              { class: "utilityIcon", id: "home" },
              [
                this.nightmare.createElement(
                  "i",
                  { "data-lucide": "house" },
                  [],
                ),
              ],
            ),
          ]),
          this.nightmare.createElement(
            "div",
            {
              class: "search-header",
              style: "flex-grow: 1; margin-left: 8px; margin-right: 8px",
            },
            [
              this.nightmare.createElement("input", {
                placeholder: "Enter search or web address",
                class: "search-header__input",
                id: "uv-address",
                type: "text",
                autocomplete: "off",
              }),
              this.nightmare.createElement("div", { class: "webSecurityIcon" }),
              this.nightmare.createElement(
                "div",
                { class: "utilityIcon", id: "bookmark" },
                [
                  this.nightmare.createElement(
                    "i",
                    { "data-lucide": "star", class: "bookmarkButton" },
                    [],
                  ),
                ],
              ),
            ],
          ),
          this.nightmare.createElement("li", {}, [
            this.nightmare.createElement(
              "div",
              {
                class: "utilityIcon",
                id: "extensions",
              },
              [
                this.nightmare.createElement(
                  "i",
                  { "data-lucide": "blocks" },
                  [],
                ),
              ],
            ),
          ]),
          /*this.nightmare.createElement("li", {}, [
            this.nightmare.createElement(
              "div",
              { class: "utilityIcon coming-soon", id: "profiles" },
              [
                this.nightmare.createElement(
                  "i",
                  { "data-lucide": "users" },
                  [],
                ),
              ],
            ),
          ]),*/
          this.nightmare.createElement("li", {}, [
            this.nightmare.createElement(
              "div",
              { class: "utilityIcon", id: "more-options" },
              [
                this.nightmare.createElement(
                  "span",
                  { class: "erudaButton", "data-lucide": "ellipsis" },
                  [],
                ),
              ],
            ),
          ]),
        ]),
      ]),
      this.nightmare.createElement("div", { class: "viewport" }, [
        this.nightmare.createElement("div", {
          class: "iframe-container",
          id: "iframe-container",
        }),
      ]),
    ]);

    const navbar = this.nightmare.createElement("ul", { class: "navbar" }, [
      this.nightmare.createElement("div", {
        class: "logo",
      }),
      this.nightmare.createElement("br"),
      this.nightmare.createElement("div", { class: "section" }, [
        this.nightmare.createElement("li", {}, [
          this.nightmare.createElement(
            "div",
            { id: "gamesShortcut", title: "Games" },
            [
              this.nightmare.createElement(
                "i",
                { "data-lucide": "gamepad-2" },
                [],
              ),
            ],
          ),
        ]),
        this.nightmare.createElement("hr", {}, []),
        this.nightmare.createElement("li", {}, [
          this.nightmare.createElement("div", { id: "chatShortcut" }, [
            this.nightmare.createElement(
              "i",
              { "data-lucide": "message-circle" },
              [],
            ),
          ]),
        ]),
        this.nightmare.createElement("hr", {}, []),
        this.nightmare.createElement("li", {}, [
          this.nightmare.createElement(
            "div",
            { id: "historyShortcut", title: "History" },
            [
              this.nightmare.createElement(
                "i",
                { "data-lucide": "history" },
                [],
              ),
            ],
          ),
        ]),
        /*this.nightmare.createElement("li", {}, [
          this.nightmare.createElement(
            "div",
            { id: "gitShortcut", title: "Github" },
            [
              this.nightmare.createElement(
                "i",
                { "data-lucide": "github" },
                [],
              ),
            ],
          ),
        ]),*/
        this.nightmare.createElement("li", {}, [
          this.nightmare.createElement(
            "div",
            { id: "settShortcut", title: "Settings" },
            [
              this.nightmare.createElement(
                "i",
                { style: "margin-top: 0", "data-lucide": "settings" },
                [],
              ),
            ],
          ),
        ]),
      ]),
    ]);
    this.container.appendChild(HTMLcode);
    this.container.appendChild(navbar);
    createIcons({ icons });
    const sidebar = document.querySelector(".navbar");
    const browser = document.querySelector(".surface");
    const tabs = document.querySelector(".tabs");
    const bar = document.querySelector(".under-tabs");
    const IFcontainer = document.querySelector(".viewport");

    const isDisabled = await this.settings.getItem("verticalTabs");
    if (isDisabled == "true") {
      sidebar!.classList.add("autohide");
      browser!.classList.add("autohide");
      tabs!.classList.add("vertical");
      bar!.classList.add("vertical");
      IFcontainer!.classList.add("vertical");
      if ((await this.settings.getItem("verticalTabs-notshowing")) == "true") {
        tabs!.classList.add("hidden");
        IFcontainer!.classList.add("hidden");
      }
    } else {
      sidebar!.classList.remove("autohide");
      browser!.classList.remove("autohide");
      tabs!.classList.remove("vertical");
      bar!.classList.remove("vertical");
      IFcontainer!.classList.remove("vertical");
    }

    const style = await this.settings.getItem("UIStyle");
    if (style != null) {
      sidebar!.classList.remove("operagx");
      sidebar!.classList.remove("opera");
      sidebar!.classList.remove("arc");
      browser!.classList.remove("operagx");
      browser!.classList.remove("opera");
      browser!.classList.remove("arc");
      tabs!.classList.remove("operagx");
      tabs!.classList.remove("opera");
      tabs!.classList.remove("arc");
      bar!.classList.remove("operagx");
      bar!.classList.remove("opera");
      bar!.classList.remove("arc");
      IFcontainer!.classList.remove("operagx");
      IFcontainer!.classList.remove("opera");
      IFcontainer!.classList.remove("arc");
      sidebar!.classList.add(style);
      browser!.classList.add(style);
      tabs!.classList.add(style);
      bar!.classList.add(style);
      IFcontainer!.classList.add(style);
    }

    this.logger.createLog("Rendered Browser");
    this.events.addEventListener("UI:changeLayout", async () => {
      const sidebar = document.querySelector(".navbar");
      const browser = document.querySelector(".surface");
      const tabs = document.querySelector(".tabs");
      const bar = document.querySelector(".under-tabs");
      const IFcontainer = document.querySelector(".viewport");

      const isDisabled = await this.settings.getItem("verticalTabs");
      if (isDisabled === "true") {
        sidebar!.classList.add("autohide");
        browser!.classList.add("autohide");
        tabs!.classList.add("vertical");
        bar!.classList.add("vertical");
        IFcontainer!.classList.add("vertical");
        if (
          (await this.settings.getItem("verticalTabs-notshowing")) == "true"
        ) {
          tabs!.classList.add("hidden");
          IFcontainer!.classList.add("hidden");
        }
      } else {
        sidebar!.classList.remove("autohide");
        browser!.classList.remove("autohide");
        tabs!.classList.remove("vertical");
        bar!.classList.remove("vertical");
        IFcontainer!.classList.remove("vertical");
      }
      this.events.emit("tabs:changeLayout", null);
      this.logger.createLog("Changed Tab Layout");
    });
    this.events.addEventListener("UI:changeStyle", async () => {
      const sidebar = document.querySelector(".navbar");
      const browser = document.querySelector(".surface");
      const tabs = document.querySelector(".tabs");
      const bar = document.querySelector(".under-tabs");
      const IFcontainer = document.querySelector(".viewport");

      const style = await this.settings.getItem("UIStyle");
      if (style != null) {
        sidebar!.classList.remove("operagx");
        sidebar!.classList.remove("opera");
        sidebar!.classList.remove("arc");
        browser!.classList.remove("operagx");
        browser!.classList.remove("opera");
        browser!.classList.remove("arc");
        tabs!.classList.remove("operagx");
        tabs!.classList.remove("opera");
        tabs!.classList.remove("arc");
        bar!.classList.remove("operagx");
        bar!.classList.remove("opera");
        bar!.classList.remove("arc");
        IFcontainer!.classList.remove("operagx");
        IFcontainer!.classList.remove("opera");
        IFcontainer!.classList.remove("arc");
        sidebar!.classList.add(style);
        browser!.classList.add(style);
        tabs!.classList.add(style);
        bar!.classList.add(style);
        IFcontainer!.classList.add(style);
      }

      this.logger.createLog("Swapped Style");
    });
  }
}

export { Render };
