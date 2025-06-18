// src/pages/MyBuildsPage.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { fetchUserBuilds } from "../services/apiService";
import Navabar from "../components/Navabar";
import BuildCard from "../components/BuildCard";
import { Link } from "react-router-dom";

export default function MyBuildsPage() {
  const { getToken } = useAuth();
  const [myBuilds, setMyBuilds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBuilds = async () => {
      setLoading(true);
      try {
        // Pass the getToken function to the service
        const builds = await fetchUserBuilds(getToken);
        setMyBuilds(builds);
        console.log("Fetched user builds:", builds);
      } catch (error) {
        console.error("Failed to load user builds", error);
      } finally {
        setLoading(false);
      }
    };
    loadBuilds();
  }, [getToken]);

  return (
    <div className="min-h-screen bg-[#100C16] text-gray-100">
      <Navabar />
      <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">My Saved Builds</h1>
        {loading ? (
          <p>Loading your builds...</p>
        ) : myBuilds.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {myBuilds.map((build) => (
              <BuildCard key={build.id} build={build} />
            ))}
          </div>
        ) : (
          <p className="text-gray-400">You haven't saved any builds yet.</p>
        )}
      </div>
    </div>
  );
}
