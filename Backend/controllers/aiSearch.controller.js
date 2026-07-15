const {
  parseQuery,
  rankProducts,
  analyzeReviewSentiment,
} = require("../Categories/Common/AISearch.js");
const { fetchReviewsForProducts } = require("../Categories/Common/ReviewScraper.js");
const { categoryScrapers } = require("../services/categorySearch.service.js");

// AI search pipeline: plain-language query -> parse -> scrape -> rank
// -> scrape real reviews for the top picks -> sentiment analysis.
const aiSearch = async (req, res) => {
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

    // 3. Rank + explain with the LLM
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
};

module.exports = { aiSearch };
