// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import useProductStore from "./stores/productStore";
import { ClerkProvider } from "@clerk/clerk-react";

// Only fetch all products (no pagination)
const { fetchAllProductsNoPagination, fetchPrebuilds } =
  useProductStore.getState();
const initializeData = async () => {
  await fetchAllProductsNoPagination();
  await fetchPrebuilds();
};
initializeData();
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error(
    "Missing Clerk Publishable Key. Please set VITE_CLERK_PUBLISHABLE_KEY in .env.local"
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    </BrowserRouter>
  </React.StrictMode>
);
