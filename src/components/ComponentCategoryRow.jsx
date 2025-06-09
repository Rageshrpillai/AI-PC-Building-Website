// src/components/ComponentCategoryRow.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import SelectionCard from "./SelectionCard";

export default function ComponentCategoryRow({
  categoryName,
  categoryKeyForSpecsPage,
  selectedComponent,
  isMultiSlot = false,
  numberOfSlots = 1,
  selectedRamSlots,
  onRemoveSelected,
  onSelectComponent,
  quickPickItems = [],
  selectingForCustomNamePrefix,
  isDisabled = false,
  showQuickPicksForThisCategory = false,
  status, // For upgrade flow: "existing" or "new"
  alternativeParts = [], // For upgrade flow
}) {
  const navigate = useNavigate();

  const handleOpenSelectorForSlot = (slotIdentifier) => {
    if (isDisabled) return;
    navigate(
      `/spec?category=${categoryKeyForSpecsPage}&selectingFor=${encodeURIComponent(
        slotIdentifier
      )}`
    );
  };

  const primarySlotIdentifier = isMultiSlot
    ? `${selectingForCustomNamePrefix} Slot 1`
    : selectingForCustomNamePrefix || categoryName;
  const linkTarget = `/spec?category=${categoryKeyForSpecsPage}&selectingFor=${encodeURIComponent(
    primarySlotIdentifier
  )}`;

  return (
    <div
      className={`mb-8 ${
        isDisabled && categoryName === "RAM" ? "opacity-60" : ""
      }`}
    >
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold text-gray-100 capitalize">
          {categoryName}
        </h2>
        {!(isDisabled && categoryName === "RAM") && categoryKeyForSpecsPage && (
          <Link
            to={linkTarget}
            className="text-xs text-purple-400 hover:text-purple-300 font-medium"
          >
            Browse All &gt;
          </Link>
        )}
        {isDisabled && categoryName === "RAM" && (
          <span className="text-xs text-gray-500 font-medium italic">
            Select Motherboard to enable
          </span>
        )}
      </div>

      <div className="flex items-start space-x-2 overflow-x-auto custom-scrollbar py-1">
        {isMultiSlot && categoryName === "RAM" ? (
          // RAM: Render main selection cards for each slot, no quick picks inside this row
          Array.from({ length: numberOfSlots }).map((_, index) => {
            const slotName = `${selectingForCustomNamePrefix} Slot ${
              index + 1
            }`;
            const currentSelectedComponent = selectedRamSlots?.[slotName];
            return (
              <SelectionCard
                key={slotName}
                part={currentSelectedComponent}
                status={
                  currentSelectedComponent
                    ? "selected"
                    : isDisabled
                    ? "disabled"
                    : "empty"
                }
                onRemove={() => onRemoveSelected(slotName)}
                onSelect={() => handleOpenSelectorForSlot(slotName)}
                emptySlotLabel={slotName}
                isDisabled={isDisabled}
              />
            );
          })
        ) : (
          // Single Slot Categories (CPU, GPU, etc.)
          <>
            <SelectionCard
              part={selectedComponent}
              status={
                selectedComponent
                  ? "selected"
                  : isDisabled
                  ? "disabled"
                  : "empty"
              }
              onRemove={() => onRemoveSelected(categoryName)}
              onSelect={() => handleOpenSelectorForSlot(categoryName)}
              emptySlotLabel={categoryName}
              isDisabled={isDisabled}
              statusBadgeText={
                status === "existing" ? "Kept" : status === "new" ? "New" : null
              }
            />
            {showQuickPicksForThisCategory &&
              quickPickItems.length > 0 &&
              quickPickItems.map((part) => (
                <SelectionCard
                  key={part.id}
                  part={part}
                  status="selected"
                  isQuickPick={true}
                  onSelect={() => onSelectComponent(categoryName, part)}
                />
              ))}
            {alternativeParts.length > 0 &&
              alternativeParts.map((part) => (
                <SelectionCard
                  key={part.id}
                  part={part}
                  status="selected"
                  isQuickPick={true}
                  showAiIcon={true}
                  onSelect={() => onSelectComponent(categoryName, part)}
                />
              ))}
          </>
        )}
      </div>
    </div>
  );
}
