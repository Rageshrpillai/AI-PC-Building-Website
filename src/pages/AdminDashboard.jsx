// src/pages/AdminDashboard.jsx

import React from "react";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { fetchAllProductsForAdmin } from "../services/apiService";

const LoadingSpinner = () => (
  <div className="text-center p-10">Loading Products...</div>
);
const ErrorDisplay = ({ message }) => (
  <div className="text-center p-10 text-red-500">Error: {message}</div>
);

export default function AdminDashboard() {
  const { getToken } = useAuth();

  const {
    data: products,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["adminAllProducts"],
    queryFn: () => fetchAllProductsForAdmin(getToken),
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorDisplay message={error.message} />;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 pt-24 text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Product Management</h1>
        <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
          Add New Product
        </button>
      </div>

      <div className="bg-[#100C16] rounded-lg shadow-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">
                Name
              </th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">
                Category
              </th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">
                Price
              </th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {products?.map((product) => (
              <tr key={product.id || product._id}>
                <td className="py-3 px-4 whitespace-nowrap">{product.name}</td>
                <td className="py-3 px-4 whitespace-nowrap capitalize">
                  {product.category}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  ${product.price.toFixed(2)}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <button className="text-blue-400 hover:text-blue-300 mr-4">
                    Edit
                  </button>
                  <button className="text-red-500 hover:text-red-400">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
