// src/pages/Home.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navabar from "../components/Navabar";
import ComponentCarousel from "../components/ComponentCarousel";
import useProductStore from "../stores/productStore";
import BuildCard from "../components/BuildCard";
import MiniBuildCard from "../components/MiniBuildCard";

// --- Reusable Icon Components (No changes here) ---
const AiIcon = () => (
  <svg
    className="w-6 h-6"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    {" "}
    <path d="M12.5,2.1C12.5,2.1,12.5,2.1,12.5,2.1C12.5,2.1,12.5,2.1,12.5,2.1C12.5,2.1,12.5,2.1,12.5,2.1c-2.3,0-4.5,0.8-6.3,2.2l-0.1,0.1c0,0-0.1,0.1-0.1,0.1c-0.1,0.1-0.1,0.1-0.2,0.2c0,0,0,0,0,0c-0.1,0.1-0.2,0.2-0.3,0.3c0,0,0,0,0,0c-0.1,0.1-0.2,0.2-0.2,0.3l0,0c-1.3,1.8-2,4-2,6.3c0,2.3,0.8,4.5,2.2,6.3l0.1,0.1c0,0,0.1,0.1,0.1,0.1c0.1,0.1,0.1,0.1,0.2,0.2c0,0,0,0,0,0c0.1-0.1,0.2-0.2,0.3-0.3c0,0,0,0,0,0c0.1-0.1,0.2-0.2,0.2-0.3l0,0c1.8,1.3,4,2,6.3,2c2.3,0,4.5-0.8,6.3-2.2l0.1-0.1c0,0,0.1-0.1,0.1-0.1c0.1-0.1,0.1-0.1,0.2-0.2c0,0,0,0,0,0c0.1-0.1,0.2-0.2,0.3-0.3c0,0,0,0,0,0c0.1-0.1,0.2-0.2,0.2-0.3l0,0C17,2.9,14.8,2.1,12.5,2.1z M12.5,3.9c1.9,0,3.8,0.7,5.3,2l-2,2c-0.8-0.6-1.8-1-2.8-1c-1.2,0-2.3,0.5-3.1,1.3L7,5.3C8.9,4.4,10.7,3.9,12.5,3.9z M19.4,12c-0.4-1.6-1.3-3-2.5-4.1l-2,2c0.4,0.6,0.7,1.2,0.8,1.9h-3.3V9.6h5.4c0.1,0.3,0.1,0.6,0.1,0.9c0,2.9-1.9,5.4-4.7,5.4c-1,0-1.9-0.3-2.7-0.8L8,17.5c1.1,0.9,2.5,1.4,4,1.4c1.9,0,3.8-0.7,5.3-2C18.6,15.6,19.2,13.9,19.4,12z M5.6,12c0.4,1.6,1.3,3,2.5,4.1l2-2c-0.4-0.6-0.7-1.2-0.8-1.9h3.3v2.3H7.1c-0.1-0.3-0.1-0.6-0.1-0.9c0-2.9,1.9-5.4,4.7-5.4c1,0,1.9,0.3,2.7,0.8l1.7-1.7c-1.1-0.9-2.5-1.4-4-1.4C7.8,5.1,6.1,6.5,5.6,8C5.2,9.2,5.1,10.6,5.6,12z" />{" "}
  </svg>
);
const ArrowRightIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    {" "}
    <path
      fillRule="evenodd"
      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
      clipRule="evenodd"
    />{" "}
  </svg>
);
const BuildIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    {" "}
    <path d="M22,7.24a1,1,0,0,0-.29-.71l-4.24-4.24a1,1,0,0,0-.71-.29H7.24a1,1,0,0,0-.71.29L2.29,6.53a1,1,0,0,0-.29.71V16.76a1,1,0,0,0,.29.71l4.24,4.24a1,1,0,0,0,.71.29h9.52a1,1,0,0,0,.71-.29l4.24-4.24a1,1,0,0,0,.29-.71V7.24ZM19.59,16.05l-3.54,3.54H7.95L4.41,16.05V7.95L7.95,4.41h8.1L19.59,7.95ZM9,12h2v2H9Zm4,0h2v2H13Zm-4-4h2v2H9Zm4,0h2v2H13Z" />{" "}
  </svg>
);
const UpgradeIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    {" "}
    <path d="M16,18V12h-3V10h3V4h2v6h3v2h-3v6Zm-8-4H2v2h6v5l6-5H8Z" />{" "}
  </svg>
);
// Reusable StarIcon component from BuildCard.jsx
function StarIcon({ color = "#F87171", size = 18 }) {
  return (
    <svg width={size} height={size} fill={color} viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.916c.969 0 1.371 1.24.588 1.81l-3.977 2.89a1 1 0 00-.364 1.118l1.519 4.674c.3.921-.755 1.688-1.539 1.118l-3.977-2.89a1 1 0 00-1.175 0l-3.977 2.89c-.783.57-1.838-.197-1.539-1.118l1.519-4.674a1 1 0 00-.364-1.118L2.048 10.1c-.783-.57-.38-1.81.588-1.81h4.916a1 1 0 00.95-.69l1.519-4.674z" />
    </svg>
  );
}

// --- Section Components ---

const HeroSection = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const spotlightRef = useRef(null);

  const handleAsk = () => {
    navigate("/chat", { state: { query } });
  };

  useEffect(() => {
    const textElement = spotlightRef.current;
    if (!textElement) return;

    const handleMouseMove = (e) => {
      const { left, top } = textElement.getBoundingClientRect();
      textElement.style.setProperty("--mouse-x", `${e.clientX - left}px`);
      textElement.style.setProperty("--mouse-y", `${e.clientY - top}px`);
    };

    const handleMouseEnter = () => {
      textElement.classList.add("spotlight-active");
    };

    const handleMouseLeave = () => {
      textElement.classList.remove("spotlight-active");
    };

    textElement.addEventListener("mousemove", handleMouseMove);
    textElement.addEventListener("mouseenter", handleMouseEnter);
    textElement.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      textElement.removeEventListener("mousemove", handleMouseMove);
      textElement.removeEventListener("mouseenter", handleMouseEnter);
      textElement.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div className="relative h-[880px] bg-black text-white overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
        poster="https://placehold.co/1920x1080/100C16/100C16?text=+"
      >
        <source src="/video.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/60 z-10"></div>

      <div
        ref={spotlightRef}
        data-text="AI POWERED"
        aria-hidden="true"
        className="hero-background-text"
      >
        <span>AI</span>
        <span>POWERED</span>
      </div>

      <div className="relative z-30">
        <h1 className="w-[792px] h-auto absolute top-[255px] left-[128px] text-7xl font-semibold text-white">
          Your Dream PC <br />
          with AI-Precision
        </h1>
        <p className="w-[651px] h-auto absolute top-[449px] left-[128px] text-xl font-light text-white">
          Let our AI assistant help you customize, optimize, and upgrade your
          perfect rig - whether you're gaming, creating, or working.
        </p>
        <div className="w-[620px] h-12 absolute top-[553px] left-[128px] flex items-center space-x-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            placeholder="Need help choosing parts? Ask our AI..."
            className="flex-grow h-full px-4 bg-white/20 border border-transparent rounded-md placeholder-white/80 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none backdrop-blur-sm"
          />
          <button
            onClick={handleAsk}
            className="w-24 h-full flex items-center justify-center gap-2 bg-[#6d28d9] hover:bg-purple-700 rounded-md font-semibold text-white transition-colors flex-shrink-0"
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
  <div className="relative px-8 md:px-24 py-16 bg-gradient-to-b from-[#100C16] to-[#1A1323] z-20">
    {" "}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {" "}
      <div className="group relative p-8 rounded-lg bg-[#1A1323] border border-gray-800/50 hover:border-purple-600/50 transition-all duration-300 overflow-hidden">
        {" "}
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-full bg-purple-600/20 rounded-full blur-3xl group-hover:bg-purple-600/30 transition-all duration-500"></div>{" "}
        <div className="relative z-10 flex flex-col justify-between h-[300px] space-y-8">
          {" "}
          <div>
            {" "}
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-100 mb-2">
              {" "}
              Build from Scratch with AI{" "}
            </h2>{" "}
            <p className="text-lg text-gray-300 max-w-md">
              {" "}
              Use our guided AI flow to design a PC tailored to your needs,
              performance, and budget.{" "}
            </p>{" "}
          </div>{" "}
          <Link
            to="/build"
            className="self-start flex items-center gap-3 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold text-white transition-colors"
          >
            {" "}
            <BuildIcon /> <span>Start Custom Build</span>{" "}
          </Link>{" "}
        </div>{" "}
      </div>{" "}
      <div className="group relative p-8 rounded-lg bg-[#1A1323] border border-gray-800/50 hover:border-purple-600/50 transition-all duration-300 overflow-hidden">
        {" "}
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-full bg-red-600/10 rounded-full blur-3xl group-hover:bg-red-600/20 transition-all duration-500"></div>{" "}
        <div className="relative z-10 flex flex-col justify-between h-[300px] space-y-8">
          {" "}
          <div>
            {" "}
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-100 mb-2">
              {" "}
              AI-Powered Upgrade{" "}
            </h2>{" "}
            <p className="text-lg text-gray-300 max-w-md">
              {" "}
              Get intelligent recommendations to upgrade your existing PC for
              better speed, graphics, or multitasking.{" "}
            </p>{" "}
          </div>{" "}
          <Link
            to="/upgrade"
            className="self-start flex items-center gap-3 px-6 py-3 bg-gray-800 border border-purple-700 hover:bg-gray-700 rounded-md font-semibold text-white transition-colors"
          >
            {" "}
            <UpgradeIcon /> <span>Upgrade My Rig</span>{" "}
          </Link>{" "}
        </div>{" "}
      </div>{" "}
    </div>{" "}
  </div>
);
const SectionWrapper = ({ title, viewAllLink, children, className = "" }) => (
  <section
    className={`relative px-8 md:px-24 py-16 bg-[#1A1323] border-t border-gray-800/50 z-20 ${className}`}
  >
    {" "}
    <div className="flex justify-between items-center mb-8">
      {" "}
      <h2 className="text-3xl md:text-4xl font-semibold text-white">
        {title}
      </h2>{" "}
      {viewAllLink && (
        <Link
          to={viewAllLink}
          className="flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium transition-colors"
        >
          {" "}
          <span>View All</span> <ArrowRightIcon />{" "}
        </Link>
      )}{" "}
    </div>{" "}
    {children}{" "}
  </section>
);

// Main Home Page Component
export default function Home() {
  const { prebuilds, isPrebuildsLoading, prebuildsError, fetchPrebuilds } =
    useProductStore();

  useEffect(() => {
    fetchPrebuilds();
  }, [fetchPrebuilds]);

  // Find the specific prebuilt for the "Top AI Pick"
  // Assuming "Gaming Beast Pro" (id: prebuilt-001) is the top pick based on image
  const topAIPick = prebuilds.find((p) => p.id === "prebuilt-001");

  const PrebuiltPCsContent = () => {
    if (isPrebuildsLoading) {
      return (
        <div className="h-96 bg-[#100C16] rounded-lg flex items-center justify-center text-gray-500">
          Loading Prebuilt PCs...
        </div>
      );
    }

    if (prebuildsError) {
      return (
        <div className="h-96 bg-[#100C16] rounded-lg flex items-center justify-center text-red-500">
          Error loading prebuilt PCs: {prebuildsError}
        </div>
      );
    }

    if (prebuilds.length === 0) {
      return (
        <div className="h-96 bg-[#100C16] rounded-lg flex items-center justify-center text-gray-500">
          No Prebuilt PCs available at the moment.
        </div>
      );
    }

    // Filter out the topAIPick from the main list of prebuilds to avoid duplication
    // And get the next 4 for the side cards
    const otherPrebuilds = prebuilds.filter((p) => p.id !== "prebuilt-001");
    const sidePrebuilds = otherPrebuilds.slice(0, 4); // Take the first 4 for the side

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Section: Top AI Pick */}
        {topAIPick && (
          <div className="lg:col-span-2 relative bg-[#1A1323] rounded-lg p-6 border border-gray-800/50 flex flex-col md:flex-row items-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-purple-900/10 blur-3xl opacity-50 z-0"></div>
            <div className="relative z-10 md:w-2/3">
              {" "}
              {/* Image Container */}
              <img
                src={topAIPick.imageUrl}
                alt={topAIPick.name}
                className="w-full h-auto object-contain rounded-lg"
              />
            </div>
            <div className="relative z-10 md:w-1/3 p-4 flex flex-col justify-between">
              {" "}
              {/* Text Content */}
              <div>
                <p className="text-purple-400 font-semibold mb-2">
                  🔥 Top AI Pick: Performance Meets Value
                </p>
                <h3 className="text-3xl font-bold text-white mb-2">
                  {topAIPick.name}
                </h3>
                <p className="text-gray-300 text-base mb-4">
                  {topAIPick.description}
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl font-bold text-green-400">
                    ₹{topAIPick.price?.toLocaleString("en-IN")}
                  </span>
                  <span className="flex items-center gap-1 text-lg font-bold text-[#C46A6A]">
                    {typeof topAIPick.rating === "object"
                      ? (topAIPick.rating.rate || 0).toFixed(1)
                      : (topAIPick.rating || 0).toFixed(1)}
                    <StarIcon size={18} />
                  </span>
                </div>
              </div>
              <Link
                to={`/builds/${topAIPick.id}`}
                className="self-start flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold text-white transition-colors no-underline"
              >
                View Build <ArrowRightIcon />
              </Link>
            </div>
          </div>
        )}

        {/* Right Section: Mini Build Cards */}
        <div className="lg:col-span-1 grid grid-cols-1 gap-6">
          {sidePrebuilds.map((build) => (
            <MiniBuildCard key={build.id} build={build} />
          ))}
        </div>

        {/* Optional: You can add another section below these two if you want to show
            more prebuilt cards using the BuildCard component for `otherPrebuilds` */}
        {/*
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {otherPrebuilds.map((prebuilt) => (
            <BuildCard key={prebuilt.id} build={prebuilt} />
          ))}
        </div>
        */}
      </div>
    );
  };

  return (
    <div className="bg-[#100C16]">
      <Navabar />
      <main>
        <HeroSection />
        <ActionCardsSection />

        <SectionWrapper title="Prebuilt PCs" viewAllLink="/builds">
          <PrebuiltPCsContent />
        </SectionWrapper>
        <SectionWrapper
          title="Explore High-Performance Components"
          viewAllLink="/spec"
        >
          <ComponentCarousel />
        </SectionWrapper>

        {/* Compare PC Builds Like a Pro Section */}
        <section className="relative px-8 md:px-24 py-16 bg-[#1A1323] border-t border-gray-800/50 z-20 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side: Image Placeholder with curved effect */}
            <div className="relative flex justify-center lg:justify-start">
              <img
                src="comparepic.png" // This is your placeholder image path
                alt="Compare PC Builds"
                className="w-full max-w-lg h-auto object-contain rounded-3xl md:rounded-[48px] shadow-2xl transform rotate-3 scale-95 transition-transform duration-500 hover:rotate-0 hover:scale-100"
              />
            </div>

            {/* Right side: Text content and button */}
            <div className="text-center lg:text-left">
              <p className="text-purple-400 font-semibold mb-2 text-lg">
                Compare specs
              </p>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Compare PC Builds Like a Pro
              </h2>
              <p className="text-lg text-gray-300 max-w-xl lg:max-w-none mx-auto lg:mx-0 mb-8">
                Discover the most optimized builds shared by our community.
                Compare performance, compatibility, and pricing side-by-side to
                make smarter rig decisions.
              </p>
              <Link
                to="/spec?category=cpu&origin=/build"
                className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold text-white transition-colors shadow-lg"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 zm-1 15h-1V7h1v10zm3 0h-1V7h1v10z" />
                </svg>
                <span>Compare Builds Now</span>
              </Link>
            </div>
          </div>
        </section>
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
