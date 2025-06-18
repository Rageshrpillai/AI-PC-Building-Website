/**
 * Fetches products from your backend API.
 * It can fetch all products or filter by a specific category.
 * @param {string} category - The category to fetch (e.g., 'cpu', 'gpu', or 'all').
 * @param {number} page - The page number for pagination.
 * @returns {Promise<Object>} - A promise that resolves to a result object with data and pagination info.
 */
export const fetchProducts = async (category = "all", page = 1) => {
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
    throw error;
  }
};

/**
 * Fetches a single prebuilt PC by its ID from the backend API.
 * The backend will resolve the parts for us.
 * @param {string} buildId - The ID of the prebuilt to fetch.
 * @returns {Promise<Object>} - A promise that resolves to the prebuilt object with resolved parts.
 */
export const fetchPrebuiltById = async (buildId) => {
  const endpoint = `/api/builds/${buildId}`;
  try {
    console.log(`[apiService] Fetching prebuilt PC: ${endpoint}`);
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error(
      `[apiService] Failed to fetch prebuilt PC ${buildId}:`,
      error
    );
    throw error;
  }
};

/**
 * Fetches all saved builds for the currently logged-in user.
 * @param {function} getToken - The getToken function from Clerk's useAuth hook.
 * @returns {Promise<Array>} - A promise that resolves to an array of the user's saved builds.
 */
export const fetchUserBuilds = async (getToken) => {
  const endpoint = "/api/user/builds";
  try {
    const token = await getToken(); // Get the session token from Clerk
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error(`[apiService] Failed to fetch user builds:`, error);
    throw error;
  }
};
