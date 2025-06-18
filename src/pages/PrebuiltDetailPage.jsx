import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchPrebuiltById } from "../services/apiService";
import PartCard from "../components/PartCard";
import { FaStar } from "react-icons/fa";

export default function PrebuiltDetailPage() {
  const { buildId } = useParams();
  const navigate = useNavigate();
  const [prebuilt, setPrebuilt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const getPrebuiltData = async () => {
      setLoading(true);
      try {
        const data = await fetchPrebuiltById(buildId);
        setPrebuilt(data);
      } catch (err) {
        setError("Could not load the requested build.");
      } finally {
        setLoading(false);
      }
    };
    getPrebuiltData();
  }, [buildId]);

  // Correctly groups all resolved parts by their category, preserving duplicates.
  const partsByCategory = useMemo(() => {
    if (!prebuilt?.resolvedParts) return {};
    return prebuilt.resolvedParts.reduce((acc, part) => {
      const category = part.category || "other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(part);
      return acc;
    }, {});
  }, [prebuilt?.resolvedParts]);

  // Defines the correct display order for the component categories.
  const componentDisplayOrder = [
    "cpu",
    "motherboard",
    "ram",
    "gpu",
    "storage",
    "cooler",
    "psu",
    "case",
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0B13] flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error || !prebuilt) {
    return (
      <div className="min-h-screen bg-[#0D0B13] flex justify-center items-center text-red-400 text-xl">
        {error || "Prebuilt PC not found."}
      </div>
    );
  }

  const galleryImages =
    prebuilt.galleryImages?.length > 0
      ? prebuilt.galleryImages
      : [prebuilt.imageUrl];

  return (
    <div className="min-h-screen bg-[#0D0B13] pt-20 text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 text-sm">
          <Link to="/builds" className="text-purple-400 hover:underline">
            &larr; All Prebuilt PCs
          </Link>
        </div>

        {/* Main Info Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="flex flex-col-reverse sm:flex-row gap-4">
            <div className="flex sm:flex-col gap-3 justify-center">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-20 h-20 flex-shrink-0 rounded-lg bg-[#181328] p-1 border-2 transition-all ${
                    selectedImageIndex === idx
                      ? "border-purple-500"
                      : "border-transparent hover:border-gray-700"
                  }`}
                >
                  <img
                    src={img}
                    alt={`${prebuilt.name} thumbnail ${idx + 1}`}
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>
            <div className="flex-1 bg-[#100C16] rounded-xl flex items-center justify-center p-4 h-96">
              <img
                src={galleryImages[selectedImageIndex]}
                alt={prebuilt.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>

          {/* Prebuilt Details */}
          <div className="flex flex-col">
            <h1 className="text-3xl lg:text-4xl font-bold text-white">
              {prebuilt.name}
            </h1>
            <div className="flex items-center gap-3 my-3">
              <div className="flex text-yellow-400">
                {Array.from({ length: 5 }, (_, i) => (
                  <FaStar
                    key={i}
                    className={
                      i < Math.round(prebuilt.rating)
                        ? "text-yellow-400"
                        : "text-gray-600"
                    }
                  />
                ))}
              </div>
              <span className="text-gray-400">
                {prebuilt.rating?.toFixed(1) || "N/A"}
              </span>
            </div>
            <p className="text-gray-300 leading-relaxed mt-2">
              {prebuilt.description}
            </p>

            {prebuilt.features && prebuilt.features.length > 0 && (
              <div className="my-4">
                <ul className="list-disc space-y-2 pl-5 text-gray-300">
                  {prebuilt.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-auto flex items-center pt-6">
              <p className="text-4xl font-bold text-purple-400">
                ${prebuilt.price?.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

        {/* Core Components List Section */}
        <div className="my-16 pt-8 border-t border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-8">
            Core Components List
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(partsByCategory)
              .sort(
                ([catA], [catB]) =>
                  componentDisplayOrder.indexOf(catA) -
                  componentDisplayOrder.indexOf(catB)
              )
              .map(([category, parts]) =>
                parts.map((part, index) => (
                  <Link
                    to={`/products/${part.id}`}
                    key={`${category}-${part.id}-${index}`}
                  >
                    <div>
                      <h3 className="text-sm font-semibold text-purple-300 mb-2 capitalize">
                        {category}
                      </h3>
                      <PartCard product={part} />
                    </div>
                  </Link>
                ))
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
