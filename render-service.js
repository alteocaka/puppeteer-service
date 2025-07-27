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
      headless: "new", // Puppeteer 20+ recommended option
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath:
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1350 });
    await page.setContent(html, { waitUntil: "networkidle0" });
    const screenshot = await page.screenshot({ type: "png" });

    await browser.close();

    res.set("Content-Type", "image/png");
    res.send(screenshot);
  } catch (err) {
    console.error("Error generating screenshot:", err);
    res.status(500).send("Failed to generate screenshot");
  }
});

app.listen(port, () => {
  console.log(`📸 Screenshot service listening on port ${port}`);
});
