// src/components/CompareView.jsx

import React, { useState, useMemo, useEffect } from "react"; // Added useEffect for logging

// --- REUSABLE SUB-COMPONENTS ---

const ComparisonSlot = ({ product, onSelectClick, onClearClick }) => {
  // This component does not need changes
  if (product) {
    return (
      <div className="relative flex flex-col items-center justify-center w-full min-h-[12rem] p-4 bg-[#1A1325] border-2 border-dashed border-gray-700 rounded-lg text-center">
        <img
          src={
            product.imageUrl ||
            "https://placehold.co/400x300/1e1b22/666666?text=No+Image"
          }
          alt={product.name}
          className="max-h-20 mb-2"
        />
        <p className="text-sm font-semibold text-gray-200">{product.name}</p>
        <p className="text-xs text-purple-400">{product.brand}</p>
        <button
          onClick={onClearClick}
          className="absolute top-2 right-2 w-6 h-6 bg-red-600/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm"
          title="Remove Component"
        >
          X
        </button>
      </div>
    );
  }
  return (
    <button
      onClick={onSelectClick}
      className="flex flex-col items-center justify-center w-full min-h-[12rem] p-4 bg-[#100C16] border-2 border-dashed border-gray-700 rounded-lg hover:border-purple-500 hover:bg-[#1A1325] transition-colors"
    >
      <span className="text-5xl text-gray-600">+</span>
      <span className="mt-2 text-sm text-gray-500">
        Search and add component to compare
      </span>
    </button>
  );
};

const ProductSearchModal = ({ isOpen, onClose, onSelectProduct, products }) => {
  const [modalSearchTerm, setModalSearchTerm] = useState("");

  // DEBUG: Log the products received by the modal
  useEffect(() => {
    if (isOpen) {
      console.log(
        "[CompareView - ProductSearchModal] Products received by modal:",
        products
      );
    }
  }, [products, isOpen]);

  const filteredProducts = useMemo(() => {
    if (!modalSearchTerm) return products;
    const lowerSearchTerm = modalSearchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(lowerSearchTerm) ||
        p.brand?.toLowerCase().includes(lowerSearchTerm) // Ensuring brand is searched here too
    );
  }, [modalSearchTerm, products]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#1A1325] rounded-lg shadow-xl w-full max-w-lg m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-700">
          <input
            type="text"
            placeholder="Search within this category..."
            className="w-full px-4 py-2 rounded-md bg-[#100C16] border border-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
            value={modalSearchTerm}
            onChange={(e) => setModalSearchTerm(e.target.value)}
            autoFocus
          />
        </div>
        <ul className="p-2 max-h-96 overflow-y-auto custom-scrollbar">
          {/* DEBUG: Log if the filtered list for modal is empty */}
          {filteredProducts.length === 0 && modalSearchTerm && (
            <li className="p-3 text-center text-gray-500">
              No matching products found.
            </li>
          )}
          {filteredProducts.length === 0 && !modalSearchTerm && (
            <li className="p-3 text-center text-gray-500">
              No products to display.
            </li>
          )}
          {filteredProducts.map((product) => (
            <li key={product.id}>
              <button
                onClick={() => onSelectProduct(product)}
                className="w-full text-left flex items-center p-3 rounded-md hover:bg-purple-600/20"
              >
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-12 h-12 object-contain mr-4"
                />
                <div>
                  <p className="font-semibold text-gray-200">{product.name}</p>
                  <p className="text-xs text-gray-400">{product.brand}</p>
                </div>
                <p className="ml-auto font-bold text-purple-400">
                  ${product.price}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const SpecComparisonTable = ({ products }) => {
  // This component does not need changes
  const [product1, product2] = products;
  const allSpecKeys = useMemo(() => {
    const keys = new Set(["brand", "price"]);
    products.forEach(
      (p) => p?.specs && Object.keys(p.specs).forEach((key) => keys.add(key))
    );
    return Array.from(keys);
  }, [products]);
  const formatSpecLabel = (key) =>
    key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
  return (
    <div className="mt-8 bg-[#1A1325] rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-4">
        Specification Comparison
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm text-left text-gray-300">
          <thead className="text-xs text-purple-300 uppercase bg-[#100C16]">
            <tr>
              <th scope="col" className="px-6 py-3 rounded-l-lg">
                Feature
              </th>
              <th scope="col" className="px-6 py-3">
                {product1?.name || ""}
              </th>
              <th scope="col" className="px-6 py-3 rounded-r-lg">
                {product2?.name || ""}
              </th>
            </tr>
          </thead>
          <tbody>
            {allSpecKeys.map((key) => {
              const v1 =
                key === "brand"
                  ? product1?.brand
                  : key === "price"
                  ? product1?.price
                  : product1?.specs?.[key];
              const v2 =
                key === "brand"
                  ? product2?.brand
                  : key === "price"
                  ? product2?.price
                  : product2?.specs?.[key];
              const value1 =
                v1 !== undefined && v1 !== null
                  ? key === "price"
                    ? `$${v1.toFixed(2)}`
                    : v1
                  : "N/A";
              const value2 =
                v2 !== undefined && v2 !== null
                  ? key === "price"
                    ? `$${v2.toFixed(2)}`
                    : v2
                  : "N/A";
              const isDifferent =
                value1 !== value2 && value1 !== "N/A" && value2 !== "N/A";
              return (
                <tr
                  key={key}
                  className="border-b border-gray-700 last:border-b-0"
                >
                  <th
                    scope="row"
                    className="px-6 py-4 font-medium whitespace-nowrap"
                  >
                    {formatSpecLabel(key)}
                  </th>
                  <td
                    className={`px-6 py-4 ${
                      isDifferent
                        ? "bg-purple-900/40 font-semibold text-white"
                        : ""
                    } ${key === "price" ? "font-bold text-purple-400" : ""}`}
                  >
                    {value1}
                  </td>
                  <td
                    className={`px-6 py-4 ${
                      isDifferent
                        ? "bg-purple-900/40 font-semibold text-white"
                        : ""
                    } ${key === "price" ? "font-bold text-purple-400" : ""}`}
                  >
                    {value2}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function CompareView({ products, isLoading, mainSearchTerm }) {
  const [compareItems, setCompareItems] = useState([null, null]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);

  // --- DEBUGGING CONSOLE LOGS ---
  console.log(
    "[CompareView] Props received - products count:",
    products?.length,
    "isLoading:",
    isLoading,
    "mainSearchTerm:",
    mainSearchTerm
  );

  const preFilteredProducts = useMemo(() => {
    console.log(
      "[CompareView] Recalculating preFilteredProducts. mainSearchTerm:",
      mainSearchTerm,
      "Incoming products count:",
      products?.length
    );
    if (!mainSearchTerm) {
      console.log(
        "[CompareView] No mainSearchTerm, returning original products for category."
      );
      return products;
    }
    const lowerSearchTerm = mainSearchTerm.toLowerCase();
    const filtered = products.filter(
      (p) =>
        p.name?.toLowerCase().includes(lowerSearchTerm) ||
        p.brand?.toLowerCase().includes(lowerSearchTerm)
    );
    console.log(
      "[CompareView] After pre-filtering with mainSearchTerm, products count:",
      filtered.length
    );
    return filtered;
  }, [products, mainSearchTerm]);

  const handleSelectClick = (index) => {
    setActiveSlot(index);
    setIsModalOpen(true);
  };

  const handleSelectProduct = (product) => {
    setCompareItems((prev) => {
      const newItems = [...prev];
      if (newItems.find((item) => item?.id === product.id)) {
        alert("This item is already in the comparison.");
        return newItems;
      }
      newItems[activeSlot] = product;
      return newItems;
    });
    setIsModalOpen(false);
  };

  const handleClearClick = (index) => {
    setCompareItems((prev) => {
      const newItems = [...prev];
      newItems[index] = null;
      return newItems;
    });
  };

  return (
    <div className="animate-fadeIn w-full max-w-screen-2xl mx-auto">
      <main className="flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ComparisonSlot
            product={compareItems[0]}
            onSelectClick={() => handleSelectClick(0)}
            onClearClick={() => handleClearClick(0)}
          />
          <ComparisonSlot
            product={compareItems[1]}
            onSelectClick={() => handleSelectClick(1)}
            onClearClick={() => handleClearClick(1)}
          />
        </div>
        {(compareItems[0] || compareItems[1]) && (
          <SpecComparisonTable products={compareItems} />
        )}
      </main>

      <ProductSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectProduct={handleSelectProduct}
        products={isLoading ? [] : preFilteredProducts}
      />
    </div>
  );
}
