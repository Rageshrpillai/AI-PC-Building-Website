import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import Navabar from "../components/Navabar";

function PartCard({ part, label, onClick, isSelected }) {
  const borderColor = isSelected ? "border-pink-500" : "border-cyan-700";
  const cursorStyle = onClick ? "cursor-pointer hover:border-pink-400" : "";

  if (!part) {
    return (
      <div className="w-56 h-40 flex flex-col justify-center items-center border-2 border-dashed border-gray-700 bg-[#1A1325] rounded-xl min-w-[220px]">
        <p className="text-gray-500 text-sm">
          {label === "AI Priority" ? "No upgrade needed" : "No part selected"}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative w-56 h-40 flex flex-col justify-between border-2 ${borderColor} ${cursorStyle} bg-[#181122] rounded-xl shadow-lg min-w-[220px] transition-colors duration-200`}
      onClick={onClick}
    >
      {label && (
        <span
          className={`absolute left-2 top-2 ${
            label === "AI Priority" ? "bg-purple-600" : "bg-purple-800"
          } text-xs px-2 py-0.5 rounded-full text-white font-semibold z-10`}
        >
          {label}
        </span>
      )}
      <div className="flex-1 flex items-center justify-center px-2 pt-4">
        <span className="text-lg text-white font-semibold text-center line-clamp-2">
          {part.name}
        </span>
      </div>
      <div className="p-3 flex flex-col">
        <span className="text-base text-purple-300 font-bold">
          ₹{Number(part.price).toLocaleString("en-IN")}
        </span>
        <span className="text-xs text-gray-400 truncate">{part.category}</span>
      </div>
    </div>
  );
}

function UpgradeCategoryRow({
  category,
  existingPart,
  priorityUpgrade,
  alternatives,
  selectedUpgrade,
  onSelectUpgrade,
}) {
  // Special handling for RAM, which can have multiple existing parts
  const isRam = category.key === "ram";
  const existingParts =
    isRam && Array.isArray(existingPart)
      ? existingPart
      : existingPart
      ? [existingPart]
      : [];

  // Don't render the row if there's nothing to show for this category
  if (
    existingParts.length === 0 &&
    !priorityUpgrade &&
    (!alternatives || alternatives.length === 0)
  ) {
    return null;
  }

  return (
    <div className="mb-10">
      <h2 className="text-xl font-semibold text-gray-300 mb-3">
        {category.name}
      </h2>
      <div className="flex overflow-x-auto gap-4 pb-2 custom-scrollbar">
        {/* Show existing parts */}
        {existingParts.map((part, idx) => (
          <PartCard
            key={`existing-${category.key}-${idx}`}
            part={part}
            label={isRam ? `Existing RAM ${idx + 1}` : "Existing Part"}
          />
        ))}
        {(priorityUpgrade || (alternatives && alternatives.length > 0)) &&
          existingParts.length > 0 && (
            <div className="w-px bg-gray-800 self-stretch mx-2"></div>
          )}

        {/* Show priority upgrade */}
        {priorityUpgrade ? (
          <PartCard
            part={priorityUpgrade}
            label="AI Priority"
            isSelected={selectedUpgrade?.id === priorityUpgrade.id}
            onClick={() => onSelectUpgrade(category.key, priorityUpgrade)}
          />
        ) : (
          <PartCard part={null} label="AI Priority" />
        )}

        {/* Show alternatives */}
        {Array.isArray(alternatives) && alternatives.length > 0 && (
          <>
            <div className="w-px bg-gray-800 self-stretch mx-2"></div>
            {alternatives.map((alt, idx) => (
              <PartCard
                key={`alt-${alt.id || idx}`}
                part={alt}
                label="Alternative"
                isSelected={selectedUpgrade?.id === alt.id}
                onClick={() => onSelectUpgrade(category.key, alt)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default function UpgradeResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { upgradeSuggestion, originalBuild } = location.state || {};

  const [costNewParts, setCostNewParts] = useState(0);
  const [selectedUpgrades, setSelectedUpgrades] = useState({});

  const handleSelectUpgrade = (categoryKey, part) => {
    setSelectedUpgrades((prev) => {
      // If the clicked part is already selected, unselect it
      if (prev[categoryKey]?.id === part.id) {
        const newSelections = { ...prev };
        delete newSelections[categoryKey];
        return newSelections;
      }
      // Otherwise, select the new part
      return {
        ...prev,
        [categoryKey]: part,
      };
    });
  };

  const componentCategories = useMemo(
    () => [
      { key: "cpu", name: "CPU" },
      { key: "motherboard", name: "Motherboard" },
      { key: "ram", name: "RAM" },
      { key: "gpu", name: "GPU" },
      { key: "storage", name: "Storage" },
      { key: "cooler", name: "Cooler" },
      { key: "psu", name: "PSU" },
      { key: "case", name: "Case" },
    ],
    []
  );

  // --- Log API shape for debugging!
  useEffect(() => {
    if (upgradeSuggestion) {
      console.log("Upgrade API response:", upgradeSuggestion);
      console.log("Original build:", originalBuild);
    }
  }, [upgradeSuggestion, originalBuild]);

  // Build a quick category->upgrade map
  const priorityMap = useMemo(() => {
    if (!upgradeSuggestion?.priorityUpgrades) return {};
    const m = {};
    for (const up of upgradeSuggestion.priorityUpgrades) {
      if (up && up.category) {
        const category = up.category.toLowerCase();
        m[category] = up; // Just store the upgrade, we'll handle RAM separately
      }
    }
    return m;
  }, [upgradeSuggestion]);

  const alternativesMap = useMemo(
    () => upgradeSuggestion?.alternatives || {},
    [upgradeSuggestion]
  );

  useEffect(() => {
    if (priorityMap) {
      setSelectedUpgrades(priorityMap);
    }
  }, [priorityMap]);

  // Get all RAM parts from the original build
  const getOriginalRamParts = useCallback(() => {
    if (!originalBuild) return [];
    return Object.entries(originalBuild)
      .filter(([key, value]) => key.startsWith("ram_slot_") && value)
      .map(([_, part]) => part);
  }, [originalBuild]);

  // Get all selected parts for the summary
  const newParts = useMemo(() => {
    if (!selectedUpgrades) return [];
    // We filter by part.id to ensure we only have actual parts
    return Object.values(selectedUpgrades).filter((part) => part && part.id);
  }, [selectedUpgrades]);

  // Calculate cost of new parts based on selection
  useEffect(() => {
    const total = newParts.reduce((sum, upgrade) => {
      return sum + (Number(upgrade?.price) || 0);
    }, 0);
    setCostNewParts(total);
  }, [newParts]);

  if (!upgradeSuggestion || !originalBuild) {
    return (
      <div className="min-h-screen bg-[#100C16] text-gray-100">
        <Navabar />
        <div className="pt-40 text-center">
          <h1 className="text-2xl font-bold mb-4">No upgrade data found.</h1>
          <Link
            to="/upgrade"
            className="px-6 py-2 bg-purple-600 text-white rounded-md"
          >
            Go to Upgrade Page
          </Link>
        </div>
      </div>
    );
  }

  // Get RAM parts for display
  const originalRamParts = getOriginalRamParts();

  return (
    <div className="min-h-screen bg-[#100C16] text-gray-100">
      <Navabar />
      <div className="pt-20 md:pt-24">
        <div className="p-4 sm:p-6 md:p-8 max-w-screen-2xl mx-auto">
          <div className="mb-4">
            <Link
              to="/upgrade"
              className="text-sm text-purple-400 hover:text-purple-300 flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Upgrade
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            <div className="lg:w-[calc(66.666%-1rem)]">
              {componentCategories.map((cat) => {
                const isRam = cat.key === "ram";
                const existingPart = isRam
                  ? originalRamParts
                  : originalBuild?.[cat.key] || null;

                return (
                  <UpgradeCategoryRow
                    key={cat.key}
                    category={cat}
                    existingPart={existingPart}
                    priorityUpgrade={priorityMap[cat.key] || null}
                    alternatives={alternativesMap[cat.key] || []}
                    selectedUpgrade={selectedUpgrades[cat.key]}
                    onSelectUpgrade={handleSelectUpgrade}
                  />
                );
              })}
            </div>

            {/* Right Column - Summary */}
            <div className="lg:w-[33.333%] lg:sticky top-24 self-start">
              <div className="bg-[#1A1325] p-5 rounded-lg shadow-xl">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Upgrade Summary
                </h2>

                <div className="space-y-4">
                  <div className="p-3 bg-purple-900/40 rounded-md">
                    <p className="text-sm text-gray-300 mb-1">
                      Total Cost of New Parts
                    </p>
                    <p className="text-2xl font-bold text-purple-300">
                      ₹{costNewParts.toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-300 mb-2">
                      New Parts ({newParts.length})
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {newParts.map((part, index) => (
                        <div
                          key={`new-part-${index}`}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-300 truncate pr-2">
                            {part.name}
                          </span>
                          <span className="text-purple-300 whitespace-nowrap">
                            ₹{Number(part.price).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                      {newParts.length === 0 && (
                        <p className="text-xs text-gray-500">
                          No new parts selected
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      // Handle save build
                      console.log("Saving build...");
                    }}
                    className="w-full py-2.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium"
                  >
                    Save This Build
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
