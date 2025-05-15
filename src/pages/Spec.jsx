// src/pages/Spec.jsx (or SpecsListPage.jsx)
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { fetchProducts } from "../services/apiService";
import PartCard from "../components/PartCard";
import FiltersSidebar from "../components/FiltersSidebar";
import Navabar from "../components/Navabar";

const ratingCriteria = {
  "5star": (rate) => rate >= 4.5,
  "4star": (rate) => rate >= 3.5 && rate < 4.5,
  "3star": (rate) => rate >= 2.5 && rate < 3.5,
  "2star": (rate) => rate >= 1.5 && rate < 2.5,
  "1star": (rate) => rate > 0 && rate < 1.5,
};

export default function SpecsListPage() {
  const [allProducts, setAllProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("components");

  const [selectedRatingFilters, setSelectedRatingFilters] = useState([]);
  const [selectedBrandFilters, setSelectedBrandFilters] = useState([]);
  const [selectedSocketFilters, setSelectedSocketFilters] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // <-- New state for search term

  useEffect(() => {
    if (activeTab === "components") {
      const loadProducts = async () => {
        const categoryToFetch = "cpu";
        try {
          setIsLoading(true);
          setError(null);
          const data = await fetchProducts(categoryToFetch);
          if (Array.isArray(data)) {
            setAllProducts(data);
          } else {
            setAllProducts([]);
          }
        } catch (err) {
          setError(err.message || `Failed to fetch ${categoryToFetch}.`);
          setAllProducts([]);
        } finally {
          setIsLoading(false);
        }
      };
      loadProducts();
    } else {
      setIsLoading(false);
    }
  }, [activeTab]);

  const handleRatingFilterChange = useCallback((newSelectedRatings) => {
    setSelectedRatingFilters(newSelectedRatings);
  }, []);

  const handleBrandFilterChange = useCallback((newSelectedBrands) => {
    setSelectedBrandFilters(newSelectedBrands);
  }, []);

  const handleSocketFilterChange = useCallback((newSelectedSockets) => {
    setSelectedSocketFilters(newSelectedSockets);
  }, []);

  // NEW: Memoized handler for search term changes
  const handleSearchTermChange = useCallback((newTerm) => {
    setSearchTerm(newTerm.toLowerCase()); // Store in lowercase for case-insensitive search
  }, []);

  const filteredProducts = useMemo(() => {
    let productsToFilter = [...allProducts];

    // Apply Search Filter FIRST
    if (searchTerm) {
      productsToFilter = productsToFilter.filter((product) => {
        const nameMatch =
          product.name && product.name.toLowerCase().includes(searchTerm);
        const brandMatch =
          product.brand && product.brand.toLowerCase().includes(searchTerm);
        const socketMatch =
          product.specs &&
          product.specs.socket &&
          product.specs.socket.toLowerCase().includes(searchTerm);
        // Example: also search in cores
        const coresMatch =
          product.specs &&
          product.specs.cores &&
          product.specs.cores.toLowerCase().includes(searchTerm);

        return nameMatch || brandMatch || socketMatch || coresMatch; // Add more fields as needed
      });
    }

    // Then apply checkbox filters
    if (selectedBrandFilters && selectedBrandFilters.length > 0) {
      productsToFilter = productsToFilter.filter(
        (product) =>
          product.brand && selectedBrandFilters.includes(product.brand)
      );
    }
    if (selectedSocketFilters && selectedSocketFilters.length > 0) {
      productsToFilter = productsToFilter.filter(
        (product) =>
          product.specs &&
          product.specs.socket &&
          selectedSocketFilters.includes(product.specs.socket)
      );
    }
    if (selectedRatingFilters && selectedRatingFilters.length > 0) {
      productsToFilter = productsToFilter.filter((product) => {
        if (!product.rating || typeof product.rating.rate !== "number") {
          return false;
        }
        return selectedRatingFilters.some((filterId) => {
          const criterion = ratingCriteria[filterId];
          return criterion ? criterion(product.rating.rate) : false;
        });
      });
    }

    return productsToFilter;
  }, [
    allProducts,
    searchTerm,
    selectedBrandFilters,
    selectedRatingFilters,
    selectedSocketFilters,
  ]); // Add searchTerm to dependencies

  const renderComponentsContent = () => {
    if (isLoading && allProducts.length === 0) {
      /* ... loading ... */
    }
    if (error) {
      /* ... error ... */
    }

    return (
      <div className="flex flex-col md:flex-row md:space-x-6 lg:space-x-8">
        <div className="w-full md:w-auto md:flex-shrink-0 mb-6 md:mb-0">
          <FiltersSidebar
            onRatingFilterChange={handleRatingFilterChange}
            onBrandFilterChange={handleBrandFilterChange}
            onSocketFilterChange={handleSocketFilterChange}
            onSearchTermChange={handleSearchTermChange} // <-- Pass new search handler
          />
        </div>
        <main className="flex-grow">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <PartCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-[#1A1325] rounded-lg">
              <p className="text-center text-gray-400">
                {isLoading
                  ? "Loading..."
                  : "No products match your current filters or none found."}
              </p>
            </div>
          )}
        </main>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#100C16] text-gray-100 pt-16">
      <Navabar />
      <div className="p-4 sm:p-6 md:p-8">
        {/* ... Tabs ... */}
        <div className="mb-6 sm:mb-8 flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab("components")}
            className={`py-2.5 px-4 sm:py-3 sm:px-6 -mb-px text-sm sm:text-base font-medium focus:outline-none transition-colors duration-150 ${
              activeTab === "components"
                ? "border-b-2 border-purple-500 text-purple-400"
                : "text-gray-500 hover:text-gray-300 hover:border-gray-500 border-b-2 border-transparent"
            }`}
          >
            Components list
          </button>
          <button
            onClick={() => setActiveTab("compare")}
            className={`py-2.5 px-4 sm:py-3 sm:px-6 -mb-px text-sm sm:text-base font-medium focus:outline-none transition-colors duration-150 ${
              activeTab === "compare"
                ? "border-b-2 border-purple-500 text-purple-400"
                : "text-gray-500 hover:text-gray-300 hover:border-gray-500 border-b-2 border-transparent"
            }`}
          >
            Compare
          </button>
        </div>
        {activeTab === "components" && renderComponentsContent()}
        {activeTab === "compare" && (
          <div className="text-center py-20 bg-[#1A1325] rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-300">
              Compare Feature
            </h2>
            <p className="text-gray-400 mt-2">This section is coming soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
