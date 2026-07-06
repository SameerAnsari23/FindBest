const puppeteer = require("puppeteer-extra");

// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

// Add adblocker plugin to block all ads and trackers (saves bandwidth)
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

// NOTE: Ajio has deployed bot protection (Akamai) that serves an
// "Access Denied" page to headless browsers, so this scraper usually
// returns no results. It fails gracefully (empty array) so the clothing
// search still shows Myntra + Snapdeal results.
const getClothesAjio = async (URL) => {
  let browser;
  try {
    let data = [];
    browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    );
    await page.setViewport({ width: 1080, height: 1024 });

    await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });

    const title = await page.title();
    if (/access denied/i.test(title)) {
      console.warn("Ajio blocked the request (Access Denied) — skipping.");
      await browser.close();
      return [];
    }

    await page
      .waitForSelector(".item.rilrtl-products-list__item", { timeout: 20000 })
      .catch(() => {});
    const elements = await page.$$(".item.rilrtl-products-list__item.item");

    let minLength = 6;
    if (minLength > elements.length) minLength = elements.length;
    for (let i = 0; i < minLength; i++) {
      // Product photos are hosted on assets.ajio.com — badge/offer icons are
      // not, so filter by host instead of relying on a brittle DOM path.
      const image = await page.evaluate((el) => {
        const imgs = [...el.querySelectorAll("img")];
        const productImg = imgs.find((im) => {
          const src = im.getAttribute("src") || im.getAttribute("data-src") || "";
          return src.includes("assets.ajio.com");
        });
        return (
          productImg?.getAttribute("src") ||
          productImg?.getAttribute("data-src") ||
          imgs[0]?.getAttribute("src") ||
          null
        );
      }, elements[i]);
      if (!image) continue;

      const li = await page.evaluate(
        (el) => el.querySelector("a")?.getAttribute("href"),
        elements[i]
      );
      const link = `https://www.ajio.com${li}`;

      const brand = await page.evaluate(
        (el) => el.querySelector("a > div > .contentHolder > div")?.textContent,
        elements[i]
      );

      // ".nameCls" disappeared in an Ajio redesign; fall back to the image's
      // alt text (a full product description) and skip missing pieces instead
      // of rendering "undefined".
      const nameText = await page.evaluate(
        (el) =>
          el.querySelector(".nameCls")?.textContent ||
          el.querySelector("img[alt]")?.getAttribute("alt") ||
          "",
        elements[i]
      );
      // The brand element often already contains the product name mashed in
      // ("Buda Jeans CoMen Embroidered…"), so only append nameText when it
      // adds new information.
      const title =
        brand && nameText && !brand.includes(nameText)
          ? `${brand} - ${nameText}`
          : brand || nameText || "Ajio Product";

      const discountPrice = await page.evaluate(
        (el) =>
          el.querySelector("a > div > .contentHolder > div > span")?.textContent,
        elements[i]
      );

      const price = await page.evaluate(
        (el) =>
          el.querySelector("a > div > .contentHolder > div > div > span")
            ?.textContent,
        elements[i]
      );

      const discount = await page.evaluate(
        (el) =>
          el.querySelector("a > div > .contentHolder > div > div > .discount")
            ?.textContent,
        elements[i]
      );
      const scrapFrom = "Ajio";

      data.push({ link, image, title, price, discountPrice, discount, scrapFrom });
    }

    await browser.close();
    return data;
  } catch (error) {
    console.error("Ajio scraper failed:", error.message);
    if (browser) await browser.close();
    return [];
  }
};

module.exports = getClothesAjio;
