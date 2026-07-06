const axios = require("axios");
const cheerio = require("cheerio");

// Frugivore now renders all product data (name, price, MRP, pack size,
// discount, image) directly on the search-results card, so a single request
// is enough — no need to visit every product-detail page like before.
const getGroceryFrugivoreDescription = async (URL) => {
  try {
    const response = await axios.get(URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);
    const SearchResultArrForFrugivoreGrocery = [];

    const cards = $(".col-lg-3.col-md-4.col-sm-6");
    const maxItems = Math.min(cards.length, 12);

    for (let i = 0; i < maxItems; i++) {
      const card = $(cards[i]);

      const groceryName = card.find(".pc-name").text().trim();
      if (!groceryName) continue;

      const href = card.find("a.pc-2025-wrap").attr("href") || card.find("a").attr("href") || "";
      const groceryURL = href.startsWith("http") ? href : `https://frugivore.in${href}`;

      const groceryIMG =
        card.find(".pc-image img").attr("data-src") ||
        card.find(".pc-image img").attr("src") ||
        null;

      // "Rs 399" → current selling price
      const groceryNewPrice = card.find(".pc-price-now").text().replace(/\s+/g, " ").trim();
      // "Rs 499" → striked-through MRP (absent when there is no discount)
      let groceryMRP = card.find(".pc-price-mrp").text().replace(/\s+/g, " ").trim();
      if (!groceryMRP) groceryMRP = groceryNewPrice;

      // "25% OFF" badge (absent when there is no discount)
      let grocerySavedPrice = card.find(".pc-badge--discount").text().replace(/\s+/g, " ").trim();
      if (!grocerySavedPrice) grocerySavedPrice = "0% Off";

      // Selected pack size, e.g. "1 Kg"
      const groceryQnty = card.find(".pc-pack-label").first().text().trim();

      SearchResultArrForFrugivoreGrocery.push({
        groceryIMG,
        groceryName,
        groceryURL,
        groceryMRP,
        groceryNewPrice,
        grocerySavedPrice,
        groceryQnty,
        scrapFrom: "Frugivore",
      });
    }

    return SearchResultArrForFrugivoreGrocery;
  } catch (err) {
    console.error("Frugivore scraper failed:", err.message);
    return [];
  }
};

module.exports = getGroceryFrugivoreDescription;
