import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fetchProducts as fetchAllProductsFromAPI } from "../services/apiService";

const getCategoryName = (key) => {
  if (!key) return "Unknown";
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/s$/, "");
};

const useProductStore = create(
  persist(
    (set, get) => ({
      // --- STATE ---
      // The key change is setting isLoading to true by default.
      isLoading: true,
      hasFetchedInitialData: false,

      allProducts: [],
      productsByCategory: {},
      uniqueCategoryObjects: [],
      selectedComponents: {},
      error: null,

      prebuilds: [],
      isPrebuildsLoading: false,
      prebuildsError: null,

      // --- ACTIONS ---
      fetchAllProducts: async () => {
        try {
          const products = await fetchAllProductsFromAPI("all");
          if (!Array.isArray(products)) {
            throw new Error("Fetched products is not an array");
          }

          const categorized = {};
          const categoryKeys = new Set();
          products.forEach((product) => {
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
            allProducts: products,
            productsByCategory: categorized,
            uniqueCategoryObjects: finalCategoriesForUI,
            isLoading: false, // Turn off loading only AFTER data is ready
            hasFetchedInitialData: true,
            error: null,
          });
        } catch (error) {
          console.error("[ProductStore] Error fetching all products:", error);
          set({
            error: error.message,
            isLoading: false,
            hasFetchedInitialData: true,
          });
        }
      },

      fetchPrebuilds: async () => {
        if (get().isPrebuildsLoading) return;
        if (!get().hasFetchedInitialData) {
          await get().fetchAllProducts();
        }
        set({ isPrebuildsLoading: true, prebuildsError: null });
        try {
          const response = await fetch("/data/prebuilds.json");
          if (!response.ok) {
            throw new Error(
              `Failed to fetch prebuilds: ${response.statusText}`
            );
          }
          const prebuildsData = await response.json();
          const allProducts = get().allProducts;
          const enrichedPrebuilds = prebuildsData.map((prebuild) => {
            const resolvedParts = prebuild.parts.map((part) => {
              const fullPart = allProducts.find((p) => p.id === part.id);
              return fullPart || part;
            });
            return {
              ...prebuild,
              resolvedParts,
              name: prebuild.name || "Unnamed Build",
              description: prebuild.description || "No description available",
              price: prebuild.price || 0,
              rating: prebuild.rating || 0,
              imageUrl: prebuild.imageUrl || "/images/placeholder.jpg",
            };
          });
          set({
            prebuilds: enrichedPrebuilds,
            isPrebuildsLoading: false,
          });
          console.log(
            "[ProductStore] Successfully loaded prebuilds:",
            enrichedPrebuilds
          );
        } catch (err) {
          console.error("[ProductStore] Error fetching pre-builds:", err);
          set({
            prebuildsError: err.message,
            isPrebuildsLoading: false,
          });
        }
      },

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

      // --- SELECTORS ---
      getProductsForCategory: (categoryKey) => {
        const key = categoryKey?.toLowerCase();
        if (!key || key === "all") return get().allProducts;
        return get().productsByCategory[key] || [];
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
