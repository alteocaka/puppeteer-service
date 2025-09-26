const express = require("express");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer");

const app = express();
const port = 3000;

// Allow larger payloads (HTML can be long) with better content-type handling
app.use(bodyParser.text({ 
  type: ["text/html", "text/plain", "application/json"], 
  limit: "5mb" 
}));

app.post("/render", async (req, res) => {
  let html = req.body;

  if (!html) {
    return res.status(400).send("No HTML provided");
  }

  // Handle JSON input format and extract HTML from it
  try {
    const parsed = JSON.parse(html);
    if (parsed.html) {
      html = parsed.html;
      console.log("Extracted HTML from JSON input");
    }
  } catch (e) {
    // Not JSON, use as-is
    console.log("Using raw HTML input");
  }

  try {
    // Try different Chromium paths for different environments
    const chromiumPaths = [
      "/usr/bin/chromium",           // Docker/Ubuntu
      "/usr/bin/chromium-browser",   // Alternative Ubuntu path
      "/usr/bin/google-chrome",      // Google Chrome
      "/usr/bin/google-chrome-stable", // Google Chrome stable
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", // macOS
      process.env.PUPPETEER_EXECUTABLE_PATH, // Environment variable
    ].filter(Boolean);

    let browser;
    let lastError;

    // Try to launch with different executable paths
    for (const executablePath of chromiumPaths) {
      try {
        console.log(`🔍 Trying Chromium at: ${executablePath}`);
        browser = await puppeteer.launch({
          headless: "new",
          args: [
            "--no-sandbox", 
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--single-process",
            "--disable-gpu"
          ],
          executablePath: executablePath,
        });
        console.log(`✅ Successfully launched Chromium at: ${executablePath}`);
        break;
      } catch (error) {
        console.log(`❌ Failed to launch Chromium at: ${executablePath} - ${error.message}`);
        lastError = error;
        continue;
      }
    }

    // If all paths failed, try without specifying executablePath
    if (!browser) {
      try {
        console.log(`🔍 Trying default Puppeteer Chromium...`);
        browser = await puppeteer.launch({
          headless: "new",
          args: [
            "--no-sandbox", 
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--single-process",
            "--disable-gpu"
          ],
        });
        console.log(`✅ Successfully launched default Puppeteer Chromium`);
      } catch (error) {
        console.log(`❌ Failed to launch default Puppeteer Chromium - ${error.message}`);
        throw new Error(`Could not launch Chromium. Last error: ${lastError?.message || error.message}`);
      }
    }

    const page = await browser.newPage();

    // Log the raw HTML size and preview
    console.log("Rendering HTML (length):", html.length);
    console.log("HTML preview:", html.slice(0, 300), "...");

    await page.setViewport({ width: 1080, height: 1350 });
    
    // Improved wait conditions - use domcontentloaded instead of networkidle0
    await page.setContent(html, { 
      waitUntil: "domcontentloaded", 
      timeout: 30000 
    });
    
    // Add additional wait for fonts/images to load
    await page.waitForTimeout(1000);
    
    // Check if content actually loaded and add debugging
    const bodyText = await page.evaluate(() => document.body.innerText);
    const bodyHTML = await page.evaluate(() => document.body.innerHTML);
    console.log("Body content length:", bodyText.length);
    console.log("Body HTML length:", bodyHTML.length);
    
    // If no content loaded, try waiting a bit more
    if (bodyText.length === 0 && bodyHTML.length < 100) {
      console.log("⚠️  No content detected, waiting additional 2 seconds...");
      await page.waitForTimeout(2000);
      
      // Check again
      const retryBodyText = await page.evaluate(() => document.body.innerText);
      const retryBodyHTML = await page.evaluate(() => document.body.innerHTML);
      console.log("Retry - Body content length:", retryBodyText.length);
      console.log("Retry - Body HTML length:", retryBodyHTML.length);
    }

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
