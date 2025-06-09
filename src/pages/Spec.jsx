// src/pages/Spec.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchProducts } from "../services/apiService";
import useProductStore from "../stores/productStore";
import Navabar from "../components/Navabar";
import FiltersSidebar from "../components/FiltersSidebar";
import PartCard from "../components/PartCard";
import CompareView from "../components/CompareView";

const CATEGORIES = [
  { key: "all", name: "All components" },
  { key: "cpu", name: "CPU" },
  { key: "gpu", name: "GPU" },
  { key: "ram", name: "RAM" },
  { key: "motherboard", name: "Motherboard" },
  { key: "storage", name: "Storage" },
  { key: "psu", name: "PSU" },
  { key: "case", name: "Case" },
  { key: "cooler", name: "Cooler" },
];
const DEFAULT_COMPARE_CATEGORY = "cpu";
const DEFAULT_CATEGORY_KEY = "all";

export default function SpecsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  const selectingFor = queryParams.get("selectingFor");
  const categoryFromUrl = queryParams.get("category");
  const originPage = queryParams.get("origin") || "/build";
  const motherboardId = queryParams.get("motherboardId");

  // --- Get motherboard info either from URL param or store ---
  const getProductById = useProductStore((s) => s.getProductById);
  const storeHasFetched = useProductStore((s) => s.hasFetchedInitialData);
  const selectedMotherboardForBuild = useProductStore(
    (s) => s.selectedComponents["motherboard"]
  );

  // Use motherboard from URL param if available, otherwise from store
  const motherboardForRamCheck = useMemo(() => {
    if (motherboardId) {
      return getProductById(motherboardId);
    }
    return selectedMotherboardForBuild;
  }, [motherboardId, selectedMotherboardForBuild, getProductById]);

  const [currentDisplayCategory, setCurrentDisplayCategory] = useState(
    categoryFromUrl || DEFAULT_CATEGORY_KEY
  );
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("components");

  const initialFiltersState = useMemo(
    () => ({
      brands: [],
      ratings: [],
      sockets: [],
      formFactors: [],
      ramTypes: [],
      ramCapacities: [],
      storageTypes: [],
      storageCapacities: [],
      psuEfficiencies: [],
      psuModulars: [],
      caseTypes: [],
      caseSidePanels: [],
      priceRange: { min: 0, max: 500000 },
    }),
    []
  );
  const [filters, setFilters] = useState(initialFiltersState);

  useEffect(() => {
    const newCategory = queryParams.get("category") || DEFAULT_CATEGORY_KEY;
    if (newCategory !== currentDisplayCategory) {
      setCurrentDisplayCategory(newCategory);
      setFilters(initialFiltersState);
      setSearchTerm("");
    }
    if (selectingFor && activeTab !== "components") {
      setActiveTab("components");
    }
  }, [
    queryParams,
    currentDisplayCategory,
    initialFiltersState,
    selectingFor,
    activeTab,
  ]);

  useEffect(() => {
    const loadProducts = async () => {
      if (!currentDisplayCategory) {
        setIsLoading(false);
        return;
      }

      if (
        currentDisplayCategory === "ram" &&
        selectingFor &&
        !storeHasFetched
      ) {
        setIsLoading(true);
        return;
      }

      let fetchKey = currentDisplayCategory;
      if (currentDisplayCategory === "cooler") fetchKey = "psu";

      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchProducts(fetchKey);
        let processedData = Array.isArray(data) ? data : [];

        if (currentDisplayCategory === "ram" && selectingFor) {
          if (
            motherboardForRamCheck &&
            motherboardForRamCheck.specs?.memoryType
          ) {
            const moboMemoryType = motherboardForRamCheck.specs.memoryType;
            processedData = processedData.filter(
              (ram) => ram.specs?.type === moboMemoryType
            );
          } else {
            processedData = [];
          }
        }
        setProducts(processedData);
      } catch (err) {
        setError(err.message || `Failed to fetch ${currentDisplayCategory}.`);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [
    currentDisplayCategory,
    storeHasFetched,
    motherboardForRamCheck,
    selectingFor,
  ]);

  const handleSelectPartForBuild = useCallback(
    (part) => {
      if (selectingFor && part) {
        console.log('[Spec] Selecting part:', part);
        console.log('[Spec] For category:', selectingFor);
        console.log('[Spec] Origin page:', originPage);
        
        const state = {
          selectedComponent: part,
          categoryName: selectingFor
        };
        
        console.log('[Spec] Navigating with state:', state);
        navigate(originPage, { state });
      }
    },
    [navigate, selectingFor, originPage]
  );

  const handleCategoryChange = useCallback(
    (categoryKey) => {
      let targetUrl = `/spec?category=${categoryKey}`;
      if (selectingFor) {
        targetUrl += `&selectingFor=${encodeURIComponent(selectingFor)}`;
      }
      if (originPage) {
        targetUrl += `&origin=${originPage}`;
      }
      navigate(targetUrl);
    },
    [navigate, selectingFor, originPage]
  );

  const filteredProducts = useMemo(() => {
    let productsToFilter = [...products];
    
    if (filters.priceRange) {
      productsToFilter = productsToFilter.filter(
        (p) => p.price && p.price <= filters.priceRange.max
      );
    }

    if (activeTab === "components" && searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      productsToFilter = productsToFilter.filter(
        (p) =>
          p.name?.toLowerCase().includes(lowerSearchTerm) ||
          p.brand?.toLowerCase().includes(lowerSearchTerm)
      );
    }

    if (filters.brands.length > 0) {
      productsToFilter = productsToFilter.filter(
        (p) => p.brand && filters.brands.includes(p.brand)
      );
    }
    if (filters.sockets.length > 0) {
      productsToFilter = productsToFilter.filter(
        (p) => p.specs?.socket && filters.sockets.includes(p.specs.socket)
      );
    }
    if (filters.formFactors.length > 0) {
      productsToFilter = productsToFilter.filter(
        (p) =>
          p.specs?.formFactor &&
          filters.formFactors.includes(p.specs.formFactor)
      );
    }
    if (filters.ramTypes.length > 0) {
      productsToFilter = productsToFilter.filter(
        (p) => p.specs?.type && filters.ramTypes.includes(p.specs.type)
      );
    }
    if (filters.ramCapacities.length > 0) {
      productsToFilter = productsToFilter.filter(
        (p) =>
          p.specs?.capacity && filters.ramCapacities.includes(p.specs.capacity)
      );
    }
    if (filters.storageTypes.length > 0) {
      productsToFilter = productsToFilter.filter(
        (p) => p.specs?.type && filters.storageTypes.includes(p.specs.type)
      );
    }
    if (filters.storageCapacities.length > 0) {
      productsToFilter = productsToFilter.filter(
        (p) =>
          p.specs?.capacity &&
          filters.storageCapacities.includes(p.specs.capacity)
      );
    }
    if (filters.psuEfficiencies.length > 0) {
      productsToFilter = productsToFilter.filter(
        (p) =>
          p.specs?.efficiencyRating &&
          filters.psuEfficiencies.includes(p.specs.efficiencyRating)
      );
    }
    if (filters.psuModulars.length > 0) {
      productsToFilter = productsToFilter.filter(
        (p) => p.specs?.modular && filters.psuModulars.includes(p.specs.modular)
      );
    }
    if (filters.caseTypes.length > 0) {
      productsToFilter = productsToFilter.filter(
        (p) => p.specs?.type && filters.caseTypes.includes(p.specs.type)
      );
    }
    if (filters.caseSidePanels.length > 0) {
      productsToFilter = productsToFilter.filter(
        (p) =>
          p.specs?.sidePanel &&
          filters.caseSidePanels.includes(p.specs.sidePanel)
      );
    }
    if (filters.ratings.length > 0) {
      productsToFilter = productsToFilter.filter((p) => {
        if (!p.rating?.rate) return false;
        const productRating = Math.floor(p.rating.rate);
        return filters.ratings.some(
          (rating) => Math.floor(parseFloat(rating)) === productRating
        );
      });
    }

    return productsToFilter;
  }, [products, searchTerm, activeTab, filters]);

  const handleFilterChange = useCallback((filterType, newValues) => {
    setFilters((prev) => ({ ...prev, [filterType]: newValues }));
  }, []);
  const handleTabChange = useCallback(
    (tab) => {
      if (selectingFor && tab === "compare") {
        return;
      }
      setActiveTab(tab);
      if (tab === "compare" && currentDisplayCategory === "all") {
        handleCategoryChange(DEFAULT_COMPARE_CATEGORY);
      }
    },
    [currentDisplayCategory, selectingFor, handleCategoryChange]
  );

  const renderComponentsContent = () => (
    <div className="flex flex-col md:flex-row md:space-x-6 lg:space-x-8">
      <div className="w-full md:w-72 md:flex-shrink-0 mb-6 md:mb-0">
        <FiltersSidebar
          currentCategory={currentDisplayCategory}
          availableProducts={products}
          activeFilters={filters}
          onFilterChange={handleFilterChange}
        />
      </div>
      <main className="flex-grow">
        {isLoading && (
          <div className="text-center py-10 text-gray-300">
            Loading components...
          </div>
        )}
        {!isLoading && error && (
          <div className="text-center py-10 text-red-400">Error: {error}</div>
        )}
        {!isLoading && !error && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {filteredProducts.map((p) => (
              <PartCard
                key={p.id}
                product={p}
                isSelectionMode={!!selectingFor}
                onSelectForBuild={handleSelectPartForBuild}
              />
            ))}
          </div>
        )}
        {!isLoading && !error && filteredProducts.length === 0 && (
          <div className="flex items-center justify-center h-64 bg-[#1A1325] rounded-lg">
            <p className="text-center text-gray-400">
              {currentDisplayCategory === "ram" &&
              selectingFor &&
              !motherboardForRamCheck
                ? "Please select a motherboard in your build to see compatible RAM."
                : "No products found for this category or your filters."}
            </p>
          </div>
        )}
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#100C16] text-gray-100 pt-16">
      <Navabar />
      <div className="p-4 sm:p-6 md:p-8 max-w-screen-2xl mx-auto">
        {selectingFor && (
          <div className="mb-4 p-3 bg-purple-900/50 border border-purple-700 rounded-md text-center">
            <p className="text-sm text-purple-300">
              You are selecting a{" "}
              <strong>
                {CATEGORIES.find((c) => c.key === currentDisplayCategory)
                  ?.name || currentDisplayCategory.toUpperCase()}
              </strong>{" "}
              for the <strong>{selectingFor}</strong> slot.
            </p>
          </div>
        )}
        <div className="mb-6 sm:mb-8 flex border-b border-gray-700">
          <button
            onClick={() => handleTabChange("components")}
            className={`py-3 px-6 -mb-px font-medium focus:outline-none transition-colors ${
              activeTab === "components"
                ? "border-b-2 border-purple-500 text-purple-400"
                : "text-gray-500 hover:text-gray-300 border-b-2 border-transparent"
            }`}
          >
            Components list
          </button>
          <button
            onClick={() => handleTabChange("compare")}
            disabled={!!selectingFor}
            className={`py-3 px-6 -mb-px font-medium focus:outline-none transition-colors ${
              activeTab === "compare"
                ? "border-b-2 border-purple-500 text-purple-400"
                : "text-gray-500 hover:text-gray-300 border-b-2 border-transparent"
            } ${!!selectingFor ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Compare
          </button>
        </div>
        <div className="mb-8 flex items-center flex-wrap gap-4">
          <div className="relative flex-grow min-w-[300px]">
            <svg
              className="w-5 h-5 text-gray-500 absolute top-1/2 left-4 -translate-y-1/2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder={
                activeTab === "compare"
                  ? "Search is disabled"
                  : "Search by item name or brand..."
              }
              className={`w-full pl-12 pr-4 py-2.5 rounded-md bg-[#1A1325] border border-gray-700 placeholder-gray-500 text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500 ${
                activeTab === "compare" ? "opacity-50 cursor-not-allowed" : ""
              }`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={activeTab === "compare"}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map((cat) => {
              const isCurrentlySelecting = !!selectingFor;
              const baseCategoryOfSelection = selectingFor
                ? selectingFor.toLowerCase().includes("ram")
                  ? "ram"
                  : CATEGORIES.find((c) => c.name === selectingFor)?.key ||
                    selectingFor.toLowerCase()
                : null;
              let isDisabled = false;
              if (isCurrentlySelecting && cat.key !== "all") {
                if (cat.key !== baseCategoryOfSelection) {
                  isDisabled = true;
                }
              } else if (activeTab === "compare" && cat.key === "all") {
                isDisabled = true;
              }
              return (
                <button
                  key={cat.key}
                  onClick={() => handleCategoryChange(cat.key)}
                  disabled={isDisabled}
                  className={`px-4 py-2.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 ${
                    currentDisplayCategory === cat.key
                      ? "bg-purple-600 text-white"
                      : "bg-[#282333] text-gray-300 hover:bg-[#3a3347]"
                  } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
            {activeTab === "components" ? (
              renderComponentsContent()
            ) : (
              <CompareView
                key={currentDisplayCategory}
                products={products}
                isLoading={isLoading}
              />
            )}
      </div>
    </div>
  );
}
