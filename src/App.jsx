// src/App.jsx
import React, { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";

import Home from "./pages/Home";
import SpecsListPage from "./pages/Spec";
import ChatPage from "./pages/Chatpage";
import CustomBuildPage from "./pages/CustomBuildPage";
import UpgradeInputPage from "./pages/UpgradeInputPage";
import useProductStore from "./stores/productStore";

function App() {
  const fetchAllProducts = useProductStore((state) => state.fetchAllProducts);
  const hasFetched = useProductStore((state) => state.hasFetchedInitialData);
  const isLoading = useProductStore((state) => state.isLoading);

  useEffect(() => {
    if (!hasFetched && !isLoading) {
      console.log("[App.jsx] Initializing product data fetch via store.");
      fetchAllProducts();
    }
  }, [fetchAllProducts, hasFetched, isLoading]);

  return (
    <>
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/spec" element={<SpecsListPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/build" element={<CustomBuildPage />} />
          <Route path="/upgrade" element={<UpgradeInputPage />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
