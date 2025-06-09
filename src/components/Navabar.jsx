// src/components/Navabar.jsx
import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

// Assuming your logo and specsIcon are in src/assets/ as per your project structure
import logo from "../assets/logo.png";
import specsIcon from "../assets/icons.png";

const NAV_LINKS_CONFIG = [
  { name: "Home", to: "/" },
  { name: "Specs", to: "/spec" }, // Should match your route for SpecsListPage
  { name: "Builds", to: "/build" }, // Placeholder
  { name: "Chatbot", to: "/chat" }, // Placeholder
];

export default function Navabar() {
  // Consider renaming to Navbar for convention
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const getLinkClassName = ({ isActive }) => {
    const base =
      "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out";
    const isDarkBg = isScrolled || location.pathname !== "/";

    if (isActive) {
      // Make active links more prominent, especially on dark backgrounds
      return `${base} ${
        isDarkBg ? "text-purple-300 font-semibold" : "text-white font-semibold"
      }`;
    }
    return `${base} ${
      isDarkBg
        ? "text-gray-300 hover:text-white"
        : "text-gray-400 hover:text-white"
    }`;
  };

  const isSpecsButtonActive = location.pathname === "/spec";

  return (
    <nav
      className={`
        fixed top-0 left-0 w-full z-50 h-16 flex items-center justify-between
        px-4 sm:px-6 lg:px-8
        transition-all duration-300 ease-in-out
        ${
          isScrolled || location.pathname !== "/"
            ? "bg-[#100C16] shadow-md text-gray-200"
            : "bg-transparent text-gray-300"
        }
      `}
    >
      <NavLink to="/" className="flex-shrink-0">
        <img src={logo} alt="Site Logo" className="h-8 w-auto" />
      </NavLink>

      <div className="hidden md:flex flex-grow items-center justify-center space-x-4 lg:space-x-6">
        {NAV_LINKS_CONFIG.map((link) => (
          <NavLink key={link.name} to={link.to} className={getLinkClassName}>
            {link.name}
          </NavLink>
        ))}
      </div>

      <button
        onClick={() => navigate("/spec")}
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 
          text-xs sm:text-sm font-semibold rounded-md transition-colors duration-150 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#100C16]
          ${
            isSpecsButtonActive
              ? "bg-[#7907E5] text-white"
              : "bg-purple-600 hover:bg-purple-700 text-white"
          }
        `}
      >
        <img src={specsIcon} alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
        <span>Specs</span>
      </button>
    </nav>
  );
}
