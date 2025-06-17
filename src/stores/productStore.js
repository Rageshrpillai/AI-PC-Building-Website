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
      // --- MODIFIED STATE FOR PAGINATION ---
      products: [],
      allProducts: [], // <--- NEW
      currentPage: 0,
      totalPages: 1,
      isLoading: true,
      isFetchingMore: false,
      error: null,
      hasFetchedInitialData: false, // <--- NEW

      // --- EXISTING STATE (PRESERVED) ---
      productsByCategory: {},
      uniqueCategoryObjects: [],
      selectedComponents: {},
      prebuilds: [],
      isPrebuildsLoading: false,
      prebuildsError: null,

      // --- PAGINATED (DEFAULT) ACTIONS ---
      fetchAllProducts: async () => {
        try {
          // Fetch only the FIRST page
          const response = await fetchProductsFromAPI("all", 1);

          if (!response.data || !response.pagination) {
            throw new Error(
              "Invalid API response format for paginated products"
            );
          }

          const { data, pagination } = response;

          // --- Categorization logic ---
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
            products: data, // (keep for compatibility)
            productsByCategory: categorized,
            uniqueCategoryObjects: finalCategoriesForUI,
            currentPage: 1,
            totalPages: 1,
            isLoading: false,
            hasFetchedInitialData: true,
            error: null,
          });
        } catch (error) {
          console.error(
            "[ProductStore] Error fetching initial products:",
            error
          );
          set({ error: error.message, isLoading: false });
        }
      },

      fetchMoreProducts: async () => {
        const { currentPage, totalPages, isFetchingMore } = get();
        if (isFetchingMore || currentPage >= totalPages) {
          return;
        }

        try {
          set({ isFetchingMore: true });
          const nextPage = currentPage + 1;
          const response = await fetchProductsFromAPI("all", nextPage);

          if (!response.data || !response.pagination) {
            throw new Error(
              "Invalid API response format for paginated products"
            );
          }

          const { data, pagination } = response;

          set((state) => {
            const newCategorized = { ...state.productsByCategory };
            data.forEach((product) => {
              const key = product.category?.toLowerCase() || "unknown";
              if (!newCategorized[key]) newCategorized[key] = [];
              newCategorized[key].push(product);
            });

            return {
              products: [...state.products, ...data],
              productsByCategory: newCategorized,
              currentPage: pagination.currentPage,
              isFetchingMore: false,
            };
          });
        } catch (error) {
          console.error("[ProductStore] Error fetching more products:", error);
          set({ error: error.message, isFetchingMore: false });
        }
      },

      // --- NEW: Fetch ALL products (no pagination) for CustomBuildPage etc ---
      fetchAllProductsNoPagination: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch("/api/products/all");
          const json = await res.json();
          const data = json.data || [];

          // Categorize
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
            allProducts: data, // <-- THIS LINE IS THE FIX!
            products: data,
            productsByCategory: categorized,
            uniqueCategoryObjects: finalCategoriesForUI,
            currentPage: 1,
            totalPages: 1,
            isLoading: false,
            hasFetchedInitialData: true,
            error: null,
          });
        } catch (error) {
          set({ isLoading: false, error: "Failed to fetch all products." });
        }
      },

      // --- PREBUILD LOGIC (PRESERVED) ---
      fetchPrebuilds: async () => {
        if (get().isPrebuildsLoading) return;
        if (get().products.length === 0) {
          await get().fetchAllProducts();
        }
        const allProducts = get().products;

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

      getProductsForCategory: (categoryKey) => {
        const key = categoryKey?.toLowerCase();
        if (!key || key === "all") return get().products;
        return get().productsByCategory[key] || [];
      },
      getProductById: (id) => get().products.find((p) => p.id === id) || null,
    }),
    {
      name: "product-store",
      partialize: (state) => ({ selectedComponents: state.selectedComponents }),
    }
  )
);

export default useProductStore;
