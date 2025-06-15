import React from "react";

export default function SkeletonPartCard() {
  return (
    <div className="bg-[#100C16] shadow-lg overflow-hidden rounded-lg border border-gray-800/50 animate-pulse">
      {/* Image Placeholder */}
      <div className="w-full h-52 bg-gray-700/40"></div>
      <div className="p-4">
        {/* Price and Rating Placeholders */}
        <div className="flex items-center justify-between mb-3">
          <div className="h-7 w-1/3 bg-gray-700/40 rounded-md"></div>
          <div className="h-5 w-1/4 bg-gray-700/40 rounded-md"></div>
        </div>
        {/* Title Placeholder */}
        <div className="h-5 w-4/5 bg-gray-700/40 rounded-md mb-2"></div>
        {/* Description Placeholders */}
        <div className="h-3 w-full bg-gray-700/40 rounded-md mt-4"></div>
        <div className="h-3 w-5/6 bg-gray-700/40 rounded-md mt-1"></div>
      </div>
    </div>
  );
}
