import express from "express";
import path from "path";
import axios from "axios";
import { URL } from "url";
import contentType from "content-type";

const router = express.Router();
const __dirname = process.cwd();

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "dist/index.html"));
});

router.get("/results/:query", async (req, res) => {
  const { query } = req.params;

  try {
    const response = await fetch(
      `http://api.duckduckgo.com/ac?q=${query}&format=json`,
    );
    const reply = await response.json();
    res.send(reply);
  } catch (error) {
    console.error("Error fetching search results:", error);
    res.status(500).send("Failed to fetch search results");
  }
});

router.use(
  "/internal/",
  express.static(path.join(__dirname, "dist/internal/")),
);

router.use("/internal/icons/:url(*)", async (req, res) => {
  let { url } = req.params;
  url = url.replace("https:/", "");
  url = url.replace("http:/", "");
  url = url.replace("https://", "");
  url = url.replace("http://", "");
  let proxiedUrl;

  try {
    proxiedUrl = "https://icon.horse/icon/" + url;
  } catch (err) {
    console.error(`Failed to decode or decrypt URL: ${err}` + `URL: ${url}`);
    res.status(400).send("Invalid URL");
    return;
  }

  try {
    const assetUrl = new URL(proxiedUrl);
    const assetResponse = await axios.get(assetUrl.toString(), {
      responseType: "arraybuffer",
    });

    const contentTypeHeader = assetResponse.headers["content-type"];
    const parsedContentType = contentTypeHeader
      ? contentType.parse(contentTypeHeader).type
      : "";

    res.writeHead(assetResponse.status, {
      "Content-Type": parsedContentType,
    });

    res.end(Buffer.from(assetResponse.data));
  } catch (err) {
    console.error(`Failed to fetch proxied URL: ${err}`);
    res.status(500).send("Failed to fetch proxied URL");
  }
});

router.use((req, res) => {
  res.status(404);
  res.sendFile(path.join(__dirname, "dist/internal/error/index.html"));
});

export default router;
