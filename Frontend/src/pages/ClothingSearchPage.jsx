import React, { useState } from "react";
import axios from "axios";
import ClothingCard from "../components/ClothingCard.jsx";
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
      <h1 className="text-5xl font-bold pt-20 pb-5 text-pink-600">Clothing Search</h1>
      <input
        type="text"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="What are you looking for ? "
        className="text-lg rounded-md border m-5 bottom-2 border-pink-500 border-3 mr-3 px-5 py-2 w-1/3"
      />
      <button
        className="text-lg text-white p-2 rounded-lg bg-pink-600 w-40"
        onClick={handleSearch}
      >
        Search
      </button>
      <div className="mt-6 mx-auto">
        {loading ? (
          <p className="text-pink-600 text-lg font-semibold">
            Searching Myntra, Ajio &amp; Snapdeal… this can take up to a minute.
          </p>
        ) : searchResults.length === 0 ? (
          <p>No results found.</p>
        ) : (
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
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