import { SettingsAPI } from "@apis/settings";
import { EventSystem } from "@apis/events";

interface ThemeingInterface {
  settings: SettingsAPI;
  events: EventSystem;
  init: () => Promise<void>;
  applyThemeFromJsonFile: () => Promise<void>;
  setBackgroundImage: () => Promise<void>;
  applyColorTint: (
    color: string,
    tintColor: string,
    tintFactor?: number,
  ) => string;
  fadeColor: (color: string, factor: number) => string;
}

class Themeing implements ThemeingInterface {
  settings: SettingsAPI;
  events: EventSystem;
  constructor() {
    this.settings = new SettingsAPI();
    this.events = new EventSystem();
  }

  async init() {
    document.documentElement.style.setProperty(
      "--main-color",
      (await this.settings.getItem("themeColor")) || "#aa00ff",
    );
    if (
      (await this.settings.getItem("themeColor")) != null ||
      (await this.settings.getItem("themeColor")) != undefined
    ) {
      const fadedMainColor =
        this.fadeColor(await this.settings.getItem("themeColor"), 0.26) ||
        "rgba(170, 1, 255, 0.26)";
      document.documentElement.style.setProperty(
        "--faded-main-color",
        fadedMainColor || "rgba(170, 1, 255, 0.26)",
      );
    }

    this.events.addEventListener("theme:color-change", async (event: any) => {
      await this.settings.setItem("themeColor", event.detail.color);
      document.documentElement.style.setProperty(
        "--main-color",
        (await this.settings.getItem("themeColor")) || "#aa00ff",
      );
      const fadedMainColor =
        this.fadeColor(await this.settings.getItem("themeColor"), 0.26) ||
        "rgba(170, 1, 255, 0.26)";
      document.documentElement.style.setProperty(
        "--faded-main-color",
        fadedMainColor || "rgba(170, 1, 255, 0.26)",
      );
      this.applyThemeFromJsonFile();
    });

    this.applyThemeFromJsonFile();

    this.events.addEventListener("theme:template-change", async () => {
      this.applyThemeFromJsonFile();
    });

    this.setBackgroundImage();

    this.events.addEventListener("theme:background-change", async () => {
      this.setBackgroundImage();
    });
  }

  async applyThemeFromJsonFile() {
    try {
      const response1 = await fetch("/json/themes/presets.json");
      if (!response1.ok) throw new Error("Failed to load themes.json");

      const themes = await response1.json();

      const themeName = await this.settings.getItem("themeCustom");

      if (themeName && themes[themeName]) {
        const theme = themes[themeName];
        const root = document.documentElement;

        Object.keys(theme).forEach((property) => {
          let color = theme[property];
          root.style.setProperty(`--${property}`, color);
        });
      }
    } catch (error) {
      console.error("Error loading or applying theme:", error);
    }
  }

  async setBackgroundImage() {
    const bg = await this.settings.getItem("theme:background-image");
    if (bg !== null) {
      const img = bg || "/res/DDX.bg.jpeg";
      document.body.querySelector(".bg-img img")!.setAttribute("src", img);
    } else {
      document.documentElement.style.setProperty(
        "--background-image",
        "url(/res/DDX.bg.jpeg)",
      );
    }
    console.log("Background image set");
  }

  applyColorTint(color: string, tintColor: string, tintFactor: number = 0.5) {
    const colorMatch = color.match(
      /rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d\.]+)?\)/,
    );
    const tintMatch = tintColor.match(
      /rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d\.]+)?\)/,
    );

    if (!colorMatch || !tintMatch) return color;

    let [r, g, b, a] = colorMatch.slice(1).map(Number);
    let [tr, tg, tb] = tintMatch.slice(1, 4).map(Number);

    a = isNaN(a) ? 1 : a;

    r = Math.round(r * (1 - tintFactor) + tr * tintFactor);
    g = Math.round(g * (1 - tintFactor) + tg * tintFactor);
    b = Math.round(b * (1 - tintFactor) + tb * tintFactor);

    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  fadeColor(color: string, factor: number) {
    if (typeof color !== "string") {
      console.error("Invalid color input:", color);
      return color;
    }

    const colorMatch = color.match(
      /rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d\.]+)?\)/,
    );

    if (!colorMatch) {
      console.error("Color does not match rgba or rgb format:", color);
      return color;
    }

    let [r, g, b, a] = colorMatch.slice(1).map(Number);
    a = isNaN(a) ? 1 : a;
    a = Math.min(1, Math.max(0, a * factor));

    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
}

export { Themeing };
