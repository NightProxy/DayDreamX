import { Nightmare as UI } from "@libs/Nightmare/nightmare";
import { Protocols } from "@browser/protocols";
import { Utils } from "@js/utils";
import { Logger } from "@apis/logging";
import { SettingsAPI } from "@apis/settings";

interface Section {
  section: HTMLElement;
  searchResults: HTMLElement;
}

interface GameData {
  name: string;
  image: string;
  link: string;
}

interface SearchInterface {
  proto: Protocols;
  utils: Utils;
  ui: UI;
  data: Logger;
  settings: SettingsAPI;
  proxy: any;
  swConfig: any;
  proxySetting: string;
  currentSectionIndex: number;
  maxInitialResults: number;
  maxExpandedResults: number;
  appsData: GameData[];
  sections: Record<string, Section>;
  selectedSuggestionIndex: number;
  currentMaxResults: number;
}

class Search implements SearchInterface {
  proto: Protocols;
  utils: Utils;
  ui: UI;
  data: Logger;
  settings: SettingsAPI;
  proxy: any;
  swConfig: any;
  proxySetting: string;
  currentSectionIndex: number;
  maxInitialResults: number;
  maxExpandedResults: number;
  appsData: GameData[];
  sections: Record<string, Section>;
  selectedSuggestionIndex: number;
  currentMaxResults: number;
  searchbar: HTMLInputElement | null = null;

  constructor(
    proxy: any,
    swConfig: any,
    proxySetting: string,
    proto: Protocols,
  ) {
    this.proto = proto;
    this.utils = new Utils();
    this.ui = new UI();
    this.data = new Logger();
    this.settings = new SettingsAPI();
    this.proxy = proxy;
    this.swConfig = swConfig;
    this.proxySetting = proxySetting;
    this.currentSectionIndex = 0;
    this.maxInitialResults = 4;
    this.maxExpandedResults = 8;
    this.appsData = [];
    this.sections = {};
    this.selectedSuggestionIndex = -1;
    this.currentMaxResults = this.maxInitialResults;
  }

  async init(searchbar: HTMLInputElement) {
    this.searchbar = searchbar;
    let suggestionList: HTMLElement;
    const verticalTabsSetting =
      (await this.settings.getItem("verticalTabs")) ?? "false";
    if (verticalTabsSetting === "true") {
      suggestionList = this.ui.createElement("div", {
        class: "suggestion-list vertical",
        id: "suggestion-list",
      });
    } else {
      suggestionList = this.ui.createElement("div", {
        class: "suggestion-list",
        id: "suggestion-list",
      });
    }

    this.sections = {
      searchResults: this.createSection("Search Results"),
      otherPages: this.createSection("Other Pages"),
      settings: this.createSection("Settings"),
      games: this.createSection("Games"),
    };

    Object.values(this.sections).forEach((sectionObj: Section) =>
      suggestionList.appendChild(sectionObj.section),
    );

    searchbar.addEventListener("input", async (event: Event) => {
      suggestionList.style.display = "flex";
      const target = event.target as HTMLInputElement | null;
      if (!target) return;
      const query = target.value.trim();
      const inputEvent = event as InputEvent;
      if (query === "" && inputEvent.inputType === "deleteContentBackward") {
        this.clearSuggestions();
        suggestionList.style.display = "none";
        return;
      }

      document.addEventListener("ddx:page.clicked", () => {
        this.clearSuggestions();
        suggestionList.style.display = "none";
        return;
      });

      let cleanedQuery = query.replace(
        /^(daydream:\/\/|daydream:\/|daydream:)/,
        "",
      );
      const response = await fetch(`/results/${cleanedQuery}`).then((res) =>
        res.json(),
      );
      const suggestions: string[] = response.map((item: any) => item.phrase);

      this.clearSuggestions();
      await this.populateSections(suggestions, searchbar.value);
    });

    window.addEventListener("keydown", async (event: KeyboardEvent) => {
      if (
        event.key === "Escape" ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.metaKey
      )
        return;
      const suggestionItems = this.getCurrentSuggestionItems();
      const numSuggestions = suggestionItems.length;
      suggestionList.style.display = "flex";

      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (this.selectedSuggestionIndex + 1 >= numSuggestions) {
          this.moveToNextSection();
          this.selectedSuggestionIndex = 0;
        } else {
          this.selectedSuggestionIndex =
            (this.selectedSuggestionIndex + 1) % numSuggestions;
        }
        this.updateSelectedSuggestion();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (this.selectedSuggestionIndex === 0) {
          this.moveToPreviousSection();
        } else {
          this.selectedSuggestionIndex =
            (this.selectedSuggestionIndex - 1 + numSuggestions) %
            numSuggestions;
        }
        this.updateSelectedSuggestion();
      } else if (event.key === "Tab") {
        if (this.selectedSuggestionIndex !== -1) {
          event.preventDefault();
          const selectedSuggestion =
            suggestionItems[this.selectedSuggestionIndex].querySelector(
              ".suggestion-text",
            )?.textContent;
          if (selectedSuggestion) {
            searchbar.value = selectedSuggestion;
          }
        }
      } else if (event.key === "ArrowRight") {
        if (this.selectedSuggestionIndex !== -1) {
          event.preventDefault();
          const selectedSuggestion =
            suggestionItems[this.selectedSuggestionIndex].querySelector(
              ".suggestion-text",
            )?.textContent;
          if (selectedSuggestion) {
            searchbar.value = selectedSuggestion;
          }
        }
      } else if (event.key === "Backspace") {
        if (searchbar.value === "") {
          suggestionList.style.display = "none";
          this.clearSuggestions();
        }
      }

      const engineIconElem = suggestionList.querySelectorAll(
        ".searchEngineIcon",
      )[0] as HTMLImageElement | null;
      if (engineIconElem) {
        engineIconElem.style.display = "block";
      }
      const searchSetting =
        (await this.settings.getItem("search")) ??
        "https://duckduckgo.com/?q=%s";
      switch (searchSetting) {
        case "https://duckduckgo.com/?q=%s":
          if (engineIconElem) {
            engineIconElem.src = "/res/b/ddg.webp";
            engineIconElem.style.transform = "scale(1.35)";
          }
          break;
        case "https://bing.com/search?q=%s":
          if (engineIconElem) {
            engineIconElem.src = "/res/b/bing.webp";
            engineIconElem.style.transform = "scale(1.65)";
          }
          break;
        case "https://www.google.com/search?q=%s":
          if (engineIconElem) {
            engineIconElem.src = "/res/b/google.webp";
            engineIconElem.style.transform = "scale(1.2)";
          }
          break;
        case "https://search.yahoo.com/search?p=%s":
          if (engineIconElem) {
            engineIconElem.src = "/res/b/yahoo.webp";
            engineIconElem.style.transform = "scale(1.5)";
          }
          break;
        default:
          this.proxy
            .getFavicon(searchSetting, this.swConfig, this.proxySetting)
            .then((dataUrl: string | null) => {
              if (dataUrl == null || dataUrl.endsWith("null")) {
                if (engineIconElem) {
                  engineIconElem.src = "/res/b/ddg.webp";
                  engineIconElem.style.transform = "scale(1.35)";
                }
              } else {
                if (engineIconElem) {
                  engineIconElem.src = dataUrl;
                  engineIconElem.style.transform = "scale(1.2)";
                }
              }
            });
      }
    });

    document.body.appendChild(suggestionList);

    const activeIframe = document.querySelector(
      "iframe.active",
    ) as HTMLIFrameElement | null;
    if (activeIframe) {
      activeIframe.addEventListener("load", async () => {
        let check = await this.proto.getInternalURL(
          new URL(activeIframe.src).pathname,
        );
        if (typeof check === "string" && check.startsWith("daydream://")) {
          searchbar.value = check;
        } else {
          let url = new URL(activeIframe.src).pathname;
          url = url.replace(
            window.SWSettings ? window.SWSettings.config.prefix : "",
            "",
          );
          url = (window as any).window.__uv$config.decodeUrl(url);
          url = new URL(url).origin;
          searchbar.value = url;
        }
      });
    }
  }

  createSection(titleText: string): Section {
    const section = this.ui.createElement("div", { class: "search-section" }, [
      this.ui.createElement("div", { class: "search-title" }, [
        this.ui.createElement("img", {
          class: "searchEngineIcon",
          src: "/res/logo.png",
        }),
        this.ui.createElement("span", {}, [titleText]),
      ]),
      this.ui.createElement("div", { class: "search-results" }),
    ]);
    const searchResults = section.querySelector(
      ".search-results",
    ) as HTMLElement;
    return { section, searchResults };
  }

  getCurrentSuggestionItems(): NodeListOf<HTMLDivElement> {
    return Object.values(this.sections)[
      this.currentSectionIndex
    ].searchResults.querySelectorAll("div");
  }

  moveToPreviousSection(): void {
    const sectionsArray = Object.values(this.sections);
    this.currentSectionIndex =
      (this.currentSectionIndex - 1 + sectionsArray.length) %
      sectionsArray.length;
    while (
      sectionsArray[this.currentSectionIndex].searchResults.children.length ===
      0
    ) {
      this.currentSectionIndex =
        (this.currentSectionIndex - 1 + sectionsArray.length) %
        sectionsArray.length;
    }
    const previousSectionItems = this.getCurrentSuggestionItems();
    this.selectedSuggestionIndex = previousSectionItems.length - 1;
    this.updateSelectedSuggestion();
  }

  moveToNextSection(): void {
    this.currentSectionIndex =
      (this.currentSectionIndex + 1) % Object.values(this.sections).length;
    while (
      Object.values(this.sections)[this.currentSectionIndex].searchResults
        .children.length === 0
    ) {
      this.currentSectionIndex =
        (this.currentSectionIndex + 1) % Object.values(this.sections).length;
    }
    this.selectedSuggestionIndex = -1;
    this.updateSelectedSuggestion();
  }

  updateSelectedSuggestion(): void {
    const suggestionItems = this.getCurrentSuggestionItems();
    document
      .querySelectorAll(".search-results div.selected")
      .forEach((item) => {
        item.classList.remove("selected");
      });
    suggestionItems.forEach((item, index) => {
      if (index === this.selectedSuggestionIndex) {
        item.classList.add("selected");
      } else {
        item.classList.remove("selected");
      }
    });
  }

  async generatePredictedUrls(query: string): Promise<string[]> {
    try {
      const response = await fetch(`/results/${query}`);
      if (!response || !response.ok)
        throw new Error("Network response was not ok");
      const data = await response.json();
      return data.map((item: any) => item.phrase);
    } catch (error) {
      console.error("Error fetching predicted URLs:", error);
      return [];
    }
  }

  clearSuggestions(): void {
    Object.values(this.sections).forEach(({ searchResults }) => {
      searchResults.innerHTML = "";
      if (searchResults.parentElement) {
        searchResults.parentElement.style.display = "none";
      }
    });
  }

  async populateSections(suggestions: string[], e: string): Promise<void> {
    const searchResultsSuggestions = suggestions.slice(
      0,
      this.maxExpandedResults,
    );
    this.populateSearchResults(searchResultsSuggestions);
    await this.populateOtherPages(suggestions);
    await this.populateGames(e);
  }

  populateSearchResults(suggestions: string[]): void {
    const { searchResults, section } = this.sections.searchResults;
    if (suggestions.length > 0) {
      section.style.display = "block";
      suggestions.forEach((suggestion: string) => {
        const listItem = this.createSuggestionItem(suggestion);
        searchResults.appendChild(listItem);
      });
    }
  }

  async populateOtherPages(query: string[]): Promise<void> {
    const { searchResults, section } = this.sections.otherPages;
    let hasResults = false;
    console.log("Query:", query);
    for (let url of query) {
      url = url.replace(/ /g, "");
      url = "daydream://" + url;
      const internalUrl = await this.proto.processUrl(url);
      if (typeof internalUrl === "string") {
        const tofetchUrl = new URL(internalUrl);
        const response = await fetch(tofetchUrl, { method: "HEAD" }).catch(
          (error) => {
            this.data.createLog("Failed to Fetch: " + error);
          },
        );
        if (response && response.ok) {
          const listItem = this.createSuggestionItem(url);
          searchResults.appendChild(listItem);
          hasResults = true;
        }
      } else {
        this.data.createLog("processUrl returned nothing for: " + url);
      }
    }
    section.style.display = hasResults ? "block" : "none";
  }

  async populateSettings(searchbar: HTMLInputElement): Promise<void> {
    const { searchResults, section } = this.sections.settings;
    let hasResults = false;
    let query = searchbar.value;
    query = query.replace(/^(daydream:\/\/|daydream:\/|daydream:)/, "");
    const predictedUrls = this.generatePredictedSettingsUrls(query);
    for (let url of predictedUrls) {
      const response = await fetch(url, { method: "HEAD" });
      if (response.ok) {
        const listItem = this.createSuggestionItem(url);
        searchResults.appendChild(listItem);
        hasResults = true;
      } else if (!response.ok) {
        return;
      }
    }
    section.style.display = hasResults ? "block" : "none";
  }

  generatePredictedSettingsUrls(query: string): string[] {
    const basePaths = [
      "settings",
      "settings/about",
      "settings/profile",
      "settings/privacy",
      "settings/security",
      "settings/notifications",
    ];
    query = query.replace(/ /g, "");
    return basePaths.map((base) => `${base}${query ? `/${query}` : ""}`);
  }

  async populateGames(query: string): Promise<void> {
    const { searchResults, section } = this.sections.games;
    let hasResults = false;
    if (this.appsData.length === 0) {
      await this.fetchAppData();
    }
    const lowerQuery = query.toLowerCase();
    const filteredGames = this.appsData
      .filter((app) => app.name.toLowerCase().includes(lowerQuery))
      .slice(0, 10);
    if (filteredGames.length > 0) {
      section.style.display = "block";
      filteredGames.forEach((game: GameData) => {
        const listItem = this.createGameItem(game);
        searchResults.appendChild(listItem);
        hasResults = true;
      });
    }
    section.style.display = hasResults ? "block" : "none";
  }

  async fetchAppData(): Promise<void> {
    try {
      const response = await fetch("/json/g.json");
      this.appsData = await response.json();
    } catch (error) {
      console.error("Error fetching JSON data:", error);
    }
  }

  createSuggestionItem(suggestion: string): HTMLElement {
    const listItem = document.createElement("div");
    const listIcon = document.createElement("span");
    const listSuggestion = document.createElement("span");
    listIcon.classList.add("material-symbols-outlined");
    listIcon.textContent = "search";
    listItem.appendChild(listIcon);
    listSuggestion.classList.add("suggestion-text");
    listSuggestion.textContent = suggestion;
    listItem.appendChild(listSuggestion);
    listItem.addEventListener("click", async () => {
      this.clearSuggestions();
      const suggestionListElem = document.querySelector(
        "#suggestion-list.suggestion-list",
      ) as HTMLElement | null;
      if (suggestionListElem) {
        suggestionListElem.style.display = "none";
      }
      if (suggestion.startsWith("daydream")) {
        const link = await this.proto.processUrl(suggestion);
        if (link!.startsWith("/internal/")) {
          const url = link || "/internal/error/";
          const iframe = document.querySelector(
            "iframe.active",
          ) as HTMLIFrameElement | null;
          iframe!.setAttribute("src", url);
        }
      } else {
        this.proxy.redirect(this.swConfig, this.proxySetting, suggestion);
      }
    });
    return listItem;
  }

  createGameItem(game: GameData): HTMLElement {
    const listItem = document.createElement("div");
    const listIcon = document.createElement("img");
    listIcon.classList.add("game-icon");
    listIcon.src = game.image;
    listItem.appendChild(listIcon);
    listItem.innerHTML += game.name;
    listItem.addEventListener("click", () => {
      this.clearSuggestions();
      const suggestionListElem = document.querySelector(
        "#suggestion-list.suggestion-list",
      ) as HTMLElement | null;
      if (suggestionListElem) {
        suggestionListElem.style.display = "none";
      }
      this.proxy.redirect(this.swConfig, this.proxySetting, game.link);
    });
    return listItem;
  }
}

export { Search };
