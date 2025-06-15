// src/App.jsx
import React, { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { shallow } from "zustand/shallow"; // Import shallow from Zustand
import "./App.css";

import Home from "./pages/Home";
import SpecsListPage from "./pages/Spec";
import ChatPage from "./pages/Chatpage";
import CustomBuildPage from "./pages/CustomBuildPage";
import UpgradeInputPage from "./pages/UpgradeInputPage";
import UpgradeResultPage from "./pages/UpgradeResultPage";
import useProductStore from "./stores/productStore";
import Builds from "./pages/Build";

// A simple full-page loading component
function AppLoader() {
  return (
    <div className="min-h-screen bg-[#100C16] flex flex-col justify-center items-center text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
      <p className="text-xl">Loading Components...</p>
    </div>
  );
}

function App() {
  // --- THIS IS THE CRITICAL FIX ---
  // We are now using the `shallow` function to prevent infinite loops.
  const { fetchAllProducts, fetchPrebuilds, isLoading } = useProductStore(
    (state) => ({
      fetchAllProducts: state.fetchAllProducts,
      fetchPrebuilds: state.fetchPrebuilds,
      isLoading: state.isLoading,
    }),
    shallow // This tells Zustand to be smarter about re-rendering
  );

  // This useEffect will now run safely only once on mount
  useEffect(() => {
    const initializeData = async () => {
      await fetchAllProducts();
      await fetchPrebuilds();
    };

    initializeData();
  }, [fetchAllProducts, fetchPrebuilds]);

  // The application-level loading gate
  if (isLoading) {
    return <AppLoader />;
  }

  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/spec" element={<SpecsListPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/build" element={<CustomBuildPage />} />
        <Route path="/upgrade" element={<UpgradeInputPage />} />
        <Route path="/upgrade-result" element={<UpgradeResultPage />} />
        <Route path="/builds" element={<Builds />} />
      </Routes>
    </div>
  );
}

export default App;
