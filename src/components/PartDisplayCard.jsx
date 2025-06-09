// src/components/PartDisplayCard.jsx
import React from "react";

export default function PartDisplayCard({
  part,
  type = "suggested", // 'selected' or 'suggested'
  onSelect, // Called when a suggested card is clicked
  onRemove, // Called when the 'X' on a selected card is clicked
}) {
  if (!part) {
    // This can be a placeholder for an empty "selected" slot before anything is chosen
    return (
      <div
        className="flex-shrink-0 w-40 h-48 bg-[#1A1325] rounded-lg border-2 border-dashed border-gray-700 flex flex-col items-center justify-center p-2 text-center hover:border-purple-500 cursor-pointer"
        onClick={onSelect}
      >
        <span className="text-3xl text-gray-600">+</span>
        <span className="text-xs text-gray-500 mt-1">Add Component</span>
      </div>
    );
  }

  const isSelected = type === "selected";

  return (
    <div
      className={`flex-shrink-0 w-40 h-48 bg-[#1e1b22] rounded-lg p-3 flex flex-col justify-between relative border-2 ${
        isSelected
          ? "border-purple-500"
          : "border-gray-700/80 hover:border-gray-600"
      } transition-all duration-150 ease-in-out`}
    >
      {isSelected && (
        <span className="absolute top-2 left-2 bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded font-semibold">
          Selected
        </span>
      )}
      {!isSelected && (
        <span className="absolute top-2 left-2 bg-teal-500 text-white text-[10px] px-1.5 py-0.5 rounded font-semibold">
          AI Suggested
        </span>
      )}
      {isSelected && onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-1 right-1 w-6 h-6 bg-red-600/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-xs z-10"
          title="Remove Component"
        >
          ✕
        </button>
      )}

      <div
        className="flex-grow flex flex-col items-center justify-center text-center cursor-pointer"
        onClick={!isSelected && onSelect ? onSelect : undefined}
      >
        <img
          src={
            part.imageUrl || "https://placehold.co/80x80/1e1b22/333?text=N/A"
          }
          alt={part.name}
          className="max-h-16 h-16 object-contain mb-2 mt-3" // Added mt-3 to give space for tags
        />
        <p
          className="text-xs text-gray-300 w-full truncate font-medium"
          title={part.name}
        >
          {part.name}
        </p>
      </div>
      <p className="text-sm font-semibold text-purple-400 text-center mt-1">
        ₹{part.price?.toLocaleString("en-IN") || "N/A"}
      </p>
    </div>
  );
}
