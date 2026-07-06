const express = require("express");
const cors = require("cors");

require('dotenv').config({ path: require('find-config')('.env') });
// medicine
const getmedicineAmazonDescription = require("./Categories/MedicineWebsites/AmazonModule.js");
const getmedicinepharmaDescription = require("./Categories/MedicineWebsites/PharmaeasyModule.js");
const getmedicineApollopharmaDescription = require("./Categories/MedicineWebsites/ApolloPharmaModule.js");
// clothing
const getClothesMyntra = require("./Categories/ClothingWebsites/MyntraModule.js");
const getClothesAjio = require("./Categories/ClothingWebsites/AjioModule.js");
const getClothesSnapdeal = require("./Categories/ClothingWebsites/SnapdealModule.js");
// grocery
const getGroceryFrugivoreDescription = require("./Categories/GroceryWebsites/FrugivoreModule.js");
const getelectronicdesc = require("./Categories/SmartPhonesWebsites/Gadget360Module.js");
// shared Amazon/Flipkart scrapers (used by every category)
const searchAmazon = require("./Categories/Common/AmazonScraper.js");
const searchFlipkart = require("./Categories/Common/FlipkartScraper.js");
// LLM layer (Claude) — natural-language search: parse intent, rank results
const {
  parseQuery,
  rankProducts,
  analyzeReviewSentiment,
} = require("./Categories/Common/AISearch.js");
const { fetchReviewsForProducts } = require("./Categories/Common/ReviewScraper.js");

// ---- mappers: generic Amazon/Flipkart items -> per-category card shapes ----
const percentOff = (price, mrp) => {
  const p = Number(String(price).replace(/[₹,]/g, ""));
  const m = Number(String(mrp).replace(/[₹,]/g, ""));
  if (!p || !m || m <= p) return "0% Off";
  return `${Math.round(((m - p) * 100) / m)}% Off`;
};

const toClothingCard = (items) =>
  items.map((p) => ({
    link: p.link,
    image: p.image,
    title: p.name,
    price: p.mrp || p.price,
    discountPrice: p.price,
    discount: percentOff(p.price, p.mrp),
    scrapFrom: p.scrapFrom,
  }));

const toSmartphoneCard = (items) =>
  items.map((p) => ({
    name: p.name,
    image: p.image,
    price: p.price,
    SPEC_SCORE: "—",
    Status: "Available",
    Ratings: p.rating || "N/A",
    fullURL: p.link,
    scrapFrom: p.scrapFrom,
  }));

const toGroceryCard = (items) =>
  items.map((p) => ({
    groceryIMG: p.image,
    groceryName: p.name,
    groceryURL: p.link,
    groceryMRP: p.mrp || p.price,
    groceryNewPrice: p.price,
    grocerySavedPrice: percentOff(p.price, p.mrp),
    groceryQnty: "",
    scrapFrom: p.scrapFrom,
  }));

const toMedicineCard = (items) =>
  items.map((p) => ({
    medicineIMG: p.image,
    medicineName: p.name,
    medicineURL: p.link,
    medicineMRP: p.mrp || p.price,
    medicineNewPrice: p.price,
    medicineSavedPrice: percentOff(p.price, p.mrp),
    medicineQnty: "",
    scrapFrom: p.scrapFrom,
  }));

// middlewares
const app = express();
app.use(cors( {
  // Allow the deployed frontend plus any localhost port in development
  // (CRA falls back to 3001, 3002, ... when 3000 is already taken).
  origin: ["https://deploy-mern-1whq.vercel.app", /^http:\/\/localhost:\d+$/],
  methods: ["POST", "GET"],
  credentials: true
}
));
app.use(express.json());


const port = process.env.PORT;
// Define the API endpoint for medicine search
app.get("/api/medicine/:name", async (req, res) => {
  const { name } = req.params;

  try {
    console.log("name : "+name);
    const searchResults = [];

    // const URL = `https://www.amazon.in/s?k=${name}&i=hpc&crid=1OSR6C5KJ804W&sprefix=aciloc%2Chpc%2C195&ref=nb_sb_noss_2`;
    // let result = await getmedicineAmazonDescription(URL);
    // console.log(result);

    const pharmeasyurl = `https://pharmeasy.in/search/all?name=${name}`;
    const Apollopharmaurl = `https://www.apollopharmacy.in/search-medicines/${name}`;
    // Run all scrapers in parallel — each one is independent.
    // (Flipkart doesn't sell medicines, so it's Amazon only here.)
    const [result2, result3, amazonItems] = await Promise.all([
      getmedicinepharmaDescription(pharmeasyurl),
      getmedicineApollopharmaDescription(Apollopharmaurl),
      searchAmazon(`${name} medicine`),
    ]);

    searchResults.push(result2);
    searchResults.push(result3);
    searchResults.push(toMedicineCard(amazonItems));

    console.log(searchResults);
    res.json(searchResults);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Define the API endpoint for clothing search
app.get("/api/clothing/:name", async (req, res) => {
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

    searchResults.push(myntraResult);
    searchResults.push(ajioResult);
    searchResults.push(snapdealResult);
    searchResults.push(toClothingCard(amazonItems));
    searchResults.push(toClothingCard(flipkartItems));

    // console.log(searchResults);
    res.json(searchResults);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Define the API endpoint for grocery search
app.get("/api/grocery/:name", async (req, res) => {
  const { name } = req.params;

  // console.log(name);

  try {
   
    const searchResults = [];


    const frugivoreurl=`https://frugivore.in/search?qf=${name}`;
    // Run all scrapers in parallel — each one is independent
    const [result, amazonItems, flipkartItems] = await Promise.all([
      getGroceryFrugivoreDescription(frugivoreurl),
      searchAmazon(`${name} grocery`),
      searchFlipkart(`${name} grocery`),
    ]);

    searchResults.push(result);
    searchResults.push(toGroceryCard(amazonItems));
    searchResults.push(toGroceryCard(flipkartItems));

    res.json(searchResults);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});


//smartphone

app.get("/api/smartphone/:name", async (req, res) => {
  const { name } = req.params;

  //const ajioURL = `https://www.ajio.com/search/?text=${name}`;
  // const myntraURL = `https://www.myntra.com/${name}`;
  // const snapdealURL = `https://www.snapdeal.com/search?keyword=${name}`;
  const smartphoneurl=`https://www.91mobiles.com/search_page.php?q=${name}`;

  try {
    const searchResults = [];

    // Run all scrapers in parallel — each one is independent
    const [smartphoneresult, amazonItems, flipkartItems] = await Promise.all([
      getelectronicdesc(smartphoneurl),
      searchAmazon(`${name} phone`),
      searchFlipkart(`${name} mobile`),
    ]);

    searchResults.push(smartphoneresult);
    searchResults.push(toSmartphoneCard(amazonItems));
    searchResults.push(toSmartphoneCard(flipkartItems));
    // const myntraResult = await getClothesMyntra(myntraURL);
    // const ajioResult = await getClothesAjio(ajioURL);
    // const snapdealResult = await getClothesSnapdeal(snapdealURL);

    // searchResults.push(myntraResult);
    // searchResults.push(ajioResult);
    // searchResults.push(snapdealResult);

    // console.log(searchResults);
    res.json(searchResults);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---- AI search: plain-language query -> parse -> scrape -> rank ----

// Normalizers: each category's card shape -> one common product shape
const normalizers = {
  smartphone: (p) => ({
    name: p.name, price: p.price, mrp: null, ratings: p.Ratings,
    specScore: p.SPEC_SCORE, quantity: null, image: p.image,
    link: p.fullURL, scrapFrom: p.scrapFrom,
  }),
  clothing: (p) => ({
    name: p.title, price: p.discountPrice, mrp: p.price, ratings: null,
    specScore: null, quantity: null, image: p.image,
    link: p.link, scrapFrom: p.scrapFrom,
  }),
  grocery: (p) => ({
    name: p.groceryName, price: p.groceryNewPrice, mrp: p.groceryMRP,
    ratings: null, specScore: null, quantity: p.groceryQnty,
    image: p.groceryIMG, link: p.groceryURL, scrapFrom: p.scrapFrom,
  }),
  medicine: (p) => ({
    name: p.medicineName, price: p.medicineNewPrice, mrp: p.medicineMRP,
    ratings: null, specScore: null, quantity: p.medicineQnty,
    image: p.medicineIMG, link: p.medicineURL, scrapFrom: p.scrapFrom,
  }),
};

// Scraper sets per category (reusing the same scrapers as the category endpoints)
const categoryScrapers = {
  smartphone: (term) => Promise.all([
    getelectronicdesc(`https://www.91mobiles.com/search_page.php?q=${term}`),
    searchAmazon(`${term} phone`),
    searchFlipkart(`${term} mobile`),
  ]).then(([m91, am, fk]) => [
    ...m91.map((p) => normalizers.smartphone(p)),
    ...am.map((p) => ({ ...normalizers.smartphone({ ...p, fullURL: p.link, Ratings: p.rating, SPEC_SCORE: null }), mrp: p.mrp })),
    ...fk.map((p) => ({ ...normalizers.smartphone({ ...p, fullURL: p.link, Ratings: p.rating, SPEC_SCORE: null }), mrp: p.mrp })),
  ]),
  clothing: (term) => Promise.all([
    getClothesMyntra(`https://www.myntra.com/${term}`),
    getClothesSnapdeal(`https://www.snapdeal.com/search?keyword=${term}`),
    searchAmazon(`${term} clothing`),
    searchFlipkart(`${term} clothing`),
  ]).then(([my, sd, am, fk]) => [
    ...(my || []).map(normalizers.clothing),
    ...(sd || []).map(normalizers.clothing),
    ...toClothingCard(am).map(normalizers.clothing),
    ...toClothingCard(fk).map(normalizers.clothing),
  ]),
  grocery: (term) => Promise.all([
    getGroceryFrugivoreDescription(`https://frugivore.in/search?qf=${term}`),
    searchAmazon(`${term} grocery`),
    searchFlipkart(`${term} grocery`),
  ]).then(([fr, am, fk]) => [
    ...(fr || []).map(normalizers.grocery),
    ...toGroceryCard(am).map(normalizers.grocery),
    ...toGroceryCard(fk).map(normalizers.grocery),
  ]),
  medicine: (term) => Promise.all([
    getmedicinepharmaDescription(`https://pharmeasy.in/search/all?name=${term}`),
    getmedicineApollopharmaDescription(`https://www.apollopharmacy.in/search-medicines/${term}`),
    searchAmazon(`${term} medicine`),
  ]).then(([ph, ap, am]) => [
    ...(ph || []).map(normalizers.medicine),
    ...(ap || []).map(normalizers.medicine),
    ...toMedicineCard(am).map(normalizers.medicine),
  ]),
};

app.post("/api/ai-search", async (req, res) => {
  const { query } = req.body || {};
  if (!query || typeof query !== "string" || !query.trim()) {
    return res.status(400).json({ error: "Provide a 'query' string in the request body." });
  }
  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({
      error:
        "AI search is not configured: get a free key at https://console.groq.com/keys and set GROQ_API_KEY in the Backend .env file.",
    });
  }

  try {
    // 1. Understand the request
    const parsed = await parseQuery(query.trim());
    console.log("AI search parsed:", parsed);

    // 2. Scrape the relevant category
    const products = (await categoryScrapers[parsed.category](encodeURIComponent(parsed.searchTerm)))
      .filter((p) => p && p.name)
      .slice(0, 24); // cap what we send to the model

    if (products.length === 0) {
      return res.json({ parsed, summary: "No products found for this search.", results: [] });
    }

    // 3. Rank + explain with Claude
    const ranking = await rankProducts(query.trim(), parsed, products);

    // 4. Merge the AI verdicts back onto the product objects
    const results = ranking.recommendations
      .filter((r) => products[r.productIndex])
      .map((r) => ({
        ...products[r.productIndex],
        matchScore: r.matchScore,
        whyRecommended: r.whyRecommended,
        sentimentSummary: r.sentimentSummary, // signal-based; upgraded below if real reviews exist
        pros: [],
        cons: [],
        reviewsAnalyzed: 0,
      }))
      .sort((a, b) => b.matchScore - a.matchScore);

    // 5. Deep sentiment: scrape REAL review text for the top products that
    //    live on review-rich sites (Amazon/Flipkart), then analyze it.
    const reviewTargets = results
      .filter((r) => /amazon\.in|flipkart\.com/.test(r.link || ""))
      .slice(0, 4);

    if (reviewTargets.length > 0) {
      try {
        const reviewSets = await fetchReviewsForProducts(reviewTargets);
        const withReviews = reviewTargets
          .map((p, i) => ({ ...p, reviews: reviewSets[i] }))
          .filter((p) => p.reviews.length > 0);

        if (withReviews.length > 0) {
          const { analyses } = await analyzeReviewSentiment(query.trim(), withReviews);
          for (const a of analyses) {
            const product = withReviews[a.index];
            if (!product) continue;
            const target = results.find((r) => r.link === product.link);
            if (target) {
              target.sentimentSummary = a.sentimentSummary;
              target.pros = a.pros;
              target.cons = a.cons;
              target.reviewsAnalyzed = product.reviews.length;
            }
          }
        }
      } catch (err) {
        // Review analysis is an enhancement — never fail the whole search on it
        console.error("Review sentiment step failed:", err.message);
      }
    }

    res.json({ parsed, summary: ranking.overallSummary, results });
  } catch (error) {
    console.error("AI search failed:", error);
    res.status(500).json({ error: `AI search failed: ${error.message}` });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
