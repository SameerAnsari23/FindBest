const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

// Scrape real customer-review text for a product. Only Amazon and Flipkart
// expose enough review text to be worth scraping; other sources return [].
// Called only for the TOP-ranked products (not the whole catalog) to keep
// the extra scrape time bounded.

const fetchAmazonReviews = async (page, url) => {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page
    .waitForSelector('[data-hook="review"]', { timeout: 10000 })
    .catch(() => {});
  return page.evaluate(() => {
    return [...document.querySelectorAll('[data-hook="review"]')]
      .slice(0, 8)
      .map((r) => ({
        stars:
          r
            .querySelector('[data-hook="review-star-rating"]')
            ?.textContent.trim()
            .split(" ")[0] || null,
        title:
          r.querySelector('[data-hook="reviewTitle"]')?.textContent.trim() ||
          "",
        text:
          r
            .querySelector('[data-hook="reviewText"]')
            ?.textContent.replace(/\s+/g, " ")
            // strip Amazon's screen-reader boilerplate
            .replace(
              /Brief content visible, double tap to read full content\.\s*Full content visible, double tap to read brief content\./g,
              ""
            )
            .trim()
            .slice(0, 400) || "",
      }))
      .filter((r) => r.text);
  });
};

const fetchFlipkartReviews = async (page, url) => {
  // Flipkart has a dedicated reviews page: swap /p/ for /product-reviews/
  const reviewsUrl = url.replace("/p/", "/product-reviews/");
  await page.goto(reviewsUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
  await new Promise((r) => setTimeout(r, 4000));
  return page.evaluate(() => {
    // Class names rotate on Flipkart, so use a structural heuristic:
    // review bodies are text-only blocks of moderate length.
    return [...document.querySelectorAll("div, p")]
      .filter(
        (d) =>
          !d.querySelector("div") &&
          d.textContent.trim().length > 60 &&
          d.textContent.trim().length < 2000
      )
      .slice(0, 8)
      .map((d) => ({
        stars: null,
        title: "",
        text: d.textContent.replace(/\s+/g, " ").trim().slice(0, 400),
      }));
  });
};

/**
 * Fetch reviews for several products in parallel (one browser, one tab each).
 * @param {Array<{link: string}>} products
 * @returns {Array<Array<{stars, title, text}>>} reviews per product (same order)
 */
const fetchReviewsForProducts = async (products) => {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: "new" });
    const results = await Promise.all(
      products.map(async (product) => {
        const url = product.link || "";
        let fetcher = null;
        if (url.includes("amazon.in")) fetcher = fetchAmazonReviews;
        else if (url.includes("flipkart.com")) fetcher = fetchFlipkartReviews;
        if (!fetcher) return [];

        const page = await browser.newPage();
        try {
          await page.setUserAgent(UA);
          const reviews = await fetcher(page, url);
          return reviews;
        } catch (err) {
          console.error(`Review scrape failed for ${url}:`, err.message);
          return [];
        } finally {
          await page.close().catch(() => {});
        }
      })
    );
    await browser.close();
    return results;
  } catch (error) {
    console.error("Review scraper failed:", error.message);
    if (browser) await browser.close().catch(() => {});
    return products.map(() => []);
  }
};

module.exports = { fetchReviewsForProducts };
