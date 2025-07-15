// src/services/apiService.js
import axios from "axios";

// --- Axios Instance for Admin-specific and Authenticated Calls ---
const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Axios Request Interceptor for Admin API calls
adminApi.interceptors.request.use(
  async (config) => {
    if (config.clerkTokenProvider) {
      const token = await config.clerkTokenProvider();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      delete config.clerkTokenProvider;
    }
    return config;
  },
  (error) => {
    console.error("Axios Admin API Request Error:", error);
    return Promise.reject(error);
  }
);

// Axios Response Interceptor for Admin API calls
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

// --- Existing Fetch API Calls ---

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

export const fetchAllProducts = async () => {
  const response = await fetch("/api/products/all");
  if (!response.ok) {
    throw new Error("Failed to fetch all products");
  }
  const result = await response.json();
  return result.data;
};

export const fetchPrebuilds = async () => {
  const response = await fetch("/api/builds");
  if (!response.ok) {
    throw new Error(`API call failed for prebuilds: ${response.statusText}`);
  }
  return response.json();
};

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

export const fetchProductsByIds = async (ids, getToken) => {
  if (!ids || ids.length === 0) return [];
  const token = await getToken();
  if (!token) throw new Error("Authentication token not available.");

  const response = await fetch(`/api/products/batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
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

// --- New Admin API Calls ---

export const createProduct = async (productData, getToken) => {
  const response = await adminApi.post("/api/admin/products", productData, {
    clerkTokenProvider: getToken,
  });
  return response.data;
};

export const deleteProduct = async (productId, getToken) => {
  const response = await adminApi.delete(`/api/admin/products/${productId}`, {
    clerkTokenProvider: getToken,
  });
  return response.data;
};

export const fetchAllUsers = async (getToken) => {
  const response = await adminApi.get("/api/admin/users", {
    clerkTokenProvider: getToken,
  });
  return response.data.data;
};

export default adminApi;
