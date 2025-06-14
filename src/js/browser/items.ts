interface ItemsInterface {
  toggleTabsButton: HTMLButtonElement | null;
  homeButton: HTMLButtonElement | null;
  backButton: HTMLButtonElement | null;
  reloadButton: HTMLButtonElement | null;
  forwardButton: HTMLButtonElement | null;
  addressBar: HTMLInputElement | null;
  bookmarkButton: HTMLButtonElement | null;
  extensionsButton: HTMLButtonElement | null;
  profilesButton: HTMLButtonElement | null;
  extrasButton: HTMLButtonElement | null;
  tabGroupsContainer: HTMLDivElement | null;
  newTab: HTMLButtonElement | null;
  iframeContainer: HTMLDivElement | null;
  activeTabIframe: HTMLIFrameElement | null;
  historyButton: HTMLButtonElement | null;
}

class Items implements ItemsInterface {
  toggleTabsButton: HTMLButtonElement | null;
  homeButton: HTMLButtonElement | null;
  backButton: HTMLButtonElement | null;
  reloadButton: HTMLButtonElement | null;
  forwardButton: HTMLButtonElement | null;
  addressBar: HTMLInputElement | null;
  bookmarkButton: HTMLButtonElement | null;
  extensionsButton: HTMLButtonElement | null;
  profilesButton: HTMLButtonElement | null;
  extrasButton: HTMLButtonElement | null;
  tabGroupsContainer: HTMLDivElement | null;
  newTab: HTMLButtonElement | null;
  iframeContainer: HTMLDivElement | null;
  activeTabIframe: HTMLIFrameElement | null;
  historyButton: HTMLButtonElement | null;

  constructor() {
    this.toggleTabsButton = document.getElementById(
      "toggleTabs",
    ) as HTMLButtonElement;
    this.homeButton = document.getElementById("home") as HTMLButtonElement;
    this.backButton = document.getElementById("backward") as HTMLButtonElement;
    this.reloadButton = document.getElementById("reload") as HTMLButtonElement;
    this.forwardButton = document.getElementById(
      "forward",
    ) as HTMLButtonElement;
    this.addressBar = document.getElementById("uv-address") as HTMLInputElement;
    this.bookmarkButton = document.getElementById(
      "bookmark",
    ) as HTMLButtonElement;
    this.extensionsButton = document.getElementById(
      "extensions",
    ) as HTMLButtonElement;
    this.profilesButton = document.getElementById(
      "profilesButton",
    ) as HTMLButtonElement;
    this.extrasButton = document.getElementById(
      "more-options",
    ) as HTMLButtonElement;
    this.tabGroupsContainer = document.getElementById(
      "tab-groups",
    ) as HTMLDivElement;
    this.newTab = document.getElementById("create-tab") as HTMLButtonElement;
    this.iframeContainer = document.querySelector(
      ".iframe-container",
    ) as HTMLDivElement;
    this.activeTabIframe = this.iframeContainer?.querySelector(
      "iframe.active",
    ) as HTMLIFrameElement;
    this.historyButton = document.getElementById(
      "history",
    ) as HTMLButtonElement;
  }
}

export { Items };
