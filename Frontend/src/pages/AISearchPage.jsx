import React, { useState } from "react";
import axios from "axios";
import { API } from "../backend.js";

const EXAMPLES = [
  "budget phone under ₹20k good for photography",
  "formal white shirt for office under ₹1500",
  "something for headache and mild fever",
  "healthy breakfast cereal, low sugar",
];

const AISearchPage = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const handleSearch = async (q) => {
    const searchQuery = (q || query).trim();
    if (!searchQuery) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const response = await axios.post(`${API}/api/ai-search`, {
        query: searchQuery,
      });
      setData(response.data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "AI search failed. Is the backend running?"
      );
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-purple-50 to-indigo-100 text-center py-10 px-5">
      <h1 className="text-4xl sm:text-5xl font-bold text-purple-700 mb-3">
        ✨ AI Search
      </h1>
      <p className="text-gray-600 mb-8">
        Describe what you need in plain language — the AI finds it, ranks the
        results, and explains why.
      </p>

      <div className="flex justify-center items-center mb-4 max-w-3xl mx-auto">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder='e.g. "budget phone under ₹20k good for photography"'
          className="text-lg rounded-l-full border border-purple-300 shadow-md focus:outline-none focus:ring-2 focus:ring-purple-400 px-6 py-3 w-full"
        />
        <button
          onClick={() => handleSearch()}
          disabled={loading}
          className="text-lg text-white bg-gradient-to-r from-purple-500 to-indigo-600 py-3 px-8 rounded-r-full shadow-lg hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? "…" : "Ask AI"}
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => {
              setQuery(ex);
              handleSearch(ex);
            }}
            className="text-sm bg-white border border-purple-200 text-purple-700 rounded-full px-4 py-1 hover:bg-purple-100 transition"
          >
            {ex}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-purple-700 text-lg font-semibold animate-pulse">
          Understanding your request, scraping stores, and ranking results…
          <div className="text-sm text-gray-500 mt-1">
            this can take a minute — live sites are being searched
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-2xl mx-auto bg-red-50 border border-red-300 text-red-700 rounded-lg p-4">
          {error}
        </div>
      )}

      {data && (
        <div className="max-w-6xl mx-auto text-left">
          {/* What the AI understood */}
          {data.parsed && (
            <div className="flex flex-wrap gap-2 mb-4 justify-center">
              <span className="bg-purple-600 text-white text-sm rounded-full px-3 py-1">
                Category: {data.parsed.category}
              </span>
              <span className="bg-indigo-500 text-white text-sm rounded-full px-3 py-1">
                Searching: {data.parsed.searchTerm}
              </span>
              {data.parsed.budgetINR > 0 && (
                <span className="bg-emerald-600 text-white text-sm rounded-full px-3 py-1">
                  Budget: ₹{data.parsed.budgetINR.toLocaleString("en-IN")}
                </span>
              )}
              {(data.parsed.priorities || []).map((p) => (
                <span
                  key={p}
                  className="bg-white border border-purple-300 text-purple-700 text-sm rounded-full px-3 py-1"
                >
                  {p}
                </span>
              ))}
            </div>
          )}

          {/* AI summary */}
          {data.summary && (
            <div className="bg-white border-l-4 border-purple-500 rounded-lg shadow p-5 mb-8">
              <div className="font-bold text-purple-700 mb-1">
                AI Recommendation
              </div>
              <p className="text-gray-800">{data.summary}</p>
            </div>
          )}

          {/* Ranked results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.results.map((r, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-lg border border-purple-100 p-5 flex flex-col"
              >
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    {r.image ? (
                      <img
                        src={r.image}
                        alt={r.name}
                        className="w-24 h-24 object-contain rounded"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-purple-50 rounded flex items-center justify-center text-3xl">
                        🛍️
                      </div>
                    )}
                    <span className="absolute -top-2 -left-2 bg-purple-600 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center">
                      #{i + 1}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 leading-snug line-clamp-2">
                      {r.name}
                    </h3>
                    <div className="text-lg font-semibold text-emerald-700 mt-1">
                      {r.price}
                      {r.mrp && r.mrp !== r.price && (
                        <span className="text-sm text-gray-400 line-through ml-2">
                          {r.mrp}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {r.scrapFrom}
                      {r.ratings ? ` · ★ ${r.ratings}` : ""}
                      {r.specScore ? ` · Spec ${r.specScore}` : ""}
                    </div>
                  </div>
                  <div className="ml-auto text-center shrink-0">
                    <div className="text-2xl font-extrabold text-purple-600">
                      {r.matchScore}
                    </div>
                    <div className="text-[10px] uppercase text-gray-400">
                      match
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mt-3">
                  <span className="font-semibold text-purple-700">Why: </span>
                  {r.whyRecommended}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-semibold text-indigo-600">
                    Sentiment:{" "}
                  </span>
                  {r.sentimentSummary}
                  {r.reviewsAnalyzed > 0 && (
                    <span className="ml-1 inline-block bg-indigo-100 text-indigo-700 text-[11px] font-semibold rounded-full px-2 py-0.5 align-middle">
                      from {r.reviewsAnalyzed} real reviews
                    </span>
                  )}
                </p>

                {(r.pros?.length > 0 || r.cons?.length > 0) && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {r.pros.map((p) => (
                      <span
                        key={p}
                        className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-full px-2.5 py-0.5"
                      >
                        + {p}
                      </span>
                    ))}
                    {r.cons.map((c) => (
                      <span
                        key={c}
                        className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-full px-2.5 py-0.5"
                      >
                        − {c}
                      </span>
                    ))}
                  </div>
                )}

                {r.link && (
                  <a
                    href={r.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto pt-3"
                  >
                    <button className="w-full text-white bg-purple-600 hover:bg-purple-700 rounded-lg py-2 transition">
                      View on {r.scrapFrom}
                    </button>
                  </a>
                )}
              </div>
            ))}
          </div>

          {data.results.length === 0 && !loading && (
            <p className="text-center text-gray-500 mt-6">
              No matching products found — try rephrasing your request.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AISearchPage;
