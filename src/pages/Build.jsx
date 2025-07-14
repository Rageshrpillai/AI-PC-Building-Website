// src/pages/Builds.jsx

import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchPrebuilds } from "../services/apiService";
import BuildCard from "../components/BuildCard";
import FiltersSidebar from "../components/FiltersSidebar";
import Navabar from "../components/Navabar";

// --- Icon Components (Preserved) ---
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
  // --- Local State for Filters and Search (Preserved) ---
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    priceRange: { min: 0, max: 500000 },
    brands: [],
    ratings: [],
    sockets: [],
    formFactors: [],
  });

  // --- Data Fetching with TanStack Query ---
  const {
    data: prebuilds, // The data from the API is the array itself
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["prebuilds"],
    queryFn: fetchPrebuilds,
  });

  // --- Filter and Search Handlers (Preserved) ---
  const handleFilterChange = (key, value) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
  };
  const handleSearch = (event) => setSearchTerm(event.target.value);

  // --- CORRECTED Client-Side Filtering Logic ---
  const buildsToShow = useMemo(() => {
    // Here's the fix: We use `prebuilds` directly, which is the array.
    const allBuilds = prebuilds || [];

    if (!allBuilds.length) return [];

    let filteredBuilds = allBuilds.filter((b) => b.isOfficial);

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredBuilds = filteredBuilds.filter(
        (build) =>
          build.name.toLowerCase().includes(searchLower) ||
          build.description.toLowerCase().includes(searchLower)
      );
    }

    if (activeFilters.priceRange) {
      filteredBuilds = filteredBuilds.filter(
        (build) =>
          build.price >= activeFilters.priceRange.min &&
          build.price <= activeFilters.priceRange.max
      );
    }

    if (activeFilters.ratings?.length) {
      filteredBuilds = filteredBuilds.filter((build) =>
        activeFilters.ratings.some((ratingId) => {
          const minRating = parseInt(ratingId, 10);
          return build.rating >= minRating;
        })
      );
    }

    return filteredBuilds;
  }, [prebuilds, searchTerm, activeFilters]);

  // --- Loading and Error State UI (Preserved) ---
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
  if (error) {
    return (
      <div className="bg-[#100C16] min-h-screen">
        <Navabar />
        <div className="w-full flex justify-center items-center pt-24">
          <div className="text-center max-w-lg mx-auto p-6 bg-red-900/20 rounded-lg">
            <p className="text-red-400 text-lg mb-4">
              Error loading prebuilt PCs
            </p>
            <p className="text-gray-400 text-sm mb-4">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Full Page Render (Preserved and Corrected) ---
  return (
    <div className="bg-[#100C16] min-h-screen">
      <Navabar />
      <div className="w-full flex flex-col lg:flex-row px-6 md:px-10 lg:px-12 pt-24 pb-8 gap-8">
        <aside className="hidden lg:block w-full lg:w-64 xl:w-72 flex-shrink-0">
          <FiltersSidebar
            currentCategory="prebuilt"
            availableProducts={prebuilds || []} // Pass the correct array
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
          />
        </aside>
        <main className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div className="w-full md:w-auto md:flex-grow md:max-w-xs">
              <input
                className="w-full rounded-md px-4 py-2.5 text-base bg-[#20182C] text-white placeholder-[#7E6C99] border border-transparent outline-none transition-all focus:ring-2 focus:ring-[#A084FD] shadow-sm"
                placeholder="Search prebuilt PCs"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center sm:justify-items-start gap-x-6 gap-y-10">
            {buildsToShow.length > 0 ? (
              buildsToShow.map((build) => (
                <BuildCard key={build.id || build._id} build={build} />
              ))
            ) : (
              <div className="col-span-full h-64 flex justify-center items-center">
                <p className="text-gray-400 text-lg">
                  {searchTerm
                    ? "No prebuilt PCs match your search."
                    : "No prebuilt PCs found."}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
