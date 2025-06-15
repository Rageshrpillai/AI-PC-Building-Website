// BuildCard.jsx
import React from "react";

function StarIcon({ color = "#F87171", size = 18 }) {
  return (
    <svg width={size} height={size} fill={color} viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.916c.969 0 1.371 1.24.588 1.81l-3.977 2.89a1 1 0 00-.364 1.118l1.519 4.674c.3.921-.755 1.688-1.539 1.118l-3.977-2.89a1 1 0 00-1.175 0l-3.977 2.89c-.783.57-1.838-.197-1.539-1.118l1.519-4.674a1 1 0 00-.364-1.118L2.048 10.1c-.783-.57-.38-1.81.588-1.81h4.916a1 1 0 00.95-.69l1.519-4.674z" />
    </svg>
  );
}

export default function BuildCard({ build }) {
  if (!build) {
    console.warn("[BuildCard] No build data provided");
    return null;
  }

  // Extract rating value safely
  const ratingValue =
    typeof build.rating === "object"
      ? build.rating.rate || 0
      : typeof build.rating === "number"
      ? build.rating
      : 0;

  // Create a fallback image URL using placehold.co with the build's name
  const getFallbackImage = (buildName) => {
    const text = encodeURIComponent(buildName || "Prebuilt PC");
    const price = build.price
      ? `\n₹${build.price.toLocaleString("en-IN")}`
      : "";
    return `https://placehold.co/400x300/1A1325/FFF?text=${text}${price}`;
  };

  // Handle image URL with better path resolution and logging
  const getImageUrl = (url) => {
    if (!url) {
      console.log(
        `[BuildCard] No image URL provided for ${build.name}, using fallback`
      );
      return getFallbackImage(build.name);
    }

    console.log(`[BuildCard] Processing image URL for ${build.name}:`, url);

    try {
      // If it's already a full URL (including https:// or data:)
      if (url.match(/^(https?:\/\/|data:)/)) {
        console.log(`[BuildCard] Using absolute URL: ${url}`);
        return url;
      }

      // If it's an absolute path starting with /
      if (url.startsWith("/")) {
        console.log(`[BuildCard] Using root-relative path: ${url}`);
        return url;
      }

      // If it's in the images directory but doesn't have the full path
      if (url.match(/^(images\/|prebuilt)/)) {
        const newUrl = `/images/${url.replace("images/", "")}`;
        console.log(`[BuildCard] Converted to images path: ${newUrl}`);
        return newUrl;
      }

      // Default case: assume it's a relative path and add /images/
      const defaultUrl = `/images/${url}`;
      console.log(`[BuildCard] Using default path: ${defaultUrl}`);
      return defaultUrl;
    } catch (error) {
      console.error(
        `[BuildCard] Error processing image URL for ${build.name}:`,
        error
      );
      return getFallbackImage(build.name);
    }
  };

  // Get the final image URL
  const imageUrl = getImageUrl(build.imageUrl);
  console.log(`[BuildCard] Final image URL for ${build.name}:`, imageUrl);

  return (
    <div className="bg-[#100C16] shadow-lg w-[264px] h-auto overflow-hidden rounded-lg border border-gray-800/50 hover:border-purple-500/50 transition-all duration-300">
      <div className="relative w-[264px] h-[200px]">
        <img
          src={imageUrl}
          alt={build.name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            console.warn(
              `[BuildCard] Failed to load image for ${build.name}, using fallback`
            );
            e.target.src = getFallbackImage(build.name);
            // Add a class to the image to indicate it's a fallback
            e.target.classList.add("fallback-image");
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
      </div>
      <div className="p-4 gap-2 flex flex-col justify-between flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[18px] font-bold text-[#C399F2]">
            ₹{build.price?.toLocaleString("en-IN") || 0}
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
  );
}
