// src/pages/CustomBuildPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import useProductStore from "../stores/productStore.js";
import Navabar from "../components/Navabar";
import ComponentCategoryRow from "../components/ComponentCategoryRow";
import SelectionCard from "../components/SelectionCard";
import { useUser, useAuth, useClerk } from "@clerk/clerk-react";
import toast, { Toaster } from "react-hot-toast";

const ArrowRightIcon = () => (
  <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);

const SaveIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7z" />
    <path
      fillRule="evenodd"
      d="M.75 6.25a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H1.5a.75.75 0 01-.75-.75v-7.5zM12 3a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h7a1 1 0 001-1V3z"
      clipRule="evenodd"
    />
  </svg>
);

const SpinnerIcon = () => (
  <svg
    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12c0-3.042 1.135-5.824 3.008-7.961l1.414 1.414A5.992 5.992 0 006 12c0 2.373.963 4.516 2.508 6.008l-1.414 1.414z"
    ></path>
  </svg>
);

const BASE_COMPONENT_CATEGORIES = [
  { key: "cpu", name: "CPU", actualCategory: "cpu", hasQuickPicks: true },
  {
    key: "motherboard",
    name: "Motherboard",
    actualCategory: "motherboard",
    hasQuickPicks: true,
  },
  { key: "ram", name: "RAM", actualCategory: "ram", hasQuickPicks: false },
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
    isLoading: isLoadingStoreProducts,
    error: storeError,
    hasFetchedInitialData,
    selectedComponents,
    selectComponent,
    removeComponent: storeRemoveComponent,
    clearAllComponents,
    allProducts,
    fetchAllProductsNoPagination,
  } = useProductStore((s) => s);

  // Clerk Hooks
  const { isSignedIn, user } = useUser();
  const { userId } = useAuth();
  const { openSignIn } = useClerk();

  // Local State
  const [buildName, setBuildName] = useState("");
  const [buildDescription, setBuildDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [upgradeData, setUpgradeData] = useState(null);
  const [processingError, setProcessingError] = useState(null);

  // NEW: Add initialization tracking
  const [isInitialized, setIsInitialized] = useState(false);

  // Set default values for build name/description
  useEffect(() => {
    if (!buildName) setBuildName("My Custom Build");
    if (!buildDescription)
      setBuildDescription(
        "A collection of selected components for a custom PC build."
      );
  }, [buildName, buildDescription]);

  // CRITICAL FIX: Wait for products to load before processing anything
  useEffect(() => {
    console.log("[CustomBuildPage] Initialization check:", {
      hasFetchedInitialData,
      productsCount: allProducts?.length,
      isInitialized,
    });

    if (!hasFetchedInitialData || !allProducts || allProducts.length === 0) {
      console.log("[CustomBuildPage] Products not loaded, fetching...");
      fetchAllProductsNoPagination?.();
    } else if (!isInitialized) {
      console.log("[CustomBuildPage] Products loaded, marking as initialized");
      setIsInitialized(true);
    }
  }, [
    hasFetchedInitialData,
    allProducts,
    fetchAllProductsNoPagination,
    isInitialized,
  ]);

  // Derived state for Motherboard selection
  const selectedMotherboardFromStore = selectedComponents["Motherboard"];

  // Derived state: details of selected components and total price
  const resolvedSelectedComponents = useMemo(() => {
    if (
      storeError ||
      isLoadingStoreProducts ||
      !allProducts ||
      allProducts.length === 0
    ) {
      return [];
    }
    const resolved = [];
    Object.entries(selectedComponents).forEach(
      ([categoryName, selectedPart]) => {
        if (selectedPart) {
          const part =
            typeof selectedPart === "object" && selectedPart.id
              ? selectedPart
              : allProducts.find((p) => p.id === selectedPart);

          if (part) {
            if (categoryName.startsWith("RAM Slot")) {
              resolved.push({ ...part, slotName: categoryName });
            } else {
              resolved.push({ ...part, categoryName: categoryName });
            }
          }
        }
      }
    );
    return resolved;
  }, [selectedComponents, allProducts, storeError, isLoadingStoreProducts]);

  const totalPrice = useMemo(() => {
    return resolvedSelectedComponents.reduce(
      (sum, part) => sum + (Number(part.price) || 0),
      0
    );
  }, [resolvedSelectedComponents]);

  // Dynamic category structure based on selected motherboard
  const dynamicComponentCategoryObjects = useMemo(() => {
    return BASE_COMPONENT_CATEGORIES.map((cat) => {
      if (cat.key === "ram") {
        const numberOfRamSlots = selectedMotherboardFromStore?.specs
          ?.memorySlots
          ? parseInt(selectedMotherboardFromStore.specs.memorySlots, 10)
          : 2;
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

  // Quick pick data
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

  // CONSOLIDATED Component Selection Handler
  const handleSelectComponent = useCallback(
    (categoryOrSlotName, partToSelect, sourceLocationState = null) => {
      console.log("[CustomBuildPage] handleSelectComponent called:", {
        categoryOrSlotName,
        partToSelect: partToSelect?.name,
      });

      let actualCategoryName = categoryOrSlotName;
      let actualPartToSelect = partToSelect;

      if (
        sourceLocationState &&
        sourceLocationState.selectedComponent &&
        sourceLocationState.categoryName
      ) {
        actualCategoryName = sourceLocationState.categoryName;
        actualPartToSelect = sourceLocationState.selectedComponent;

        // Clear navigation state
        requestAnimationFrame(() => {
          navigate(location.pathname, { replace: true, state: {} });
        });
      }

      if (!actualCategoryName || !actualPartToSelect) {
        console.warn("[CustomBuildPage] Missing category or part. Skipping.");
        return;
      }

      selectComponent(actualCategoryName, actualPartToSelect);

      if (upgradeData) {
        setUpgradeData((prev) => {
          if (!prev) return null;
          const newParts = prev.parts.map((p) => {
            const partCategoryName = BASE_COMPONENT_CATEGORIES.find(
              (c) => c.key === p.category
            )?.name;
            if (partCategoryName === actualCategoryName) {
              return { ...p, selectedPart: actualPartToSelect };
            }
            return p;
          });
          return { ...prev, parts: newParts };
        });
      }
    },
    [selectComponent, navigate, location.pathname, upgradeData]
  );

  const handleUIRemoveComponent = useCallback(
    (categoryOrSlotName) => {
      storeRemoveComponent(categoryOrSlotName);
    },
    [storeRemoveComponent]
  );

  // FIXED: Only process effects after initialization
  // Effect: Handle upgrade suggestions from navigation
  useEffect(() => {
    if (!isInitialized) {
      console.log("[CustomBuildPage] Not initialized, skipping upgrade effect");
      return;
    }

    console.log("[CustomBuildPage] Upgrade suggestion effect running");
    const { upgradeSuggestion, fromUpgradeFlow } = location.state || {};

    if (fromUpgradeFlow && upgradeSuggestion?.parts) {
      console.log("[CustomBuildPage] Processing upgrade suggestion");
      setUpgradeData(upgradeSuggestion);
      clearAllComponents();

      const newSelectionsToProcess = [];

      upgradeSuggestion.parts.forEach((partItem) => {
        const part = partItem.selectedPart;
        if (!part) return;

        if (part.category === "ram") {
          const nextSlotIndex =
            newSelectionsToProcess.filter((item) =>
              item.categoryName.startsWith("RAM Slot")
            ).length + 1;
          newSelectionsToProcess.push({
            categoryName: `RAM Slot ${nextSlotIndex}`,
            partToSelect: part,
          });
        } else {
          const categoryConfig = BASE_COMPONENT_CATEGORIES.find(
            (c) => c.actualCategory === part.category
          );
          if (categoryConfig) {
            newSelectionsToProcess.push({
              categoryName: categoryConfig.name,
              partToSelect: part,
            });
          }
        }
      });

      newSelectionsToProcess.forEach(({ categoryName, partToSelect }) => {
        handleSelectComponent(categoryName, partToSelect);
      });

      setBuildName(upgradeSuggestion.buildName || "My Upgraded Build");
      setBuildDescription(upgradeSuggestion.reply || "AI Recommended Upgrade.");

      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [
    isInitialized,
    location.state,
    navigate,
    clearAllComponents,
    handleSelectComponent,
  ]);

  // Effect: Handle single component selection from Spec page
  useEffect(() => {
    if (!isInitialized) {
      console.log(
        "[CustomBuildPage] Not initialized, skipping component selection effect"
      );
      return;
    }

    console.log("[CustomBuildPage] Component selection effect running");
    const { selectedComponent, categoryName, fromUpgradeFlow } =
      location.state || {};

    if (!fromUpgradeFlow && selectedComponent && categoryName) {
      console.log("[CustomBuildPage] Processing single component selection");
      handleSelectComponent(categoryName, selectedComponent, location.state);
    }
  }, [isInitialized, location.state, handleSelectComponent]);

  // Effect: Parse URL deep links
  useEffect(() => {
    if (!isInitialized) {
      console.log(
        "[CustomBuildPage] Not initialized, skipping deep link effect"
      );
      return;
    }

    console.log("[CustomBuildPage] Deep link effect running");
    const handleDeepLink = async () => {
      try {
        const queryParams = new URLSearchParams(location.search);
        const partsParam = queryParams.get("parts");

        if (partsParam && hasFetchedInitialData && allProducts?.length > 0) {
          console.log("[CustomBuildPage] Processing deep link");
          setProcessingError(null);

          const partIds = partsParam.split(",").filter(Boolean);
          await clearAllComponents();

          const ramParts = [];
          const otherComponents = [];

          partIds.forEach((id) => {
            const part = allProducts.find((p) => p.id === id);
            if (part) {
              if (part.category === "ram") {
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

          for (const { part, categoryName } of otherComponents) {
            handleSelectComponent(categoryName, part);
          }

          for (let i = 0; i < ramParts.length; i++) {
            const slotNumber = i + 1;
            handleSelectComponent(`RAM Slot ${slotNumber}`, ramParts[i]);
          }

          navigate(location.pathname, { replace: true });
        }
      } catch (error) {
        console.error("Error processing deep link:", error);
        setProcessingError(error.message);
      }
    };
    handleDeepLink();
  }, [
    isInitialized,
    location.search,
    hasFetchedInitialData,
    allProducts,
    clearAllComponents,
    handleSelectComponent,
    navigate,
  ]);

  const handleSaveBuild = async () => {
    if (!isSignedIn) {
      toast.error("You must be signed in to save a build.");
      openSignIn();
      return;
    }

    if (isSaving) return;

    if (!buildName.trim()) {
      toast.error("Please enter a name for your build.");
      return;
    }

    if (resolvedSelectedComponents.length === 0) {
      toast.error("Please select components for your build.");
      return;
    }

    setIsSaving(true);

    const partRefs = resolvedSelectedComponents.map((part) => ({
      id: part.id,
      category: part.category,
    }));

    const buildData = {
      buildName,
      buildDescription,
      parts: partRefs,
      totalPrice,
    };

    try {
      const response = await fetch("/api/builds/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `API call failed with status ${response.status}`
        );
      }

      const result = await response.json();
      console.log("Build saved successfully:", result.build);
      toast.success("Your custom build has been saved!");
      navigate(`/my-builds`);
      clearAllComponents();
    } catch (error) {
      console.error("Error saving build:", error);
      toast.error(error.message || "Failed to save build. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelBuild = useCallback(() => {
    clearAllComponents();
    setBuildName("My Custom Build");
    navigate("/build", { replace: true });
  }, [clearAllComponents, navigate]);

  // Error display
  if (processingError) {
    return (
      <div className="min-h-screen bg-[#100C16] text-red-400 flex justify-center items-center">
        <p>Error: {processingError}</p>
      </div>
    );
  }

  // FIXED: Better loading display
  if (!isInitialized || isLoadingStoreProducts || !hasFetchedInitialData) {
    return (
      <div className="min-h-screen bg-[#100C16] text-white">
        <Navabar />
        <div className="min-h-screen flex flex-col justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-xl">Loading components...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#100C16] text-gray-100">
      <Navabar />
      <Toaster position="top-right" reverseOrder={false} />
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
                  placeholder="Tell us about your build's purpose or features."
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
                    {resolvedSelectedComponents.length === 0 ? (
                      <p className="text-xs text-gray-500 italic py-2">
                        No components selected yet.
                      </p>
                    ) : (
                      resolvedSelectedComponents.map((component) => {
                        if (!component) return null;
                        return (
                          <div
                            key={component.id}
                            className="flex justify-between items-center text-xs py-1.5 border-b border-gray-800/50 group"
                          >
                            <div className="flex-grow truncate pr-2">
                              <span className="text-gray-400 block text-[10px] uppercase tracking-wider">
                                {component.categoryName ||
                                  component.category ||
                                  "Component"}
                              </span>
                              <span className="text-gray-200 font-medium truncate block">
                                {component.name}
                              </span>
                            </div>
                            <span className="text-gray-300 font-medium whitespace-nowrap px-2">
                              ₹
                              {Number(component.price)?.toLocaleString("en-IN")}
                            </span>
                            <button
                              onClick={() =>
                                handleUIRemoveComponent(
                                  component.slotName ||
                                    component.categoryName ||
                                    component.category
                                )
                              }
                              className="text-red-500 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity text-lg p-1"
                              title={`Remove ${component.name}`}
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })
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
                        disabled={isSaving}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium text-white transition-colors shadow-lg ${
                          isSaving
                            ? "bg-purple-800 cursor-not-allowed"
                            : "bg-purple-600 hover:bg-purple-700"
                        }`}
                      >
                        {isSaving ? (
                          <>
                            <SpinnerIcon />
                            Saving...
                          </>
                        ) : (
                          <>
                            <SaveIcon />
                            <span>Save Custom Build</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="px-8 md:px-24 py-16 bg-[#100C16] border-t border-gray-800/50 text-center text-gray-400 mt-8">
        <p>
          &copy; {new Date().getFullYear()} AI PC Builder. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
