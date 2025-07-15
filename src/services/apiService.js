// src/services/apiService.js
import axios from "axios"; // Only import axios for the new admin functions

// --- Axios Instance for Admin-specific and Authenticated Calls ---
// This Axios instance will be used for new admin routes where we want
// to leverage Axios's interceptors for consistent token handling.
const adminApi = axios.create({
  // CORRECTED: Set baseURL to the root of the API server.
  // If your backend is served directly from the root (e.g., http://localhost:3000),
  // then VITE_API_BASE_URL should be empty or just '/'.
  // All specific API paths (like /api/products/all) will then be appended correctly.
  baseURL: import.meta.env.VITE_API_BASE_URL || "/", // Changed from '/api' to '/'
  headers: {
    "Content-Type": "application/json",
  },
});

// Axios Request Interceptor for Admin API calls
// This interceptor expects the `getToken` function to be passed in the config
// under a custom property like `config.clerkTokenProvider`.
adminApi.interceptors.request.use(
  async (config) => {
    if (config.clerkTokenProvider) {
      const token = await config.clerkTokenProvider();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Remove the custom token provider from config to avoid sending it in the request body
      delete config.clerkTokenProvider;
    }
    return config;
  },
  (error) => {
    console.error("Axios Admin API Request Error:", error);
    return Promise.reject(error);
  }
);

// Axios Response Interceptor for Admin API calls (for error handling)
adminApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error(
      "Axios Admin API Response Error:",
      error.response || error.message
    );
    if (error.response) {
      if (error.response.status === 401) {
        console.warn("Admin Unauthorized: Please log in as an admin.");
      } else if (error.response.status === 403) {
        console.warn("Admin Forbidden: You do not have admin permissions.");
      }
    }
    return Promise.reject(error);
  }
);

// --- Existing Fetch API Calls (Preserved and Updated for Token if Protected) ---

// Fetches a paginated list of products.
export const fetchProducts = async (category = "all", page = 1) => {
  const endpoint =
    category === "all"
      ? `/api/products?page=${page}`
      : `/api/products?category=${category.toLowerCase()}&page=${page}`;

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(
      `API call failed for products list: ${response.statusText}`
    );
  }
  return response.json();
};

// Fetches ALL products for pages that need the full list.
// This is a public endpoint on the backend, so no token is needed.
export const fetchAllProducts = async () => {
  // Using the adminApi instance. The baseURL is now '/', so '/api/products/all' is correct.
  const response = await adminApi.get("/api/products/all");
  return response.data.data; // Your API returns { data: [...] } for /products/all
};

// Fetches all official prebuilt PCs.
export const fetchPrebuilds = async () => {
  const response = await fetch("/api/builds");
  if (!response.ok) {
    throw new Error(`API call failed for prebuilds: ${response.statusText}`);
  }
  return response.json(); // This returns the { data: [...] } object
};

// Fetches a single product by its ID.
export const fetchProductById = async (productId) => {
  if (!productId) throw new Error("Product ID is required");
  const response = await fetch(`/api/products/${productId}`);
  if (!response.ok) {
    throw new Error(
      `API call failed for product ${productId}: ${response.statusText}`
    );
  }
  const result = await response.json();
  return result.data;
};

// Fetches a batch of products from an array of IDs.
export const fetchProductsByIds = async (ids) => {
  if (!ids || ids.length === 0) return [];
  const response = await fetch(`/api/products/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    throw new Error(
      `API call failed for batch products: ${response.statusText}`
    );
  }
  const result = await response.json();
  return result.data || [];
};

// Fetches a single prebuilt PC by its ID.
// This route is protected on the backend, so it requires the Clerk token.
export const fetchPrebuiltById = async (buildId, getToken) => {
  if (!buildId) throw new Error("Build ID is required");
  if (!getToken)
    throw new Error(
      "getToken function is required for authenticated prebuilt fetch."
    );

  const token = await getToken();
  if (!token) throw new Error("Authentication token not available.");

  const response = await fetch(`/api/builds/${buildId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error(
      `API call failed for prebuilt ${buildId}: ${response.statusText}`
    );
  }
  const result = await response.json();
  return result.data;
};

// Fetches all saved builds for the currently logged-in user.
// This route is protected on the backend, so it requires the Clerk token.
export const fetchUserBuilds = async (getToken) => {
  const token = await getToken();
  if (!token) throw new Error("Authentication token not available.");
  const response = await fetch("/api/user/builds", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`API call failed for user builds: ${response.statusText}`);
  }
  const result = await response.json();
  return result.data || [];
};

// --- New Admin API Calls (Using Axios for consistent token handling) ---

// Admin: Create a new product
export const createProduct = async (productData, getToken) => {
  if (!getToken)
    throw new Error(
      "getToken function is required for admin product creation."
    );
  const response = await adminApi.post("/api/admin/products", productData, {
    clerkTokenProvider: getToken, // Pass the getToken function to the interceptor
  });
  return response.data;
};

// Admin: Update an existing product
export const updateProduct = async (productId, productData, getToken) => {
  if (!getToken)
    throw new Error("getToken function is required for admin product update.");
  const response = await adminApi.put(
    `/api/admin/products/${productId}`,
    productData,
    {
      clerkTokenProvider: getToken,
    }
  );
  return response.data;
};

// Admin: Delete a product
export const deleteProduct = async (productId, getToken) => {
  if (!getToken)
    throw new Error(
      "getToken function is required for admin product deletion."
    );
  const response = await adminApi.delete(`/api/admin/products/${productId}`, {
    clerkTokenProvider: getToken,
  });
  return response.data;
};

// Admin: Create a new prebuilt PC
export const createPrebuilt = async (prebuiltData, getToken) => {
  if (!getToken)
    throw new Error(
      "getToken function is required for admin prebuilt creation."
    );
  const response = await adminApi.post("/api/admin/prebuilts", prebuiltData, {
    clerkTokenProvider: getToken,
  });
  return response.data;
};

// Admin: Update an existing prebuilt PC
export const updatePrebuilt = async (prebuiltId, prebuiltData, getToken) => {
  if (!getToken)
    throw new Error("getToken function is required for admin prebuilt update.");
  const response = await adminApi.put(
    `/api/admin/prebuilts/${prebuiltId}`,
    prebuiltData,
    {
      clerkTokenProvider: getToken,
    }
  );
  return response.data;
};

// Admin: Delete a prebuilt PC
export const deletePrebuilt = async (prebuiltId, getToken) => {
  if (!getToken)
    throw new Error(
      "getToken function is required for admin prebuilt deletion."
    );
  const response = await adminApi.delete(`/api/admin/prebuilts/${prebuiltId}`, {
    clerkTokenProvider: getToken,
  });
  return response.data;
};

// Admin: Fetch all users
export const fetchAllUsers = async (getToken) => {
  if (!getToken)
    throw new Error("getToken function is required for admin user fetch.");
  const response = await adminApi.get("/api/admin/users", {
    clerkTokenProvider: getToken,
  });
  return response.data.data; // Assuming your API returns { data: [...] } for users
};

// Admin: Update a user (e.g., change role)
export const updateUser = async (userId, userData, getToken) => {
  if (!getToken)
    throw new Error("getToken function is required for admin user update.");
  const response = await adminApi.put(`/api/admin/users/${userId}`, userData, {
    clerkTokenProvider: getToken,
  });
  return response.data;
};

// Admin: Delete a user
export const deleteUser = async (userId, getToken) => {
  if (!getToken)
    throw new Error("getToken function is required for admin user deletion.");
  const response = await adminApi.delete(`/api/admin/users/${userId}`, {
    clerkTokenProvider: getToken,
  });
  return response.data;
};

// Export the axios instance as default (optional, but useful if you need the raw instance)
export default adminApi;
