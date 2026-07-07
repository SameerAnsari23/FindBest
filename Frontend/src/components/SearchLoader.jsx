import React from "react";

/**
 * Animated, theme-able loading indicator shown while a search is running.
 * Pure CSS animation (keyframes in index.css) — no external GIF that can
 * break or slow the page down.
 *
 * Props:
 *  icons      – array of emoji shown bouncing (themed per category)
 *  message    – main loading line
 *  subMessage – smaller line under it (e.g. which sites are being searched)
 *  colorClass – tailwind text color for the message (e.g. "text-pink-600")
 *  barClass   – tailwind bg color for the progress bar (e.g. "bg-pink-500")
 */
const SearchLoader = ({ icons, message, subMessage, colorClass, barClass }) => (
  <div className="flex flex-col items-center justify-center py-10 select-none">
    <div className="flex items-end gap-4 text-6xl mb-6">
      {icons.map((icon, i) => (
        <span
          key={i}
          className="loader-icon"
          style={{ animationDelay: `${i * 0.18}s` }}
        >
          {icon}
        </span>
      ))}
    </div>

    <div className={`text-xl font-bold ${colorClass}`}>{message}</div>
    {subMessage && (
      <div className="text-sm text-gray-400 mt-1">{subMessage}</div>
    )}

    <div className="w-64 h-2 mt-5 rounded-full overflow-hidden bg-gray-400/20">
      <div className={`h-full w-1/3 rounded-full loader-bar ${barClass}`}></div>
    </div>
  </div>
);

export default SearchLoader;
