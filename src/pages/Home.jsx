// src/pages/Home.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navabar from "../components/Navabar";
import ComponentCarousel from "../components/ComponentCarousel";

// --- Reusable Icon Components ---
const AiIcon = () => (
  <svg
    className="w-6 h-6"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12.5,2.1C12.5,2.1,12.5,2.1,12.5,2.1C12.5,2.1,12.5,2.1,12.5,2.1C12.5,2.1,12.5,2.1,12.5,2.1c-2.3,0-4.5,0.8-6.3,2.2l-0.1,0.1c0,0-0.1,0.1-0.1,0.1c-0.1,0.1-0.1,0.1-0.2,0.2c0,0,0,0,0,0c-0.1,0.1-0.2,0.2-0.3,0.3c0,0,0,0,0,0c-0.1,0.1-0.2,0.2-0.2,0.3l0,0c-1.3,1.8-2,4-2,6.3c0,2.3,0.8,4.5,2.2,6.3l0.1,0.1c0,0,0.1,0.1,0.1,0.1c0.1,0.1,0.1,0.1,0.2,0.2c0,0,0,0,0,0c0.1-0.1,0.2-0.2,0.3-0.3c0,0,0,0,0,0c0.1-0.1,0.2-0.2,0.2-0.3l0,0c1.8,1.3,4,2,6.3,2c2.3,0,4.5-0.8,6.3-2.2l0.1-0.1c0,0,0.1-0.1,0.1-0.1c0.1-0.1,0.1-0.1,0.2-0.2c0,0,0,0,0,0c0.1-0.1,0.2-0.2,0.3-0.3c0,0,0,0,0,0c0.1-0.1,0.2-0.2,0.2-0.3l0,0c1.3-1.8,2-4,2-6.3c0-2.3-0.8-4.5-2.2-6.3l-0.1-0.1c0,0-0.1-0.1-0.1-0.1c-0.1-0.1-0.1-0.1-0.2-0.2c0,0,0,0,0,0c-0.1-0.1-0.2-0.2-0.3-0.3c0,0,0,0,0,0c-0.1-0.1-0.2-0.2-0.2-0.3l0,0C17,2.9,14.8,2.1,12.5,2.1z M12.5,3.9c1.9,0,3.8,0.7,5.3,2l-2,2c-0.8-0.6-1.8-1-2.8-1c-1.2,0-2.3,0.5-3.1,1.3L7,5.3C8.9,4.4,10.7,3.9,12.5,3.9z M19.4,12c-0.4-1.6-1.3-3-2.5-4.1l-2,2c0.4,0.6,0.7,1.2,0.8,1.9h-3.3V9.6h5.4c0.1,0.3,0.1,0.6,0.1,0.9c0,2.9-1.9,5.4-4.7,5.4c-1,0-1.9-0.3-2.7-0.8L8,17.5c1.1,0.9,2.5,1.4,4,1.4c1.9,0,3.8-0.7,5.3-2C18.6,15.6,19.2,13.9,19.4,12z M5.6,12c0.4,1.6,1.3,3,2.5,4.1l2-2c-0.4-0.6-0.7-1.2-0.8-1.9h3.3v2.3H7.1c-0.1-0.3-0.1-0.6-0.1-0.9c0-2.9,1.9-5.4,4.7-5.4c1,0,1.9,0.3,2.7,0.8l1.7-1.7c-1.1-0.9-2.5-1.4-4-1.4C7.8,5.1,6.1,6.5,5.6,8C5.2,9.2,5.1,10.6,5.6,12z" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);
const BuildIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M22,7.24a1,1,0,0,0-.29-.71l-4.24-4.24a1,1,0,0,0-.71-.29H7.24a1,1,0,0,0-.71.29L2.29,6.53a1,1,0,0,0-.29.71V16.76a1,1,0,0,0,.29.71l4.24,4.24a1,1,0,0,0,.71.29h9.52a1,1,0,0,0,.71-.29l4.24-4.24a1,1,0,0,0,.29-.71V7.24ZM19.59,16.05l-3.54,3.54H7.95L4.41,16.05V7.95L7.95,4.41h8.1L19.59,7.95ZM9,12h2v2H9Zm4,0h2v2H13Zm-4-4h2v2H9Zm4,0h2v2H13Z" />
  </svg>
);
const UpgradeIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M16,18V12h-3V10h3V4h2v6h3v2h-3v6Zm-8-4H2v2h6v5l6-5H8Z" />
  </svg>
);

// --- Section Components ---

const HeroSection = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const handleAsk = () => {
    navigate("/chat", {
      state: { initialQuery: query || "Provide me a basic build" },
    });
  };
  return (
    <div className="relative h-[880px] bg-black text-white flex items-center overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-1/2 left-1/2 w-full h-full object-cover -translate-x-1/2 -translate-y-1/2 z-0"
        poster="https://placehold.co/1440x880/100C16/100C16?text=+"
      >
        {/* Replace with your actual video file URL */}
        <source
          src="https://path-to-your/background-video.mp4"
          type="video/mp4"
        />
      </video>
      <div className="absolute inset-0 bg-black/60 z-10"></div>
      <div className="absolute inset-0 z-20 flex items-center justify-end pointer-events-none overflow-hidden">
        <div className="relative w-1/2 h-full">
          <div className="absolute font-bold text-purple-900/40 text-[10rem] lg:text-[160px] leading-none -translate-x-1/4 translate-y-1/4 select-none whitespace-nowrap">
            AI
            <br />
            POWERED
          </div>
          <div className="absolute left-0 top-1/4 w-72 h-72 bg-purple-600 rounded-full blur-3xl opacity-40 animate-pulse"></div>
        </div>
      </div>
      <div className="relative z-30 px-8 md:px-24 max-w-4xl space-y-6">
        <h1 className="text-6xl md:text-7xl font-semibold leading-tight tracking-tight">
          Your Dream PC <br />
          with AI-Precision
        </h1>
        <p className="text-xl md:text-2xl font-light text-gray-300 max-w-2xl">
          Let our AI assistant help you customize, optimize, and upgrade your
          perfect rig - whether you're gaming, creating, or working.
        </p>
        <div className="flex items-center space-x-4 pt-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            placeholder="Need help choosing parts? Ask our AI..."
            className="flex-grow px-4 py-3 bg-[#1A1323]/80 border border-purple-800 rounded-md placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none backdrop-blur-sm"
          />
          <button
            onClick={handleAsk}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold transition-colors flex-shrink-0"
          >
            <AiIcon />
            <span>Ask</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const ActionCardsSection = () => (
  <div className="px-8 md:px-24 py-16 bg-gradient-to-b from-[#100C16] to-[#1A1323]">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="group relative p-8 rounded-lg bg-[#1A1323] border border-gray-800/50 hover:border-purple-600/50 transition-all duration-300 overflow-hidden">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-full bg-purple-600/20 rounded-full blur-3xl group-hover:bg-purple-600/30 transition-all duration-500"></div>
        <div className="relative z-10 flex flex-col justify-between h-[300px] space-y-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-100 mb-2">
              Build from Scratch with AI
            </h2>
            <p className="text-lg text-gray-300 max-w-md">
              Use our guided AI flow to design a PC tailored to your needs,
              performance, and budget.
            </p>
          </div>
          <Link
            to="/build"
            className="self-start flex items-center gap-3 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold text-white transition-colors"
          >
            <BuildIcon />
            <span>Start Custom Build</span>
          </Link>
        </div>
      </div>
      <div className="group relative p-8 rounded-lg bg-[#1A1323] border border-gray-800/50 hover:border-purple-600/50 transition-all duration-300 overflow-hidden">
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-full bg-red-600/10 rounded-full blur-3xl group-hover:bg-red-600/20 transition-all duration-500"></div>
        <div className="relative z-10 flex flex-col justify-between h-[300px] space-y-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-100 mb-2">
              AI-Powered Upgrade
            </h2>
            <p className="text-lg text-gray-300 max-w-md">
              Get intelligent recommendations to upgrade your existing PC for
              better speed, graphics, or multitasking.
            </p>
          </div>
          <Link
            to="/upgrade"
            className="self-start flex items-center gap-3 px-6 py-3 bg-gray-800 border border-purple-700 hover:bg-gray-700 rounded-md font-semibold text-white transition-colors"
          >
            <UpgradeIcon />
            <span>Upgrade My Rig</span>
          </Link>
        </div>
      </div>
    </div>
  </div>
);

const SectionWrapper = ({ title, viewAllLink, children, className = "" }) => (
  <section
    className={`px-8 md:px-24 py-16 bg-[#1A1323] border-t border-gray-800/50 ${className}`}
  >
    <div className="flex justify-between items-center mb-8">
      <h2 className="text-3xl md:text-4xl font-semibold text-white">{title}</h2>
      {viewAllLink && (
        <Link
          to={viewAllLink}
          className="flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium transition-colors"
        >
          <span>View All</span>
          <ArrowRightIcon />
        </Link>
      )}
    </div>
    {children}
  </section>
);

// Main Home Page Component
export default function Home() {
  return (
    <div className="bg-[#100C16]">
      <Navabar />
      <main>
        <HeroSection />
        <ActionCardsSection />
        <SectionWrapper title="Prebuilt PCs" viewAllLink="/builds">
          <div className="h-96 bg-[#100C16] rounded-lg flex items-center justify-center text-gray-500">
            Placeholder for Prebuilt PCs section.
          </div>
        </SectionWrapper>
        <SectionWrapper
          title="Explore High-Performance Components"
          viewAllLink="/spec"
        >
          <ComponentCarousel />
        </SectionWrapper>
        <SectionWrapper
          title="Compare PC Builds Like a Pro"
          viewAllLink="/compare"
        >
          <div className="h-64 bg-[#100C16] rounded-lg flex items-center justify-center text-gray-500">
            Placeholder for Compare Builds section.
          </div>
        </SectionWrapper>
        <SectionWrapper
          title="From Our Smartest PC Builds by Our Users"
          viewAllLink="/feeds"
        >
          <div className="h-64 bg-[#100C16] rounded-lg flex items-center justify-center text-gray-500">
            Placeholder for User Builds section.
          </div>
        </SectionWrapper>
      </main>
      <footer className="px-8 md:px-24 py-16 bg-[#100C16] border-t border-gray-800/50">
        <div className="text-center text-gray-400">
          <p className="text-lg">Powering Personalized PCs, the Smarter Way</p>
          <p className="text-sm mt-2">
            &copy; {new Date().getFullYear()} AI PC Builder. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
