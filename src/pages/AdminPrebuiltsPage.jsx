// src/pages/AdminPrebuiltsPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  fetchPrebuilds,
  deletePrebuilt,
  createPrebuilt,
  fetchAllProducts,
} from "../services/apiService";
import { useAuth } from "@clerk/clerk-react";

// Define the required component categories for a complete prebuilt PC
const REQUIRED_PART_CATEGORIES = [
  "cpu",
  "motherboard",
  "ram", // We will handle quantity for RAM
  "gpu",
  "storage",
  "psu",
  "case",
  // "cooler", // Optional, depending on your definition of "complete"
];

// Helper function for RAM compatibility (inspired by UpgradeInputPage.jsx)
const validateRamCompatibility = (ramPart, motherboard) => {
  if (!motherboard || !ramPart) return true; // Cannot validate if a part is missing
  // Assuming motherboard.specifications.ramType and ramPart.specifications.ramType exist
  const moboMemoryType = motherboard.specifications?.ramType?.toLowerCase();
  const ramMemoryType = ramPart.specifications?.ramType?.toLowerCase();

  if (!moboMemoryType || !ramMemoryType) {
    console.warn(
      "RAM compatibility check: Missing RAM type in specs for either motherboard or RAM part."
    );
    return true; // Cannot validate if specs are missing, assume compatible for now
  }
  return moboMemoryType === ramMemoryType;
};

export default function AdminPrebuiltsPage() {
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [prebuilts, setPrebuilts] = useState([]);
  const [products, setProducts] = useState([]); // State to hold all products for part selection
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingPrebuiltId, setDeletingPrebuiltId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // State for Add Prebuilt Modal
  const [showAddPrebuiltModal, setShowAddPrebuiltModal] = useState(false);
  const [newPrebuilt, setNewPrebuilt] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    galleryImages: "",
    features: "",
    rating: 0,
    parts: [], // Array of { id: productId, category: productCategory, quantity: number }
  });
  const [addingPrebuilt, setAddingPrebuilt] = useState(false);
  const [addPrebuiltError, setAddPrebuiltError] = useState(null);

  // States for part selection dropdowns
  const [selectedPartCategory, setSelectedPartCategory] = useState("");
  const [selectedPartId, setSelectedPartId] = useState("");
  const [ramQuantity, setRamQuantity] = useState(1); // Default RAM quantity

  // State to store the selected motherboard object for compatibility checks
  const [selectedMotherboard, setSelectedMotherboard] = useState(null);

  const handleGoBack = () => {
    navigate("/admin/dashboard");
  };

  const loadPrebuiltsAndProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prebuiltsResponse, productsData] = await Promise.all([
        fetchPrebuilds(),
        fetchAllProducts(), // Fetch all products to populate parts dropdown
      ]);
      setPrebuilts(prebuiltsResponse.data);
      setProducts(productsData); // Store all products
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Extract unique categories from existing products for part selection
  const uniqueProductCategories = useMemo(() => {
    const categories = new Set();
    products.forEach((product) => {
      if (product.category) {
        categories.add(product.category.toLowerCase());
      }
    });
    return Array.from(categories).sort();
  }, [products]);

  // Filter RAM modules based on selected motherboard's RAM type (DEFINED FIRST)
  const filteredRamModules = useMemo(() => {
    if (!selectedMotherboard) {
      // If no motherboard selected, show all RAM but indicate potential incompatibility
      return products.filter((p) => p.category?.toLowerCase() === "ram");
    }

    // Assuming motherboard product has a 'ramType' in its specifications (e.g., { "ramType": "DDR4" })
    const motherboardRamType =
      selectedMotherboard.specifications?.ramType?.toLowerCase();

    if (!motherboardRamType) {
      console.warn(
        "Selected motherboard does not specify RAM type in its specifications. Showing all RAM."
      );
      return products.filter((p) => p.category?.toLowerCase() === "ram");
    }

    return products.filter(
      (p) =>
        p.category?.toLowerCase() === "ram" &&
        p.specifications?.ramType?.toLowerCase() === motherboardRamType
    );
  }, [products, selectedMotherboard]);

  // Filter products by selected category for the part selection dropdown (NOW USES filteredRamModules)
  const filteredProductsByCategory = useMemo(() => {
    if (!selectedPartCategory) return [];
    // If RAM is selected, use the special RAM filter
    if (selectedPartCategory === "ram") {
      return filteredRamModules; // <--- This now correctly refers to the defined memo
    }
    return products.filter(
      (p) => p.category?.toLowerCase() === selectedPartCategory
    );
  }, [products, selectedPartCategory, filteredRamModules]); // Added filteredRamModules to dependencies

  // --- Delete Prebuilt Handlers (unchanged) ---
  const handleDeletePrebuilt = async (prebuiltId) => {
    setDeletingPrebuiltId(prebuiltId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    if (!deletingPrebuiltId) return;

    try {
      await deletePrebuilt(deletingPrebuiltId, getToken);
      setPrebuilts((prevPrebuilts) =>
        prevPrebuilts.filter((p) => (p.id || p._id) !== deletingPrebuiltId)
      );
      setDeletingPrebuiltId(null);
      console.log(`Prebuilt PC ${deletingPrebuiltId} deleted successfully.`);
    } catch (err) {
      console.error(`Error deleting prebuilt PC ${deletingPrebuiltId}:`, err);
      setError(`Failed to delete prebuilt PC. ${err.message || ""}`);
      setDeletingPrebuiltId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletingPrebuiltId(null);
  };

  // --- Add Prebuilt Handlers ---
  const handleAddPrebuiltChange = (e) => {
    const { name, value } = e.target;
    setNewPrebuilt((prev) => ({ ...prev, [name]: value }));
  };

  // Handles selection of a part from the dropdowns
  const handleAddPartToPrebuilt = () => {
    if (!selectedPartId) return;

    const partToAdd = products.find(
      (p) => p.id === selectedPartId || p._id === selectedPartId
    );
    if (!partToAdd) return;

    // Clear previous part-specific errors
    setAddPrebuiltError(null);

    // Determine quantity (always 1 for non-RAM, user-defined for RAM)
    const currentQuantity = selectedPartCategory === "ram" ? ramQuantity : 1;

    // --- Compatibility and Replacement Logic ---
    if (selectedPartCategory === "motherboard") {
      // If a new motherboard is selected, update selectedMotherboard state
      setSelectedMotherboard(partToAdd);
      // Remove any existing RAM from the newPrebuilt.parts to force re-selection
      // and replace existing motherboard if any.
      setNewPrebuilt((prev) => ({
        ...prev,
        parts: prev.parts.filter(
          (p) => p.category !== "motherboard" && p.category !== "ram"
        ),
      }));
      // Add the new motherboard
      setNewPrebuilt((prev) => ({
        ...prev,
        parts: [
          ...prev.parts,
          {
            id: partToAdd.id || partToAdd._id,
            category: partToAdd.category,
            quantity: 1,
          },
        ],
      }));
    } else if (selectedPartCategory === "ram") {
      // RAM compatibility check
      if (!selectedMotherboard) {
        setAddPrebuiltError(
          "Please select a Motherboard first to ensure RAM compatibility."
        );
        return;
      }
      if (!validateRamCompatibility(partToAdd, selectedMotherboard)) {
        setAddPrebuiltError(
          `Selected RAM (${
            partToAdd.specifications?.ramType || "N/A"
          }) is not compatible with the Motherboard (${
            selectedMotherboard.specifications?.ramType || "N/A"
          }).`
        );
        return;
      }

      // For RAM, allow multiple instances of the same ID (by quantity)
      const existingRamIndex = newPrebuilt.parts.findIndex(
        (p) => p.id === partToAdd.id && p.category === "ram"
      );
      if (existingRamIndex > -1) {
        // Update quantity of existing RAM module
        setNewPrebuilt((prev) => {
          const updatedParts = [...prev.parts];
          updatedParts[existingRamIndex] = {
            ...updatedParts[existingRamIndex],
            quantity: updatedParts[existingRamIndex].quantity + currentQuantity,
          };
          return { ...prev, parts: updatedParts };
        });
      } else {
        // Add new RAM module
        setNewPrebuilt((prev) => ({
          ...prev,
          parts: [
            ...prev.parts,
            {
              id: partToAdd.id || partToAdd._id,
              category: partToAdd.category,
              quantity: currentQuantity,
            },
          ],
        }));
      }
    } else {
      // For other categories, replace if already exists, otherwise add
      setNewPrebuilt((prev) => {
        const updatedParts = prev.parts.filter(
          (p) => p.category?.toLowerCase() !== partToAdd.category?.toLowerCase()
        );
        updatedParts.push({
          id: partToAdd.id || partToAdd._id,
          category: partToAdd.category,
          quantity: 1,
        });
        return { ...prev, parts: updatedParts };
      });
    }

    setSelectedPartId(""); // Reset selected part dropdown
    setRamQuantity(1); // Reset RAM quantity
  };

  const handleRemovePartFromPrebuilt = (partIdToRemove, categoryToRemove) => {
    setNewPrebuilt((prev) => {
      if (categoryToRemove === "ram") {
        // For RAM, decrement quantity or remove completely
        const partIndex = prev.parts.findIndex(
          (p) => p.id === partIdToRemove && p.category === "ram"
        );
        if (partIndex > -1) {
          const updatedParts = [...prev.parts];
          if (updatedParts[partIndex].quantity > 1) {
            updatedParts[partIndex].quantity -= 1;
          } else {
            updatedParts.splice(partIndex, 1); // Remove completely if quantity is 1
          }
          return { ...prev, parts: updatedParts };
        }
      }
      // For other parts, just filter them out
      return {
        ...prev,
        parts: prev.parts.filter((p) => p.id !== partIdToRemove),
      };
    });
  };

  const handleAddPrebuiltSubmit = async (e) => {
    e.preventDefault();
    setAddPrebuiltError(null);

    const addedCategories = newPrebuilt.parts.map((p) =>
      p.category?.toLowerCase()
    );
    const missingCategories = REQUIRED_PART_CATEGORIES.filter(
      (reqCat) => !addedCategories.includes(reqCat)
    );

    if (missingCategories.length > 0) {
      setAddPrebuiltError(
        `Missing required components: ${missingCategories
          .map((c) => c.charAt(0).toUpperCase() + c.slice(1))
          .join(", ")}. Please add one of each.`
      );
      return;
    }

    setAddingPrebuilt(true);

    try {
      const prebuiltToSend = { ...newPrebuilt };

      prebuiltToSend.galleryImages = prebuiltToSend.galleryImages
        ? prebuiltToSend.galleryImages
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      prebuiltToSend.features = prebuiltToSend.features
        ? prebuiltToSend.features
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      prebuiltToSend.price = parseFloat(prebuiltToSend.price) || 0;
      prebuiltToSend.rating = parseFloat(prebuiltToSend.rating) || 0;

      const createdPrebuilt = await createPrebuilt(prebuiltToSend, getToken);
      setPrebuilts((prevPrebuilts) => [
        ...prevPrebuilts,
        createdPrebuilt.prebuilt,
      ]);
      setNewPrebuilt({
        // Reset form
        name: "",
        description: "",
        price: "",
        imageUrl: "",
        galleryImages: "",
        features: "",
        rating: 0,
        parts: [],
      });
      setShowAddPrebuiltModal(false);
      // Reset part selection states
      setSelectedMotherboard(null); // Reset motherboard selection
      setSelectedPartCategory("");
      setSelectedPartId("");
      setRamQuantity(1); // Reset RAM quantity
      console.log("Prebuilt PC added successfully:", createdPrebuilt);
    } catch (err) {
      console.error("Error adding prebuilt PC:", err);
      setAddPrebuiltError(
        `Failed to add prebuilt PC: ${err.message || "Unknown error"}`
      );
    } finally {
      setAddingPrebuilt(false);
    }
  };

  useEffect(() => {
    loadPrebuiltsAndProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#100C16] flex justify-center items-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-xl ml-4">Loading Prebuilt PCs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#100C16] flex flex-col justify-center items-center text-white p-4">
        <p className="text-red-500 text-xl mb-4">{error}</p>
        <button
          onClick={loadPrebuiltsAndProducts}
          className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200"
        >
          Retry
        </button>
        <button
          onClick={handleGoBack}
          className="mt-4 px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors duration-200"
        >
          Go Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#100C16] text-white">
      <div className="container mx-auto px-6 py-8 pt-12">
        <h1 className="text-4xl font-bold mb-8 text-purple-400">
          Manage Prebuilt PCs
        </h1>

        <button
          onClick={handleGoBack}
          className="mb-6 px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors duration-200"
        >
          &larr; Go Back to Dashboard
        </button>

        <div className="bg-[#20182C] p-8 rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold mb-6 text-purple-300">
            All Official Prebuilt Configurations
          </h2>

          <button
            onClick={() => setShowAddPrebuiltModal(true)}
            className="mb-6 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
          >
            Add New Prebuilt PC
          </button>

          {prebuilts.length === 0 ? (
            <p className="text-gray-400 text-center py-10">
              No prebuilt PCs found. Add some!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-[#1A1326] rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-purple-800 text-left text-sm uppercase tracking-wider">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prebuilts.map((prebuilt) => (
                    <tr
                      key={prebuilt.id || prebuilt._id}
                      className="border-b border-gray-700 hover:bg-[#2C243B]"
                    >
                      <td className="py-3 px-4">
                        <Link
                          to={`/builds/${prebuilt.id}`}
                          className="text-blue-400 hover:underline"
                        >
                          {prebuilt.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        ${prebuilt.price?.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        {prebuilt.rating?.toFixed(1) || "N/A"}
                      </td>
                      <td className="py-3 px-4 flex space-x-2">
                        <button className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleDeletePrebuilt(prebuilt.id || prebuilt._id)
                          }
                          className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal (Existing) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-[#20182C] p-8 rounded-lg shadow-xl text-center max-w-sm mx-auto">
            <h3 className="text-xl font-semibold text-white mb-4">
              Confirm Deletion
            </h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this prebuilt PC? This action
              cannot be undone.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={cancelDelete}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Prebuilt Modal (UPDATED for RAM logic) */}
      {showAddPrebuiltModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#20182C] p-8 rounded-lg shadow-xl w-full max-w-2xl mx-auto text-white flex flex-col max-h-[90vh]">
            <h3 className="text-2xl font-semibold text-purple-400 mb-6 flex-shrink-0">
              Add New Prebuilt PC
            </h3>
            {addPrebuiltError && (
              <p className="text-red-400 mb-4 flex-shrink-0">
                {addPrebuiltError}
              </p>
            )}
            <form
              onSubmit={handleAddPrebuiltSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar flex-grow"
            >
              {/* Basic Details */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newPrebuilt.name}
                  onChange={handleAddPrebuiltChange}
                  className="w-full p-2 rounded-md bg-[#1A1326] border border-gray-700 focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Price
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={newPrebuilt.price}
                  onChange={handleAddPrebuiltChange}
                  step="0.01"
                  className="w-full p-2 rounded-md bg-[#1A1326] border border-gray-700 focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={newPrebuilt.description}
                  onChange={handleAddPrebuiltChange}
                  rows="3"
                  className="w-full p-2 rounded-md bg-[#1A1326] border border-gray-700 focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
                ></textarea>
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="imageUrl"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Main Image URL
                </label>
                <input
                  type="text"
                  id="imageUrl"
                  name="imageUrl"
                  value={newPrebuilt.imageUrl}
                  onChange={handleAddPrebuiltChange}
                  className="w-full p-2 rounded-md bg-[#1A1326] border border-gray-700 focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
                />
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="galleryImages"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Gallery Images (comma-separated URLs)
                </label>
                <textarea
                  id="galleryImages"
                  name="galleryImages"
                  value={newPrebuilt.galleryImages}
                  onChange={handleAddPrebuiltChange}
                  rows="2"
                  placeholder="url1, url2, url3"
                  className="w-full p-2 rounded-md bg-[#1A1326] border border-gray-700 focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
                ></textarea>
              </div>
              <div>
                <label
                  htmlFor="rating"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Rating (0-5)
                </label>
                <input
                  type="number"
                  id="rating"
                  name="rating"
                  value={newPrebuilt.rating}
                  onChange={handleAddPrebuiltChange}
                  step="0.1"
                  min="0"
                  max="5"
                  className="w-full p-2 rounded-md bg-[#1A1326] border border-gray-700 focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label
                  htmlFor="features"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Features (comma-separated)
                </label>
                <input
                  type="text"
                  id="features"
                  name="features"
                  value={newPrebuilt.features}
                  onChange={handleAddPrebuiltChange}
                  placeholder="Feature 1, Feature 2, Feature 3"
                  className="w-full p-2 rounded-md bg-[#1A1326] border border-gray-700 focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
                />
              </div>

              {/* Parts Selection Section */}
              <div className="md:col-span-2 border-t border-gray-700 pt-4 mt-4">
                <h4 className="text-lg font-semibold text-purple-300 mb-3">
                  Select Components
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  {" "}
                  {/* Changed to 3 columns */}
                  <div>
                    <label
                      htmlFor="partCategory"
                      className="block text-sm font-medium text-gray-300 mb-1"
                    >
                      Part Category
                    </label>
                    <select
                      id="partCategory"
                      value={selectedPartCategory}
                      onChange={(e) => {
                        setSelectedPartCategory(e.target.value);
                        setSelectedPartId(""); // Reset part selection when category changes
                      }}
                      className="w-full p-2 rounded-md bg-[#1A1326] border border-gray-700 focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
                    >
                      <option value="">Select a category</option>
                      {uniqueProductCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="part"
                      className="block text-sm font-medium text-gray-300 mb-1"
                    >
                      Select Part
                    </label>
                    <select
                      id="part"
                      value={selectedPartId}
                      onChange={(e) => setSelectedPartId(e.target.value)}
                      className="w-full p-2 rounded-md bg-[#1A1326] border border-gray-700 focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
                      disabled={!selectedPartCategory}
                    >
                      <option value="">Select a part</option>
                      {selectedPartCategory === "ram"
                        ? filteredRamModules.map((part) => (
                            <option
                              key={part.id || part._id}
                              value={part.id || part._id}
                            >
                              {part.name} (${part.price?.toFixed(2)}) -{" "}
                              {part.specifications?.ramType}
                            </option>
                          ))
                        : filteredProductsByCategory.map((part) => (
                            <option
                              key={part.id || part._id}
                              value={part.id || part._id}
                            >
                              {part.name} (${part.price?.toFixed(2)})
                            </option>
                          ))}
                    </select>
                  </div>
                  {selectedPartCategory === "ram" && (
                    <div>
                      <label
                        htmlFor="ramQuantity"
                        className="block text-sm font-medium text-gray-300 mb-1"
                      >
                        Quantity
                      </label>
                      <input
                        type="number"
                        id="ramQuantity"
                        value={ramQuantity}
                        onChange={(e) =>
                          setRamQuantity(
                            Math.max(1, parseInt(e.target.value) || 1)
                          )
                        }
                        min="1"
                        className="w-full p-2 rounded-md bg-[#1A1326] border border-gray-700 focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
                      />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAddPartToPrebuilt}
                  disabled={!selectedPartId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Part
                </button>

                {/* Display Selected Parts */}
                <div className="mt-4">
                  <h5 className="text-md font-medium text-gray-300 mb-2">
                    Added Parts ({newPrebuilt.parts.length} /{" "}
                    {REQUIRED_PART_CATEGORIES.length} required):
                  </h5>
                  {newPrebuilt.parts.length === 0 ? (
                    <p className="text-gray-500 text-sm">No parts added yet.</p>
                  ) : (
                    <ul className="space-y-1">
                      {newPrebuilt.parts.map((partRef) => {
                        const fullPart = products.find(
                          (p) => p.id === partRef.id || p._id === partRef.id
                        );
                        return (
                          <li
                            key={partRef.id}
                            className="flex items-center justify-between bg-[#1A1326] p-2 rounded-md"
                          >
                            <span className="text-sm">
                              {fullPart
                                ? `${fullPart.name} (${fullPart.category})`
                                : `Part ID: ${partRef.id}`}
                              {partRef.quantity > 1 && ` x${partRef.quantity}`}{" "}
                              {/* Display quantity */}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleRemovePartFromPrebuilt(
                                  partRef.id,
                                  partRef.category
                                )
                              } // Pass category for RAM removal logic
                              className="text-red-400 hover:text-red-600 text-sm"
                            >
                              Remove
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>

              {/* Form action buttons */}
              <div className="md:col-span-2 flex justify-end space-x-4 mt-6 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddPrebuiltModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingPrebuilt}
                  className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingPrebuilt ? "Adding..." : "Add Prebuilt PC"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
