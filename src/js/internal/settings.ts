import { SettingsAPI } from "@apis/settings";
import { EventSystem } from "@apis/events";
import { DDXGlobal } from "@js/global";
import iro from "@jaames/iro";

const settingsAPI = new SettingsAPI();
const eventsAPI = new EventSystem();
// @ts-expect-error
const globalFunctions = new DDXGlobal();

const initializeDropdown = async (
  buttonId: string,
  optionsId: string,
  settingsKey: string,
  defaultValue: string,
  functions: Function | null = null
) => {
  const dropdownButton = document.getElementById(buttonId);
  const dropdownOptions = document.getElementById(optionsId);
  const buttonText = dropdownButton?.querySelector(".button-text");

  if (!dropdownButton) {
    console.error(`Dropdown button with id "${buttonId}" not found.`);
    return;
  }
  if (!dropdownOptions) {
    console.error(`Dropdown options with id "${optionsId}" not found.`);
    return;
  }
  if (!buttonText) {
    console.error(
      `Button text element not found within dropdown button with id "${buttonId}".`
    );
    return;
  }

  const savedValue = (await settingsAPI.getItem(settingsKey)) || defaultValue;
  const selectedOption = dropdownOptions.querySelector(
    `[data-value="${savedValue}"]`
  );
  if (selectedOption) {
    buttonText.textContent = selectedOption.textContent;
  } else {
    console.warn(
      `No option found for value "${savedValue}" in dropdown with id "${optionsId}".`
    );
  }

  dropdownButton.addEventListener("click", () => {
    const DO = document.querySelectorAll(".dropdown-options");
    DO.forEach((dropdown) => {
      if (dropdown !== dropdownOptions) {
        dropdown.setAttribute("style", "opacity:0;filter:blur(5px);");
        setTimeout(() => {
          dropdown.setAttribute(
            "style",
            "display:none;opacity:0;filter:blur(5px);"
          );
        }, 200);
      }
    });

    document.querySelectorAll(".dropdown-button.active").forEach((btn) => {
      if (btn !== dropdownButton) {
        btn.classList.remove("active");
      }
    });

    const isVisible = dropdownOptions.style.display === "block";
    if (!isVisible) {
      dropdownOptions.style.display = "block";
      setTimeout(() => {
        dropdownOptions.style.opacity = "1";
        dropdownOptions.style.filter = "blur(0px)";
      }, 10);
    } else {
      dropdownOptions.style.opacity = "0";
      dropdownOptions.style.filter = "blur(5px)";
      setTimeout(() => {
        dropdownOptions.style.display = "none";
      }, 200);
    }
    dropdownButton.classList.toggle("active", !isVisible);
  });

  dropdownOptions.addEventListener("click", (event: any) => {
    if (event.target.tagName === "A") {
      let selectedValue = event.target.getAttribute("data-value");
      const selectedOption = event.target.textContent;
      buttonText.textContent = selectedOption;
      settingsAPI.setItem(settingsKey, selectedValue);
      dropdownOptions.style.opacity = "0";
      dropdownOptions.style.filter = "blur(5px)";
      setTimeout(() => {
        dropdownOptions.style.display = "none";
      }, 200);
      dropdownButton.classList.remove("active");

      functions?.();
      location.reload();
    }
  });
};

document.addEventListener("click", (event: any) => {
  if (!event.target.closest(".dropdown")) {
    document.querySelectorAll(".dropdown-button.active").forEach((btn) => {
      btn.classList.remove("active");
      const dropdownOptions = btn.nextElementSibling;
      if (dropdownOptions) {
        dropdownOptions.setAttribute("style", "opacity:0;filter:blur(5px);");
        setTimeout(() => {
          dropdownOptions.setAttribute(
            "style",
            "display:none;opacity:0;filter:blur(5px);"
          );
        }, 200);
      }
    });
  }
});
const initSwitch = async (
  item: HTMLInputElement,
  setting: string,
  functionToCall: Function | null
) => {
  const switchElement = item;
  if (!switchElement) {
    console.error(`Switch element at ${item} not found.`);
    return;
  }
  switchElement.checked = (await settingsAPI.getItem(setting)) === "true";
  switchElement.addEventListener("change", async () => {
    await settingsAPI.setItem(setting, switchElement.checked.toString());
    if (functionToCall) {
      await functionToCall();
    }
  });
};

const uploadBGInput = document.getElementById("bgInput");
const uploadBGButton = document.getElementById("bgUpload");

uploadBGButton!.addEventListener("click", function () {
  uploadBGInput!.click();
});

uploadBGInput!.addEventListener("change", function (event: any) {
  var file = event.target.files[0];
  var reader = new FileReader();
  reader.onload = async function (e) {
    var backgroundImage = e.target!.result;
    await settingsAPI.setItem(
      "theme:background-image",
      backgroundImage as string
    );
    eventsAPI.emit("theme:background-change", null);
  };
  reader.readAsDataURL(file);
});

document.addEventListener("DOMContentLoaded", async () => {
  document.querySelector(".sideSnav")!.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      const element = document.querySelector(link.getAttribute("section")!);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });
      }
    });
    link.querySelector("*")!.addEventListener("click", () => {
      const element = document.querySelector(link.getAttribute("section")!);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });
      }
    });
  });
  //Cloaking
  initializeDropdown("tabCloakButton", "tabCloakOptions", "tabCloak", "off");
  initializeDropdown("URL-cloakButton", "URL-cloakOptions", "URL_Cloak", "off");
  initSwitch(
    document.getElementById("autoCloakSwitch") as HTMLInputElement,
    "autoCloak",
    function () {
      eventsAPI.emit("cloaking:auto-toggle", null);
    }
  );
  initSwitch(
    document.getElementById("antiCloseSwitch") as HTMLInputElement,
    "antiClose",
    null
  );

  //Apperance
  initializeDropdown(
    "tabLayoutButton",
    "tabLayoutOptions",
    "verticalTabs",
    "false",
    () => {
      eventsAPI.emit("UI:changeLayout", null);
      setTimeout(() => {
        eventsAPI.emit("UI:changeLayout", null);
      }, 100);
    }
  );
  initializeDropdown(
    "UIStyleButton",
    "UIStyleOptions",
    "UIStyle",
    "operagx",
    () => {
      eventsAPI.emit("UI:changeStyle", null);
      eventsAPI.emit("theme:template-change", null);
      setTimeout(() => {
        eventsAPI.emit("UI:changeStyle", null);
        eventsAPI.emit("theme:template-change", null);
      }, 100);
    }
  );
  var colorPicker = new (iro.ColorPicker as any)(".colorPicker", {
    width: 80,
    color: (await settingsAPI.getItem("themeColor")) || "rgba(141, 1, 255, 1)",
    borderWidth: 0,
    layoutDirection: "horizontal",
    layout: [
      {
        component: iro.ui.Box,
      },
      {
        component: iro.ui.Slider,
        options: {
          sliderType: "hue",
        },
      },
    ],
  });

  colorPicker.on("input:change", async function (color: any) {
    eventsAPI.emit("theme:color-change", { color: color.rgbaString });
  });

  initializeDropdown(
    "themeButtonCustom",
    "themeOptionsCustom",
    "themeCustom",
    "dark",
    function () {
      eventsAPI.emit("theme:template-change", null);
      setTimeout(() => {
        eventsAPI.emit("theme:template-change", null);
      }, 100);
    }
  );

  // Searching
  initializeDropdown("proxyButton", "proxyOptions", "proxy", "uv");
  initializeDropdown(
    "transportButton",
    "transportOptions",
    "transports",
    "libcurl"
  );
  initializeDropdown(
    "searchButton",
    "searchOptions",
    "search",
    "https://duckduckgo.com/?q=%s"
  );

  // Load and handle visibility of wisp and bare settings
  const wispSetting = document.getElementById(
    "wispSetting"
  ) as HTMLInputElement;
  if (wispSetting) {
    wispSetting.value =
      (await settingsAPI.getItem("wisp")) ||
      (location.protocol === "https:" ? "wss" : "ws") +
        "://" +
        location.host +
        "/wisp/";
  }

  const saveInputValue = (inputId: string, settingsKey: string) => {
    const inputElement = document.getElementById(inputId) as HTMLInputElement;

    inputElement.addEventListener("change", async () => {
      await settingsAPI.setItem(settingsKey, inputElement.value);
      location.reload();
    });
    inputElement.addEventListener("keypress", async (event) => {
      if (event.key === "Enter") {
        await settingsAPI.setItem(settingsKey, inputElement.value);
        location.reload();
      }
    });
  };

  saveInputValue("wispSetting", "wisp");
});

function saveInputValueAsButton(
  button: HTMLButtonElement,
  input: HTMLInputElement,
  key: string
) {
  button.addEventListener("click", async () => {
    await settingsAPI.setItem(key, input.value);
    location.reload();
  });
}

saveInputValueAsButton(
  document.getElementById("saveWispSetting") as HTMLButtonElement,
  document.getElementById("wispSetting") as HTMLInputElement,
  "wisp"
);

document
  .getElementById("resetWispSetting")!
  .addEventListener("click", async () => {
    await settingsAPI.removeItem("wisp");
    location.reload();
  });
