// src/components/PartCard.jsx
import React from "react";

// Helper function to generate star icons (you can make this more sophisticated)
const renderStars = (rate) => {
  const totalStars = 5;
  const fullStars = Math.floor(rate);
  const halfStar = rate % 1 >= 0.5 ? 1 : 0;
  const emptyStars = totalStars - fullStars - halfStar;
  let stars = "";
  for (let i = 0; i < fullStars; i++) stars += "★"; // Full star
  if (halfStar) stars += "✰"; // Could use a half-star icon or just an outline star
  for (let i = 0; i < emptyStars; i++) stars += "☆"; // Empty star
  return stars;
};

export default function PartCard({ product }) {
  const fallbackImage =
    "https://placehold.co/400x300/1e1b22/666666?text=No+Image";

  return (
    <div className="bg-[#1A1325] shadow-lg rounded-lg overflow-hidden flex flex-col h-full">
      <div className="w-full h-48 sm:h-56 flex items-center justify-center bg-[#100C16] p-2">
        <img
          src={product.imageUrl || fallbackImage}
          alt={product.name || "PC Component Image"}
          className="max-h-full max-w-full object-contain"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = fallbackImage;
          }}
        />
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-grow">
        <h3
          className="text-lg font-semibold text-gray-100 mb-1 truncate"
          title={product.name}
        >
          {product.name || "Unnamed Product"}
        </h3>

        {product.brand && (
          <p className="text-xs text-purple-400 mb-2 font-medium">
            {product.brand}
          </p>
        )}

        {/* Rating Display - NEW SECTION */}
        {product.rating && typeof product.rating.rate === "number" && (
          <div className="flex items-center mb-2">
            <span className="text-yellow-400 text-sm">
              {renderStars(product.rating.rate)}
            </span>
            <span className="text-xs text-gray-400 ml-2">
              ({product.rating.rate.toFixed(1)} from {product.rating.count}{" "}
              ratings)
            </span>
          </div>
        )}

        {product.specs && (
          <div className="text-xs text-gray-400 mb-3 space-y-0.5 flex-grow">
            {product.specs.cores && (
              <p>
                <strong>Cores:</strong> {product.specs.cores}
              </p>
            )}
            {product.specs.threads && (
              <p>
                <strong>Threads:</strong> {product.specs.threads}
              </p>
            )}
            {product.specs.baseClock && (
              <p>
                <strong>Base Clock:</strong> {product.specs.baseClock}
              </p>
            )}
            {product.specs.boostClock && (
              <p>
                <strong>Boost Clock:</strong> {product.specs.boostClock}
              </p>
            )}
            {product.specs.socket && (
              <p>
                <strong>Socket:</strong> {product.specs.socket}
              </p>
            )}
            {product.specs.tdp && (
              <p>
                <strong>TDP:</strong> {product.specs.tdp}
              </p>
            )}
            {product.specs.integratedGraphics && (
              <p className="truncate" title={product.specs.integratedGraphics}>
                <strong>Graphics:</strong> {product.specs.integratedGraphics}
              </p>
            )}
          </div>
        )}

        {/* The description was previously here. You asked to replace it with rating. 
            The rating is now above the specs. If you want to remove description entirely, ensure it's not rendered.
            The previous version had it commented out or with a fixed height.
            For this version, I've removed the dedicated description paragraph.
        */}

        <div className="mt-auto pt-2">
          <p className="text-xl font-bold text-[#A35FF3]">
            ${product.price ? product.price.toFixed(2) : "Price N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}
