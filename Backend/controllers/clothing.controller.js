const getClothesMyntra = require("../Categories/ClothingWebsites/MyntraModule.js");
const getClothesAjio = require("../Categories/ClothingWebsites/AjioModule.js");
const getClothesSnapdeal = require("../Categories/ClothingWebsites/SnapdealModule.js");
const searchAmazon = require("../Categories/Common/AmazonScraper.js");
const searchFlipkart = require("../Categories/Common/FlipkartScraper.js");
const { toClothingCard, sortByRating } = require("../services/mappers.js");

const searchClothing = async (req, res) => {
  const { name } = req.params;

  const ajioURL = `https://www.ajio.com/search/?text=${name}`;
  const myntraURL = `https://www.myntra.com/${name}`;
  const snapdealURL = `https://www.snapdeal.com/search?keyword=${name}`;

  try {
    const searchResults = [];

    // Run all scrapers in parallel — each one is independent
    const [myntraResult, ajioResult, snapdealResult, amazonItems, flipkartItems] =
      await Promise.all([
        getClothesMyntra(myntraURL),
        getClothesAjio(ajioURL),
        getClothesSnapdeal(snapdealURL),
        searchAmazon(`${name} clothing`),
        searchFlipkart(`${name} clothing`),
      ]);

    // Site order: Amazon -> Flipkart -> Myntra -> Ajio -> Snapdeal.
    // Amazon/Flipkart blocks are sorted internally by weighted rating;
    // the other sites have no rating data, so they stay as scraped.
    searchResults.push(
      toClothingCard(sortByRating(amazonItems, (p) => p.rating, (p) => p.ratingCount))
    );
    searchResults.push(
      toClothingCard(sortByRating(flipkartItems, (p) => p.rating, (p) => p.ratingCount))
    );
    searchResults.push(myntraResult);
    searchResults.push(ajioResult);
    searchResults.push(snapdealResult);

    res.json(searchResults);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { searchClothing };
