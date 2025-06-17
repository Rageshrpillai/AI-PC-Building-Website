// src/pages/ProductDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import SkeletonPartCard from "../components/SkeletonPartCard";

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetch(`/api/products/${productId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setProduct(data.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError("Could not load product. Please try again.");
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0B13] flex flex-col justify-center items-center">
        <SkeletonPartCard />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#0D0B13] flex flex-col justify-center items-center text-white">
        <p>{error || "Product not found."}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-6 py-2 rounded bg-purple-700 hover:bg-purple-800 text-white"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0B13] pt-20 text-gray-100">
      <div className="max-w-4xl mx-auto p-4 flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/2 flex flex-col items-center">
          <img
            src={product.imageUrls?.[0] || "/placeholder.png"}
            alt={product.name}
            className="w-full max-w-xs h-64 object-contain rounded-xl shadow-xl bg-[#19122B]"
          />
        </div>
        <div className="flex-1 flex flex-col gap-4">
          <h1 className="text-3xl font-bold text-purple-300">{product.name}</h1>
          <div className="text-xl text-gray-300 font-semibold">
            ₹{product.price?.toLocaleString("en-IN") || "N/A"}
          </div>
          <div className="text-gray-400">{product.description}</div>
          <div className="mt-4">
            <h2 className="font-bold text-lg mb-2 text-purple-400">
              Technical Specs
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-300">
              {product.specs &&
                Object.entries(product.specs).map(([key, value]) => (
                  <li key={key} className="flex gap-2">
                    <span className="font-semibold capitalize">{key}:</span>
                    <span>{value}</span>
                  </li>
                ))}
            </ul>
          </div>
          <div className="mt-6 flex gap-4">
            <Link
              to="/spec"
              className="px-6 py-2 rounded bg-purple-700 hover:bg-purple-800 text-white font-semibold"
            >
              Back to Specs
            </Link>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 rounded bg-gray-700 hover:bg-gray-800 text-white"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
