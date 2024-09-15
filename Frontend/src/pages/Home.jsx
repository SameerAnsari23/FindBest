import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  function startExplore() {
    navigate("/categories");
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 p-6">
      <div className="bg-white shadow-lg rounded-3xl p-8 max-w-xl w-full text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-sky-900 mb-6">
          Welcome to Our Web Scraping Service!
        </h1>
        <p className="text-lg sm:text-xl text-gray-700 mb-8">
          Introducing our versatile web scraping project that specializes in extracting data from a wide range of websites, including medicine, clothing, and grocery platforms. With our advanced techniques, we gather product details, prices, availability, and more.
        </p>
        <p className="text-lg sm:text-xl text-gray-700 mb-8">
          Say goodbye to manual research and let our project streamline your data acquisition process efficiently and accurately.
        </p>
        <button
          onClick={startExplore}
          className="text-xl sm:text-2xl font-semibold bg-sky-500 hover:bg-sky-600 text-white py-4 px-8 rounded-full transition-colors duration-300 shadow-md hover:shadow-lg"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default Home;
