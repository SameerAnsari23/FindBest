const getmedicinepharmaDescription = require("../Categories/MedicineWebsites/PharmaeasyModule.js");
const getmedicineApollopharmaDescription = require("../Categories/MedicineWebsites/ApolloPharmaModule.js");
const searchAmazon = require("../Categories/Common/AmazonScraper.js");
const { toMedicineCard, sortByRating } = require("../services/mappers.js");

const searchMedicine = async (req, res) => {
  const { name } = req.params;

  try {
    console.log("medicine search:", name);
    const searchResults = [];

    const pharmeasyurl = `https://pharmeasy.in/search/all?name=${name}`;
    const Apollopharmaurl = `https://www.apollopharmacy.in/search-medicines/${name}`;
    // Run all scrapers in parallel — each one is independent.
    // (Flipkart doesn't sell medicines, so it's Amazon only here.)
    const [pharmeasyResult, apolloResult, amazonItems] = await Promise.all([
      getmedicinepharmaDescription(pharmeasyurl),
      getmedicineApollopharmaDescription(Apollopharmaurl),
      searchAmazon(`${name} medicine`),
    ]);

    // Site order: Apollo -> Pharmeasy -> Amazon.
    // Amazon's block is sorted internally by weighted rating;
    // the pharmacies have no rating data, so they stay as scraped.
    searchResults.push(apolloResult);
    searchResults.push(pharmeasyResult);
    searchResults.push(
      toMedicineCard(sortByRating(amazonItems, (p) => p.rating, (p) => p.ratingCount))
    );

    res.json(searchResults);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { searchMedicine };
