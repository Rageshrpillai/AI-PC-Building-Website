// src/App.jsx
import React from "react";
import { Route, Routes } from "react-router-dom";
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
      <p className="text-xl">Loading Essential Data...</p>
    </div>
  );
}

function App() {
  // Only get the isLoading state from the store
  const isLoading = useProductStore((state) => state.isLoading);

  // The application-level loading gate. This will now work reliably.
  if (isLoading) {
    return <AppLoader />;
  }

  // Once loading is false, render the application
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
