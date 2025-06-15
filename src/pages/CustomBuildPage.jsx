// src/pages/CustomBuildPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import useProductStore from "../stores/productStore";
import Navabar from "../components/Navabar";
import ComponentCategoryRow from "../components/ComponentCategoryRow";

const BASE_COMPONENT_CATEGORIES = [
  { key: "cpu", name: "CPU", actualCategory: "cpu", hasQuickPicks: true },
  {
    key: "motherboard",
    name: "Motherboard",
    actualCategory: "motherboard",
    hasQuickPicks: true,
  },
  { key: "ram", name: "RAM", actualCategory: "ram", hasQuickPicks: false }, // RAM uses a different selection UI
  { key: "gpu", name: "GPU", actualCategory: "gpu", hasQuickPicks: true },
  {
    key: "storage",
    name: "Storage",
    actualCategory: "storage",
    hasQuickPicks: true,
  },
  { key: "psu", name: "PSU", actualCategory: "psu", hasQuickPicks: true },

  {
    key: "cooler",
    name: "Cooler",
    actualCategory: "cooler",
    hasQuickPicks: true,
  },
  { key: "case", name: "Case", actualCategory: "case", hasQuickPicks: true },
];

const MAX_QUICK_PICKS_DISPLAY = 5;

export default function CustomBuildPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Zustand Store Hooks
  const {
    getProductById,
    isLoading: isLoadingStoreProducts,
    error: storeError,
    hasFetchedInitialData,
    selectedComponents,
    selectComponent,
    removeComponent: storeRemoveComponent,
    clearAllComponents,
    allProducts,
  } = useProductStore((s) => s);

  const selectedMotherboardFromStore = selectedComponents["Motherboard"];

  // Local State
  const [buildName, setBuildName] = useState("");
  const [buildDescription, setBuildDescription] = useState("");

  // Set default values only if they haven't been set
  useEffect(() => {
    if (!buildName) setBuildName("My Custom Build");
    if (!buildDescription)
      setBuildDescription(
        "A collection of selected components for a custom PC build."
      );
  }, []);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isProcessingSelection, setIsProcessingSelection] = useState(false);
  const [processingError, setProcessingError] = useState(null);
  const [upgradeData, setUpgradeData] = useState(null);

  // This effect calculates total price whenever the selections change
  useEffect(() => {
    const sum = Object.values(selectedComponents).reduce(
      (acc, comp) => acc + (comp?.price ? Number(comp.price) : 0),
      0
    );
    setTotalPrice(sum);
  }, [selectedComponents]);

  // Derives the category structure based on the currently selected motherboard in the store
  const dynamicComponentCategoryObjects = useMemo(() => {
    return BASE_COMPONENT_CATEGORIES.map((cat) => {
      if (cat.key === "ram") {
        const numberOfRamSlots = selectedMotherboardFromStore?.specs
          ?.memorySlots
          ? parseInt(selectedMotherboardFromStore.specs.memorySlots, 10)
          : 2; // Default to 2 slots if no motherboard
        return {
          ...cat,
          isMultiSlot: true,
          numberOfSlots: Math.max(1, numberOfRamSlots || 1),
          isDisabled: !selectedMotherboardFromStore,
        };
      }
      return cat;
    });
  }, [selectedMotherboardFromStore]);

  // Prepares the list of items for the quick pick UI
  const quickPickData = useMemo(() => {
    if (!allProducts || allProducts.length === 0 || !hasFetchedInitialData)
      return {};
    const picks = {};
    dynamicComponentCategoryObjects.forEach((cat) => {
      if (cat.hasQuickPicks && cat.key !== "ram") {
        const currentSelectionId = selectedComponents[cat.name]?.id;
        picks[cat.name] = allProducts
          .filter(
            (p) =>
              p.category === cat.actualCategory && p.id !== currentSelectionId
          )
          .slice(0, MAX_QUICK_PICKS_DISPLAY);
      } else {
        picks[cat.name] = [];
      }
    });
    return picks;
  }, [
    allProducts,
    dynamicComponentCategoryObjects,
    selectedComponents,
    hasFetchedInitialData,
  ]);

  // Handles incoming upgrade suggestions from UpgradeInputPage
  useEffect(() => {
    const { upgradeSuggestion, fromUpgradeFlow } = location.state || {};
    if (fromUpgradeFlow && upgradeSuggestion?.parts) {
      setIsProcessingSelection(true);
      setUpgradeData(upgradeSuggestion);
      clearAllComponents();
      const newSelections = {};

      upgradeSuggestion.parts.forEach((partItem) => {
        const part = partItem.selectedPart;
        if (!part) return;
        if (part.category === "ram") {
          const nextSlotIndex =
            Object.keys(newSelections).filter((k) => k.startsWith("RAM Slot"))
              .length + 1;
          const slotName = `RAM Slot ${nextSlotIndex}`;
          newSelections[slotName] = part;
        } else {
          const categoryConfig = BASE_COMPONENT_CATEGORIES.find(
            (c) => c.actualCategory === part.category
          );
          if (categoryConfig) newSelections[categoryConfig.name] = part;
        }
      });
      Object.entries(newSelections).forEach(([slot, part]) =>
        selectComponent(slot, part)
      );
      setBuildName(upgradeSuggestion.buildName || "My Upgraded Build");
      setBuildDescription(upgradeSuggestion.reply || "AI Recommended Upgrade.");

      navigate(location.pathname, { replace: true, state: {} });
      setTimeout(() => setIsProcessingSelection(false), 200);
    }
  }, [location.state, navigate, clearAllComponents, selectComponent]);

  // Parse URL parameters for deep linking
  useEffect(() => {
    const handleDeepLink = async () => {
      try {
        const queryParams = new URLSearchParams(location.search);
        const partsParam = queryParams.get("parts");

        if (partsParam && hasFetchedInitialData && allProducts?.length > 0) {
          setIsProcessingSelection(true);
          setProcessingError(null);

          const partIds = partsParam.split(",").filter(Boolean);
          await clearAllComponents();

          const ramParts = [];
          const otherComponents = [];

          // First pass: separate RAM and other components
          partIds.forEach((id) => {
            const part = allProducts.find((p) => p.id === id);
            if (part) {
              if (part.category === "ram") {
                // Push each RAM part individually, even if identical
                ramParts.push(part);
              } else {
                const categoryConfig = BASE_COMPONENT_CATEGORIES.find(
                  (c) => c.actualCategory === part.category
                );
                if (categoryConfig) {
                  otherComponents.push({
                    part,
                    categoryName: categoryConfig.name,
                  });
                }
              }
            }
          });

          // Second pass: add non-RAM components first
          for (const { part, categoryName } of otherComponents) {
            await selectComponent(categoryName, part);
          }

          // Add RAM parts to sequential slots
          for (let i = 0; i < ramParts.length; i++) {
            const slotNumber = i + 1;
            await selectComponent(`RAM Slot ${slotNumber}`, ramParts[i]);
          }

          // Clear the URL parameters after processing
          navigate(location.pathname, { replace: true });
        }
      } catch (error) {
        console.error("Error processing deep link:", error);
        setProcessingError(error.message);
      } finally {
        setIsProcessingSelection(false);
      }
    };

    handleDeepLink();
  }, [
    location.search,
    hasFetchedInitialData,
    allProducts,
    clearAllComponents,
    selectComponent,
    navigate,
  ]);

  // Wrapper for removing a component to use the processing flag
  const handleUIRemoveComponent = useCallback(
    (categoryOrSlotName) => {
      if (isProcessingSelection) return;
      setIsProcessingSelection(true);
      storeRemoveComponent(categoryOrSlotName);
      setTimeout(() => setIsProcessingSelection(false), 150);
    },
    [storeRemoveComponent, isProcessingSelection]
  );

  // Handler for selecting an item from either the quick pick list or the Spec page
  const handleSelectComponent = useCallback(
    (categoryOrSlotName, partToSelect) => {
      console.log("[CustomBuildPage] handleSelectComponent called");
      console.log("[CustomBuildPage] location.state:", location.state);

      if (isProcessingSelection) {
        console.log(
          "[CustomBuildPage] Processing selection in progress, returning"
        );
        return;
      }

      setIsProcessingSelection(true);
      console.log("[CustomBuildPage] Set processing to true");

      try {
        // If we received a direct part selection from state
        if (location.state?.selectedComponent && location.state?.categoryName) {
          console.log(
            "[CustomBuildPage] Found component in state, selecting:",
            {
              category: location.state.categoryName,
              component: location.state.selectedComponent,
            }
          );

          selectComponent(
            location.state.categoryName,
            location.state.selectedComponent
          );

          requestAnimationFrame(() => {
            console.log("[CustomBuildPage] Clearing navigation state");
            navigate(location.pathname, { replace: true, state: {} });
          });
        }
        // Handle normal selection (from quick picks)
        else if (categoryOrSlotName && partToSelect) {
          console.log("[CustomBuildPage] Quick pick selection:", {
            category: categoryOrSlotName,
            component: partToSelect,
          });
          selectComponent(categoryOrSlotName, partToSelect);
        }

        // If we are in an upgrade context, update the local data as well
        if (upgradeData) {
          setUpgradeData((prev) => {
            if (!prev) return null;
            const newParts = prev.parts.map((p) => {
              const partCategoryName = BASE_COMPONENT_CATEGORIES.find(
                (c) => c.key === p.category
              )?.name;
              if (partCategoryName === categoryOrSlotName) {
                return { ...p, selectedPart: partToSelect };
              }
              return p;
            });
            return { ...prev, parts: newParts };
          });
        }
      } catch (error) {
        console.error(
          "[CustomBuildPage] Error in handleSelectComponent:",
          error
        );
      } finally {
        console.log("[CustomBuildPage] Selection processing complete");
        setTimeout(() => {
          setIsProcessingSelection(false);
          console.log("[CustomBuildPage] Processing flag cleared");
        }, 150);
      }
    },
    [location.state, navigate, selectComponent, upgradeData]
  );

  // Other handlers
  const handleSaveBuild = useCallback(() => {
    console.log("Save Build clicked");
  }, []);
  const handleCancelBuild = useCallback(() => {
    clearAllComponents();
    setBuildName("My Custom Build");
    navigate("/build", { replace: true });
  }, [clearAllComponents, navigate]);

  // Effect to handle component selection from Spec page
  useEffect(() => {
    console.log("[CustomBuildPage] Location state changed:", location.state);

    if (location.state?.selectedComponent && location.state?.categoryName) {
      console.log(
        "[CustomBuildPage] Processing component selection from navigation"
      );

      if (!isProcessingSelection) {
        setIsProcessingSelection(true);

        try {
          console.log("[CustomBuildPage] Selecting component:", {
            category: location.state.categoryName,
            component: location.state.selectedComponent,
          });

          selectComponent(
            location.state.categoryName,
            location.state.selectedComponent
          );
        } finally {
          // Clear the navigation state
          requestAnimationFrame(() => {
            navigate(location.pathname, { replace: true, state: {} });
          });

          // Reset processing flag
          setTimeout(() => {
            setIsProcessingSelection(false);
          }, 150);
        }
      }
    }
  }, [location.state, navigate, selectComponent, isProcessingSelection]);

  // Error display
  if (processingError) {
    return (
      <div className="min-h-screen bg-[#100C16] text-red-400 flex justify-center items-center">
        <p>Error: {processingError}</p>
      </div>
    );
  }

  // Loading display - only show for initial load, not for component selection
  if (!hasFetchedInitialData || isLoadingStoreProducts) {
    return (
      <div className="min-h-screen bg-[#100C16] text-white flex justify-center items-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#100C16] text-gray-100">
      <Navabar />
      <div className="pt-20 md:pt-24">
        <div className="p-4 sm:p-6 md:p-8 max-w-screen-2xl mx-auto">
          <div className="mb-4">
            <Link
              to={upgradeData ? "/upgrade" : "/"}
              className="text-sm text-purple-400 hover:text-purple-300"
            >
              &lt; Back to {upgradeData ? "Upgrade Input" : "Home"}
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            <div className="lg:w-[calc(66.666%-1rem)]">
              {dynamicComponentCategoryObjects.map((category) => {
                const isRamCategory = category.key === "ram";
                const upgradeInfoForCategory = upgradeData?.parts.find(
                  (p) => p.category === category.key
                );

                return (
                  <ComponentCategoryRow
                    key={category.key}
                    categoryName={category.name}
                    categoryKeyForSpecsPage={category.actualCategory}
                    status={upgradeInfoForCategory?.status}
                    alternativeParts={upgradeInfoForCategory?.alternativeParts}
                    onSelectComponent={handleSelectComponent}
                    onRemoveSelected={handleUIRemoveComponent}
                    quickPickItems={quickPickData[category.name]}
                    showQuickPicksForThisCategory={category.hasQuickPicks}
                    isMultiSlot={isRamCategory}
                    numberOfSlots={isRamCategory ? category.numberOfSlots : 1}
                    selectedRamSlots={
                      isRamCategory
                        ? Object.fromEntries(
                            Object.entries(selectedComponents).filter(([key]) =>
                              key.startsWith("RAM Slot")
                            )
                          )
                        : undefined
                    }
                    selectedComponent={
                      !isRamCategory
                        ? selectedComponents[category.name]
                        : undefined
                    }
                    selectingForCustomNamePrefix={category.name}
                    isDisabled={isRamCategory && !selectedMotherboardFromStore}
                  />
                );
              })}
            </div>
            <div className="lg:w-[calc(33.333%-1rem)] lg:sticky top-24 self-start">
              <div className="bg-[#1A1325] p-5 rounded-lg shadow-xl">
                <input
                  type="text"
                  value={buildName}
                  onChange={(e) => setBuildName(e.target.value)}
                  className="text-2xl font-semibold text-white mb-2 bg-transparent outline-none focus:outline-none w-full"
                  placeholder="Enter Build Name"
                />
                <textarea
                  value={buildDescription}
                  onChange={(e) => setBuildDescription(e.target.value)}
                  className="text-sm text-gray-400 mb-4 bg-transparent outline-none focus:outline-none w-full resize-none"
                  placeholder="Enter build description"
                  rows="2"
                />

                <div className="space-y-4">
                  {upgradeData && (
                    <div className="mb-4 p-3 bg-purple-900/40 rounded-md">
                      <p className="flex justify-between text-lg font-semibold">
                        <span className="text-purple-300">
                          Cost of New Parts:
                        </span>
                        <span className="text-white">
                          ${upgradeData.totalCost.toFixed(2)}
                        </span>
                      </p>
                    </div>
                  )}
                  <div className="space-y-1 mb-5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                    <h3 className="text-sm font-semibold text-gray-200 mb-2 sticky top-0 bg-[#1A1325] py-1">
                      SELECTED COMPONENTS
                    </h3>
                    {Object.keys(selectedComponents).length === 0 ? (
                      <p className="text-xs text-gray-500 italic py-2">
                        No components selected yet.
                      </p>
                    ) : (
                      Object.entries(selectedComponents).map(
                        ([slotName, component]) => {
                          if (!component) return null;
                          return (
                            <div
                              key={slotName}
                              className="flex justify-between items-center text-xs py-1.5 border-b border-gray-800/50 group"
                            >
                              <div className="flex-grow truncate pr-2">
                                <span className="text-gray-400 block text-[10px] uppercase tracking-wider">
                                  {slotName}
                                </span>
                                <span className="text-gray-200 font-medium truncate block">
                                  {component.name}
                                </span>
                              </div>
                              <span className="text-gray-300 font-medium whitespace-nowrap px-2">
                                ₹
                                {Number(component.price)?.toLocaleString(
                                  "en-IN"
                                )}
                              </span>
                              <button
                                onClick={() =>
                                  handleUIRemoveComponent(slotName)
                                }
                                className="text-red-500 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity text-lg p-1"
                                title={`Remove ${slotName}`}
                              >
                                ✕
                              </button>
                            </div>
                          );
                        }
                      )
                    )}
                  </div>
                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-gray-300">
                        {upgradeData
                          ? "Total Final Build Value:"
                          : "Total Price:"}
                      </span>
                      <span className="text-2xl font-bold text-purple-400">
                        ₹{totalPrice.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleCancelBuild}
                        className="flex-1 py-2.5 px-4 rounded-md text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
                      >
                        Clear
                      </button>
                      <button
                        onClick={handleSaveBuild}
                        className="flex-1 py-2.5 px-4 rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                      >
                        Save Build
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
