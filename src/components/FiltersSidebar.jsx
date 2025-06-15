// src/components/FiltersSidebar.jsx
import React, { useState, useMemo, useEffect } from "react";

// --- CONFIGURATION ---
const ITEMS_TO_SHOW_INITIALLY = 5;
const initialRatingsData = [
  { id: "5star", name: "★★★★★ & up" },
  { id: "4star", name: "★★★★☆ & up" },
  { id: "3star", name: "★★★☆☆ & up" },
  { id: "2star", name: "★★☆☆☆ & up" },
];

// Defines which filters appear for each category
const categoryFilterConfig = {
  all: ["manufacturer", "price", "rating"],
  cpu: ["manufacturer", "socket", "price", "rating"],
  gpu: ["manufacturer", "price", "rating"],
  motherboard: ["manufacturer", "socket", "formFactor", "price", "rating"],
  ram: ["manufacturer", "ramType", "ramCapacity", "price", "rating"],
  storage: [
    "manufacturer",
    "storageType",
    "storageCapacity",
    "price",
    "rating",
  ],
  psu: ["manufacturer", "psuEfficiency", "psuModular", "price", "rating"],
  case: ["manufacturer", "caseType", "caseSidePanel", "price", "rating"],
  cooler: ["manufacturer", "price", "rating"],
};

// --- REUSABLE SUB-COMPONENTS ---
const FilterSection = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(true);
  if (!React.Children.count(children)) {
    return null;
  }
  return (
    <div className="space-y-1 border-b border-gray-700 pb-4 last:border-b-0">
      <button
        onClick={() => setIsOpen((p) => !p)}
        className="flex items-center justify-between w-full py-2 text-left focus:outline-none"
      >
        <h3 className="text-sm font-semibold uppercase text-gray-400 tracking-wider">
          {title}
        </h3>
        <span
          className={`text-purple-400 transform transition-transform text-xs ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>
      {isOpen && <div className="animate-fadeIn pt-1">{children}</div>}
    </div>
  );
};

const FilterCheckbox = ({ id, label, checked, onChange }) => (
  <label
    htmlFor={id}
    className="flex items-center space-x-2 cursor-pointer group"
  >
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-purple-500 focus:ring-purple-600 focus:ring-offset-0 focus:ring-1"
    />
    <span className="text-sm text-gray-300 group-hover:text-purple-300">
      {label}
    </span>
  </label>
);

const CheckboxFilterGroup = ({
  options,
  selectedValues,
  onSelectionChange,
}) => {
  const [showAll, setShowAll] = useState(false);
  const displayedOptions = showAll
    ? options ?? []
    : (options ?? []).slice(0, ITEMS_TO_SHOW_INITIALLY);

  const handleCheckboxChange = (value) => {
    const newSelection = (selectedValues ?? []).includes(value)
      ? (selectedValues ?? []).filter((v) => v !== value)
      : [...(selectedValues ?? []), value];
    onSelectionChange(newSelection);
  };

  if (!(options ?? []).length) {
    return (
      <p className="text-xs text-gray-500 italic">No options available.</p>
    );
  }

  return (
    <div className="space-y-2 pt-2">
      {(displayedOptions ?? []).map((option) => (
        <FilterCheckbox
          key={option.id}
          id={option.id}
          label={option.name}
          checked={(selectedValues ?? []).includes(option.name)}
          onChange={() => handleCheckboxChange(option.name)}
        />
      ))}
      {(options ?? []).length > ITEMS_TO_SHOW_INITIALLY && (
        <button
          onClick={() => setShowAll((p) => !p)}
          className="text-xs text-purple-400 hover:text-purple-300 mt-2 focus:outline-none"
        >
          {showAll
            ? "Show less"
            : `Show more (${(options ?? []).length - ITEMS_TO_SHOW_INITIALLY})`}
        </button>
      )}
    </div>
  );
};

const PriceRangeFilter = ({
  products,
  onPriceChange,
  activePriceRange = { min: 0, max: 500000 },
}) => {
  const [minPrice, maxPrice] = useMemo(() => {
    if (!products || !products.length) return [0, 500000];
    const prices = (products ?? []).map((p) => Number(p.price) || 0);
    return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))];
  }, [products]);

  const [currentValue, setCurrentValue] = useState(
    activePriceRange?.max || maxPrice
  );

  useEffect(() => {
    if (activePriceRange?.max > maxPrice) {
      setCurrentValue(maxPrice);
      onPriceChange?.({ min: minPrice, max: maxPrice });
    }
  }, [maxPrice, activePriceRange?.max, minPrice, onPriceChange]);

  const handleSliderChange = (e) => {
    const newMaxPrice = Number(e.target.value);
    setCurrentValue(newMaxPrice);
    onPriceChange?.({ min: minPrice, max: newMaxPrice });
  };

  if (maxPrice <= minPrice) return null;

  return (
    <div className="space-y-3 pt-2">
      <div className="flex justify-between text-xs text-gray-400">
        <span>₹{minPrice.toLocaleString("en-IN")}</span>
        <span>₹{maxPrice.toLocaleString("en-IN")}</span>
      </div>
      <input
        type="range"
        min={minPrice}
        max={maxPrice}
        value={currentValue}
        onChange={handleSliderChange}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-thumb:bg-purple-500"
      />
      <div className="text-center text-sm font-semibold text-white">
        Up to:{" "}
        <span className="text-purple-400">
          ₹{currentValue.toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  );
};

// --- MAIN SIDEBAR COMPONENT ---
export default function FiltersSidebar({
  currentCategory,
  availableProducts = [],
  activeFilters = {},
  onFilterChange = () => {},
}) {
  const filterOptions = useMemo(() => {
    const products = Array.isArray(availableProducts) ? availableProducts : [];
    const getUniqueValues = (keyExtractor) =>
      [...new Set((products ?? []).map(keyExtractor).filter(Boolean))]
        .sort((a, b) =>
          String(a).localeCompare(String(b), undefined, { numeric: true })
        )
        .map((name) => ({
          id: String(name)
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\w-]+/g, ""),
          name: String(name),
        }));

    return {
      manufacturer: getUniqueValues((p) => p.brand),
      socket: getUniqueValues((p) => p.specs?.socket),
      formFactor: getUniqueValues((p) => p.specs?.formFactor),
      rating: initialRatingsData,
      ramType: getUniqueValues((p) => p.specs?.type),
      ramCapacity: getUniqueValues((p) => p.specs?.capacity),
      storageType: getUniqueValues((p) => p.specs?.type),
      storageCapacity: getUniqueValues((p) => p.specs?.capacity),
      psuEfficiency: getUniqueValues((p) => p.specs?.efficiencyRating),
      psuModular: getUniqueValues((p) => p.specs?.modular),
      caseType: getUniqueValues((p) => p.specs?.type),
      caseSidePanel: getUniqueValues((p) => p.specs?.sidePanel),
    };
  }, [availableProducts]);

  const activeFilterKeys =
    categoryFilterConfig[currentCategory] || categoryFilterConfig["all"];

  return (
    <aside className="w-full md:w-72 bg-[#100C16] p-6 rounded-lg text-gray-300 space-y-6">
      {activeFilterKeys.includes("price") && (
        <FilterSection title="Price Range">
          <PriceRangeFilter
            products={availableProducts ?? []}
            activePriceRange={
              activeFilters.priceRange || { min: 0, max: 500000 }
            }
            onPriceChange={(newRange) => onFilterChange("priceRange", newRange)}
          />
        </FilterSection>
      )}
      {activeFilterKeys.includes("manufacturer") && (
        <FilterSection title="Manufacturer">
          <CheckboxFilterGroup
            options={filterOptions.manufacturer ?? []}
            selectedValues={activeFilters.brands ?? []}
            onSelectionChange={(v) => onFilterChange("brands", v)}
          />
        </FilterSection>
      )}
      {activeFilterKeys.includes("socket") && (
        <FilterSection title="Socket">
          <CheckboxFilterGroup
            options={filterOptions.socket ?? []}
            selectedValues={activeFilters.sockets ?? []}
            onSelectionChange={(v) => onFilterChange("sockets", v)}
          />
        </FilterSection>
      )}
      {activeFilterKeys.includes("formFactor") && (
        <FilterSection title="Form Factor">
          <CheckboxFilterGroup
            options={filterOptions.formFactor ?? []}
            selectedValues={activeFilters.formFactors ?? []}
            onSelectionChange={(v) => onFilterChange("formFactors", v)}
          />
        </FilterSection>
      )}
      {activeFilterKeys.includes("ramType") && (
        <FilterSection title="RAM Type">
          <CheckboxFilterGroup
            options={filterOptions.ramType ?? []}
            selectedValues={activeFilters.ramTypes ?? []}
            onSelectionChange={(v) => onFilterChange("ramTypes", v)}
          />
        </FilterSection>
      )}
      {activeFilterKeys.includes("ramCapacity") && (
        <FilterSection title="RAM Capacity">
          <CheckboxFilterGroup
            options={filterOptions.ramCapacity ?? []}
            selectedValues={activeFilters.ramCapacities ?? []}
            onSelectionChange={(v) => onFilterChange("ramCapacities", v)}
          />
        </FilterSection>
      )}
      {activeFilterKeys.includes("storageType") && (
        <FilterSection title="Storage Type">
          <CheckboxFilterGroup
            options={filterOptions.storageType ?? []}
            selectedValues={activeFilters.storageTypes ?? []}
            onSelectionChange={(v) => onFilterChange("storageTypes", v)}
          />
        </FilterSection>
      )}
      {activeFilterKeys.includes("storageCapacity") && (
        <FilterSection title="Storage Capacity">
          <CheckboxFilterGroup
            options={filterOptions.storageCapacity ?? []}
            selectedValues={activeFilters.storageCapacities ?? []}
            onSelectionChange={(v) => onFilterChange("storageCapacities", v)}
          />
        </FilterSection>
      )}
      {activeFilterKeys.includes("psuEfficiency") && (
        <FilterSection title="PSU Efficiency">
          <CheckboxFilterGroup
            options={filterOptions.psuEfficiency ?? []}
            selectedValues={activeFilters.psuEfficiencies ?? []}
            onSelectionChange={(v) => onFilterChange("psuEfficiencies", v)}
          />
        </FilterSection>
      )}
      {activeFilterKeys.includes("psuModular") && (
        <FilterSection title="PSU Modular Type">
          <CheckboxFilterGroup
            options={filterOptions.psuModular ?? []}
            selectedValues={activeFilters.psuModulars ?? []}
            onSelectionChange={(v) => onFilterChange("psuModulars", v)}
          />
        </FilterSection>
      )}
      {activeFilterKeys.includes("caseType") && (
        <FilterSection title="Case Type">
          <CheckboxFilterGroup
            options={filterOptions.caseType ?? []}
            selectedValues={activeFilters.caseTypes ?? []}
            onSelectionChange={(v) => onFilterChange("caseTypes", v)}
          />
        </FilterSection>
      )}
      {activeFilterKeys.includes("caseSidePanel") && (
        <FilterSection title="Case Side Panel">
          <CheckboxFilterGroup
            options={filterOptions.caseSidePanel ?? []}
            selectedValues={activeFilters.caseSidePanels ?? []}
            onSelectionChange={(v) => onFilterChange("caseSidePanels", v)}
          />
        </FilterSection>
      )}
      {activeFilterKeys.includes("rating") && (
        <FilterSection title="Rating">
          <CheckboxFilterGroup
            options={filterOptions.rating ?? []}
            selectedValues={(activeFilters.ratings ?? [])
              .map((id) => initialRatingsData.find((r) => r.id === id)?.name)
              .filter(Boolean)}
            onSelectionChange={(names) =>
              onFilterChange(
                "ratings",
                (names ?? [])
                  .map(
                    (name) =>
                      initialRatingsData.find((r) => r.name === name)?.id
                  )
                  .filter(Boolean)
              )
            }
          />
        </FilterSection>
      )}
    </aside>
  );
}
