// src/components/AdminRoute.jsx

import { useUser } from "@clerk/clerk-react";
import { Navigate, Outlet } from "react-router-dom";

// A simple loading component to show while we check the user's status
const Loading = () => (
  <div className="min-h-screen bg-[#0D0B13] flex justify-center items-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
  </div>
);

export default function AdminRoute() {
  // The useUser hook gives us detailed information about the current user
  const { isLoaded, isSignedIn, user } = useUser();

  // If Clerk is still loading the user data, show a loading spinner
  if (!isLoaded) {
    return <Loading />;
  }

  // Check if the user is signed in AND if their public metadata contains role: "admin"
  const isAdmin = isSignedIn && user?.publicMetadata?.role === "admin";

  if (isAdmin) {
    // If they are an admin, render the actual admin page component
    return <Outlet />;
  } else {
    // If they are not an admin (or not signed in), redirect them to the homepage
    return <Navigate to="/" replace />;
  }
}
