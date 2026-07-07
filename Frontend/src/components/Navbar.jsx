import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
        {/* Left: Brand Title */}
        <Link to="/" className="flex items-center shrink-0">
          <h2 className="text-2xl sm:text-3xl font-bold text-purple-600 tracking-wide hover:text-purple-800 transition duration-300 ease-in-out">
            #FindBest
          </h2>
        </Link>

        {/* Right: Navigation Links */}
        <div className="flex items-center space-x-3 sm:space-x-6">
          <Link
            to="/search-page/ai"
            className="text-base sm:text-lg font-semibold whitespace-nowrap bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full px-3 sm:px-4 py-1.5 hover:opacity-90 transition duration-300 ease-in-out"
          >
             AI Search
          </Link>
          {/* <Link
            to="/features"
            className="text-lg font-medium text-gray-700 hover:text-purple-600 transition duration-300 ease-in-out"
          >
            Features
          </Link>
          <Link
            to="/pricing"
            className="text-lg font-medium text-gray-700 hover:text-purple-600 transition duration-300 ease-in-out"
          >
            Pricing
          </Link>
          <Link
            to="/about"
            className="text-lg font-medium text-gray-700 hover:text-purple-600 transition duration-300 ease-in-out"
          >
            About
          </Link> */}
          <a
            href="https://github.com/SameerAnsari23/Find-Best"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-lg text-gray-700 hover:text-purple-600 transition duration-300 ease-in-out"
          >
            <img
              className="h-7 w-7 sm:h-8 sm:w-8"
              src="/github-logo.png"
              alt="GitHub Logo"
            />
            <span className="ml-2 hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
