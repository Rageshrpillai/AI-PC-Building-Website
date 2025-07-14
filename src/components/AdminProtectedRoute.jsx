// src/components/AdminProtectedRoute.jsx

import { useUser } from "@clerk/clerk-react";
import { Navigate, Outlet } from "react-router-dom";

// A simple loading component to show while we check the user's status
const Loading = () => (
  <div className="min-h-screen bg-[#0D0B13] flex justify-center items-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
  </div>
);

export default function AdminProtectedRoute() {
  // Make sure this is the component you are importing in App.jsx
  const { isLoaded, isSignedIn, user } = useUser();

  // --- DEBUGGING LOGS ---
  console.log("AdminProtectedRoute: isLoaded =", isLoaded);
  console.log("AdminProtectedRoute: isSignedIn =", isSignedIn);
  if (user) {
    console.log("AdminProtectedRoute: user ID =", user.id);
    console.log(
      "AdminProtectedRoute: user publicMetadata =",
      user.publicMetadata
    );
    console.log(
      "AdminProtectedRoute: user publicMetadata.role =",
      user.publicMetadata?.role
    );
  } else {
    console.log("AdminProtectedRoute: user object is null or undefined.");
  }
  // --- END DEBUGGING LOGS ---

  if (!isLoaded) {
    return <Loading />;
  }

  // Check if the user is signed in AND if their public metadata contains role: "admin"
  const isAdmin = isSignedIn && user?.publicMetadata?.role === "admin";

  console.log("AdminProtectedRoute: isAdmin =", isAdmin); // Log the final isAdmin value

  if (isAdmin) {
    return <Outlet />; // User is an admin, render the child route
  } else {
    // If they are not an admin (or not signed in), redirect them to the homepage
    console.log(
      "AdminProtectedRoute: User is not admin or not signed in. Redirecting to /."
    );
    return <Navigate to="/" replace />;
  }
}
