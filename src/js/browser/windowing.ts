import { SettingsAPI } from "@apis/settings";

interface WindowingInterface {
  settings: SettingsAPI;
}

class Windowing implements WindowingInterface {
  settings: SettingsAPI;
  constructor() {
    this.settings = new SettingsAPI();
  }

  newWindow() {
    const currentUrl = location.href;

    window.open(currentUrl, "_blank", "noopener,noreferrer");
  }

  async aboutBlankWindow() {
    if (window === window.top) {
      const aboutBlankTab = window.open("about:blank", "_blank");
      const iframe = document.createElement("iframe");
      iframe.src = location.href;
      iframe.setAttribute(
        "style",
        "width: 100%; height: 100%; border: none; position: fixed; inset: 0px; outline: none; scrolling: auto;",
      );
      aboutBlankTab!.document.title = document.title;
      const link = aboutBlankTab!.document.createElement("link");
      link.rel = "icon";
      link.type = "image/x-icon";
      link.href =
        (await this.settings.getItem("favicon")) ||
        location.href + "/res/logo.png";
      aboutBlankTab!.window.addEventListener("beforeunload", (event) => {
        event.preventDefault();
        event.returnValue = "";
      });
      aboutBlankTab!.document.head.appendChild(link);
      aboutBlankTab!.document.body.appendChild(iframe);
    } else {
      console.log("already in about:blank or iframe");
    }
  }

  async aboutBlank() {
    if (window === window.top) {
      const aboutBlankTab = window.open("about:blank");
      const iframe = document.createElement("iframe");
      iframe.src = location.href;
      iframe.setAttribute(
        "style",
        "width: 100%; height: 100%; border: none; position: fixed; inset: 0px; outline: none; scrolling: auto;",
      );
      aboutBlankTab!.document.title = document.title;
      const link = aboutBlankTab!.document.createElement("link");
      link.rel = "icon";
      link.type = "image/x-icon";
      link.href =
        (await this.settings.getItem("favicon")) ||
        location.href + "/res/logo.png";
      aboutBlankTab!.window.addEventListener("beforeunload", (event) => {
        event.preventDefault();
        event.returnValue = "";
      });
      aboutBlankTab!.document.head.appendChild(link);
      aboutBlankTab!.document.body.appendChild(iframe);

      window.location.href =
        (await this.settings.getItem("redirectUrl")) || "https://google.com";
    } else {
      console.log("already in about:blank or iframe");
    }
  }

  BlobWindow() {
    if (window === window.top) {
      const htmlContent = `
              <!DOCTYPE html>
              <html>
              <head>
                  <style>
                      body, html {
                          margin: 0;
                          padding: 0;
                          height: 100%;
                          overflow: hidden;
                      }
                      iframe {
                          width: 100%;
                          height: 100%;
                          border: none;
                      }
                  </style>
              </head>
              <body>
                  <iframe src="${location.href}" frameborder="0"></iframe>
              </body>
              </html>
          `;

      const blob = new Blob([htmlContent], { type: "text/html" });
      const blobUrl = URL.createObjectURL(blob);

      const blobPage = window.open(blobUrl, "_blank");
      blobPage!.window.addEventListener("beforeunload", (event) => {
        event.preventDefault();
        event.returnValue = "";
      });
    } else {
      console.log("already in blob or iframe");
    }
  }
}

export { Windowing };
