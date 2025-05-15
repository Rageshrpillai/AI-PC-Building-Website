import React from "react";
import heroImg from "../assets/image.png"; // <-- swap in your actual image or SVG

export default function Hero() {
  return (
    <div className="flex flex-col  bg-gray-900  md:flex-row ">
      {/* Left: image with dark overlay */}
      <div className="relative w-[603px] flex-1 ">
        <img
          src={heroImg}
          alt="PC build"
          className=" w-[603px] h-full object-cover"
        />
      </div>

      {/* Right: headline, subhead, input + buttons */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 bg-gray-900 space-y-6">
        <h1 className="text-5xl font-bold text-white">
          Build your perfect PC with AI
        </h1>
        <p className="text-xl text-gray-300">
          Smart custom builds, upgrade and prebuilt gigs
        </p>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="I need a gaming PC under $1000..."
            className="flex-grow px-4 py-3 rounded-l-md bg-gray-800 text-white placeholder-gray-500 focus:outline-none"
          />
          <button className="px-4 py-3 bg-purple-600 text-white rounded-r-md font-medium hover:bg-purple-700">
            Ask
          </button>
          <button className="p-3 bg-gray-800 text-white rounded-md hover:bg-gray-700"></button>
        </div>
      </div>
    </div>
  );
}
