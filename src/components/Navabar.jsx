// src/components/Navabar.jsx
import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/clerk-react";
import logo from "../assets/logo.png";

const NAV_LINKS_CONFIG = [
  { name: "Home", to: "/" },
  { name: "Specs", to: "/spec" },
  { name: "Builds", to: "/builds" },
  { name: "Chatbot", to: "/chat" },
];

export default function Navabar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  // useNavigate is no longer needed here, but can be kept if other components use it
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const getLinkClassName = ({ isActive }) => {
    const base =
      "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out";
    const isDarkBg = isScrolled || location.pathname !== "/";
    if (isActive) {
      return `${base} text-purple-300 font-semibold`;
    }
    return `${base} ${
      isDarkBg
        ? "text-gray-300 hover:text-white"
        : "text-gray-400 hover:text-white"
    }`;
  };

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

      <div className="flex items-center gap-4">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="text-sm font-medium rounded-md transition-colors bg-purple-600 hover:bg-purple-700 text-white px-4 py-2">
              Sign Up
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          {/* --- NEW "MY BUILDS" BUTTON --- */}
          <NavLink
            to="/my-builds"
            className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            My Builds
          </NavLink>
          {/* --- DEFAULT USERBUTTON (NO CUSTOM MENU) --- */}
          <UserButton signOutOptions={{ redirectUrl: "/" }} />
        </SignedIn>
      </div>
    </nav>
  );
}
