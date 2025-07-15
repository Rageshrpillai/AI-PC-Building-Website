// src/pages/AdminUsersPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react"; // Import useAuth to get the token
import { fetchAllUsers } from "../services/apiService"; // Import the fetchAllUsers function

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { getToken } = useAuth(); // Get the getToken function from Clerk's useAuth hook

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleGoBack = () => {
    navigate("/admin/dashboard"); // Navigate back to the admin dashboard
  };

  // Function to fetch users from the backend
  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllUsers(getToken); // Pass getToken to fetchAllUsers
      setUsers(data); // Assuming data is the array of users
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch users when the component mounts
  useEffect(() => {
    loadUsers();
  }, []); // Empty dependency array means this runs once on mount

  if (loading) {
    return (
      <div className="min-h-screen bg-[#100C16] flex justify-center items-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-xl ml-4">Loading Users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#100C16] flex flex-col justify-center items-center text-white p-4">
        <p className="text-red-500 text-xl mb-4">{error}</p>
        <button
          onClick={loadUsers} // Allow retrying the fetch
          className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200"
        >
          Retry
        </button>
        <button
          onClick={handleGoBack}
          className="mt-4 px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors duration-200"
        >
          Go Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#100C16] text-white">
      <div className="container mx-auto px-6 py-8 pt-12">
        <h1 className="text-4xl font-bold mb-8 text-purple-400">
          Manage Users
        </h1>

        <button
          onClick={handleGoBack}
          className="mb-6 px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors duration-200"
        >
          &larr; Go Back to Dashboard
        </button>

        <div className="bg-[#20182C] p-8 rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold mb-6 text-purple-300">
            All Registered Users
          </h2>

          {users.length === 0 ? (
            <p className="text-gray-400 text-center py-10">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-[#1A1326] rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-purple-800 text-left text-sm uppercase tracking-wider">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-700 hover:bg-[#2C243B]"
                    >
                      <td className="py-3 px-4 text-sm">{user.id}</td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="py-3 px-4 capitalize">{user.role}</td>
                      <td className="py-3 px-4 flex space-x-2">
                        <button className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                          Edit Role
                        </button>
                        <button className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
