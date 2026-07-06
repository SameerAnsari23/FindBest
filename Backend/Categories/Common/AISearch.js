const axios = require("axios");

// LLM layer backed by Groq's free tier (OpenAI-compatible API).
// Get a free key (no credit card) at https://console.groq.com/keys,
// then put GROQ_API_KEY=... in Backend/.env
const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const callLLM = async (prompt) => {
  let data;
  try {
    ({ data } = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        response_format: { type: "json_object" },
      },
      {
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        timeout: 60000,
      }
    ));
  } catch (err) {
    // Surface Groq's actual error message instead of a bare status code
    const g = err.response?.data?.error;
    if (g) {
      throw new Error(`Groq API error (${g.code || g.type}): ${g.message}`);
    }
    throw err;
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq returned an empty response");

  // Strip markdown fences if the model added them despite JSON mode
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  return JSON.parse(cleaned);
};

/**
 * Step 1 — turn a plain-language request like
 * "budget phone under ₹20k good for photography" into a structured search:
 * which category to scrape, what keyword to search, budget and priorities.
 */
const parseQuery = async (query) => {
  return callLLM(`A shopper on an Indian price-comparison site typed this request:

"${query}"

Extract the structured search. Respond with ONLY a JSON object of exactly this shape:
{
  "category": "smartphone" | "clothing" | "grocery" | "medicine",
  "searchTerm": "short keyword to type into a shopping-site search box, e.g. 'smartphone camera', 'formal shirt', 'basmati rice', 'paracetamol' - no price words",
  "budgetINR": <maximum budget in rupees as an integer, 0 if none given>,
  "priorities": ["what the user cares about, e.g. 'camera quality', 'battery life'"]
}`);
};

/**
 * Step 2 — given the user's request and the scraped products, rank them,
 * explain each recommendation, and read the sentiment signals
 * (star ratings, rating counts, spec scores, discounts) present in the data.
 */
const rankProducts = async (query, parsed, products) => {
  const catalog = products.map((p, i) => ({
    index: i,
    name: p.name,
    price: p.price,
    mrp: p.mrp || undefined,
    ratings: p.ratings || undefined,
    specScore: p.specScore || undefined,
    quantity: p.quantity || undefined,
    source: p.scrapFrom,
  }));

  return callLLM(`You are the recommendation engine of an Indian price-comparison site.

The user asked: "${query}"
Parsed intent: ${JSON.stringify(parsed)}

Here are the scraped products (prices in ₹):
${JSON.stringify(catalog, null, 1)}

Rank the products that genuinely fit the request (best first). Rules:
- Respect the budget strictly if one was given; over-budget items may appear only if clearly flagged in whyRecommended.
- Ground every claim in the provided data — do not invent specs or reviews. You may use general knowledge about well-known models (e.g. an iPhone's camera reputation) but say when you're doing that.
- Base sentimentSummary only on the rating/score signals present; if an item has none, say "No review data available from this seller."
- Exclude irrelevant products entirely. Recommend at most 8.

Respond with ONLY a JSON object of exactly this shape:
{
  "overallSummary": "2-3 sentences: what was found, the general price/quality landscape, and the single best pick with why",
  "recommendations": [
    {
      "productIndex": <index of the product in the catalog above>,
      "matchScore": <0-100 fit against the user's request>,
      "whyRecommended": "1-2 sentences explaining why this fits THIS user's stated needs and budget",
      "sentimentSummary": "one sentence reading the sentiment signals in the data; if none exist, say so honestly"
    }
  ]
}`);
};

/**
 * Step 3 — sentiment analysis over REAL scraped review text for the
 * top-ranked products. Returns per-product sentiment, pros, and cons
 * grounded in what customers actually wrote.
 */
const analyzeReviewSentiment = async (query, productsWithReviews) => {
  const payload = productsWithReviews.map((p, i) => ({
    index: i,
    name: p.name,
    source: p.scrapFrom,
    reviews: p.reviews.map((r) =>
      [r.stars ? `${r.stars}★` : null, r.title, r.text]
        .filter(Boolean)
        .join(" — ")
    ),
  }));

  return callLLM(`The user is shopping with this request: "${query}"

Below are real customer reviews scraped from shopping sites for the top-ranked products. Summarize the sentiment for each product, grounded ONLY in these reviews — do not invent opinions. Weight aspects the user cares about (from their request) more heavily.

${JSON.stringify(payload, null, 1)}

Respond with ONLY a JSON object of exactly this shape:
{
  "analyses": [
    {
      "index": <index of the product in the list above>,
      "sentimentSummary": "2 sentences summarizing what real customers say, mentioning it is based on N customer reviews",
      "pros": ["up to 3 short phrases customers praise, most relevant to the user's request first"],
      "cons": ["up to 3 short phrases customers complain about; empty array if none appear"]
    }
  ]
}`);
};

module.exports = { parseQuery, rankProducts, analyzeReviewSentiment };
