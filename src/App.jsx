// src/App.jsx
import React, { Suspense } from "react"; // Import Suspense
import { Route, Routes } from "react-router-dom";
import "./App.css";

import useProductStore from "./stores/productStore";

// --- LAZY-LOADED PAGE COMPONENTS ---
// Each page's code will now be fetched only when it's needed.
const Home = React.lazy(() => import("./pages/Home"));
const SpecsListPage = React.lazy(() => import("./pages/Spec"));
const ChatPage = React.lazy(() => import("./pages/Chatpage"));
const CustomBuildPage = React.lazy(() => import("./pages/CustomBuildPage"));
const UpgradeInputPage = React.lazy(() => import("./pages/UpgradeInputPage"));
const UpgradeResultPage = React.lazy(() => import("./pages/UpgradeResultPage"));
const Builds = React.lazy(() => import("./pages/Build"));
const ProductDetailPage = React.lazy(() => import("./pages/ProductDetailPage"));

// This loader is for the INITIAL data fetch when the app starts. It's unchanged.
function AppLoader() {
  return (
    <div className="min-h-screen bg-[#100C16] flex flex-col justify-center items-center text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
      <p className="text-xl">Loading Essential Data...</p>
    </div>
  );
}

// This is a new loader that Suspense will use as a fallback while it's fetching page code.
function PageLoader() {
  return (
    <div className="min-h-screen bg-[#100C16] flex flex-col justify-center items-center text-white">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
      <p className="mt-4 text-lg">Loading Page...</p>
    </div>
  );
}

function App() {
  // This state check for the initial data load remains the same.
  const isLoading = useProductStore((state) => state.isLoading);

  if (isLoading) {
    return <AppLoader />;
  }

  // Once initial data is loaded, render the application with suspense-ready routing.
  return (
    <div>
      {/* The <Suspense> component will show the PageLoader fallback
          anytime you navigate to a page whose code hasn't been downloaded yet. */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/spec" element={<SpecsListPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/build" element={<CustomBuildPage />} />
          <Route path="/upgrade" element={<UpgradeInputPage />} />
          <Route path="/upgrade-result" element={<UpgradeResultPage />} />
          <Route path="/builds" element={<Builds />} />
          <Route path="/products/:productId" element={<ProductDetailPage />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
