importScripts("/assets/js/lib/filerJS/filer.min.js");
importScripts("/assets/js/lib/JSzip/jszip.min.js");

const Path = Filer.Path;
const fs = new Filer.FileSystem({
  name: "files",
});

self.addEventListener("install", (event) => {
  console.log("Service Worker installed");
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activated");
  event.waitUntil(clients.claim());
});

self.addEventListener("message", async (event) => {
  if (event.data.type === "installExtension") {
    const file = event.data.file;
    await installExtension(file);
  } else if (event.data.type === "removeExtension") {
    const extensionID = event.data.extensionID;
    await removeExtension(extensionID);
  }
});

async function installExtension(file) {
  try {
    const zip = await JSZip.loadAsync(file);
    const manifestContent = await zip.file("manifest.json").async("string");
    const manifest = JSON.parse(manifestContent);
    const extensionID = manifest.id;
    const basePath = `/internal/extensions/${extensionID}/`;

    // Store each file from the zip in the filer virtual filesystem
    await Promise.all(
      Object.keys(zip.files).map(async (filename) => {
        const fileContent = await zip.file(filename).async("arraybuffer");
        const filePath = Path.join(basePath, filename);

        const fileBuffer = Filer.Buffer.from(fileContent);

        return new Promise((resolve) => {
          fs.writeFile(filePath, fileBuffer, (err) => {
            if (err) {
              console.error(`Failed to write file ${filePath}:`, err);
            }
            resolve();
          });
        });
      }),
    );

    console.log(`Extension ${manifest.name} installed successfully.`);
  } catch (err) {
    console.error("Error installing extension:", err);
  }
}

async function removeExtension(extensionID) {
  const basePath = `/internal/extensions/${extensionID}/`;

  fs.readdir(basePath, (err, entries) => {
    if (err) {
      console.error(`Failed to read directory ${basePath}:`, err);
      return;
    }

    entries.forEach((entry) => {
      const filePath = Path.join(basePath, entry);
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error(`Failed to delete file ${filePath}:`, unlinkErr);
        }
      });
    });

    fs.rmdir(basePath, (rmdirErr) => {
      if (rmdirErr) {
        console.error(`Failed to remove directory ${basePath}:`, rmdirErr);
      } else {
        console.log(`Removed extension files for ${extensionID} successfully.`);
      }
    });
  });
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const pathMatch = url.pathname.match(
    /^\/internal\/extensions\/([^\/]+)\/(.*)$/,
  );

  if (pathMatch) {
    const extensionID = pathMatch[1];
    const filePath = `/internal/extensions/${extensionID}/${pathMatch[2]}`;

    event.respondWith(
      new Promise((resolve) => {
        fs.readFile(filePath, "binary", (err, data) => {
          if (err) {
            console.error(`File not found in SW: ${filePath}`, err);
            resolve(new Response("File not found", { status: 404 }));
          } else {
            resolve(
              new Response(data, {
                status: 200,
                headers: { "Content-Type": "application/octet-stream" },
              }),
            );
          }
        });
      }),
    );
  }
});
