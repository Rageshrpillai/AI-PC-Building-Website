// BuildCard.jsx
import React from "react";
import { Link } from "react-router-dom"; // Step 1: Import Link

function StarIcon({ color = "#F87171", size = 18 }) {
  return (
    <svg width={size} height={size} fill={color} viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.916c.969 0 1.371 1.24.588 1.81l-3.977 2.89a1 1 0 00-.364 1.118l1.519 4.674c.3.921-.755 1.688-1.539 1.118l-3.977-2.89a1 1 0 00-1.175 0l-3.977 2.89c-.783.57-1.838-.197-1.539-1.118l1.519-4.674a1 1 0 00-.364-1.118L2.048 10.1c-.783-.57-.38-1.81.588-1.81h4.916a1 1 0 00.95-.69l1.519-4.674z" />
    </svg>
  );
}

export default function BuildCard({ build }) {
  console.log("Rendering build:", build);
  if (!build) {
    console.warn("[BuildCard] No build data provided");
    return null;
  }

  const ratingValue =
    typeof build.rating === "object"
      ? build.rating.rate || 0
      : typeof build.rating === "number"
      ? build.rating
      : 0;

  const getFallbackImage = (buildName) => {
    const text = encodeURIComponent(buildName || "Prebuilt PC");
    const price = build.price ? `\n${build.price.toLocaleString("en-IN")}` : "";
    return `https://placehold.co/400x300/1A1325/FFF?text=${text}${price}`;
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

  // Step 2: Wrap the entire output in a Link component
  return (
    <Link
      to={`/builds/${build.id}`}
      className="no-underline transition-transform duration-200 hover:scale-[1.02]"
    >
      <div className="bg-[#100C16] shadow-lg w-[264px] h-full overflow-hidden rounded-lg border border-gray-800/50 hover:border-purple-500/50 transition-all duration-300 flex flex-col">
        <div className="relative w-[264px] h-[200px]">
          <img
            src={imageUrl}
            alt={build.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.target.src = getFallbackImage(build.name);
              e.target.classList.add("fallback-image");
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        </div>
        <div className="p-4 gap-2 flex flex-col justify-between flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-semibold text-purple-400">
              ${build.price?.toLocaleString("en-IN") || 0}
            </span>
            <span className="flex items-center gap-1 text-[16px] font-bold text-[#C46A6A]">
              {ratingValue.toFixed(1)}
              <StarIcon size={16} />
            </span>
          </div>
          <div>
            <div className="font-semibold mb-2 text-[#D9D9D9] text-[18px] truncate">
              {build.name}
            </div>
            <div className="text-[13px] text-[#D1D1D1] line-clamp-3">
              {build.description}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
