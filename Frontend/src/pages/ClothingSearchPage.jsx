import React, { useState } from "react";
import axios from "axios";
import ClothingCard from "../components/ClothingCard.jsx";
import SearchLoader from "../components/SearchLoader.jsx";
import {API} from "../backend.js"
const ClothingSearchPage = () => {
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API}/api/clothing/${searchInput}`
      );
      setSearchResults(response.data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[100vh] bg-pink-100 text-center">
      <h1 className="text-3xl sm:text-5xl font-bold pt-10 sm:pt-20 pb-5 text-pink-600">Clothing Search</h1>
      <div className="flex justify-center items-center gap-2 sm:gap-3 px-4 my-5">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="What are you looking for ? "
          className="text-base sm:text-lg rounded-md border border-pink-500 px-4 sm:px-5 py-2 flex-1 min-w-0 max-w-md"
        />
        <button
          className="text-base sm:text-lg text-white p-2 rounded-lg bg-pink-600 w-28 sm:w-40 shrink-0"
          onClick={handleSearch}
        >
          Search
        </button>
      </div>
      <div className="mt-6 mx-auto">
        {loading ? (
          <SearchLoader
            icons={["👕", "👗", "👖"]}
            message="Stitching together the best fashion deals…"
            subMessage="Searching Myntra, Ajio, Snapdeal, Amazon & Flipkart — up to a minute"
            colorClass="text-pink-600"
            barClass="bg-pink-500"
          />
        ) : searchResults.length === 0 ? (
          <p>No results found.</p>
        ) : (
          <div className="p-3 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-8">
              {searchResults.map((singleresult) => {
                if (singleresult === null) {
                  return <div>NO Results Found!</div>;
                }
                return singleresult.map((result, index) => {
                  return (
                    <ClothingCard
                      key={index}
                      link={result?.link}
                      image={result?.image}
                      title={result?.title}
                      price={result?.price}
                      discountPrice={result?.discountPrice}
                      discount={result?.discount}
                      scrapFrom={result?.scrapFrom}
                    />
                  );
                });
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClothingSearchPage;