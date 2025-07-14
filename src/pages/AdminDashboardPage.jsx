// src/pages/AdminDashboardPage.jsx
import React from "react";
import Navabar from "../components/Navabar"; // Assuming you want your regular navbar

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-[#100C16] text-white">
      <Navabar /> {/* Or a dedicated admin navbar */}
      <div className="container mx-auto px-6 py-8 pt-24">
        <h1 className="text-4xl font-bold mb-8 text-purple-400">
          Admin Dashboard
        </h1>
        <p className="text-lg text-gray-300">Welcome, Administrator!</p>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Add your admin widgets and links here */}
          <div className="bg-[#20182C] p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-3">Manage Products</h2>
            <p className="text-gray-400">Add, edit, or delete PC components.</p>
            <button className="mt-4 px-4 py-2 bg-purple-600 rounded-md hover:bg-purple-700">
              Go to Products
            </button>
          </div>
          <div className="bg-[#20182C] p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-3">Manage Prebuilt PCs</h2>
            <p className="text-gray-400">
              Oversee official prebuilt configurations.
            </p>
            <button className="mt-4 px-4 py-2 bg-purple-600 rounded-md hover:bg-purple-700">
              Go to Prebuilts
            </button>
          </div>
          <div className="bg-[#20182C] p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-3">User Management</h2>
            <p className="text-gray-400">View and manage user accounts.</p>
            <button className="mt-4 px-4 py-2 bg-purple-600 rounded-md hover:bg-purple-700">
              Go to Users
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
