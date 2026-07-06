const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

// Generic Flipkart search scraper shared by all categories.
// Flipkart's CSS class names are obfuscated and rotate between deploys, so we
// only rely on stable hooks: div[data-id] result cards, /p/ product links,
// the image's alt text for the product name, and ₹ amounts in the card text.
const searchFlipkart = async (query, maxItems = 6) => {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    );

    await page.goto(
      `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`,
      { waitUntil: "domcontentloaded", timeout: 60000 }
    );
    await page
      .waitForSelector("div[data-id]", { timeout: 20000 })
      .catch(() => {});

    const items = await page.evaluate((max) => {
      const cards = [...document.querySelectorAll("div[data-id]")];
      const out = [];
      for (const c of cards) {
        const pLink = [...c.querySelectorAll("a")]
          .map((a) => a.getAttribute("href"))
          .find((h) => h && h.includes("/p/"));
        if (!pLink) continue;

        const img = c.querySelector("img");
        const image = img?.getAttribute("src") || null;
        // alt text is the clean product name (e.g. "Apple iPhone 17 (Black, 256 GB)")
        let name = img?.getAttribute("alt") || "";
        // Clothing cards use a generic alt — fall back to the link's title/text
        if (!name || /^image$/i.test(name)) {
          const a = [...c.querySelectorAll("a")].find(
            (x) => x.getAttribute("title") || x.textContent.trim().length > 10
          );
          name = a?.getAttribute("title") || a?.textContent.trim().slice(0, 80) || "";
        }
        if (!name) continue;

        const text = c.textContent;
        // Card text runs values together ("₹78,900₹82,9004% off",
        // "4.616,387 Ratings"), so use strict Indian-format number patterns.
        const prices = text.match(/₹\d{1,3}(?:,\d{2,3})*(?!\d)/g) || [];
        const price = prices[0] || null;
        const mrp = prices[1] || null;
        if (!price) continue;

        const ratingMatch = text.match(/(\d\.\d)[\d,]*\s*Ratings/);
        const rating = ratingMatch ? `${ratingMatch[1]}/5` : "";

        out.push({
          name,
          link: `https://www.flipkart.com${pLink.split("&lid=")[0]}`,
          image,
          price,
          mrp,
          rating,
          scrapFrom: "Flipkart",
        });
        if (out.length >= max) break;
      }
      return out;
    }, maxItems);

    await browser.close();
    return items;
  } catch (error) {
    console.error("Flipkart scraper failed:", error.message);
    if (browser) await browser.close();
    return [];
  }
};

module.exports = searchFlipkart;
