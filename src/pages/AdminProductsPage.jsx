// src/pages/AdminProductsPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchAllProducts,
  deleteProduct,
  createProduct,
} from "../services/apiService";
import { useAuth } from "@clerk/clerk-react";

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // State for Add Product Modal
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    brand: "",
    imageUrl: "",
    description: "",
    specifications: "", // Keep as string for JSON input
    rating: 0,
    features: "", // Keep as string for comma-separated input
    galleryImages: "", // Keep as string for comma-separated input
  });
  const [addingProduct, setAddingProduct] = useState(false);
  const [addProductError, setAddProductError] = useState(null);

  const handleGoBack = () => {
    navigate("/admin/dashboard");
  };

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllProducts();
      setProducts(data);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Extract unique categories from existing products
  const uniqueCategories = useMemo(() => {
    const categories = new Set();
    products.forEach((product) => {
      if (product.category) {
        categories.add(product.category.toLowerCase());
      }
    });
    return Array.from(categories).sort();
  }, [products]);

  // --- Delete Product Handlers (unchanged) ---
  const handleDeleteProduct = async (productId) => {
    setDeletingProductId(productId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    if (!deletingProductId) return;

    try {
      await deleteProduct(deletingProductId, getToken);
      setProducts((prevProducts) =>
        prevProducts.filter((p) => p.id !== deletingProductId)
      );
      setDeletingProductId(null);
      console.log(`Product ${deletingProductId} deleted successfully.`);
    } catch (err) {
      console.error(`Error deleting product ${deletingProductId}:`, err);
      setError(`Failed to delete product. ${err.message || ""}`);
      setDeletingProductId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletingProductId(null);
  };

  // --- Add Product Handlers ---
  const handleAddProductChange = (e) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddProductSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    setAddingProduct(true);
    setAddProductError(null);

    try {
      const productToSend = { ...newProduct };
      // Handle JSON parsing for specifications
      if (productToSend.specifications) {
        try {
          productToSend.specifications = JSON.parse(
            productToSend.specifications
          );
        } catch (jsonError) {
          setAddProductError(
            'Invalid JSON for specifications. Please ensure it\'s valid JSON (e.g., {"key": "value"}).'
          );
          setAddingProduct(false);
          return;
        }
      } else {
        productToSend.specifications = {}; // Ensure it's an empty object if left blank
      }

      // Handle comma-separated strings for features and galleryImages
      productToSend.features = productToSend.features
        ? productToSend.features
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      productToSend.galleryImages = productToSend.galleryImages
        ? productToSend.galleryImages
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      // Ensure price and rating are numbers
      productToSend.price = parseFloat(productToSend.price) || 0;
      productToSend.rating = parseFloat(productToSend.rating) || 0;

      const createdProduct = await createProduct(productToSend, getToken);
      setProducts((prevProducts) => [...prevProducts, createdProduct.product]);
      setNewProduct({
        // Reset form to initial empty state
        name: "",
        category: "",
        price: "",
        brand: "",
        imageUrl: "",
        description: "",
        specifications: "",
        rating: 0,
        features: "",
        galleryImages: "",
      });
      setShowAddProductModal(false); // Close modal
      console.log("Product added successfully:", createdProduct);
    } catch (err) {
      console.error("Error adding product:", err);
      setAddProductError(
        `Failed to add product: ${err.message || "Unknown error"}`
      );
    } finally {
      setAddingProduct(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#100C16] flex justify-center items-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-xl ml-4">Loading Products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#100C16] flex flex-col justify-center items-center text-white p-4">
        <p className="text-red-500 text-xl mb-4">{error}</p>
        <button
          onClick={loadProducts}
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
          Manage Products
        </h1>

        <button
          onClick={handleGoBack}
          className="mb-6 px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors duration-200"
        >
          &larr; Go Back to Dashboard
        </button>

        <div className="bg-[#20182C] p-8 rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold mb-6 text-purple-300">
            All PC Components
          </h2>

          <button
            onClick={() => setShowAddProductModal(true)}
            className="mb-6 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
          >
            Add New Product
          </button>

          {products.length === 0 ? (
            <p className="text-gray-400 text-center py-10">
              No products found. Add some!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-[#1A1326] rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-purple-800 text-left text-sm uppercase tracking-wider">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Brand</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id || product._id}
                      className="border-b border-gray-700 hover:bg-[#2C243B]"
                    >
                      <td className="py-3 px-4">{product.name}</td>
                      <td className="py-3 px-4 capitalize">
                        {product.category}
                      </td>
                      <td className="py-3 px-4">
                        ${product.price?.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">{product.brand}</td>
                      <td className="py-3 px-4 flex space-x-2">
                        <button className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteProduct(product.id || product._id)
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
              Are you sure you want to delete this product? This action cannot
              be undone.
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

      {/* Add New Product Modal (UPDATED for scrolling and button fix) */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#20182C] p-8 rounded-lg shadow-xl w-full max-w-xl mx-auto text-white flex flex-col max-h-[90vh]">
            <h3 className="text-2xl font-semibold text-purple-400 mb-6 flex-shrink-0">
              Add New Product
            </h3>
            {addProductError && (
              <p className="text-red-400 mb-4 flex-shrink-0">
                {addProductError}
              </p>
            )}
            <form
              onSubmit={handleAddProductSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar flex-grow"
            >
              {/* Form fields */}
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
                  value={newProduct.name}
                  onChange={handleAddProductChange}
                  className="w-full p-2 rounded-md bg-[#1A1326] border border-gray-700 focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={newProduct.category}
                  onChange={handleAddProductChange}
                  className="w-full p-2 rounded-md bg-[#1A1326] border border-gray-700 focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
                  required
                >
                  <option value="">Select a category</option>
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
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
                  value={newProduct.price}
                  onChange={handleAddProductChange}
                  step="0.01"
                  className="w-full p-2 rounded-md bg-[#1A1326] border border-gray-700 focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="brand"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Brand
                </label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={newProduct.brand}
                  onChange={handleAddProductChange}
                  className="w-full p-2 rounded-md bg-[#1A1326] border border-gray-700 focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="imageUrl"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Image URL
                </label>
                <input
                  type="text"
                  id="imageUrl"
                  name="imageUrl"
                  value={newProduct.imageUrl}
                  onChange={handleAddProductChange}
                  className="w-full p-2 rounded-md bg-[#1A1326] border border-gray-700 focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
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
                  value={newProduct.description}
                  onChange={handleAddProductChange}
                  rows="3"
                  className="w-full p-2 rounded-md bg-[#1A1326] border border-gray-700 focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
                ></textarea>
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="specifications"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Specifications (JSON string)
                </label>
                <textarea
                  id="specifications"
                  name="specifications"
                  value={newProduct.specifications}
                  onChange={handleAddProductChange}
                  rows="4"
                  placeholder='{"Socket": "AM4", "Cores": 8}'
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
                  value={newProduct.rating}
                  onChange={handleAddProductChange}
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
                  value={newProduct.features}
                  onChange={handleAddProductChange}
                  placeholder="Feature 1, Feature 2, Feature 3"
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
                  value={newProduct.galleryImages}
                  onChange={handleAddProductChange}
                  rows="2"
                  placeholder="url1, url2, url3"
                  className="w-full p-2 rounded-md bg-[#1A1326] border border-gray-700 focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
                ></textarea>
              </div>

              {/* Form action buttons moved inside the form */}
              <div className="md:col-span-2 flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit" // Ensure this is type="submit"
                  disabled={addingProduct}
                  className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingProduct ? "Adding..." : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
