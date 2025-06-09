// src/components/Sidebar.jsx
import React from "react";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";

// --- Import your icon assets ---
import collapse from "../assets/sidebar/collapse.svg";
import backbutton from "../assets/sidebar/backbutton.svg";
import Rigworld from "../assets/sidebar/rigworld.svg";
import ai from "../assets/sidebar/ai.svg";
import market from "../assets/sidebar/market.svg";
import seller from "../assets/sidebar/sellerchat.svg";
import game from "../assets/sidebar/game.svg";
import bookmark from "../assets/sidebar/bookmark.svg";

// --- Links Configuration ---
const Navigationlinks = [
  { name: "Rig world", to: "/", imagee: Rigworld },
  { name: "AI chat", to: "/chat", imagee: ai },
  { name: "Market", to: "/market", imagee: market },
  { name: "Seller chat", to: "/Seller", imagee: seller },
  { name: "Game", to: "/game", imagee: game },
  { name: "Bookmark", to: "/Bookmark", imagee: bookmark },
];

// --- MODIFICATION: Accept `isOpen` and `onToggle` as props ---
const Sidebar = ({ isOpen, onToggle }) => {
  // --- REMOVED: Internal state `useState` is no longer needed here. ---

  return (
    <div className="transition-all duration-300">
      {/* --- MODIFICATION: Animation now driven by the `isOpen` prop --- */}
      <motion.div
        initial={false} // Prevent initial animation on page load
        animate={{ width: isOpen ? 207 : 68 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="bg-[#100C16] h-full text-white px-4 flex flex-col gap-6 overflow-hidden"
      >
        {/* --- MODIFICATION: Button now calls the `onToggle` prop --- */}
        <button
          onClick={onToggle}
          className="flex items-center justify-between w-full pt-4" // Added some top padding
        >
          {/* --- MODIFICATION: Visibility now driven by `isOpen` prop --- */}
          <span
            className={`whitespace-nowrap overflow-hidden text-[#8063AB] transition-[opacity,margin] duration-300 ${
              isOpen ? "opacity-100 mr-2" : "opacity-0 mr-0"
            }`}
          >
            Feeds
          </span>

          {/* --- MODIFICATION: Icon now driven by `isOpen` prop --- */}
          <img
            src={isOpen ? backbutton : collapse}
            alt="toggle sidebar"
            className="transition-transform duration-300"
          />
        </button>

        {/* Navigation links remain the same, but their label visibility depends on the `isOpen` prop */}
        <nav className="flex flex-col flex-1 gap-2">
          {Navigationlinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex items-center h-12 gap-3"
            >
              <img src={item.imagee} alt={item.name} />
              <span
                className={`whitespace-nowrap text-[#999999] hover:text-white overflow-hidden transition-[opacity,margin] duration-300 ${
                  isOpen ? "opacity-100 ml-2" : "opacity-0 ml-0"
                }`}
              >
                {item.name}
              </span>
            </NavLink>
          ))}
        </nav>
      </motion.div>
    </div>
  );
};

export default Sidebar;
