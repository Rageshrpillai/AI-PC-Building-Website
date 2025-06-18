import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import SkeletonPartCard from "../components/SkeletonPartCard";
import CompactPartCard from "../components/CompactPartCard";
export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [compatibleProducts, setCompatibleProducts] = useState([]);
  const [loadingCompatibles, setLoadingCompatibles] = useState(false);

  // --- DATA FETCHING ---
  // Initial fetch for the main product
  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${productId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Product not found");
        return res.json();
      })
      .then((data) => {
        setProduct(data.data);
      })
      .catch((err) => {
        setError("Could not load the product. It may not exist.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [productId]);

  function getStandardCategoryName(key) {
    const names = {
      cpu: "CPU",
      motherboard: "Motherboard",
      ram: "RAM",
      gpu: "GPU",
      storage: "Storage",
      psu: "PSU",
      cooler: "Cooler",
      case: "Case",
    };
    return names[key] || key;
  }

  // Fetch full details for compatible products after the main product has loaded
  useEffect(() => {
    // Check if the product and its compatibleDevices exist
    if (
      product &&
      product.compatibleDevices &&
      product.compatibleDevices.length > 0
    ) {
      setLoadingCompatibles(true);
      fetch(`/api/products/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: product.compatibleDevices }),
      })
        .then((res) => res.json())
        .then((data) => {
          setCompatibleProducts(data.data || []);
        })
        .catch((err) =>
          console.error("Failed to fetch compatible products:", err)
        )
        .finally(() => setLoadingCompatibles(false));
    }
  }, [product]);

  const handleCustomizeBuild = () => {
    if (!product) return;

    // Use the helper function to get the correct capitalized name
    const categoryNameForBuild = getStandardCategoryName(product.category);

    navigate("/build", {
      state: {
        selectedComponent: product,
        categoryName: categoryNameForBuild, // Send the correct name
      },
    });
  };

  // --- NEW: Group compatible products by category ---
  const groupedCompatibleProducts = useMemo(() => {
    if (!compatibleProducts) return {};
    return compatibleProducts.reduce((acc, product) => {
      const category = product.category || "other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {});
  }, [compatibleProducts]);

  // --- UI RENDER LOGIC ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0B13] flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#0D0B13] flex flex-col justify-center items-center text-white">
        <p className="text-xl text-red-400">{error || "Product not found."}</p>
        <button
          onClick={() => navigate("/spec")}
          className="mt-4 px-6 py-2 rounded bg-purple-700 hover:bg-purple-800 text-white"
        >
          Back to Specs
        </button>
      </div>
    );
  }

  const renderStars = (rate = 0) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FaStar
        key={i}
        className={i < Math.round(rate) ? "text-yellow-400" : "text-gray-600"}
      />
    ));
  };

  const galleryImages =
    product.galleryImages && product.galleryImages.length > 0
      ? product.galleryImages
      : product.imageUrls || ["/images/placeholder.jpg"];

  return (
    <div className="h-auto bg-[#0D0B13] pt-20 text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 text-sm">
          <Link to="/spec" className="text-purple-400 hover:underline">
            &larr; All Specs
          </Link>
        </div>

        {/* Main Product Section */}
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
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    className="w-full h-full object-fill"
                  />
                </button>
              ))}
            </div>
            <div className="flex-1 bg-[#100C16] rounded-xl flex items-center justify-center p-2 h-96">
              <img
                src={galleryImages[selectedImageIndex]}
                alt={product.name}
                className="w-full h-full object-fill"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <h1 className="text-3xl lg:text-4xl font-bold text-white">
              {product.name}
            </h1>
            <div className="flex items-center gap-3 my-3">
              <div className="flex">{renderStars(product.rating?.rate)}</div>
              <span className="text-gray-400">
                {product.rating?.count || 0} reviews
              </span>
            </div>
            <p className="text-gray-300 leading-relaxed mt-2 mb-6">
              {product.description}
            </p>

            <div className="mt-auto flex items-center justify-between gap-4 pt-6">
              <p className="text-4xl font-bold text-purple-400">
                ${product.price?.toLocaleString("en-IN")}
              </p>
              <button
                onClick={handleCustomizeBuild}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold text-base transition flex items-center gap-2"
              >
                <span role="img" aria-label="Build">
                  🧩
                </span>
                Customise this build
              </button>
            </div>
          </div>
        </div>

        {/* Features & Specifications Section */}
        <div className="my-12 pt-8 border-t border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            {/* Key Features Column */}
            <div>
              <h2 className="font-bold text-xl text-purple-400 mb-4">
                Key Features
              </h2>
              <ul className="list-disc space-y-2 pl-5 text-gray-300">
                {product.features &&
                  product.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
              </ul>
            </div>
            {/* Technical Details Column */}
            <div>
              <h2 className="font-bold text-xl text-purple-400 mb-4">
                Technical Details
              </h2>
              <ul className="space-y-3">
                {/* The object here now includes the brand */}
                {product.specs &&
                  Object.entries({
                    brand: product.brand,
                    ...product.specs,
                  }).map(([key, value]) => (
                    <li
                      key={key}
                      className="flex justify-between text-sm border-b border-gray-800/50 pb-2"
                    >
                      <span className="font-medium text-gray-400 capitalize">
                        {key.replace(/_/g, " ")}
                      </span>
                      <span className="text-white font-semibold">
                        {String(value)}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Compatible Products Section (now dynamically grouped) */}
        <div className="mt-16 space-y-12">
          {Object.entries(groupedCompatibleProducts).map(
            ([category, devices]) => (
              <div key={category}>
                <h2 className="text-2xl font-bold text-white mb-6 capitalize">
                  Compatible {category}s
                </h2>
                {loadingCompatibles ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <SkeletonPartCard key={i} />
                    ))}
                  </div>
                ) : devices.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                    {devices.map((device) => (
                      <Link to={`/products/${device.id}`} key={device.id}>
                        {/* Use the new component */}
                        <CompactPartCard product={device} />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    No compatible devices found for this category.
                  </p>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
