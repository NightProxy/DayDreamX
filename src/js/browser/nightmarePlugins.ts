import { Nightmare } from "@libs/Nightmare/nightmare";
import { createIcons, icons } from "lucide";

interface NPInterface {
  ui: Nightmare;
  sidemenu: SideMenu;
  sidepanel: SidePanel;
  rightclickmenu: RightClickMenu;
}

class NightmarePlugins implements NPInterface {
  ui: Nightmare;
  sidemenu: SideMenu;
  sidepanel: SidePanel;
  rightclickmenu: RightClickMenu;
  constructor() {
    this.ui = new Nightmare();
    this.sidemenu = new SideMenu(this.ui);
    this.sidepanel = new SidePanel(this.ui);
    this.rightclickmenu = new RightClickMenu(this.ui);
  }
}

interface SideMenuInterface {
  ui: Nightmare;
  container: HTMLElement | null;
  isOpen: boolean;
  attachTo: (
    element: HTMLButtonElement,
    content: Function | HTMLElement,
  ) => void;
  openMenu: (
    element: HTMLButtonElement,
    content: Function | HTMLElement,
  ) => void;
  closeMenu: () => void;
}

class SideMenu implements SideMenuInterface {
  ui: Nightmare;
  container: HTMLElement | null;
  isOpen: boolean;
  constructor(ui: Nightmare) {
    this.ui = ui;
    this.container = null;
    this.isOpen = false;
  }

  attachTo(
    element: HTMLButtonElement,
    content: Function | HTMLElement,
    offset: number = 0,
  ) {
    if (!element)
      throw new Error("Please provide a valid element to attach the menu.");

    element.addEventListener("click", (event) => {
      event.stopPropagation();
      this.isOpen ? this.closeMenu() : this.openMenu(element, content, offset);
      createIcons({ icons });
    });

    document.addEventListener("ddx:page.clicked", () => this.closeMenu());

    window.addEventListener("click", () => this.closeMenu());
  }

  openMenu(
    element: HTMLButtonElement,
    content: Function | HTMLElement,
    offset: number = 0,
  ) {
    if (this.isOpen || !element) return;

    this.container = this.ui.createElement("div", { class: "menu-container" });

    if (typeof content === "function") {
      this.container!.appendChild(content(this.ui));
    } else if (Array.isArray(content)) {
      content.forEach((item) => this.container!.appendChild(item));
    } else if (content instanceof HTMLElement) {
      this.container!.appendChild(content);
    }

    const rect = element.getBoundingClientRect();
    this.container!.style.top = `${rect.bottom + window.scrollY}px`;
    this.container!.style.left = `${rect.left + rect.width + window.scrollX - offset}px`;

    this.container!.style.opacity = "0";
    this.container!.style.filter = "blur(5px)";

    document.body.appendChild(this.container!);
    this.isOpen = true;

    setTimeout(() => {
      this.container!.style.opacity = "1";
      this.container!.style.filter = "blur(0px)";
    }, 10);
  }

  closeMenu() {
    if (this.container) {
      this.container.style.opacity = "0";
      this.container.style.filter = "blur(5px)";
      setTimeout(() => {
        if (this.container) {
          this.container.remove();
          this.container = null;
        }
      }, 200);
    }
    this.isOpen = false;
  }
}

interface SidePanelInterface {
  ui: Nightmare;
  container: HTMLElement | null;
  isOpen: boolean;
  attachTo: (
    element: HTMLButtonElement,
    content: Function | HTMLElement,
  ) => void;
  openMenu: (
    element: HTMLButtonElement,
    content: Function | HTMLElement,
  ) => void;
  closeMenu: () => void;
}

class SidePanel implements SidePanelInterface {
  ui: Nightmare;
  container: HTMLElement | null;
  isOpen: boolean;
  constructor(ui: Nightmare) {
    this.ui = ui;
    this.container = null;
    this.isOpen = false;
  }

  attachTo(element: HTMLButtonElement, content: Function | HTMLElement) {
    if (!element)
      throw new Error("Please provide a valid element to attach the menu.");

    element.addEventListener("click", (event) => {
      event.stopPropagation();
      this.isOpen ? this.closeMenu() : this.openMenu(element, content);
      createIcons({ icons });
    });

    document.addEventListener("ddx:page.clicked", () => this.closeMenu());

    window.addEventListener("click", () => this.closeMenu());
  }

  openMenu(element: HTMLButtonElement, content: Function | HTMLElement) {
    if (this.isOpen || !element) return;

    this.container = this.ui.createElement("div", { class: "sidepanel" });

    if (typeof content === "function") {
      this.container!.appendChild(content(this.ui));
    } else if (Array.isArray(content)) {
      content.forEach((item) => this.container!.appendChild(item));
    } else if (content instanceof HTMLElement) {
      this.container!.appendChild(content);
    }

    document.body.appendChild(this.container!);
    this.isOpen = true;
  }

  closeMenu() {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    this.isOpen = false;
  }
}

interface RightClickMenuInterface {
  ui: Nightmare;
  container: HTMLElement | null;
  isOpen: boolean;
  attachTo: (element: HTMLElement, content: Function | HTMLElement) => void;
  openMenu: (
    element: HTMLElement,
    event: MouseEvent,
    content: Function | HTMLElement,
  ) => void;
  closeMenu: () => void;
}

class RightClickMenu implements RightClickMenuInterface {
  ui: Nightmare;
  container: HTMLElement | null;
  isOpen: boolean;
  constructor(ui: Nightmare) {
    this.ui = ui;
    this.container = null;
    this.isOpen = false;
  }

  attachTo(element: HTMLElement, content: Function | HTMLElement) {
    if (!element)
      throw new Error("Please provide a valid element to attach the menu.");

    element.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.isOpen ? this.closeMenu() : this.openMenu(element, event, content);
    });

    document.addEventListener("ddx:page.clicked", () => this.closeMenu());

    window.addEventListener("click", () => this.closeMenu());
  }

  openMenu(
    element: HTMLElement,
    event: MouseEvent,
    content: Function | HTMLElement,
  ) {
    if (this.isOpen || !element) return;

    this.container = this.ui.createElement("div", {
      class: "click-menu-container",
    });

    if (typeof content === "function") {
      this.container!.appendChild(content(this.ui));
    } else if (Array.isArray(content)) {
      content.forEach((item) => {
        this.container!.appendChild(item);
      });
    } else if (content instanceof HTMLElement) {
      this.container!.appendChild(content);
    }

    this.container!.style.top = `${event.pageY}px`;
    this.container!.style.left = `${event.pageX}px`;

    document.body.appendChild(this.container!);
    this.isOpen = true;
  }

  closeMenu() {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    this.isOpen = false;
  }
}

export { NightmarePlugins };
