// src/components/MiniBuildCard.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function MiniBuildCard({ build }) {
  if (!build) {
    return null;
  }

  // Helper for image fallback, consistent with BuildCard
  const getFallbackImage = (buildName) => {
    const text = encodeURIComponent(buildName || "Prebuilt PC");
    return `https://placehold.co/80x80/1A1325/FFF?text=${text}`; // Smaller placeholder
  };

  const getImageUrl = (url) => {
    if (!url) {
      return getFallbackImage(build.name);
    }
    if (url.match(/^(https?:\/\/|data:)/) || url.startsWith("/")) {
      return url;
    }
    return `/images/${url.replace("images/", "")}`;
  };

  const imageUrl = getImageUrl(build.imageUrl);

  return (
    <Link
      to={`/builds/${build.id}`}
      className="group bg-[#1A1323] p-4 rounded-lg border border-gray-800/50 hover:border-purple-600/50 transition-all duration-300 flex items-center gap-4 no-underline"
    >
      {/* Image Container - compact size */}
      <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-lg overflow-hidden bg-gray-900">
        <img
          src={imageUrl}
          alt={build.name}
          className="max-w-full max-h-full object-contain"
          loading="lazy"
          onError={(e) => {
            e.target.src = getFallbackImage(build.name);
          }}
        />
      </div>

      {/* Text Content */}
      <div className="flex flex-col justify-center overflow-hidden">
        <h3
          className="text-white font-semibold text-base truncate"
          title={build.name}
        >
          {build.name}
        </h3>
        <p className="text-gray-400 text-sm mt-1 line-clamp-2">
          {build.description}
        </p>
      </div>
    </Link>
  );
}
