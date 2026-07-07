import React, { useState } from "react";
import axios from "axios";
import MedicineCard from "../components/MedicineCard.jsx";
import SearchLoader from "../components/SearchLoader.jsx";
import { API } from "../backend.js";

const MedicalSearchPage = () => {
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false); // Loading state

  const handleSearch = async () => {
    setLoading(true); // Set loading to true when search starts
    try {
      const response = await axios.get(`${API}/api/medicine/${searchInput}`);
      setSearchResults(response.data);
      setLoading(false); // Stop loading once results are received
    } catch (error) {
      console.error(error);
      setLoading(false); // Stop loading even if an error occurs
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-teal-100 to-blue-100 text-center py-10 px-5">
      {/* Header Section */}
      <h1 className="text-3xl sm:text-5xl font-bold text-sky-900 mb-6 sm:mb-10">
        Search for Medicines
      </h1>

      {/* Search Input Section */}
      <div className="flex justify-center items-center gap-2 sm:gap-4 mb-8 px-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Enter a medicine name"
          className="text-base sm:text-lg rounded-full border border-gray-300 shadow-md focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300 px-4 sm:px-5 py-3 flex-1 min-w-0 max-w-xl transition-all duration-300"
        />
        <button
          className="text-base sm:text-lg text-white bg-gradient-to-r from-teal-400 to-sky-600 py-3 px-4 sm:px-6 rounded-full shadow-lg hover:bg-sky-700 transition-all ease-in-out duration-300 whitespace-nowrap shrink-0"
          onClick={handleSearch}
        >
          Search
        </button>
      </div>

      {/* Search Results Section */}
      <div className="mt-8 mx-auto max-w-screen-xl">
        {loading ? ( // Show loading indicator if search is in progress
          <SearchLoader
            icons={["💊", "🩺", "🧪"]}
            message="Checking pharmacies for the best prices…"
            subMessage="Searching Pharmeasy, Apollo & Amazon"
            colorClass="text-sky-700"
            barClass="bg-sky-600"
          />
        ) : searchResults.length === 0 ? (
          <p className="text-gray-500 text-lg">
            No results found. Please search for a medicine.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-10">
            {searchResults.map((singleresult, index) => {
              if (singleresult === null) {
                return (
                  <div key={index} className="text-red-500">
                    No Results from Amazon (Server Error!)
                  </div>
                );
              }
              return singleresult.map((result, idx) => (
                <MedicineCard
                  key={idx}
                  medicineIMG={result?.medicineIMG}
                  scrapFrom={result?.scrapFrom}
                  medicineURL={result?.medicineURL}
                  medicineName={result?.medicineName}
                  medicineQnty={result?.medicineQnty}
                  medicineMRP={result?.medicineMRP}
                  medicineSavedPrice={result?.medicineSavedPrice}
                  medicineNewPrice={result?.medicineNewPrice}
                />
              ));
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalSearchPage;
