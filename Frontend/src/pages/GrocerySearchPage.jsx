import React, { useState } from "react";
import axios from "axios";
import GroceryCard from "../components/GroceryCard.jsx";
import SearchLoader from "../components/SearchLoader.jsx";
import { API } from "../backend.js";

const GrocerySearchPage = () => {
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false); // New loading state

  const handleSearch = async () => {
    setLoading(true); // Start loading
    try {
      const response = await axios.get(`${API}/api/grocery/${searchInput}`);
      setSearchResults(response.data);
      setLoading(false); // End loading
    } catch (error) {
      console.error(error);
      setLoading(false); // End loading even on error
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-lime-200 text-center p-8">
      {/* Header Section */}
      <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold pt-6 sm:pt-10 pb-5 text-green-700">
        Fresh Grocery Finder
      </h1>
      <p className="text-base sm:text-lg text-gray-600 mb-8 px-2">
        Search for fresh groceries and get the best deals available!
      </p>

      {/* Search Bar Section */}
      <div className="flex justify-center mb-12 px-4">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search for groceries..."
          className="text-base sm:text-lg rounded-l-full border border-green-400 px-4 sm:px-6 py-3 flex-1 min-w-0 max-w-md outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          className="text-base sm:text-lg text-white px-4 sm:px-6 py-3 rounded-r-full bg-green-600 hover:bg-green-700 transition duration-300 ease-in-out whitespace-nowrap shrink-0"
          onClick={handleSearch}
        >
          Search
        </button>
      </div>

      {/* Results Section */}
      <div className="mx-auto">
        {loading ? ( // Show loading indicator during the search
          <SearchLoader
            icons={["🍎", "🥦", "🥛"]}
            message="Picking the freshest deals for you…"
            subMessage="Searching Frugivore, Amazon & Flipkart"
            colorClass="text-green-700"
            barClass="bg-green-600"
          />
        ) : searchResults.length === 0 ? (
          <p className="text-lg text-gray-500">No results found. Please try another search.</p>
        ) : (
          <div className="p-3 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-8">
              {searchResults.map((singleResult) => {
                if (singleResult === null) {
                  return <div>No Results Found (Server Error)</div>;
                }
                return singleResult.map((result, index) => (
                  <GroceryCard
                    key={index}
                    groceryIMG={result?.groceryIMG}
                    scrapFrom={result?.scrapFrom}
                    groceryURL={result?.groceryURL}
                    groceryName={result?.groceryName}
                    groceryQnty={result?.groceryQnty}
                    groceryMRP={result?.groceryMRP}
                    grocerySavedPrice={result?.grocerySavedPrice}
                    groceryNewPrice={result?.groceryNewPrice}
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

export default GrocerySearchPage;
