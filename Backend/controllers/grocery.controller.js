const getGroceryFrugivoreDescription = require("../Categories/GroceryWebsites/FrugivoreModule.js");
const searchAmazon = require("../Categories/Common/AmazonScraper.js");
const searchFlipkart = require("../Categories/Common/FlipkartScraper.js");
const { toGroceryCard, sortByRating } = require("../services/mappers.js");

const searchGrocery = async (req, res) => {
  const { name } = req.params;

  try {
    const searchResults = [];

    const frugivoreurl = `https://frugivore.in/search?qf=${name}`;
    // Run all scrapers in parallel — each one is independent
    const [frugivoreResult, amazonItems, flipkartItems] = await Promise.all([
      getGroceryFrugivoreDescription(frugivoreurl),
      searchAmazon(`${name} grocery`),
      searchFlipkart(`${name} grocery`),
    ]);

    // Site order: Frugivore -> Amazon -> Flipkart.
    // Amazon/Flipkart blocks are sorted internally by weighted rating;
    // Frugivore has no rating data, so it stays as scraped.
    searchResults.push(frugivoreResult);
    searchResults.push(
      toGroceryCard(sortByRating(amazonItems, (p) => p.rating, (p) => p.ratingCount))
    );
    searchResults.push(
      toGroceryCard(sortByRating(flipkartItems, (p) => p.rating, (p) => p.ratingCount))
    );

    res.json(searchResults);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { searchGrocery };
