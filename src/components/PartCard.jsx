// src/components/PartCard.jsx
import React from "react";

// Helper component for the rating star, taken from BuildCard.jsx
function StarIcon({ color = "#F87171", size = 18 }) {
  return (
    <svg width={size} height={size} fill={color} viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.916c.969 0 1.371 1.24.588 1.81l-3.977 2.89a1 1 0 00-.364 1.118l1.519 4.674c.3.921-.755 1.688-1.539 1.118l-3.977-2.89a1 1 0 00-1.175 0l-3.977 2.89c-.783.57-1.838-.197-1.539-1.118l1.519-4.674a1 1 0 00-.364-1.118L2.048 10.1c-.783-.57-.38-1.81.588-1.81h4.916a1 1 0 00.95-.69l1.519-4.674z" />
    </svg>
  );
}

export default function PartCard({
  product,
  isSelectionMode,
  onSelectForBuild,
}) {
  // Return null if no product data is provided to prevent crashes
  if (!product) {
    return null;
  }

  // Safely extract the rating value, same as in BuildCard
  const ratingValue =
    typeof product.rating === "object"
      ? product.rating.rate || 0
      : typeof product.rating === "number"
      ? product.rating
      : 0;

  // A generic description for parts, as they don't have one
  const description = `Core specs for the ${product.name}. Ready to be added to your custom build.`;

  // --- Image handling logic from BuildCard, adapted for 'product' ---
  const getFallbackImage = (productName) => {
    const text = encodeURIComponent(productName || "PC Component");
    const price = product.price
      ? `\n₹${product.price.toLocaleString("en-IN")}`
      : "";
    return `https://placehold.co/400x300/1A1325/FFF?text=${text}${price}`;
  };

  const getImageUrl = (url) => {
    if (!url) {
      return getFallbackImage(product.name);
    }
    if (url.match(/^(https?:\/\/|data:)/) || url.startsWith("/")) {
      return url;
    }
    return `/images/${url.replace("images/", "")}`;
  };

  const imageUrl = getImageUrl(product.imageUrl);
  // --- End of image handling logic ---

  return (
    <div className="bg-[#100C16] shadow-lg w-[264px] h-auto overflow-hidden rounded-lg  hover:border-purple-500/50 transition-all duration-300 flex flex-col">
      <div className="relative w-[264px] h-[200px]">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.target.src = getFallbackImage(product.name);
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
      </div>
      <div className="p-4 gap-2 flex flex-col justify-between flex-1">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl font-bold text-[#C399F2]">
              ₹{product.price?.toLocaleString("en-IN") || "N/A"}
            </span>
            <span className="flex items-center gap-1 text-base font-bold text-[#C46A6A]">
              {ratingValue.toFixed(1)}
              <StarIcon size={16} />
            </span>
          </div>
          <div
            className="font-semibold mb-2 text-lg text-[#D9D9D9] truncate h-7"
            title={product.name}
          >
            {product.name}
          </div>
          <div className="text-sm text-[#D1D1D1] line-clamp-2">
            {description}
          </div>
        </div>

        {/* --- Preserved Selection Button Functionality --- */}
        {isSelectionMode && (
          <button
            onClick={() => onSelectForBuild(product)}
            className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75"
          >
            Select for My Build
          </button>
        )}
      </div>
    </div>
  );
}
