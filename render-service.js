const express = require("express");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer");

const app = express();
const port = 3000;

// Allow larger payloads (HTML can be long)
app.use(bodyParser.text({ type: "*/*", limit: "5mb" }));

app.post("/render", async (req, res) => {
  const html = req.body;

  if (!html) {
    return res.status(400).send("No HTML provided");
  }

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: "/usr/bin/chromium", // or try leaving this out if it still fails
    });

    const page = await browser.newPage();

    // Log the raw HTML size and preview
    console.log("Rendering HTML (length):", html.length);
    console.log("HTML preview:", html.slice(0, 300), "...");

    await page.setViewport({ width: 1080, height: 1350 });
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });

    const screenshot = (await page.screenshot({ type: "png" })).toString(
      "base64"
    );

    await browser.close();

    res.set("Content-Type", "image/png");
    res.send(screenshot);
  } catch (err) {
    console.error("🛑 Error generating screenshot:", err.stack || err);
    res
      .status(500)
      .send("Failed to generate screenshot: " + (err.message || err));
  }
});

app.listen(port, () => {
  console.log(`📸 Screenshot service listening on port ${port}`);
});
