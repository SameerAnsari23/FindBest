import { useState } from "react";
import { Link } from "react-router-dom";

const Areas = () => {
  const [value, setValue] = useState("select");

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  return (
    <div className="h-[517px] flex items-center justify-center bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 h-screen">
      <div className="flex flex-col items-center justify-between bg-white shadow-lg rounded-3xl p-8 w-80 sm:w-96">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 whitespace-nowrap">Choose a Category</h2>
        
        <select
          className="mt-4 text-lg text-center p-3 border-2 border-gray-400 w-full rounded-full bg-gray-50 hover:border-sky-500 hover:text-sky-500 transition-all ease-in-out duration-300"
          value={value}
          onChange={handleChange}
        >
          <option value="select" disabled>
            Select Category
          </option>
          <option value="Medical">Medical</option>
          <option value="Clothing">Clothing</option>
          <option value="Grocery">Grocery</option>
          <option value="Smartphone">Smartphone</option>
        </select>

        {value === "select" ? (
          <p className="text-center m-5 text-gray-600 text-lg">
            Please select a category
          </p>
        ) : (
          <p className="text-center m-3 text-gray-800 text-lg">
            Ready to compare <span className="text-sky-500 font-bold">{value}</span> products?
          </p>
        )}

        <button
          className={`w-full text-md py-3 rounded-full mt-4 shadow-lg hover:shadow-xl transition-all ease-in-out duration-300 ${
            value === "select" ? "bg-red-600 cursor-not-allowed" : "bg-sky-500 hover:bg-sky-600 text-white"
          }`}
          disabled={value === "select"}
        >
          {value === "select" ? (
            "Select a Category First"
          ) : (
            <Link className="block w-full h-full text-center" to={`/search-page/${value}`}>
              SUBMIT
            </Link>
          )}
        </button>
      </div>
    </div>
  );
};

export default Areas;
