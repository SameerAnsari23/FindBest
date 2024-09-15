const puppeteer = require("puppeteer-extra");

const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

const getClothesSnapdeal = async (URL) => {
  try {
    const data = [];
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.setViewport({ width: 1080, height: 1024 });

    const element = ".col-xs-6.favDp.product-tuple-listing.js-tuple";
    
    // Ensure the elements are loaded
    await page.waitForSelector(element, { timeout: 60000 });
    
    const elements = await page.$$(element);

    let minLength = 6;
    if (minLength > elements.length) minLength = elements.length;

    for (let i = 0; i < minLength; i++) {
      const image = await page.evaluate(
        (el) =>
          el
            .querySelector(
              ".product-tuple-image > a > .picture-elem > .product-image"
            )?.getAttribute("srcset"),
        elements[i]
      );
      if (!image) continue;

      const link = await page.evaluate(
        (el) => el.querySelector(".product-tuple-image > a")?.getAttribute("href"),
        elements[i]
      );
      const title = await page.evaluate(
        (el) => el.querySelector(".product-desc-rating > a > p")?.getAttribute("title"),
        elements[i]
      );
      const price = await page.evaluate(
        (el) => el.querySelector(".product-price-row.clearfix > div > span")?.textContent,
        elements[i]
      );
      const discountPrice = await page.evaluate(
        (el) => el.querySelector(".lfloat.product-price")?.textContent,
        elements[i]
      );
      const discount = await page.evaluate(
        (el) => el.querySelector(".product-discount > span")?.textContent || 'No discount',
        elements[i]
      );

      const scrapFrom = "Snapdeal";
      data.push({ link, image, title, price, discountPrice, discount, scrapFrom });
    }

    await browser.close();
    console.log(data.length);
    return data;
  } catch (error) {
    console.log("Error occurred:", error);
  }
};

module.exports = getClothesSnapdeal;
