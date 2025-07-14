// src/pages/AdminLoginPage.jsx
import React, { useEffect } from "react";
import { SignIn, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

export default function AdminLoginPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded) {
      // Clerk is still loading, wait for it.
      // Do not attempt to redirect until Clerk is loaded to ensure `isSignedIn` and `user` are definitive.
      return;
    }

    if (isSignedIn) {
      // If the user is ALREADY signed in when they land on /admin/login,
      // decide where to send them based on their role.
      console.log(
        "AdminLoginPage: User is already signed in. Checking admin role."
      );
      if (user.publicMetadata?.role === "admin") {
        console.log(
          "AdminLoginPage: User is an admin. Redirecting to dashboard."
        );
        navigate("/admin/dashboard");
      } else {
        console.warn(
          "AdminLoginPage: User is signed in but not an admin. Redirecting to home."
        );
        navigate("/");
      }
    }
    // If not signed in, the SignIn component in the render will correctly show the login form.
  }, [isLoaded, isSignedIn, user, navigate]); // Dependencies for useEffect

  // Only render the SignIn component if Clerk is loaded AND the user is NOT signed in.
  // Otherwise, display a loading state or a blank screen as the useEffect handles redirection.
  if (!isLoaded || isSignedIn) {
    return (
      <div className="min-h-screen bg-[#100C16] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center text-white">
          {!isLoaded && <p>Loading authentication state...</p>}
          {isLoaded && isSignedIn && (
            <p>Redirecting to dashboard or home page...</p>
          )}
          {/* You could add a spinner here */}
        </div>
      </div>
    );
  }

  // If we reach here, Clerk is loaded and the user is NOT signed in, so show the login form.
  return (
    <div className="min-h-screen bg-[#100C16] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            Sign in to your Admin Account
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            For authorized personnel only.
          </p>
        </div>
        <SignIn
          routing="path"
          path="/admin/login" // This must match the route path in App.jsx
          signUpUrl="/admin/signup" // Consider removing this if you don't allow public sign-ups on admin login
          redirectUrl="/admin/dashboard" // Clerk will handle redirection after successful sign-in
        />
      </div>
    </div>
  );
}
