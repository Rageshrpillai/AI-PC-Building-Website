// src/stores/productStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  fetchProducts as fetchProductsFromAPI,
  fetchPrebuilds as fetchPrebuildsFromAPI,
} from "../services/apiService";

const getCategoryName = (key) => {
  if (!key) return "Unknown";
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/s$/, "");
};

const useProductStore = create(
  persist(
    (set, get) => ({
      allProducts: [],
      allProductsByCategory: {},
      isLoading: true,
      error: null,
      hasFetchedInitialData: false,

      productsByCategory: {}, // keep for compatibility with code, but not used
      uniqueCategoryObjects: [],
      selectedComponents: {},
      prebuilds: [],
      isPrebuildsLoading: false,
      prebuildsError: null,

      // --- MAIN: Fetch all products at once (no pagination) ---
      fetchAllProductsNoPagination: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch("/api/products/all");
          const json = await res.json();
          const data = json.data || [];

          // Categorize for filter UI
          const categorized = {};
          const categoryKeys = new Set();
          data.forEach((product) => {
            const key = product.category?.toLowerCase() || "unknown";
            if (!categorized[key]) categorized[key] = [];
            categorized[key].push(product);
            if (key !== "unknown") categoryKeys.add(key);
          });

          const uniqueCats = Array.from(categoryKeys)
            .sort()
            .map((key) => ({ key, name: getCategoryName(key) }));

          const finalCategoriesForUI = [
            { key: "all", name: "All components" },
            ...uniqueCats,
          ];

          set({
            allProducts: data,
            allProductsByCategory: categorized,
            uniqueCategoryObjects: finalCategoriesForUI,
            isLoading: false,
            hasFetchedInitialData: true,
            error: null,
          });
        } catch (error) {
          set({ isLoading: false, error: "Failed to fetch all products." });
        }
      },

      fetchPrebuilds: async () => {
        if (get().isPrebuildsLoading) return;
        if (get().allProducts.length === 0) {
          await get().fetchAllProductsNoPagination();
        }
        const allProducts = get().allProducts;
        set({ isPrebuildsLoading: true, prebuildsError: null });
        try {
          const prebuildsData = await fetchPrebuildsFromAPI();
          const enrichedPrebuilds = prebuildsData.map((prebuild) => {
            const resolvedParts = prebuild.parts
              .map((partId) => {
                return allProducts.find((p) => p._id === partId);
              })
              .filter(Boolean);
            const totalPrice = resolvedParts.reduce(
              (sum, part) => sum + part.price,
              0
            );
            return {
              ...prebuild,
              resolvedParts,
              price: prebuild.price || totalPrice,
            };
          });
          set({
            prebuilds: enrichedPrebuilds,
            isPrebuildsLoading: false,
          });
        } catch (err) {
          set({
            prebuildsError: err.message,
            isPrebuildsLoading: false,
          });
        }
      },

      // --- SELECTION AND UTILITY ---
      selectComponent: (categoryName, component) =>
        set((state) => ({
          selectedComponents: {
            ...state.selectedComponents,
            [categoryName]: component,
          },
        })),
      removeComponent: (categoryName) =>
        set((state) => {
          const newSelectedComponents = { ...state.selectedComponents };
          delete newSelectedComponents[categoryName];
          return { selectedComponents: newSelectedComponents };
        }),
      clearAllComponents: () => set({ selectedComponents: {} }),

      // --- Now always use allProducts/allProductsByCategory ---
      getProductsForCategory: (categoryKey) => {
        const key = categoryKey?.toLowerCase();
        if (!key || key === "all") return get().allProducts;
        return get().allProductsByCategory[key] || [];
      },
      getProductById: (id) =>
        get().allProducts.find((p) => p.id === id) || null,
    }),
    {
      name: "product-store",
      partialize: (state) => ({ selectedComponents: state.selectedComponents }),
    }
  )
);

export default useProductStore;
