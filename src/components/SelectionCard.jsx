// src/components/SelectionCard.jsx
import React from "react";

export default function SelectionCard({
  part,
  status = "empty", // 'selected', 'ai-suggested', 'empty', 'disabled'
  onSelect,
  onRemove,
  emptySlotLabel,
  isDisabled = false,
  isQuickPick = false, // New prop
}) {
  const isActuallyEmpty = status === "empty" || !part;
  // For quick picks, even if they display a part, their action is 'onSelect'
  const isSelectedForDisplay =
    status === "selected" && !isActuallyEmpty && !isQuickPick;
  const isAiSuggestedForDisplay =
    status === "ai-suggested" && !isActuallyEmpty && !isQuickPick;
  const isEmptySlotForDisplay = status === "empty" && isActuallyEmpty;
  const isEffectivelyDisabled = isDisabled || status === "disabled";

  let cardClasses =
    "relative w-[240px] bg-[#1e1b22] rounded-lg flex flex-col items-center overflow-hidden group transition-all duration-200 ease-in-out flex-shrink-0"; // Added flex-shrink-0
  let contentPadding = "p-3";

  if (isEffectivelyDisabled && !isQuickPick) {
    // Don't apply disabled styling to quick pick items themselves, their container handles interaction
    cardClasses += " border border-gray-700 opacity-60 cursor-not-allowed";
  } else if (isSelectedForDisplay) {
    cardClasses += " border border-purple-600 shadow-md";
  } else if (isAiSuggestedForDisplay) {
    cardClasses +=
      " border border-dashed border-purple-500/70 hover:border-purple-500";
  } else if (isQuickPick && part) {
    // Style for a quick pick item that has a part
    cardClasses +=
      " border border-gray-600 hover:border-purple-500 cursor-pointer";
  } else {
    // Empty and enabled slot (not a quick pick item with a part)
    cardClasses +=
      " border-2 border-dashed border-gray-700 hover:border-purple-500 cursor-pointer";
    contentPadding = "p-0"; // For the '+' icon area
  }

  if (!isActuallyEmpty && !isEffectivelyDisabled && !isQuickPick) {
    // Hover effects for main selected card
    cardClasses +=
      " hover:scale-[1.03] hover:shadow-lg hover:shadow-purple-700/30";
  }
  if (isQuickPick && part && !isEffectivelyDisabled) {
    // Hover effects for quick pick items
    cardClasses +=
      " hover:scale-[1.03] hover:shadow-md hover:shadow-purple-700/30";
  }

  const handleCardClick = () => {
    if (isEffectivelyDisabled && !isQuickPick) return; // If main slot disabled, no action
    if (isQuickPick && isEffectivelyDisabled) return; // If quick pick item itself is marked disabled (though unlikely)

    if (onSelect) {
      // onSelect is now primary for quick picks, and for empty main slots
      onSelect();
    }
  };

  return (
    <div
      className={cardClasses}
      style={{ height: "auto", minHeight: "200px" }}
      onClick={handleCardClick}
    >
      {!isActuallyEmpty &&
        part && ( // Ensure part exists to display details
          <>
            {isSelectedForDisplay && (
              <span className="absolute top-2 left-2 bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold z-10">
                Selected
              </span>
            )}
            {isAiSuggestedForDisplay && (
              <span className="absolute top-2 left-2 bg-teal-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold z-10">
                AI Suggested
              </span>
            )}
            {isQuickPick && ( // Optional: A small visual cue for quick pick items
              <span className="absolute top-1 right-1 bg-gray-700 text-purple-300 text-[9px] px-1 py-0.5 rounded-full font-medium z-10 opacity-70 group-hover:opacity-100">
                Pick
              </span>
            )}

            {/* Show 'X' button only for the main selected card, not for quick picks */}
            {isSelectedForDisplay && onRemove && !isEffectivelyDisabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click if X is clicked
                  onRemove();
                }}
                className="absolute top-2 right-2 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-xs font-bold z-10 opacity-80 group-hover:opacity-100 transition-opacity"
                title="Remove Component"
              >
                ✕
              </button>
            )}

            <div
              className={`w-full flex flex-col items-center gap-2 ${contentPadding}`}
            >
              <div className="w-full h-[100px] flex items-center justify-center mt-4 mb-1">
                <img
                  src={
                    part.imageUrl ||
                    `https://placehold.co/100x80/1e1b22/333?text=${
                      part.category || "N/A"
                    }`
                  }
                  alt={part.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <p className="font-bold text-white text-sm">
                ₹{part.price?.toLocaleString("en-IN") || "N/A"}
              </p>
              <p
                className="font-mono text-xs text-gray-300 text-center w-full truncate px-1"
                title={part.name}
              >
                {part.name || "Component Name"}
              </p>
            </div>
          </>
        )}
      {isEmptySlotForDisplay &&
        !isQuickPick && ( // Only show '+' for the main empty slot
          <div
            className={`w-full min-h-[200px] flex flex-col items-center justify-center gap-1 p-3 ${
              isEffectivelyDisabled
                ? "text-gray-600 cursor-not-allowed"
                : "text-gray-500 hover:text-purple-400" // No longer need cursor-pointer here, outer div handles click
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="text-xs">Add {emptySlotLabel || "Component"}</span>
          </div>
        )}
    </div>
  );
}
