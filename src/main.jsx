// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import useProductStore from "./stores/productStore"; // Import the store

// --- THE FINAL SOLUTION: FETCH DATA BEFORE RENDERING ---
// Get the fetch function directly from the store's initial state
const { fetchAllProducts, fetchPrebuilds } = useProductStore.getState();

// Start fetching data immediately
const initializeData = async () => {
  await fetchAllProducts();
  await fetchPrebuilds();
};
initializeData();
// ---------------------------------------------------------

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
