// src/components/CompactPartCard.jsx
import React from "react";

// This function generates a short summary based on the product category
function getKeySpecs(product) {
  if (!product || !product.specs) return "";
  switch (product.category) {
    case "motherboard":
      return `${product.specs.socket}, ${product.specs.formFactor}`;
    case "cpu":
      return `${product.specs.cores} Cores, ${product.specs.boostClock}`;
    case "gpu":
      return `${product.specs.memory}, ${product.specs.chipset}`;
    case "ram":
      return `${product.specs.capacity}, ${product.specs.speed}`;
    default:
      return product.brand || "";
  }
}

export default function CompactPartCard({ product }) {
  if (!product) {
    return null;
  }

  const imageUrl =
    (product.imageUrls && product.imageUrls[0]) || "/images/placeholder.jpg";
  const keySpecs = getKeySpecs(product);

  return (
    // The main container for the card
    // Styling is based directly on your screenshot's design specs
    <div className="bg-[#1A1B1F] border border-[#372F44] rounded-lg h-[112px] p-4 flex items-center gap-4 transition-all duration-200 hover:border-purple-500 hover:bg-[#212228]">
      {/* Image Container */}
      <div className="flex-shrink-0 w-24 h-full flex items-center justify-center">
        <img
          src={imageUrl}
          alt={product.name}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Text Content */}
      <div className="flex flex-col justify-center overflow-hidden">
        <h3
          className="text-white font-semibold text-base truncate"
          title={product.name}
        >
          {product.name}
        </h3>
        <p className="text-gray-400 text-sm mt-1">{keySpecs}</p>
      </div>
    </div>
  );
}
