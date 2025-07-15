// src/pages/MyBuildsPage.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { fetchUserBuilds } from "../services/apiService";
import Navabar from "../components/Navabar";
import MiniBuildCard from "../components/MiniBuildCard"; // Assuming this component exists
import { Link } from "react-router-dom";

export default function MyBuildsPage() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [userBuilds, setUserBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUserBuilds = async () => {
      if (!isLoaded || !isSignedIn) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const builds = await fetchUserBuilds(getToken);
        // REMOVED FILTER: Now shows all builds where createdBy matches userId
        setUserBuilds(builds); // Directly set the builds without filtering by isUserBuild
      } catch (err) {
        console.error("Error fetching user builds:", err);
        setError("Failed to load your saved builds. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadUserBuilds();
  }, [isLoaded, isSignedIn, getToken]); // Re-run when auth state changes

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-[#100C16] flex justify-center items-center text-white">
        <p>Please sign in to view your builds.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#100C16] flex justify-center items-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        <p className="text-xl ml-4">Loading your builds...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#100C16] flex flex-col justify-center items-center text-white p-4">
        <p className="text-red-500 text-xl mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()} // Simple retry by reloading page
          className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#0D0B13] min-h-screen">
      <Navabar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <h1 className="text-3xl font-bold text-white mb-8">My Saved Builds</h1>

        {userBuilds.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            <p className="text-lg mb-4">
              You haven't saved any custom builds yet!
            </p>
            <Link
              to="/build"
              className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-transform duration-200 hover:scale-105"
            >
              Start a Custom Build
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {userBuilds.map((build) => (
              <MiniBuildCard key={build.id || build._id} build={build} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
