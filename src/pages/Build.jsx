// src/pages/Builds.jsx
import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import BuildCard from "../components/BuildCard";
import FiltersSidebar from "../components/FiltersSidebar";
import Navabar from "../components/Navabar";
import useProductStore from "../stores/productStore";

// --- Icon Components for Action Buttons ---
const BuildIcon = () => (
  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
    <path d="M22,7.24a1,1,0,0,0-.29-.71l-4.24-4.24a1,1,0,0,0-.71-.29H7.24a1,1,0,0,0-.71.29L2.29,6.53a1,1,0,0,0-.29.71V16.76a1,1,0,0,0,.29.71l4.24,4.24a1,1,0,0,0,.71.29h9.52a1,1,0,0,0,.71-.29l4.24-4.24a1,1,0,0,0,.29-.71V7.24ZM19.59,16.05l-3.54,3.54H7.95L4.41,16.05V7.95L7.95,4.41h8.1L19.59,7.95ZM9,12h2v2H9Zm4,0h2v2H13Zm-4-4h2v2H9Zm4,0h2v2H13Z" />
  </svg>
);

const UpgradeIcon = () => (
  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
    <path d="M16,18V12h-3V10h3V4h2v6h3v2h-3v6Zm-8-4H2v2h6v5l6-5H8Z" />
  </svg>
);

export default function Builds() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    priceRange: { min: 0, max: 500000 },
    brands: [],
    ratings: [],
    sockets: [],
    formFactors: []
  });

  // Get prebuilds from store
  const prebuilds = useProductStore((state) => state.prebuilds);
  const isLoading = useProductStore((state) => state.isPrebuildsLoading);
  const error = useProductStore((state) => state.prebuildsError);
  const fetchPrebuilds = useProductStore((state) => state.fetchPrebuilds);
  const hasFetchedInitialData = useProductStore((state) => state.hasFetchedInitialData);

  // Fetch prebuilds on component mount
  useEffect(() => {
    console.log('[Build] Component mounted, hasFetchedInitialData:', hasFetchedInitialData);
    if (!hasFetchedInitialData) {
      console.log('[Build] Fetching prebuilds...');
      fetchPrebuilds();
    }
  }, [fetchPrebuilds, hasFetchedInitialData]);

  // Log prebuilds whenever they change
  useEffect(() => {
    console.log('[Build] Prebuilds updated:', prebuilds);
  }, [prebuilds]);

  const handleFilterChange = (key, value) => {
    console.log('[Build] Filter changed:', key, value);
    setActiveFilters(prev => {
      const newState = { ...prev };
      if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
        delete newState[key];
      } else {
        newState[key] = value;
      }
      return newState;
    });
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const buildsToShow = useMemo(() => {
    console.log('[Build] Calculating builds to show. Prebuilds:', prebuilds);
    if (!prebuilds?.length) {
      console.log('[Build] No prebuilds available');
      return [];
    }
    
    let filteredBuilds = [...prebuilds];
    console.log('[Build] Initial filtered builds:', filteredBuilds);

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredBuilds = filteredBuilds.filter(build => 
        build.name.toLowerCase().includes(searchLower) ||
        build.description.toLowerCase().includes(searchLower)
      );
      console.log('[Build] After search filter:', filteredBuilds);
    }

    // Apply price range filter
    if (activeFilters.priceRange) {
      filteredBuilds = filteredBuilds.filter(build =>
        build.price >= activeFilters.priceRange.min &&
        build.price <= activeFilters.priceRange.max
      );
      console.log('[Build] After price filter:', filteredBuilds);
    }

    // Apply rating filter
    if (activeFilters.ratings?.length) {
      filteredBuilds = filteredBuilds.filter(build => {
        return activeFilters.ratings.some(ratingId => {
          const minRating = parseInt(ratingId, 10);
          return build.rating >= minRating;
        });
      });
      console.log('[Build] After rating filter:', filteredBuilds);
    }

    console.log('[Build] Final builds to show:', filteredBuilds);
    return filteredBuilds;
  }, [prebuilds, searchTerm, activeFilters]);

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-[#100C16] min-h-screen">
        <Navabar />
        <div className="w-full flex justify-center items-center pt-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400 text-lg">Loading prebuilt PCs...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    console.error('[Build] Error loading prebuilds:', error);
    return (
      <div className="bg-[#100C16] min-h-screen">
        <Navabar />
        <div className="w-full flex justify-center items-center pt-24">
          <div className="text-center max-w-lg mx-auto p-6 bg-red-900/20 rounded-lg">
            <p className="text-red-400 text-lg mb-4">Error loading prebuilt PCs</p>
            <p className="text-gray-400 text-sm mb-4">{error}</p>
            <button
              onClick={() => fetchPrebuilds()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#100C16] min-h-screen">
      <Navabar />
      <div className="w-full flex flex-col lg:flex-row px-6 md:px-10 lg:px-12 pt-24 pb-8 gap-8">
        {/* Filters Sidebar */}
        <aside className="hidden lg:block w-full lg:w-64 xl:w-72 flex-shrink-0">
          <FiltersSidebar
            currentCategory="prebuilt"
            availableProducts={prebuilds}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
          />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {/* Header: Search Bar and Action Buttons */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            {/* Search Input */}
            <div className="w-full md:w-auto md:flex-grow md:max-w-xs">
              <input
                className="w-full rounded-md px-4 py-2.5 text-base bg-[#20182C] text-white placeholder-[#7E6C99] border border-transparent outline-none transition-all focus:ring-2 focus:ring-[#A084FD] shadow-sm"
                placeholder="Search prebuilt PCs"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            {/* Action Buttons */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <Link
                to="/build"
                className="flex items-center justify-center px-4 py-2.5 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 transition-colors"
              >
                <BuildIcon />
                <span>Start Custom Build</span>
              </Link>
              <Link
                to="/upgrade"
                className="flex items-center justify-center px-4 py-2.5 bg-gray-800 text-white font-semibold rounded-md border border-gray-700 hover:bg-gray-700 hover:border-purple-600 transition-colors"
              >
                <UpgradeIcon />
                <span>Upgrade</span>
              </Link>
            </div>
          </div>
          {/* Grid of Build Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center sm:justify-items-start gap-x-6 gap-y-10">
            {buildsToShow.length > 0 ? (
              buildsToShow.map((build) => {
                console.log('[Build] Rendering BuildCard for:', build);
                return <BuildCard key={build.id} build={build} />;
              })
            ) : (
              <div className="col-span-full h-64 flex justify-center items-center">
                <p className="text-gray-400 text-lg">
                  {searchTerm ? "No prebuilt PCs match your search." : "No prebuilt PCs found."}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
