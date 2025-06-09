// src/components/PartCard.jsx
import React from "react";

export default function PartCard({
  product,
  isSelectionMode,
  onSelectForBuild,
}) {
  const {
    name = "Unnamed Product",
    price = 0,
    imageUrl,
    category = "N/A",
  } = product || {};
  const fallbackImage = `https://placehold.co/300x300/1e1b22/FFF?text=${encodeURIComponent(
    category
  )}`;
  const description =
    "Quick two line description on the product, that gives a overall details instead pushing that details.";

  return (
    <div className="bg-[#1e1b22] border border-gray-700/50 rounded-lg overflow-hidden flex flex-col h-full shadow-lg transition-transform duration-200 hover:scale-[1.02]">
      <div className="w-full h-48 sm:h-56 flex items-center justify-center bg-black/20 p-4">
        <img
          src={imageUrl || fallbackImage}
          alt={name}
          className="max-h-full max-w-full object-contain"
          onError={(e) => {
            e.target.src = fallbackImage;
          }}
        />
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex-grow">
          <p className="text-xl font-bold text-gray-200 mb-2">
            ₹{typeof price === "number" ? price.toLocaleString("en-IN") : "N/A"}
          </p>
          <h3
            className="text-base font-semibold text-gray-300 mb-2 h-12 overflow-hidden"
            title={name}
          >
            {name}
          </h3>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        {isSelectionMode && onSelectForBuild && (
          <button
            onClick={() => onSelectForBuild(product)}
            className="mt-3 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-3 rounded-md text-xs transition-colors"
          >
            Select for My Build
          </button>
        )}
      </div>
    </div>
  );
}
