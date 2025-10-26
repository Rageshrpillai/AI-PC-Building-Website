// src/App.jsx
import React, { Suspense, useEffect } from "react";
import { Route, Routes, useLocation, Outlet } from "react-router-dom";
import useProductStore from "./stores/productStore";
import Navabar from "./components/Navabar";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import {
  ClerkLoading,
  ClerkLoaded,
  SignedIn,
  RedirectToSignIn,
} from "@clerk/clerk-react";
import "./App.css";

// Lazy-loaded page components
const Home = React.lazy(() => import("./pages/Home"));
const AdminLoginPage = React.lazy(() => import("./pages/AdminLoginPage"));
const AdminDashboardPage = React.lazy(() =>
  import("./pages/AdminDashboardPage")
);

const AdminProductsPage = React.lazy(() => import("./pages/AdminProductsPage"));
const AdminPrebuiltsPage = React.lazy(() =>
  import("./pages/AdminPrebuiltsPage")
);
const AdminUsersPage = React.lazy(() => import("./pages/AdminUsersPage"));

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

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#100C16] flex justify-center items-center text-white">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
    </div>
  );
}

function AppLoader() {
  return (
    <div className="min-h-screen bg-[#100C16] flex flex-col justify-center items-center text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
      <p className="text-xl">Loading...</p>
    </div>
  );
}

function App() {
  console.log("App component rendering...");

  const isLoadingStore = useProductStore((state) => state.isLoading);
  const fetchAllProductsNoPagination = useProductStore(
    (state) => state.fetchAllProductsNoPagination
  );
  const hasFetchedInitialData = useProductStore(
    (state) => state.hasFetchedInitialData
  );

  const location = useLocation();
  const isAdminPath = location.pathname.startsWith("/admin");

  console.log(
    "App state - isAdminPath:",
    isAdminPath,
    "hasFetchedInitialData:",
    hasFetchedInitialData,
    "isLoadingStore:",
    isLoadingStore
  );

  useEffect(() => {
    console.log("App useEffect triggered.");
    console.log(
      "   -- Inside useEffect conditions: !isAdminPath:",
      !isAdminPath,
      "!hasFetchedInitialData:",
      !hasFetchedInitialData,
      "!isLoadingStore:",
      !isLoadingStore
    );

    if (!isAdminPath && !hasFetchedInitialData && !isLoadingStore) {
      console.log("Calling fetchAllProductsNoPagination...");
      fetchAllProductsNoPagination();
    } else {
      console.log("fetchAllProductsNoPagination NOT called. Reasons:");
      if (isAdminPath) console.log("   - Currently on an admin path.");
      if (hasFetchedInitialData)
        console.log("   - Initial data already fetched.");
      if (isLoadingStore) console.log("   - Store is already loading.");
    }
  }, [
    isAdminPath,
    hasFetchedInitialData,
    isLoadingStore,
    fetchAllProductsNoPagination,
  ]);

  console.log(
    "App rendering decision - isLoadingStore:",
    isLoadingStore,
    "isAdminPath:",
    isAdminPath
  );

  return (
    <>
      <ClerkLoading>
        {console.log("Rendering ClerkLoading...")}
        <AppLoader />
      </ClerkLoading>
      <ClerkLoaded>
        {console.log(
          "ClerkLoaded. Deciding what to render based on isLoadingStore."
        )}
        {isLoadingStore && !isAdminPath ? (
          <>
            {console.log("Rendering AppLoader due to isLoadingStore...")}
            <AppLoader />
          </>
        ) : (
          <>
            {console.log("Rendering main app content (not AppLoader).")}
            {!isAdminPath && <Navabar />}
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes - Anyone can access these */}
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
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/upgrade" element={<UpgradeInputPage />} />
                <Route path="/upgrade-result" element={<UpgradeResultPage />} />

                {/* FIXED: /build is now public - only save requires auth */}
                <Route path="/build" element={<CustomBuildPage />} />

                <Route path="/admin/login" element={<AdminLoginPage />} />

                {/* Protected Routes - Require Sign In */}
                <Route
                  element={
                    <SignedIn>
                      <Outlet />
                    </SignedIn>
                  }
                >
                  {/* Only My Builds requires authentication */}
                  <Route path="/my-builds" element={<MyBuildsPage />} />
                </Route>

                {/* Clerk's default sign-in/sign-up routes */}
                <Route path="/sign-in/*" element={<RedirectToSignIn />} />
                <Route path="/sign-up/*" element={<RedirectToSignIn />} />

                {/* Admin Protected Routes */}
                <Route path="/admin/*" element={<AdminProtectedRoute />}>
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="dashboard" element={<AdminDashboardPage />} />
                  <Route path="products" element={<AdminProductsPage />} />
                  <Route path="prebuilds" element={<AdminPrebuiltsPage />} />
                  <Route path="users" element={<AdminUsersPage />} />
                </Route>

                {/* Catch-all Route */}
                <Route path="*" element={<Home />} />
              </Routes>
            </Suspense>
          </>
        )}
      </ClerkLoaded>
    </>
  );
}

export default App;
