import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        {/* Left: Brand Title */}
        <Link to="/" className="flex items-center">
          <h2 className="text-3xl font-bold text-purple-600 tracking-wide hover:text-purple-800 transition duration-300 ease-in-out">
            #FindBest
          </h2>
        </Link>

        {/* Right: Navigation Links */}
        <div className="flex items-center space-x-6">
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
              className="h-8 w-8"
              src="github-logo.png"
              alt="GitHub Logo"
            />
            <span className="ml-2">GitHub</span>
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
