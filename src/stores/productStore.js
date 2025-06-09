// src/stores/productStore.js
import { create } from "zustand";
import { persist } from 'zustand/middleware';
// Assuming apiService.js is in src/services/
import { fetchProducts as fetchAllProductsFromAPI } from "../services/apiService";

// Helper to get a display name from a category key
const getCategoryName = (key) => {
  if (!key) return "Unknown";
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/s$/, ""); // e.g., cpus -> Cpu
};

const useProductStore = create(
  persist(
    (set, get) => ({
      // State
      allProducts: [],
      productsByCategory: {}, // e.g., { cpu: [...], gpu: [...] }
      uniqueCategoryObjects: [], // e.g., [{ key: 'cpu', name: 'CPU' }, ...]
      selectedComponents: {},
      isLoading: false,
      error: null,
      hasFetchedInitialData: false, // To track if initial fetch has been attempted

      // Actions
      fetchAllProducts: async () => {
        if (get().isLoading) return;

        set({ isLoading: true, error: null });
        try {
          const products = await fetchAllProductsFromAPI("all"); // Fetches all products
          if (!Array.isArray(products)) {
            throw new Error("Fetched products is not an array");
          }

          const categorized = {};
          const categoryKeys = new Set();

          products.forEach((product) => {
            const key = product.category?.toLowerCase() || "unknown"; // Ensure category key is consistent
            if (!categorized[key]) {
              categorized[key] = [];
            }
            categorized[key].push(product);
            if (key !== "unknown") {
              categoryKeys.add(key);
            }
          });

          const uniqueCats = Array.from(categoryKeys)
            .sort()
            .map((key) => ({ key, name: getCategoryName(key) }));

          // Add "All components" for UI, ensure it matches CATEGORIES in Spec.jsx if used there
          const finalCategoriesForUI = [
            { key: "all", name: "All components" },
            ...uniqueCats,
          ];

          set({
            allProducts: products,
            productsByCategory: categorized,
            uniqueCategoryObjects: finalCategoriesForUI, // Store this for UIs needing category lists
            isLoading: false,
            hasFetchedInitialData: true,
            error: null,
          });
          console.log(
            "[ProductStore] Successfully fetched and processed all products."
          );
        } catch (error) {
          console.error("[ProductStore] Error fetching all products:", error);
          set({
            error: error.message,
            isLoading: false,
            hasFetchedInitialData: true,
          }); // Set hasFetched to true even on error to prevent loops
        }
      },

      // Component Selection Actions
      selectComponent: (categoryName, component) => {
        set((state) => ({
          selectedComponents: {
            ...state.selectedComponents,
            [categoryName]: component
          }
        }));
      },

      removeComponent: (categoryName) => {
        set((state) => {
          const newSelectedComponents = { ...state.selectedComponents };
          delete newSelectedComponents[categoryName];
          return { selectedComponents: newSelectedComponents };
        });
      },

      clearAllComponents: () => {
        set({ selectedComponents: {} });
      },

      // Selectors (functions to get data from the store)
      getProductsForCategory: (categoryKey) => {
        const key = categoryKey?.toLowerCase();
        if (!key || key === "all") {
          return get().allProducts;
        }
        return get().productsByCategory[key] || [];
      },

      getProductById: (id) => {
        if (!id) return null;
        // Ensure ID comparison is robust (string vs number)
        return get().allProducts.find((p) => String(p.id) === String(id));
      },

      getSelectedComponent: (categoryName) => {
        return get().selectedComponents[categoryName] || null;
      },

      getAllSelectedComponents: () => {
        return get().selectedComponents;
      }
    }),
    {
      name: 'product-store',
      partialize: (state) => ({
        selectedComponents: state.selectedComponents
      })
    }
  )
);

// Optional: Trigger initial fetch when the store is defined (or do it in App.jsx)
// useProductStore.getState().fetchAllProducts();

export default useProductStore;
