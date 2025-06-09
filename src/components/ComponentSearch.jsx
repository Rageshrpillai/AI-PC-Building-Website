// src/components/ComponentSearch.jsx
import React, { useState, useMemo, useRef, useEffect } from "react";
import useProductStore from "../stores/productStore";

export default function ComponentSearch({ onPartSelected }) {
  const allProducts = useProductStore((s) => s.allProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const searchContainerRef = useRef(null);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return [];
    const lowerSearchTerm = searchTerm.toLowerCase();
    return allProducts
      .filter(
        (p) =>
          p.name.toLowerCase().includes(lowerSearchTerm) ||
          p.brand.toLowerCase().includes(lowerSearchTerm)
      )
      .slice(0, 7);
  }, [searchTerm, allProducts]);

  const handleSelect = (part) => {
    onPartSelected(part);
    setSearchTerm("");
    setIsDropdownVisible(false);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setIsDropdownVisible(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchContainerRef]);

  return (
    <div className="relative w-full max-w-lg mb-8" ref={searchContainerRef}>
      <div className="relative">
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
          placeholder="Search & select components to fill slots..."
          className="w-full pl-12 pr-4 py-3 rounded-md bg-[#1A1325] border border-gray-700 placeholder-gray-500 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsDropdownVisible(true)}
        />
      </div>
      {isDropdownVisible && filteredProducts.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-[#1e1b22] border border-gray-700 rounded-lg z-10 shadow-lg max-h-80 overflow-y-auto">
          <ul>
            {filteredProducts.map((part) => (
              <li key={part.id}>
                <button
                  onClick={() => handleSelect(part)}
                  className="w-full text-left flex items-center p-3 space-x-3 hover:bg-purple-600/20"
                >
                  <img
                    src={
                      part.imageUrl ||
                      `https://placehold.co/80x60/1e1b22/FFF?text=${part.category}`
                    }
                    alt={part.name}
                    className="w-10 h-10 object-contain flex-shrink-0"
                  />
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-gray-200 truncate">
                      {part.name}
                    </p>
                    <p className="text-xs text-gray-400">{part.brand}</p>
                  </div>
                  <p className="ml-auto text-sm font-bold text-purple-400 pl-3">
                    ₹{part.price.toLocaleString("en-IN")}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
