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
  if (!motherboard || !ramPart) return true; // Cannot validate if a part is missing
  const moboMemoryType = motherboard.specs?.memoryType?.toLowerCase();
  const ramMemoryType = ramPart.specs?.type?.toLowerCase();
  if (!moboMemoryType || !ramMemoryType) return true; // Cannot validate if specs are missing
  return moboMemoryType === ramMemoryType;
};

export default function UpgradeInputPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Using Zustand store selectors
  const getProductById = useProductStore(useCallback((s) => s.getProductById, []));
  const hasFetchedInitialData = useProductStore((s) => s.hasFetchedInitialData);
  const isLoadingStoreProducts = useProductStore((s) => s.isLoading);
  const selectedComponents = useProductStore((s) => s.selectedComponents);
  const selectComponent = useProductStore((s) => s.selectComponent);
  const removeComponent = useProductStore((s) => s.removeComponent);

  const [upgradeBudget, setUpgradeBudget] = useState("");
  const [upgradeGoals, setUpgradeGoals] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const selectedMotherboard = useMemo(
    () => selectedComponents["motherboard"],
    [selectedComponents]
  );

  const numberOfRamSlots = useMemo(
    () =>
      selectedMotherboard?.specs?.memorySlots
        ? parseInt(selectedMotherboard.specs.memorySlots, 10)
        : 2, // Default to 2 slots visually if no motherboard is selected yet
    [selectedMotherboard]
  );

  // A single, robust useEffect to handle selections returning from the Spec page
  useEffect(() => {
    console.log('[UpgradeInputPage] Location state changed:', location.state);
    
    // Handle both state formats
    const { 
      selectedComponent,
      categoryName,
      newlySelectedPartId,
      targetCategoryName
    } = location.state || {};

    // Determine which format we're dealing with and extract the relevant data
    const componentToAdd = selectedComponent || (newlySelectedPartId ? getProductById(newlySelectedPartId) : null);
    const rawCategory = categoryName || targetCategoryName;

    if (componentToAdd && rawCategory && !isSubmitting) {
      console.log('[UpgradeInputPage] Processing component selection:', {
        category: rawCategory,
        component: componentToAdd
      });

      // Find the category config to get the correct key
      const categoryConfig = CURRENT_RIG_CATEGORIES.find(
        c => c.name === rawCategory || c.actualCategory === componentToAdd.category
      );

      if (!categoryConfig) {
        console.error('[UpgradeInputPage] Could not find category config for:', rawCategory);
        return;
      }

      // Use the key for storage, but keep track of the display name for logging
      const targetKey = rawCategory.startsWith('ram_slot_') ? rawCategory : categoryConfig.key;
      const displayName = categoryConfig.name;
      console.log('[UpgradeInputPage] Mapped category:', rawCategory, 'to key:', targetKey, '(display name:', displayName, ')');

      // If selecting a motherboard, check RAM compatibility
      if (componentToAdd.category === "motherboard") {
        const currentSelectedComponents = useProductStore.getState().selectedComponents;
        const incompatibleRamSlots = Object.entries(currentSelectedComponents)
          .filter(
            ([key, ramPart]) =>
              key.startsWith("ram_slot_") &&
              !validateRamCompatibility(ramPart, componentToAdd)
          )
          .map(([key]) => key);

        if (incompatibleRamSlots.length > 0) {
          const shouldProceed = window.confirm(
            `Warning: The selected motherboard (${
              componentToAdd.name
            }) is not compatible with the RAM in ${incompatibleRamSlots.join(
              ", "
            )}. Incompatible RAM will be removed if you proceed. Continue?`
          );

          if (shouldProceed) {
            // Remove incompatible RAM
            incompatibleRamSlots.forEach(slotKey => removeComponent(slotKey));
            // Add the new motherboard
            selectComponent(targetKey, componentToAdd);
          }
        } else {
          // No RAM compatibility issues, just add the motherboard
          selectComponent(targetKey, componentToAdd);
        }
      } else {
        // For all other components
        selectComponent(targetKey, componentToAdd);
      }

      // Clear the navigation state after processing
      requestAnimationFrame(() => {
        navigate(location.pathname, { replace: true, state: {} });
      });
    }
  }, [location.state, navigate, getProductById, isSubmitting, selectComponent, removeComponent]);

  const handleRemoveComponent = useCallback((categoryOrSlotName) => {
    // If it's a RAM slot, use the slot name directly
    if (categoryOrSlotName.startsWith('ram_slot_')) {
      removeComponent(categoryOrSlotName);
      return;
    }

    // Convert display name to key if needed
    const category = CURRENT_RIG_CATEGORIES.find(c => c.name === categoryOrSlotName);
    const key = category ? category.key : categoryOrSlotName.toLowerCase().replace(' ', '_');
    
    // If removing motherboard, also remove RAM
    if (key === "motherboard") {
      const currentSelectedComponents = useProductStore.getState().selectedComponents;
      Object.keys(currentSelectedComponents).forEach((k) => {
        if (k.startsWith("ram_slot_")) {
          removeComponent(k);
        }
      });
    }
    
    removeComponent(key);
  }, [removeComponent]);

  const handlePartSelectedFromSearch = useCallback(
    (part) => {
      if (!part?.category) return;

      const categoryConfig = CURRENT_RIG_CATEGORIES.find(
        (c) => c.actualCategory === part.category
      );
      if (!categoryConfig) return;

      // Validate RAM compatibility before adding
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
        // This handles RAM
        // Find the first available empty RAM slot
        const currentSelectedComponents = useProductStore.getState().selectedComponents;
        for (let i = 1; i <= numberOfRamSlots; i++) {
          const slotName = `ram_slot_${i}`;
          if (!currentSelectedComponents[slotName]) {
            targetSlot = slotName;
            break;
          }
        }
        if (!targetSlot) targetSlot = "ram_slot_1"; // Default to replacing the first stick if all are full
      } else {
        // For all other components, the target slot is just the category key
        targetSlot = categoryConfig.key;
      }

      selectComponent(targetSlot, part);
    },
    [numberOfRamSlots, selectedMotherboard, selectComponent]
  );

  const handleSubmitForUpgrade = useCallback(
    async (e) => {
      e.preventDefault();
      if (Object.keys(selectedComponents).length === 0) {
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
        Object.entries(selectedComponents).forEach(([key, part]) => {
          if (part?.id) {
            if (key.startsWith("ram_slot_")) {
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
          state: {
            upgradeSuggestion: data,
            fromUpgradeFlow: true,
          },
        });
      } catch (err) {
        setError(err.message || "An unknown error occurred.");
        console.error("Upgrade submission failed:", err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedComponents, upgradeBudget, upgradeGoals, navigate]
  );

  const handleSelectClick = useCallback(
    (slotIdentifier, componentType) => {
      // If selecting RAM, include the motherboard ID in the URL if one is selected
      let url = `/spec?category=${componentType}&selectingFor=${encodeURIComponent(slotIdentifier)}&origin=/upgrade`;
      
      if (componentType === 'ram' && selectedMotherboard) {
        url += `&motherboardId=${selectedMotherboard.id}`;
      }
      
      navigate(url);
    },
    [navigate, selectedMotherboard]
  );

  if (!hasFetchedInitialData && isLoadingStoreProducts) {
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

          <div className="relative z-20">
            <ComponentSearch onPartSelected={handlePartSelectedFromSearch} />
          </div>

          <form onSubmit={handleSubmitForUpgrade} className="relative z-10">
            <h2 className="text-xl font-semibold text-gray-200 mb-4">
              Your Current Components
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {CURRENT_RIG_CATEGORIES.map((category) => {
                if (category.isMultiSlot) {
                  // Special handling for RAM
                  return Array.from({ length: numberOfRamSlots }).map(
                    (_, index) => {
                      const slotKey = `ram_slot_${index + 1}`;
                      const slotPart = selectedComponents[slotKey];
                      return (
                        <div key={slotKey} className="flex flex-col">
                          <label className="text-sm font-semibold text-gray-300 mb-2">
                            RAM Slot {index + 1}
                          </label>
                          <SelectionCard
                            part={slotPart}
                            status={slotPart ? "selected" : "empty"}
                            onSelect={() => handleSelectClick(slotKey, "ram")}
                            onRemove={() => handleRemoveComponent(slotKey)}
                            emptySlotLabel={`Select RAM for Slot ${index + 1}`}
                            isDisabled={!selectedMotherboard}
                          />
                        </div>
                      );
                    }
                  );
                }

                const componentPart = selectedComponents[category.key];
                return (
                  // For single-slot categories
                  <div key={category.key} className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-300 mb-2">
                      {category.name}
                    </label>
                    <SelectionCard
                      part={componentPart}
                      status={componentPart ? "selected" : "empty"}
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
