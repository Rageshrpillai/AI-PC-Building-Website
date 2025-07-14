// src/services/apiService.js

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
export const fetchAllProducts = async () => {
  const response = await fetch("/api/products/all");
  if (!response.ok) {
    throw new Error("Failed to fetch all products");
  }
  const result = await response.json();
  return result.data;
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
export const fetchPrebuiltById = async (buildId) => {
  if (!buildId) throw new Error("Build ID is required");
  const response = await fetch(`/api/builds/${buildId}`);
  if (!response.ok) {
    throw new Error(
      `API call failed for prebuilt ${buildId}: ${response.statusText}`
    );
  }
  const result = await response.json();
  return result.data;
};

// Fetches all saved builds for the currently logged-in user.
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
