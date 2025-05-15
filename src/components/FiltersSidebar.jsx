// src/components/FiltersSidebar.jsx
import React, { useState, useEffect } from "react";

// Data for filters (ensure these are the ones you're currently using)
const initialManufacturersData = [
  { id: "intel", name: "Intel", checked: false },
  { id: "amd", name: "AMD", checked: false },
];

const initialRatingsData = [
  { id: "5star", label: "★★★★★", checked: false },
  { id: "4star", label: "★★★★☆", checked: false },
  { id: "3star", label: "★★★☆☆", checked: false },
  { id: "2star", label: "★★☆☆☆", checked: false },
  { id: "1star", label: "★☆☆☆☆", checked: false },
];

const initialSocketData = [
  { id: "lga1700", name: "LGA1700", checked: false },
  { id: "am5", name: "AM5", checked: false },
];

const FilterCheckbox = ({ id, label, checked, onChange, count }) => (
  <label
    htmlFor={id}
    className="flex items-center space-x-2 cursor-pointer hover:text-purple-300"
  >
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-purple-500 focus:ring-purple-600 focus:ring-offset-gray-800"
    />
    <span className="text-sm">{label}</span>
    {count !== undefined && (
      <span className="text-xs text-gray-500">({count})</span>
    )}
  </label>
);

export default function FiltersSidebar({
  onBrandFilterChange,
  onRatingFilterChange,
  onSocketFilterChange,
  onSearchTermChange, // <-- New prop for search term callback
}) {
  const [openSections, setOpenSections] = useState({
    merchants: false,
    manufacturer: true,
    socket: true,
    rating: true,
  });

  const [manufacturers, setManufacturers] = useState(initialManufacturersData);
  const [ratings, setRatings] = useState(initialRatingsData);
  const [sockets, setSockets] = useState(initialSocketData);
  const [localSearchInput, setLocalSearchInput] = useState(""); // State for the search input field's value

  // Effect for Brand Changes
  useEffect(() => {
    if (onBrandFilterChange) {
      const selectedBrandNames = manufacturers
        .filter((m) => m.checked)
        .map((m) => m.name);
      onBrandFilterChange(selectedBrandNames);
    }
  }, [manufacturers, onBrandFilterChange]);

  // Effect for Rating Changes
  useEffect(() => {
    if (onRatingFilterChange) {
      const selectedRatingIds = ratings
        .filter((r) => r.checked)
        .map((r) => r.id);
      onRatingFilterChange(selectedRatingIds);
    }
  }, [ratings, onRatingFilterChange]);

  // Effect for Socket Changes
  useEffect(() => {
    if (onSocketFilterChange) {
      const selectedSocketNames = sockets
        .filter((s) => s.checked)
        .map((s) => s.name);
      onSocketFilterChange(selectedSocketNames);
    }
  }, [sockets, onSocketFilterChange]);

  const handleToggleSection = (sectionName) => {
    setOpenSections((prev) => ({ ...prev, [sectionName]: !prev[sectionName] }));
  };

  const handleManufacturerChange = (manufacturerId) => {
    setManufacturers((prev) =>
      prev.map((m) =>
        m.id === manufacturerId ? { ...m, checked: !m.checked } : m
      )
    );
  };

  const handleRatingChange = (ratingId) => {
    setRatings((prev) =>
      prev.map((r) => (r.id === ratingId ? { ...r, checked: !r.checked } : r))
    );
  };

  const handleSocketChange = (socketId) => {
    setSockets((prevSockets) =>
      prevSockets.map((s) =>
        s.id === socketId ? { ...s, checked: !s.checked } : s
      )
    );
  };

  // Handler for search input change
  const handleSearchInputChange = (event) => {
    const newTerm = event.target.value;
    setLocalSearchInput(newTerm); // Update local input state
    if (onSearchTermChange) {
      onSearchTermChange(newTerm); // Call the handler passed from parent
    }
  };

  function renderFilterSection(sectionName, title, children) {
    const isOpen = openSections[sectionName];
    return (
      <div className="space-y-1 border-b border-gray-700 pb-4 last:border-b-0 last:pb-0">
        <button
          onClick={() => handleToggleSection(sectionName)}
          className="flex items-center justify-between w-full py-2 text-left focus:outline-none"
        >
          <h3 className="text-sm font-semibold uppercase text-gray-400 tracking-wider">
            {title}
          </h3>
          <span className="text-purple-400 transform transition-transform duration-200">
            {isOpen ? "▼" : "►"}
          </span>
        </button>
        {isOpen && <div className="animate-fadeIn pt-1">{children}</div>}
      </div>
    );
  }

  return (
    <aside className="w-full md:w-72 bg-[#1A1325] p-6 rounded-lg text-gray-300 space-y-6">
      {/* Search Input */}
      <div>
        <input
          type="text"
          placeholder="Search components..." // Updated placeholder
          className="w-full px-4 py-2.5 rounded-md bg-[#100C16] border border-gray-700 placeholder-gray-500 text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
          value={localSearchInput}
          onChange={handleSearchInputChange}
        />
      </div>

      {renderFilterSection(
        "merchants",
        "Merchants",
        <div className="text-gray-400 text-sm pt-2">
          <p>Merchant filter options will appear here.</p>
        </div>
      )}

      {renderFilterSection(
        "manufacturer",
        "Manufacturer",
        <>
          <div className="space-y-2 pt-2">
            {manufacturers.map((manufacturer) => (
              <FilterCheckbox
                key={manufacturer.id}
                id={`manufacturer-${manufacturer.id}`}
                label={manufacturer.name}
                checked={manufacturer.checked}
                onChange={() => handleManufacturerChange(manufacturer.id)}
              />
            ))}
          </div>
        </>
      )}

      {renderFilterSection(
        "socket",
        "Socket",
        <>
          <div className="space-y-2 pt-2">
            {sockets.map((socket) => (
              <FilterCheckbox
                key={socket.id}
                id={`socket-${socket.id}`}
                label={socket.name}
                checked={socket.checked}
                onChange={() => handleSocketChange(socket.id)}
              />
            ))}
          </div>
        </>
      )}

      {renderFilterSection(
        "rating",
        "Rating",
        <>
          <div className="space-y-2 pt-2">
            {ratings.map((rating) => (
              <FilterCheckbox
                key={rating.id}
                id={`rating-${rating.id}`}
                label={rating.label}
                checked={rating.checked}
                onChange={() => handleRatingChange(rating.id)}
              />
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
