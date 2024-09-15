import React, { useState } from "react";
import axios from "axios";
import SmartPhoneCard from "../components/SmartPhoneCard.jsx";
import { API } from "../backend.js";

const SmartPhoneSearchPage = () => {
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false); // New loading state

  const handleSearch = async () => {
    try {
      setLoading(true); // Start loading
      const response = await axios.get(`${API}/api/smartphone/${searchInput}`);
      setSearchResults(response.data);
      setLoading(false); // End loading
    } catch (error) {
      console.error(error);
      setLoading(false); // End loading even on error
    }
  };

  return (
    <div className="min-h-[100vh] bg-gradient-to-br from-gray-800 to-gray-900 text-center text-black">
      <h1 className="text-5xl font-extrabold pt-20 pb-5 text-cyan-400">
        Smartphone Search
      </h1>
      <p className="text-lg text-gray-400 mb-8">
        Search for the latest smartphones and tablets with detailed specs.
      </p>

      <div className="flex justify-center mb-10">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Enter a smartphone or tablet name"
          className="text-lg rounded-l-full border-none px-6 py-3 w-2/4 outline-none focus:ring-2 focus:ring-cyan-500 bg-gray-700 text-white"
        />
        <button
          className="text-lg text-white px-6 py-3 rounded-r-full bg-cyan-500 hover:bg-cyan-600 transition duration-300 ease-in-out"
          onClick={handleSearch}
        >
          Search
        </button>
      </div>

      <div className="mt-6 mx-auto">
        {loading ? ( // Show loading while waiting for the results
          <div className="text-cyan-400 text-lg font-semibold">Loading...</div>
        ) : searchResults.length === 0 ? (
          <p className="text-gray-400">No results found.</p>
        ) : (
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {searchResults.map((singleresult, index) => {
                if (singleresult === null) {
                  return (
                    <div key={index} className="text-red-500">
                      NO Results from Amazon (SERVER ERROR!)
                    </div>
                  );
                }
                return singleresult.map((result, idx) => (
                  <SmartPhoneCard
                    key={idx}
                    scrapFrom={result?.scrapFrom}
                    fullURL={result?.fullURL}
                    name={result?.name}
                    image={result?.image}
                    price={result?.price}
                    SPEC_SCORE={result?.SPEC_SCORE}
                    Status={result?.Status}
                    Ratings={result?.Ratings}
                  />
                ));
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartPhoneSearchPage;
