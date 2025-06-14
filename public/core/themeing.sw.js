importScripts("/assets/js/lib/filerJS/filer.min.js");

const fs = new Filer.FileSystem({
  name: "theme-files",
});

self.addEventListener("install", (event) => {
  console.log("Theming Service Worker installed");
  event.waitUntil(createBackgroundDirectory());
  event.waitUntil(createLogoDirectory());
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activated");
  event.waitUntil(clients.claim());
});

self.addEventListener("message", async (event) => {
  const { type, file } = event.data;

  switch (type) {
    case "uploadBG":
      if (file) {
        await uploadBackground(file);
      }
      break;

    case "removeBG":
      await removeBackground(file);
      break;

    case "listBG":
      const filenames = await listBackgroundFiles();
      event.ports[0]?.postMessage({ filenames });
      break;

    case "uploadLogo":
      if (file) {
        await uploadLogo(file);
      }
      break;
    case "removeLogo":
      if (file) {
        await removeLogo(file);
      }
      break;
    case "listLogos":
      const logoFilenames = await listLogoFiles();
      event.ports[0]?.postMessage({ logoFilenames });
      break;

    default:
      console.warn(`Unknown message type: ${type}`);
  }
});

async function createBackgroundDirectory() {
  return new Promise((resolve) => {
    const dirPath = "/backgrounds";
    fs.mkdir(dirPath, { recursive: true }, (err) => {
      if (err) {
        console.error("Error creating backgrounds directory:", err);
        resolve(false);
      } else {
        console.log("Backgrounds directory created successfully.");
        resolve(true);
      }
    });
  });
}

async function uploadBackground(file) {
  try {
    const filename = `/backgrounds/${file.name}`;
    console.log(`Uploading file: ${file.name}, size: ${file.size} bytes`);

    const arrayBuffer = await file.arrayBuffer();

    const fileBuffer = Filer.Buffer.from(arrayBuffer);

    await fs.writeFile(filename, fileBuffer);

    console.log(`Image "${filename}" uploaded successfully.`);
  } catch (err) {
    console.error("Error uploading image:", err);
  }
}

async function removeBackground(file) {
  const dirPath = "/backgrounds";

  const filePath = `${dirPath}/${file}`;
  fs.unlink(filePath, (unlinkErr) => {
    if (unlinkErr) {
      console.error(`Failed to delete background "${filePath}":`, unlinkErr);
    } else {
      console.log(`Background "${filePath}" removed successfully.`);
    }
  });
}
async function listBackgroundFiles() {
  return new Promise((resolve) => {
    const dirPath = "/backgrounds/";

    fs.readdir(dirPath, (err, entries) => {
      if (err) {
        console.error("Error listing background files:", err);
        resolve([]);
      } else {
        resolve(entries);
      }
    });
  });
}

async function createLogoDirectory() {
  return new Promise((resolve) => {
    const dirPath = "/logos";
    fs.mkdir(dirPath, { recursive: true }, (err) => {
      if (err) {
        console.error("Error creating backgrounds directory:", err);
        resolve(false);
      } else {
        console.log("Backgrounds directory created successfully.");
        resolve(true);
      }
    });
  });
}

async function uploadLogo(file) {
  try {
    const filename = `/logos/${file.name}`;
    console.log(`Uploading file: ${file.name}, size: ${file.size} bytes`);

    const arrayBuffer = await file.arrayBuffer();

    const fileBuffer = Filer.Buffer.from(arrayBuffer);

    await fs.writeFile(filename, fileBuffer);

    console.log(`Logo "${filename}" uploaded successfully.`);
  } catch (err) {
    console.error("Error uploading image:", err);
  }
}

async function removeLogo(file) {
  const dirPath = "/logos";

  const filePath = `${dirPath}/${file}`;
  fs.unlink(filePath, (unlinkErr) => {
    if (unlinkErr) {
      console.error(`Failed to delete Logo "${filePath}":`, unlinkErr);
    } else {
      console.log(`Logo "${filePath}" removed successfully.`);
    }
  });
}

async function listLogoFiles() {
  return new Promise((resolve) => {
    const dirPath = "/logos/";

    fs.readdir(dirPath, (err, entries) => {
      if (err) {
        console.error("Error listing logo files:", err);
        resolve([]);
      } else {
        resolve(entries);
      }
    });
  });
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith("/internal/themes/backgrounds/")) {
    const filename = url.pathname.replace("/internal/themes/backgrounds/", "");

    event.respondWith(
      new Promise((resolve) => {
        fs.readFile(`/backgrounds/${filename}`, "binary", (err, data) => {
          if (err) {
            console.error(`File not found: ${filename}`, err);
            resolve(new Response("File not found", { status: 404 }));
          } else {
            let contentType = "application/octet-stream";
            const ext = filename.split(".").pop().toLowerCase();

            if (ext === "png") contentType = "image/png";
            else if (ext === "jpg" || ext === "jpeg")
              contentType = "image/jpeg";
            else if (ext === "gif") contentType = "image/gif";
            else if (ext === "webp") contentType = "image/webp";
            else if (ext === "svg") contentType = "image/svg+xml";

            resolve(
              new Response(data, {
                status: 200,
                headers: {
                  "Content-Type": contentType,
                  "Cache-Control": "public, max-age=0",
                  Vary: "Accept-Encoding",
                  "accept-ranges": "bytes",
                  connection: "keep-alive",
                },
              }),
            );
          }
        });
      }),
    );
  } else if (url.pathname.startsWith("/internal/themes/logos/")) {
    const filename = url.pathname.replace("/internal/themes/logos/", "");
    event.respondWith(
      new Promise((resolve) => {
        fs.readFile(`/logos/${filename}`, "binary", (err, data) => {
          if (err) {
            console.error(`File not found: ${filename}`, err);
            resolve(new Response("File not found", { status: 404 }));
          } else {
            let contentType = "application/octet-stream";
            const ext = filename.split(".").pop().toLowerCase();

            if (ext === "png") contentType = "image/png";
            else if (ext === "jpg" || ext === "jpeg")
              contentType = "image/jpeg";
            else if (ext === "gif") contentType = "image/gif";
            else if (ext === "webp") contentType = "image/webp";
            else if (ext === "svg") contentType = "image/svg+xml";

            resolve(
              new Response(data, {
                status: 200,
                headers: {
                  "Content-Type": contentType,
                  "Cache-Control": "public, max-age=0",
                  Vary: "Accept-Encoding",
                  "accept-ranges": "bytes",
                  connection: "keep-alive",
                },
              }),
            );
          }
        });
      }),
    );
  }
});
