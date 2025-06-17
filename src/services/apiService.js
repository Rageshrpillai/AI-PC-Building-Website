// src/services/apiService.js

/**
 * Fetches products from your backend API.
 * It can fetch all products or filter by a specific category.
 * @param {string} category - The category to fetch (e.g., 'cpu', 'gpu', or 'all').
 * @returns {Promise<Array>} - A promise that resolves to an array of products.
 */

export const fetchProducts = async (category = "all", page = 1) => {
  // The endpoint now includes the page number
  const endpoint =
    category === "all"
      ? `/api/products?page=${page}`
      : `/api/products?category=${category.toLowerCase()}&page=${page}`;

  try {
    console.log(`[apiService] Fetching page ${page} from: ${endpoint}`);
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }
    // We now return the entire result object, which includes data and pagination info
    const result = await response.json();
    return result;
  } catch (error) {
    console.error(
      `[apiService] Failed to fetch products from ${endpoint}:`,
      error
    );
    throw error;
  }
};

/**
 * Fetches all prebuilt PCs from the backend API.
 * @returns {Promise<Array>} - A promise that resolves to an array of prebuilt PCs.
 */
export const fetchPrebuilds = async () => {
  const endpoint = "/api/builds";
  try {
    console.log(
      `[apiService] Fetching prebuilt PCs from backend API: ${endpoint}`
    );
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error(
      `[apiService] Failed to fetch prebuilt PCs from ${endpoint}:`,
      error
    );
    throw error;
  }
};

/**
 * Fetches a single product by its ID from the backend API.
 * @param {string} productId - The ID of the product to fetch.
 * @returns {Promise<Object>} - A promise that resolves to the product object.
 */
export const fetchProductById = async (productId) => {
  const endpoint = `/api/products/${productId}`;
  try {
    console.log(`[apiService] Fetching single product: ${endpoint}`);
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const result = await response.json();
    return result.data; // Return the single product object
  } catch (error) {
    console.error(`[apiService] Failed to fetch product ${productId}:`, error);
    // Re-throw the error so the component can catch it and display an error message
    throw error;
  }
};
