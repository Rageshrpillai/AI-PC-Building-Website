// src/pages/UpgradeInputPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useProductStore from "../stores/productStore";
import Navabar from "../components/Navabar";
import SelectionCard from "../components/SelectionCard";
import ComponentSearch from "../components/ComponentSearch";

const CURRENT_RIG_CATEGORIES = [
  { key: "cpu", name: "CPU", actualCategory: "cpu" },
  { key: "motherboard", name: "Motherboard", actualCategory: "motherboard" },
  { key: "ram", name: "RAM", actualCategory: "ram", isMultiSlot: true },
  { key: "gpu", name: "GPU", actualCategory: "gpu" },
  { key: "storage", name: "Storage", actualCategory: "storage" },
  { key: "psu", name: "PSU", actualCategory: "psu" },
  { key: "case", name: "Case", actualCategory: "case" },
];

const validateRamCompatibility = (ramPart, motherboard) => {
  if (!motherboard || !ramPart) return true;
  const moboMemoryType = motherboard.specs?.memoryType?.toLowerCase();
  const ramMemoryType = ramPart.specs?.type?.toLowerCase();
  if (!moboMemoryType || !ramMemoryType) return true;
  return moboMemoryType === ramMemoryType;
};

export default function UpgradeInputPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // FIXED: Using individual, memoized selectors for stability
  const getProductById = useProductStore(
    useCallback((s) => s.getProductById, [])
  );
  const hasFetchedInitialData = useProductStore((s) => s.hasFetchedInitialData);
  const isLoadingStoreProducts = useProductStore((s) => s.isLoading);

  const [currentUserRig, setCurrentUserRig] = useState({});
  const [upgradeBudget, setUpgradeBudget] = useState("");
  const [upgradeGoals, setUpgradeGoals] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const selectedMotherboard = useMemo(
    () => currentUserRig["Motherboard"],
    [currentUserRig]
  );

  const numberOfRamSlots = useMemo(
    () =>
      selectedMotherboard?.specs?.memorySlots
        ? parseInt(selectedMotherboard.specs.memorySlots, 10)
        : 2,
    [selectedMotherboard]
  );

  // *** FIXED: Consolidated and corrected useEffect to handle selections from SpecPage ***
  useEffect(() => {
    const { newlySelectedPartId, targetCategoryName, origin } =
      location.state || {};

    if (newlySelectedPartId && targetCategoryName && origin === "/upgrade") {
      const part = getProductById(newlySelectedPartId);

      if (part) {
        // Use the updater function for setState. This gives us access to the previous state (`prevRig`)
        // without needing to include `currentUserRig` in the dependency array, which breaks the infinite loop.
        setCurrentUserRig((prevRig) => {
          if (part.category === "motherboard") {
            const incompatibleRamSlots = Object.entries(prevRig)
              .filter(
                ([key, ramPart]) =>
                  key.startsWith("RAM Slot") &&
                  !validateRamCompatibility(ramPart, part)
              )
              .map(([key]) => key);

            if (incompatibleRamSlots.length > 0) {
              const shouldProceed = window.confirm(
                `Warning: The selected motherboard (${
                  part.name
                }) is not compatible with the RAM in ${incompatibleRamSlots.join(
                  ", "
                )}. Incompatible RAM will be removed if you proceed. Continue?`
              );

              if (shouldProceed) {
                const newRig = { ...prevRig };
                incompatibleRamSlots.forEach(
                  (slotKey) => delete newRig[slotKey]
                );
                newRig[targetCategoryName] = part;
                return newRig;
              } else {
                return prevRig; // User cancelled, do not change state
              }
            }
          }
          // For all other components, or for a motherboard with no conflicts:
          return { ...prevRig, [targetCategoryName]: part };
        });
      }

      // Clear location.state to prevent this from re-running on other renders.
      navigate("/upgrade", { replace: true, state: {} });
    }
    // This dependency array is now correct and stable.
  }, [location.state, getProductById, navigate]);

  const handleRemoveComponent = useCallback((categoryOrSlotName) => {
    setCurrentUserRig((prevRig) => {
      const newRig = { ...prevRig };
      delete newRig[categoryOrSlotName];
      if (categoryOrSlotName === "Motherboard") {
        Object.keys(newRig).forEach((key) => {
          if (key.startsWith("RAM Slot")) delete newRig[key];
        });
      }
      return newRig;
    });
  }, []);

  const handlePartSelectedFromSearch = useCallback(
    (part) => {
      if (!part?.category) return;
      const categoryConfig = CURRENT_RIG_CATEGORIES.find(
        (c) => c.actualCategory === part.category
      );
      if (!categoryConfig) return;

      if (
        part.category === "ram" &&
        selectedMotherboard &&
        !validateRamCompatibility(part, selectedMotherboard)
      ) {
        alert(
          `This RAM (${part.name}) is not compatible with your selected motherboard's memory type (${selectedMotherboard.specs.memoryType}).`
        );
        return;
      }

      let targetSlot;
      if (categoryConfig.isMultiSlot) {
        // Handle RAM
        for (let i = 1; i <= numberOfRamSlots; i++) {
          const slotName = `RAM Slot ${i}`;
          if (!currentUserRig[slotName]) {
            targetSlot = slotName;
            break;
          }
        }
        if (!targetSlot) targetSlot = "RAM Slot 1";
      } else {
        targetSlot = categoryConfig.name;
      }

      setCurrentUserRig((prevRig) => ({ ...prevRig, [targetSlot]: part }));
    },
    [currentUserRig, numberOfRamSlots, selectedMotherboard]
  );

  const handleSubmitForUpgrade = useCallback(
    async (e) => {
      e.preventDefault();
      if (Object.keys(currentUserRig).length === 0) {
        alert("Please select at least one component from your current rig.");
        return;
      }
      if (
        !upgradeBudget ||
        isNaN(Number(upgradeBudget)) ||
        Number(upgradeBudget) <= 0
      ) {
        alert("Please enter a valid numerical budget for your upgrade.");
        return;
      }
      if (!upgradeGoals.trim()) {
        alert("Please describe your upgrade goals.");
        return;
      }
      setIsSubmitting(true);
      setError(null);
      try {
        const currentUserPartsPayload = { ramIds: [] };
        Object.entries(currentUserRig).forEach(([key, part]) => {
          if (part?.id) {
            if (key.startsWith("RAM Slot")) {
              currentUserPartsPayload.ramIds.push(part.id);
            } else {
              const idKey = `${part.category?.toLowerCase()}Id`;
              if (idKey) currentUserPartsPayload[idKey] = part.id;
            }
          }
        });
        const response = await fetch("/api/buildbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestType: "upgrade",
            currentUserParts: currentUserPartsPayload,
            upgradeBudget: Number(upgradeBudget),
            message: upgradeGoals,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            data.reply || data.error || "Failed to get suggestion."
          );
        }
        navigate("/build", {
          state: { upgradeSuggestion: data, fromUpgradeFlow: true },
        });
      } catch (err) {
        setError(err.message || "An unknown error occurred.");
        console.error("Upgrade submission failed:", err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentUserRig, upgradeBudget, upgradeGoals, navigate]
  );

  const handleSelectClick = useCallback(
    (slotIdentifier, componentType) => {
      navigate(
        `/spec?category=${componentType}&selectingFor=${encodeURIComponent(
          slotIdentifier
        )}&origin=/upgrade`
      );
    },
    [navigate]
  );

  // Loading and Error UI
  if (!hasFetchedInitialData || isLoadingStoreProducts) {
    return (
      <div className="min-h-screen bg-[#100C16] flex flex-col justify-center items-center text-white">
        <Navabar />
        <div className="flex flex-col items-center pt-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-xl">Loading Component Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#100C16] text-gray-100">
      <Navabar />
      <div className="pt-20 md:pt-24">
        <div className="p-4 sm:p-6 md:p-8 max-w-screen-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              Upgrade Your Rig
            </h1>
            <p className="text-gray-400">
              Select your current components, and we'll analyze your setup to
              recommend the best possible upgrade.
            </p>
          </div>
          <ComponentSearch onPartSelected={handlePartSelectedFromSearch} />
          <form onSubmit={handleSubmitForUpgrade}>
            <h2 className="text-xl font-semibold text-gray-200 mb-4">
              Your Current Components
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {CURRENT_RIG_CATEGORIES.map((category) => {
                if (category.isMultiSlot) {
                  // Special handling for RAM
                  return Array.from({ length: numberOfRamSlots }).map(
                    (_, index) => {
                      const slotName = `RAM Slot ${index + 1}`;
                      return (
                        <div key={slotName} className="flex flex-col">
                          <label className="text-sm font-semibold text-gray-300 mb-2">
                            {slotName}
                          </label>
                          <SelectionCard
                            part={currentUserRig[slotName]}
                            onSelect={() => handleSelectClick(slotName, "ram")}
                            onRemove={() => handleRemoveComponent(slotName)}
                            emptySlotLabel={`Select RAM for Slot ${index + 1}`}
                            isDisabled={!selectedMotherboard}
                          />
                        </div>
                      );
                    }
                  );
                }
                return (
                  // For single-slot categories
                  <div key={category.key} className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-300 mb-2">
                      {category.name}
                    </label>
                    <SelectionCard
                      part={currentUserRig[category.name]}
                      onSelect={() =>
                        handleSelectClick(
                          category.name,
                          category.actualCategory
                        )
                      }
                      onRemove={() => handleRemoveComponent(category.name)}
                      emptySlotLabel={`Select Your ${category.name}`}
                    />
                  </div>
                );
              })}
            </div>
            <h2 className="text-xl font-semibold text-gray-200 mb-4">
              Your Upgrade Goals
            </h2>
            <div className="bg-[#1A1325] p-6 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div>
                <label
                  htmlFor="upgradeGoals"
                  className="block text-sm font-semibold text-gray-200 mb-2"
                >
                  Describe what you want to achieve
                </label>
                <textarea
                  id="upgradeGoals"
                  value={upgradeGoals}
                  onChange={(e) => setUpgradeGoals(e.target.value)}
                  placeholder="e.g., I want to play new games at 1440p..."
                  className="w-full px-4 py-2 rounded-md bg-[#100C16] border border-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  rows="3"
                  required
                />
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow">
                  <label
                    htmlFor="upgradeBudget"
                    className="block text-sm font-semibold text-gray-200 mb-2"
                  >
                    Upgrade Budget ($)
                  </label>
                  <input
                    type="number"
                    id="upgradeBudget"
                    value={upgradeBudget}
                    onChange={(e) => setUpgradeBudget(e.target.value)}
                    placeholder="e.g., 500"
                    className="w-full px-4 py-2 rounded-md bg-[#100C16] border border-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-2 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-wait transition-colors h-fit self-end"
                >
                  {isSubmitting ? "Analyzing..." : "Get Upgrade Suggestions"}
                </button>
              </div>
              {error && (
                <p className="text-red-400 text-sm mt-2 md:col-span-2">
                  {error}
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
