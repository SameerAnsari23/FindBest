const axios = require("axios");
const cheerio = require("cheerio");

// Pharmeasy is a Next.js app: the search results are embedded as JSON inside
// the <script id="__NEXT_DATA__"> tag. Parsing that JSON is far more reliable
// than scraping the hashed CSS class names (which change on every deploy).
const getmedicinepharmaDescription = async (URL) => {
  try {
    const response = await axios.get(URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);
    const nextDataRaw = $("#__NEXT_DATA__").html();
    if (!nextDataRaw) {
      console.error("Pharmeasy: __NEXT_DATA__ not found on page");
      return [];
    }

    const nextData = JSON.parse(nextDataRaw);
    const productList = nextData?.props?.pageProps?.productList || [];

    const SearchResultArrForpharmaeasynMedicine = [];
    for (const p of productList) {
      // Skip non-product suggestions (lab tests, banners, etc.) — real
      // medicines have a price and an image.
      const newPrice = p.salePriceDecimal || p.salePrice;
      const mrp = p.mrpDecimal || p.mrp;
      if (!p.slug || !newPrice) continue;

      const saved =
        mrp && newPrice
          ? (Number(mrp) - Number(newPrice)).toFixed(2)
          : p.discountPercent
          ? `${p.discountPercent}%`
          : "0";

      SearchResultArrForpharmaeasynMedicine.push({
        medicineName: p.name,
        medicineURL: `https://pharmeasy.in/online-medicine-order/${p.slug}`,
        medicineMRP: mrp ? `₹${mrp}` : `₹${newPrice}`,
        medicineNewPrice: `₹${newPrice}`,
        medicineSavedPrice: `₹${saved}`,
        medicineQnty: p.measurementUnit || "",
        medicineIMG: p.image || null,
        scrapFrom: "Pharmaeasy.in",
      });

      if (SearchResultArrForpharmaeasynMedicine.length >= 12) break;
    }

    return SearchResultArrForpharmaeasynMedicine;
  } catch (err) {
    console.error("Pharmeasy scraper failed:", err.message);
    return [];
  }
};

module.exports = getmedicinepharmaDescription;
