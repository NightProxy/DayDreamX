class Nightmare {
  constructor() {
    this.contextMenu = null;
    this.menu = null;
    this.initializeComponents();
  }

  initializeComponents() {
    this.contextMenu = new ContextMenu(this);
    this.menu = new Menu(this);
  }

  createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
      if (key.startsWith("on")) {
        element[key.toLowerCase()] = value;
      } else if (key === "style") {
        element.style.cssText = value;
      } else {
        element.setAttribute(key, value);
      }
    });
    children.forEach((child) => {
      if (typeof child === "string") {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    });
    return element;
  }
}

class Menu {
  constructor(ui) {
    this.ui = ui;
    this.container = null;
    this.dropdown = null;
    this.currentPage = null;
  }

  createMenu(tag, dropdownName, dropdownId, { items, pages }) {
    this.container = this.ui.createElement("div", { class: "menu-container" });

    this.menuTopBar = this.ui.createElement("div", { class: "menu-top-bar" });

    const closeButton = this.ui.createElement(
      "button",
      { class: "close-button" },
      [
        this.ui.createElement("span", { class: "material-symbols-outlined" }, [
          "close",
        ]),
      ],
    );
    closeButton.onclick = () => this.closeMenu();

    this.dropdown = this.ui.createElement("div", {
      class: "dropdown",
      id: dropdownId,
    });
    this.dropdownButton = this.ui.createElement(
      "div",
      { class: "dropdown-button" },
      [
        this.ui.createElement("span", { class: "button-text" }, [dropdownName]),
        this.ui.createElement("span", { class: "material-symbols-outlined" }, [
          "keyboard_arrow_down",
        ]),
      ],
    );
    this.dropdownButton.addEventListener("click", () => {
      const isVisible = this.dropdownOptions.style.display === "block";
      this.dropdownOptions.style.display = isVisible ? "none" : "block";
      this.dropdownButton.classList.toggle("active", !isVisible);
    });

    this.dropdownOptions = this.ui.createElement("ul", {
      class: "dropdown-options",
    });
    items.forEach((item) => {
      const option = this.ui.createElement("li", { "data-id": item.pageId }, [
        item.label,
      ]);
      option.onclick = () => {
        this.showPage(item.pageId);
        const isVisible = this.dropdownOptions.style.display === "block";
        this.dropdownOptions.style.display = isVisible ? "none" : "block";
        this.dropdownButton.classList.toggle("active", !isVisible);
      };
      this.dropdownOptions.appendChild(option);
    });

    this.dropdown.appendChild(this.dropdownButton);
    this.dropdown.appendChild(this.dropdownOptions);

    this.menuTopBar.appendChild(this.dropdown);
    this.menuTopBar.appendChild(closeButton);

    this.container.appendChild(this.menuTopBar);

    const contentArea = this.ui.createElement("div", { class: "content-area" });
    this.container.appendChild(contentArea);

    this.pages = {};
    pages.forEach((page) => {
      const pageDiv = this.ui.createElement("div", {
        class: "menu-page",
        id: page.id,
        "data-id": page.id,
      });
      pageDiv.innerHTML = page.content;
      this.pages[page.id] = pageDiv;
      contentArea.appendChild(pageDiv);
    });

    Object.values(this.pages).forEach((page) => (page.style.display = "none"));

    if (pages.length > 0) {
      this.showPage(pages[0].id);
    }

    tag.appendChild(this.container);

    setTimeout(() => {
      this.container.classList.add("visible");
    }, 0);

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".dropdown")) {
        document.querySelectorAll(".dropdown-button.active").forEach((btn) => {
          btn.classList.remove("active");
          const dropdownOptions = btn.nextElementSibling;
          if (dropdownOptions) {
            dropdownOptions.style.display = "none";
          }
        });
      }
    });
  }

  showPage(pageId) {
    Object.values(this.pages).forEach((page) => (page.style.display = "none"));
    const page = this.pages[pageId];
    if (page) {
      page.style.display = "block";
      this.currentPage = pageId;
    }
  }

  closeMenu() {
    this.container.classList.remove("visible");
    setTimeout(() => {
      document.body.removeChild(this.container);
    }, 300);
  }
}

class ContextMenu {
  constructor(ui) {
    this, (ui = ui);
    this.currentMenu = null;
    this.hideMenu = this.hideMenu.bind(this);
  }

  create(items, position, id, style, itemStyle) {
    if (this.currentMenu) {
      this.currentMenu.remove();
    }

    this.currentMenu = this.ui.createElement(
      "div",
      {
        id: id,
        style: `position: absolute; top: ${position.y}px; left: ${position.x}px; ${style}`,
      },
      items.map((item) =>
        this.ui.createElement(
          "div",
          {
            style: `cursor: pointer; ${itemStyle}`,
          },
          [
            this.ui.createElement(
              "button",
              {
                onclick: item.action,
              },
              [item.text],
            ),
          ],
        ),
      ),
    );

    document.body.appendChild(this.currentMenu);

    document.addEventListener("click", this.hideMenu, { once: true });
  }

  hideMenu(event) {
    if (this.currentMenu && !this.currentMenu.contains(event.target)) {
      this.currentMenu.remove();
      this.currentMenu = null;
    }
  }
}

export { Nightmare };
