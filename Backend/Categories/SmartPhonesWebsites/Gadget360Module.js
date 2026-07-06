const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

// 91mobiles redesigned their search page: results are now rendered as
// <article class="product-wdgt"> cards instead of the old
// ".finder_snipet_wrap" Angular widgets. All fields are read from the card.
const getelectronicdesc = async (URL) => {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
    );

    await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector("article.product-wdgt", { timeout: 30000 });

    const data = await page.evaluate(() => {
      const cards = [...document.querySelectorAll("article.product-wdgt")].slice(0, 12);
      return cards
        .map((el) => {
          const name = el.querySelector("h2 a")?.textContent.trim() || "";
          const fullURL = el.querySelector("h2 a")?.getAttribute("href") || "";
          const imgEl = el.querySelector(".prd_img img");
          const image =
            imgEl?.getAttribute("src") || imgEl?.getAttribute("data-src") || null;
          const price = el.querySelector(".store_prc")?.textContent.trim() || "N/A";
          const SPEC_SCORE = el.querySelector(".prd_score")?.textContent.trim() || "N/A";
          const Status =
            el.querySelector(".rl-date")?.textContent.trim() || "Available";
          // e.g. "4.6/5(16,044 Ratings)" — keep just "4.6/5"
          const ratingRaw =
            el.querySelector(".user_rating .icn_star")?.textContent.trim() || "";
          const Ratings = ratingRaw ? ratingRaw.split("(")[0] : "N/A";

          return { name, image, price, SPEC_SCORE, Status, Ratings, fullURL, scrapFrom: "91mobiles" };
        })
        .filter((p) => p.name);
    });

    await browser.close();
    return data;
  } catch (error) {
    console.error("91mobiles scraper failed:", error.message);
    if (browser) await browser.close();
    return [];
  }
};

module.exports = getelectronicdesc;
