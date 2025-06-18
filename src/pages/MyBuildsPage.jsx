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
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const loadBuilds = async () => {
      setLoading(true);
      try {
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

  const handleDeleteBuild = async (buildId) => {
    if (!window.confirm("Are you sure you want to delete this build?")) return;
    setDeletingId(buildId);
    try {
      const token = await getToken();
      const response = await fetch(`/api/builds/${buildId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setMyBuilds((prev) =>
          prev.filter((b) => b._id !== buildId && b.id !== buildId)
        );
      } else {
        alert("Failed to delete build.");
      }
    } catch (error) {
      alert("Delete request failed.");
    } finally {
      setDeletingId(null);
    }
  };

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
              <div key={build._id || build.id} className="relative">
                <BuildCard build={build} />
                <button
                  onClick={() => handleDeleteBuild(build._id || build.id)}
                  className={`absolute top-2 right-2 px-3 py-1 text-xs bg-red-700 text-white rounded hover:bg-red-800 z-10 ${
                    deletingId === (build._id || build.id)
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={deletingId === (build._id || build.id)}
                >
                  {deletingId === (build._id || build.id)
                    ? "Deleting..."
                    : "Delete"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">You haven't saved any builds yet.</p>
        )}
      </div>
    </div>
  );
}
