const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

// Apollo Pharmacy moved to a client-rendered Next.js app: the search results
// are fetched by JavaScript after page load, so plain axios+cheerio gets an
// empty shell. We render the page with Puppeteer and read the product cards
// using stable hooks (href prefixes, aria-label, text patterns) instead of
// the hashed CSS class names, which change on every deploy.
const getmedicineApollopharmaDescription = async (URL) => {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    );

    await page.goto(URL, { waitUntil: "networkidle2", timeout: 90000 });
    await page
      .waitForSelector('a[href^="/otc/"], a[href^="/medicine/"]', { timeout: 30000 })
      .catch(() => {});

    const results = await page.evaluate(() => {
      const anchors = [
        ...document.querySelectorAll('a[href^="/otc/"], a[href^="/medicine/"]'),
      ];
      const seen = new Set();
      const out = [];

      for (const a of anchors) {
        const href = a.getAttribute("href");
        const name = a.getAttribute("aria-label") || a.querySelector("img")?.alt || "";
        if (!name || seen.has(href)) continue;
        seen.add(href);

        const card =
          a.closest('[class*="productCardGrid"]') || a.parentElement || a;

        // Read each field from its own leaf element — the card's combined
        // textContent runs values together (e.g. "MRP ₹2126% off").
        const leaves = [...card.querySelectorAll("*")].filter(
          (e) => e.children.length === 0 && e.textContent.trim()
        );
        const leafText = (re) => {
          const el = leaves.find((e) => re.test(e.textContent.trim()));
          return el ? el.textContent.trim() : "";
        };

        const priceText = leafText(/^₹[\d,]+(\.\d+)?$/); // "₹15.50"
        const mrpText = leafText(/^MRP\s*₹[\d,]+(\.\d+)?$/); // "MRP ₹21"
        const discText = leafText(/^[\d.]+% off$/i); // "26% off"
        const qtyText = leafText(
          /^\d+\s*(Tablet|Capsule|Strip|ml|gm|g|kg|Sachet|Syrup)/i
        ); // "10 Tablet"

        const img = card.querySelector("img");
        const image =
          (img?.getAttribute("src") || img?.getAttribute("srcset") || "")
            .trim()
            .split(/\s+/)[0] || null;

        const newPrice = priceText ? Number(priceText.replace(/[₹,]/g, "")) : null;
        const mrp = mrpText ? Number(mrpText.replace(/[^\d.]/g, "")) : null;
        const discMatch = discText ? discText.match(/([\d.]+)/) : null;
        const qtyMatch = qtyText ? [qtyText, qtyText] : null;

        out.push({
          medicineIMG: image,
          medicineName: name,
          medicineURL: `https://www.apollopharmacy.in${href}`,
          medicineMRP: mrp !== null ? `₹${mrp}` : "",
          medicineNewPrice: newPrice !== null ? `₹${newPrice}` : "",
          medicineSavedPrice:
            mrp !== null && newPrice !== null
              ? `₹${(mrp - newPrice).toFixed(2)}`
              : discMatch
              ? `${discMatch[1]}%`
              : "",
          medicineQnty: qtyMatch ? qtyMatch[1] : "",
          scrapFrom: "Apollo.in",
        });

        if (out.length >= 12) break;
      }
      return out;
    });

    await browser.close();
    return results;
  } catch (error) {
    console.error("Apollo scraper failed:", error.message);
    if (browser) await browser.close();
    return [];
  }
};

module.exports = getmedicineApollopharmaDescription;
