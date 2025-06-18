// src/App.jsx
import React, { Suspense, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import useProductStore from "./stores/productStore";
import Navabar from "./components/Navabar";
import { ClerkLoading, ClerkLoaded } from "@clerk/clerk-react";
import "./App.css";

// Lazy-loaded page components
const Home = React.lazy(() => import("./pages/Home"));
const SpecsListPage = React.lazy(() => import("./pages/Spec"));
const Builds = React.lazy(() => import("./pages/Build"));
const MyBuildsPage = React.lazy(() => import("./pages/MyBuildsPage"));
const PrebuiltDetailPage = React.lazy(() =>
  import("./pages/PrebuiltDetailPage")
);
const ProductDetailPage = React.lazy(() => import("./pages/ProductDetailPage"));
const CustomBuildPage = React.lazy(() => import("./pages/CustomBuildPage"));
const ChatPage = React.lazy(() => import("./pages/Chatpage"));
const UpgradeInputPage = React.lazy(() => import("./pages/UpgradeInputPage"));
const UpgradeResultPage = React.lazy(() => import("./pages/UpgradeResultPage"));

// A loader for when a page's code is being downloaded
function PageLoader() {
  return (
    <div className="min-h-screen bg-[#100C16] flex justify-center items-center text-white">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
    </div>
  );
}

// A loader for the initial data fetch OR Clerk loading
function AppLoader() {
  return (
    <div className="min-h-screen bg-[#100C16] flex flex-col justify-center items-center text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
      <p className="text-xl">Loading...</p>
    </div>
  );
}

function App() {
  // --- FIX APPLIED HERE ---
  // Select each piece of state individually to prevent re-renders.
  const isLoading = useProductStore((state) => state.isLoading);
  const fetchAllProductsNoPagination = useProductStore(
    (state) => state.fetchAllProductsNoPagination
  );

  // This useEffect will run once when the App first mounts to fetch all product data
  useEffect(() => {
    fetchAllProductsNoPagination();
  }, [fetchAllProductsNoPagination]);

  return (
    <>
      <ClerkLoading>
        {/* Show a loader while Clerk is initializing */}
        <AppLoader />
      </ClerkLoading>
      <ClerkLoaded>
        {/* Once Clerk is ready, check for our own app's data loading status */}
        {isLoading ? (
          <AppLoader />
        ) : (
          <>
            <Navabar />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/spec" element={<SpecsListPage />} />
                <Route path="/builds" element={<Builds />} />
                <Route
                  path="/builds/:buildId"
                  element={<PrebuiltDetailPage />}
                />
                <Route
                  path="/products/:productId"
                  element={<ProductDetailPage />}
                />
                <Route path="/my-builds" element={<MyBuildsPage />} />
                <Route path="/build" element={<CustomBuildPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/upgrade" element={<UpgradeInputPage />} />
                <Route path="/upgrade-result" element={<UpgradeResultPage />} />
              </Routes>
            </Suspense>
          </>
        )}
      </ClerkLoaded>
    </>
  );
}

export default App;
