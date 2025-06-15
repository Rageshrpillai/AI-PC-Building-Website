// src/services/apiService.js

// This array should list all your actual JSON data filenames in /public/data/
const ALL_CATEGORY_FILENAMES = [
  "cpus.json",
  "gpus.json",
  "motherboards.json",
  "rams.json",
  "storages.json",
  "psus.json",
  "cases.json",
  "coolers.json",
  // Add any other .json file names here
];

// Helper to get a category key from filename (e.g., cpus.json -> cpu)
const getCategoryKeyFromFile = (filename) => {
  return filename.replace(".json", "").replace(/s$/, "");
};

export const fetchProducts = async (category = "cpu") => {
  const lowerCategory = category.toLowerCase();

  if (lowerCategory === "all") {
    console.log("[apiService] Fetching all components for store...");
    try {
      const allPromises = ALL_CATEGORY_FILENAMES.map((catFile) =>
        fetch(`/data/${catFile}`)
          .then(async (res) => {
            if (!res.ok) {
              console.warn(
                `[apiService] Could not fetch /data/${catFile}. Status: ${res.status}`
              );
              return []; // Return empty for this file if fetch fails
            }
            try {
              const data = await res.json();
              // Add category to each product based on its source file
              const categoryKey = getCategoryKeyFromFile(catFile);
              return Array.isArray(data)
                ? data.map((p) => ({
                    ...p,
                    category: p.category || categoryKey,
                  }))
                : [];
            } catch (parseError) {
              console.error(
                `[apiService] Error parsing JSON from /data/${catFile}:`,
                parseError
              );
              return []; // Return empty if JSON parsing fails
            }
          })
          .catch((err) => {
            console.error(
              `[apiService] Network or other error fetching /data/${catFile}:`,
              err
            );
            return []; // Return empty on fetch error for this file
          })
      );
      const allProductArrays = await Promise.all(allPromises);
      const flattenedProducts = allProductArrays.flat();
      console.log(
        `[apiService] Successfully fetched and combined ${flattenedProducts.length} products for 'all'.`
      );
      return flattenedProducts;
    } catch (error) {
      console.error("[apiService] Error in fetchProducts('all'):", error);
      throw error; // Re-throw to be caught by the store
    }
  }

  // Logic for fetching a single category
  const categoryToFileMap = {
    cpu: "cpus.json",
    gpu: "gpus.json",
    motherboard: "motherboards.json",
    ram: "rams.json",
    storage: "storages.json",
    cooler: "coolers.json", // Assuming cooler data is in psus.json
    cabinet: "cases.json",
    psu: "psus.json",
    case: "cases.json",
  };
  const fileName = categoryToFileMap[lowerCategory];

  if (!fileName) {
    console.error(
      `[apiService] No mock data file defined for category '${category}'.`
    );
    return Promise.resolve([]);
  }

  const filePath = `/data/${fileName}`;
  try {
    console.log(
      `[apiService] Fetching mock products for category: ${category} from ${filePath}`
    );
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(
        `Could not fetch ${filePath}. Status: ${response.status}`
      );
    }
    const data = await response.json();
    if (Array.isArray(data)) {
      const categoryKey = getCategoryKeyFromFile(fileName);
      return data.map((product) => ({
        ...product,
        category: product.category || categoryKey,
      }));
    } else {
      console.warn(`[apiService] Data in ${filePath} is not an array.`);
      return [];
    }
  } catch (error) {
    console.error(
      `[apiService] Failed to fetch/parse products for ${category} from ${filePath}:`,
      error
    );
    throw error; // Re-throw
  }
};

// fetchPartById is no longer strictly needed here if the store handles finding by ID from allProducts.
// The store's getProductById selector will be more efficient once all data is loaded.
// If you still needed a direct API call for a single part without loading the store:
// export const fetchPartById = async (partId) => { ... logic to search all files ... };
// But for now, we'll rely on the store's getProductById.
