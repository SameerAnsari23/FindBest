const getelectronicdesc = require("../Categories/SmartPhonesWebsites/Gadget360Module.js");
const searchAmazon = require("../Categories/Common/AmazonScraper.js");
const searchFlipkart = require("../Categories/Common/FlipkartScraper.js");
const { toSmartphoneCard, sortByRating } = require("../services/mappers.js");

const searchSmartphone = async (req, res) => {
  const { name } = req.params;

  const smartphoneurl = `https://www.91mobiles.com/search_page.php?q=${name}`;

  try {
    const searchResults = [];

    // Run all scrapers in parallel — each one is independent
    const [smartphoneresult, amazonItems, flipkartItems] = await Promise.all([
      getelectronicdesc(smartphoneurl),
      searchAmazon(`${name} phone`),
      searchFlipkart(`${name} mobile`),
    ]);

    // Site order: Amazon -> Flipkart -> 91mobiles.
    // Each site's block is sorted internally by weighted rating
    // (star rating x number of raters).
    searchResults.push(
      toSmartphoneCard(sortByRating(amazonItems, (p) => p.rating, (p) => p.ratingCount))
    );
    searchResults.push(
      toSmartphoneCard(sortByRating(flipkartItems, (p) => p.rating, (p) => p.ratingCount))
    );
    searchResults.push(
      sortByRating(smartphoneresult, (p) => p.Ratings, (p) => p.RatingCount)
    );

    res.json(searchResults);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { searchSmartphone };
