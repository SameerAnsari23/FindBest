const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

// Generic Amazon.in search scraper shared by all categories.
// Returns raw products; each API endpoint maps them to its card shape.
const searchAmazon = async (query, maxItems = 6) => {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    );

    await page.goto(
      `https://www.amazon.in/s?k=${encodeURIComponent(query)}`,
      { waitUntil: "domcontentloaded", timeout: 60000 }
    );
    await page
      .waitForSelector('div[data-component-type="s-search-result"]', { timeout: 20000 })
      .catch(() => {});

    const items = await page.evaluate((max) => {
      const cards = [
        ...document.querySelectorAll('div[data-component-type="s-search-result"]'),
      ];
      const out = [];
      for (const c of cards) {
        // Skip sponsored/ad results — their links go through /sspa/ redirects
        if (c.querySelector(".puis-sponsored-label-text")) continue;

        const dpLink = [...c.querySelectorAll("a")]
          .map((a) => a.getAttribute("href"))
          .find((h) => h && h.includes("/dp/"));
        if (!dpLink) continue;

        // The card has a brand h2 and a title h2 — take the longest h2 text
        const name = [...c.querySelectorAll("h2")]
          .map((h) => h.textContent.trim())
          .sort((a, b) => b.length - a.length)[0];
        if (!name) continue;

        const image = c.querySelector("img.s-image")?.getAttribute("src") || null;
        const priceWhole = c.querySelector(".a-price .a-price-whole")?.textContent;
        const price = priceWhole ? `₹${priceWhole.replace(/[^\d,]/g, "")}` : null;
        const mrp =
          c.querySelector(".a-price.a-text-price span")?.textContent.trim() || null;
        const ratingText = c.querySelector(".a-icon-alt")?.textContent || "";
        const rating = ratingText ? ratingText.split(" ")[0] + "/5" : "";

        // Rater count, e.g. "(30.9K)" or "(1,234)"
        const countText =
          c.querySelector('a[href*="#customerReviews"]')?.textContent.trim() || "";
        const cm = countText.replace(/[(),\s]/g, "").match(/^([\d.]+)([KkMm]?)$/);
        const ratingCount = cm
          ? Math.round(
              parseFloat(cm[1]) *
                (cm[2].toLowerCase() === "k" ? 1000 : cm[2].toLowerCase() === "m" ? 1000000 : 1)
            )
          : 0;

        if (!price) continue; // unavailable items
        out.push({
          name,
          link: `https://www.amazon.in${dpLink.split("?")[0]}`,
          image,
          price,
          mrp,
          rating,
          ratingCount,
          scrapFrom: "Amazon",
        });
        if (out.length >= max) break;
      }
      return out;
    }, maxItems);

    await browser.close();
    return items;
  } catch (error) {
    console.error("Amazon scraper failed:", error.message);
    if (browser) await browser.close();
    return [];
  }
};

module.exports = searchAmazon;
